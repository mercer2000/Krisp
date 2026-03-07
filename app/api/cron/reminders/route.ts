import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { thoughtReminders, brainThoughts, users } from "@/lib/db/schema";
import { and, eq, lte } from "drizzle-orm";
import {
  decryptFields,
  BRAIN_THOUGHT_ENCRYPTED_FIELDS,
} from "@/lib/db/encryption-helpers";
import {
  sendReminderEmail,
  getNextSpacedInterval,
} from "@/lib/reminders/email";

/**
 * Cron endpoint to process due thought reminders.
 * Protected by CRON_SECRET header.
 * Schedule: Every 15 minutes.
 * For Vercel Cron, add to vercel.json crons array:
 * path: "/api/cron/reminders", schedule: "0,15,30,45 * * * *"
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
    const now = new Date();

    // Fetch all pending reminders that are due
    const dueReminders = await db
      .select({
        reminderId: thoughtReminders.id,
        thoughtId: thoughtReminders.thoughtId,
        userId: thoughtReminders.userId,
        scheduledAt: thoughtReminders.scheduledAt,
        mode: thoughtReminders.mode,
        repetitionNumber: thoughtReminders.repetitionNumber,
        note: thoughtReminders.note,
        thoughtContent: brainThoughts.content,
        thoughtSource: brainThoughts.source,
        thoughtTopic: brainThoughts.topic,
        userEmail: users.email,
      })
      .from(thoughtReminders)
      .innerJoin(
        brainThoughts,
        eq(thoughtReminders.thoughtId, brainThoughts.id)
      )
      .innerJoin(users, eq(thoughtReminders.userId, users.id))
      .where(
        and(
          eq(thoughtReminders.status, "pending"),
          lte(thoughtReminders.scheduledAt, now)
        )
      );

    const results: Array<{
      reminderId: string;
      status: string;
      error?: string;
    }> = [];

    for (const reminder of dueReminders) {
      try {
        // Decrypt thought content
        const decThought = decryptFields(
          { content: reminder.thoughtContent } as Record<string, unknown>,
          BRAIN_THOUGHT_ENCRYPTED_FIELDS
        );

        // Send reminder email
        await sendReminderEmail({
          userEmail: reminder.userEmail,
          thoughtContent: decThought.content as string,
          thoughtTopic: reminder.thoughtTopic,
          thoughtSource: reminder.thoughtSource,
          thoughtId: reminder.thoughtId,
          note: reminder.note,
          mode: reminder.mode,
          repetitionNumber: reminder.repetitionNumber,
        });

        // Mark as sent
        await db
          .update(thoughtReminders)
          .set({
            status: "sent",
            sentAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(thoughtReminders.id, reminder.reminderId));

        // If spaced repetition, schedule the next reminder
        if (reminder.mode === "spaced_repetition") {
          const nextRep = reminder.repetitionNumber + 1;
          const nextInterval = getNextSpacedInterval(nextRep);

          if (nextInterval !== null) {
            const nextDate = new Date();
            nextDate.setDate(nextDate.getDate() + nextInterval);

            await db.insert(thoughtReminders).values({
              thoughtId: reminder.thoughtId,
              userId: reminder.userId,
              scheduledAt: nextDate,
              mode: "spaced_repetition",
              status: "pending",
              repetitionNumber: nextRep,
              note: reminder.note,
            });
          }
        }

        results.push({ reminderId: reminder.reminderId, status: "sent" });
      } catch (err) {
        console.error(
          `Failed to process reminder ${reminder.reminderId}:`,
          err
        );
        results.push({
          reminderId: reminder.reminderId,
          status: "failed",
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      message: `Processed ${dueReminders.length} due reminders`,
      results,
    });
  } catch (error) {
    console.error("Cron reminders error:", error);
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}
