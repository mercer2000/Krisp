import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { getMeetingById } from "@/lib/krisp/webhookKeyPoints";
import { analyzeOneMeeting } from "@/lib/krisp/analytics";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const meetingId = parseInt(id, 10);
    if (isNaN(meetingId)) {
      return NextResponse.json({ error: "Invalid meeting ID" }, { status: 400 });
    }

    const meeting = await getMeetingById(meetingId, userId);
    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    const analytics = analyzeOneMeeting(meeting);
    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Error fetching meeting analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch meeting analytics" },
      { status: 500 }
    );
  }
}
