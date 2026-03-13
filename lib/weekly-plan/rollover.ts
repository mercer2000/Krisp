import { db } from "@/lib/db";
import { cards, columns, boards } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";

/**
 * Clears Big 3 flags and returns Focus column cards to their origin columns.
 * Called when a new weekly plan is activated or on Monday midnight via cron.
 */
export async function rolloverWeek(
  userId: string
): Promise<void> {
  // Get all board IDs for this user
  const userBoards = await db
    .select({ id: boards.id })
    .from(boards)
    .where(eq(boards.userId, userId));
  const boardIds = userBoards.map((b) => b.id);

  if (boardIds.length === 0) return;

  // Get all columns in those boards
  const boardCols = await db
    .select({ id: columns.id })
    .from(columns)
    .where(inArray(columns.boardId, boardIds));
  const colIds = boardCols.map((c) => c.id);

  if (colIds.length === 0) return;

  // Get all Big 3 cards in those columns
  const bigThreeCards = await db
    .select()
    .from(cards)
    .where(and(eq(cards.isBigThree, true), inArray(cards.columnId, colIds)));

  // Process each card
  for (const card of bigThreeCards) {
    if (card.snoozeReturnColumnId) {
      // Verify the origin column still exists
      const originColumn = await db
        .select({ id: columns.id })
        .from(columns)
        .where(eq(columns.id, card.snoozeReturnColumnId));

      if (originColumn.length > 0) {
        // Move card back to origin column and clear Big 3 fields
        await db
          .update(cards)
          .set({
            columnId: card.snoozeReturnColumnId,
            snoozeReturnColumnId: null,
            isBigThree: false,
            bigThreeWeekStart: null,
          })
          .where(eq(cards.id, card.id));
      } else {
        // Origin column no longer exists — clear Big 3 fields, leave card in place
        await db
          .update(cards)
          .set({
            snoozeReturnColumnId: null,
            isBigThree: false,
            bigThreeWeekStart: null,
          })
          .where(eq(cards.id, card.id));
      }
    } else {
      // No origin column — just clear Big 3 fields
      await db
        .update(cards)
        .set({
          isBigThree: false,
          bigThreeWeekStart: null,
        })
        .where(eq(cards.id, card.id));
    }
  }
}
