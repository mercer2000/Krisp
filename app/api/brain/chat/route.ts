import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  brainChatSessions,
  brainChatMessages,
  webhookKeyPoints,
  emails,
  decisions,
  actionItems,
} from "@/lib/db/schema";
import { eq, desc, and, isNull } from "drizzle-orm";
import { chatCompletion, TokenLimitError } from "@/lib/ai/client";
import { classifyIntent } from "@/lib/brain/intentParser";
import {
  getUserBoardContext,
  executeCreateCard,
  executeMoveCard,
  executeUpdateCard,
  executeArchiveCard,
  executeConfirmedArchive,
  executeRestoreCard,
  executeQueryCards,
  storePendingAction,
} from "@/lib/brain/kanbanActions";
import type {
  PendingAction,
  CreateCardData,
  MoveCardData,
  UpdateCardData,
  ArchiveCardData,
  RestoreCardData,
  QueryCardsData,
  ConfirmActionData,
  ClarifyData,
} from "@/lib/brain/types";

const MAX_CONTEXT_MEETINGS = 5;
const MAX_CONTEXT_EMAILS = 8;
const MAX_CONTEXT_DECISIONS = 10;
const MAX_CONTEXT_ACTION_ITEMS = 10;
const MAX_HISTORY_MESSAGES = 50;
const PENDING_ACTION_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

/**
 * POST /api/brain/chat
 * Send a message to the Brain AI assistant.
 * Body: { message: string, sessionId?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { message, sessionId } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Get or create session
    let activeSessionId = sessionId;
    if (!activeSessionId) {
      // Create a new session
      const title =
        message.length > 60 ? message.slice(0, 57) + "..." : message;
      const [newSession] = await db
        .insert(brainChatSessions)
        .values({ userId, title })
        .returning();
      activeSessionId = newSession.id;
    }

    // Save the user message
    await db.insert(brainChatMessages).values({
      sessionId: activeSessionId,
      role: "user",
      content: message.trim(),
    });

    // Fetch conversation history for context (most recent first, then reverse for chronological order)
    const historyDesc = await db
      .select({ role: brainChatMessages.role, content: brainChatMessages.content })
      .from(brainChatMessages)
      .where(eq(brainChatMessages.sessionId, activeSessionId))
      .orderBy(desc(brainChatMessages.createdAt))
      .limit(MAX_HISTORY_MESSAGES);
    const history = historyDesc.reverse();

    // ── Intent Classification ───────────────────────────
    const boardContext = await getUserBoardContext(userId);

    // Read pending action from session
    let pendingAction: PendingAction | null = null;
    if (sessionId) {
      const sess = await db.query.brainChatSessions.findFirst({
        where: eq(brainChatSessions.id, activeSessionId),
        columns: { pendingAction: true },
      });
      if (sess?.pendingAction) {
        const pa = sess.pendingAction as PendingAction;
        // Expire stale pending actions
        if (
          Date.now() - new Date(pa.createdAt).getTime() <
          PENDING_ACTION_EXPIRY_MS
        ) {
          pendingAction = pa;
        } else {
          // Clear expired
          await storePendingAction(activeSessionId, null);
        }
      }
    }

    const intent = await classifyIntent(
      message.trim(),
      boardContext,
      history.slice(0, -1).map((m) => ({
        role: m.role,
        content: m.content,
      })),
      pendingAction
    );

    let answer: string;
    let sourcesUsed: string[];

    // ── Route by intent type ────────────────────────────
    switch (intent.type) {
      case "create_card": {
        const data = intent.data as CreateCardData;
        const result = await executeCreateCard(userId, data, boardContext);
        answer = result.message;
        sourcesUsed = ["kanban"];
        break;
      }

      case "move_card": {
        const data = intent.data as MoveCardData;
        const result = await executeMoveCard(userId, data, boardContext);
        answer = result.message;
        sourcesUsed = ["kanban"];
        break;
      }

      case "update_card": {
        const data = intent.data as UpdateCardData;
        const result = await executeUpdateCard(userId, data);
        answer = result.message;
        sourcesUsed = ["kanban"];
        break;
      }

      case "archive_card": {
        const data = intent.data as ArchiveCardData;
        const result = await executeArchiveCard(userId, data);
        answer = result.message;
        sourcesUsed = ["kanban"];
        // Store pending action for confirmation
        if (result.needsConfirmation && result.pendingAction) {
          await storePendingAction(activeSessionId, result.pendingAction);
        }
        break;
      }

      case "confirm_action": {
        const data = intent.data as ConfirmActionData;
        if (pendingAction && data.confirmed) {
          const result = await executeConfirmedArchive(userId, pendingAction);
          answer = result.message;
        } else if (pendingAction && !data.confirmed) {
          answer = `Cancelled. **"${pendingAction.cardTitle}"** was not deleted.`;
        } else {
          answer =
            "There's nothing pending to confirm. What would you like to do?";
        }
        // Clear pending action either way
        await storePendingAction(activeSessionId, null);
        sourcesUsed = ["kanban"];
        break;
      }

      case "restore_card": {
        const data = intent.data as RestoreCardData;
        const result = await executeRestoreCard(userId, data);
        answer = result.message;
        sourcesUsed = ["kanban"];
        break;
      }

      case "query_cards": {
        const data = intent.data as QueryCardsData;
        const result = await executeQueryCards(userId, data, boardContext);
        answer = result.message;
        sourcesUsed = ["kanban"];
        break;
      }

      case "clarify": {
        const data = intent.data as ClarifyData;
        answer =
          data.message || "Could you clarify what you'd like me to do?";
        sourcesUsed = [];
        break;
      }

      case "brain_query":
      default: {
        // ── Existing brain query flow (unchanged) ─────────
        const brainResult = await handleBrainQuery(
          userId,
          message.trim(),
          history
        );
        answer = brainResult.answer;
        sourcesUsed = brainResult.sourcesUsed;
        break;
      }
    }

    // Save the assistant response
    const [assistantMsg] = await db
      .insert(brainChatMessages)
      .values({
        sessionId: activeSessionId,
        role: "assistant",
        content: answer,
        sourcesUsed,
      })
      .returning();

    // Update session timestamp
    await db
      .update(brainChatSessions)
      .set({ updatedAt: new Date() })
      .where(eq(brainChatSessions.id, activeSessionId));

    return NextResponse.json({
      sessionId: activeSessionId,
      message: {
        id: assistantMsg.id,
        role: "assistant",
        content: answer,
        sourcesUsed,
        createdAt: assistantMsg.createdAt,
      },
    });
  } catch (error) {
    console.error("Brain chat error:", error);
    if (error instanceof TokenLimitError) {
      return NextResponse.json(
        {
          error: "token_limit",
          message: "AI credit limit reached. The administrator needs to check the OpenRouter API key limits.",
        },
        { status: 402 }
      );
    }
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}

// ── Brain Query Handler (extracted from original flow) ──

async function handleBrainQuery(
  userId: string,
  message: string,
  history: Array<{ role: string; content: string }>
): Promise<{ answer: string; sourcesUsed: string[] }> {
  const [meetings, userEmails, userDecisions, userActionItems] =
    await Promise.all([
      db
        .select({
          id: webhookKeyPoints.id,
          meetingTitle: webhookKeyPoints.meetingTitle,
          meetingStartDate: webhookKeyPoints.meetingStartDate,
          content: webhookKeyPoints.content,
          rawContent: webhookKeyPoints.rawContent,
          speakers: webhookKeyPoints.speakers,
        })
        .from(webhookKeyPoints)
        .where(
          and(
            eq(webhookKeyPoints.userId, userId),
            isNull(webhookKeyPoints.deletedAt)
          )
        )
        .orderBy(desc(webhookKeyPoints.meetingStartDate))
        .limit(MAX_CONTEXT_MEETINGS),

      db
        .select({
          id: emails.id,
          subject: emails.subject,
          sender: emails.sender,
          bodyPlainText: emails.bodyPlainText,
          receivedAt: emails.receivedAt,
        })
        .from(emails)
        .where(
          and(eq(emails.tenantId, userId), isNull(emails.deletedAt))
        )
        .orderBy(desc(emails.receivedAt))
        .limit(MAX_CONTEXT_EMAILS),

      db
        .select({
          id: decisions.id,
          statement: decisions.statement,
          context: decisions.context,
          rationale: decisions.rationale,
          category: decisions.category,
          status: decisions.status,
          createdAt: decisions.createdAt,
        })
        .from(decisions)
        .where(
          and(eq(decisions.userId, userId), isNull(decisions.deletedAt))
        )
        .orderBy(desc(decisions.createdAt))
        .limit(MAX_CONTEXT_DECISIONS),

      db
        .select({
          id: actionItems.id,
          title: actionItems.title,
          description: actionItems.description,
          status: actionItems.status,
          priority: actionItems.priority,
          dueDate: actionItems.dueDate,
          assignee: actionItems.assignee,
        })
        .from(actionItems)
        .where(
          and(
            eq(actionItems.userId, userId),
            isNull(actionItems.deletedAt)
          )
        )
        .orderBy(desc(actionItems.createdAt))
        .limit(MAX_CONTEXT_ACTION_ITEMS),
    ]);

  // Build context string
  const contextParts: string[] = [];
  const sourcesUsed: string[] = [];

  if (meetings.length > 0) {
    sourcesUsed.push("meetings");
    const meetingCtx = meetings
      .map((m, i) => {
        const keyPoints = Array.isArray(m.content)
          ? (m.content as Array<{ description?: string; text?: string }>)
              .map((kp) => kp.description || kp.text || "")
              .filter(Boolean)
              .join("; ")
              .slice(0, 500)
          : "";
        const speakers = Array.isArray(m.speakers)
          ? (m.speakers as Array<{ first_name?: string; last_name?: string }>)
              .map(
                (s) =>
                  `${s.first_name || ""} ${s.last_name || ""}`.trim() ||
                  "Unknown"
              )
              .join(", ")
          : "";
        const transcript = m.rawContent
          ? m.rawContent.slice(0, 400)
          : "";
        return `Meeting ${i + 1}: "${m.meetingTitle || "Untitled"}" (${
          m.meetingStartDate
            ? new Date(m.meetingStartDate).toLocaleDateString()
            : "?"
        })
Speakers: ${speakers}
Key Points: ${keyPoints}
Transcript: ${transcript}`;
      })
      .join("\n---\n");
    contextParts.push(`## Meetings (${meetings.length} recent)\n${meetingCtx}`);
  }

  if (userEmails.length > 0) {
    sourcesUsed.push("emails");
    const emailCtx = userEmails
      .map(
        (e, i) =>
          `Email ${i + 1}: "${e.subject || "(no subject)"}" from ${
            e.sender
          } (${
            e.receivedAt
              ? new Date(e.receivedAt).toLocaleDateString()
              : "?"
          })\n${(e.bodyPlainText || "").slice(0, 500)}`
      )
      .join("\n---\n");
    contextParts.push(`## Emails (${userEmails.length} recent)\n${emailCtx}`);
  }

  if (userDecisions.length > 0) {
    sourcesUsed.push("decisions");
    const decisionCtx = userDecisions
      .map(
        (d, i) =>
          `Decision ${i + 1} [${d.status}/${d.category}]: "${d.statement}"${
            d.context ? `\nContext: ${d.context}` : ""
          }${d.rationale ? `\nRationale: ${d.rationale}` : ""}`
      )
      .join("\n---\n");
    contextParts.push(
      `## Decisions (${userDecisions.length} recent)\n${decisionCtx}`
    );
  }

  if (userActionItems.length > 0) {
    sourcesUsed.push("action_items");
    const actionCtx = userActionItems
      .map(
        (a, i) =>
          `Action ${i + 1} [${a.status}/${a.priority}]: "${a.title}"${
            a.assignee ? ` (assigned: ${a.assignee})` : ""
          }${a.dueDate ? ` due ${a.dueDate}` : ""}${
            a.description ? `\n${a.description.slice(0, 200)}` : ""
          }`
      )
      .join("\n---\n");
    contextParts.push(
      `## Action Items (${userActionItems.length} recent)\n${actionCtx}`
    );
  }

  const contextBlock =
    contextParts.length > 0
      ? contextParts.join("\n\n")
      : "No data available yet in the second brain.";

  // Build conversation for LLM
  const conversationHistory = history
    .slice(0, -1) // exclude the message we just inserted (it's the current query)
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n\n");

  const systemPrompt = `You are a knowledgeable AI assistant for the user's "Second Brain" — a personal knowledge management system. You have access to the user's meetings, emails, decisions, and action items.

Your job is to:
- Answer questions about the user's data accurately
- Help them find information across meetings, emails, and decisions
- Identify patterns, connections, and insights across their data
- Summarize information when asked
- Be honest when you don't have enough data to answer

Always cite sources when referencing specific meetings, emails, or decisions (e.g., "In your meeting 'Weekly Standup' on Jan 15...").

Keep your responses concise and helpful. Use markdown formatting for readability.`;

  const prompt = `${systemPrompt}

## User's Second Brain Data
${contextBlock}

${conversationHistory ? `## Previous Conversation\n${conversationHistory}\n\n` : ""}## Current Question
User: ${message}

Provide a helpful, concise answer based on the available data:`;

  const answer = await chatCompletion(prompt, { maxTokens: 1500 });

  return { answer, sourcesUsed };
}
