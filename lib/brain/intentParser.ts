import { chatCompletion } from "@/lib/ai/client";
import type { BrainIntent, BoardContext, PendingAction } from "./types";

/**
 * Classify a user message as either a Kanban action or a brain query.
 * Uses a compact LLM call with board/column context to extract structured JSON.
 */
export async function classifyIntent(
  userMessage: string,
  boardContext: BoardContext,
  conversationHistory: Array<{ role: string; content: string }>,
  pendingAction: PendingAction | null
): Promise<BrainIntent> {
  // Quick check: if there's a pending confirmation, handle yes/no directly
  if (pendingAction) {
    const lower = userMessage.toLowerCase().trim();
    const positives = ["yes", "y", "confirm", "sure", "ok", "do it", "go ahead", "yep", "yup"];
    const negatives = ["no", "n", "cancel", "nevermind", "never mind", "nah", "nope", "don't"];

    if (positives.some((p) => lower === p || lower.startsWith(p + " "))) {
      return { type: "confirm_action", data: { confirmed: true } };
    }
    if (negatives.some((p) => lower === p || lower.startsWith(p + " "))) {
      return { type: "confirm_action", data: { confirmed: false } };
    }
    // If neither, fall through to classify — the user might have moved on
  }

  const boardsDesc = boardContext.boards
    .map(
      (b) =>
        `Board "${b.title}" (id: ${b.id})${b.id === boardContext.defaultBoardId ? " [DEFAULT]" : ""}: columns [${b.columns
          .map((c) => `"${c.title}"`)
          .join(", ")}]`
    )
    .join("\n");

  const recentHistory = conversationHistory
    .slice(-6)
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");

  const today = new Date().toISOString().split("T")[0];
  const dayOfWeek = new Date().toLocaleDateString("en-US", { weekday: "long" });

  const prompt = `You are an intent classifier. Classify the user's message as either a Kanban task management command or a general knowledge query about their second brain data.

Today is ${dayOfWeek}, ${today}.

## User's Kanban Boards
${boardsDesc || "No boards exist yet."}

## Recent Conversation
${recentHistory || "(new conversation)"}

## User Message
"${userMessage}"

## Instructions
Respond with ONLY a JSON object (no markdown, no code fences). Classify the intent:

- "create_card": User wants to create a new task/card. Extract: title, description, dueDate (ISO 8601 yyyy-mm-dd, resolve relative dates like "next Friday" or "tomorrow"), priority (low/medium/high/urgent), tags (array of strings), targetColumn (column name), targetBoard (board name).
- "move_card": User wants to move a card to another column. Extract: cardReference (part of card title), targetColumn (column name).
- "update_card": User wants to change a card's details. Extract: cardReference, plus any of: title, description, dueDate, priority.
- "archive_card": User wants to delete/archive a card. Extract: cardReference.
- "restore_card": User wants to restore a deleted card. Extract: cardReference.
- "query_cards": User wants to see their cards/tasks/board. Extract: status (column name filter), priority, overdue (boolean), boardName.
- "clarify": The message seems task-related but is ambiguous. Provide: message (a clarifying question to ask the user).
- "brain_query": The message is about meetings, emails, decisions, action items, or general knowledge — NOT about creating/moving/deleting Kanban cards.

Default to "brain_query" if unsure.

For create_card, you MUST always provide a "title" field.

JSON schema: { "type": "<intent_type>", "data": { ... } }`;

  try {
    const raw = await chatCompletion(prompt, { maxTokens: 500 });

    // Strip code fences if present
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const parsed = JSON.parse(cleaned) as BrainIntent;

    // Validate the type is one of our known types
    const validTypes = [
      "brain_query",
      "create_card",
      "move_card",
      "update_card",
      "archive_card",
      "restore_card",
      "query_cards",
      "clarify",
    ];

    if (!validTypes.includes(parsed.type)) {
      return { type: "brain_query", data: {} };
    }

    return parsed;
  } catch (error) {
    // On any parse failure, fall back to brain query
    console.error("Intent classification failed, falling back to brain_query:", error);
    return { type: "brain_query", data: {} };
  }
}
