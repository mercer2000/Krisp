# Calendar Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the flat-list calendar page with a full visual calendar supporting Month, Week, Day, and Agenda views with account-based color coding and Create Card action.

**Architecture:** Custom-built calendar grid components (no library). Reuses existing `useCalendarEventsInRange` hook and calendar sync hooks. New components under `components/calendar/`. Page state driven by URL search params for bookmarkability. Event detail popover with inline "Create Card" flow using existing `useCreateCard` hook.

**Tech Stack:** React 19, Tailwind CSS v4, native Date math, existing React Query hooks, existing Kanban card creation API.

**Design doc:** `docs/plans/2026-03-13-calendar-redesign-design.md`

---

### Task 1: Calendar Utilities — Date Math & Color Palette

**Files:**
- Create: `components/calendar/calendarUtils.ts`

**Step 1: Create calendarUtils.ts with all date helpers and color palette**

```typescript
import type { CalendarEvent } from "@/types";

// ---------------------------------------------------------------------------
// Color palette — 8 muted colors with light/dark variants
// ---------------------------------------------------------------------------

export const ACCOUNT_COLORS = [
  { name: "slate-blue",  bg: "rgba(71,85,170,0.12)",  bgDark: "rgba(120,140,220,0.18)", border: "#4755aa", text: "#3d4a8f", textDark: "#98a8e8" },
  { name: "terracotta",  bg: "rgba(180,100,70,0.12)",  bgDark: "rgba(210,140,100,0.18)", border: "#b46446", text: "#954e33", textDark: "#d4a080" },
  { name: "sage",        bg: "rgba(90,140,100,0.12)",  bgDark: "rgba(120,175,130,0.18)", border: "#5a8c64", text: "#44724d", textDark: "#8fc49a" },
  { name: "plum",        bg: "rgba(140,80,150,0.12)",  bgDark: "rgba(175,120,185,0.18)", border: "#8c5096", text: "#763d80", textDark: "#c090cc" },
  { name: "amber",       bg: "rgba(180,140,50,0.12)",  bgDark: "rgba(210,175,80,0.18)",  border: "#b48c32", text: "#8f7020", textDark: "#d4b860" },
  { name: "teal",        bg: "rgba(60,145,145,0.12)",  bgDark: "rgba(90,180,180,0.18)",  border: "#3c9191", text: "#2d7575", textDark: "#70c4c4" },
  { name: "rose",        bg: "rgba(180,80,100,0.12)",  bgDark: "rgba(210,120,140,0.18)", border: "#b45064", text: "#953d50", textDark: "#d48898" },
  { name: "indigo",      bg: "rgba(80,80,170,0.12)",   bgDark: "rgba(120,120,210,0.18)", border: "#5050aa", text: "#3d3d8f", textDark: "#9898e0" },
] as const;

export type AccountColorEntry = (typeof ACCOUNT_COLORS)[number];

export interface CalendarAccount {
  id: string;
  email: string;
  provider: "google" | "outlook" | "graph";
  lastSyncAt?: string | null;
}

/**
 * Returns a stable color for an account by sorting all accounts
 * (provider, then email) and mapping index to palette.
 */
export function getAccountColor(accountId: string, allAccounts: CalendarAccount[]): AccountColorEntry {
  const sorted = [...allAccounts].sort((a, b) => {
    if (a.provider !== b.provider) return a.provider.localeCompare(b.provider);
    return a.email.localeCompare(b.email);
  });
  const idx = sorted.findIndex((a) => a.id === accountId);
  return ACCOUNT_COLORS[(idx >= 0 ? idx : 0) % ACCOUNT_COLORS.length];
}

/**
 * Determine which account an event belongs to based on its graphEventId and credentialId.
 */
export function getEventAccountId(event: CalendarEvent, accounts: CalendarAccount[]): string | null {
  if (event.graphEventId.startsWith("gcal_")) {
    // Google event — match by credentialId or first google account
    const googleAccounts = accounts.filter((a) => a.provider === "google");
    return googleAccounts[0]?.id ?? null;
  }
  if (event.credentialId) {
    // Graph event — credentialId maps directly
    const graphAccount = accounts.find((a) => a.provider === "graph" && a.id === event.credentialId);
    return graphAccount?.id ?? null;
  }
  // Outlook event
  const outlookAccounts = accounts.filter((a) => a.provider === "outlook");
  return outlookAccounts[0]?.id ?? null;
}

// ---------------------------------------------------------------------------
// Date math helpers
// ---------------------------------------------------------------------------

/** Monday of the week containing `date` (ISO weeks start Monday). */
export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday = 1
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Sunday end-of-day for the week containing `date`. */
export function endOfWeek(date: Date): Date {
  const d = startOfWeek(date);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

/** First day of the month. */
export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** Last day of the month. */
export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

/** Start of day (midnight). */
export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** End of day (23:59:59.999). */
export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/** Add N days to a date. */
export function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

/** Add N months to a date. */
export function addMonths(date: Date, n: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

/** Check if two dates are the same calendar day. */
export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

/** Check if a date is today. */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * Build the 6-row month grid (42 cells).
 * Returns array of Date objects starting from the Monday of the week
 * containing the 1st of the month.
 */
export function getMonthGridDates(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const gridStart = startOfWeek(first);
  const dates: Date[] = [];
  for (let i = 0; i < 42; i++) {
    dates.push(addDays(gridStart, i));
  }
  return dates;
}

/**
 * Get the 7 dates for a week view starting from the Monday
 * of the week containing `date`.
 */
export function getWeekDates(date: Date): Date[] {
  const monday = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/**
 * Compute the date range to fetch events for based on view and current date.
 */
export function getViewDateRange(view: ViewType, date: Date): { start: Date; end: Date } {
  switch (view) {
    case "month": {
      const gridDates = getMonthGridDates(date.getFullYear(), date.getMonth());
      return { start: gridDates[0], end: endOfDay(gridDates[41]) };
    }
    case "week":
      return { start: startOfWeek(date), end: endOfWeek(date) };
    case "day":
      return { start: startOfDay(date), end: endOfDay(date) };
    case "agenda":
      return { start: startOfDay(new Date()), end: endOfDay(addDays(new Date(), 14)) };
  }
}

/**
 * Navigate the current date based on view and direction.
 */
export function navigateDate(date: Date, view: ViewType, direction: "prev" | "next"): Date {
  const delta = direction === "next" ? 1 : -1;
  switch (view) {
    case "month":
      return addMonths(date, delta);
    case "week":
      return addDays(date, delta * 7);
    case "day":
    case "agenda":
      return addDays(date, delta);
  }
}

/**
 * Format the header title for the current view and date.
 */
export function getViewTitle(view: ViewType, date: Date): string {
  switch (view) {
    case "month":
      return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
    case "week": {
      const weekStart = startOfWeek(date);
      const weekEnd = addDays(weekStart, 6);
      const startStr = weekStart.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      const endStr = weekEnd.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
      return `${startStr} – ${endStr}`;
    }
    case "day":
      return date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    case "agenda":
      return "Upcoming";
  }
}

export type ViewType = "month" | "week" | "day" | "agenda";

/**
 * Format a time string (e.g., "9:00 AM") from a Date.
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

/**
 * Format a time range for an event.
 */
export function formatTimeRange(event: CalendarEvent): string {
  if (event.isAllDay) return "All day";
  const start = new Date(event.startDateTime);
  const end = new Date(event.endDateTime);
  return `${formatTime(start)} – ${formatTime(end)}`;
}

/**
 * Compute top position and height for an event block in the time grid.
 * Each hour = 60px.
 */
export function getEventPosition(event: CalendarEvent, dayStart: Date): { top: number; height: number } {
  const eventStart = new Date(event.startDateTime);
  const eventEnd = new Date(event.endDateTime);

  const startMinutes = Math.max(0, (eventStart.getTime() - dayStart.getTime()) / 60000);
  const endMinutes = Math.min(24 * 60, (eventEnd.getTime() - dayStart.getTime()) / 60000);

  const top = startMinutes; // 1px per minute
  const height = Math.max(15, endMinutes - startMinutes); // minimum 15min height

  return { top, height };
}

/**
 * Filter events for a specific day.
 */
export function getEventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  const dayStart = startOfDay(day).getTime();
  const dayEnd = endOfDay(day).getTime();
  return events.filter((e) => {
    const eStart = new Date(e.startDateTime).getTime();
    const eEnd = new Date(e.endDateTime).getTime();
    return eStart < dayEnd && eEnd > dayStart;
  });
}

/**
 * Separate all-day events from timed events.
 */
export function partitionEvents(events: CalendarEvent[]): {
  allDay: CalendarEvent[];
  timed: CalendarEvent[];
} {
  return {
    allDay: events.filter((e) => e.isAllDay),
    timed: events.filter((e) => !e.isAllDay),
  };
}

/**
 * Group events by date string (for agenda view).
 */
export function groupEventsByDate(events: CalendarEvent[]): [string, CalendarEvent[]][] {
  const groups: Record<string, CalendarEvent[]> = {};
  for (const event of events) {
    const key = new Date(event.startDateTime).toDateString();
    if (!groups[key]) groups[key] = [];
    groups[key].push(event);
  }
  return Object.entries(groups).sort(
    ([a], [b]) => new Date(a).getTime() - new Date(b).getTime()
  );
}

/**
 * Format a date for the agenda view with Today/Tomorrow labels.
 */
export function formatAgendaDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isToday(d)) return "Today";
  if (isSameDay(d, addDays(new Date(), 1))) return "Tomorrow";
  return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}
```

**Step 2: Commit**

```bash
git add components/calendar/calendarUtils.ts
git commit -m "feat(calendar): add date math utilities and account color palette"
```

---

### Task 2: EventPill Component (Month View)

**Files:**
- Create: `components/calendar/EventPill.tsx`

**Step 1: Create EventPill — compact event for month grid cells**

```typescript
"use client";

import type { CalendarEvent } from "@/types";
import { formatTime, type AccountColorEntry } from "./calendarUtils";

interface EventPillProps {
  event: CalendarEvent;
  color: AccountColorEntry;
  onClick: (event: CalendarEvent, rect: DOMRect) => void;
}

export function EventPill({ event, color, onClick }: EventPillProps) {
  const startTime = event.isAllDay ? null : formatTime(new Date(event.startDateTime));
  const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");

  return (
    <button
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        onClick(event, rect);
      }}
      className="group flex w-full items-center gap-1 rounded px-1.5 py-0.5 text-left text-[11px] leading-tight transition-all hover:shadow-sm"
      style={{
        backgroundColor: isDark ? color.bgDark : color.bg,
        borderLeft: `2px solid ${color.border}`,
        color: isDark ? color.textDark : color.text,
      }}
    >
      {startTime && (
        <span className="shrink-0 font-medium">{startTime}</span>
      )}
      <span className="truncate">{event.subject || "(No subject)"}</span>
    </button>
  );
}
```

**Step 2: Commit**

```bash
git add components/calendar/EventPill.tsx
git commit -m "feat(calendar): add EventPill component for month grid"
```

---

### Task 3: EventBlock Component (Week/Day View)

**Files:**
- Create: `components/calendar/EventBlock.tsx`

**Step 1: Create EventBlock — positioned time block for week/day grids**

```typescript
"use client";

import type { CalendarEvent } from "@/types";
import { formatTimeRange, type AccountColorEntry } from "./calendarUtils";

interface EventBlockProps {
  event: CalendarEvent;
  color: AccountColorEntry;
  top: number;
  height: number;
  onClick: (event: CalendarEvent, rect: DOMRect) => void;
  /** Width percentage and left offset for overlapping events */
  width?: number;
  left?: number;
}

export function EventBlock({ event, color, top, height, onClick, width = 100, left = 0 }: EventBlockProps) {
  const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
  const isCompact = height < 30;

  return (
    <button
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        onClick(event, rect);
      }}
      className="absolute rounded-md px-2 py-1 text-left transition-shadow hover:shadow-md hover:z-20 overflow-hidden cursor-pointer"
      style={{
        top: `${top}px`,
        height: `${height}px`,
        width: `calc(${width}% - 4px)`,
        left: `${left}%`,
        backgroundColor: isDark ? color.bgDark : color.bg,
        borderLeft: `3px solid ${color.border}`,
        color: isDark ? color.textDark : color.text,
      }}
    >
      {isCompact ? (
        <span className="text-[11px] font-medium truncate block">
          {event.subject || "(No subject)"}
        </span>
      ) : (
        <>
          <span className="text-[11px] font-semibold truncate block leading-tight">
            {event.subject || "(No subject)"}
          </span>
          <span className="text-[10px] opacity-80 truncate block">
            {formatTimeRange(event)}
          </span>
          {height >= 50 && event.location && (
            <span className="text-[10px] opacity-60 truncate block mt-0.5">
              {event.location}
            </span>
          )}
        </>
      )}
    </button>
  );
}
```

**Step 2: Commit**

```bash
git add components/calendar/EventBlock.tsx
git commit -m "feat(calendar): add EventBlock component for week/day time grids"
```

---

### Task 4: TimeGrid Component (Shared Week/Day)

**Files:**
- Create: `components/calendar/TimeGrid.tsx`

**Step 1: Create TimeGrid — the scrollable hourly grid used by Week and Day views**

This component renders the 24-hour lines, handles the "current time" red indicator, and manages scroll-to-now on mount.

```typescript
"use client";

import { useEffect, useRef, useMemo } from "react";
import type { CalendarEvent } from "@/types";
import { EventBlock } from "./EventBlock";
import {
  startOfDay,
  getEventPosition,
  isToday,
  type AccountColorEntry,
  type CalendarAccount,
  getEventAccountId,
  getAccountColor,
} from "./calendarUtils";

const HOUR_HEIGHT = 60; // px per hour
const HOURS = Array.from({ length: 24 }, (_, i) => i);

interface TimeGridColumn {
  date: Date;
  events: CalendarEvent[];
}

interface TimeGridProps {
  columns: TimeGridColumn[];
  accounts: CalendarAccount[];
  onEventClick: (event: CalendarEvent, rect: DOMRect) => void;
}

/** Detect overlapping events and assign width/left for each. */
function layoutEvents(events: CalendarEvent[]): Array<{ event: CalendarEvent; width: number; left: number }> {
  if (events.length === 0) return [];

  const sorted = [...events].sort(
    (a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
  );

  const columns: CalendarEvent[][] = [];

  for (const event of sorted) {
    const eStart = new Date(event.startDateTime).getTime();
    let placed = false;
    for (const col of columns) {
      const lastInCol = col[col.length - 1];
      if (new Date(lastInCol.endDateTime).getTime() <= eStart) {
        col.push(event);
        placed = true;
        break;
      }
    }
    if (!placed) {
      columns.push([event]);
    }
  }

  const totalCols = columns.length;
  const result: Array<{ event: CalendarEvent; width: number; left: number }> = [];

  for (let colIdx = 0; colIdx < columns.length; colIdx++) {
    for (const event of columns[colIdx]) {
      result.push({
        event,
        width: 100 / totalCols,
        left: (100 / totalCols) * colIdx,
      });
    }
  }

  return result;
}

export function TimeGrid({ columns, accounts, onEventClick }: TimeGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Scroll to current time on mount
  useEffect(() => {
    if (scrollRef.current) {
      const scrollTarget = Math.max(0, (currentMinutes / 60) * HOUR_HEIGHT - 200);
      scrollRef.current.scrollTop = scrollTarget;
    }
  }, []);

  const isSingleColumn = columns.length === 1;

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden">
      <div className="flex" style={{ minHeight: HOUR_HEIGHT * 24 }}>
        {/* Time labels column */}
        <div className="w-14 shrink-0 border-r border-[var(--border)]">
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="relative text-[10px] text-[var(--muted-foreground)] tracking-wide"
              style={{ height: HOUR_HEIGHT }}
            >
              <span className="absolute -top-[7px] right-2">
                {hour === 0 ? "" : `${hour % 12 || 12} ${hour < 12 ? "AM" : "PM"}`}
              </span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        {columns.map((col, colIdx) => {
          const dayStart = startOfDay(col.date);
          const todayCol = isToday(col.date);
          const laidOut = layoutEvents(col.events);

          return (
            <div
              key={colIdx}
              className={`relative flex-1 ${colIdx < columns.length - 1 ? "border-r border-[var(--border)]" : ""}`}
            >
              {/* Hour lines */}
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="border-b border-[var(--border)] opacity-50"
                  style={{ height: HOUR_HEIGHT }}
                />
              ))}

              {/* Current time indicator */}
              {todayCol && (
                <div
                  className="absolute left-0 right-0 z-30 pointer-events-none"
                  style={{ top: (currentMinutes / 60) * HOUR_HEIGHT }}
                >
                  <div className="flex items-center">
                    <div className="h-2.5 w-2.5 rounded-full bg-[var(--destructive)] -ml-[5px]" />
                    <div className="flex-1 h-[2px] bg-[var(--destructive)]" />
                  </div>
                </div>
              )}

              {/* Event blocks */}
              <div className="absolute inset-0 px-0.5">
                {laidOut.map(({ event, width, left }) => {
                  const pos = getEventPosition(event, dayStart);
                  const accountId = getEventAccountId(event, accounts);
                  const color = accountId ? getAccountColor(accountId, accounts) : getAccountColor("", accounts);

                  return (
                    <EventBlock
                      key={event.id}
                      event={event}
                      color={color}
                      top={pos.top}
                      height={pos.height}
                      width={width}
                      left={left}
                      onClick={onEventClick}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/calendar/TimeGrid.tsx
git commit -m "feat(calendar): add TimeGrid component with hour lines, current time indicator, and overlap layout"
```

---

### Task 5: CalendarHeader Component

**Files:**
- Create: `components/calendar/CalendarHeader.tsx`

**Step 1: Create CalendarHeader with navigation, view toggle, account filters, and sync**

```typescript
"use client";

import {
  type ViewType,
  type CalendarAccount,
  getViewTitle,
  getAccountColor,
  ACCOUNT_COLORS,
} from "./calendarUtils";

interface CalendarHeaderProps {
  currentDate: Date;
  activeView: ViewType;
  accounts: CalendarAccount[];
  visibleAccounts: Set<string>;
  isSyncing: boolean;
  onNavigate: (direction: "prev" | "next") => void;
  onToday: () => void;
  onViewChange: (view: ViewType) => void;
  onToggleAccount: (accountId: string) => void;
  onSync: () => void;
}

const VIEW_OPTIONS: { value: ViewType; label: string }[] = [
  { value: "month", label: "Month" },
  { value: "week", label: "Week" },
  { value: "day", label: "Day" },
  { value: "agenda", label: "Agenda" },
];

export function CalendarHeader({
  currentDate,
  activeView,
  accounts,
  visibleAccounts,
  isSyncing,
  onNavigate,
  onToday,
  onViewChange,
  onToggleAccount,
  onSync,
}: CalendarHeaderProps) {
  const title = getViewTitle(activeView, currentDate);

  return (
    <div className="mb-4 space-y-3">
      {/* Top row: nav + title + view toggle + sync */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate("prev")}
            className="rounded-md border border-[var(--border)] p-1.5 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
            aria-label="Previous"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 12L6 8l4-4" />
            </svg>
          </button>
          <button
            onClick={onToday}
            className="rounded-md border border-[var(--border)] px-2.5 py-1 text-xs font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--accent)]"
          >
            Today
          </button>
          <button
            onClick={() => onNavigate("next")}
            className="rounded-md border border-[var(--border)] p-1.5 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
            aria-label="Next"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 4l4 4-4 4" />
            </svg>
          </button>
          <h1 className="ml-2 text-lg font-semibold tracking-tight text-[var(--foreground)]">
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex rounded-lg border border-[var(--border)] bg-[var(--card)] p-0.5">
            {VIEW_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onViewChange(opt.value)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  activeView === opt.value
                    ? "bg-[var(--foreground)] text-[var(--background)]"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Sync button */}
          <button
            onClick={onSync}
            disabled={isSyncing}
            className="rounded-md bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
          >
            {isSyncing ? "Syncing..." : "Sync"}
          </button>
        </div>
      </div>

      {/* Account filter row */}
      {accounts.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {accounts.map((account) => {
            const color = getAccountColor(account.id, accounts);
            const visible = visibleAccounts.has(account.id);
            return (
              <button
                key={account.id}
                onClick={() => onToggleAccount(account.id)}
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-all ${
                  visible
                    ? "border-[var(--border)] text-[var(--foreground)]"
                    : "border-transparent text-[var(--muted-foreground)] opacity-50"
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: color.border }}
                />
                <span className="truncate max-w-[160px]">{account.email}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/calendar/CalendarHeader.tsx
git commit -m "feat(calendar): add CalendarHeader with navigation, view toggle, and account filters"
```

---

### Task 6: MonthView Component

**Files:**
- Create: `components/calendar/MonthView.tsx`

**Step 1: Create MonthView — 6-row calendar grid with event pills**

```typescript
"use client";

import { useMemo } from "react";
import type { CalendarEvent } from "@/types";
import { EventPill } from "./EventPill";
import {
  getMonthGridDates,
  getEventsForDay,
  isToday,
  isSameDay,
  getAccountColor,
  getEventAccountId,
  type CalendarAccount,
} from "./calendarUtils";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MAX_VISIBLE_EVENTS = 3;

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  accounts: CalendarAccount[];
  visibleAccounts: Set<string>;
  onEventClick: (event: CalendarEvent, rect: DOMRect) => void;
  onDayClick: (date: Date) => void;
}

export function MonthView({
  currentDate,
  events,
  accounts,
  visibleAccounts,
  onEventClick,
  onDayClick,
}: MonthViewProps) {
  const gridDates = useMemo(
    () => getMonthGridDates(currentDate.getFullYear(), currentDate.getMonth()),
    [currentDate]
  );

  const currentMonth = currentDate.getMonth();

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Day name headers */}
      <div className="grid grid-cols-7 border-b border-[var(--border)]">
        {DAY_NAMES.map((name) => (
          <div
            key={name}
            className="py-2 text-center text-[11px] font-medium tracking-widest uppercase text-[var(--muted-foreground)]"
          >
            {name}
          </div>
        ))}
      </div>

      {/* 6-row grid */}
      <div className="grid grid-cols-7 grid-rows-6 flex-1 min-h-0">
        {gridDates.map((date, i) => {
          const isCurrentMonth = date.getMonth() === currentMonth;
          const today = isToday(date);
          const dayEvents = getEventsForDay(events, date).filter((e) => {
            const accountId = getEventAccountId(e, accounts);
            return !accountId || visibleAccounts.has(accountId);
          });
          const visibleEvents = dayEvents.slice(0, MAX_VISIBLE_EVENTS);
          const overflow = dayEvents.length - MAX_VISIBLE_EVENTS;

          return (
            <div
              key={i}
              className={`border-b border-r border-[var(--border)] p-1 min-h-[100px] flex flex-col ${
                !isCurrentMonth ? "opacity-40" : ""
              } ${today ? "bg-[var(--primary)]/[0.04]" : ""}`}
            >
              {/* Day number */}
              <button
                onClick={() => onDayClick(date)}
                className={`mb-0.5 self-end flex items-center justify-center h-6 w-6 rounded-full text-xs transition-colors hover:bg-[var(--accent)] ${
                  today
                    ? "bg-[var(--primary)] text-white font-bold hover:bg-[var(--primary)]"
                    : "text-[var(--foreground)] font-medium"
                }`}
              >
                {date.getDate()}
              </button>

              {/* Event pills */}
              <div className="flex-1 space-y-0.5 overflow-hidden">
                {visibleEvents.map((event) => {
                  const accountId = getEventAccountId(event, accounts);
                  const color = accountId
                    ? getAccountColor(accountId, accounts)
                    : getAccountColor("", accounts);
                  return (
                    <EventPill
                      key={event.id}
                      event={event}
                      color={color}
                      onClick={onEventClick}
                    />
                  );
                })}
                {overflow > 0 && (
                  <button
                    onClick={() => onDayClick(date)}
                    className="w-full px-1.5 py-0.5 text-[10px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] text-left transition-colors"
                  >
                    +{overflow} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/calendar/MonthView.tsx
git commit -m "feat(calendar): add MonthView component with 6-row grid and event pills"
```

---

### Task 7: WeekView Component

**Files:**
- Create: `components/calendar/WeekView.tsx`

**Step 1: Create WeekView — 7-column time grid with all-day row**

```typescript
"use client";

import { useMemo } from "react";
import type { CalendarEvent } from "@/types";
import { TimeGrid } from "./TimeGrid";
import { EventPill } from "./EventPill";
import {
  getWeekDates,
  getEventsForDay,
  partitionEvents,
  isToday,
  getAccountColor,
  getEventAccountId,
  type CalendarAccount,
} from "./calendarUtils";

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  accounts: CalendarAccount[];
  visibleAccounts: Set<string>;
  onEventClick: (event: CalendarEvent, rect: DOMRect) => void;
}

export function WeekView({ currentDate, events, accounts, visibleAccounts, onEventClick }: WeekViewProps) {
  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);

  const filteredEvents = useMemo(
    () =>
      events.filter((e) => {
        const accountId = getEventAccountId(e, accounts);
        return !accountId || visibleAccounts.has(accountId);
      }),
    [events, accounts, visibleAccounts]
  );

  const columns = useMemo(
    () =>
      weekDates.map((date) => {
        const dayEvents = getEventsForDay(filteredEvents, date);
        const { timed } = partitionEvents(dayEvents);
        return { date, events: timed };
      }),
    [weekDates, filteredEvents]
  );

  // Collect all-day events per day
  const allDayByDay = useMemo(
    () =>
      weekDates.map((date) => {
        const dayEvents = getEventsForDay(filteredEvents, date);
        return partitionEvents(dayEvents).allDay;
      }),
    [weekDates, filteredEvents]
  );

  const hasAllDay = allDayByDay.some((d) => d.length > 0);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Day headers */}
      <div className="grid grid-cols-[3.5rem_repeat(7,1fr)] border-b border-[var(--border)]">
        <div /> {/* spacer for time labels */}
        {weekDates.map((date, i) => {
          const today = isToday(date);
          return (
            <div
              key={i}
              className={`py-2 text-center border-l border-[var(--border)] ${today ? "bg-[var(--primary)]/[0.04]" : ""}`}
            >
              <div className="text-[10px] tracking-widest uppercase text-[var(--muted-foreground)]">
                {date.toLocaleDateString(undefined, { weekday: "short" })}
              </div>
              <div
                className={`text-lg font-semibold ${
                  today ? "text-[var(--primary)]" : "text-[var(--foreground)]"
                }`}
              >
                {date.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* All-day row */}
      {hasAllDay && (
        <div className="grid grid-cols-[3.5rem_repeat(7,1fr)] border-b border-[var(--border)]">
          <div className="text-[10px] text-[var(--muted-foreground)] p-1 text-right">all-day</div>
          {allDayByDay.map((dayAllDay, i) => (
            <div key={i} className="border-l border-[var(--border)] p-0.5 space-y-0.5">
              {dayAllDay.map((event) => {
                const accountId = getEventAccountId(event, accounts);
                const color = accountId ? getAccountColor(accountId, accounts) : getAccountColor("", accounts);
                return (
                  <EventPill key={event.id} event={event} color={color} onClick={onEventClick} />
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Time grid */}
      <TimeGrid columns={columns} accounts={accounts} onEventClick={onEventClick} />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/calendar/WeekView.tsx
git commit -m "feat(calendar): add WeekView with day headers, all-day row, and time grid"
```

---

### Task 8: DayView Component

**Files:**
- Create: `components/calendar/DayView.tsx`

**Step 1: Create DayView — single-column time grid with wider event blocks**

```typescript
"use client";

import { useMemo } from "react";
import type { CalendarEvent } from "@/types";
import { TimeGrid } from "./TimeGrid";
import { EventPill } from "./EventPill";
import {
  getEventsForDay,
  partitionEvents,
  getAccountColor,
  getEventAccountId,
  type CalendarAccount,
} from "./calendarUtils";

interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  accounts: CalendarAccount[];
  visibleAccounts: Set<string>;
  onEventClick: (event: CalendarEvent, rect: DOMRect) => void;
}

export function DayView({ currentDate, events, accounts, visibleAccounts, onEventClick }: DayViewProps) {
  const filteredEvents = useMemo(
    () =>
      events.filter((e) => {
        const accountId = getEventAccountId(e, accounts);
        return !accountId || visibleAccounts.has(accountId);
      }),
    [events, accounts, visibleAccounts]
  );

  const dayEvents = useMemo(() => getEventsForDay(filteredEvents, currentDate), [filteredEvents, currentDate]);
  const { allDay, timed } = useMemo(() => partitionEvents(dayEvents), [dayEvents]);

  const columns = useMemo(() => [{ date: currentDate, events: timed }], [currentDate, timed]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* All-day events */}
      {allDay.length > 0 && (
        <div className="border-b border-[var(--border)] p-2 space-y-1">
          <span className="text-[10px] text-[var(--muted-foreground)] tracking-widest uppercase">All day</span>
          <div className="flex flex-wrap gap-1">
            {allDay.map((event) => {
              const accountId = getEventAccountId(event, accounts);
              const color = accountId ? getAccountColor(accountId, accounts) : getAccountColor("", accounts);
              return (
                <EventPill key={event.id} event={event} color={color} onClick={onEventClick} />
              );
            })}
          </div>
        </div>
      )}

      {/* Time grid — single column */}
      <TimeGrid columns={columns} accounts={accounts} onEventClick={onEventClick} />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/calendar/DayView.tsx
git commit -m "feat(calendar): add DayView with single-column time grid"
```

---

### Task 9: AgendaView Component

**Files:**
- Create: `components/calendar/AgendaView.tsx`

**Step 1: Create AgendaView — cleaned up version of existing list view**

This preserves the existing agenda functionality but with the new aesthetic and account colors.

```typescript
"use client";

import { useMemo } from "react";
import type { CalendarEvent } from "@/types";
import {
  groupEventsByDate,
  formatAgendaDate,
  formatTimeRange,
  getAccountColor,
  getEventAccountId,
  type CalendarAccount,
} from "./calendarUtils";

interface AgendaViewProps {
  events: CalendarEvent[];
  accounts: CalendarAccount[];
  visibleAccounts: Set<string>;
  onEventClick: (event: CalendarEvent, rect: DOMRect) => void;
}

export function AgendaView({ events, accounts, visibleAccounts, onEventClick }: AgendaViewProps) {
  const filteredEvents = useMemo(
    () =>
      events.filter((e) => {
        const accountId = getEventAccountId(e, accounts);
        return !accountId || visibleAccounts.has(accountId);
      }),
    [events, accounts, visibleAccounts]
  );

  const grouped = useMemo(() => groupEventsByDate(filteredEvents), [filteredEvents]);

  if (grouped.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-[var(--muted-foreground)]">No upcoming events</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-2xl space-y-6 py-2">
        {grouped.map(([dateStr, dayEvents]) => (
          <div key={dateStr}>
            <h2 className="mb-2 text-xs font-semibold tracking-widest uppercase text-[var(--muted-foreground)]">
              {formatAgendaDate(dayEvents[0].startDateTime)}
            </h2>
            <div className="space-y-1.5">
              {dayEvents.map((event) => {
                const accountId = getEventAccountId(event, accounts);
                const color = accountId
                  ? getAccountColor(accountId, accounts)
                  : getAccountColor("", accounts);
                const isDark =
                  typeof document !== "undefined" &&
                  document.documentElement.classList.contains("dark");

                return (
                  <button
                    key={event.id}
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      onEventClick(event, rect);
                    }}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 text-left transition-shadow hover:shadow-sm flex items-start gap-3"
                  >
                    <div
                      className="mt-1 h-8 w-1 rounded-full shrink-0"
                      style={{ backgroundColor: color.border }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-[var(--foreground)]">
                        {event.subject || "(No subject)"}
                      </div>
                      <div className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                        {formatTimeRange(event)}
                      </div>
                      {event.location && (
                        <div className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                          {event.location}
                        </div>
                      )}
                    </div>
                    {event.showAs && (
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          event.showAs === "busy"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            : event.showAs === "tentative"
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                              : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        }`}
                      >
                        {event.showAs}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/calendar/AgendaView.tsx
git commit -m "feat(calendar): add AgendaView with grouped date list and account colors"
```

---

### Task 10: EventDetailPopover Component

**Files:**
- Create: `components/calendar/EventDetailPopover.tsx`

**Step 1: Create EventDetailPopover — shows event details and "Create Card" button**

```typescript
"use client";

import { useEffect, useRef } from "react";
import type { CalendarEvent } from "@/types";
import {
  formatTimeRange,
  getAccountColor,
  getEventAccountId,
  type CalendarAccount,
} from "./calendarUtils";

interface EventDetailPopoverProps {
  event: CalendarEvent;
  anchorRect: DOMRect;
  accounts: CalendarAccount[];
  onClose: () => void;
  onCreateCard: (event: CalendarEvent) => void;
}

export function EventDetailPopover({
  event,
  anchorRect,
  accounts,
  onClose,
  onCreateCard,
}: EventDetailPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  const accountId = getEventAccountId(event, accounts);
  const color = accountId ? getAccountColor(accountId, accounts) : getAccountColor("", accounts);
  const account = accounts.find((a) => a.id === accountId);
  const isGoogle = event.graphEventId.startsWith("gcal_");

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  // Position: try right of anchor, fall back to left
  const popoverWidth = 320;
  const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1200;
  const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 800;

  let left = anchorRect.right + 8;
  if (left + popoverWidth > viewportWidth - 16) {
    left = anchorRect.left - popoverWidth - 8;
  }
  if (left < 16) left = 16;

  let top = anchorRect.top;
  if (top + 400 > viewportHeight) {
    top = Math.max(16, viewportHeight - 400);
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Popover */}
      <div
        ref={popoverRef}
        className="absolute rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xl overflow-hidden"
        style={{ left, top, width: popoverWidth, maxHeight: 400 }}
      >
        {/* Color bar */}
        <div className="h-1" style={{ backgroundColor: color.border }} />

        <div className="p-4 space-y-3 overflow-y-auto" style={{ maxHeight: 392 }}>
          {/* Title */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--foreground)]">
              {event.subject || "(No subject)"}
            </h3>
            <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
              {formatTimeRange(event)}
            </p>
          </div>

          {/* Details */}
          <div className="space-y-2 text-xs text-[var(--muted-foreground)]">
            {event.location && (
              <div className="flex items-start gap-2">
                <svg className="mt-0.5 shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                <span>{event.location}</span>
              </div>
            )}
            {event.organizerName && (
              <div className="flex items-start gap-2">
                <svg className="mt-0.5 shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <span>Organizer: {event.organizerName}</span>
              </div>
            )}
            {account && (
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: color.border }}
                />
                <span>{account.email} ({isGoogle ? "Google" : "Outlook"})</span>
              </div>
            )}
          </div>

          {/* Attendees */}
          {event.attendees?.length > 0 && (
            <div>
              <p className="text-[10px] tracking-widest uppercase text-[var(--muted-foreground)] mb-1">
                Attendees ({event.attendees.length})
              </p>
              <div className="space-y-0.5 max-h-[120px] overflow-y-auto">
                {event.attendees.map((a, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                    <span
                      className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                        a.response === "accepted"
                          ? "bg-green-500"
                          : a.response === "declined"
                            ? "bg-red-500"
                            : a.response === "tentativelyAccepted"
                              ? "bg-yellow-500"
                              : "bg-gray-400"
                      }`}
                    />
                    <span className="truncate">{a.name || a.email}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1 border-t border-[var(--border)]">
            {event.webLink && (
              <a
                href={event.webLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-md border border-[var(--border)] px-3 py-1.5 text-center text-xs font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--accent)]"
              >
                Open in {isGoogle ? "Google" : "Outlook"}
              </a>
            )}
            <button
              onClick={() => onCreateCard(event)}
              className="flex-1 rounded-md bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:opacity-90"
            >
              Create Card
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/calendar/EventDetailPopover.tsx
git commit -m "feat(calendar): add EventDetailPopover with event details and action buttons"
```

---

### Task 11: CreateCardFromEvent Component

**Files:**
- Create: `components/calendar/CreateCardFromEvent.tsx`

**Dependencies:** Requires existing hooks from `lib/hooks/useBoard.ts` and `lib/hooks/useCards.ts`.

**Step 1: Create CreateCardFromEvent — inline board/column selector**

```typescript
"use client";

import { useState } from "react";
import type { CalendarEvent } from "@/types";
import { useBoards } from "@/lib/hooks/useBoard";
import { useCreateCard } from "@/lib/hooks/useCards";

interface CreateCardFromEventProps {
  event: CalendarEvent;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateCardFromEvent({ event, onClose, onCreated }: CreateCardFromEventProps) {
  const { data: boards, isLoading: boardsLoading } = useBoards();
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);
  const [title, setTitle] = useState(event.subject || "");

  const selectedBoard = boards?.find((b: any) => b.id === selectedBoardId);
  const columns = selectedBoard?.columns || [];

  const createCard = useCreateCard(selectedBoardId || "");

  // Auto-select first board when data loads
  if (boards?.length && !selectedBoardId) {
    setSelectedBoardId(boards[0].id);
  }
  if (columns.length && !selectedColumnId) {
    setSelectedColumnId(columns[0].id);
  }

  const handleCreate = () => {
    if (!selectedColumnId || !title.trim()) return;
    createCard.mutate(
      {
        columnId: selectedColumnId,
        title: title.trim(),
        description: [
          event.location ? `Location: ${event.location}` : null,
          event.organizerName ? `Organizer: ${event.organizerName}` : null,
          `Time: ${new Date(event.startDateTime).toLocaleString()} – ${new Date(event.endDateTime).toLocaleString()}`,
        ]
          .filter(Boolean)
          .join("\n"),
      },
      {
        onSuccess: () => {
          onCreated();
        },
      }
    );
  };

  return (
    <div className="space-y-3 p-4 border-t border-[var(--border)]">
      <h4 className="text-xs font-semibold tracking-widest uppercase text-[var(--muted-foreground)]">
        Create Card
      </h4>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Card title"
        className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
      />

      {boardsLoading ? (
        <div className="text-xs text-[var(--muted-foreground)]">Loading boards...</div>
      ) : (
        <>
          <select
            value={selectedBoardId || ""}
            onChange={(e) => {
              setSelectedBoardId(e.target.value);
              setSelectedColumnId(null);
            }}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-sm text-[var(--foreground)]"
          >
            {boards?.map((b: any) => (
              <option key={b.id} value={b.id}>
                {b.title}
              </option>
            ))}
          </select>

          <select
            value={selectedColumnId || ""}
            onChange={(e) => setSelectedColumnId(e.target.value)}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-sm text-[var(--foreground)]"
          >
            {columns.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </>
      )}

      <div className="flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--accent)]"
        >
          Cancel
        </button>
        <button
          onClick={handleCreate}
          disabled={!selectedColumnId || !title.trim() || createCard.isPending}
          className="flex-1 rounded-md bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
        >
          {createCard.isPending ? "Creating..." : "Create"}
        </button>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/calendar/CreateCardFromEvent.tsx
git commit -m "feat(calendar): add CreateCardFromEvent with board/column selector"
```

---

### Task 12: Rewrite CalendarPage — Wire Everything Together

**Files:**
- Modify: `app/(app)/calendar/page.tsx` (full rewrite)

**Step 1: Rewrite page.tsx to use all new components**

Replace the entire contents of `app/(app)/calendar/page.tsx` with:

```typescript
"use client";

import { useState, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  useCalendarEventsInRange,
  useCalendarSync,
  useSyncState,
  useOutlookCalendarStatus,
  useOutlookCalendarSync,
  useGoogleCalendarStatus,
  useGoogleCalendarSync,
} from "@/lib/hooks/useCalendar";
import type { CalendarEvent } from "@/types";
import { CalendarHeader } from "@/components/calendar/CalendarHeader";
import { MonthView } from "@/components/calendar/MonthView";
import { WeekView } from "@/components/calendar/WeekView";
import { DayView } from "@/components/calendar/DayView";
import { AgendaView } from "@/components/calendar/AgendaView";
import { EventDetailPopover } from "@/components/calendar/EventDetailPopover";
import { CreateCardFromEvent } from "@/components/calendar/CreateCardFromEvent";
import {
  type ViewType,
  type CalendarAccount,
  getViewDateRange,
  navigateDate,
} from "@/components/calendar/calendarUtils";

export default function CalendarPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State from URL search params
  const initialView = (searchParams.get("view") as ViewType) || "week";
  const initialDateStr = searchParams.get("date");
  const initialDate = initialDateStr ? new Date(initialDateStr) : new Date();

  const [activeView, setActiveView] = useState<ViewType>(initialView);
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [visibleAccounts, setVisibleAccounts] = useState<Set<string> | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<{ event: CalendarEvent; rect: DOMRect } | null>(null);
  const [showCreateCard, setShowCreateCard] = useState(false);

  // Update URL when view/date changes
  const updateUrl = useCallback(
    (view: ViewType, date: Date) => {
      const params = new URLSearchParams();
      params.set("view", view);
      params.set("date", date.toISOString().split("T")[0]);
      router.replace(`/calendar?${params.toString()}`, { scroll: false });
    },
    [router]
  );

  const handleViewChange = useCallback(
    (view: ViewType) => {
      setActiveView(view);
      updateUrl(view, currentDate);
    },
    [currentDate, updateUrl]
  );

  const handleNavigate = useCallback(
    (direction: "prev" | "next") => {
      const newDate = navigateDate(currentDate, activeView, direction);
      setCurrentDate(newDate);
      updateUrl(activeView, newDate);
    },
    [currentDate, activeView, updateUrl]
  );

  const handleToday = useCallback(() => {
    const now = new Date();
    setCurrentDate(now);
    updateUrl(activeView, now);
  }, [activeView, updateUrl]);

  const handleDayClick = useCallback(
    (date: Date) => {
      setCurrentDate(date);
      setActiveView("day");
      updateUrl("day", date);
    },
    [updateUrl]
  );

  // Data fetching
  const { start, end } = useMemo(() => getViewDateRange(activeView, currentDate), [activeView, currentDate]);
  const { data, isLoading, error } = useCalendarEventsInRange(start.toISOString(), end.toISOString());
  const allEvents = data?.events || [];

  // Sync hooks
  const graphSyncMutation = useCalendarSync();
  const { data: syncData } = useSyncState();
  const { data: outlookStatus } = useOutlookCalendarStatus();
  const outlookSyncMutation = useOutlookCalendarSync();
  const { data: googleStatus } = useGoogleCalendarStatus();
  const googleSyncMutation = useGoogleCalendarSync();

  const isSyncing = graphSyncMutation.isPending || outlookSyncMutation.isPending || googleSyncMutation.isPending;

  // Build unified account list
  const calendarAccounts: CalendarAccount[] = useMemo(() => {
    const accounts: CalendarAccount[] = [];
    if (googleStatus?.accounts) {
      for (const a of googleStatus.accounts) {
        accounts.push({ id: a.id, email: a.googleEmail, provider: "google", lastSyncAt: a.lastSyncAt });
      }
    }
    if (outlookStatus?.accounts) {
      for (const a of outlookStatus.accounts) {
        accounts.push({ id: a.id, email: a.outlookEmail, provider: "outlook", lastSyncAt: a.lastSyncAt });
      }
    }
    if (syncData?.syncStates) {
      for (const s of syncData.syncStates) {
        accounts.push({ id: s.credentialId, email: s.mailbox, provider: "graph", lastSyncAt: s.lastSyncAt });
      }
    }
    return accounts;
  }, [googleStatus, outlookStatus, syncData]);

  // Initialize visible accounts to all
  const effectiveVisibleAccounts = useMemo(() => {
    if (visibleAccounts !== null) return visibleAccounts;
    return new Set(calendarAccounts.map((a) => a.id));
  }, [visibleAccounts, calendarAccounts]);

  const handleToggleAccount = useCallback(
    (accountId: string) => {
      setVisibleAccounts((prev) => {
        const current = prev ?? new Set(calendarAccounts.map((a) => a.id));
        const next = new Set(current);
        if (next.has(accountId)) {
          next.delete(accountId);
        } else {
          next.add(accountId);
        }
        return next;
      });
    },
    [calendarAccounts]
  );

  const handleSync = useCallback(() => {
    if (googleStatus?.connected) {
      googleSyncMutation.mutate({ daysBack: 7, daysForward: 30 });
    }
    if (outlookStatus?.connected) {
      outlookSyncMutation.mutate({ daysBack: 7, daysForward: 30 });
    }
    if (syncData?.credentials?.length && syncData.syncStates?.length) {
      const cred = syncData.credentials[0];
      const mailbox = syncData.syncStates[0]?.mailbox;
      if (mailbox) {
        graphSyncMutation.mutate({ credentialId: cred.id, mailbox, daysBack: 7, daysForward: 30 });
      }
    }
  }, [googleStatus, outlookStatus, syncData, googleSyncMutation, outlookSyncMutation, graphSyncMutation]);

  const handleEventClick = useCallback((event: CalendarEvent, rect: DOMRect) => {
    setSelectedEvent({ event, rect });
    setShowCreateCard(false);
  }, []);

  const hasAnySource =
    (syncData?.credentials?.length ?? 0) > 0 ||
    outlookStatus?.connected === true ||
    googleStatus?.connected === true;

  return (
    <div className="flex h-full flex-col p-4">
      <CalendarHeader
        currentDate={currentDate}
        activeView={activeView}
        accounts={calendarAccounts}
        visibleAccounts={effectiveVisibleAccounts}
        isSyncing={isSyncing}
        onNavigate={handleNavigate}
        onToday={handleToday}
        onViewChange={handleViewChange}
        onToggleAccount={handleToggleAccount}
        onSync={handleSync}
      />

      {/* Empty state */}
      {!hasAnySource && !isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-sm">
            <h2 className="text-base font-medium text-[var(--foreground)] mb-2">Connect your Calendar</h2>
            <p className="text-sm text-[var(--muted-foreground)] mb-4">
              Connect Google Calendar, Outlook, or Azure AD credentials to sync your events.
            </p>
            <a
              href="/settings/integrations"
              className="inline-block rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Go to Integrations
            </a>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--muted-foreground)] border-t-transparent" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mx-auto max-w-md rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          Failed to load calendar events.
        </div>
      )}

      {/* Calendar views */}
      {!isLoading && !error && hasAnySource && (
        <>
          {activeView === "month" && (
            <MonthView
              currentDate={currentDate}
              events={allEvents}
              accounts={calendarAccounts}
              visibleAccounts={effectiveVisibleAccounts}
              onEventClick={handleEventClick}
              onDayClick={handleDayClick}
            />
          )}
          {activeView === "week" && (
            <WeekView
              currentDate={currentDate}
              events={allEvents}
              accounts={calendarAccounts}
              visibleAccounts={effectiveVisibleAccounts}
              onEventClick={handleEventClick}
            />
          )}
          {activeView === "day" && (
            <DayView
              currentDate={currentDate}
              events={allEvents}
              accounts={calendarAccounts}
              visibleAccounts={effectiveVisibleAccounts}
              onEventClick={handleEventClick}
            />
          )}
          {activeView === "agenda" && (
            <AgendaView
              events={allEvents}
              accounts={calendarAccounts}
              visibleAccounts={effectiveVisibleAccounts}
              onEventClick={handleEventClick}
            />
          )}
        </>
      )}

      {/* Event detail popover */}
      {selectedEvent && !showCreateCard && (
        <EventDetailPopover
          event={selectedEvent.event}
          anchorRect={selectedEvent.rect}
          accounts={calendarAccounts}
          onClose={() => setSelectedEvent(null)}
          onCreateCard={() => setShowCreateCard(true)}
        />
      )}

      {/* Create card modal */}
      {selectedEvent && showCreateCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => { setShowCreateCard(false); setSelectedEvent(null); }} />
          <div className="relative rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xl w-[360px]">
            <div className="p-4 border-b border-[var(--border)]">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">
                Create card from: {selectedEvent.event.subject || "(No subject)"}
              </h3>
            </div>
            <CreateCardFromEvent
              event={selectedEvent.event}
              onClose={() => { setShowCreateCard(false); setSelectedEvent(null); }}
              onCreated={() => { setShowCreateCard(false); setSelectedEvent(null); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Verify the page loads at http://localhost:3000/calendar**

Open the browser and confirm:
- Header renders with nav arrows, Today button, view toggle, sync button
- Default view is Week
- Switching views works
- Events display if any are synced

**Step 3: Commit**

```bash
git add app/(app)/calendar/page.tsx
git commit -m "feat(calendar): rewrite calendar page with Month/Week/Day/Agenda views"
```

---

### Task 13: Visual Polish & Dark Mode Testing

**Files:**
- Modify: `components/calendar/EventPill.tsx` (dark mode fix)
- Modify: `components/calendar/EventBlock.tsx` (dark mode fix)
- Modify: `components/calendar/AgendaView.tsx` (dark mode fix)

**Step 1: Replace inline dark mode detection with a hook**

The `document.documentElement.classList.contains("dark")` pattern doesn't work with SSR and doesn't react to theme changes. Create a small hook or use CSS approach instead.

Update all three components to use CSS variables instead of JS dark mode detection. In `calendarUtils.ts`, add CSS custom properties approach:

In `EventPill.tsx`, `EventBlock.tsx`, and `AgendaView.tsx`, remove the `isDark` logic and instead always use the light `bg` and `text` values, but wrap them in CSS that responds to `.dark`:

```typescript
// Replace isDark pattern with:
style={{
  backgroundColor: color.bg,
  borderLeft: `2px solid ${color.border}`,
  color: color.text,
  // Use CSS custom properties set from globals.css dark mode
}}
```

Add to `globals.css` at the end:

```css
/* Calendar account colors — dark mode adjustments */
.dark .cal-event {
  --cal-opacity: 0.18;
}
```

Alternative approach: use Tailwind `dark:` variant classes for backgrounds and let the inline border color stay.

**Step 2: Test in both light and dark mode**

Toggle theme and verify all components look correct.

**Step 3: Commit**

```bash
git add components/calendar/EventPill.tsx components/calendar/EventBlock.tsx components/calendar/AgendaView.tsx
git commit -m "fix(calendar): improve dark mode handling for event components"
```

---

### Task 14: Browser Testing & Bug Fixes

**Step 1: Test all 4 views in the browser at http://localhost:3000/calendar**

Check:
- Month view: grid renders, pills show, "+N more" works, clicking day goes to Day view
- Week view: time grid scrolls, current time indicator shows, events position correctly
- Day view: same as week but single column
- Agenda view: grouped list, colored accent bars
- Event popover: opens on click, shows details, closes on outside click/Escape
- Create Card flow: board selector loads, card creates successfully
- Account filter toggles: showing/hiding events per account
- Sync button: triggers sync for all connected accounts
- URL updates: view and date persist in URL params
- Navigation: prev/next/today all work correctly
- Responsive: page works reasonably at smaller widths

**Step 2: Fix any bugs found during testing**

**Step 3: Commit fixes**

```bash
git add -A
git commit -m "fix(calendar): address browser testing feedback"
```

---

## Summary of Tasks

| # | Task | Files | Key Deliverable |
|---|------|-------|-----------------|
| 1 | Calendar Utilities | `calendarUtils.ts` | Date math, color palette, grid helpers |
| 2 | EventPill | `EventPill.tsx` | Compact pill for month grid |
| 3 | EventBlock | `EventBlock.tsx` | Positioned block for time grids |
| 4 | TimeGrid | `TimeGrid.tsx` | Scrollable 24h grid with overlap layout |
| 5 | CalendarHeader | `CalendarHeader.tsx` | Nav, view toggle, account filters, sync |
| 6 | MonthView | `MonthView.tsx` | 6-row month grid with pills |
| 7 | WeekView | `WeekView.tsx` | 7-column time grid with all-day row |
| 8 | DayView | `DayView.tsx` | Single-column time grid |
| 9 | AgendaView | `AgendaView.tsx` | Grouped list with account colors |
| 10 | EventDetailPopover | `EventDetailPopover.tsx` | Event details + actions |
| 11 | CreateCardFromEvent | `CreateCardFromEvent.tsx` | Board/column selector for card creation |
| 12 | CalendarPage Rewrite | `page.tsx` | Wire all components, state, routing |
| 13 | Dark Mode Polish | Multiple | Fix dark mode detection approach |
| 14 | Browser Testing | Multiple | End-to-end verification |
