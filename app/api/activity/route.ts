import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { activityEvents } from "@/lib/db/schema";
import { eq, desc, and, gte, lte, inArray } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor"); // ISO date string for pagination
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);
    const eventTypes = searchParams.get("types"); // comma-separated filter
    const from = searchParams.get("from"); // ISO date string
    const to = searchParams.get("to"); // ISO date string

    const conditions = [eq(activityEvents.userId, userId)];

    if (cursor) {
      conditions.push(lte(activityEvents.createdAt, new Date(cursor)));
    }
    if (from) {
      conditions.push(gte(activityEvents.createdAt, new Date(from)));
    }
    if (to) {
      conditions.push(lte(activityEvents.createdAt, new Date(to)));
    }
    if (eventTypes) {
      const types = eventTypes.split(",") as (typeof activityEvents.$inferInsert.eventType)[];
      conditions.push(inArray(activityEvents.eventType, types));
    }

    const events = await db
      .select()
      .from(activityEvents)
      .where(and(...conditions))
      .orderBy(desc(activityEvents.createdAt))
      .limit(limit + 1); // fetch one extra to check if there are more

    const hasMore = events.length > limit;
    const items = hasMore ? events.slice(0, limit) : events;
    const nextCursor = hasMore ? items[items.length - 1].createdAt.toISOString() : null;

    return NextResponse.json({ events: items, nextCursor, hasMore });
  } catch (error) {
    console.error("Error fetching activity events:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity events" },
      { status: 500 }
    );
  }
}
