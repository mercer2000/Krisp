import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRequiredAdmin } from "@/lib/auth/getRequiredAdmin";
import { claimSession } from "@/lib/support/agent-routing";
import { db } from "@/lib/db";
import { supportChatSessions, supportChatMessages } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

const claimSchema = z.object({
  sessionId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const admin = await getRequiredAdmin();

    const body = await request.json();
    const { sessionId } = claimSchema.parse(body);

    await claimSession(sessionId, admin.id);

    // Fetch the full session detail
    const [session] = await db
      .select()
      .from(supportChatSessions)
      .where(eq(supportChatSessions.id, sessionId))
      .limit(1);

    return NextResponse.json({ ok: true, session });
  } catch (error) {
    console.error("Error claiming session:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.flatten() },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message === "Session is not pending an agent") {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
