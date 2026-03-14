import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleSupportMessage } from "@/lib/support/chat-engine";

const messageSchema = z.object({
  sessionId: z.string().uuid(),
  message: z.string().min(1).max(5000),
});

/**
 * POST /api/support-chat/message
 * Sends a message in a support chat session. No auth required (public widget endpoint).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = messageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { sessionId, message } = parsed.data;
    const result = await handleSupportMessage(sessionId, message);

    return NextResponse.json({
      response: result.response,
      sessionId: result.sessionId,
    });
  } catch (error) {
    console.error("Error handling support chat message:", error);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}
