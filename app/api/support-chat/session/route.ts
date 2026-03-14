import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/support/chat-engine";

/**
 * POST /api/support-chat/session
 * Creates a new support chat session. No auth required (public widget endpoint).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { pageUrl, userAgent, referrer } = body ?? {};

    const sessionId = await createSession({ pageUrl, userAgent, referrer });

    return NextResponse.json({ sessionId });
  } catch (error) {
    console.error("Error creating support chat session:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}
