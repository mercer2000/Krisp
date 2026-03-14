import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { supportChatSessions, supportChatMessages } from "@/lib/db/schema";
import { and, eq, gt, asc } from "drizzle-orm";

const sessionIdSchema = z.string().uuid();

/**
 * GET /api/support-chat/session/[sessionId]/messages
 * Returns messages for a support chat session, optionally filtered by timestamp.
 * No auth required (public widget polling endpoint).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    const parsed = sessionIdSchema.safeParse(sessionId);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid session ID", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const since = request.nextUrl.searchParams.get("since");

    const session = await db.query.supportChatSessions.findFirst({
      where: eq(supportChatSessions.id, sessionId),
      columns: { status: true },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    const whereClause = since
      ? and(
          eq(supportChatMessages.sessionId, sessionId),
          gt(supportChatMessages.createdAt, new Date(since))
        )
      : eq(supportChatMessages.sessionId, sessionId);

    const messages = await db.query.supportChatMessages.findMany({
      where: whereClause,
      orderBy: asc(supportChatMessages.createdAt),
    });

    return NextResponse.json({
      messages,
      sessionStatus: session.status,
    });
  } catch (error) {
    console.error("Error fetching session messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
