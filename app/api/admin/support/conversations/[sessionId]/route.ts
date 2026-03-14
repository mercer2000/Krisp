import { NextRequest, NextResponse } from "next/server";
import { getRequiredAdmin } from "@/lib/auth/getRequiredAdmin";
import { db } from "@/lib/db";
import {
  supportChatSessions,
  supportChatMessages,
} from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  await getRequiredAdmin();

  const { sessionId } = await params;

  // Fetch session
  const [session] = await db
    .select()
    .from(supportChatSessions)
    .where(eq(supportChatSessions.id, sessionId))
    .limit(1);

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Fetch all messages ordered by creation time
  const messages = await db
    .select()
    .from(supportChatMessages)
    .where(eq(supportChatMessages.sessionId, sessionId))
    .orderBy(asc(supportChatMessages.createdAt));

  // Extract metadata fields for the client
  const meta = (session.metadata ?? {}) as Record<string, unknown>;

  return NextResponse.json({
    session: {
      id: session.id,
      pageUrl: (meta.pageUrl as string) ?? null,
      userAgent: (meta.userAgent as string) ?? null,
      createdAt: session.createdAt,
      messages,
    },
  });
}
