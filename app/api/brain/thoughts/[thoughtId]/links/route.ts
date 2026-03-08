import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import {
  thoughtLinks,
  brainThoughts,
  cards,
  columns,
  boards,
  emails,
  webhookKeyPoints,
} from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import {
  decryptFields,
  CARD_ENCRYPTED_FIELDS,
  EMAIL_ENCRYPTED_FIELDS,
  WEBHOOK_ENCRYPTED_FIELDS,
} from "@/lib/db/encryption-helpers";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ thoughtId: string }> }
) {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { thoughtId } = await params;

  // Verify thought ownership
  const [thought] = await db
    .select({ id: brainThoughts.id })
    .from(brainThoughts)
    .where(
      and(
        eq(brainThoughts.id, thoughtId),
        eq(brainThoughts.userId, userId)
      )
    );

  if (!thought) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Fetch all links for this thought
  const links = await db
    .select()
    .from(thoughtLinks)
    .where(eq(thoughtLinks.thoughtId, thoughtId));

  // Hydrate linked entities with display info
  const hydratedLinks = await Promise.all(
    links.map(async (link) => {
      const base = {
        id: link.id,
        linkedEntityType: link.linkedEntityType,
        linkedEntityId: link.linkedEntityId,
        createdAt: link.createdAt,
      };

      if (link.linkedEntityType === "card") {
        const [card] = await db
          .select({
            id: cards.id,
            title: cards.title,
            priority: cards.priority,
            columnId: cards.columnId,
          })
          .from(cards)
          .innerJoin(columns, eq(cards.columnId, columns.id))
          .innerJoin(boards, eq(columns.boardId, boards.id))
          .where(
            and(eq(cards.id, link.linkedEntityId), eq(boards.userId, userId))
          );

        if (card) {
          const decrypted = decryptFields(
            card as Record<string, unknown>,
            CARD_ENCRYPTED_FIELDS
          );
          return { ...base, entity: { ...decrypted, _type: "card" } };
        }
      }

      if (link.linkedEntityType === "meeting") {
        const [meeting] = await db
          .select({
            id: webhookKeyPoints.id,
            meetingTitle: webhookKeyPoints.meetingTitle,
            meetingStartDate: webhookKeyPoints.meetingStartDate,
            meetingDuration: webhookKeyPoints.meetingDuration,
          })
          .from(webhookKeyPoints)
          .where(
            and(
              eq(webhookKeyPoints.id, parseInt(link.linkedEntityId, 10)),
              eq(webhookKeyPoints.userId, userId)
            )
          );

        if (meeting) {
          const decrypted = decryptFields(
            meeting as Record<string, unknown>,
            WEBHOOK_ENCRYPTED_FIELDS
          );
          return { ...base, entity: { ...decrypted, _type: "meeting" } };
        }
      }

      if (link.linkedEntityType === "email") {
        const [email] = await db
          .select({
            id: emails.id,
            sender: emails.sender,
            subject: emails.subject,
            receivedAt: emails.receivedAt,
          })
          .from(emails)
          .where(
            and(
              eq(emails.id, parseInt(link.linkedEntityId, 10)),
              eq(emails.tenantId, userId)
            )
          );

        if (email) {
          const decrypted = decryptFields(
            email as Record<string, unknown>,
            EMAIL_ENCRYPTED_FIELDS
          );
          return { ...base, entity: { ...decrypted, _type: "email" } };
        }
      }

      // Entity was deleted or inaccessible
      return { ...base, entity: null };
    })
  );

  return NextResponse.json({ links: hydratedLinks });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ thoughtId: string }> }
) {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { thoughtId } = await params;
  const body = await request.json();
  const { linkedEntityType, linkedEntityId } = body;

  if (
    !linkedEntityType ||
    !linkedEntityId ||
    !["card", "meeting", "email"].includes(linkedEntityType)
  ) {
    return NextResponse.json(
      { error: "Invalid linkedEntityType or linkedEntityId" },
      { status: 400 }
    );
  }

  // Verify thought ownership
  const [thought] = await db
    .select({ id: brainThoughts.id })
    .from(brainThoughts)
    .where(
      and(
        eq(brainThoughts.id, thoughtId),
        eq(brainThoughts.userId, session.user.id)
      )
    );

  if (!thought) {
    return NextResponse.json({ error: "Thought not found" }, { status: 404 });
  }

  // Verify linked entity exists and belongs to user
  if (linkedEntityType === "card") {
    const [card] = await db
      .select({ id: cards.id })
      .from(cards)
      .innerJoin(columns, eq(cards.columnId, columns.id))
      .innerJoin(boards, eq(columns.boardId, boards.id))
      .where(
        and(eq(cards.id, linkedEntityId), eq(boards.userId, session.user.id))
      );
    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }
  } else if (linkedEntityType === "meeting") {
    const [meeting] = await db
      .select({ id: webhookKeyPoints.id })
      .from(webhookKeyPoints)
      .where(
        and(
          eq(webhookKeyPoints.id, parseInt(linkedEntityId, 10)),
          eq(webhookKeyPoints.userId, session.user.id)
        )
      );
    if (!meeting) {
      return NextResponse.json(
        { error: "Meeting not found" },
        { status: 404 }
      );
    }
  } else if (linkedEntityType === "email") {
    const [email] = await db
      .select({ id: emails.id })
      .from(emails)
      .where(
        and(
          eq(emails.id, parseInt(linkedEntityId, 10)),
          eq(emails.tenantId, session.user.id)
        )
      );
    if (!email) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }
  }

  // Insert the link (unique constraint will prevent duplicates)
  try {
    const [link] = await db
      .insert(thoughtLinks)
      .values({
        thoughtId,
        userId: session.user.id,
        linkedEntityType,
        linkedEntityId: String(linkedEntityId),
      })
      .returning();

    return NextResponse.json({ link }, { status: 201 });
  } catch (err: unknown) {
    // Handle unique constraint violation
    if (
      err instanceof Error &&
      err.message.includes("uq_thought_link")
    ) {
      return NextResponse.json(
        { error: "Link already exists" },
        { status: 409 }
      );
    }
    throw err;
  }
}
