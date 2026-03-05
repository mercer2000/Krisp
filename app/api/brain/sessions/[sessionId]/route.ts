import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { brainChatSessions, brainChatMessages } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import {
  decryptFields,
  decryptRows,
  BRAIN_CHAT_SESSION_ENCRYPTED_FIELDS,
  BRAIN_CHAT_MESSAGE_ENCRYPTED_FIELDS,
} from "@/lib/db/encryption-helpers";

/**
 * GET /api/brain/sessions/[sessionId]
 * Fetch a session with all its messages
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await params;

    const [chatSession] = await db
      .select()
      .from(brainChatSessions)
      .where(
        and(
          eq(brainChatSessions.id, sessionId),
          eq(brainChatSessions.userId, userId)
        )
      );

    if (!chatSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const messages = await db
      .select({
        id: brainChatMessages.id,
        role: brainChatMessages.role,
        content: brainChatMessages.content,
        sourcesUsed: brainChatMessages.sourcesUsed,
        createdAt: brainChatMessages.createdAt,
      })
      .from(brainChatMessages)
      .where(eq(brainChatMessages.sessionId, sessionId))
      .orderBy(asc(brainChatMessages.createdAt));

    return NextResponse.json({
      session: decryptFields(chatSession, BRAIN_CHAT_SESSION_ENCRYPTED_FIELDS),
      messages: decryptRows(messages, BRAIN_CHAT_MESSAGE_ENCRYPTED_FIELDS),
    });
  } catch (error) {
    console.error("Error fetching brain session:", error);
    return NextResponse.json(
      { error: "Failed to fetch session" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/brain/sessions/[sessionId]
 * Delete a chat session and all its messages
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await params;

    // Verify ownership
    const [chatSession] = await db
      .select({ id: brainChatSessions.id })
      .from(brainChatSessions)
      .where(
        and(
          eq(brainChatSessions.id, sessionId),
          eq(brainChatSessions.userId, userId)
        )
      );

    if (!chatSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // CASCADE will delete messages
    await db
      .delete(brainChatSessions)
      .where(eq(brainChatSessions.id, sessionId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting brain session:", error);
    return NextResponse.json(
      { error: "Failed to delete session" },
      { status: 500 }
    );
  }
}
