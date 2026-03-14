"use client";

import { useEffect, useCallback } from "react";
import type { CalendarEvent } from "@/types";
import {
  type CalendarAccount,
  getEventAccountId,
  getAccountColor,
  formatTimeRange,
} from "./calendarUtils";

interface EventDetailPopoverProps {
  event: CalendarEvent;
  anchorRect: DOMRect;
  accounts: CalendarAccount[];
  onClose: () => void;
  onCreateCard: (event: CalendarEvent) => void;
}

export default function EventDetailPopover({
  event,
  anchorRect,
  accounts,
  onClose,
  onCreateCard,
}: EventDetailPopoverProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Determine provider
  const isGoogle = event.graphEventId.startsWith("gcal_");
  const providerName = isGoogle ? "Google" : "Outlook";

  // Account color
  const accountId = getEventAccountId(event, accounts);
  const account = accounts.find((a) => a.id === accountId);
  const color = accountId
    ? getAccountColor(accountId, accounts)
    : { border: "#6474a0", text: "#4a5580", textDark: "#a8b4d4" };

  // Position calculation
  const popoverWidth = 320;
  const maxHeight = 400;
  const gap = 8;
  const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1024;
  const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 768;

  let left: number;
  // Try right of anchor
  if (anchorRect.right + gap + popoverWidth <= viewportWidth) {
    left = anchorRect.right + gap;
  } else {
    // Try left of anchor
    left = anchorRect.left - gap - popoverWidth;
  }
  // Clamp horizontal
  left = Math.max(8, Math.min(left, viewportWidth - popoverWidth - 8));

  // Vertical: align with anchor top, clamp to viewport
  let top = anchorRect.top;
  top = Math.max(8, Math.min(top, viewportHeight - maxHeight - 8));

  return (
    <div
      className="fixed inset-0 z-50"
      onMouseDown={(e) => {
        // Close if clicking the backdrop (not the popover itself)
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="absolute overflow-hidden rounded-lg border bg-popover shadow-lg"
        style={{
          width: popoverWidth,
          maxHeight,
          left,
          top,
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Color bar */}
        <div className="h-1" style={{ backgroundColor: color.border }} />

        {/* Content */}
        <div className="space-y-3 overflow-y-auto p-4" style={{ maxHeight: maxHeight - 4 }}>
          {/* Title */}
          <h3 className="text-sm font-semibold">{event.subject || "(No title)"}</h3>

          {/* Time range */}
          <p className="text-xs text-muted-foreground">{formatTimeRange(event)}</p>

          {/* Location */}
          {event.location && (
            <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mt-0.5 shrink-0"
              >
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>{event.location}</span>
            </div>
          )}

          {/* Organizer */}
          {(event.organizerName || event.organizerEmail) && (
            <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mt-0.5 shrink-0"
              >
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>{event.organizerName || event.organizerEmail}</span>
            </div>
          )}

          {/* Account info */}
          {account && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span
                className="inline-block h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: color.border }}
              />
              <span>
                {account.email} &middot; {providerName}
              </span>
            </div>
          )}

          {/* Attendees */}
          {event.attendees.length > 0 && (
            <div>
              <p className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                Attendees ({event.attendees.length})
              </p>
              <div className="max-h-[120px] space-y-1 overflow-y-auto">
                {event.attendees.map((attendee, i) => {
                  let dotColor = "#9ca3af"; // gray default
                  if (attendee.response === "accepted") dotColor = "#22c55e";
                  else if (attendee.response === "declined") dotColor = "#ef4444";
                  else if (attendee.response === "tentative" || attendee.response === "tentativelyAccepted") dotColor = "#eab308";

                  return (
                    <div key={`${attendee.email}-${i}`} className="flex items-center gap-1.5 text-xs">
                      <span
                        className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: dotColor }}
                      />
                      <span className="truncate">
                        {attendee.name || attendee.email}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 border-t pt-3">
            {event.webLink && (
              <a
                href={event.webLink}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border px-2.5 py-1 text-xs hover:bg-accent"
              >
                Open in {providerName}
              </a>
            )}
            <button
              type="button"
              className="rounded-md bg-primary px-2.5 py-1 text-xs text-white hover:bg-primary/90"
              onClick={() => onCreateCard(event)}
            >
              Create Card
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
