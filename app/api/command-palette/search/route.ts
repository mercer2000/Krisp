import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { searchMeetingsSimple } from "@/lib/krisp/webhookKeyPoints";

/**
 * GET /api/command-palette/search?q=query
 * Lightweight unified search for the command palette.
 * Searches meetings by keyword (emails and cards can be added later).
 */
export async function GET(request: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const q = request.nextUrl.searchParams.get("q")?.trim();
    if (!q || q.length < 2) {
      return NextResponse.json({ meetings: [] });
    }

    const meetings = await searchMeetingsSimple(q, userId, 5);

    const meetingResults = meetings.map((m) => ({
      id: m.id,
      title: m.meeting_title || "Untitled Meeting",
      date: m.meeting_start_date
        ? new Date(m.meeting_start_date).toLocaleDateString()
        : null,
    }));

    return NextResponse.json({ meetings: meetingResults });
  } catch (error) {
    console.error("Command palette search error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
