import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { boards, columns, cards, cardTags, actionItems } from "@/lib/db/schema";
import { eq, and, asc, max } from "drizzle-orm";
import {
  encryptFields,
  CARD_ENCRYPTED_FIELDS,
} from "@/lib/db/encryption-helpers";

interface CardInput {
  actionItemId: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  dueDate: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { cards: cardInputs, boardId, columnId } = (await request.json()) as {
      cards: CardInput[];
      boardId: string;
      columnId: string;
    };

    if (!Array.isArray(cardInputs) || cardInputs.length === 0) {
      return NextResponse.json(
        { error: "cards array is required" },
        { status: 400 }
      );
    }
    if (!boardId || !columnId) {
      return NextResponse.json(
        { error: "boardId and columnId are required" },
        { status: 400 }
      );
    }

    // Verify board ownership
    const [board] = await db
      .select({ id: boards.id })
      .from(boards)
      .where(and(eq(boards.id, boardId), eq(boards.userId, userId)));

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    // Verify column belongs to board
    const [col] = await db
      .select({ id: columns.id })
      .from(columns)
      .where(and(eq(columns.id, columnId), eq(columns.boardId, boardId)));

    if (!col) {
      return NextResponse.json({ error: "Column not found" }, { status: 404 });
    }

    // Get current max position in column
    const [posResult] = await db
      .select({ maxPosition: max(cards.position) })
      .from(cards)
      .where(eq(cards.columnId, columnId));

    let nextPosition = (posResult?.maxPosition ?? 0) + 1024;
    let created = 0;

    for (const input of cardInputs) {
      const [card] = await db
        .insert(cards)
        .values(
          encryptFields({
            columnId,
            title: input.title.slice(0, 255),
            description: input.description || null,
            position: nextPosition,
            priority: input.priority || "medium",
            dueDate: input.dueDate || null,
          }, CARD_ENCRYPTED_FIELDS)
        )
        .returning();

      // Add "Meeting" tag
      await db.insert(cardTags).values({
        cardId: card.id,
        label: "Meeting",
        color: "#6366F1",
      });

      // Link card to action item
      if (input.actionItemId) {
        await db
          .update(actionItems)
          .set({ cardId: card.id, updatedAt: new Date() })
          .where(
            and(
              eq(actionItems.id, input.actionItemId),
              eq(actionItems.userId, userId)
            )
          );
      }

      nextPosition += 1024;
      created++;
    }

    return NextResponse.json({
      message: `Created ${created} cards`,
      cardsCreated: created,
    });
  } catch (error) {
    console.error("Error bulk creating cards:", error);
    return NextResponse.json(
      { error: "Failed to create cards" },
      { status: 500 }
    );
  }
}
