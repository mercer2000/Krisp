import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRequiredAdmin } from "@/lib/auth/getRequiredAdmin";
import { sendAgentMessage } from "@/lib/support/agent-chat";

const messageSchema = z.object({
  sessionId: z.string().uuid(),
  content: z.string().min(1).max(5000),
});

export async function POST(request: NextRequest) {
  try {
    const admin = await getRequiredAdmin();

    const body = await request.json();
    const { sessionId, content } = messageSchema.parse(body);

    const message = await sendAgentMessage(sessionId, admin.id, content);

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Error sending agent message:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.flatten() },
        { status: 400 }
      );
    }
    if (error instanceof Error) {
      if (
        error.message === "Session not found" ||
        error.message === "Session is not in agent_active state" ||
        error.message === "You are not assigned to this session"
      ) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        );
      }
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
