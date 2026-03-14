import type { CalendarEvent } from "@/types";

// ── Color Palette ────────────────────────────────────

export interface AccountColor {
  name: string;
  bg: string;
  bgDark: string;
  border: string;
  text: string;
  textDark: string;
}

export const ACCOUNT_COLORS: AccountColor[] = [
  {
    name: "slate-blue",
    bg: "rgba(100, 116, 160, 0.12)",
    bgDark: "rgba(100, 116, 160, 0.22)",
    border: "#6474a0",
    text: "#4a5580",
    textDark: "#a8b4d4",
  },
  {
    name: "terracotta",
    bg: "rgba(180, 110, 90, 0.12)",
    bgDark: "rgba(180, 110, 90, 0.22)",
    border: "#b46e5a",
    text: "#8c5443",
    textDark: "#d4a090",
  },
  {
    name: "sage",
    bg: "rgba(108, 148, 116, 0.12)",
    bgDark: "rgba(108, 148, 116, 0.22)",
    border: "#6c9474",
    text: "#4e7054",
    textDark: "#a0c8a6",
  },
  {
    name: "plum",
    bg: "rgba(140, 100, 150, 0.12)",
    bgDark: "rgba(140, 100, 150, 0.22)",
    border: "#8c6496",
    text: "#6e4c78",
    textDark: "#c0a0ca",
  },
  {
    name: "amber",
    bg: "rgba(180, 150, 80, 0.12)",
    bgDark: "rgba(180, 150, 80, 0.22)",
    border: "#b49650",
    text: "#8a7230",
    textDark: "#d4c490",
  },
  {
    name: "teal",
    bg: "rgba(80, 148, 148, 0.12)",
    bgDark: "rgba(80, 148, 148, 0.22)",
    border: "#509494",
    text: "#3a7474",
    textDark: "#90c8c8",
  },
  {
    name: "rose",
    bg: "rgba(170, 100, 120, 0.12)",
    bgDark: "rgba(170, 100, 120, 0.22)",
    border: "#aa6478",
    text: "#864a5c",
    textDark: "#d4a0b0",
  },
  {
    name: "indigo",
    bg: "rgba(90, 100, 170, 0.12)",
    bgDark: "rgba(90, 100, 170, 0.22)",
    border: "#5a64aa",
    text: "#444c86",
    textDark: "#a0a8d4",
  },
];

// ── Calendar Account ─────────────────────────────────

export interface CalendarAccount {
  id: string;
  email: string;
  provider: "google" | "outlook" | "graph";
  lastSyncAt: string;
}

// ── Account Color Assignment ─────────────────────────

export function getAccountColor(
  accountId: string,
  allAccounts: CalendarAccount[],
): AccountColor {
  const sorted = [...allAccounts].sort((a, b) => {
    if (a.provider !== b.provider) return a.provider.localeCompare(b.provider);
    return a.email.localeCompare(b.email);
  });
  const index = sorted.findIndex((acc) => acc.id === accountId);
  const colorIndex = index >= 0 ? index % ACCOUNT_COLORS.length : 0;
  return ACCOUNT_COLORS[colorIndex];
}

export function getEventAccountId(
  event: CalendarEvent,
  accounts: CalendarAccount[],
): string | null {
  // Google Calendar events have graphEventId starting with "gcal_"
  if (event.graphEventId.startsWith("gcal_")) {
    const googleAccount = accounts.find((a) => a.provider === "google");
    return googleAccount?.id ?? null;
  }

  // If event has a credentialId, match it to a graph account
  if (event.credentialId) {
    const graphAccount = accounts.find(
      (a) => a.provider === "graph" && a.id === event.credentialId,
    );
    return graphAccount?.id ?? null;
  }

  // Default to first outlook account
  const outlookAccount = accounts.find((a) => a.provider === "outlook");
  return outlookAccount?.id ?? null;
}

// ── Date Math Helpers ────────────────────────────────

/** Returns the Monday at the start of the week containing the given date. */
export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  // Shift Sunday (0) to 7 so Monday is always the start
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Returns the Sunday at the end of the week containing the given date. */
export function endOfWeek(date: Date): Date {
  const d = startOfWeek(date);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

// ── Grid Date Generators ─────────────────────────────

/**
 * Returns 42 Date objects (6 weeks) for a month grid,
 * starting from the Monday of the week containing the 1st.
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

/** Returns 7 dates starting from Monday of the week containing the given date. */
export function getWeekDates(date: Date): Date[] {
  const monday = startOfWeek(date);
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    dates.push(addDays(monday, i));
  }
  return dates;
}

// ── View Types & Navigation ──────────────────────────

export type ViewType = "month" | "week" | "day" | "agenda";

export interface DateRange {
  start: Date;
  end: Date;
}

/** Compute the start and end Date for data fetching based on the view type. */
export function getViewDateRange(view: ViewType, date: Date): DateRange {
  switch (view) {
    case "month": {
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      // Extend to full grid weeks
      return {
        start: startOfWeek(monthStart),
        end: endOfWeek(monthEnd),
      };
    }
    case "week":
      return {
        start: startOfWeek(date),
        end: endOfWeek(date),
      };
    case "day":
      return {
        start: startOfDay(date),
        end: endOfDay(date),
      };
    case "agenda":
      // Agenda shows 14 days from today
      return {
        start: startOfDay(date),
        end: endOfDay(addDays(date, 13)),
      };
  }
}

/** Shift the current date by one unit in the given direction based on view type. */
export function navigateDate(
  date: Date,
  view: ViewType,
  direction: -1 | 1,
): Date {
  switch (view) {
    case "month":
      return addMonths(date, direction);
    case "week":
      return addDays(date, direction * 7);
    case "day":
    case "agenda":
      return addDays(date, direction);
  }
}

/** Format the header title text for the current view and date. */
export function getViewTitle(view: ViewType, date: Date): string {
  switch (view) {
    case "month":
      return date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    case "week": {
      const weekStart = startOfWeek(date);
      const weekEnd = endOfWeek(date);
      const startStr = weekStart.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const endStr = weekEnd.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      return `${startStr} \u2013 ${endStr}`;
    }
    case "day":
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    case "agenda":
      return "Agenda";
  }
}

// ── Time Formatting ──────────────────────────────────

/** Format a Date as a compact time string, e.g. "9:30 AM" or "2 PM". */
export function formatTime(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const h = hours % 12 || 12;
  if (minutes === 0) return `${h} ${ampm}`;
  return `${h}:${minutes.toString().padStart(2, "0")} ${ampm}`;
}

/** Format a time range string from a CalendarEvent. */
export function formatTimeRange(event: CalendarEvent): string {
  if (event.isAllDay) return "All day";
  const start = new Date(event.startDateTime);
  const end = new Date(event.endDateTime);
  return `${formatTime(start)} \u2013 ${formatTime(end)}`;
}

// ── Event Positioning (for time grids) ───────────────

export interface EventPosition {
  top: number;
  height: number;
}

/**
 * Compute top offset and height in pixels for positioning an event
 * in a time grid. Uses 1px per minute.
 *
 * @param event The calendar event
 * @param dayStart The start-of-day Date for the column
 */
export function getEventPosition(
  event: CalendarEvent,
  dayStart: Date,
): EventPosition {
  const start = new Date(event.startDateTime);
  const end = new Date(event.endDateTime);
  const dayStartMs = dayStart.getTime();
  const dayEndMs = endOfDay(dayStart).getTime();

  // Clamp to the visible day
  const clampedStart = Math.max(start.getTime(), dayStartMs);
  const clampedEnd = Math.min(end.getTime(), dayEndMs);

  const topMinutes = (clampedStart - dayStartMs) / 60000;
  const durationMinutes = Math.max((clampedEnd - clampedStart) / 60000, 15); // minimum 15min height

  return {
    top: topMinutes,
    height: durationMinutes,
  };
}

// ── Event Filtering & Grouping ───────────────────────

/** Filter events that overlap a given day. */
export function getEventsForDay(
  events: CalendarEvent[],
  day: Date,
): CalendarEvent[] {
  const dayStartMs = startOfDay(day).getTime();
  const dayEndMs = endOfDay(day).getTime();

  return events.filter((event) => {
    const eventStart = new Date(event.startDateTime).getTime();
    const eventEnd = new Date(event.endDateTime).getTime();
    // Event overlaps the day if it starts before the day ends AND ends after the day starts
    return eventStart < dayEndMs && eventEnd > dayStartMs;
  });
}

/** Split events into allDay and timed arrays. */
export function partitionEvents(events: CalendarEvent[]): {
  allDay: CalendarEvent[];
  timed: CalendarEvent[];
} {
  const allDay: CalendarEvent[] = [];
  const timed: CalendarEvent[] = [];

  for (const event of events) {
    if (event.isAllDay) {
      allDay.push(event);
    } else {
      timed.push(event);
    }
  }

  return { allDay, timed };
}

/** Group events by date string and sort within each group by start time. */
export function groupEventsByDate(
  events: CalendarEvent[],
): Map<string, CalendarEvent[]> {
  const groups = new Map<string, CalendarEvent[]>();

  for (const event of events) {
    const dateKey = new Date(event.startDateTime).toISOString().slice(0, 10);
    const existing = groups.get(dateKey);
    if (existing) {
      existing.push(event);
    } else {
      groups.set(dateKey, [event]);
    }
  }

  // Sort events within each group by start time
  for (const [, groupEvents] of groups) {
    groupEvents.sort(
      (a, b) =>
        new Date(a.startDateTime).getTime() -
        new Date(b.startDateTime).getTime(),
    );
  }

  return groups;
}

/** Format a date string for the agenda view: "Today", "Tomorrow", or a full date. */
export function formatAgendaDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const now = new Date();
  const today = startOfDay(now);
  const tomorrow = addDays(today, 1);

  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, tomorrow)) return "Tomorrow";

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
