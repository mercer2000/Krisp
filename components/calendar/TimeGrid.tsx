"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import type { CalendarEvent } from "@/types";
import { EventBlock } from "@/components/calendar/EventBlock";
import {
  getEventPosition,
  isToday,
  startOfDay,
  getEventAccountId,
  type CalendarAccount,
} from "@/components/calendar/calendarUtils";

const HOUR_HEIGHT = 60;

interface TimeGridColumn {
  date: Date;
  events: CalendarEvent[];
}

interface TimeGridProps {
  columns: TimeGridColumn[];
  accounts: CalendarAccount[];
  onEventClick: (event: CalendarEvent, rect: DOMRect) => void;
}

interface LayoutedEvent {
  event: CalendarEvent;
  top: number;
  height: number;
  columnIndex: number;
  totalColumns: number;
}

/** Assign overlapping events to layout columns so they render side-by-side. */
function layoutEvents(
  events: CalendarEvent[],
  dayStart: Date,
): LayoutedEvent[] {
  if (events.length === 0) return [];

  // Compute positions and sort by start time (top), then longer events first
  const positioned = events.map((event) => {
    const pos = getEventPosition(event, dayStart);
    return { event, top: pos.top, height: pos.height };
  });

  positioned.sort((a, b) => {
    if (a.top !== b.top) return a.top - b.top;
    return b.height - a.height; // longer events first at same start
  });

  // columnEnds[i] = the bottom (top + height) of the last event in column i
  const columnEnds: number[] = [];
  const assignments: { colIndex: number; event: CalendarEvent; top: number; height: number }[] = [];

  for (const item of positioned) {
    const eventEnd = item.top + item.height;
    let placed = false;

    for (let col = 0; col < columnEnds.length; col++) {
      if (columnEnds[col] <= item.top) {
        columnEnds[col] = eventEnd;
        assignments.push({ colIndex: col, event: item.event, top: item.top, height: item.height });
        placed = true;
        break;
      }
    }

    if (!placed) {
      const col = columnEnds.length;
      columnEnds.push(eventEnd);
      assignments.push({ colIndex: col, event: item.event, top: item.top, height: item.height });
    }
  }

  const totalColumns = columnEnds.length;

  return assignments.map((a) => ({
    event: a.event,
    top: a.top,
    height: a.height,
    columnIndex: a.colIndex,
    totalColumns,
  }));
}

/** Format hour labels: "1 AM", "2 AM", ..., "12 PM", "1 PM", etc. */
function formatHourLabel(hour: number): string {
  if (hour === 0) return "";
  const ampm = hour >= 12 ? "PM" : "AM";
  const h = hour % 12 || 12;
  return `${h} ${ampm}`;
}

export function TimeGrid({ columns, accounts, onEventClick }: TimeGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to bring current time into view on mount
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const now = new Date();
    const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
    const currentTimeOffset = minutesSinceMidnight * (HOUR_HEIGHT / 60);
    container.scrollTop = Math.max(0, currentTimeOffset - 200);
  }, []);

  // Compute current time position for the red indicator, ticking every 60s
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);
  const currentTimeTop = useMemo(() => {
    const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
    return minutesSinceMidnight * (HOUR_HEIGHT / 60);
  }, [now]);

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto">
      <div className="flex" style={{ minHeight: 24 * HOUR_HEIGHT }}>
        {/* Time labels column */}
        <div
          className="border-border relative shrink-0 border-r"
          style={{ width: 56 }}
        >
          {hours.map((hour) => (
            <div
              key={hour}
              className="relative"
              style={{ height: HOUR_HEIGHT }}
            >
              <span
                className="text-muted-foreground absolute right-2 text-[10px] leading-none"
                style={{ top: -6 }}
              >
                {formatHourLabel(hour)}
              </span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        {columns.map((column, colIdx) => {
          const dayStart = startOfDay(column.date);
          const timedEvents = column.events.filter((e) => !e.isAllDay);
          const layouted = layoutEvents(timedEvents, dayStart);
          const showCurrentTime = isToday(column.date);

          return (
            <div
              key={colIdx}
              className={`relative flex-1 ${colIdx < columns.length - 1 ? "border-border border-r" : ""}`}
            >
              {/* Hour line dividers */}
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="border-border/50 border-b"
                  style={{ height: HOUR_HEIGHT }}
                />
              ))}

              {/* Current time indicator */}
              {showCurrentTime && (
                <div
                  className="pointer-events-none absolute right-0 left-0 z-20"
                  style={{ top: currentTimeTop }}
                >
                  {/* Red dot on the left edge */}
                  <div
                    className="absolute rounded-full bg-red-500"
                    style={{
                      width: 8,
                      height: 8,
                      top: -3.5,
                      left: -4,
                    }}
                  />
                  {/* Red line */}
                  <div className="h-[1.5px] w-full bg-red-500" />
                </div>
              )}

              {/* Event blocks */}
              {layouted.map((item) => {
                const widthPercent = `${100 / item.totalColumns}%`;
                const leftPercent = `${(100 / item.totalColumns) * item.columnIndex}%`;

                return (
                  <EventBlock
                    key={item.event.id}
                    event={item.event}
                    accounts={accounts}
                    top={item.top}
                    height={item.height}
                    width={widthPercent}
                    left={leftPercent}
                    onClick={onEventClick}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
