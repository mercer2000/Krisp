import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { customPromptHistory } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { PROMPT_DEFAULTS } from "@/lib/ai/prompts";

/**
 * GET /api/settings/prompts/history?key=<promptKey>
 * Returns version history (last 5) for a prompt.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const key = request.nextUrl.searchParams.get("key");
    if (!key || !PROMPT_DEFAULTS[key]) {
      return NextResponse.json(
        { error: "Invalid prompt key" },
        { status: 400 }
      );
    }

    const history = await db
      .select({
        id: customPromptHistory.id,
        promptText: customPromptHistory.promptText,
        version: customPromptHistory.version,
        createdAt: customPromptHistory.createdAt,
      })
      .from(customPromptHistory)
      .where(
        and(
          eq(customPromptHistory.userId, userId),
          eq(customPromptHistory.promptKey, key)
        )
      )
      .orderBy(desc(customPromptHistory.version))
      .limit(5);

    return NextResponse.json({ history });
  } catch (error) {
    console.error("Error fetching prompt history:", error);
    return NextResponse.json(
      { error: "Failed to fetch prompt history" },
      { status: 500 }
    );
  }
}
