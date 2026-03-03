import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
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
} from "@/lib/db/schema";
import { eq, and, gte, lte, isNull, desc, sql, count } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
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
    ]);

    return NextResponse.json({
      config: userRow?.dashboardConfig ?? null,
      widgets: {
        upcomingEvents: upcomingEventsRows,
        overdueCards: overdueCardsRows,
        recentMeetings: recentMeetingsRows,
        meetingCount: meetingCountRows[0]?.value ?? 0,
        emailCount: emailCountRows[0]?.value ?? 0,
        actionItemsDue: actionItemsDueRows,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
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
