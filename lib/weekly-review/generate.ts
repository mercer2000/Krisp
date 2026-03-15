import { chatCompletion } from "@/lib/ai/client";
import { resolvePrompt } from "@/lib/ai/resolvePrompt";
import { PROMPT_WEEKLY_REVIEW } from "@/lib/ai/prompts";
import { db } from "@/lib/db";
import {
  weeklyReviews,
  webhookKeyPoints,
  emails,
  decisions,
  actionItems,
} from "@/lib/db/schema";
import { eq, and, gte, lte, isNull, desc } from "drizzle-orm";
import type { TopicCluster, CrossDayPattern } from "@/types";
import {
  encryptFields,
  decryptRows,
  WEBHOOK_ENCRYPTED_FIELDS,
  EMAIL_ENCRYPTED_FIELDS,
  DECISION_ENCRYPTED_FIELDS,
  ACTION_ITEM_ENCRYPTED_FIELDS,
  WEEKLY_REVIEW_ENCRYPTED_FIELDS,
} from "@/lib/db/encryption-helpers";

interface WeekRange {
  start: Date;
  end: Date;
}

/**
 * Get the Monday-to-Sunday range for the previous week relative to `now`.
 */
export function getPreviousWeekRange(now = new Date()): WeekRange {
  const d = new Date(now);
  // Go back to Monday of this week
  const dayOfWeek = d.getDay(); // 0=Sun .. 6=Sat
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  d.setDate(d.getDate() - diffToMonday - 7); // previous Monday
  d.setHours(0, 0, 0, 0);
  const start = new Date(d);
  const end = new Date(d);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

/**
 * Gather all data from the previous week for a given user.
 */
async function gatherWeekData(userId: string, week: WeekRange) {
  const [meetings, weekEmails, weekDecisions, openActions] = await Promise.all([
    // Meetings in the week
    db
      .select({
        id: webhookKeyPoints.id,
        meetingTitle: webhookKeyPoints.meetingTitle,
        meetingStartDate: webhookKeyPoints.meetingStartDate,
        rawContent: webhookKeyPoints.rawContent,
        speakers: webhookKeyPoints.speakers,
      })
      .from(webhookKeyPoints)
      .where(
        and(
          eq(webhookKeyPoints.userId, userId),
          gte(webhookKeyPoints.meetingStartDate, week.start),
          lte(webhookKeyPoints.meetingStartDate, week.end),
          isNull(webhookKeyPoints.deletedAt)
        )
      )
      .orderBy(desc(webhookKeyPoints.meetingStartDate)),

    // Emails in the week
    db
      .select({
        id: emails.id,
        subject: emails.subject,
        sender: emails.sender,
        receivedAt: emails.receivedAt,
        bodyPlainText: emails.bodyPlainText,
      })
      .from(emails)
      .where(
        and(
          eq(emails.tenantId, userId),
          gte(emails.receivedAt, week.start),
          lte(emails.receivedAt, week.end),
          isNull(emails.deletedAt)
        )
      )
      .orderBy(desc(emails.receivedAt)),

    // Decisions made in the week
    db
      .select({
        id: decisions.id,
        statement: decisions.statement,
        category: decisions.category,
        status: decisions.status,
        priority: decisions.priority,
        createdAt: decisions.createdAt,
      })
      .from(decisions)
      .where(
        and(
          eq(decisions.userId, userId),
          gte(decisions.createdAt, week.start),
          lte(decisions.createdAt, week.end),
          isNull(decisions.deletedAt)
        )
      )
      .orderBy(desc(decisions.createdAt)),

    // Open/in-progress action items (not just from this week)
    db
      .select({
        id: actionItems.id,
        title: actionItems.title,
        status: actionItems.status,
        priority: actionItems.priority,
        dueDate: actionItems.dueDate,
        assignee: actionItems.assignee,
        createdAt: actionItems.createdAt,
      })
      .from(actionItems)
      .where(
        and(
          eq(actionItems.userId, userId),
          isNull(actionItems.deletedAt)
        )
      )
      .orderBy(desc(actionItems.createdAt)),
  ]);

  return {
    meetings: decryptRows(meetings as Record<string, unknown>[], WEBHOOK_ENCRYPTED_FIELDS) as typeof meetings,
    weekEmails: decryptRows(weekEmails as Record<string, unknown>[], EMAIL_ENCRYPTED_FIELDS) as typeof weekEmails,
    weekDecisions: decryptRows(weekDecisions as Record<string, unknown>[], DECISION_ENCRYPTED_FIELDS) as typeof weekDecisions,
    openActions: decryptRows(openActions as Record<string, unknown>[], ACTION_ITEM_ENCRYPTED_FIELDS) as typeof openActions,
  };
}

/**
 * Use Claude to analyze the week's data and produce topic clusters,
 * cross-day patterns, and a synthesis report.
 */
async function analyzeWithClaude(data: Awaited<ReturnType<typeof gatherWeekData>>, week: WeekRange, userId: string) {
  const meetingSummaries = data.meetings
    .map((m) => {
      const date = m.meetingStartDate
        ? new Date(m.meetingStartDate).toLocaleDateString()
        : "unknown date";
      const content = m.rawContent ? m.rawContent.slice(0, 2000) : "No content";
      return `[Meeting] "${m.meetingTitle || "Untitled"}" on ${date}\n${content}`;
    })
    .join("\n\n---\n\n");

  const emailSummaries = data.weekEmails
    .slice(0, 50) // Limit to most recent 50
    .map((e) => {
      const date = new Date(e.receivedAt).toLocaleDateString();
      const body = e.bodyPlainText ? e.bodyPlainText.slice(0, 500) : "";
      return `[Email] "${e.subject || "No subject"}" from ${e.sender} on ${date}\n${body}`;
    })
    .join("\n\n---\n\n");

  const decisionSummaries = data.weekDecisions
    .map((d) => {
      const date = new Date(d.createdAt).toLocaleDateString();
      return `[Decision] "${d.statement}" (${d.category}, ${d.priority}) on ${date}`;
    })
    .join("\n");

  const unresolvedItems = data.openActions
    .filter((a) => a.status === "open" || a.status === "in_progress");

  const instructions = await resolvePrompt(PROMPT_WEEKLY_REVIEW, userId);

  const prompt = `${instructions}

Week: ${toDateStr(week.start)} to ${toDateStr(week.end)}

## Meetings This Week
${meetingSummaries || "No meetings this week."}

## Emails This Week
${emailSummaries || "No emails this week."}

## Decisions Made This Week
${decisionSummaries || "No decisions this week."}

## Open Action Items (all time)
${unresolvedItems.map((a) => `- [${a.status}] "${a.title}" (${a.priority}${a.dueDate ? `, due ${a.dueDate}` : ""}${a.assignee ? `, assigned to ${a.assignee}` : ""})`).join("\n") || "No open action items."}`;

  const text = await chatCompletion(prompt, {
    maxTokens: 4096,
    userId,
    triggerType: "weekly_review",
    promptKey: PROMPT_WEEKLY_REVIEW,
  });

  // Strip markdown code fences if present (e.g. ```json ... ```)
  const cleaned = text
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned) as {
      topicClusters: TopicCluster[];
      crossDayPatterns: CrossDayPattern[];
      synthesisReport: string;
    };
  } catch {
    // If the response isn't valid JSON, wrap it
    return {
      topicClusters: [] as TopicCluster[],
      crossDayPatterns: [] as CrossDayPattern[],
      synthesisReport: cleaned || "Failed to generate synthesis report.",
    };
  }
}

/**
 * Generate a weekly review for a given user and week.
 * Returns the created review ID.
 */
export async function generateWeeklyReview(
  userId: string,
  week?: WeekRange
): Promise<string> {
  const weekRange = week ?? getPreviousWeekRange();

  // Create the review record in "generating" state
  const [review] = await db
    .insert(weeklyReviews)
    .values({
      userId,
      weekStart: toDateStr(weekRange.start),
      weekEnd: toDateStr(weekRange.end),
      status: "generating",
    })
    .returning({ id: weeklyReviews.id });

  try {
    // Gather all data for the week
    const data = await gatherWeekData(userId, weekRange);

    // Analyze with Claude
    const analysis = await analyzeWithClaude(data, weekRange, userId);

    // Get unresolved action items for storage
    const unresolvedItems = data.openActions
      .filter((a) => a.status === "open" || a.status === "in_progress")
      .map((a) => ({
        id: a.id,
        title: a.title,
        priority: a.priority,
        dueDate: a.dueDate,
        assignee: a.assignee,
      }));

    // Update the review with results (encrypt synthesis report)
    await db
      .update(weeklyReviews)
      .set(encryptFields({
        status: "completed",
        topicClusters: analysis.topicClusters,
        crossDayPatterns: analysis.crossDayPatterns,
        unresolvedActionItems: unresolvedItems,
        synthesisReport: analysis.synthesisReport,
        meetingCount: data.meetings.length,
        emailCount: data.weekEmails.length,
        decisionCount: data.weekDecisions.length,
        actionItemCount: unresolvedItems.length,
        updatedAt: new Date(),
      }, WEEKLY_REVIEW_ENCRYPTED_FIELDS))
      .where(eq(weeklyReviews.id, review.id));

    return review.id;
  } catch (error) {
    // Mark as failed
    await db
      .update(weeklyReviews)
      .set(encryptFields({
        status: "failed",
        synthesisReport: error instanceof Error ? error.message : "Unknown error",
        updatedAt: new Date(),
      }, WEEKLY_REVIEW_ENCRYPTED_FIELDS))
      .where(eq(weeklyReviews.id, review.id));

    throw error;
  }
}
