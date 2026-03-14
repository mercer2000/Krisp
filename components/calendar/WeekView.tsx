"use client";

import { useMemo } from "react";
import type { CalendarEvent } from "@/types";
import { EventPill } from "@/components/calendar/EventPill";
import { TimeGrid } from "@/components/calendar/TimeGrid";
import {
  getWeekDates,
  getEventsForDay,
  partitionEvents,
  isToday,
  getEventAccountId,
  type CalendarAccount,
} from "@/components/calendar/calendarUtils";

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  accounts: CalendarAccount[];
  visibleAccounts: Set<string>;
  onEventClick: (event: CalendarEvent, rect: DOMRect) => void;
}

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function WeekView({
  currentDate,
  events,
  accounts,
  visibleAccounts,
  onEventClick,
}: WeekViewProps) {
  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);

  const filteredEvents = useMemo(
    () =>
      events.filter((event) => {
        const accountId = getEventAccountId(event, accounts);
        return accountId ? visibleAccounts.has(accountId) : true;
      }),
    [events, accounts, visibleAccounts],
  );

  // Partition events per day into all-day and timed
  const dayData = useMemo(() => {
    return weekDates.map((date) => {
      const dayEvents = getEventsForDay(filteredEvents, date);
      const { allDay, timed } = partitionEvents(dayEvents);
      return { date, allDay, timed };
    });
  }, [weekDates, filteredEvents]);

  const hasAllDayEvents = dayData.some((d) => d.allDay.length > 0);

  // Build TimeGrid columns
  const columns = useMemo(
    () =>
      dayData.map((d) => ({
        date: d.date,
        events: d.timed,
      })),
    [dayData],
  );

  return (
    <div className="flex flex-1 flex-col">
      {/* Day headers */}
      <div className="border-border grid border-b" style={{ gridTemplateColumns: "3.5rem repeat(7, 1fr)" }}>
        {/* Spacer */}
        <div />

        {weekDates.map((date, idx) => {
          const today = isToday(date);
          return (
            <div
              key={idx}
              className={`flex flex-col items-center py-2 ${
                today ? "bg-[var(--primary)]/[0.04]" : ""
              }`}
            >
              <span
                className={`text-[10px] tracking-widest uppercase ${
                  today ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {WEEKDAY_LABELS[idx]}
              </span>
              <span
                className={`text-lg font-semibold ${
                  today ? "text-primary" : ""
                }`}
              >
                {date.getDate()}
              </span>
            </div>
          );
        })}
      </div>

      {/* All-day row */}
      {hasAllDayEvents && (
        <div
          className="border-border grid border-b"
          style={{ gridTemplateColumns: "3.5rem repeat(7, 1fr)" }}
        >
          {/* Label */}
          <div className="text-muted-foreground flex items-start justify-end pr-2 pt-1 text-[10px] tracking-widest uppercase">
            all-day
          </div>

          {dayData.map((d, idx) => (
            <div key={idx} className="flex flex-col gap-0.5 p-1">
              {d.allDay.map((event) => (
                <EventPill
                  key={event.id}
                  event={event}
                  accounts={accounts}
                  onClick={onEventClick}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Time grid */}
      <TimeGrid columns={columns} accounts={accounts} onEventClick={onEventClick} />
    </div>
  );
}
