import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import {
  brainChatSessions,
  brainChatMessages,
  brainThoughts,
  webhookKeyPoints,
  emails,
  decisions,
  actionItems,
  calendarEvents,
} from "@/lib/db/schema";
import { eq, desc, asc, and, isNull, gte } from "drizzle-orm";
import { chatCompletion, TokenLimitError } from "@/lib/ai/client";
import { dispatchWebhooks } from "@/lib/webhooks/dispatch";
import {
  encryptFields,
  decryptFields,
  decryptRows,
  WEBHOOK_ENCRYPTED_FIELDS,
  EMAIL_ENCRYPTED_FIELDS,
  DECISION_ENCRYPTED_FIELDS,
  ACTION_ITEM_ENCRYPTED_FIELDS,
  BRAIN_CHAT_MESSAGE_ENCRYPTED_FIELDS,
  BRAIN_CHAT_SESSION_ENCRYPTED_FIELDS,
  BRAIN_THOUGHT_ENCRYPTED_FIELDS,
  CALENDAR_EVENT_ENCRYPTED_FIELDS,
} from "@/lib/db/encryption-helpers";
import { classifyIntent } from "@/lib/brain/intentParser";
import { resolvePrompt } from "@/lib/ai/resolvePrompt";
import { PROMPT_BRAIN_CHAT_API } from "@/lib/ai/prompts";
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
const MAX_CONTEXT_EMAILS = 10;
const MAX_CONTEXT_DECISIONS = 10;
const MAX_CONTEXT_ACTION_ITEMS = 10;
const MAX_CONTEXT_BRAIN_THOUGHTS = 10;
const MAX_CONTEXT_CALENDAR_EVENTS = 30;
const MAX_HISTORY_MESSAGES = 50;
const PENDING_ACTION_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

/**
 * POST /api/brain/chat
 * Send a message to the Brain AI assistant.
 * Body: { message: string, sessionId?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
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
        .values(encryptFields({ userId, title }, BRAIN_CHAT_SESSION_ENCRYPTED_FIELDS))
        .returning();
      activeSessionId = newSession.id;
    }

    // Save the user message (encrypted)
    await db.insert(brainChatMessages).values(
      encryptFields({
        sessionId: activeSessionId,
        role: "user" as const,
        content: message.trim(),
      }, BRAIN_CHAT_MESSAGE_ENCRYPTED_FIELDS)
    );

    // Fire outbound webhook for thought captured (non-blocking)
    dispatchWebhooks(userId, "thought.captured", activeSessionId, {
      message: message.trim().slice(0, 500),
      sessionId: activeSessionId,
    }).catch(() => {});

    // Fetch conversation history for context (most recent first, then reverse for chronological order)
    const historyDesc = await db
      .select({ role: brainChatMessages.role, content: brainChatMessages.content })
      .from(brainChatMessages)
      .where(eq(brainChatMessages.sessionId, activeSessionId))
      .orderBy(desc(brainChatMessages.createdAt))
      .limit(MAX_HISTORY_MESSAGES);
    const history = decryptRows(historyDesc, BRAIN_CHAT_MESSAGE_ENCRYPTED_FIELDS).reverse();

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
      pendingAction,
      userId
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

    // Save the assistant response (encrypted)
    const [assistantMsg] = await db
      .insert(brainChatMessages)
      .values(
        encryptFields({
          sessionId: activeSessionId,
          role: "assistant" as const,
          content: answer,
          sourcesUsed,
        }, BRAIN_CHAT_MESSAGE_ENCRYPTED_FIELDS)
      )
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
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [meetings, userEmails, userDecisions, userActionItems, userThoughts, upcomingEvents] =
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

      db
        .select({
          id: brainThoughts.id,
          content: brainThoughts.content,
          source: brainThoughts.source,
          topic: brainThoughts.topic,
          tags: brainThoughts.tags,
          sourceUrl: brainThoughts.sourceUrl,
          sourceDomain: brainThoughts.sourceDomain,
          createdAt: brainThoughts.createdAt,
        })
        .from(brainThoughts)
        .where(eq(brainThoughts.userId, userId))
        .orderBy(desc(brainThoughts.createdAt))
        .limit(MAX_CONTEXT_BRAIN_THOUGHTS),

      db
        .select({
          id: calendarEvents.id,
          subject: calendarEvents.subject,
          startDateTime: calendarEvents.startDateTime,
          endDateTime: calendarEvents.endDateTime,
          isAllDay: calendarEvents.isAllDay,
          location: calendarEvents.location,
          organizerName: calendarEvents.organizerName,
          attendees: calendarEvents.attendees,
        })
        .from(calendarEvents)
        .where(
          and(
            eq(calendarEvents.tenantId, userId),
            gte(calendarEvents.startDateTime, startOfToday),
            eq(calendarEvents.isCancelled, false)
          )
        )
        .orderBy(asc(calendarEvents.startDateTime))
        .limit(MAX_CONTEXT_CALENDAR_EVENTS),
    ]);

  // Decrypt sensitive fields from each data source
  const decMeetings = decryptRows(meetings as Record<string, unknown>[], WEBHOOK_ENCRYPTED_FIELDS) as typeof meetings;
  const decEmails = decryptRows(userEmails as Record<string, unknown>[], EMAIL_ENCRYPTED_FIELDS) as typeof userEmails;
  const decDecisions = decryptRows(userDecisions as Record<string, unknown>[], DECISION_ENCRYPTED_FIELDS) as typeof userDecisions;
  const decActionItems = decryptRows(userActionItems as Record<string, unknown>[], ACTION_ITEM_ENCRYPTED_FIELDS) as typeof userActionItems;
  const decThoughts = decryptRows(userThoughts as Record<string, unknown>[], BRAIN_THOUGHT_ENCRYPTED_FIELDS) as typeof userThoughts;
  const decCalendarEvents = decryptRows(upcomingEvents as Record<string, unknown>[], CALENDAR_EVENT_ENCRYPTED_FIELDS) as typeof upcomingEvents;

  // Build context string
  const contextParts: string[] = [];
  const sourcesUsed: string[] = [];

  if (decMeetings.length > 0) {
    sourcesUsed.push("meetings");
    const meetingCtx = decMeetings
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
    contextParts.push(`## Meetings (${decMeetings.length} recent)\n${meetingCtx}`);
  }

  if (decEmails.length > 0) {
    sourcesUsed.push("emails");
    const emailCtx = decEmails
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
    contextParts.push(`## Emails (${decEmails.length} recent)\n${emailCtx}`);
  }

  if (decDecisions.length > 0) {
    sourcesUsed.push("decisions");
    const decisionCtx = decDecisions
      .map(
        (d, i) =>
          `Decision ${i + 1} [${d.status}/${d.category}]: "${d.statement}"${
            d.context ? `\nContext: ${d.context}` : ""
          }${d.rationale ? `\nRationale: ${d.rationale}` : ""}`
      )
      .join("\n---\n");
    contextParts.push(
      `## Decisions (${decDecisions.length} recent)\n${decisionCtx}`
    );
  }

  if (decActionItems.length > 0) {
    sourcesUsed.push("action_items");
    const actionCtx = decActionItems
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
      `## Action Items (${decActionItems.length} recent)\n${actionCtx}`
    );
  }

  if (decThoughts.length > 0) {
    sourcesUsed.push("brain_thoughts");
    const thoughtCtx = decThoughts
      .map((t, i) => {
        const sourceLabel = t.source === "web_clip"
          ? `Web Clip from ${t.sourceDomain || "unknown"}`
          : `${t.source || "manual"} note`;
        const urlLine = t.sourceUrl ? `\nSource: ${t.sourceUrl}` : "";
        const tagsLine = Array.isArray(t.tags) && (t.tags as string[]).length > 0
          ? `\nTags: ${(t.tags as string[]).join(", ")}`
          : "";
        return `Thought ${i + 1} [${sourceLabel}] (${
          t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "?"
        }): ${t.topic ? `[${t.topic}] ` : ""}${(t.content || "").slice(0, 500)}${urlLine}${tagsLine}`;
      })
      .join("\n---\n");
    contextParts.push(
      `## Brain Thoughts (${decThoughts.length} recent)\n${thoughtCtx}`
    );
  }

  if (decCalendarEvents.length > 0) {
    sourcesUsed.push("calendar");
    const calendarCtx = decCalendarEvents
      .map((e, i) => {
        const start = new Date(e.startDateTime);
        const end = new Date(e.endDateTime);
        const dateStr = e.isAllDay
          ? `${start.toLocaleDateString()}, All Day`
          : `${start.toLocaleDateString()} ${start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} - ${end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
        const locationLine = e.location ? `\nLocation: ${e.location}` : "";
        const organizerLine = e.organizerName ? `\nOrganizer: ${e.organizerName}` : "";
        const attendeeNames = Array.isArray(e.attendees)
          ? (e.attendees as Array<{ name?: string }>)
              .map((a) => a.name)
              .filter(Boolean)
              .join(", ")
          : "";
        const attendeeLine = attendeeNames ? `\nAttendees: ${attendeeNames}` : "";
        return `Event ${i + 1}: "${e.subject || "Untitled"}" (${dateStr})${locationLine}${organizerLine}${attendeeLine}`;
      })
      .join("\n---\n");
    contextParts.push(
      `## Calendar Events (${decCalendarEvents.length} upcoming)\n${calendarCtx}`
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

  const systemPrompt = await resolvePrompt(PROMPT_BRAIN_CHAT_API, userId);

  const prompt = `${systemPrompt}

## User's Second Brain Data
${contextBlock}

${conversationHistory ? `## Previous Conversation\n${conversationHistory}\n\n` : ""}## Current Question
User: ${message}

Provide a helpful, concise answer based on the available data:`;

  const answer = await chatCompletion(prompt, {
    maxTokens: 1500,
    userId,
    triggerType: "brain_chat",
    promptKey: PROMPT_BRAIN_CHAT_API,
  });

  return { answer, sourcesUsed };
}
