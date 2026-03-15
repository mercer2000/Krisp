import { chatCompletion } from "@/lib/ai/client";
import { resolvePrompt } from "@/lib/ai/resolvePrompt";
import { PROMPT_INTENT_CLASSIFIER } from "@/lib/ai/prompts";
import type { BrainIntent, BoardContext, PendingAction } from "./types";

/**
 * Classify a user message as either a Kanban action or a brain query.
 * Uses a compact LLM call with board/column context to extract structured JSON.
 */
export async function classifyIntent(
  userMessage: string,
  boardContext: BoardContext,
  conversationHistory: Array<{ role: string; content: string }>,
  pendingAction: PendingAction | null,
  userId?: string
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

  const baseInstructions = userId
    ? await resolvePrompt(PROMPT_INTENT_CLASSIFIER, userId)
    : (await import("@/lib/ai/prompts")).PROMPT_DEFAULTS[PROMPT_INTENT_CLASSIFIER].defaultText;

  const prompt = `${baseInstructions}

Today is ${dayOfWeek}, ${today}.

## User's Kanban Boards
${boardsDesc || "No boards exist yet."}

## Recent Conversation
${recentHistory || "(new conversation)"}

## User Message
"${userMessage}"`;

  try {
    const raw = await chatCompletion(prompt, {
      maxTokens: 500,
      ...(userId ? { userId } : {}),
      triggerType: "intent_classify",
      promptKey: PROMPT_INTENT_CLASSIFIER,
    });

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
