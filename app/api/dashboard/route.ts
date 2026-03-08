import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import {
  users,
  calendarEvents,
  cards,
  columns,
  boards,
  webhookKeyPoints,
  emails,
  actionItems,
  dailyBriefings,
  brainThoughts,
} from "@/lib/db/schema";
import { eq, and, gte, lte, isNull, desc, sql, count } from "drizzle-orm";
import {
  decryptRows,
  decryptFields,
  CARD_ENCRYPTED_FIELDS,
  WEBHOOK_ENCRYPTED_FIELDS,
  ACTION_ITEM_ENCRYPTED_FIELDS,
  CALENDAR_EVENT_ENCRYPTED_FIELDS,
  DAILY_BRIEFING_ENCRYPTED_FIELDS,
} from "@/lib/db/encryption-helpers";

export async function GET() {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const todayStr = now.toISOString().split("T")[0];

    // Run all queries in parallel
    const [
      userRow,
      upcomingEventsRows,
      overdueCardsRows,
      recentMeetingsRows,
      meetingCountRows,
      emailCountRows,
      actionItemsDueRows,
      latestBriefingRow,
      // Analytics: summary counts
      cardsCompletedWeek,
      cardsCompletedMonth,
      meetingsWeek,
      emailsWeek,
      thoughtsWeek,
      thoughtsMonth,
      actionItemsResolvedWeek,
      actionItemsResolvedMonth,
      // Analytics: sparklines
      dailyCards,
      dailyMeetings,
      dailyEmails,
      dailyThoughts,
      dailyActionItems,
    ] = await Promise.all([
      // User config
      db
        .select({ dashboardConfig: users.dashboardConfig })
        .from(users)
        .where(eq(users.id, userId))
        .then((rows) => rows[0]),

      // Upcoming Events (next 7 days)
      db
        .select({
          id: calendarEvents.id,
          subject: calendarEvents.subject,
          startDateTime: calendarEvents.startDateTime,
          endDateTime: calendarEvents.endDateTime,
          location: calendarEvents.location,
          isAllDay: calendarEvents.isAllDay,
          attendees: calendarEvents.attendees,
        })
        .from(calendarEvents)
        .where(
          and(
            eq(calendarEvents.tenantId, userId),
            gte(calendarEvents.startDateTime, now),
            lte(calendarEvents.startDateTime, sevenDaysFromNow),
            eq(calendarEvents.isCancelled, false)
          )
        )
        .orderBy(calendarEvents.startDateTime)
        .limit(5),

      // Overdue Cards (due date < today, not archived, not deleted)
      db
        .select({
          id: cards.id,
          title: cards.title,
          dueDate: cards.dueDate,
          priority: cards.priority,
          columnTitle: columns.title,
          boardTitle: boards.title,
          boardId: boards.id,
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
        .limit(5),

      // Recent Meetings (last 5)
      db
        .select({
          id: webhookKeyPoints.id,
          meetingTitle: webhookKeyPoints.meetingTitle,
          meetingStartDate: webhookKeyPoints.meetingStartDate,
          meetingDuration: webhookKeyPoints.meetingDuration,
        })
        .from(webhookKeyPoints)
        .where(
          and(
            eq(webhookKeyPoints.userId, userId),
            isNull(webhookKeyPoints.deletedAt)
          )
        )
        .orderBy(desc(webhookKeyPoints.meetingStartDate))
        .limit(5),

      // Meeting Count (last 30 days)
      db
        .select({ value: count() })
        .from(webhookKeyPoints)
        .where(
          and(
            eq(webhookKeyPoints.userId, userId),
            isNull(webhookKeyPoints.deletedAt),
            gte(webhookKeyPoints.meetingStartDate, thirtyDaysAgo)
          )
        ),

      // Email Count (last 30 days)
      db
        .select({ value: count() })
        .from(emails)
        .where(
          and(
            eq(emails.tenantId, userId),
            isNull(emails.deletedAt),
            gte(emails.receivedAt, thirtyDaysAgo)
          )
        ),

      // Action Items Due (open/in_progress, due today or overdue)
      db
        .select({
          id: actionItems.id,
          title: actionItems.title,
          dueDate: actionItems.dueDate,
          priority: actionItems.priority,
          status: actionItems.status,
        })
        .from(actionItems)
        .where(
          and(
            eq(actionItems.userId, userId),
            isNull(actionItems.deletedAt),
            sql`${actionItems.status} IN ('open', 'in_progress')`,
            sql`${actionItems.dueDate} <= ${todayStr}`
          )
        )
        .orderBy(actionItems.dueDate)
        .limit(5),

      // Latest daily briefing (today or most recent) — table may not exist yet
      db
        .select({
          id: dailyBriefings.id,
          briefingDate: dailyBriefings.briefingDate,
          status: dailyBriefings.status,
          briefingHtml: dailyBriefings.briefingHtml,
          overdueCardCount: dailyBriefings.overdueCardCount,
          emailCount: dailyBriefings.emailCount,
          meetingCount: dailyBriefings.meetingCount,
          actionItemCount: dailyBriefings.actionItemCount,
          createdAt: dailyBriefings.createdAt,
        })
        .from(dailyBriefings)
        .where(
          and(
            eq(dailyBriefings.userId, userId),
            isNull(dailyBriefings.deletedAt),
            eq(dailyBriefings.status, "completed")
          )
        )
        .orderBy(desc(dailyBriefings.briefingDate))
        .limit(1)
        .then((rows) => rows[0] ?? null)
        .catch(() => null),

      // ── Analytics: summary counts ─────────────────────────────────────

      // Cards completed (archived) this week
      db
        .select({ value: count() })
        .from(cards)
        .innerJoin(columns, eq(cards.columnId, columns.id))
        .innerJoin(boards, eq(columns.boardId, boards.id))
        .where(
          and(
            eq(boards.userId, userId),
            eq(cards.archived, true),
            isNull(cards.deletedAt),
            gte(cards.updatedAt, sevenDaysAgo)
          )
        ),

      // Cards completed this month
      db
        .select({ value: count() })
        .from(cards)
        .innerJoin(columns, eq(cards.columnId, columns.id))
        .innerJoin(boards, eq(columns.boardId, boards.id))
        .where(
          and(
            eq(boards.userId, userId),
            eq(cards.archived, true),
            isNull(cards.deletedAt),
            gte(cards.updatedAt, thirtyDaysAgo)
          )
        ),

      // Meetings this week
      db
        .select({ value: count() })
        .from(webhookKeyPoints)
        .where(
          and(
            eq(webhookKeyPoints.userId, userId),
            isNull(webhookKeyPoints.deletedAt),
            gte(webhookKeyPoints.meetingStartDate, sevenDaysAgo)
          )
        ),

      // Emails this week
      db
        .select({ value: count() })
        .from(emails)
        .where(
          and(
            eq(emails.tenantId, userId),
            isNull(emails.deletedAt),
            gte(emails.receivedAt, sevenDaysAgo)
          )
        ),

      // Thoughts this week
      db
        .select({ value: count() })
        .from(brainThoughts)
        .where(
          and(
            eq(brainThoughts.userId, userId),
            gte(brainThoughts.createdAt, sevenDaysAgo)
          )
        ),

      // Thoughts this month
      db
        .select({ value: count() })
        .from(brainThoughts)
        .where(
          and(
            eq(brainThoughts.userId, userId),
            gte(brainThoughts.createdAt, thirtyDaysAgo)
          )
        ),

      // Action items resolved this week
      db
        .select({ value: count() })
        .from(actionItems)
        .where(
          and(
            eq(actionItems.userId, userId),
            eq(actionItems.status, "completed"),
            isNull(actionItems.deletedAt),
            gte(actionItems.completedAt, sevenDaysAgo)
          )
        ),

      // Action items resolved this month
      db
        .select({ value: count() })
        .from(actionItems)
        .where(
          and(
            eq(actionItems.userId, userId),
            eq(actionItems.status, "completed"),
            isNull(actionItems.deletedAt),
            gte(actionItems.completedAt, thirtyDaysAgo)
          )
        ),

      // ── Analytics: sparkline data (last 30 days) ──────────────────────

      // Daily cards created
      db
        .select({
          date: sql<string>`DATE(${cards.createdAt})`.as("date"),
          count: sql<number>`COUNT(*)::int`.as("count"),
        })
        .from(cards)
        .innerJoin(columns, eq(cards.columnId, columns.id))
        .innerJoin(boards, eq(columns.boardId, boards.id))
        .where(
          and(
            eq(boards.userId, userId),
            isNull(cards.deletedAt),
            gte(cards.createdAt, thirtyDaysAgo)
          )
        )
        .groupBy(sql`DATE(${cards.createdAt})`),

      // Daily meetings
      db
        .select({
          date: sql<string>`DATE(${webhookKeyPoints.meetingStartDate})`.as("date"),
          count: sql<number>`COUNT(*)::int`.as("count"),
        })
        .from(webhookKeyPoints)
        .where(
          and(
            eq(webhookKeyPoints.userId, userId),
            isNull(webhookKeyPoints.deletedAt),
            gte(webhookKeyPoints.meetingStartDate, thirtyDaysAgo)
          )
        )
        .groupBy(sql`DATE(${webhookKeyPoints.meetingStartDate})`),

      // Daily emails
      db
        .select({
          date: sql<string>`DATE(${emails.receivedAt})`.as("date"),
          count: sql<number>`COUNT(*)::int`.as("count"),
        })
        .from(emails)
        .where(
          and(
            eq(emails.tenantId, userId),
            isNull(emails.deletedAt),
            gte(emails.receivedAt, thirtyDaysAgo)
          )
        )
        .groupBy(sql`DATE(${emails.receivedAt})`),

      // Daily thoughts
      db
        .select({
          date: sql<string>`DATE(${brainThoughts.createdAt})`.as("date"),
          count: sql<number>`COUNT(*)::int`.as("count"),
        })
        .from(brainThoughts)
        .where(
          and(
            eq(brainThoughts.userId, userId),
            gte(brainThoughts.createdAt, thirtyDaysAgo)
          )
        )
        .groupBy(sql`DATE(${brainThoughts.createdAt})`),

      // Daily action items resolved
      db
        .select({
          date: sql<string>`DATE(${actionItems.completedAt})`.as("date"),
          count: sql<number>`COUNT(*)::int`.as("count"),
        })
        .from(actionItems)
        .where(
          and(
            eq(actionItems.userId, userId),
            eq(actionItems.status, "completed"),
            isNull(actionItems.deletedAt),
            gte(actionItems.completedAt, thirtyDaysAgo)
          )
        )
        .groupBy(sql`DATE(${actionItems.completedAt})`),
    ]);

    // Decrypt sensitive fields before returning to frontend
    const decUpcomingEvents = decryptRows(upcomingEventsRows as Record<string, unknown>[], CALENDAR_EVENT_ENCRYPTED_FIELDS) as typeof upcomingEventsRows;
    const decOverdueCards = decryptRows(overdueCardsRows as Record<string, unknown>[], CARD_ENCRYPTED_FIELDS) as typeof overdueCardsRows;
    const decRecentMeetings = decryptRows(recentMeetingsRows as Record<string, unknown>[], WEBHOOK_ENCRYPTED_FIELDS) as typeof recentMeetingsRows;
    const decActionItemsDue = decryptRows(actionItemsDueRows as Record<string, unknown>[], ACTION_ITEM_ENCRYPTED_FIELDS) as typeof actionItemsDueRows;

    const decBriefing = latestBriefingRow
      ? decryptFields(latestBriefingRow as Record<string, unknown>, DAILY_BRIEFING_ENCRYPTED_FIELDS) as typeof latestBriefingRow
      : null;

    // Build sparkline series (last 30 days, filling gaps with 0)
    function buildSeries(
      rows: { date: string; count: number }[],
      days: number
    ) {
      const map = new Map<string, number>();
      for (const r of rows) map.set(String(r.date), r.count);
      const series: { date: string; value: number }[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const key = d.toISOString().split("T")[0];
        series.push({ date: key, value: map.get(key) ?? 0 });
      }
      return series;
    }

    const meetingCountVal = meetingCountRows[0]?.value ?? 0;
    const emailCountVal = emailCountRows[0]?.value ?? 0;

    return NextResponse.json({
      config: userRow?.dashboardConfig ?? null,
      widgets: {
        upcomingEvents: decUpcomingEvents,
        overdueCards: decOverdueCards,
        recentMeetings: decRecentMeetings,
        meetingCount: meetingCountVal,
        emailCount: emailCountVal,
        actionItemsDue: decActionItemsDue,
        dailyBriefing: decBriefing,
      },
      analytics: {
        summary: {
          cardsCompleted: {
            week: cardsCompletedWeek[0]?.value ?? 0,
            month: cardsCompletedMonth[0]?.value ?? 0,
          },
          meetingsAttended: {
            week: meetingsWeek[0]?.value ?? 0,
            month: meetingCountVal,
          },
          emailsProcessed: {
            week: emailsWeek[0]?.value ?? 0,
            month: emailCountVal,
          },
          thoughtsCaptured: {
            week: thoughtsWeek[0]?.value ?? 0,
            month: thoughtsMonth[0]?.value ?? 0,
          },
          actionItemsResolved: {
            week: actionItemsResolvedWeek[0]?.value ?? 0,
            month: actionItemsResolvedMonth[0]?.value ?? 0,
          },
        },
        sparklines: {
          cards: buildSeries(dailyCards, 30),
          meetings: buildSeries(dailyMeetings, 30),
          emails: buildSeries(dailyEmails, 30),
          thoughts: buildSeries(dailyThoughts, 30),
          actionItems: buildSeries(dailyActionItems, 30),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch dashboard data", detail: message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { config } = body;

    if (!config || !Array.isArray(config)) {
      return NextResponse.json(
        { error: "config must be an array of widget layout objects" },
        { status: 400 }
      );
    }

    await db
      .update(users)
      .set({ dashboardConfig: config, updatedAt: new Date() })
      .where(eq(users.id, userId));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error saving dashboard config:", error);
    return NextResponse.json(
      { error: "Failed to save dashboard config" },
      { status: 500 }
    );
  }
}
