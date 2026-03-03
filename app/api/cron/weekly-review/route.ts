import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { generateWeeklyReview } from "@/lib/weekly-review/generate";
import { sendWeeklyReviewEmail } from "@/lib/weekly-review/email";

/**
 * Cron endpoint to generate weekly reviews for all users.
 * Protected by CRON_SECRET header.
 * Schedule: Every Monday at 6:00 AM UTC.
 *
 * For Vercel Cron, add to vercel.json:
 * { "crons": [{ "path": "/api/cron/weekly-review", "schedule": "0 6 * * 1" }] }
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
    // Get all users
    const allUsers = await db
      .select({ id: users.id, email: users.email })
      .from(users);

    const results: Array<{ userId: string; status: string; error?: string }> = [];

    for (const user of allUsers) {
      try {
        const reviewId = await generateWeeklyReview(user.id);

        try {
          await sendWeeklyReviewEmail(reviewId);
          results.push({ userId: user.id, status: "sent" });
        } catch (emailErr) {
          console.error(`Failed to send email for user ${user.id}:`, emailErr);
          results.push({
            userId: user.id,
            status: "generated_no_email",
            error: emailErr instanceof Error ? emailErr.message : "Email send failed",
          });
        }
      } catch (err) {
        console.error(`Failed to generate review for user ${user.id}:`, err);
        results.push({
          userId: user.id,
          status: "failed",
          error: err instanceof Error ? err.message : "Generation failed",
        });
      }
    }

    return NextResponse.json({
      message: `Processed ${allUsers.length} users`,
      results,
    });
  } catch (error) {
    console.error("Cron weekly review error:", error);
    return NextResponse.json(
      { error: "Cron job failed" },
      { status: 500 }
    );
  }
}
