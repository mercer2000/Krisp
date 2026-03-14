import { NextRequest, NextResponse } from "next/server";
import { getRequiredAdmin } from "@/lib/auth/getRequiredAdmin";
import { db } from "@/lib/db";
import {
  supportChatSessions,
  supportChatMessages,
} from "@/lib/db/schema";
import { eq, and, sql, count, desc } from "drizzle-orm";

export async function GET() {
  try {
    const admin = await getRequiredAdmin();

    // Get all agent_active sessions assigned to this admin
    const sessions = await db
      .select({
        id: supportChatSessions.id,
        metadata: supportChatSessions.metadata,
        status: supportChatSessions.status,
        assignedAgentId: supportChatSessions.assignedAgentId,
        escalatedAt: supportChatSessions.escalatedAt,
        createdAt: supportChatSessions.createdAt,
        updatedAt: supportChatSessions.updatedAt,
        messageCount: count(supportChatMessages.id),
        lastMessagePreview: sql<string>`left(
          (select ${supportChatMessages.content}
           from ${supportChatMessages}
           where ${supportChatMessages.sessionId} = ${supportChatSessions.id}
           order by ${supportChatMessages.createdAt} desc
           limit 1),
          100
        )`,
      })
      .from(supportChatSessions)
      .leftJoin(
        supportChatMessages,
        eq(supportChatMessages.sessionId, supportChatSessions.id)
      )
      .where(
        and(
          eq(supportChatSessions.status, "agent_active"),
          eq(supportChatSessions.assignedAgentId, admin.id)
        )
      )
      .groupBy(supportChatSessions.id);

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Error fetching active sessions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
