import { db } from "@/lib/db";
import { boards, columns, cards, cardTags } from "@/lib/db/schema";
import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { updateCardSchema } from "@/lib/validators/schemas";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import {
  encryptFields,
  decryptFields,
  CARD_ENCRYPTED_FIELDS,
} from "@/lib/db/encryption-helpers";

async function verifyCardOwnership(cardId: string, userId: string) {
  const [result] = await db
    .select({ id: cards.id })
    .from(cards)
    .innerJoin(columns, eq(cards.columnId, columns.id))
    .innerJoin(boards, eq(columns.boardId, boards.id))
    .where(and(eq(cards.id, cardId), eq(boards.userId, userId)));

  return result;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getRequiredUser();
    const { id } = await params;

    // Verify ownership
    const owned = await verifyCardOwnership(id, user.id);
    if (!owned) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const card = await db.query.cards.findFirst({
      where: eq(cards.id, id),
      with: {
        tags: true,
      },
    });

    const decrypted = card ? decryptFields(card as Record<string, unknown>, CARD_ENCRYPTED_FIELDS) : card;
    return NextResponse.json(decrypted);
  } catch (error) {
    if (error instanceof Response) throw error;
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getRequiredUser();
    const { id } = await params;

    const body = await request.json();
    const parsed = updateCardSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // Verify ownership
    const owned = await verifyCardOwnership(id, user.id);
    if (!owned) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Convert snoozedUntil string to Date for the timestamp column
    const updateData: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };
    if (parsed.data.snoozedUntil !== undefined) {
      updateData.snoozedUntil = parsed.data.snoozedUntil ? new Date(parsed.data.snoozedUntil) : null;
    }

    const [updated] = await db
      .update(cards)
      .set(encryptFields(updateData, CARD_ENCRYPTED_FIELDS))
      .where(eq(cards.id, id))
      .returning();

    const decrypted = decryptFields(updated as Record<string, unknown>, CARD_ENCRYPTED_FIELDS);
    return NextResponse.json(decrypted);
  } catch (error) {
    if (error instanceof Response) throw error;
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getRequiredUser();
    const { id } = await params;

    // Verify ownership
    const owned = await verifyCardOwnership(id, user.id);
    if (!owned) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await db
      .update(cards)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(cards.id, id));

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof Response) throw error;
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
