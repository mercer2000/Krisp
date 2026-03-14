import { NextRequest, NextResponse } from "next/server";
import { getRequiredAdmin } from "@/lib/auth/getRequiredAdmin";
import { db } from "@/lib/db";
import {
  supportChatSessions,
  supportChatMessages,
} from "@/lib/db/schema";
import { sql, desc, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  await getRequiredAdmin();

  const params = request.nextUrl.searchParams;
  const page = Math.max(1, parseInt(params.get("page") || "1", 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(params.get("limit") || "20", 10) || 20)
  );
  const offset = (page - 1) * limit;

  // Get total count
  const [{ count: total }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(supportChatSessions);

  // Fetch sessions with message count and first message preview
  const rows = await db
    .select({
      id: supportChatSessions.id,
      metadata: supportChatSessions.metadata,
      createdAt: supportChatSessions.createdAt,
      messageCount: sql<number>`count(${supportChatMessages.id})::int`,
      firstMessage: sql<string>`min(
        case when ${supportChatMessages.role} = 'user'
          then left(${supportChatMessages.content}, 200)
        end
      )`,
    })
    .from(supportChatSessions)
    .leftJoin(
      supportChatMessages,
      eq(supportChatMessages.sessionId, supportChatSessions.id)
    )
    .groupBy(supportChatSessions.id)
    .orderBy(desc(supportChatSessions.createdAt))
    .limit(limit)
    .offset(offset);

  // Transform to flatten metadata fields for the client
  const sessions = rows.map((row) => {
    const meta = (row.metadata ?? {}) as Record<string, unknown>;
    return {
      id: row.id,
      messageCount: row.messageCount,
      firstMessage: row.firstMessage ?? "",
      pageUrl: (meta.pageUrl as string) ?? null,
      createdAt: row.createdAt,
    };
  });

  const totalPages = Math.ceil(total / limit);

  return NextResponse.json({
    sessions,
    total,
    page,
    totalPages,
  });
}
