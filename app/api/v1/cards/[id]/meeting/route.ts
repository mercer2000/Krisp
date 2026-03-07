import { db } from "@/lib/db";
import { boards, columns, cards, actionItems } from "@/lib/db/schema";
import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getMeetingById } from "@/lib/krisp/webhookKeyPoints";

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

    // Find the action item linked to this card
    const [actionItem] = await db
      .select({
        id: actionItems.id,
        meetingId: actionItems.meetingId,
      })
      .from(actionItems)
      .where(
        and(
          eq(actionItems.cardId, id),
          eq(actionItems.userId, user.id),
        )
      );

    if (!actionItem || !actionItem.meetingId) {
      return NextResponse.json({ meeting: null });
    }

    // Fetch meeting details (decrypted)
    const meeting = await getMeetingById(actionItem.meetingId, user.id);
    if (!meeting) {
      return NextResponse.json({ meeting: null });
    }

    // Return only the fields needed for the card drawer link
    return NextResponse.json({
      meeting: {
        id: meeting.id,
        meeting_title: meeting.meeting_title,
        meeting_start_date: meeting.meeting_start_date,
        meeting_duration: meeting.meeting_duration,
        speakers: meeting.speakers,
      },
    });
  } catch (error) {
    if (error instanceof Response) throw error;
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
