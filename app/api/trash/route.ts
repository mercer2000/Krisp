import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { cards, columns, boards, actionItems } from "@/lib/db/schema";
import { eq, isNotNull, and, desc } from "drizzle-orm";
import sql from "@/lib/krisp/db";
import type { TrashItem } from "@/types";
import {
  decryptFields,
  CARD_ENCRYPTED_FIELDS,
  ACTION_ITEM_ENCRYPTED_FIELDS,
} from "@/lib/db/encryption-helpers";
import { decryptNullable } from "@/lib/encryption";

const RETENTION_DAYS = 30;

function daysRemaining(deletedAt: Date): number {
  const expiresAt = new Date(deletedAt);
  expiresAt.setDate(expiresAt.getDate() + RETENTION_DAYS);
  const now = new Date();
  return Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [deletedCards, deletedActionItems, deletedMeetings, deletedEmails] =
      await Promise.all([
        // Cards: join through columns -> boards to scope by user
        db
          .select({
            id: cards.id,
            title: cards.title,
            deletedAt: cards.deletedAt,
          })
          .from(cards)
          .innerJoin(columns, eq(cards.columnId, columns.id))
          .innerJoin(boards, eq(columns.boardId, boards.id))
          .where(and(isNotNull(cards.deletedAt), eq(boards.userId, userId)))
          .orderBy(desc(cards.deletedAt)),

        // Action Items
        db
          .select({
            id: actionItems.id,
            title: actionItems.title,
            deletedAt: actionItems.deletedAt,
          })
          .from(actionItems)
          .where(
            and(isNotNull(actionItems.deletedAt), eq(actionItems.userId, userId))
          )
          .orderBy(desc(actionItems.deletedAt)),

        // Meetings (raw SQL via neon)
        sql`
          SELECT id, meeting_title AS title, deleted_at
          FROM webhook_key_points
          WHERE user_id = ${userId} AND deleted_at IS NOT NULL
          ORDER BY deleted_at DESC
        `,

        // Emails (raw SQL via neon)
        sql`
          SELECT id, COALESCE(subject, '(No subject)') AS title, deleted_at
          FROM emails
          WHERE tenant_id = ${userId} AND deleted_at IS NOT NULL
          ORDER BY deleted_at DESC
        `,
      ]);

    const items: TrashItem[] = [
      ...deletedCards.map((c) => {
        const dec = decryptFields(c as Record<string, unknown>, CARD_ENCRYPTED_FIELDS) as typeof c;
        return {
          id: dec.id,
          type: "card" as const,
          title: dec.title,
          deletedAt: dec.deletedAt!.toISOString(),
          daysRemaining: daysRemaining(dec.deletedAt!),
        };
      }),
      ...deletedActionItems.map((a) => {
        const dec = decryptFields(a as Record<string, unknown>, ACTION_ITEM_ENCRYPTED_FIELDS) as typeof a;
        return {
          id: dec.id,
          type: "action_item" as const,
          title: dec.title,
          deletedAt: dec.deletedAt!.toISOString(),
          daysRemaining: daysRemaining(dec.deletedAt!),
        };
      }),
      ...(deletedMeetings as Array<{ id: number; title: string; deleted_at: string }>).map((m) => ({
        id: m.id,
        type: "meeting" as const,
        title: decryptNullable(m.title) || "Untitled Meeting",
        deletedAt: new Date(m.deleted_at).toISOString(),
        daysRemaining: daysRemaining(new Date(m.deleted_at)),
      })),
      ...(deletedEmails as Array<{ id: number; title: string; deleted_at: string }>).map((e) => ({
        id: e.id,
        type: "email" as const,
        title: decryptNullable(e.title) || "(No subject)",
        deletedAt: new Date(e.deleted_at).toISOString(),
        daysRemaining: daysRemaining(new Date(e.deleted_at)),
      })),
    ];

    // Sort by deletedAt descending (most recently deleted first)
    items.sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error fetching trash items:", error);
    return NextResponse.json(
      { error: "Failed to fetch trash items" },
      { status: 500 }
    );
  }
}
