import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { zapierIngestLogs } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

/**
 * GET /api/integrations/zapier/logs
 * Returns the last N Zapier ingest events for the current user.
 */
export async function GET(request: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "20", 10),
      100
    );

    const logs = await db
      .select({
        id: zapierIngestLogs.id,
        source: zapierIngestLogs.source,
        routingTarget: zapierIngestLogs.routingTarget,
        status: zapierIngestLogs.status,
        errorMessage: zapierIngestLogs.errorMessage,
        thoughtId: zapierIngestLogs.thoughtId,
        cardId: zapierIngestLogs.cardId,
        createdAt: zapierIngestLogs.createdAt,
      })
      .from(zapierIngestLogs)
      .where(eq(zapierIngestLogs.userId, userId))
      .orderBy(desc(zapierIngestLogs.createdAt))
      .limit(limit);

    return NextResponse.json({ data: logs });
  } catch (error) {
    console.error("Error fetching Zapier logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch ingest logs" },
      { status: 500 }
    );
  }
}
