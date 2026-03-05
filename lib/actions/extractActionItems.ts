import { db } from "@/lib/db";
import { actionItems, boards, columns, cards, cardTags } from "@/lib/db/schema";
import { getMeetingById } from "@/lib/krisp/webhookKeyPoints";
import { eq, and, asc, max, isNull } from "drizzle-orm";
import { chatCompletion } from "@/lib/ai/client";
import { resolvePrompt } from "@/lib/ai/resolvePrompt";
import { PROMPT_ACTION_ITEMS_MEETING } from "@/lib/ai/prompts";
import {
  encryptFields,
  decryptFields,
  decryptRows,
  ACTION_ITEM_ENCRYPTED_FIELDS,
  CARD_ENCRYPTED_FIELDS,
} from "@/lib/db/encryption-helpers";

export type ExtractionSource = "auto_webhook" | "manual";

interface ExtractedActionItem {
  title: string;
  description: string;
  assignee: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  dueDate: string | null;
}

interface ExtractionResult {
  actionItems: typeof actionItems.$inferSelect[];
  cardsCreated: number;
}

/**
 * Extract action items from a meeting using AI and optionally create Kanban cards.
 * Idempotent: skips extraction if action items already exist for the meeting.
 *
 * @param source - "auto_webhook" for background extraction, "manual" for user-triggered
 */
export async function extractActionItemsForMeeting(
  meetingId: number,
  userId: string,
  boardId?: string | null,
  source: ExtractionSource = "manual"
): Promise<ExtractionResult> {
  // Idempotency: check if non-deleted items already exist for this meeting
  const existing = await db
    .select({ id: actionItems.id })
    .from(actionItems)
    .where(
      and(
        eq(actionItems.userId, userId),
        eq(actionItems.meetingId, meetingId),
        isNull(actionItems.deletedAt)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Already extracted — return existing items
    const items = await db
      .select()
      .from(actionItems)
      .where(
        and(
          eq(actionItems.userId, userId),
          eq(actionItems.meetingId, meetingId),
          isNull(actionItems.deletedAt)
        )
      );
    const decItems = decryptRows(items as Record<string, unknown>[], ACTION_ITEM_ENCRYPTED_FIELDS) as typeof items;
    return { actionItems: decItems, cardsCreated: 0 };
  }

  const meeting = await getMeetingById(meetingId, userId);
  if (!meeting) {
    return { actionItems: [], cardsCreated: 0 };
  }

  // Build context from meeting data
  const speakerNames = (
    meeting.speakers as {
      first_name?: string;
      last_name?: string;
      index: number;
    }[]
  )
    .map(
      (s) =>
        [s.first_name, s.last_name].filter(Boolean).join(" ") ||
        `Speaker ${s.index}`
    )
    .filter(Boolean);

  const contentArr = Array.isArray(meeting.content) ? meeting.content : [];
  const keyPoints = contentArr
    .filter((c) => typeof c === "object" && c !== null && "description" in c)
    .map((c) => (c as { description: string }).description);

  const transcript = meeting.raw_content || "";
  const today = new Date().toISOString().split("T")[0];

  const instructions = await resolvePrompt(PROMPT_ACTION_ITEMS_MEETING, userId);

  const prompt = `${instructions}

Meeting: "${meeting.meeting_title || "Untitled"}"
Date: ${meeting.meeting_start_date ? new Date(meeting.meeting_start_date).toLocaleDateString() : "Unknown"}
Participants: ${speakerNames.join(", ") || "Unknown"}

Key Points:
${keyPoints.map((kp: string, i: number) => `${i + 1}. ${kp}`).join("\n")}

Transcript (excerpt):
${transcript.slice(0, 8000)}

Today's date: ${today}`;

  const text = await chatCompletion(prompt, { maxTokens: 2000 });

  let extracted: ExtractedActionItem[];
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    extracted = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
  } catch {
    console.error("Failed to parse AI response:", text);
    return { actionItems: [], cardsCreated: 0 };
  }

  if (extracted.length === 0) {
    return { actionItems: [], cardsCreated: 0 };
  }

  // Insert all extracted items
  const insertedItems: (typeof actionItems.$inferSelect)[] = [];
  for (const item of extracted) {
    const [inserted] = await db
      .insert(actionItems)
      .values(
        encryptFields({
          userId,
          meetingId,
          title: item.title.slice(0, 500),
          description: item.description || null,
          assignee: item.assignee || null,
          extractionSource: source,
          priority: item.priority || "medium",
          dueDate: item.dueDate || null,
        }, ACTION_ITEM_ENCRYPTED_FIELDS)
      )
      .returning();
    // Decrypt for in-memory use (e.g., creating cards)
    insertedItems.push(decryptFields(inserted as Record<string, unknown>, ACTION_ITEM_ENCRYPTED_FIELDS) as typeof inserted);
  }

  // Create Kanban cards if a board is specified
  let cardsCreated = 0;
  if (boardId) {
    cardsCreated = await createCardsForActionItems(
      insertedItems,
      boardId,
      userId
    );
  }

  return { actionItems: insertedItems, cardsCreated };
}

/**
 * Create Kanban cards from action items on the specified board.
 * Links each card back to its action item via cardId.
 * Returns the number of cards created.
 */
export async function createCardsForActionItems(
  items: (typeof actionItems.$inferSelect)[],
  boardId: string,
  userId: string
): Promise<number> {
  // Verify board ownership
  const [board] = await db
    .select({ id: boards.id })
    .from(boards)
    .where(and(eq(boards.id, boardId), eq(boards.userId, userId)));

  if (!board) return 0;

  // Prefer a "Draft" column; fall back to first column by position
  const allCols = await db
    .select({ id: columns.id, title: columns.title })
    .from(columns)
    .where(eq(columns.boardId, boardId))
    .orderBy(asc(columns.position));

  if (allCols.length === 0) return 0;

  const firstCol =
    allCols.find((c) => c.title.toLowerCase() === "draft") ?? allCols[0];

  // Get current max position in that column
  const [posResult] = await db
    .select({ maxPosition: max(cards.position) })
    .from(cards)
    .where(eq(cards.columnId, firstCol.id));

  let nextPosition = (posResult?.maxPosition ?? 0) + 1024;
  let created = 0;

  for (const item of items) {
    // Skip if this action item already has a card linked
    if (item.cardId) continue;

    const [card] = await db
      .insert(cards)
      .values(
        encryptFields({
          columnId: firstCol.id,
          title: item.title.slice(0, 255),
          description: item.description || null,
          position: nextPosition,
          priority: item.priority || "medium",
          dueDate: item.dueDate || null,
        }, CARD_ENCRYPTED_FIELDS)
      )
      .returning();

    // Add a "Meeting" tag for traceability
    if (item.meetingId) {
      await db.insert(cardTags).values({
        cardId: card.id,
        label: "Meeting",
        color: "#6366F1",
      });
    }

    // Link the card back to the action item
    await db
      .update(actionItems)
      .set({ cardId: card.id, updatedAt: new Date() })
      .where(eq(actionItems.id, item.id));

    nextPosition += 1024;
    created++;
  }

  return created;
}
