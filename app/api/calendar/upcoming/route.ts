import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { getUpcomingEvents, getCalendarEventsInRange } from "@/lib/graph/calendar";

/**
 * GET /api/calendar/upcoming
 * Get upcoming calendar events for the sidebar widget.
 *
 * Query params:
 *   limit: number of events (default 5, max 50)
 *   start: ISO date start (optional, for range queries)
 *   end: ISO date end (optional, for range queries)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const startParam = searchParams.get("start");
    const endParam = searchParams.get("end");
    const limitParam = searchParams.get("limit");

    const limit = Math.min(parseInt(limitParam || "5", 10) || 5, 50);

    let events;
    if (startParam && endParam) {
      events = await getCalendarEventsInRange(
        userId,
        new Date(startParam),
        new Date(endParam)
      );
    } else {
      events = await getUpcomingEvents(userId, limit);
    }

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
