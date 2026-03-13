import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { weeklyPlans } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { rolloverWeek } from "@/lib/weekly-plan/rollover";

/**
 * Cron endpoint to roll over Focus column cards for all users with active weekly plans.
 * Protected by CRON_SECRET header.
 * Schedule: Every Monday at 6:00 AM UTC.
 *
 * For Vercel Cron, add to vercel.json:
 * { "crons": [{ "path": "/api/cron/weekly-rollover", "schedule": "0 6 * * 1" }] }
 */
export async function GET(request: NextRequest) {
  const cronSecret = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    cronSecret !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find all active weekly plans
    const activePlans = await db
      .select({
        id: weeklyPlans.id,
        userId: weeklyPlans.userId,
      })
      .from(weeklyPlans)
      .where(
        and(
          eq(weeklyPlans.status, "active"),
          isNull(weeklyPlans.deletedAt)
        )
      );

    const results: Array<{
      userId: string;
      planId: string;
      status: string;
      error?: string;
    }> = [];

    for (const plan of activePlans) {
      try {
        // Roll over Focus column cards back to their origin columns
        await rolloverWeek(plan.userId);

        // Mark the plan as completed since the week is over
        await db
          .update(weeklyPlans)
          .set({
            status: "assessed" as const,
            updatedAt: new Date(),
          })
          .where(eq(weeklyPlans.id, plan.id));

        results.push({
          userId: plan.userId,
          planId: plan.id,
          status: "rolled_over",
        });
      } catch (err) {
        console.error(
          `Failed to roll over plan ${plan.id} for user ${plan.userId}:`,
          err
        );
        results.push({
          userId: plan.userId,
          planId: plan.id,
          status: "failed",
          error: err instanceof Error ? err.message : "Rollover failed",
        });
      }
    }

    return NextResponse.json({
      message: `Processed ${activePlans.length} active plans`,
      results,
    });
  } catch (error) {
    console.error("Cron weekly rollover error:", error);
    return NextResponse.json(
      { error: "Cron job failed" },
      { status: 500 }
    );
  }
}
