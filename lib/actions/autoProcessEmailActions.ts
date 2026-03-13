import { db } from "@/lib/db";
import {
  users,
  boards,
  columns,
  cards,
  cardTags,
  actionItems,
} from "@/lib/db/schema";
import { eq, and, asc, max } from "drizzle-orm";
import { extractActionsFromEmail } from "./extractEmailActions";
import {
  encryptFields,
  ACTION_ITEM_ENCRYPTED_FIELDS,
  CARD_ENCRYPTED_FIELDS,
} from "@/lib/db/encryption-helpers";

interface EmailData {
  sender: string;
  recipients: string[];
  subject: string | null;
  bodyPlainText: string | null;
  receivedAt: string;
}

/**
 * Automatically extract action items from a new email and create Kanban cards.
 *
 * Called from email webhook handlers after a new email is ingested.
 * Looks up the user's configured email action board and, if set, uses AI
 * to extract action items and create cards in the board's first column.
 */
export async function autoProcessEmailActions(
  tenantId: string,
  email: EmailData,
  options?: { boardId?: string | null }
): Promise<{ actionItemsCreated: number; cardsCreated: number; cardIds: string[] }> {
  // Skip emails with no body content
  if (!email.bodyPlainText?.trim()) {
    return { actionItemsCreated: 0, cardsCreated: 0, cardIds: [] };
  }

  // Look up user's email action board preference and email
  const [user] = await db
    .select({
      emailActionBoardId: users.emailActionBoardId,
      email: users.email,
    })
    .from(users)
    .where(eq(users.id, tenantId));

  // Per-account board takes priority over global user setting
  const boardId = options?.boardId ?? user?.emailActionBoardId;
  if (!boardId) {
    return { actionItemsCreated: 0, cardsCreated: 0, cardIds: [] };
  }

  // Verify board exists and belongs to user
  const [board] = await db
    .select({ id: boards.id })
    .from(boards)
    .where(and(eq(boards.id, boardId), eq(boards.userId, tenantId)));

  if (!board) {
    console.warn(
      `[AutoProcess] Board ${boardId} not found for user ${tenantId}`
    );
    return { actionItemsCreated: 0, cardsCreated: 0, cardIds: [] };
  }

  // Prefer a "Draft" column; fall back to first column by position
  const allCols = await db
    .select({ id: columns.id, title: columns.title })
    .from(columns)
    .where(eq(columns.boardId, boardId))
    .orderBy(asc(columns.position));

  if (allCols.length === 0) {
    console.warn(
      `[AutoProcess] No columns found in board ${boardId} for user ${tenantId}`
    );
    return { actionItemsCreated: 0, cardsCreated: 0, cardIds: [] };
  }

  const firstCol =
    allCols.find((c) => c.title.toLowerCase() === "draft") ?? allCols[0];

  // Extract action items using AI
  const extracted = await extractActionsFromEmail(
    {
      sender: email.sender,
      recipients: email.recipients,
      subject: email.subject,
      bodyPlainText: email.bodyPlainText,
      receivedAt: email.receivedAt,
    },
    user.email
  );

  if (extracted.length === 0) {
    return { actionItemsCreated: 0, cardsCreated: 0, cardIds: [] };
  }

  let actionItemsCreated = 0;
  let cardsCreated = 0;
  const cardIds: string[] = [];

  for (const action of extracted) {
    try {
      // Create the action item (encrypted)
      const [item] = await db
        .insert(actionItems)
        .values(
          encryptFields({
            userId: tenantId,
            title: action.title,
            description: action.description || null,
            assignee: action.assignee || null,
            extractionSource: "email",
            priority: action.priority || "medium",
            dueDate: action.dueDate || null,
          }, ACTION_ITEM_ENCRYPTED_FIELDS)
        )
        .returning();

      actionItemsCreated++;

      // Get next position in column
      const [posResult] = await db
        .select({ maxPosition: max(cards.position) })
        .from(cards)
        .where(eq(cards.columnId, firstCol.id));

      const nextPosition = (posResult?.maxPosition ?? 0) + 1024;

      // Create Kanban card (encrypted)
      const [card] = await db
        .insert(cards)
        .values(
          encryptFields({
            columnId: firstCol.id,
            title: action.title.slice(0, 255),
            description: action.description || null,
            position: nextPosition,
            priority: action.priority || "medium",
            dueDate: action.dueDate || null,
          }, CARD_ENCRYPTED_FIELDS)
        )
        .returning();

      // Add "Email" tag for traceability
      await db.insert(cardTags).values({
        cardId: card.id,
        label: "Email",
        color: "#3B82F6",
      });

      // Link card to action item
      await db
        .update(actionItems)
        .set({ cardId: card.id, updatedAt: new Date() })
        .where(eq(actionItems.id, item.id));

      cardIds.push(card.id);
      cardsCreated++;
    } catch (err) {
      console.error(
        `[AutoProcess] Error creating action item/card for "${action.title}":`,
        err instanceof Error ? err.message : err
      );
    }
  }

  console.log(
    `[AutoProcess] User ${tenantId}: ${actionItemsCreated} action items, ${cardsCreated} cards created from email "${email.subject}"`
  );

  return { actionItemsCreated, cardsCreated, cardIds };
}
