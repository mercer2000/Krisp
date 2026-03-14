"use client";

import { useMemo, useCallback } from "react";
import type { CalendarEvent } from "@/types";
import {
  groupEventsByDate,
  formatAgendaDate,
  formatTimeRange,
  getAccountColor,
  getEventAccountId,
  type CalendarAccount,
} from "@/components/calendar/calendarUtils";

interface AgendaViewProps {
  events: CalendarEvent[];
  accounts: CalendarAccount[];
  visibleAccounts: Set<string>;
  onEventClick: (event: CalendarEvent, rect: DOMRect) => void;
}

const SHOW_AS_STYLES: Record<string, { bg: string; text: string }> = {
  busy: { bg: "rgba(239, 68, 68, 0.12)", text: "rgb(239, 68, 68)" },
  tentative: { bg: "rgba(234, 179, 8, 0.12)", text: "rgb(202, 138, 4)" },
  free: { bg: "rgba(34, 197, 94, 0.12)", text: "rgb(22, 163, 74)" },
};

export function AgendaView({
  events,
  accounts,
  visibleAccounts,
  onEventClick,
}: AgendaViewProps) {
  const filteredEvents = useMemo(
    () =>
      events.filter((event) => {
        const accountId = getEventAccountId(event, accounts);
        return accountId ? visibleAccounts.has(accountId) : true;
      }),
    [events, accounts, visibleAccounts],
  );

  const groupedEvents = useMemo(
    () => groupEventsByDate(filteredEvents),
    [filteredEvents],
  );

  const handleEventClick = useCallback(
    (event: CalendarEvent, e: React.MouseEvent<HTMLButtonElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      onEventClick(event, rect);
    },
    [onEventClick],
  );

  if (groupedEvents.size === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground text-sm">No upcoming events</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-2xl space-y-6 p-4">
        {Array.from(groupedEvents.entries()).map(([dateStr, dateEvents]) => (
          <div key={dateStr}>
            {/* Date header */}
            <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-widest uppercase">
              {formatAgendaDate(dateStr)}
            </h3>

            {/* Event cards */}
            <div className="space-y-2">
              {dateEvents.map((event) => {
                const accountId = getEventAccountId(event, accounts);
                const color = accountId
                  ? getAccountColor(accountId, accounts)
                  : null;

                const showAsStyle = event.showAs
                  ? SHOW_AS_STYLES[event.showAs.toLowerCase()]
                  : null;

                return (
                  <button
                    key={event.id}
                    type="button"
                    onClick={(e) => handleEventClick(event, e)}
                    className="bg-card hover:bg-muted/50 flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors"
                  >
                    {/* Colored accent bar */}
                    <div
                      className="mt-0.5 h-8 w-1 shrink-0 rounded-full"
                      style={{
                        backgroundColor: color?.border ?? "#6474a0",
                      }}
                    />

                    {/* Center content */}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">
                        {event.subject || "(No subject)"}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {formatTimeRange(event)}
                      </div>
                      {event.location && (
                        <div className="text-muted-foreground mt-0.5 text-xs">
                          {event.location}
                        </div>
                      )}
                    </div>

                    {/* ShowAs badge */}
                    {event.showAs && showAsStyle && (
                      <span
                        className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize"
                        style={{
                          backgroundColor: showAsStyle.bg,
                          color: showAsStyle.text,
                        }}
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
