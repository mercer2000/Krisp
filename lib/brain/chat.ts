import { db } from "@/lib/db";
import {
  brainChatSessions,
  brainChatMessages,
  webhookKeyPoints,
  emails,
  decisions,
  actionItems,
} from "@/lib/db/schema";
import { eq, desc, and, isNull, asc } from "drizzle-orm";
import { chatCompletion } from "@/lib/ai/client";

const MAX_CONTEXT_MEETINGS = 15;
const MAX_CONTEXT_EMAILS = 15;
const MAX_CONTEXT_DECISIONS = 15;
const MAX_CONTEXT_ACTION_ITEMS = 15;
const MAX_HISTORY_MESSAGES = 20;

/**
 * Process a Brain AI chat message for a given user.
 * Returns the assistant response, session ID, and message metadata.
 * Shared by the web API and the Telegram webhook.
 */
export async function processBrainChat(
  userId: string,
  message: string,
  sessionId?: string | null
): Promise<{
  sessionId: string;
  answer: string;
  sourcesUsed: string[];
  messageId: string;
  createdAt: Date | null;
}> {
  // Get or create session
  let activeSessionId = sessionId || null;
  if (!activeSessionId) {
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

  // Fetch conversation history for context
  const history = await db
    .select({
      role: brainChatMessages.role,
      content: brainChatMessages.content,
    })
    .from(brainChatMessages)
    .where(eq(brainChatMessages.sessionId, activeSessionId))
    .orderBy(asc(brainChatMessages.createdAt))
    .limit(MAX_HISTORY_MESSAGES);

  // Gather context from the user's second brain
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
        .where(and(eq(emails.tenantId, userId), isNull(emails.deletedAt)))
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
          : "";
        const speakers = Array.isArray(m.speakers)
          ? (
              m.speakers as Array<{
                first_name?: string;
                last_name?: string;
              }>
            )
              .map(
                (s) =>
                  `${s.first_name || ""} ${s.last_name || ""}`.trim() ||
                  "Unknown"
              )
              .join(", ")
          : "";
        const transcript = m.rawContent ? m.rawContent.slice(0, 800) : "";
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
    contextParts.push(
      `## Meetings (${meetings.length} recent)\n${meetingCtx}`
    );
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
    contextParts.push(
      `## Emails (${userEmails.length} recent)\n${emailCtx}`
    );
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
    .slice(0, -1)
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
User: ${message.trim()}

Provide a helpful, concise answer based on the available data:`;

  const answer = await chatCompletion(prompt, { maxTokens: 1500 });

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

  return {
    sessionId: activeSessionId,
    answer,
    sourcesUsed,
    messageId: assistantMsg.id,
    createdAt: assistantMsg.createdAt,
  };
}
