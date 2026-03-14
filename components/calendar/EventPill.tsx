"use client";

import { useCallback } from "react";
import type { CalendarEvent } from "@/types";
import {
  formatTime,
  getAccountColor,
  getEventAccountId,
  useDarkMode,
  type CalendarAccount,
  type AccountColor,
} from "@/components/calendar/calendarUtils";

interface EventPillProps {
  event: CalendarEvent;
  accounts: CalendarAccount[];
  onClick?: (event: CalendarEvent, rect: DOMRect) => void;
}

export function EventPill({ event, accounts, onClick }: EventPillProps) {
  const accountId = getEventAccountId(event, accounts);
  const color: AccountColor = accountId
    ? getAccountColor(accountId, accounts)
    : {
        name: "default",
        bg: "rgba(100, 116, 160, 0.12)",
        bgDark: "rgba(100, 116, 160, 0.22)",
        border: "#6474a0",
        text: "#4a5580",
        textDark: "#a8b4d4",
      };

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (onClick) {
        const rect = e.currentTarget.getBoundingClientRect();
        onClick(event, rect);
      }
    },
    [event, onClick],
  );

  const isDark = useDarkMode();

  const timeLabel = !event.isAllDay
    ? formatTime(new Date(event.startDateTime))
    : null;

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex w-full items-center gap-1 rounded px-1 py-0.5 text-left transition-colors hover:opacity-80"
      style={{
        backgroundColor: isDark ? color.bgDark : color.bg,
        borderLeft: `3px solid ${color.border}`,
        fontSize: "11px",
        lineHeight: "1.2",
      }}
    >
      {timeLabel && (
        <span
          className="shrink-0 font-medium"
          style={{ color: isDark ? color.textDark : color.text }}
        >
          {timeLabel}
        </span>
      )}
      <span
        className="truncate"
        style={{ color: isDark ? color.textDark : color.text }}
      >
        {event.subject || "(No subject)"}
      </span>
    </button>
  );
}
