import { NextRequest, NextResponse } from "next/server";
import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { db } from "@/lib/db";
import { weeklyPlans, dailyThemes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  decryptFields,
  decryptRows,
  WEEKLY_PLAN_ENCRYPTED_FIELDS,
  DAILY_THEME_ENCRYPTED_FIELDS,
} from "@/lib/db/encryption-helpers";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const user = await getRequiredUser();
    const { planId } = await params;

    const [plan] = await db
      .select()
      .from(weeklyPlans)
      .where(
        and(eq(weeklyPlans.id, planId), eq(weeklyPlans.userId, user.id))
      );

    if (!plan || plan.deletedAt) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const themes = await db
      .select()
      .from(dailyThemes)
      .where(eq(dailyThemes.weeklyPlanId, planId));

    const decryptedPlan = decryptFields(plan, WEEKLY_PLAN_ENCRYPTED_FIELDS);
    const decryptedThemes = decryptRows(themes, DAILY_THEME_ENCRYPTED_FIELDS);

    return NextResponse.json({
      ...decryptedPlan,
      dailyThemes: decryptedThemes,
    });
  } catch (error) {
    if (error instanceof Response) throw error;
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const user = await getRequiredUser();
    const { planId } = await params;

    const result = await db
      .update(weeklyPlans)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(
        and(eq(weeklyPlans.id, planId), eq(weeklyPlans.userId, user.id))
      )
      .returning({ id: weeklyPlans.id });

    if (result.length === 0) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Response) throw error;
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
