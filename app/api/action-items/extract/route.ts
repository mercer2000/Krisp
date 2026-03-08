import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { extractActionItemsForMeeting } from "@/lib/actions/extractActionItems";
import { db } from "@/lib/db";
import { actionItems } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { meetingId, boardId, force } = await request.json();
    if (!meetingId || typeof meetingId !== "number") {
      return NextResponse.json(
        { error: "meetingId is required and must be a number" },
        { status: 400 }
      );
    }

    // If force re-extract, delete existing action items for this meeting first
    if (force) {
      await db
        .delete(actionItems)
        .where(
          and(
            eq(actionItems.userId, userId),
            eq(actionItems.meetingId, meetingId)
          )
        );
    }

    const result = await extractActionItemsForMeeting(
      meetingId,
      userId,
      boardId || undefined,
      "manual"
    );

    return NextResponse.json({
      message: `Extracted ${result.actionItems.length} action items${result.cardsCreated > 0 ? `, created ${result.cardsCreated} cards` : ""}`,
      actionItems: result.actionItems,
      cardsCreated: result.cardsCreated,
    });
  } catch (error) {
    console.error("Error extracting action items:", error);
    return NextResponse.json(
      { error: "Failed to extract action items" },
      { status: 500 }
    );
  }
}
