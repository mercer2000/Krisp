import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import {
  cards,
  columns,
  boards,
  webhookKeyPoints,
  emails,
  brainThoughts,
} from "@/lib/db/schema";
import { eq, and, gte, isNull, sql } from "drizzle-orm";

interface DayActivity {
  date: string;
  total: number;
  cards: number;
  meetings: number;
  emails: number;
  thoughts: number;
}

export async function GET() {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Look back ~52 weeks (364 days) to fill a full year grid
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 364);
    startDate.setHours(0, 0, 0, 0);

    // Run all activity count queries in parallel, grouped by date
    const [cardCounts, meetingCounts, emailCounts, thoughtCounts] =
      await Promise.all([
        // Cards created (join through columns -> boards to filter by userId)
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
              gte(cards.createdAt, startDate)
            )
          )
          .groupBy(sql`DATE(${cards.createdAt})`),

        // Meetings attended
        db
          .select({
            date: sql<string>`DATE(${webhookKeyPoints.meetingStartDate})`.as(
              "date"
            ),
            count: sql<number>`COUNT(*)::int`.as("count"),
          })
          .from(webhookKeyPoints)
          .where(
            and(
              eq(webhookKeyPoints.userId, userId),
              isNull(webhookKeyPoints.deletedAt),
              gte(webhookKeyPoints.meetingStartDate, startDate)
            )
          )
          .groupBy(sql`DATE(${webhookKeyPoints.meetingStartDate})`),

        // Emails processed
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
              gte(emails.receivedAt, startDate)
            )
          )
          .groupBy(sql`DATE(${emails.receivedAt})`),

        // Thoughts captured
        db
          .select({
            date: sql<string>`DATE(${brainThoughts.createdAt})`.as("date"),
            count: sql<number>`COUNT(*)::int`.as("count"),
          })
          .from(brainThoughts)
          .where(
            and(
              eq(brainThoughts.userId, userId),
              gte(brainThoughts.createdAt, startDate)
            )
          )
          .groupBy(sql`DATE(${brainThoughts.createdAt})`),
      ]);

    // Build a map of date -> activity counts
    const activityMap = new Map<string, DayActivity>();

    // Initialize all 365 days
    for (let i = 364; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      activityMap.set(key, {
        date: key,
        total: 0,
        cards: 0,
        meetings: 0,
        emails: 0,
        thoughts: 0,
      });
    }

    // Merge counts into the map
    for (const row of cardCounts) {
      const key = String(row.date);
      const entry = activityMap.get(key);
      if (entry) {
        entry.cards = row.count;
        entry.total += row.count;
      }
    }
    for (const row of meetingCounts) {
      const key = String(row.date);
      const entry = activityMap.get(key);
      if (entry) {
        entry.meetings = row.count;
        entry.total += row.count;
      }
    }
    for (const row of emailCounts) {
      const key = String(row.date);
      const entry = activityMap.get(key);
      if (entry) {
        entry.emails = row.count;
        entry.total += row.count;
      }
    }
    for (const row of thoughtCounts) {
      const key = String(row.date);
      const entry = activityMap.get(key);
      if (entry) {
        entry.thoughts = row.count;
        entry.total += row.count;
      }
    }

    // Convert to sorted array
    const days = Array.from(activityMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    return NextResponse.json({ days });
  } catch (error) {
    console.error("Error fetching heatmap data:", error);
    return NextResponse.json(
      { error: "Failed to fetch heatmap data" },
      { status: 500 }
    );
  }
}
