import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { dailyBriefings } from "@/lib/db/schema";
import { eq, and, isNull, desc } from "drizzle-orm";
import { generateDailyBriefing } from "@/lib/daily-briefing/generate";
import {
  decryptFields,
  DAILY_BRIEFING_ENCRYPTED_FIELDS,
} from "@/lib/db/encryption-helpers";

/**
 * GET /api/daily-briefing
 * Returns the most recent daily briefing for the current user.
 * Optional ?date=YYYY-MM-DD query param to get a specific day's briefing.
 */
export async function GET(request: Request) {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const dateParam = url.searchParams.get("date");

    let query = db
      .select()
      .from(dailyBriefings)
      .where(
        and(
          eq(dailyBriefings.userId, userId),
          isNull(dailyBriefings.deletedAt),
          ...(dateParam
            ? [eq(dailyBriefings.briefingDate, dateParam)]
            : [])
        )
      )
      .orderBy(desc(dailyBriefings.briefingDate))
      .limit(1);

    const [briefing] = await query;

    if (!briefing) {
      return NextResponse.json({ briefing: null });
    }

    const decBriefing = decryptFields(
      briefing as Record<string, unknown>,
      DAILY_BRIEFING_ENCRYPTED_FIELDS
    ) as typeof briefing;

    return NextResponse.json({ briefing: decBriefing });
  } catch (error) {
    console.error("Error fetching daily briefing:", error);
    return NextResponse.json(
      { error: "Failed to fetch daily briefing" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/daily-briefing
 * Generate a new daily briefing for the current user.
 */
export async function POST() {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const briefingId = await generateDailyBriefing(userId);

    // Fetch the completed briefing
    const [briefing] = await db
      .select()
      .from(dailyBriefings)
      .where(eq(dailyBriefings.id, briefingId));

    const decBriefing = decryptFields(
      briefing as Record<string, unknown>,
      DAILY_BRIEFING_ENCRYPTED_FIELDS
    ) as typeof briefing;

    return NextResponse.json({ briefing: decBriefing });
  } catch (error) {
    console.error("Error generating daily briefing:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate daily briefing",
      },
      { status: 500 }
    );
  }
}
