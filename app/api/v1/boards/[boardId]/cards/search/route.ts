import { db } from "@/lib/db";
import { boards, columns, cards } from "@/lib/db/schema";
import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { eq, and, ilike, or } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> },
) {
  try {
    const user = await getRequiredUser();
    const { boardId } = await params;

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json(
        { error: "Query parameter 'q' is required" },
        { status: 400 },
      );
    }

    // Verify board ownership
    const [board] = await db
      .select()
      .from(boards)
      .where(and(eq(boards.id, boardId), eq(boards.userId, user.id)));

    if (!board) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Search cards in board by title and description
    const searchPattern = `%${query}%`;

    const matchingCards = await db
      .select({
        id: cards.id,
        title: cards.title,
        description: cards.description,
        position: cards.position,
        columnId: cards.columnId,
        archived: cards.archived,
        createdAt: cards.createdAt,
        updatedAt: cards.updatedAt,
      })
      .from(cards)
      .innerJoin(columns, eq(cards.columnId, columns.id))
      .where(
        and(
          eq(columns.boardId, boardId),
          eq(cards.archived, false),
          or(
            ilike(cards.title, searchPattern),
            ilike(cards.description, searchPattern),
          ),
        ),
      );

    return NextResponse.json(matchingCards);
  } catch (error) {
    if (error instanceof Response) throw error;
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
