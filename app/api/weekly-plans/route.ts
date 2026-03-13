import { NextRequest, NextResponse } from "next/server";
import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { db } from "@/lib/db";
import { weeklyPlans } from "@/lib/db/schema";
import { eq, and, isNull, desc } from "drizzle-orm";
import {
  decryptRows,
  WEEKLY_PLAN_ENCRYPTED_FIELDS,
} from "@/lib/db/encryption-helpers";
import { createWeeklyPlan } from "@/lib/weekly-plan/generate";

export async function GET() {
  try {
    const user = await getRequiredUser();

    const plans = await db
      .select()
      .from(weeklyPlans)
      .where(
        and(eq(weeklyPlans.userId, user.id), isNull(weeklyPlans.deletedAt)),
      )
      .orderBy(desc(weeklyPlans.weekStart));

    const decrypted = decryptRows(plans, WEEKLY_PLAN_ENCRYPTED_FIELDS);

    return NextResponse.json(decrypted);
  } catch (error) {
    if (error instanceof Response) throw error;
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getRequiredUser();

    const body = await request.json();
    const { weekStart, weekEnd, bigThreeCardIds, themes, weeklyReviewId } =
      body;

    if (!weekStart || !weekEnd || !bigThreeCardIds || !themes) {
      return NextResponse.json(
        { error: "Missing required fields: weekStart, weekEnd, bigThreeCardIds, themes" },
        { status: 400 },
      );
    }

    const planId = await createWeeklyPlan(
      user.id,
      weekStart,
      weekEnd,
      bigThreeCardIds,
      themes,
      weeklyReviewId,
    );

    return NextResponse.json({ id: planId }, { status: 201 });
  } catch (error) {
    if (error instanceof Response) throw error;
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
