import { db } from "@/lib/db";
import { boards, columns, cards } from "@/lib/db/schema";
import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { eq, and, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const reorderSchema = z.object({
  cardIds: z.array(z.string()),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getRequiredUser();
    const { id } = await params;

    const body = await request.json();
    const parsed = reorderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { cardIds } = parsed.data;

    // Verify column ownership via board
    const [col] = await db
      .select({ id: columns.id })
      .from(columns)
      .innerJoin(boards, eq(columns.boardId, boards.id))
      .where(and(eq(columns.id, id), eq(boards.userId, user.id)));

    if (!col) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Verify all cards belong to this column
    const columnCards = await db
      .select({ id: cards.id })
      .from(cards)
      .where(and(eq(cards.columnId, id), inArray(cards.id, cardIds)));

    if (columnCards.length !== cardIds.length) {
      return NextResponse.json(
        { error: "One or more cards do not belong to this column" },
        { status: 400 },
      );
    }

    // Update positions: index * 1024
    await db.transaction(async (tx) => {
      for (let i = 0; i < cardIds.length; i++) {
        await tx
          .update(cards)
          .set({ position: i * 1024 })
          .where(eq(cards.id, cardIds[i]));
      }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof Response) throw error;
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
