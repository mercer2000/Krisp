import { db } from "@/lib/db";
import { boards, columns, cards } from "@/lib/db/schema";
import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { eq, and, lte, isNotNull, isNull, asc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> },
) {
  try {
    const user = await getRequiredUser();
    const { boardId } = await params;

    // Verify board ownership
    const [board] = await db
      .select({ id: boards.id })
      .from(boards)
      .where(and(eq(boards.id, boardId), eq(boards.userId, user.id)));

    if (!board) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const now = new Date();

    // Find all snoozed cards on this board that are due to wake up
    const snoozedCards = await db
      .select({
        id: cards.id,
        columnId: cards.columnId,
        snoozeReturnColumnId: cards.snoozeReturnColumnId,
      })
      .from(cards)
      .innerJoin(columns, eq(cards.columnId, columns.id))
      .where(
        and(
          eq(columns.boardId, boardId),
          isNotNull(cards.snoozedUntil),
          lte(cards.snoozedUntil, now),
          isNull(cards.deletedAt),
          eq(cards.archived, false),
        ),
      );

    if (snoozedCards.length === 0) {
      return NextResponse.json({ wokenUp: 0 });
    }

    // Get all columns for this board to find fallback "To Do" column
    const boardColumns = await db
      .select({ id: columns.id, title: columns.title, position: columns.position })
      .from(columns)
      .where(eq(columns.boardId, boardId))
      .orderBy(asc(columns.position));

    // Find a "To Do" column as fallback, or use the first column
    const todoColumn = boardColumns.find(
      (col) => col.title.toLowerCase() === "to do" || col.title.toLowerCase() === "todo",
    ) ?? boardColumns[0];

    if (!todoColumn) {
      return NextResponse.json({ error: "No columns found" }, { status: 400 });
    }

    let wokenUp = 0;

    for (const card of snoozedCards) {
      // Determine target column: use saved return column if it still exists, else fallback
      let targetColumnId = todoColumn.id;
      if (card.snoozeReturnColumnId) {
        const exists = boardColumns.some((c) => c.id === card.snoozeReturnColumnId);
        if (exists) {
          targetColumnId = card.snoozeReturnColumnId;
        }
      }

      await db
        .update(cards)
        .set({
          columnId: targetColumnId,
          snoozedUntil: null,
          snoozeReturnColumnId: null,
          position: 0, // Place at top of column
          updatedAt: now,
        })
        .where(eq(cards.id, card.id));

      wokenUp++;
    }

    return NextResponse.json({ wokenUp });
  } catch (error) {
    if (error instanceof Response) throw error;
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
