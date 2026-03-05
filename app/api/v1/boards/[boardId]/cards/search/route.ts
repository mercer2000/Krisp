import { db } from "@/lib/db";
import { boards, columns, cards } from "@/lib/db/schema";
import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import {
  decryptFields,
  CARD_ENCRYPTED_FIELDS,
} from "@/lib/db/encryption-helpers";

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

    // Fetch all non-archived cards in board, then filter application-side
    // (title/description are encrypted so ILIKE cannot be used)
    const allCards = await db
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
        ),
      );

    const lower = query.toLowerCase();
    const matchingCards = allCards
      .map((c) => decryptFields(c as Record<string, unknown>, CARD_ENCRYPTED_FIELDS) as typeof c)
      .filter((c) => {
        const title = (c.title || "").toLowerCase();
        const desc = (c.description || "").toLowerCase();
        return title.includes(lower) || desc.includes(lower);
      });

    return NextResponse.json(matchingCards);
  } catch (error) {
    if (error instanceof Response) throw error;
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
