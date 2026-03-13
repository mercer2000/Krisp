# Weekly Planning System — Design Document

**Date:** 2026-03-13
**Approach:** A — Phased Weekly Cycle
**Status:** Approved

## Overview

Integrate a forward-looking weekly planning methodology into MyOpenBrain's existing Weekly Review feature. The system adds three capabilities: Big 3 priority tracking, AI-suggested daily themes with curated task lists, and an end-of-week assessment with scoring. The goal is to create a cohesive 30-minute weekly ritual: Assess last week → Review what happened → Plan next week.

This is inspired by structured weekly planning methodologies (leveraged priorities, day theming, end-of-week reflection) but branded and designed as MyOpenBrain's own system.

## Data Model

### New Tables

#### `weekly_plans`

One per week, linked to the weekly review.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `userId` | uuid | FK to users, RLS |
| `weekStart` | date | Monday of the plan week |
| `weekEnd` | date | Sunday of the plan week |
| `weeklyReviewId` | uuid, nullable | FK to `weekly_reviews` |
| `bigThreeCardIds` | json | Array of 3 card IDs |
| `aiAssessment` | text (encrypted) | AI-generated end-of-week analysis |
| `userReflection` | text (encrypted) | User's own notes |
| `assessmentScore` | integer | 1-10, AI-calculated |
| `assessmentEmailSentAt` | timestamp, nullable | When assessment email was sent |
| `status` | text | `planning` → `active` → `assessed` |
| `createdAt` | timestamp | |
| `updatedAt` | timestamp | |

#### `daily_themes`

One per day per plan.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `weeklyPlanId` | uuid | FK to `weekly_plans` |
| `userId` | uuid | FK to users, RLS |
| `date` | date | The specific day |
| `theme` | text | e.g., "Marketing", "Deep Work" |
| `aiRationale` | text (encrypted) | Why the AI suggested this theme |
| `suggestedCardIds` | json | Array of 5-7 card IDs |
| `isOverridden` | boolean | Did user change the AI suggestion? |

### Modifications to Existing Tables

#### `cards` — Add:

- `isBigThree` (boolean, default false) — visual flag
- `bigThreeWeekStart` (date, nullable) — which week this is a Big 3 for

#### `columns` — Add:

- `isFocusColumn` (boolean, default false) — marks the special Focus column

#### `weekly_reviews` — Add:

- `weeklyPlanId` (uuid, FK, nullable) — link back to plan

## Weekly Review Flow: Assess → Review → Plan

The Weekly Review page evolves from a single view into a 3-tab flow.

### Tab 1: Assess (new)

- Only appears if a `weekly_plan` exists for the previous week
- Shows AI-generated assessment:
  - Big 3 completion status (checkmarks)
  - Theme adherence summary
  - Action items closed vs opened
  - Meeting load analysis
- Assessment score (1-10) displayed as a visual gauge/ring
- Text area for personal reflection ("What would you do differently?")
- AI pre-populates observations, e.g., "You completed 2/3 Big 3 items. The blocked item 'Redesign landing page' has been carried forward 3 weeks — consider breaking it down or dropping it."
- Save reflection button updates the `weekly_plan` record

### Tab 2: Review (existing, mostly unchanged)

- Synthesis report, topic clusters, cross-day patterns, unresolved action items
- Everything that exists today stays the same
- Minor addition: callout banner showing "Last week's plan score: 7/10" with link to Assess tab

### Tab 3: Plan (new)

- **Big 3 Picker**: Kanban cards sorted by priority/due date. Select 3 (or accept AI pre-suggestions based on overdue items, priorities, and assessment patterns). Selected cards get `isBigThree` flag and appear in Focus column.
- **Daily Themes**: AI generates suggested themes for Mon-Sun based on calendar events, meeting types, Big 3 priorities, and open tasks. Displayed as a 7-day grid with theme name + rationale. Click any day to override.
- **Task Curation**: Once themes are set, AI populates each day's suggested task shortlist (5-7 cards). Accept, remove, or add tasks.
- **Confirm Plan** button: Sets plan to `active`, applies Big 3 tags, creates/updates Focus column.

Tabs are navigable freely (not enforced sequential). Review and plan generation are separate AI calls.

## Kanban Board: Big 3 & Focus Column

### Focus Column

- Auto-appears as the first column when a weekly plan is activated
- Marked with `isFocusColumn: true` — one per board
- Visual distinction: accent border/background, star or target icon in header
- Big 3 cards automatically placed here when plan is confirmed
- Cards store their origin column (reuse snooze pattern with return column tracking)
- Completed Big 3 cards or week rollover → cards return to original column
- Cannot be deleted or reordered while plan is active
- Hidden when no active plan exists

### Big 3 Visual Treatment

- Cards with `isBigThree: true` get a numbered star badge ("1", "2", "3") visible in any column
- Subtle glow or accent border distinguishes them
- Badge persists even if dragged out of Focus column
- Previous week's flags cleared on rollover

### Week Rollover Logic

- Triggered when new weekly plan is confirmed, or Monday midnight (whichever first)
- Clears `isBigThree` and `bigThreeWeekStart` on all cards
- Moves remaining Focus column cards back to origin columns
- Focus column hides until next plan activation

## Daily Themes & AI Task Curation

### Theme Generation (AI prompt)

- **Input**: upcoming week's calendar events, Big 3 cards, all open Kanban cards (tags, priority, due dates), previous week's themes, meeting schedule
- AI analyzes activity clustering and suggests a short-phrase theme per day
- Each theme includes 1-2 sentence rationale
- AI avoids scheduling deep work themes on heavy-meeting days

### Task Curation (AI prompt)

- For each themed day, AI selects 5-7 matching cards
- Ranking factors: tag relevance to theme, priority level, due date proximity, Big 3 status, estimated complexity
- Big 3 items distributed across the week (not all on Monday)
- Stored as `suggestedCardIds` in `daily_themes`

### Where Daily Themes Appear

1. **Weekly Plan tab** — 7-day grid during planning
2. **Daily Briefing email** — New section: "Today's Theme: [theme]" with curated task list. Replaces/supplements current "overdue cards" section.
3. **Kanban Board header** — Subtle banner: "Today's Theme: Deep Build" with expandable curated shortlist. Clicking a task scrolls/highlights it on the board.

### User Overrides

- Change a day's theme → AI re-curates tasks automatically
- Manually add/remove tasks without changing theme
- Override persists (`isOverridden: true`)

## End-of-Week Assessment & Email

### Assessment Generation (AI prompt)

- **Trigger**: Friday afternoon (configurable time) via cron, or manually
- **Input**: active `weekly_plan` (Big 3 + completion status, daily themes + actual work), action items opened/closed, meetings held, calendar adherence
- **Output** (structured JSON):
  - `score` (1-10): Big 3 completion 40%, theme adherence 30%, action item closure 20%, reflection streak bonus 10%
  - `bigThreeSummary`: per-item status with brief context
  - `themeAdherence`: per-day assessment
  - `highlights`: 2-3 wins
  - `carryForward`: items to consider for next week's Big 3
  - `narrative`: 2-3 paragraph assessment in supportive coaching tone

### Assessment Email

- Follows daily briefing pattern (HTML, cron-triggered)
- Sections: Score badge, Big 3 status, Top highlights, Carry forward items, CTA: "Plan Next Week →"
- Stored in `assessmentEmailSentAt`
- Same AI client and email infrastructure as daily briefings

### Assessment in App

- Lives in Assess tab of the following week's review
- AI narrative + score gauge
- User reflection text area
- Save reflection → plan status moves to `assessed`
- Historical assessments viewable

### Score Trend

- Sparkline/chart on Weekly Reviews list view showing last 4-8 weeks of scores
- Visualizes consistency and improvement over time

## AI Prompts (New)

### Weekly Plan Generator

Analyzes cards, calendar, and previous assessment to suggest Big 3 and daily themes.

### Daily Task Curator

For each themed day, selects and ranks 5-7 relevant cards.

### Week Assessment Analyst

Evaluates the week against the plan, produces structured scoring and narrative.

## Integration Points

- **Daily Briefing**: Gains "Today's Theme" section with curated tasks
- **Kanban Board**: Focus column, Big 3 badges, theme banner
- **Weekly Review**: 3-tab flow (Assess → Review → Plan)
- **Email**: Assessment email (new cron job)
- **Existing AI prompts**: Unchanged — new prompts added alongside

## Encryption

Following existing patterns, encrypt these fields:
- `weekly_plans.aiAssessment`
- `weekly_plans.userReflection`
- `daily_themes.aiRationale`
