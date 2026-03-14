import { NextResponse } from "next/server";
import { getRequiredAdmin } from "@/lib/auth/getRequiredAdmin";
import { db } from "@/lib/db";
import {
  supportChatSessions,
  supportChatMessages,
} from "@/lib/db/schema";
import { eq, asc, sql, count } from "drizzle-orm";

export async function GET() {
  try {
    await getRequiredAdmin();

    // Get all pending_agent sessions ordered by escalated_at ASC
    const sessions = await db
      .select({
        id: supportChatSessions.id,
        metadata: supportChatSessions.metadata,
        status: supportChatSessions.status,
        escalatedAt: supportChatSessions.escalatedAt,
        createdAt: supportChatSessions.createdAt,
        messageCount: count(supportChatMessages.id),
        firstUserMessage: sql<string>`min(
          case when ${supportChatMessages.role} = 'user'
            then ${supportChatMessages.content}
          end
        )`,
      })
      .from(supportChatSessions)
      .leftJoin(
        supportChatMessages,
        eq(supportChatMessages.sessionId, supportChatSessions.id)
      )
      .where(eq(supportChatSessions.status, "pending_agent"))
      .groupBy(supportChatSessions.id)
      .orderBy(asc(supportChatSessions.escalatedAt));

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Error fetching queue:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
