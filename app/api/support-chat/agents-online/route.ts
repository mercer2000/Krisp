import { NextResponse } from "next/server";
import { isAnyAgentOnline } from "@/lib/support/agent-presence";

/**
 * GET /api/support-chat/agents-online
 * Checks if any support agents are currently online. No auth required.
 */
export async function GET() {
  try {
    const online = await isAnyAgentOnline();

    return NextResponse.json({ online });
  } catch (error) {
    console.error("Error checking agent availability:", error);
    return NextResponse.json(
      { error: "Failed to check agent availability" },
      { status: 500 }
    );
  }
}
