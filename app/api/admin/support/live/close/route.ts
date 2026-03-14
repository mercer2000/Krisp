import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRequiredAdmin } from "@/lib/auth/getRequiredAdmin";
import { closeSession } from "@/lib/support/agent-routing";

const closeSchema = z.object({
  sessionId: z.string().uuid(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const admin = await getRequiredAdmin();

    const body = await request.json();
    const { sessionId, notes } = closeSchema.parse(body);

    await closeSession(sessionId, admin.id, notes);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error closing session:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.flatten() },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
