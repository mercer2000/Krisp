import { db } from "@/lib/db";
import { boards, columns, cards, cardTags } from "@/lib/db/schema";
import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { createTagSchema } from "@/lib/validators/schemas";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getRequiredUser();
    const { id } = await params;

    const body = await request.json();
    const parsed = createTagSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // Verify card ownership (card -> column -> board -> user)
    const [cardResult] = await db
      .select({ id: cards.id })
      .from(cards)
      .innerJoin(columns, eq(cards.columnId, columns.id))
      .innerJoin(boards, eq(columns.boardId, boards.id))
      .where(and(eq(cards.id, id), eq(boards.userId, user.id)));

    if (!cardResult) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const [tag] = await db
      .insert(cardTags)
      .values({
        ...parsed.data,
        cardId: id,
      })
      .returning();

    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    if (error instanceof Response) throw error;
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
