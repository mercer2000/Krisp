"use client";

import { useCallback } from "react";
import type { CalendarEvent } from "@/types";
import {
  formatTimeRange,
  getAccountColor,
  getEventAccountId,
  useDarkMode,
  type CalendarAccount,
  type AccountColor,
} from "@/components/calendar/calendarUtils";

interface EventBlockProps {
  event: CalendarEvent;
  accounts: CalendarAccount[];
  top: number;
  height: number;
  /** Width as a percentage string, e.g. "100%" or "50%". Defaults to "100%". */
  width?: string;
  /** Left offset as a percentage string, e.g. "0%" or "50%". Defaults to "0%". */
  left?: string;
  onClick?: (event: CalendarEvent, rect: DOMRect) => void;
}

export function EventBlock({
  event,
  accounts,
  top,
  height,
  width = "100%",
  left = "0%",
  onClick,
}: EventBlockProps) {
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

  const isCompact = height < 30;
  const isTall = height >= 50;

  const textColor = isDark ? color.textDark : color.text;

  return (
    <button
      type="button"
      onClick={handleClick}
      className="absolute cursor-pointer overflow-hidden rounded transition-shadow hover:shadow-md"
      style={{
        top: `${top}px`,
        height: `${height}px`,
        width,
        left,
        backgroundColor: isDark ? color.bgDark : color.bg,
        borderLeft: `3px solid ${color.border}`,
      }}
    >
      <div className="flex h-full flex-col justify-start px-1.5 py-0.5">
        {/* Title — always shown */}
        <span
          className="truncate font-medium"
          style={{ fontSize: "11px", lineHeight: "1.2", color: textColor }}
        >
          {event.subject || "(No subject)"}
        </span>

        {/* Time range — shown in normal and tall mode */}
        {!isCompact && (
          <span
            className="truncate"
            style={{ fontSize: "10px", lineHeight: "1.3", color: textColor, opacity: 0.8 }}
          >
            {formatTimeRange(event)}
          </span>
        )}

        {/* Location — shown only in tall mode */}
        {isTall && event.location && (
          <span
            className="truncate"
            style={{ fontSize: "10px", lineHeight: "1.3", color: textColor, opacity: 0.7 }}
          >
            {event.location}
          </span>
        )}
      </div>
    </button>
  );
}
