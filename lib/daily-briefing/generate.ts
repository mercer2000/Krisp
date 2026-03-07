import { chatCompletion } from "@/lib/ai/client";
import { resolvePrompt } from "@/lib/ai/resolvePrompt";
import { PROMPT_DAILY_BRIEFING } from "@/lib/ai/prompts";
import { db } from "@/lib/db";
import {
  dailyBriefings,
  calendarEvents,
  cards,
  columns,
  boards,
  emails,
  actionItems,
} from "@/lib/db/schema";
import { eq, and, gte, lte, isNull, desc, sql } from "drizzle-orm";
import {
  encryptFields,
  decryptRows,
  CARD_ENCRYPTED_FIELDS,
  EMAIL_ENCRYPTED_FIELDS,
  ACTION_ITEM_ENCRYPTED_FIELDS,
  CALENDAR_EVENT_ENCRYPTED_FIELDS,
  DAILY_BRIEFING_ENCRYPTED_FIELDS,
} from "@/lib/db/encryption-helpers";

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

/**
 * Gather all data relevant for today's briefing.
 */
async function gatherBriefingData(userId: string) {
  const now = new Date();
  const todayStr = toDateStr(now);
  const todayStart = new Date(todayStr + "T00:00:00Z");
  const todayEnd = new Date(todayStr + "T23:59:59.999Z");
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [overdueCards, todayEvents, recentEmails, openActions] =
    await Promise.all([
      // Overdue Kanban cards
      db
        .select({
          id: cards.id,
          title: cards.title,
          dueDate: cards.dueDate,
          priority: cards.priority,
          columnTitle: columns.title,
          boardTitle: boards.title,
        })
        .from(cards)
        .innerJoin(columns, eq(cards.columnId, columns.id))
        .innerJoin(boards, eq(columns.boardId, boards.id))
        .where(
          and(
            eq(boards.userId, userId),
            eq(cards.archived, false),
            isNull(cards.deletedAt),
            sql`${cards.dueDate} < ${todayStr}`
          )
        )
        .orderBy(cards.dueDate)
        .limit(20),

      // Today's calendar events
      db
        .select({
          id: calendarEvents.id,
          subject: calendarEvents.subject,
          startDateTime: calendarEvents.startDateTime,
          endDateTime: calendarEvents.endDateTime,
          location: calendarEvents.location,
          isAllDay: calendarEvents.isAllDay,
          organizerName: calendarEvents.organizerName,
          attendees: calendarEvents.attendees,
        })
        .from(calendarEvents)
        .where(
          and(
            eq(calendarEvents.tenantId, userId),
            gte(calendarEvents.startDateTime, todayStart),
            lte(calendarEvents.startDateTime, todayEnd),
            eq(calendarEvents.isCancelled, false)
          )
        )
        .orderBy(calendarEvents.startDateTime),

      // Recent emails (last 24 hours)
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
            isNull(emails.deletedAt),
            gte(emails.receivedAt, twentyFourHoursAgo)
          )
        )
        .orderBy(desc(emails.receivedAt))
        .limit(30),

      // Open action items (due today or overdue)
      db
        .select({
          id: actionItems.id,
          title: actionItems.title,
          dueDate: actionItems.dueDate,
          priority: actionItems.priority,
          status: actionItems.status,
          assignee: actionItems.assignee,
        })
        .from(actionItems)
        .where(
          and(
            eq(actionItems.userId, userId),
            isNull(actionItems.deletedAt),
            sql`${actionItems.status} IN ('open', 'in_progress')`
          )
        )
        .orderBy(actionItems.dueDate)
        .limit(20),
    ]);

  return {
    overdueCards: decryptRows(
      overdueCards as Record<string, unknown>[],
      CARD_ENCRYPTED_FIELDS
    ) as typeof overdueCards,
    todayEvents: decryptRows(
      todayEvents as Record<string, unknown>[],
      CALENDAR_EVENT_ENCRYPTED_FIELDS
    ) as typeof todayEvents,
    recentEmails: decryptRows(
      recentEmails as Record<string, unknown>[],
      EMAIL_ENCRYPTED_FIELDS
    ) as typeof recentEmails,
    openActions: decryptRows(
      openActions as Record<string, unknown>[],
      ACTION_ITEM_ENCRYPTED_FIELDS
    ) as typeof openActions,
  };
}

/**
 * Build the AI prompt from gathered data and get the briefing HTML.
 */
async function generateBriefingContent(
  data: Awaited<ReturnType<typeof gatherBriefingData>>,
  userId: string
) {
  const todayStr = toDateStr(new Date());

  const overdueSection = data.overdueCards
    .map(
      (c) =>
        `- [${c.priority}] "${c.title}" — due ${c.dueDate}, in ${c.boardTitle}/${c.columnTitle}`
    )
    .join("\n");

  const eventsSection = data.todayEvents
    .map((e) => {
      const start = new Date(e.startDateTime).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
      const end = new Date(e.endDateTime).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
      return `- "${e.subject || "Untitled"}" ${e.isAllDay ? "(All day)" : `${start} - ${end}`}${e.location ? ` at ${e.location}` : ""}`;
    })
    .join("\n");

  const emailsSection = data.recentEmails
    .slice(0, 15)
    .map((e) => {
      const preview = e.bodyPlainText ? e.bodyPlainText.slice(0, 200) : "";
      return `- From: ${e.sender} | Subject: "${e.subject || "No subject"}"\n  ${preview}`;
    })
    .join("\n");

  const actionsSection = data.openActions
    .map(
      (a) =>
        `- [${a.status}/${a.priority}] "${a.title}"${a.dueDate ? ` (due ${a.dueDate})` : ""}${a.assignee ? ` — assigned to ${a.assignee}` : ""}`
    )
    .join("\n");

  const instructions = await resolvePrompt(PROMPT_DAILY_BRIEFING, userId);

  const prompt = `${instructions}

Today's Date: ${todayStr}

## Overdue Kanban Cards (${data.overdueCards.length})
${overdueSection || "None."}

## Today's Meetings & Events (${data.todayEvents.length})
${eventsSection || "No meetings today."}

## Recent Emails — Last 24 Hours (${data.recentEmails.length})
${emailsSection || "No recent emails."}

## Open Action Items (${data.openActions.length})
${actionsSection || "No open action items."}`;

  return chatCompletion(prompt, { maxTokens: 3000, userId });
}

/**
 * Generate a daily briefing for a user.
 * Returns the created briefing ID.
 */
export async function generateDailyBriefing(userId: string): Promise<string> {
  const todayStr = toDateStr(new Date());

  // Create the briefing record in "generating" state
  const [briefing] = await db
    .insert(dailyBriefings)
    .values({
      userId,
      briefingDate: todayStr,
      status: "generating",
    })
    .returning({ id: dailyBriefings.id });

  try {
    const data = await gatherBriefingData(userId);
    const briefingHtml = await generateBriefingContent(data, userId);

    await db
      .update(dailyBriefings)
      .set(
        encryptFields(
          {
            status: "completed" as const,
            briefingHtml,
            overdueCardCount: data.overdueCards.length,
            emailCount: data.recentEmails.length,
            meetingCount: data.todayEvents.length,
            actionItemCount: data.openActions.length,
            updatedAt: new Date(),
          },
          DAILY_BRIEFING_ENCRYPTED_FIELDS
        )
      )
      .where(eq(dailyBriefings.id, briefing.id));

    return briefing.id;
  } catch (error) {
    await db
      .update(dailyBriefings)
      .set(
        encryptFields(
          {
            status: "failed" as const,
            briefingHtml:
              error instanceof Error ? error.message : "Unknown error",
            updatedAt: new Date(),
          },
          DAILY_BRIEFING_ENCRYPTED_FIELDS
        )
      )
      .where(eq(dailyBriefings.id, briefing.id));

    throw error;
  }
}
