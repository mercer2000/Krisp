import { logAndSend } from "@/lib/email/log";
import { db } from "@/lib/db";
import { dailyBriefings, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  decryptFields,
  DAILY_BRIEFING_ENCRYPTED_FIELDS,
} from "@/lib/db/encryption-helpers";

function buildEmailHtml(briefing: {
  briefingDate: string;
  briefingHtml: string | null;
  overdueCardCount: number;
  emailCount: number;
  meetingCount: number;
  actionItemCount: number;
}): string {
  const formatDate = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:640px;margin:0 auto;padding:24px;">
    <div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <!-- Header -->
      <div style="background:linear-gradient(135deg,#0ea5e9,#6366f1);padding:24px 32px;color:#fff;">
        <h1 style="margin:0;font-size:22px;">Good Morning</h1>
        <p style="margin:6px 0 0;opacity:0.9;font-size:14px;">${formatDate(briefing.briefingDate)}</p>
      </div>

      <!-- Stats -->
      <div style="display:flex;padding:16px 32px;border-bottom:1px solid #e5e7eb;background:#f9fafb;">
        <div style="flex:1;text-align:center;">
          <div style="font-size:24px;font-weight:700;color:#dc2626;">${briefing.overdueCardCount}</div>
          <div style="font-size:12px;color:#6b7280;">Overdue</div>
        </div>
        <div style="flex:1;text-align:center;">
          <div style="font-size:24px;font-weight:700;color:#6366f1;">${briefing.meetingCount}</div>
          <div style="font-size:12px;color:#6b7280;">Meetings</div>
        </div>
        <div style="flex:1;text-align:center;">
          <div style="font-size:24px;font-weight:700;color:#0ea5e9;">${briefing.emailCount}</div>
          <div style="font-size:12px;color:#6b7280;">Emails</div>
        </div>
        <div style="flex:1;text-align:center;">
          <div style="font-size:24px;font-weight:700;color:#ea580c;">${briefing.actionItemCount}</div>
          <div style="font-size:12px;color:#6b7280;">Actions</div>
        </div>
      </div>

      <!-- Briefing Content -->
      <div style="padding:24px 32px;color:#374151;font-size:14px;line-height:1.6;">
        ${briefing.briefingHtml || "<p>No briefing content available.</p>"}
      </div>
    </div>

    <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:16px;">
      Generated automatically by Krisp Daily Briefing
    </p>
  </div>
</body>
</html>`;
}

/**
 * Send the daily briefing email to the user and mark it as sent.
 */
export async function sendDailyBriefingEmail(
  briefingId: string
): Promise<void> {
  const [briefing] = await db
    .select()
    .from(dailyBriefings)
    .where(eq(dailyBriefings.id, briefingId));

  if (!briefing || briefing.status !== "completed") {
    throw new Error("Briefing not found or not completed");
  }

  const decBriefing = decryptFields(
    briefing as Record<string, unknown>,
    DAILY_BRIEFING_ENCRYPTED_FIELDS
  ) as typeof briefing;

  const [user] = await db
    .select({ email: users.email, displayName: users.displayName })
    .from(users)
    .where(eq(users.id, briefing.userId));

  if (!user) throw new Error("User not found");

  const formatDate = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

  const html = buildEmailHtml({
    briefingDate: decBriefing.briefingDate,
    briefingHtml: decBriefing.briefingHtml,
    overdueCardCount: decBriefing.overdueCardCount,
    emailCount: decBriefing.emailCount,
    meetingCount: decBriefing.meetingCount,
    actionItemCount: decBriefing.actionItemCount,
  });

  await logAndSend({
    to: user.email,
    subject: `Daily Briefing: ${formatDate(decBriefing.briefingDate)}`,
    html,
    userId: briefing.userId,
    type: "daily_briefing",
  });

  await db
    .update(dailyBriefings)
    .set({ emailSentAt: new Date(), updatedAt: new Date() })
    .where(eq(dailyBriefings.id, briefingId));
}
