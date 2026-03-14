import { logAndSend } from "@/lib/email/log";
import { db } from "@/lib/db";
import { weeklyReviews, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { TopicCluster, CrossDayPattern } from "@/types";
import {
  decryptFields,
  WEEKLY_REVIEW_ENCRYPTED_FIELDS,
} from "@/lib/db/encryption-helpers";

function buildEmailHtml(review: {
  weekStart: string;
  weekEnd: string;
  topicClusters: TopicCluster[];
  crossDayPatterns: CrossDayPattern[];
  unresolvedActionItems: Array<{ title: string; priority: string; dueDate: string | null }>;
  synthesisReport: string | null;
  meetingCount: number;
  emailCount: number;
  decisionCount: number;
  actionItemCount: number;
}): string {
  const formatDate = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const topicRows = review.topicClusters
    .map(
      (c) => `
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;">
          <strong style="color:#111827;">${c.topic}</strong>
          <p style="margin:4px 0 0;color:#6b7280;font-size:14px;">${c.summary}</p>
          <p style="margin:4px 0 0;color:#9ca3af;font-size:12px;">
            ${c.sources.map((s) => `${s.type}: ${s.title}`).join(" | ")}
          </p>
        </td>
      </tr>`
    )
    .join("");

  const patternRows = review.crossDayPatterns
    .map(
      (p) => `
      <li style="margin-bottom:8px;">
        <strong>${p.pattern}</strong> (${p.occurrences}x)
        <br/><span style="color:#6b7280;font-size:14px;">${p.details}</span>
      </li>`
    )
    .join("");

  const actionRows = review.unresolvedActionItems
    .slice(0, 10)
    .map(
      (a) => `
      <li style="margin-bottom:4px;">
        <span style="display:inline-block;padding:1px 6px;border-radius:4px;font-size:11px;font-weight:600;${
          a.priority === "urgent"
            ? "background:#fee2e2;color:#dc2626;"
            : a.priority === "high"
            ? "background:#ffedd5;color:#ea580c;"
            : "background:#dbeafe;color:#2563eb;"
        }">${a.priority}</span>
        ${a.title}${a.dueDate ? ` <span style="color:#9ca3af;">(due ${a.dueDate})</span>` : ""}
      </li>`
    )
    .join("");

  const synthesis = (review.synthesisReport || "")
    .split("\n\n")
    .map((p) => `<p style="margin:0 0 12px;line-height:1.6;">${p}</p>`)
    .join("");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:640px;margin:0 auto;padding:24px;">
    <div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <!-- Header -->
      <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:24px 32px;color:#fff;">
        <h1 style="margin:0;font-size:22px;">Weekly Review</h1>
        <p style="margin:6px 0 0;opacity:0.9;font-size:14px;">${formatDate(review.weekStart)} — ${formatDate(review.weekEnd)}</p>
      </div>

      <!-- Stats -->
      <div style="display:flex;padding:16px 32px;border-bottom:1px solid #e5e7eb;background:#f9fafb;">
        <div style="flex:1;text-align:center;">
          <div style="font-size:24px;font-weight:700;color:#6366f1;">${review.meetingCount}</div>
          <div style="font-size:12px;color:#6b7280;">Meetings</div>
        </div>
        <div style="flex:1;text-align:center;">
          <div style="font-size:24px;font-weight:700;color:#6366f1;">${review.emailCount}</div>
          <div style="font-size:12px;color:#6b7280;">Emails</div>
        </div>
        <div style="flex:1;text-align:center;">
          <div style="font-size:24px;font-weight:700;color:#6366f1;">${review.decisionCount}</div>
          <div style="font-size:12px;color:#6b7280;">Decisions</div>
        </div>
        <div style="flex:1;text-align:center;">
          <div style="font-size:24px;font-weight:700;color:#ef4444;">${review.actionItemCount}</div>
          <div style="font-size:12px;color:#6b7280;">Open Items</div>
        </div>
      </div>

      <!-- Synthesis -->
      <div style="padding:24px 32px;border-bottom:1px solid #e5e7eb;">
        <h2 style="margin:0 0 12px;font-size:16px;color:#111827;">Synthesis</h2>
        <div style="color:#374151;font-size:14px;">${synthesis}</div>
      </div>

      ${
        review.topicClusters.length > 0
          ? `<!-- Topic Clusters -->
      <div style="padding:24px 32px;border-bottom:1px solid #e5e7eb;">
        <h2 style="margin:0 0 12px;font-size:16px;color:#111827;">Topic Clusters</h2>
        <table style="width:100%;border-collapse:collapse;">${topicRows}</table>
      </div>`
          : ""
      }

      ${
        review.crossDayPatterns.length > 0
          ? `<!-- Cross-Day Patterns -->
      <div style="padding:24px 32px;border-bottom:1px solid #e5e7eb;">
        <h2 style="margin:0 0 12px;font-size:16px;color:#111827;">Cross-Day Patterns</h2>
        <ul style="margin:0;padding-left:20px;color:#374151;font-size:14px;">${patternRows}</ul>
      </div>`
          : ""
      }

      ${
        review.unresolvedActionItems.length > 0
          ? `<!-- Unresolved Action Items -->
      <div style="padding:24px 32px;">
        <h2 style="margin:0 0 12px;font-size:16px;color:#111827;">Unresolved Action Items</h2>
        <ul style="margin:0;padding-left:20px;color:#374151;font-size:14px;">${actionRows}</ul>
      </div>`
          : ""
      }
    </div>

    <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:16px;">
      Generated automatically by Krisp Weekly Review
    </p>
  </div>
</body>
</html>`;
}

/**
 * Send the weekly review email to the user and mark it as sent.
 */
export async function sendWeeklyReviewEmail(reviewId: string): Promise<void> {
  // Get the review
  const [review] = await db
    .select()
    .from(weeklyReviews)
    .where(eq(weeklyReviews.id, reviewId));

  if (!review || review.status !== "completed") {
    throw new Error("Review not found or not completed");
  }

  // Decrypt encrypted fields (synthesisReport)
  const decReview = decryptFields(review as Record<string, unknown>, WEEKLY_REVIEW_ENCRYPTED_FIELDS) as typeof review;

  // Get the user's email
  const [user] = await db
    .select({ email: users.email, displayName: users.displayName })
    .from(users)
    .where(eq(users.id, review.userId));

  if (!user) throw new Error("User not found");

  const formatDate = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

  const html = buildEmailHtml({
    weekStart: decReview.weekStart,
    weekEnd: decReview.weekEnd,
    topicClusters: decReview.topicClusters as TopicCluster[],
    crossDayPatterns: decReview.crossDayPatterns as CrossDayPattern[],
    unresolvedActionItems: decReview.unresolvedActionItems as Array<{
      title: string;
      priority: string;
      dueDate: string | null;
    }>,
    synthesisReport: decReview.synthesisReport,
    meetingCount: decReview.meetingCount,
    emailCount: decReview.emailCount,
    decisionCount: decReview.decisionCount,
    actionItemCount: decReview.actionItemCount,
  });

  await logAndSend({
    to: user.email,
    subject: `Weekly Review: ${formatDate(decReview.weekStart)} — ${formatDate(decReview.weekEnd)}`,
    html,
    userId: review.userId,
    type: "weekly_review",
  });

  // Mark as email sent
  await db
    .update(weeklyReviews)
    .set({ emailSentAt: new Date(), updatedAt: new Date() })
    .where(eq(weeklyReviews.id, reviewId));
}
