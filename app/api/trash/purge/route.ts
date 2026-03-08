import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { cards, columns, boards, actionItems } from "@/lib/db/schema";
import { eq, and, isNotNull } from "drizzle-orm";
import sql from "@/lib/krisp/db";

/**
 * POST /api/trash/purge — Permanently delete all items in trash
 */
export async function POST() {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find user's soft-deleted card IDs via join
    const deletedCardRows = await db
      .select({ id: cards.id })
      .from(cards)
      .innerJoin(columns, eq(cards.columnId, columns.id))
      .innerJoin(boards, eq(columns.boardId, boards.id))
      .where(and(isNotNull(cards.deletedAt), eq(boards.userId, userId)));

    // Hard-delete each card
    for (const row of deletedCardRows) {
      await db.delete(cards).where(eq(cards.id, row.id));
    }

    // Hard-delete action items
    await db
      .delete(actionItems)
      .where(
        and(isNotNull(actionItems.deletedAt), eq(actionItems.userId, userId))
      );

    // Hard-delete meetings
    await sql`
      DELETE FROM webhook_key_points
      WHERE user_id = ${userId} AND deleted_at IS NOT NULL
    `;

    // Hard-delete emails
    await sql`
      DELETE FROM emails
      WHERE tenant_id = ${userId} AND deleted_at IS NOT NULL
    `;

    return NextResponse.json({ message: "Trash emptied" });
  } catch (error) {
    console.error("Error purging trash:", error);
    return NextResponse.json(
      { error: "Failed to empty trash" },
      { status: 500 }
    );
  }
}
