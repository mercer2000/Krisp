import { logAndSend } from "@/lib/email/log";
import { db } from "@/lib/db";
import { weeklyPlans, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  decryptFields,
  WEEKLY_PLAN_ENCRYPTED_FIELDS,
} from "@/lib/db/encryption-helpers";
import type { AssessmentResult } from "./types";

function getScoreColor(score: number): string {
  if (score >= 8) return "#22c55e";
  if (score >= 5) return "#eab308";
  return "#ef4444";
}

function getStatusIcon(status: "completed" | "in_progress" | "not_started"): string {
  if (status === "completed") return "&#10003;";
  return "&#10007;";
}

function getStatusColor(status: "completed" | "in_progress" | "not_started"): string {
  if (status === "completed") return "#22c55e";
  return "#ef4444";
}

function getStatusLabel(status: "completed" | "in_progress" | "not_started"): string {
  if (status === "completed") return "Completed";
  if (status === "in_progress") return "In Progress";
  return "Not Started";
}

/**
 * Generate HTML email content for a weekly assessment.
 */
export function generateAssessmentEmail(
  plan: { weekStart: string; weekEnd: string },
  assessment: AssessmentResult
): string {
  const formatDate = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const scoreColor = getScoreColor(assessment.score);

  const bigThreeRows = assessment.bigThreeSummary
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #e5e7eb;vertical-align:top;width:28px;">
          <span style="display:inline-block;width:24px;height:24px;line-height:24px;text-align:center;border-radius:50%;font-size:14px;font-weight:700;color:#fff;background:${getStatusColor(item.status)};">${getStatusIcon(item.status)}</span>
        </td>
        <td style="padding:10px 16px;border-bottom:1px solid #e5e7eb;">
          <strong style="color:#111827;">${item.title}</strong>
          <span style="display:inline-block;margin-left:8px;padding:1px 8px;border-radius:4px;font-size:11px;font-weight:600;color:#6b7280;background:#f3f4f6;">${getStatusLabel(item.status)}</span>
          ${item.note ? `<p style="margin:4px 0 0;color:#6b7280;font-size:13px;">${item.note}</p>` : ""}
        </td>
      </tr>`
    )
    .join("");

  const highlightRows = assessment.highlights
    .map(
      (h) => `<li style="margin-bottom:6px;color:#374151;font-size:14px;">${h}</li>`
    )
    .join("");

  const carryForwardRows = assessment.carryForward
    .map(
      (c) => `
      <li style="margin-bottom:8px;">
        <strong style="color:#111827;">${c.title}</strong>
        <br/><span style="color:#6b7280;font-size:13px;">${c.reason}</span>
      </li>`
    )
    .join("");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://myopenbrain.com";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:640px;margin:0 auto;padding:24px;">
    <div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <!-- Header -->
      <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:24px 32px;color:#fff;">
        <h1 style="margin:0;font-size:22px;">Your Week in Review</h1>
        <p style="margin:6px 0 0;opacity:0.9;font-size:14px;">${formatDate(plan.weekStart)} — ${formatDate(plan.weekEnd)}</p>
      </div>

      <!-- Score Badge -->
      <div style="padding:24px 32px;text-align:center;border-bottom:1px solid #e5e7eb;">
        <div style="display:inline-block;width:72px;height:72px;line-height:72px;border-radius:50%;background:${scoreColor};color:#fff;font-size:28px;font-weight:700;">${assessment.score}</div>
        <p style="margin:8px 0 0;color:#6b7280;font-size:14px;">Weekly Score</p>
      </div>

      ${
        assessment.bigThreeSummary.length > 0
          ? `<!-- Hero Priorities Status -->
      <div style="padding:24px 32px;border-bottom:1px solid #e5e7eb;">
        <h2 style="margin:0 0 12px;font-size:16px;color:#111827;">Hero Priorities</h2>
        <table style="width:100%;border-collapse:collapse;">${bigThreeRows}</table>
      </div>`
          : ""
      }

      ${
        assessment.highlights.length > 0
          ? `<!-- Highlights -->
      <div style="padding:24px 32px;border-bottom:1px solid #e5e7eb;">
        <h2 style="margin:0 0 12px;font-size:16px;color:#111827;">Highlights</h2>
        <ul style="margin:0;padding-left:20px;">${highlightRows}</ul>
      </div>`
          : ""
      }

      ${
        assessment.carryForward.length > 0
          ? `<!-- Carry Forward -->
      <div style="padding:24px 32px;border-bottom:1px solid #e5e7eb;">
        <h2 style="margin:0 0 12px;font-size:16px;color:#111827;">Carry Forward</h2>
        <ul style="margin:0;padding-left:20px;font-size:14px;">${carryForwardRows}</ul>
      </div>`
          : ""
      }

      <!-- CTA -->
      <div style="padding:24px 32px;text-align:center;">
        <a href="${baseUrl}/weekly-reviews" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">Plan Next Week &rarr;</a>
      </div>
    </div>

    <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:16px;">
      Generated automatically by MyOpenBrain Weekly Assessment
    </p>
  </div>
</body>
</html>`;
}

/**
 * Send the weekly assessment email to the user and mark it as sent.
 */
export async function sendAssessmentEmail(
  userId: string,
  planId: string
): Promise<void> {
  // 1. Fetch the plan
  const [plan] = await db
    .select()
    .from(weeklyPlans)
    .where(and(eq(weeklyPlans.id, planId), eq(weeklyPlans.userId, userId)));

  if (!plan) {
    throw new Error("Weekly plan not found");
  }

  if (!plan.aiAssessment) {
    throw new Error("Plan has no assessment data");
  }

  // 2. Decrypt assessment
  const decPlan = decryptFields(
    plan as Record<string, unknown>,
    WEEKLY_PLAN_ENCRYPTED_FIELDS
  ) as typeof plan;

  const assessment: AssessmentResult = JSON.parse(decPlan.aiAssessment!);

  // 3. Get the user's email
  const [user] = await db
    .select({ email: users.email, displayName: users.displayName })
    .from(users)
    .where(eq(users.id, userId));

  if (!user) throw new Error("User not found");

  // 4. Generate the HTML
  const html = generateAssessmentEmail(
    { weekStart: decPlan.weekStart, weekEnd: decPlan.weekEnd },
    assessment
  );

  // 5. Send the email
  const formatDate = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

  await logAndSend({
    to: user.email,
    subject: `Your Week in Review: ${formatDate(decPlan.weekStart)} — ${formatDate(decPlan.weekEnd)}`,
    html,
    userId,
    type: "weekly_plan.assessment",
  });

  // 6. Mark as email sent
  await db
    .update(weeklyPlans)
    .set({ assessmentEmailSentAt: new Date(), updatedAt: new Date() })
    .where(eq(weeklyPlans.id, planId));
}
