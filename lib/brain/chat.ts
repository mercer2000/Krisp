import { db } from "@/lib/db";
import {
  brainChatSessions,
  brainChatMessages,
  webhookKeyPoints,
  emails,
  decisions,
  actionItems,
  brainThoughts,
} from "@/lib/db/schema";
import { eq, desc, and, isNull } from "drizzle-orm";
import { chatCompletion } from "@/lib/ai/client";
import { resolvePrompt } from "@/lib/ai/resolvePrompt";
import { PROMPT_BRAIN_CHAT } from "@/lib/ai/prompts";
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
} from "@/lib/db/encryption-helpers";

const MAX_CONTEXT_MEETINGS = 5;
const MAX_CONTEXT_EMAILS = 10;
const MAX_CONTEXT_DECISIONS = 10;
const MAX_CONTEXT_ACTION_ITEMS = 10;
const MAX_CONTEXT_THOUGHTS = 10;
const MAX_HISTORY_MESSAGES = 50;

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

  // Fetch conversation history for context (most recent first, then reverse for chronological order)
  const historyDesc = await db
    .select({
      role: brainChatMessages.role,
      content: brainChatMessages.content,
    })
    .from(brainChatMessages)
    .where(eq(brainChatMessages.sessionId, activeSessionId))
    .orderBy(desc(brainChatMessages.createdAt))
    .limit(MAX_HISTORY_MESSAGES);
  const history = decryptRows(historyDesc, BRAIN_CHAT_MESSAGE_ENCRYPTED_FIELDS).reverse();

  // Gather context from the user's second brain
  const [meetings, userEmails, userDecisions, userActionItems, userThoughts] =
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

      db
        .select({
          id: brainThoughts.id,
          content: brainThoughts.content,
          source: brainThoughts.source,
          author: brainThoughts.author,
          topic: brainThoughts.topic,
          tags: brainThoughts.tags,
          createdAt: brainThoughts.createdAt,
        })
        .from(brainThoughts)
        .where(eq(brainThoughts.userId, userId))
        .orderBy(desc(brainThoughts.createdAt))
        .limit(MAX_CONTEXT_THOUGHTS),
    ]);

  // Decrypt sensitive fields from each data source
  const decMeetings = decryptRows(meetings as Record<string, unknown>[], WEBHOOK_ENCRYPTED_FIELDS) as typeof meetings;
  const decEmails = decryptRows(userEmails as Record<string, unknown>[], EMAIL_ENCRYPTED_FIELDS) as typeof userEmails;
  const decDecisions = decryptRows(userDecisions as Record<string, unknown>[], DECISION_ENCRYPTED_FIELDS) as typeof userDecisions;
  const decActionItems = decryptRows(userActionItems as Record<string, unknown>[], ACTION_ITEM_ENCRYPTED_FIELDS) as typeof userActionItems;
  const decThoughts = decryptRows(userThoughts as Record<string, unknown>[], BRAIN_THOUGHT_ENCRYPTED_FIELDS) as typeof userThoughts;

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
        const transcript = m.rawContent ? m.rawContent.slice(0, 400) : "";
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
      `## Meetings (${decMeetings.length} recent)\n${meetingCtx}`
    );
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
    contextParts.push(
      `## Emails (${decEmails.length} recent)\n${emailCtx}`
    );
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
    sourcesUsed.push("thoughts");
    const thoughtCtx = decThoughts
      .map(
        (t, i) =>
          `Thought ${i + 1} [${t.source}${t.topic ? `/${t.topic}` : ""}]: "${(t.content || "").slice(0, 500)}"${
            t.author ? ` (from: ${t.author})` : ""
          }${Array.isArray(t.tags) && (t.tags as string[]).length > 0 ? ` tags: ${(t.tags as string[]).join(", ")}` : ""} (${
            t.createdAt
              ? new Date(t.createdAt).toLocaleDateString()
              : "?"
          })`
      )
      .join("\n---\n");
    contextParts.push(
      `## Thoughts / Notes (${decThoughts.length} recent)\n${thoughtCtx}`
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

  const systemPrompt = await resolvePrompt(PROMPT_BRAIN_CHAT, userId);

  const prompt = `${systemPrompt}

## User's Second Brain Data
${contextBlock}

${conversationHistory ? `## Previous Conversation\n${conversationHistory}\n\n` : ""}## Current Question
User: ${message.trim()}

Provide a helpful, concise answer based on the available data:`;

  const answer = await chatCompletion(prompt, { maxTokens: 1500 });

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

  return {
    sessionId: activeSessionId,
    answer,
    sourcesUsed,
    messageId: assistantMsg.id,
    createdAt: assistantMsg.createdAt,
  };
}
