import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { generateDailyBriefing } from "@/lib/daily-briefing/generate";
import { sendDailyBriefingEmail } from "@/lib/daily-briefing/email";

/**
 * Cron endpoint to generate daily briefings for all users.
 * Protected by CRON_SECRET header.
 * Schedule: Every day at 6:00 AM UTC.
 *
 * For Vercel Cron, add to vercel.json:
 * { "crons": [{ "path": "/api/cron/daily-briefing", "schedule": "0 6 * * *" }] }
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
    const allUsers = await db
      .select({ id: users.id, email: users.email })
      .from(users);

    const results: Array<{
      userId: string;
      status: string;
      error?: string;
    }> = [];

    for (const user of allUsers) {
      try {
        const briefingId = await generateDailyBriefing(user.id);

        try {
          await sendDailyBriefingEmail(briefingId);
          results.push({ userId: user.id, status: "sent" });
        } catch (emailErr) {
          console.error(
            `Failed to send briefing email for user ${user.id}:`,
            emailErr
          );
          results.push({
            userId: user.id,
            status: "generated_no_email",
            error:
              emailErr instanceof Error
                ? emailErr.message
                : "Email send failed",
          });
        }
      } catch (err) {
        console.error(
          `Failed to generate briefing for user ${user.id}:`,
          err
        );
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
    console.error("Cron daily briefing error:", error);
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}
