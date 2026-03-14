import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requestAgent } from "@/lib/support/agent-routing";

const requestAgentSchema = z.object({
  sessionId: z.string().uuid(),
});

/**
 * POST /api/support-chat/request-agent
 * Requests a live agent for a support chat session. No auth required (public widget endpoint).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = requestAgentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { sessionId } = parsed.data;
    const result = await requestAgent(sessionId);

    return NextResponse.json({
      status: result.status,
      ticketId: result.ticketId,
    });
  } catch (error) {
    console.error("Error requesting agent:", error);
    return NextResponse.json(
      { error: "Failed to request agent" },
      { status: 500 }
    );
  }
}
