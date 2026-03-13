import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { weeklyPlans, users } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { generateAssessment } from "@/lib/weekly-plan/assess";
import { sendAssessmentEmail } from "@/lib/weekly-plan/email";

/**
 * Cron endpoint to generate assessments and send emails for active weekly plans.
 * Protected by CRON_SECRET header.
 * Schedule: Every Friday at 5:00 PM UTC.
 *
 * For Vercel Cron, add to vercel.json:
 * { "crons": [{ "path": "/api/cron/weekly-assessment", "schedule": "0 17 * * 5" }] }
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
    // Find all active weekly plans that haven't had assessment emails sent
    const activePlans = await db
      .select({
        id: weeklyPlans.id,
        userId: weeklyPlans.userId,
        aiAssessment: weeklyPlans.aiAssessment,
        assessmentEmailSentAt: weeklyPlans.assessmentEmailSentAt,
      })
      .from(weeklyPlans)
      .where(
        and(
          eq(weeklyPlans.status, "active"),
          isNull(weeklyPlans.assessmentEmailSentAt),
          isNull(weeklyPlans.deletedAt)
        )
      );

    const results: Array<{ userId: string; planId: string; status: string; error?: string }> = [];

    for (const plan of activePlans) {
      try {
        // Generate assessment if not already generated
        if (!plan.aiAssessment) {
          try {
            await generateAssessment(plan.id, plan.userId);
          } catch (genErr) {
            console.error(`Failed to generate assessment for plan ${plan.id}:`, genErr);
            results.push({
              userId: plan.userId,
              planId: plan.id,
              status: "assessment_failed",
              error: genErr instanceof Error ? genErr.message : "Assessment generation failed",
            });
            continue;
          }
        }

        // Send assessment email
        try {
          await sendAssessmentEmail(plan.userId, plan.id);
          results.push({ userId: plan.userId, planId: plan.id, status: "sent" });
        } catch (emailErr) {
          console.error(`Failed to send assessment email for plan ${plan.id}:`, emailErr);
          results.push({
            userId: plan.userId,
            planId: plan.id,
            status: "assessed_no_email",
            error: emailErr instanceof Error ? emailErr.message : "Email send failed",
          });
        }
      } catch (err) {
        console.error(`Failed to process plan ${plan.id}:`, err);
        results.push({
          userId: plan.userId,
          planId: plan.id,
          status: "failed",
          error: err instanceof Error ? err.message : "Processing failed",
        });
      }
    }

    return NextResponse.json({
      message: `Processed ${activePlans.length} active plans`,
      results,
    });
  } catch (error) {
    console.error("Cron weekly assessment error:", error);
    return NextResponse.json(
      { error: "Cron job failed" },
      { status: 500 }
    );
  }
}
