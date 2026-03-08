import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { brainChatSessions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { decryptRows, BRAIN_CHAT_SESSION_ENCRYPTED_FIELDS } from "@/lib/db/encryption-helpers";

/**
 * GET /api/brain/sessions
 * List all chat sessions for the current user
 */
export async function GET() {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessions = await db
      .select({
        id: brainChatSessions.id,
        title: brainChatSessions.title,
        createdAt: brainChatSessions.createdAt,
        updatedAt: brainChatSessions.updatedAt,
      })
      .from(brainChatSessions)
      .where(eq(brainChatSessions.userId, userId))
      .orderBy(desc(brainChatSessions.updatedAt));

    return NextResponse.json({ sessions: decryptRows(sessions, BRAIN_CHAT_SESSION_ENCRYPTED_FIELDS) });
  } catch (error) {
    console.error("Error fetching brain sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}
