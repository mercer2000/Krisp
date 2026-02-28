import { db } from "@/lib/db";
import { boards, columns, cards, cardTags } from "@/lib/db/schema";
import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getRequiredUser();
    const { id } = await params;

    // Verify tag ownership (tag -> card -> column -> board -> user)
    const [tag] = await db
      .select({ id: cardTags.id })
      .from(cardTags)
      .innerJoin(cards, eq(cardTags.cardId, cards.id))
      .innerJoin(columns, eq(cards.columnId, columns.id))
      .innerJoin(boards, eq(columns.boardId, boards.id))
      .where(and(eq(cardTags.id, id), eq(boards.userId, user.id)));

    if (!tag) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await db.delete(cardTags).where(eq(cardTags.id, id));

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof Response) throw error;
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
