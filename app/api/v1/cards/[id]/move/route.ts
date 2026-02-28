import { db } from "@/lib/db";
import { boards, columns, cards } from "@/lib/db/schema";
import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { moveCardSchema } from "@/lib/validators/schemas";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getRequiredUser();
    const { id } = await params;

    const body = await request.json();
    const parsed = moveCardSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { targetColumnId, position } = parsed.data;

    // Verify card ownership (card -> column -> board -> user)
    const [cardResult] = await db
      .select({
        id: cards.id,
        columnId: cards.columnId,
        boardId: columns.boardId,
      })
      .from(cards)
      .innerJoin(columns, eq(cards.columnId, columns.id))
      .innerJoin(boards, eq(columns.boardId, boards.id))
      .where(and(eq(cards.id, id), eq(boards.userId, user.id)));

    if (!cardResult) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Verify target column belongs to the same user's board
    const [targetCol] = await db
      .select({ id: columns.id, boardId: columns.boardId })
      .from(columns)
      .innerJoin(boards, eq(columns.boardId, boards.id))
      .where(
        and(eq(columns.id, targetColumnId), eq(boards.userId, user.id)),
      );

    if (!targetCol) {
      return NextResponse.json(
        { error: "Target column not found" },
        { status: 404 },
      );
    }

    // Update card's column and position
    const [updated] = await db
      .update(cards)
      .set({
        columnId: targetColumnId,
        position,
        updatedAt: new Date(),
      })
      .where(eq(cards.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Response) throw error;
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
