"use client";

import { useMemo } from "react";
import type { CalendarEvent } from "@/types";
import { EventPill } from "@/components/calendar/EventPill";
import { TimeGrid } from "@/components/calendar/TimeGrid";
import {
  getEventsForDay,
  partitionEvents,
  getEventAccountId,
  type CalendarAccount,
} from "@/components/calendar/calendarUtils";

interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  accounts: CalendarAccount[];
  visibleAccounts: Set<string>;
  onEventClick: (event: CalendarEvent, rect: DOMRect) => void;
}

export function DayView({
  currentDate,
  events,
  accounts,
  visibleAccounts,
  onEventClick,
}: DayViewProps) {
  const filteredEvents = useMemo(
    () =>
      events.filter((event) => {
        const accountId = getEventAccountId(event, accounts);
        return accountId ? visibleAccounts.has(accountId) : true;
      }),
    [events, accounts, visibleAccounts],
  );

  const dayEvents = useMemo(
    () => getEventsForDay(filteredEvents, currentDate),
    [filteredEvents, currentDate],
  );

  const { allDay, timed } = useMemo(
    () => partitionEvents(dayEvents),
    [dayEvents],
  );

  const columns = useMemo(
    () => [{ date: currentDate, events: timed }],
    [currentDate, timed],
  );

  return (
    <div className="flex flex-1 flex-col">
      {/* All-day events section */}
      {allDay.length > 0 && (
        <div className="border-border border-b p-2">
          <div className="text-muted-foreground mb-1 text-[10px] tracking-widest uppercase">
            All day
          </div>
          <div className="flex flex-wrap gap-1">
            {allDay.map((event) => (
              <EventPill
                key={event.id}
                event={event}
                accounts={accounts}
                onClick={onEventClick}
              />
            ))}
          </div>
        </div>
      )}

      {/* Time grid */}
      <TimeGrid columns={columns} accounts={accounts} onEventClick={onEventClick} />
    </div>
  );
}
