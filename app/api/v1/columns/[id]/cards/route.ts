import { db } from "@/lib/db";
import { boards, columns, cards } from "@/lib/db/schema";
import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { createCardSchema } from "@/lib/validators/schemas";
import { eq, and, max } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import {
  encryptFields,
  decryptFields,
  CARD_ENCRYPTED_FIELDS,
} from "@/lib/db/encryption-helpers";
import { dispatchWebhooks } from "@/lib/webhooks/dispatch";
import { logActivity } from "@/lib/activity/log";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getRequiredUser();
    const { id } = await params;

    const body = await request.json();
    const parsed = createCardSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // Verify column ownership via board
    const [col] = await db
      .select({ id: columns.id })
      .from(columns)
      .innerJoin(boards, eq(columns.boardId, boards.id))
      .where(and(eq(columns.id, id), eq(boards.userId, user.id)));

    if (!col) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Get max position of existing cards in the column
    const [result] = await db
      .select({ maxPosition: max(cards.position) })
      .from(cards)
      .where(eq(cards.columnId, id));

    const nextPosition = (result?.maxPosition ?? 0) + 1024;

    const [card] = await db
      .insert(cards)
      .values(
        encryptFields({
          ...parsed.data,
          columnId: id,
          position: nextPosition,
        }, CARD_ENCRYPTED_FIELDS)
      )
      .returning();

    const decrypted = decryptFields(card as Record<string, unknown>, CARD_ENCRYPTED_FIELDS);

    logActivity({
      userId: user.id,
      eventType: "card.created",
      title: `Created card "${decrypted.title}"`,
      description: decrypted.description as string | undefined,
      entityType: "card",
      entityId: card.id,
      metadata: { priority: decrypted.priority, columnId: id },
    });

    // Fire outbound webhooks (non-blocking)
    dispatchWebhooks(user.id, "card.created", card.id, {
      title: decrypted.title,
      description: decrypted.description,
      priority: decrypted.priority,
      columnId: id,
    }).catch(() => {});

    return NextResponse.json(decrypted, { status: 201 });
  } catch (error) {
    if (error instanceof Response) throw error;
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
