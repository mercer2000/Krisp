"use client";

import { useUpcomingEvents } from "@/lib/hooks/useCalendar";
import type { CalendarEvent } from "@/types";

function formatEventTime(event: CalendarEvent) {
  const start = new Date(event.startDateTime);
  const end = new Date(event.endDateTime);
  const now = new Date();

  const isToday = start.toDateString() === now.toDateString();
  const isTomorrow =
    start.toDateString() ===
    new Date(now.getTime() + 86400000).toDateString();

  const timeStr = start.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  const endTimeStr = end.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  if (event.isAllDay) {
    if (isToday) return "Today (all day)";
    if (isTomorrow) return "Tomorrow (all day)";
    return start.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }) + " (all day)";
  }

  if (isToday) return `Today ${timeStr} – ${endTimeStr}`;
  if (isTomorrow) return `Tomorrow ${timeStr} – ${endTimeStr}`;

  return (
    start.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }) +
    ` ${timeStr}`
  );
}

function getRelativeColor(event: CalendarEvent) {
  const start = new Date(event.startDateTime);
  const now = new Date();
  const diffMs = start.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 1) return "var(--destructive, #ef4444)";
  if (diffHours < 4) return "var(--warning, #f59e0b)";
  return "var(--primary)";
}

export function UpcomingEvents() {
  const { data, isLoading, error } = useUpcomingEvents(5);

  if (isLoading) {
    return (
      <div className="px-3 py-2">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
          Upcoming
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-md bg-[var(--accent)] p-2">
              <div className="h-3 w-3/4 rounded bg-[var(--muted-foreground)]/20" />
              <div className="mt-1 h-2 w-1/2 rounded bg-[var(--muted-foreground)]/10" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data?.events?.length) {
    return null;
  }

  return (
    <div className="px-3 py-2">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
        Upcoming
      </div>
      <div className="space-y-1">
        {data.events.map((event) => (
          <a
            key={event.id}
            href={event.webLink || "/calendar"}
            target={event.webLink ? "_blank" : undefined}
            rel={event.webLink ? "noopener noreferrer" : undefined}
            className="block rounded-md px-2 py-1.5 transition-colors hover:bg-[var(--accent)]"
          >
            <div className="flex items-start gap-2">
              <div
                className="mt-1 h-2 w-2 flex-shrink-0 rounded-full"
                style={{ backgroundColor: getRelativeColor(event) }}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium text-[var(--foreground)]">
                  {event.subject || "(No subject)"}
                </div>
                <div className="text-[10px] text-[var(--muted-foreground)]">
                  {formatEventTime(event)}
                </div>
                {event.location && (
                  <div className="truncate text-[10px] text-[var(--muted-foreground)]">
                    {event.location}
                  </div>
                )}
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
