import { NextResponse } from "next/server";
import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { db } from "@/lib/db";
import { dailyThemes, weeklyPlans } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  decryptRows,
  DAILY_THEME_ENCRYPTED_FIELDS,
} from "@/lib/db/encryption-helpers";

export async function GET() {
  try {
    const user = await getRequiredUser();

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().slice(0, 10);

    const rows = await db
      .select({
        id: dailyThemes.id,
        theme: dailyThemes.theme,
        date: dailyThemes.date,
        aiRationale: dailyThemes.aiRationale,
        suggestedCardIds: dailyThemes.suggestedCardIds,
        weeklyPlanId: dailyThemes.weeklyPlanId,
        planStatus: weeklyPlans.status,
      })
      .from(dailyThemes)
      .innerJoin(weeklyPlans, eq(dailyThemes.weeklyPlanId, weeklyPlans.id))
      .where(
        and(
          eq(dailyThemes.userId, user.id),
          eq(dailyThemes.date, today),
        ),
      )
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json(null);
    }

    const row = rows[0];

    // Only return if the plan is active (not completed/cancelled)
    if (row.planStatus !== "active" && row.planStatus !== "planning") {
      return NextResponse.json(null);
    }

    const decrypted = decryptRows(
      [{ id: row.id, theme: row.theme, aiRationale: row.aiRationale, suggestedCardIds: row.suggestedCardIds, date: row.date }],
      DAILY_THEME_ENCRYPTED_FIELDS,
    );

    return NextResponse.json(decrypted[0]);
  } catch (error) {
    if (error instanceof Response) throw error;
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
