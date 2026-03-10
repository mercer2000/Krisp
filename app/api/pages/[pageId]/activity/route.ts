import { NextRequest, NextResponse } from "next/server";
import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { db } from "@/lib/db";
import { activityEvents, pages, workspaces } from "@/lib/db/schema";
import { eq, and, desc, lte } from "drizzle-orm";

// GET /api/pages/[pageId]/activity — list activity events for a page
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> },
) {
  try {
    const user = await getRequiredUser();
    const { pageId } = await params;

    // Validate page access
    const [page] = await db.select().from(pages).where(eq(pages.id, pageId));
    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, page.workspaceId));
    if (!workspace || workspace.ownerId !== user.id) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);

    const conditions = [
      eq(activityEvents.userId, user.id),
      eq(activityEvents.entityId, pageId),
    ];

    if (cursor) {
      conditions.push(lte(activityEvents.createdAt, new Date(cursor)));
    }

    const events = await db
      .select()
      .from(activityEvents)
      .where(and(...conditions))
      .orderBy(desc(activityEvents.createdAt))
      .limit(limit + 1);

    const hasMore = events.length > limit;
    const items = hasMore ? events.slice(0, limit) : events;
    const nextCursor = hasMore ? items[items.length - 1].createdAt.toISOString() : null;

    return NextResponse.json({ events: items, nextCursor, hasMore });
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("Error fetching page activity:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
