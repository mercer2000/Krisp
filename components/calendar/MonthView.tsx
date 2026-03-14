"use client";

import { useMemo } from "react";
import type { CalendarEvent } from "@/types";
import { EventPill } from "@/components/calendar/EventPill";
import {
  getMonthGridDates,
  getEventsForDay,
  isToday,
  getEventAccountId,
  type CalendarAccount,
} from "@/components/calendar/calendarUtils";

const MAX_VISIBLE_EVENTS = 3;

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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
    [currentDate],
  );

  const filteredEvents = useMemo(
    () =>
      events.filter((event) => {
        const accountId = getEventAccountId(event, accounts);
        return accountId ? visibleAccounts.has(accountId) : true;
      }),
    [events, accounts, visibleAccounts],
  );

  const currentMonth = currentDate.getMonth();

  return (
    <div className="flex flex-1 flex-col">
      {/* Day name header row */}
      <div className="border-border grid grid-cols-7 border-b">
        {DAY_NAMES.map((name) => (
          <div
            key={name}
            className="text-muted-foreground px-2 py-1.5 text-center text-[11px] tracking-widest uppercase"
          >
            {name}
          </div>
        ))}
      </div>

      {/* 6x7 grid */}
      <div className="grid flex-1 grid-cols-7 grid-rows-6">
        {gridDates.map((date, idx) => {
          const dayEvents = getEventsForDay(filteredEvents, date);
          const isCurrentMonth = date.getMonth() === currentMonth;
          const today = isToday(date);
          const visibleEvents = dayEvents.slice(0, MAX_VISIBLE_EVENTS);
          const overflowCount = dayEvents.length - MAX_VISIBLE_EVENTS;

          return (
            <div
              key={idx}
              className={`border-border flex min-h-[100px] flex-col border-r border-b p-1 ${
                !isCurrentMonth ? "opacity-40" : ""
              } ${today ? "bg-[var(--primary)]/[0.04]" : ""}`}
            >
              {/* Day number */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => onDayClick(date)}
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                    today
                      ? "bg-primary font-bold text-white"
                      : "hover:bg-muted"
                  }`}
                >
                  {date.getDate()}
                </button>
              </div>

              {/* Event pills */}
              <div className="mt-0.5 flex flex-1 flex-col gap-0.5">
                {visibleEvents.map((event) => (
                  <EventPill
                    key={event.id}
                    event={event}
                    accounts={accounts}
                    onClick={onEventClick}
                  />
                ))}

                {overflowCount > 0 && (
                  <button
                    type="button"
                    onClick={() => onDayClick(date)}
                    className="text-muted-foreground hover:text-foreground px-1 text-left text-[11px] font-medium"
                  >
                    +{overflowCount} more
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
