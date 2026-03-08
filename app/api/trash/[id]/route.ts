import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { cards, columns, boards, actionItems } from "@/lib/db/schema";
import { eq, and, isNotNull } from "drizzle-orm";
import sql from "@/lib/krisp/db";
import { restoreEmail, permanentlyDeleteEmail } from "@/lib/email/emails";
import {
  restoreMeeting,
  permanentlyDeleteMeeting,
} from "@/lib/krisp/webhookKeyPoints";
import type { TrashItemType } from "@/types";

/**
 * PATCH /api/trash/:id?type=card  — Restore a soft-deleted item
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as TrashItemType | null;

    if (!type || !["card", "action_item", "email", "meeting"].includes(type)) {
      return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 });
    }

    let restored = false;

    switch (type) {
      case "card": {
        // Verify ownership via board
        const [result] = await db
          .select({ id: cards.id })
          .from(cards)
          .innerJoin(columns, eq(cards.columnId, columns.id))
          .innerJoin(boards, eq(columns.boardId, boards.id))
          .where(
            and(eq(cards.id, id), eq(boards.userId, userId), isNotNull(cards.deletedAt))
          );
        if (result) {
          await db
            .update(cards)
            .set({ deletedAt: null, updatedAt: new Date() })
            .where(eq(cards.id, id));
          restored = true;
        }
        break;
      }
      case "action_item": {
        const [result] = await db
          .update(actionItems)
          .set({ deletedAt: null, updatedAt: new Date() })
          .where(
            and(
              eq(actionItems.id, id),
              eq(actionItems.userId, userId),
              isNotNull(actionItems.deletedAt)
            )
          )
          .returning({ id: actionItems.id });
        restored = !!result;
        break;
      }
      case "email": {
        const emailId = parseInt(id, 10);
        if (!isNaN(emailId)) {
          restored = await restoreEmail(emailId, userId);
        }
        break;
      }
      case "meeting": {
        const meetingId = parseInt(id, 10);
        if (!isNaN(meetingId)) {
          restored = await restoreMeeting(meetingId, userId);
        }
        break;
      }
    }

    if (!restored) {
      return NextResponse.json({ error: "Item not found in trash" }, { status: 404 });
    }

    return NextResponse.json({ message: "Item restored" });
  } catch (error) {
    console.error("Error restoring trash item:", error);
    return NextResponse.json(
      { error: "Failed to restore item" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/trash/:id?type=card  — Permanently delete a soft-deleted item
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as TrashItemType | null;

    if (!type || !["card", "action_item", "email", "meeting"].includes(type)) {
      return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 });
    }

    let deleted = false;

    switch (type) {
      case "card": {
        // Verify ownership and that it's soft-deleted
        const [result] = await db
          .select({ id: cards.id })
          .from(cards)
          .innerJoin(columns, eq(cards.columnId, columns.id))
          .innerJoin(boards, eq(columns.boardId, boards.id))
          .where(
            and(eq(cards.id, id), eq(boards.userId, userId), isNotNull(cards.deletedAt))
          );
        if (result) {
          await db.delete(cards).where(eq(cards.id, id));
          deleted = true;
        }
        break;
      }
      case "action_item": {
        const [result] = await db
          .delete(actionItems)
          .where(
            and(
              eq(actionItems.id, id),
              eq(actionItems.userId, userId),
              isNotNull(actionItems.deletedAt)
            )
          )
          .returning({ id: actionItems.id });
        deleted = !!result;
        break;
      }
      case "email": {
        const emailId = parseInt(id, 10);
        if (!isNaN(emailId)) {
          deleted = await permanentlyDeleteEmail(emailId, userId);
        }
        break;
      }
      case "meeting": {
        const meetingId = parseInt(id, 10);
        if (!isNaN(meetingId)) {
          deleted = await permanentlyDeleteMeeting(meetingId, userId);
        }
        break;
      }
    }

    if (!deleted) {
      return NextResponse.json({ error: "Item not found in trash" }, { status: 404 });
    }

    return NextResponse.json({ message: "Item permanently deleted" });
  } catch (error) {
    console.error("Error permanently deleting trash item:", error);
    return NextResponse.json(
      { error: "Failed to permanently delete item" },
      { status: 500 }
    );
  }
}
