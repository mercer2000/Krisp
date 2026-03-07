import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  cards,
  columns,
  boards,
  emails,
  webhookKeyPoints,
} from "@/lib/db/schema";
import { and, eq, ilike, desc, isNull } from "drizzle-orm";
import {
  decryptRows,
  CARD_ENCRYPTED_FIELDS,
  EMAIL_ENCRYPTED_FIELDS,
  WEBHOOK_ENCRYPTED_FIELDS,
} from "@/lib/db/encryption-helpers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ thoughtId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type"); // "card" | "meeting" | "email"
  const q = searchParams.get("q") || "";

  if (!type || !["card", "meeting", "email"].includes(type)) {
    return NextResponse.json(
      { error: "type must be card, meeting, or email" },
      { status: 400 }
    );
  }

  const limit = 10;

  if (type === "card") {
    const rows = await db
      .select({
        id: cards.id,
        title: cards.title,
        priority: cards.priority,
      })
      .from(cards)
      .innerJoin(columns, eq(cards.columnId, columns.id))
      .innerJoin(boards, eq(columns.boardId, boards.id))
      .where(
        and(
          eq(boards.userId, session.user.id),
          isNull(cards.deletedAt),
          q ? ilike(cards.title, `%${q}%`) : undefined
        )
      )
      .orderBy(desc(cards.updatedAt))
      .limit(limit);

    return NextResponse.json({
      results: decryptRows(
        rows as Record<string, unknown>[],
        CARD_ENCRYPTED_FIELDS
      ),
    });
  }

  if (type === "meeting") {
    const rows = await db
      .select({
        id: webhookKeyPoints.id,
        meetingTitle: webhookKeyPoints.meetingTitle,
        meetingStartDate: webhookKeyPoints.meetingStartDate,
        meetingDuration: webhookKeyPoints.meetingDuration,
      })
      .from(webhookKeyPoints)
      .where(
        and(
          eq(webhookKeyPoints.userId, session.user.id),
          isNull(webhookKeyPoints.deletedAt),
          q ? ilike(webhookKeyPoints.meetingTitle, `%${q}%`) : undefined
        )
      )
      .orderBy(desc(webhookKeyPoints.meetingStartDate))
      .limit(limit);

    return NextResponse.json({
      results: decryptRows(
        rows as Record<string, unknown>[],
        WEBHOOK_ENCRYPTED_FIELDS
      ),
    });
  }

  if (type === "email") {
    const rows = await db
      .select({
        id: emails.id,
        sender: emails.sender,
        subject: emails.subject,
        receivedAt: emails.receivedAt,
      })
      .from(emails)
      .where(
        and(
          eq(emails.tenantId, session.user.id),
          isNull(emails.deletedAt),
          q ? ilike(emails.subject, `%${q}%`) : undefined
        )
      )
      .orderBy(desc(emails.receivedAt))
      .limit(limit);

    return NextResponse.json({
      results: decryptRows(
        rows as Record<string, unknown>[],
        EMAIL_ENCRYPTED_FIELDS
      ),
    });
  }

  return NextResponse.json({ results: [] });
}
