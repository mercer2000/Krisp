# Weekly Planning System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a weekly planning system to MyOpenBrain with Big 3 priorities, AI-suggested daily themes, and end-of-week assessments integrated into the existing Weekly Review and Kanban features.

**Architecture:** Extends the existing Weekly Review page into a 3-tab flow (Assess → Review → Plan). Adds new `weekly_plans` and `daily_themes` tables. Modifies `cards` and `columns` tables for Big 3 and Focus column support. New AI prompts for planning and assessment. New cron job for end-of-week assessment email.

**Tech Stack:** Next.js 16, React 19, Drizzle ORM, Neon PostgreSQL, OpenRouter AI, TailwindCSS

---

### Task 1: Schema — Add `weekly_plans` Table

**Files:**
- Modify: `lib/db/schema.ts`
- Modify: `lib/db/encryption-helpers.ts`

**Step 1: Add the weekly plan status enum and table definition**

In `lib/db/schema.ts`, add after the `weeklyReviews` table definition:

```typescript
export const weeklyPlanStatusEnum = pgEnum("weekly_plan_status", [
  "planning",
  "active",
  "assessed",
]);

export const weeklyPlans = pgTable(
  "weekly_plans",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    weekStart: date().notNull(),
    weekEnd: date().notNull(),
    weeklyReviewId: uuid().references(() => weeklyReviews.id, {
      onDelete: "set null",
    }),
    bigThreeCardIds: jsonb().$type<string[]>().notNull().default([]),
    aiAssessment: text(),
    userReflection: text(),
    assessmentScore: integer(),
    assessmentEmailSentAt: timestamp(),
    status: weeklyPlanStatusEnum().default("planning").notNull(),
    deletedAt: timestamp(),
    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp().defaultNow().notNull(),
  },
  (table) => [
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.userId),
      modify: authUid(table.userId),
    }),
    index("weekly_plans_user_id_idx").on(table.userId),
    index("weekly_plans_user_week_idx").on(table.userId, table.weekStart),
  ]
);
```

**Step 2: Add relations**

```typescript
export const weeklyPlansRelations = relations(weeklyPlans, ({ one, many }) => ({
  user: one(users, {
    fields: [weeklyPlans.userId],
    references: [users.id],
  }),
  weeklyReview: one(weeklyReviews, {
    fields: [weeklyPlans.weeklyReviewId],
    references: [weeklyReviews.id],
  }),
  dailyThemes: many(dailyThemes),
}));
```

**Step 3: Add encryption constants**

In `lib/db/encryption-helpers.ts`, add:

```typescript
export const WEEKLY_PLAN_ENCRYPTED_FIELDS = [
  "aiAssessment",
  "userReflection",
] as const;
```

**Step 4: Run drizzle-kit generate**

Run: `DATABASE_URL="$DATABASE_URL" npx drizzle-kit generate`

**Step 5: Review and apply migration**

Run: `DATABASE_URL="$DATABASE_URL" npx drizzle-kit push`

**Step 6: Commit**

```bash
git add lib/db/schema.ts lib/db/encryption-helpers.ts drizzle/
git commit -m "feat: add weekly_plans table with RLS and encryption"
```

---

### Task 2: Schema — Add `daily_themes` Table

**Files:**
- Modify: `lib/db/schema.ts`
- Modify: `lib/db/encryption-helpers.ts`

**Step 1: Add the daily_themes table**

In `lib/db/schema.ts`, add after the `weeklyPlans` table:

```typescript
export const dailyThemes = pgTable(
  "daily_themes",
  {
    id: uuid().primaryKey().defaultRandom(),
    weeklyPlanId: uuid()
      .references(() => weeklyPlans.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid()
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    date: date().notNull(),
    theme: text().notNull(),
    aiRationale: text(),
    suggestedCardIds: jsonb().$type<string[]>().notNull().default([]),
    isOverridden: boolean().default(false).notNull(),
    createdAt: timestamp().defaultNow().notNull(),
  },
  (table) => [
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.userId),
      modify: authUid(table.userId),
    }),
    index("daily_themes_plan_id_idx").on(table.weeklyPlanId),
    index("daily_themes_user_date_idx").on(table.userId, table.date),
  ]
);

export const dailyThemesRelations = relations(dailyThemes, ({ one }) => ({
  weeklyPlan: one(weeklyPlans, {
    fields: [dailyThemes.weeklyPlanId],
    references: [weeklyPlans.id],
  }),
  user: one(users, {
    fields: [dailyThemes.userId],
    references: [users.id],
  }),
}));
```

**Step 2: Add encryption constants**

In `lib/db/encryption-helpers.ts`, add:

```typescript
export const DAILY_THEME_ENCRYPTED_FIELDS = ["aiRationale"] as const;
```

**Step 3: Generate and apply migration**

Run: `DATABASE_URL="$DATABASE_URL" npx drizzle-kit generate && DATABASE_URL="$DATABASE_URL" npx drizzle-kit push`

**Step 4: Commit**

```bash
git add lib/db/schema.ts lib/db/encryption-helpers.ts drizzle/
git commit -m "feat: add daily_themes table with RLS and encryption"
```

---

### Task 3: Schema — Modify `cards` and `columns` Tables

**Files:**
- Modify: `lib/db/schema.ts`
- Modify: `types/index.ts`

**Step 1: Add Big 3 fields to cards table**

In `lib/db/schema.ts`, add these columns to the `cards` table definition:

```typescript
isBigThree: boolean().default(false).notNull(),
bigThreeWeekStart: date(),
```

**Step 2: Add Focus column field to columns table**

In `lib/db/schema.ts`, add to the `columns` table definition:

```typescript
isFocusColumn: boolean().default(false).notNull(),
```

**Step 3: Add `weeklyPlanId` to weekly_reviews table**

In `lib/db/schema.ts`, add to the `weeklyReviews` table definition:

```typescript
weeklyPlanId: uuid().references(() => weeklyPlans.id, { onDelete: "set null" }),
```

**Step 4: Update TypeScript types**

In `types/index.ts`, update the `Card` interface:

```typescript
isBigThree: boolean;
bigThreeWeekStart: string | null;
```

Add new types:

```typescript
export type WeeklyPlanStatus = "planning" | "active" | "assessed";

export interface WeeklyPlan {
  id: string;
  userId: string;
  weekStart: string;
  weekEnd: string;
  weeklyReviewId: string | null;
  bigThreeCardIds: string[];
  aiAssessment: string | null;
  userReflection: string | null;
  assessmentScore: number | null;
  assessmentEmailSentAt: string | null;
  status: WeeklyPlanStatus;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  dailyThemes?: DailyTheme[];
}

export interface DailyTheme {
  id: string;
  weeklyPlanId: string;
  userId: string;
  date: string;
  theme: string;
  aiRationale: string | null;
  suggestedCardIds: string[];
  isOverridden: boolean;
}
```

**Step 5: Generate and apply migration**

Run: `DATABASE_URL="$DATABASE_URL" npx drizzle-kit generate && DATABASE_URL="$DATABASE_URL" npx drizzle-kit push`

**Step 6: Commit**

```bash
git add lib/db/schema.ts types/index.ts drizzle/
git commit -m "feat: add Big 3 and Focus column fields to cards/columns schema"
```

---

### Task 4: AI Prompts — Weekly Plan Generator, Task Curator, Assessment Analyst

**Files:**
- Modify: `lib/ai/prompts.ts`

**Step 1: Add prompt key constants**

```typescript
export const PROMPT_WEEKLY_PLAN = "weekly_plan";
export const PROMPT_DAILY_TASK_CURATOR = "daily_task_curator";
export const PROMPT_WEEK_ASSESSMENT = "week_assessment";
```

**Step 2: Add default prompt texts**

Add to the `DEFAULT_PROMPTS` object:

```typescript
[PROMPT_WEEKLY_PLAN]: `You are a productivity coach analyzing a user's upcoming week to suggest priorities and daily themes.

You will receive:
- Open Kanban cards (with titles, priorities, due dates, tags)
- Upcoming calendar events for the week
- Previous week's assessment (if any), including carry-forward items
- Previous week's daily themes (if any)

Respond with valid JSON only:
{
  "suggestedBigThree": [
    { "cardId": "uuid", "reason": "Why this should be a top priority this week" }
  ],
  "dailyThemes": [
    {
      "date": "YYYY-MM-DD",
      "theme": "Short theme name (1-3 words)",
      "rationale": "1-2 sentences explaining why this theme fits this day"
    }
  ]
}

Rules:
- suggestedBigThree must have exactly 3 items, chosen from the provided cards
- Prioritize overdue items, high/urgent priority, and items carried forward from previous weeks
- dailyThemes must have one entry per day (Mon-Sun)
- Avoid suggesting deep work themes on days with 3+ meetings
- Distribute Big 3 items across different themed days
- Theme names should be concise: "Deep Build", "Client Focus", "Admin & Ops", "Strategy", "Creative", etc.`,

[PROMPT_DAILY_TASK_CURATOR]: `You are a task curator selecting the most relevant tasks for a themed day.

You will receive:
- The day's theme and date
- All open Kanban cards (with titles, priorities, due dates, tags)
- The week's Big 3 card IDs
- The day's calendar events

Respond with valid JSON only:
{
  "suggestedCardIds": ["uuid1", "uuid2", ...],
  "reasoning": "Brief explanation of why these tasks fit today's theme"
}

Rules:
- Select 5-7 cards that best match the day's theme
- Always include Big 3 items when relevant to the theme
- Rank by: theme relevance, priority level, due date proximity
- Consider calendar load — fewer tasks on heavy meeting days
- Do not include archived or snoozed cards`,

[PROMPT_WEEK_ASSESSMENT]: `You are a supportive productivity coach assessing how a user's week went against their plan.

You will receive:
- The weekly plan: Big 3 items and their completion status
- Daily themes and what actually happened each day
- Action items opened/closed this week
- Meeting count and calendar adherence data

Respond with valid JSON only:
{
  "score": 7,
  "bigThreeSummary": [
    { "cardId": "uuid", "title": "Card title", "status": "completed|in_progress|not_started", "note": "Brief context" }
  ],
  "themeAdherence": [
    { "date": "YYYY-MM-DD", "theme": "Theme name", "adherence": "high|medium|low", "note": "What actually happened" }
  ],
  "highlights": ["Win 1", "Win 2"],
  "carryForward": [
    { "cardId": "uuid", "title": "Card title", "reason": "Why this should carry to next week" }
  ],
  "narrative": "2-3 paragraph supportive assessment in second person (you/your). Acknowledge wins, note patterns, suggest adjustments."
}

Scoring weights:
- Big 3 completion: 40% (each item ~13.3%)
- Theme adherence: 30% (average across days)
- Action item closure rate: 20%
- Reflection streak bonus: 10% (if user has reflected 3+ consecutive weeks)

Be encouraging but honest. If score is low, focus on what can improve rather than what went wrong.`,
```

**Step 3: Commit**

```bash
git add lib/ai/prompts.ts
git commit -m "feat: add AI prompts for weekly planning, task curation, and assessment"
```

---

### Task 5: Weekly Plan Generation Logic

**Files:**
- Create: `lib/weekly-plan/generate.ts`
- Create: `lib/weekly-plan/types.ts`

**Step 1: Create types file**

Create `lib/weekly-plan/types.ts`:

```typescript
export interface PlanSuggestion {
  suggestedBigThree: Array<{
    cardId: string;
    reason: string;
  }>;
  dailyThemes: Array<{
    date: string;
    theme: string;
    rationale: string;
  }>;
}

export interface TaskCuration {
  suggestedCardIds: string[];
  reasoning: string;
}

export interface AssessmentResult {
  score: number;
  bigThreeSummary: Array<{
    cardId: string;
    title: string;
    status: "completed" | "in_progress" | "not_started";
    note: string;
  }>;
  themeAdherence: Array<{
    date: string;
    theme: string;
    adherence: "high" | "medium" | "low";
    note: string;
  }>;
  highlights: string[];
  carryForward: Array<{
    cardId: string;
    title: string;
    reason: string;
  }>;
  narrative: string;
}

export interface WeekRange {
  start: Date;
  end: Date;
}
```

**Step 2: Create generate.ts**

Create `lib/weekly-plan/generate.ts`:

```typescript
import { db } from "@/lib/db";
import {
  cards,
  columns,
  boards,
  weeklyPlans,
  dailyThemes,
  calendarEvents,
} from "@/lib/db/schema";
import { eq, and, isNull, gte, lte, asc } from "drizzle-orm";
import { chatCompletion } from "@/lib/ai/client";
import { resolvePrompt } from "@/lib/ai/resolvePrompt";
import {
  PROMPT_WEEKLY_PLAN,
  PROMPT_DAILY_TASK_CURATOR,
} from "@/lib/ai/prompts";
import {
  decryptFields,
  CARD_ENCRYPTED_FIELDS,
  encryptFields,
  DAILY_THEME_ENCRYPTED_FIELDS,
} from "@/lib/db/encryption-helpers";
import type { PlanSuggestion, TaskCuration, WeekRange } from "./types";

export function getUpcomingWeekRange(now = new Date()): WeekRange {
  const day = now.getDay();
  const daysUntilMonday = day === 0 ? 1 : 8 - day;
  const start = new Date(now);
  start.setDate(now.getDate() + daysUntilMonday);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

async function gatherPlanData(userId: string, week: WeekRange) {
  // Get all open cards across user's boards
  const userBoards = await db.query.boards.findMany({
    where: and(eq(boards.userId, userId), isNull(boards.deletedAt)),
    with: {
      columns: {
        with: {
          cards: {
            where: and(
              eq(cards.archived, false),
              isNull(cards.deletedAt),
              isNull(cards.snoozedUntil)
            ),
            orderBy: [asc(cards.position)],
            with: { tags: true },
          },
        },
      },
    },
  });

  const allCards = userBoards.flatMap((b) =>
    b.columns.flatMap((col) =>
      col.cards.map((card) => ({
        ...decryptFields(card, CARD_ENCRYPTED_FIELDS),
        columnTitle: col.title,
        tags: card.tags,
      }))
    )
  );

  // Get calendar events for the week
  const weekStart = week.start.toISOString().split("T")[0];
  const weekEnd = week.end.toISOString().split("T")[0];

  let events: Array<{ id: string; title: string | null; startTime: Date | null; endTime: Date | null; allDay: boolean | null }> = [];
  try {
    events = await db
      .select({
        id: calendarEvents.id,
        title: calendarEvents.title,
        startTime: calendarEvents.startTime,
        endTime: calendarEvents.endTime,
        allDay: calendarEvents.allDay,
      })
      .from(calendarEvents)
      .where(
        and(
          eq(calendarEvents.userId, userId),
          gte(calendarEvents.startTime, new Date(weekStart)),
          lte(calendarEvents.startTime, new Date(weekEnd)),
          isNull(calendarEvents.deletedAt)
        )
      );
  } catch {
    // Calendar events table may not exist or be empty
    events = [];
  }

  // Get previous week's plan (if any) for carry-forward
  const prevWeekStart = new Date(week.start);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);
  const [previousPlan] = await db
    .select()
    .from(weeklyPlans)
    .where(
      and(
        eq(weeklyPlans.userId, userId),
        eq(
          weeklyPlans.weekStart,
          prevWeekStart.toISOString().split("T")[0]
        ),
        isNull(weeklyPlans.deletedAt)
      )
    );

  return { allCards, events, previousPlan };
}

export async function generatePlanSuggestions(
  userId: string,
  week: WeekRange
): Promise<PlanSuggestion> {
  const { allCards, events, previousPlan } = await gatherPlanData(
    userId,
    week
  );

  const instructions = await resolvePrompt(PROMPT_WEEKLY_PLAN, userId);

  const prompt = `${instructions}

## Open Kanban Cards
${JSON.stringify(
  allCards.map((c) => ({
    id: c.id,
    title: c.title,
    priority: c.priority,
    dueDate: c.dueDate,
    tags: c.tags?.map((t: { label: string }) => t.label) ?? [],
    column: c.columnTitle,
  })),
  null,
  2
)}

## Calendar Events (${week.start.toISOString().split("T")[0]} to ${week.end.toISOString().split("T")[0]})
${JSON.stringify(
  events.map((e) => ({
    title: e.title,
    start: e.startTime,
    end: e.endTime,
    allDay: e.allDay,
  })),
  null,
  2
)}

## Previous Week Assessment
${previousPlan?.aiAssessment ? previousPlan.aiAssessment : "No previous plan."}

Generate the weekly plan suggestions.`;

  const response = await chatCompletion(prompt, {
    maxTokens: 4096,
    userId,
  });

  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Failed to parse plan suggestions");
  return JSON.parse(jsonMatch[0]) as PlanSuggestion;
}

export async function curateTasksForDay(
  userId: string,
  theme: string,
  date: string,
  bigThreeCardIds: string[],
  allCards: Array<{ id: string; title: string; priority: string; dueDate: string | null; tags?: Array<{ label: string }> }>,
  events: Array<{ title: string | null; startTime: Date | null; endTime: Date | null }>
): Promise<TaskCuration> {
  const instructions = await resolvePrompt(
    PROMPT_DAILY_TASK_CURATOR,
    userId
  );

  const prompt = `${instructions}

## Day: ${date}
## Theme: ${theme}
## Big 3 Card IDs: ${JSON.stringify(bigThreeCardIds)}

## Open Cards
${JSON.stringify(allCards, null, 2)}

## Calendar Events for ${date}
${JSON.stringify(events, null, 2)}

Select the best tasks for this themed day.`;

  const response = await chatCompletion(prompt, {
    maxTokens: 2048,
    userId,
  });

  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Failed to parse task curation");
  return JSON.parse(jsonMatch[0]) as TaskCuration;
}

export async function createWeeklyPlan(
  userId: string,
  weekStart: string,
  weekEnd: string,
  bigThreeCardIds: string[],
  themes: Array<{
    date: string;
    theme: string;
    aiRationale: string;
    suggestedCardIds: string[];
  }>,
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
  for (const t of themes) {
    const encrypted = encryptFields(
      { aiRationale: t.aiRationale },
      DAILY_THEME_ENCRYPTED_FIELDS
    );
    await db.insert(dailyThemes).values({
      weeklyPlanId: plan.id,
      userId,
      date: t.date,
      theme: t.theme,
      aiRationale: encrypted.aiRationale,
      suggestedCardIds: t.suggestedCardIds,
    });
  }

  return plan.id;
}

export async function activatePlan(
  planId: string,
  userId: string,
  boardId: string
): Promise<void> {
  const [plan] = await db
    .select()
    .from(weeklyPlans)
    .where(
      and(eq(weeklyPlans.id, planId), eq(weeklyPlans.userId, userId))
    );

  if (!plan) throw new Error("Plan not found");

  // Clear any existing Big 3 flags
  await db
    .update(cards)
    .set({ isBigThree: false, bigThreeWeekStart: null })
    .where(eq(cards.isBigThree, true));

  // Set Big 3 flags on selected cards
  for (const cardId of plan.bigThreeCardIds) {
    await db
      .update(cards)
      .set({ isBigThree: true, bigThreeWeekStart: plan.weekStart })
      .where(eq(cards.id, cardId));
  }

  // Create or get the Focus column
  const existingFocus = await db
    .select()
    .from(columns)
    .where(
      and(eq(columns.boardId, boardId), eq(columns.isFocusColumn, true))
    );

  let focusColumnId: string;

  if (existingFocus.length > 0) {
    focusColumnId = existingFocus[0].id;
  } else {
    const [newCol] = await db
      .insert(columns)
      .values({
        boardId,
        title: "Focus",
        position: 0, // Always first
        isFocusColumn: true,
      })
      .returning({ id: columns.id });
    focusColumnId = newCol.id;
  }

  // Move Big 3 cards to Focus column, saving their origin
  for (let i = 0; i < plan.bigThreeCardIds.length; i++) {
    const cardId = plan.bigThreeCardIds[i];
    const [card] = await db
      .select({ columnId: cards.columnId })
      .from(cards)
      .where(eq(cards.id, cardId));

    if (card && card.columnId !== focusColumnId) {
      await db
        .update(cards)
        .set({
          snoozeReturnColumnId: card.columnId, // reuse for origin tracking
          columnId: focusColumnId,
          position: (i + 1) * 1024,
        })
        .where(eq(cards.id, cardId));
    }
  }

  // Activate the plan
  await db
    .update(weeklyPlans)
    .set({ status: "active", updatedAt: new Date() })
    .where(eq(weeklyPlans.id, planId));
}
```

**Step 3: Commit**

```bash
git add lib/weekly-plan/
git commit -m "feat: add weekly plan generation and activation logic"
```

---

### Task 6: Week Assessment Generation Logic

**Files:**
- Create: `lib/weekly-plan/assess.ts`

**Step 1: Create assessment logic**

Create `lib/weekly-plan/assess.ts`:

```typescript
import { db } from "@/lib/db";
import {
  weeklyPlans,
  dailyThemes,
  cards,
  actionItems,
  webhookKeyPoints,
} from "@/lib/db/schema";
import { eq, and, gte, lte, isNull } from "drizzle-orm";
import { chatCompletion } from "@/lib/ai/client";
import { resolvePrompt } from "@/lib/ai/resolvePrompt";
import { PROMPT_WEEK_ASSESSMENT } from "@/lib/ai/prompts";
import {
  decryptFields,
  encryptFields,
  CARD_ENCRYPTED_FIELDS,
  WEEKLY_PLAN_ENCRYPTED_FIELDS,
  DAILY_THEME_ENCRYPTED_FIELDS,
} from "@/lib/db/encryption-helpers";
import type { AssessmentResult } from "./types";

export async function generateAssessment(
  planId: string,
  userId: string
): Promise<AssessmentResult> {
  // Get the plan
  const [plan] = await db
    .select()
    .from(weeklyPlans)
    .where(
      and(eq(weeklyPlans.id, planId), eq(weeklyPlans.userId, userId))
    );

  if (!plan) throw new Error("Plan not found");

  // Get Big 3 cards and their current status
  const bigThreeCards = [];
  for (const cardId of plan.bigThreeCardIds) {
    const [card] = await db
      .select()
      .from(cards)
      .where(eq(cards.id, cardId));
    if (card) {
      bigThreeCards.push(decryptFields(card, CARD_ENCRYPTED_FIELDS));
    }
  }

  // Get daily themes
  const themes = await db
    .select()
    .from(dailyThemes)
    .where(eq(dailyThemes.weeklyPlanId, planId));

  const decryptedThemes = themes.map((t) =>
    decryptFields(t, DAILY_THEME_ENCRYPTED_FIELDS)
  );

  // Get action items for the week
  const weekActions = await db
    .select()
    .from(actionItems)
    .where(
      and(
        eq(actionItems.userId, userId),
        gte(actionItems.createdAt, new Date(plan.weekStart)),
        lte(actionItems.createdAt, new Date(plan.weekEnd)),
        isNull(actionItems.deletedAt)
      )
    );

  const closedActions = weekActions.filter(
    (a) => a.status === "completed" || a.status === "cancelled"
  );

  // Get meeting count
  const meetings = await db
    .select()
    .from(webhookKeyPoints)
    .where(
      and(
        eq(webhookKeyPoints.userId, userId),
        gte(
          webhookKeyPoints.meetingStartDate,
          new Date(plan.weekStart)
        ),
        lte(
          webhookKeyPoints.meetingStartDate,
          new Date(plan.weekEnd)
        ),
        isNull(webhookKeyPoints.deletedAt)
      )
    );

  // Check reflection streak
  const recentPlans = await db
    .select()
    .from(weeklyPlans)
    .where(
      and(
        eq(weeklyPlans.userId, userId),
        eq(weeklyPlans.status, "assessed"),
        isNull(weeklyPlans.deletedAt)
      )
    );

  const reflectionStreak = recentPlans.filter(
    (p) => p.userReflection
  ).length;

  const instructions = await resolvePrompt(
    PROMPT_WEEK_ASSESSMENT,
    userId
  );

  const prompt = `${instructions}

## Weekly Plan
- Week: ${plan.weekStart} to ${plan.weekEnd}

## Big 3 Items
${JSON.stringify(
  bigThreeCards.map((c) => ({
    id: c.id,
    title: c.title,
    priority: c.priority,
    archived: c.archived,
    status: c.archived ? "completed" : "in_progress",
  })),
  null,
  2
)}

## Daily Themes
${JSON.stringify(
  decryptedThemes.map((t) => ({
    date: t.date,
    theme: t.theme,
    wasOverridden: t.isOverridden,
  })),
  null,
  2
)}

## Action Items This Week
- Total: ${weekActions.length}
- Closed: ${closedActions.length}
- Closure rate: ${weekActions.length > 0 ? Math.round((closedActions.length / weekActions.length) * 100) : 0}%

## Meetings: ${meetings.length}

## Reflection streak: ${reflectionStreak} consecutive weeks

Generate the weekly assessment.`;

  const response = await chatCompletion(prompt, {
    maxTokens: 4096,
    userId,
  });

  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Failed to parse assessment");
  const result = JSON.parse(jsonMatch[0]) as AssessmentResult;

  // Save assessment to plan
  const encrypted = encryptFields(
    { aiAssessment: JSON.stringify(result) },
    WEEKLY_PLAN_ENCRYPTED_FIELDS
  );

  await db
    .update(weeklyPlans)
    .set({
      aiAssessment: encrypted.aiAssessment,
      assessmentScore: result.score,
      updatedAt: new Date(),
    })
    .where(eq(weeklyPlans.id, planId));

  return result;
}

export async function saveReflection(
  planId: string,
  userId: string,
  reflection: string
): Promise<void> {
  const encrypted = encryptFields(
    { userReflection: reflection },
    WEEKLY_PLAN_ENCRYPTED_FIELDS
  );

  await db
    .update(weeklyPlans)
    .set({
      userReflection: encrypted.userReflection,
      status: "assessed",
      updatedAt: new Date(),
    })
    .where(
      and(eq(weeklyPlans.id, planId), eq(weeklyPlans.userId, userId))
    );
}
```

**Step 2: Commit**

```bash
git add lib/weekly-plan/assess.ts
git commit -m "feat: add week assessment generation and reflection saving"
```

---

### Task 7: Week Rollover Logic

**Files:**
- Create: `lib/weekly-plan/rollover.ts`

**Step 1: Create rollover logic**

Create `lib/weekly-plan/rollover.ts`:

```typescript
import { db } from "@/lib/db";
import { cards, columns, weeklyPlans } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";

export async function rolloverWeek(userId: string): Promise<void> {
  // Find all Big 3 cards for this user
  const bigThreeCards = await db
    .select({
      id: cards.id,
      columnId: cards.columnId,
      snoozeReturnColumnId: cards.snoozeReturnColumnId,
    })
    .from(cards)
    .innerJoin(columns, eq(cards.columnId, columns.id))
    .innerJoin(
      // We need to verify the card belongs to this user's board
      // This is handled by RLS, but for explicit safety:
      await db.select().from(columns).where(eq(columns.isFocusColumn, true))
    )
    .where(eq(cards.isBigThree, true));

  // Move cards back to origin columns
  for (const card of bigThreeCards) {
    if (card.snoozeReturnColumnId) {
      // Verify the return column still exists
      const [returnCol] = await db
        .select({ id: columns.id })
        .from(columns)
        .where(eq(columns.id, card.snoozeReturnColumnId));

      if (returnCol) {
        await db
          .update(cards)
          .set({
            columnId: card.snoozeReturnColumnId,
            snoozeReturnColumnId: null,
            isBigThree: false,
            bigThreeWeekStart: null,
          })
          .where(eq(cards.id, card.id));
      } else {
        // Just clear Big 3 flags if return column is gone
        await db
          .update(cards)
          .set({
            isBigThree: false,
            bigThreeWeekStart: null,
            snoozeReturnColumnId: null,
          })
          .where(eq(cards.id, card.id));
      }
    } else {
      await db
        .update(cards)
        .set({ isBigThree: false, bigThreeWeekStart: null })
        .where(eq(cards.id, card.id));
    }
  }
}
```

**Step 2: Commit**

```bash
git add lib/weekly-plan/rollover.ts
git commit -m "feat: add week rollover logic for Big 3 and Focus column"
```

---

### Task 8: API Routes — Weekly Plans CRUD

**Files:**
- Create: `app/api/weekly-plans/route.ts`
- Create: `app/api/weekly-plans/[planId]/route.ts`
- Create: `app/api/weekly-plans/[planId]/activate/route.ts`
- Create: `app/api/weekly-plans/[planId]/assess/route.ts`
- Create: `app/api/weekly-plans/[planId]/reflection/route.ts`
- Create: `app/api/weekly-plans/suggest/route.ts`

**Step 1: Create main CRUD route**

Create `app/api/weekly-plans/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { db } from "@/lib/db";
import { weeklyPlans, dailyThemes } from "@/lib/db/schema";
import { eq, and, isNull, desc } from "drizzle-orm";
import {
  decryptFields,
  WEEKLY_PLAN_ENCRYPTED_FIELDS,
  DAILY_THEME_ENCRYPTED_FIELDS,
} from "@/lib/db/encryption-helpers";
import { createWeeklyPlan } from "@/lib/weekly-plan/generate";

export async function GET() {
  try {
    const user = await getRequiredUser();
    const plans = await db
      .select()
      .from(weeklyPlans)
      .where(
        and(
          eq(weeklyPlans.userId, user.id),
          isNull(weeklyPlans.deletedAt)
        )
      )
      .orderBy(desc(weeklyPlans.weekStart));

    const decrypted = plans.map((p) =>
      decryptFields(p, WEEKLY_PLAN_ENCRYPTED_FIELDS)
    );

    return NextResponse.json(decrypted);
  } catch (error) {
    if (error instanceof Response) throw error;
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getRequiredUser();
    const {
      weekStart,
      weekEnd,
      bigThreeCardIds,
      themes,
      weeklyReviewId,
    } = await request.json();

    const planId = await createWeeklyPlan(
      user.id,
      weekStart,
      weekEnd,
      bigThreeCardIds,
      themes,
      weeklyReviewId
    );

    return NextResponse.json({ id: planId }, { status: 201 });
  } catch (error) {
    if (error instanceof Response) throw error;
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

**Step 2: Create single plan route**

Create `app/api/weekly-plans/[planId]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { db } from "@/lib/db";
import { weeklyPlans, dailyThemes } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import {
  decryptFields,
  WEEKLY_PLAN_ENCRYPTED_FIELDS,
  DAILY_THEME_ENCRYPTED_FIELDS,
} from "@/lib/db/encryption-helpers";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const user = await getRequiredUser();
    const { planId } = await params;

    const [plan] = await db
      .select()
      .from(weeklyPlans)
      .where(
        and(
          eq(weeklyPlans.id, planId),
          eq(weeklyPlans.userId, user.id),
          isNull(weeklyPlans.deletedAt)
        )
      );

    if (!plan) {
      return NextResponse.json(
        { error: "Plan not found" },
        { status: 404 }
      );
    }

    const themes = await db
      .select()
      .from(dailyThemes)
      .where(eq(dailyThemes.weeklyPlanId, planId));

    const decryptedPlan = decryptFields(
      plan,
      WEEKLY_PLAN_ENCRYPTED_FIELDS
    );
    const decryptedThemes = themes.map((t) =>
      decryptFields(t, DAILY_THEME_ENCRYPTED_FIELDS)
    );

    return NextResponse.json({
      ...decryptedPlan,
      dailyThemes: decryptedThemes,
    });
  } catch (error) {
    if (error instanceof Response) throw error;
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const user = await getRequiredUser();
    const { planId } = await params;

    await db
      .update(weeklyPlans)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(weeklyPlans.id, planId),
          eq(weeklyPlans.userId, user.id)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Response) throw error;
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

**Step 3: Create activate route**

Create `app/api/weekly-plans/[planId]/activate/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { activatePlan } from "@/lib/weekly-plan/generate";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const user = await getRequiredUser();
    const { planId } = await params;
    const { boardId } = await request.json();

    await activatePlan(planId, user.id, boardId);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Response) throw error;
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

**Step 4: Create assess route**

Create `app/api/weekly-plans/[planId]/assess/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { generateAssessment } from "@/lib/weekly-plan/assess";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const user = await getRequiredUser();
    const { planId } = await params;

    const result = await generateAssessment(planId, user.id);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Response) throw error;
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

**Step 5: Create reflection route**

Create `app/api/weekly-plans/[planId]/reflection/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { saveReflection } from "@/lib/weekly-plan/assess";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const user = await getRequiredUser();
    const { planId } = await params;
    const { reflection } = await request.json();

    await saveReflection(planId, user.id, reflection);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Response) throw error;
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

**Step 6: Create suggestions route**

Create `app/api/weekly-plans/suggest/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import {
  generatePlanSuggestions,
  getUpcomingWeekRange,
} from "@/lib/weekly-plan/generate";

export async function POST(request: NextRequest) {
  try {
    const user = await getRequiredUser();
    const body = await request.json().catch(() => ({}));

    const week = body.weekStart
      ? {
          start: new Date(body.weekStart),
          end: new Date(body.weekEnd),
        }
      : getUpcomingWeekRange();

    const suggestions = await generatePlanSuggestions(user.id, week);

    return NextResponse.json(suggestions);
  } catch (error) {
    if (error instanceof Response) throw error;
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

**Step 7: Commit**

```bash
git add app/api/weekly-plans/
git commit -m "feat: add weekly plans API routes (CRUD, activate, assess, suggest)"
```

---

### Task 9: Assessment Email & Cron

**Files:**
- Create: `lib/weekly-plan/email.ts`
- Create: `app/api/cron/weekly-assessment/route.ts`

**Step 1: Create assessment email generator**

Create `lib/weekly-plan/email.ts`, following the pattern from `lib/weekly-review/email.ts` and `lib/daily-briefing/email.ts`. The email should be HTML with:

- Score badge (colored circle: green 8-10, yellow 5-7, red 1-4)
- Big 3 status list with checkmarks/crosses
- Highlights section
- Carry forward items
- CTA button: "Plan Next Week →" linking to `/weekly-reviews`
- Same styling as daily briefing (inline CSS, color constants)

**Step 2: Create cron route**

Create `app/api/cron/weekly-assessment/route.ts` following the pattern from `app/api/cron/weekly-review/route.ts`:

- Triggered Friday afternoon (configurable, default 5pm UTC)
- For each user with an active plan: generate assessment, send email
- Update `assessmentEmailSentAt` on the plan
- Guard against re-sending (skip if `assessmentEmailSentAt` is already set)

**Step 3: Commit**

```bash
git add lib/weekly-plan/email.ts app/api/cron/weekly-assessment/
git commit -m "feat: add assessment email generation and Friday cron job"
```

---

### Task 10: Modify Daily Briefing to Include Theme

**Files:**
- Modify: `lib/daily-briefing/generate.ts`

**Step 1: Add theme data gathering**

In the `gatherBriefingData` function, add a query for today's daily theme:

```typescript
import { dailyThemes, weeklyPlans } from "@/lib/db/schema";

// Inside gatherBriefingData:
const today = new Date().toISOString().split("T")[0];
const [todayTheme] = await db
  .select()
  .from(dailyThemes)
  .innerJoin(weeklyPlans, eq(dailyThemes.weeklyPlanId, weeklyPlans.id))
  .where(
    and(
      eq(dailyThemes.userId, userId),
      eq(dailyThemes.date, today),
      eq(weeklyPlans.status, "active"),
      isNull(weeklyPlans.deletedAt)
    )
  );
```

**Step 2: Add theme section to briefing prompt**

Add to the AI prompt data a section for the daily theme and its curated tasks. The AI should render a "Today's Theme" section with the theme name and the curated task list, placed before the existing schedule section.

**Step 3: Commit**

```bash
git add lib/daily-briefing/generate.ts
git commit -m "feat: include daily theme and curated tasks in daily briefing"
```

---

### Task 11: UI — Weekly Review Tabs (Assess, Review, Plan)

**Files:**
- Modify: `app/(app)/weekly-reviews/page.tsx`

**Step 1: Read the current weekly reviews page**

Read `app/(app)/weekly-reviews/page.tsx` to understand the current UI structure.

**Step 2: Add tab navigation**

Add a tab bar at the top of the detail pane (right side of split view) with three tabs: "Assess", "Review", "Plan". The "Review" tab contains the existing content. "Assess" and "Plan" are new.

Use a simple state variable `activeTab: "assess" | "review" | "plan"` with styled tab buttons.

**Step 3: Build the Assess tab**

- Fetch the previous week's plan via `GET /api/weekly-plans` (find the most recent assessed/active plan)
- Display: score gauge (SVG ring), Big 3 summary with status icons, AI narrative, theme adherence grid
- Textarea for user reflection with save button (POST to `/api/weekly-plans/[id]/reflection`)
- If no previous plan exists, show a message: "No plan to assess yet. Start by creating your first weekly plan."

**Step 4: Build the Plan tab**

- "Get AI Suggestions" button → POST to `/api/weekly-plans/suggest`
- Big 3 Picker: list of open cards with checkboxes, AI pre-selects 3. User can change selections.
- Daily Themes grid: 7-day row showing theme name + rationale for each day. Click to override (inline edit).
- Task curation: expandable per-day sections showing 5-7 suggested cards. Can remove/add.
- "Confirm Plan" button → POST to `/api/weekly-plans` then POST to `/api/weekly-plans/[id]/activate`

**Step 5: Commit**

```bash
git add app/(app)/weekly-reviews/
git commit -m "feat: add Assess and Plan tabs to weekly review page"
```

---

### Task 12: UI — Kanban Focus Column & Big 3 Badges

**Files:**
- Modify: `components/kanban/KanbanBoard.tsx`
- Modify: `components/kanban/Column.tsx`
- Modify: `components/kanban/Card.tsx`
- Modify: `components/kanban/BoardHeader.tsx`

**Step 1: Update Card component for Big 3 badge**

In `components/kanban/Card.tsx`, add a visual badge when `card.isBigThree` is true:

- Numbered star icon (position in bigThreeCardIds array determines number)
- Accent border (e.g., `border-amber-400` or `ring-2 ring-amber-400`)

**Step 2: Update Column component for Focus column styling**

In `components/kanban/Column.tsx`:

- Check `column.isFocusColumn` — if true, add distinct styling (accent background, target icon in header)
- Prevent deletion/reordering of Focus column

**Step 3: Add daily theme banner to BoardHeader**

In `components/kanban/BoardHeader.tsx`:

- Fetch today's theme via API (or pass from parent)
- Display a subtle banner: "Today's Theme: [theme]"
- Expandable panel showing the curated task shortlist for today
- Clicking a task scrolls to / highlights it on the board

**Step 4: Update KanbanBoard to handle Focus column ordering**

In `components/kanban/KanbanBoard.tsx`:

- Ensure Focus column always renders first (position 0)
- Prevent drag-reorder of Focus column
- Hide Focus column when no active plan exists

**Step 5: Commit**

```bash
git add components/kanban/
git commit -m "feat: add Focus column, Big 3 badges, and daily theme banner to Kanban"
```

---

### Task 13: Score Trend Chart on Weekly Reviews List

**Files:**
- Modify: `app/(app)/weekly-reviews/page.tsx`

**Step 1: Fetch score history**

When loading the weekly reviews list, also fetch weekly plans with scores (GET `/api/weekly-plans`). Match plans to reviews by `weeklyReviewId` or `weekStart`.

**Step 2: Add sparkline**

Add a small sparkline or mini bar chart showing the last 4-8 weeks of assessment scores. Use inline SVG (no new charting library needed for a simple sparkline). Display it above the reviews list or in the header area.

**Step 3: Commit**

```bash
git add app/(app)/weekly-reviews/
git commit -m "feat: add assessment score trend sparkline to weekly reviews"
```

---

### Task 14: Integration Testing

**Files:**
- Create: `__tests__/weekly-plan/generate.test.ts`
- Create: `__tests__/weekly-plan/assess.test.ts`
- Create: `__tests__/weekly-plan/rollover.test.ts`

**Step 1: Test plan generation**

Test `getUpcomingWeekRange` returns correct Monday-Sunday range for various input dates.

**Step 2: Test assessment scoring**

Test that the assessment prompt includes correct data and the response is parsed correctly. Mock the AI client.

**Step 3: Test rollover logic**

Test that rollover clears Big 3 flags, moves cards back to origin columns, and handles missing return columns gracefully.

**Step 4: Commit**

```bash
git add __tests__/weekly-plan/
git commit -m "test: add unit tests for weekly plan generation, assessment, and rollover"
```

---

## Task Dependency Order

```
Task 1 (weekly_plans table)
  → Task 2 (daily_themes table)
    → Task 3 (cards/columns modifications)
      → Task 4 (AI prompts)
        → Task 5 (plan generation logic)
        → Task 6 (assessment logic)
        → Task 7 (rollover logic)
          → Task 8 (API routes)
            → Task 9 (assessment email & cron)
            → Task 10 (daily briefing modification)
            → Task 11 (UI: weekly review tabs)
            → Task 12 (UI: Kanban changes)
            → Task 13 (UI: score trend)
              → Task 14 (integration tests)
```

Tasks 5, 6, 7 can be done in parallel after Task 4.
Tasks 8-13 can be partially parallelized after Tasks 5-7 are complete.
Task 14 should be last.
