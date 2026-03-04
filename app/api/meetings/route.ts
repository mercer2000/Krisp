import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getRecentWebhookKeyPoints,
  getFilteredMeetings,
  type MeetingFilters,
} from "@/lib/krisp/webhookKeyPoints";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Check if any filter params are present
    const hasFilters =
      searchParams.has("dateFrom") ||
      searchParams.has("dateTo") ||
      searchParams.has("durationMin") ||
      searchParams.has("durationMax") ||
      searchParams.has("participants") ||
      searchParams.has("hasActionItems") ||
      searchParams.has("actionItemStatus") ||
      searchParams.has("hasTranscript") ||
      searchParams.has("keyword");

    if (hasFilters) {
      const filters: MeetingFilters = {};

      if (searchParams.has("dateFrom")) filters.dateFrom = searchParams.get("dateFrom")!;
      if (searchParams.has("dateTo")) filters.dateTo = searchParams.get("dateTo")!;
      if (searchParams.has("durationMin")) {
        const val = Number(searchParams.get("durationMin"));
        if (!isNaN(val)) filters.durationMin = val;
      }
      if (searchParams.has("durationMax")) {
        const val = Number(searchParams.get("durationMax"));
        if (!isNaN(val)) filters.durationMax = val;
      }
      if (searchParams.has("hasActionItems")) filters.hasActionItems = searchParams.get("hasActionItems") === "true";
      if (searchParams.has("hasTranscript")) filters.hasTranscript = searchParams.get("hasTranscript") === "true";
      if (searchParams.has("actionItemStatus")) filters.actionItemStatus = searchParams.get("actionItemStatus")!;
      if (searchParams.has("keyword")) filters.keyword = searchParams.get("keyword")!;
      if (searchParams.has("participants")) {
        filters.participants = searchParams.get("participants")!.split(",").map((p) => p.trim()).filter(Boolean);
      }

      const { meetings, total } = await getFilteredMeetings(userId, filters);
      return NextResponse.json({ meetings, total });
    }

    // No filters — return recent meetings (existing behavior)
    const meetings = await getRecentWebhookKeyPoints(userId, 50);
    return NextResponse.json({ meetings, total: meetings.length });
  } catch (error) {
    console.error("Error fetching meetings:", error);
    return NextResponse.json(
      { error: "Failed to fetch meetings" },
      { status: 500 }
    );
  }
}
