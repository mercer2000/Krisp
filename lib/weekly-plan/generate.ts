import { rolloverWeek } from "./rollover";
import { chatCompletion } from "@/lib/ai/client";
import { resolvePrompt } from "@/lib/ai/resolvePrompt";
import {
  PROMPT_WEEKLY_PLAN,
  PROMPT_DAILY_TASK_CURATOR,
} from "@/lib/ai/prompts";
import { db } from "@/lib/db";
import {
  boards,
  columns,
  cards,
  weeklyPlans,
  dailyThemes,
  calendarEvents,
  weeklyReviews,
} from "@/lib/db/schema";
import { eq, and, isNull, gte, lte, asc, desc, inArray } from "drizzle-orm";
import { encryptFields } from "@/lib/db/encryption-helpers";
import {
  WEEKLY_PLAN_ENCRYPTED_FIELDS,
  DAILY_THEME_ENCRYPTED_FIELDS,
} from "@/lib/db/encryption-helpers";
import type { PlanSuggestion, TaskCuration, WeekRange } from "./types";

// ── Helpers ─────────────────────────────────────────────

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

/**
 * Returns the upcoming Monday-Sunday range relative to `now`.
 * If `now` is already Monday, it returns that week.
 */
export function getUpcomingWeekRange(now = new Date()): WeekRange {
  const d = new Date(now);
  const dayOfWeek = d.getDay(); // 0=Sun .. 6=Sat
  // Days until next Monday (if Sun=0 → 1, Mon=1 → 0, Tue=2 → 6, etc.)
  const daysUntilMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : 8 - dayOfWeek;
  d.setDate(d.getDate() + daysUntilMonday);
  d.setHours(0, 0, 0, 0);
  const start = new Date(d);
  const end = new Date(d);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

// ── Data Gathering ──────────────────────────────────────

/**
 * Gathers open cards, calendar events, and the previous plan for a user's week.
 */
export async function gatherPlanData(userId: string, week: WeekRange) {
  // Get user's boards
  const userBoards = await db.query.boards.findMany({
    where: eq(boards.userId, userId),
    with: {
      columns: {
        with: {
          cards: true,
        },
      },
    },
  });

  // Flatten all open, non-archived, non-deleted cards
  const allCards = userBoards.flatMap((b) =>
    b.columns.flatMap((col) =>
      col.cards
        .filter((c) => !c.archived && !c.deletedAt && !c.snoozedUntil)
        .map((c) => ({
          id: c.id,
          title: c.title,
          description: c.description,
          priority: c.priority,
          dueDate: c.dueDate,
          columnTitle: col.title,
          boardTitle: b.title,
          isBigThree: c.isBigThree,
          position: c.position,
        }))
    )
  );

  // Calendar events for the week (wrapped in try/catch in case table doesn't exist)
  let events: Array<{
    id: string;
    subject: string | null;
    startDateTime: Date;
    endDateTime: Date;
    isAllDay: boolean;
    location: string | null;
  }> = [];
  try {
    events = await db
      .select({
        id: calendarEvents.id,
        subject: calendarEvents.subject,
        startDateTime: calendarEvents.startDateTime,
        endDateTime: calendarEvents.endDateTime,
        isAllDay: calendarEvents.isAllDay,
        location: calendarEvents.location,
      })
      .from(calendarEvents)
      .where(
        and(
          eq(calendarEvents.tenantId, userId),
          gte(calendarEvents.startDateTime, week.start),
          lte(calendarEvents.startDateTime, week.end),
          eq(calendarEvents.isCancelled, false)
        )
      )
      .orderBy(asc(calendarEvents.startDateTime));
  } catch {
    // Calendar events table may not exist for all users
  }

  // Previous week's plan (most recent active/assessed plan before this week)
  let previousPlan: {
    id: string;
    bigThreeCardIds: string[];
    aiAssessment: string | null;
    assessmentScore: number | null;
    status: string;
    dailyThemes: Array<{ date: string; theme: string; aiRationale: string | null }>;
  } | null = null;
  try {
    const prev = await db.query.weeklyPlans.findFirst({
      where: and(
        eq(weeklyPlans.userId, userId),
        lte(weeklyPlans.weekStart, toDateStr(week.start)),
        isNull(weeklyPlans.deletedAt)
      ),
      orderBy: desc(weeklyPlans.weekStart),
      with: {
        dailyThemes: true,
      },
    });
    if (prev) {
      previousPlan = {
        id: prev.id,
        bigThreeCardIds: prev.bigThreeCardIds,
        aiAssessment: prev.aiAssessment,
        assessmentScore: prev.assessmentScore,
        status: prev.status,
        dailyThemes: prev.dailyThemes.map((dt) => ({
          date: dt.date,
          theme: dt.theme,
          aiRationale: dt.aiRationale,
        })),
      };
    }
  } catch {
    // Previous plan may not exist
  }

  // Previous week's review (for carry-forward items)
  let previousReview: {
    synthesisReport: string | null;
    unresolvedActionItems: unknown[];
  } | null = null;
  try {
    const review = await db.query.weeklyReviews.findFirst({
      where: and(
        eq(weeklyReviews.userId, userId),
        lte(weeklyReviews.weekStart, toDateStr(week.start)),
        isNull(weeklyReviews.deletedAt)
      ),
      orderBy: desc(weeklyReviews.weekStart),
    });
    if (review) {
      previousReview = {
        synthesisReport: review.synthesisReport,
        unresolvedActionItems: review.unresolvedActionItems as unknown[],
      };
    }
  } catch {
    // Previous review may not exist
  }

  return { allCards, events, previousPlan, previousReview };
}

// ── AI-powered Plan Suggestions ─────────────────────────

/**
 * Calls AI to suggest Big 3 priorities and daily themes for the week.
 */
export async function generatePlanSuggestions(
  userId: string,
  week: WeekRange
): Promise<PlanSuggestion> {
  const data = await gatherPlanData(userId, week);

  const cardsSummary = data.allCards
    .map(
      (c) =>
        `- [${c.id}] "${c.title}" (${c.priority}${c.dueDate ? `, due ${c.dueDate}` : ""}) in "${c.columnTitle}" on board "${c.boardTitle}"${c.isBigThree ? " [CURRENT BIG 3]" : ""}`
    )
    .join("\n");

  const eventsSummary = data.events
    .map((e) => {
      const start = new Date(e.startDateTime);
      const dayStr = toDateStr(start);
      const timeStr = start.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
      return `- ${dayStr} ${timeStr}: "${e.subject || "No title"}"${e.location ? ` @ ${e.location}` : ""}`;
    })
    .join("\n");

  const previousContext = data.previousPlan
    ? `Previous plan Big 3 card IDs: ${data.previousPlan.bigThreeCardIds.join(", ")}
Previous plan status: ${data.previousPlan.status}
Previous plan score: ${data.previousPlan.assessmentScore ?? "N/A"}
Previous daily themes:
${data.previousPlan.dailyThemes.map((dt) => `- ${dt.date}: ${dt.theme}`).join("\n")}`
    : "No previous plan available.";

  const reviewContext = data.previousReview
    ? `Previous week synthesis: ${data.previousReview.synthesisReport?.slice(0, 1000) || "N/A"}`
    : "";

  const instructions = await resolvePrompt(PROMPT_WEEKLY_PLAN, userId);

  const prompt = `${instructions}

Week: ${toDateStr(week.start)} to ${toDateStr(week.end)}

## Open Cards
${cardsSummary || "No open cards."}

## Calendar Events This Week
${eventsSummary || "No calendar events."}

## Previous Week Context
${previousContext}
${reviewContext}`;

  const text = await chatCompletion(prompt, {
    maxTokens: 4096,
    userId,
    triggerType: "weekly_plan",
    promptKey: PROMPT_WEEKLY_PLAN,
  });

  // Parse JSON from response
  const cleaned = text
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned) as PlanSuggestion;
  } catch {
    // Try extracting JSON object with regex
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as PlanSuggestion;
    }
    // Return empty defaults
    return {
      suggestedBigThree: [],
      dailyThemes: [],
    };
  }
}

// ── Daily Task Curation ─────────────────────────────────

/**
 * Calls AI to curate the most relevant tasks for a themed day.
 */
export async function curateTasksForDay(
  userId: string,
  theme: string,
  date: string,
  bigThreeCardIds: string[],
  allCards: Array<{
    id: string;
    title: string;
    description: string | null;
    priority: string;
    dueDate: string | null;
    columnTitle: string;
    boardTitle: string;
  }>,
  events: Array<{
    subject: string | null;
    startDateTime: Date;
    endDateTime: Date;
  }>
): Promise<TaskCuration> {
  const cardsSummary = allCards
    .map(
      (c) =>
        `- [${c.id}] "${c.title}" (${c.priority}${c.dueDate ? `, due ${c.dueDate}` : ""}) in "${c.columnTitle}"${bigThreeCardIds.includes(c.id) ? " [BIG 3]" : ""}`
    )
    .join("\n");

  const dayEvents = events
    .filter((e) => toDateStr(new Date(e.startDateTime)) === date)
    .map((e) => {
      const start = new Date(e.startDateTime);
      const timeStr = start.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
      return `- ${timeStr}: "${e.subject || "No title"}"`;
    })
    .join("\n");

  const instructions = await resolvePrompt(PROMPT_DAILY_TASK_CURATOR, userId);

  const prompt = `${instructions}

Date: ${date}
Theme: ${theme}
Big 3 Card IDs: ${bigThreeCardIds.join(", ")}

## All Open Cards
${cardsSummary || "No open cards."}

## Today's Calendar Events
${dayEvents || "No events today."}`;

  const text = await chatCompletion(prompt, {
    maxTokens: 2000,
    userId,
    triggerType: "weekly_plan",
    promptKey: PROMPT_DAILY_TASK_CURATOR,
  });

  const cleaned = text
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned) as TaskCuration;
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as TaskCuration;
    }
    return { suggestedCardIds: [], reasoning: "Failed to parse AI response." };
  }
}

// ── Plan Creation ───────────────────────────────────────

/**
 * Creates a weekly plan and its daily themes in the database.
 * Returns the created plan ID.
 */
export async function createWeeklyPlan(
  userId: string,
  weekStart: string,
  weekEnd: string,
  bigThreeCardIds: string[],
  themes: Array<{ date: string; theme: string; rationale: string; suggestedCardIds?: string[] }>,
  weeklyReviewId?: string
): Promise<string> {
  const [plan] = await db
    .insert(weeklyPlans)
    .values({
      userId,
      weekStart,
      weekEnd,
      bigThreeCardIds,
      weeklyReviewId: weeklyReviewId ?? null,
      status: "planning",
    })
    .returning({ id: weeklyPlans.id });

  // Insert daily themes
  if (themes.length > 0) {
    await db.insert(dailyThemes).values(
      themes.map((t) => ({
        weeklyPlanId: plan.id,
        userId,
        date: t.date,
        theme: t.theme,
        ...encryptFields(
          { aiRationale: t.rationale },
          DAILY_THEME_ENCRYPTED_FIELDS
        ),
        suggestedCardIds: t.suggestedCardIds ?? [],
      }))
    );
  }

  return plan.id;
}

// ── Plan Activation ─────────────────────────────────────

/**
 * Activates a weekly plan:
 * 1. Clears old Big 3 flags on all user cards
 * 2. Sets new Big 3 flags on selected cards
 * 3. Creates or finds the Focus column on the target board
 * 4. Moves Big 3 cards to the Focus column (tracking origin via snoozeReturnColumnId)
 * 5. Sets plan status to "active"
 */
export async function activatePlan(
  planId: string,
  userId: string,
  boardId: string
): Promise<void> {
  // 0. Roll over previous week's Focus column cards before activating new plan
  await rolloverWeek(userId);

  // 1. Load the plan
  const plan = await db.query.weeklyPlans.findFirst({
    where: and(eq(weeklyPlans.id, planId), eq(weeklyPlans.userId, userId)),
  });
  if (!plan) throw new Error("Plan not found");

  const bigThreeIds = plan.bigThreeCardIds;
  if (!bigThreeIds || bigThreeIds.length === 0) {
    throw new Error("Plan has no hero priority cards selected");
  }

  // 2. Clear old hero priority flags on all cards for this user's boards
  const userBoards = await db
    .select({ id: boards.id })
    .from(boards)
    .where(eq(boards.userId, userId));

  const boardIds = userBoards.map((b) => b.id);

  if (boardIds.length > 0) {
    const boardColumns = await db
      .select({ id: columns.id })
      .from(columns)
      .where(inArray(columns.boardId, boardIds));

    const columnIds = boardColumns.map((c) => c.id);

    if (columnIds.length > 0) {
      await db
        .update(cards)
        .set({
          isBigThree: false,
          bigThreeWeekStart: null,
          updatedAt: new Date(),
        })
        .where(
          and(
            inArray(cards.columnId, columnIds),
            eq(cards.isBigThree, true)
          )
        );
    }
  }

  // 3. Find or create the Focus column on the target board
  let focusColumn = await db.query.columns.findFirst({
    where: and(
      eq(columns.boardId, boardId),
      eq(columns.isFocusColumn, true)
    ),
  });

  if (!focusColumn) {
    // Get highest position to place Focus column at the start
    const existingColumns = await db
      .select({ position: columns.position })
      .from(columns)
      .where(eq(columns.boardId, boardId))
      .orderBy(asc(columns.position));

    const firstPosition =
      existingColumns.length > 0
        ? existingColumns[0].position - 1024
        : 1024;

    const [created] = await db
      .insert(columns)
      .values({
        boardId,
        title: "Focus",
        position: firstPosition,
        isFocusColumn: true,
      })
      .returning();

    focusColumn = created;
  }

  // 4. Set hero priority flags and move cards to Focus column
  //    Only move cards that belong to the target board (prevent cross-board moves)
  const targetBoardColumns = await db
    .select({ id: columns.id })
    .from(columns)
    .where(eq(columns.boardId, boardId));
  const targetColumnIds = targetBoardColumns.map((c) => c.id);

  const bigThreeCards = targetColumnIds.length > 0
    ? await db
        .select({
          id: cards.id,
          columnId: cards.columnId,
        })
        .from(cards)
        .where(and(inArray(cards.id, bigThreeIds), inArray(cards.columnId, targetColumnIds)))
    : [];

  for (let i = 0; i < bigThreeCards.length; i++) {
    const card = bigThreeCards[i];
    await db
      .update(cards)
      .set({
        isBigThree: true,
        bigThreeWeekStart: plan.weekStart,
        // Track where the card came from so it can be returned later
        snoozeReturnColumnId: card.columnId !== focusColumn.id ? card.columnId : null,
        columnId: focusColumn.id,
        position: (i + 1) * 1024,
        updatedAt: new Date(),
      })
      .where(eq(cards.id, card.id));
  }

  // 5. Set plan status to "active"
  await db
    .update(weeklyPlans)
    .set({
      status: "active",
      updatedAt: new Date(),
    })
    .where(eq(weeklyPlans.id, planId));
}
