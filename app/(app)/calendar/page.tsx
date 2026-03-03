"use client";

import { useState } from "react";
import {
  useCalendarEventsInRange,
  useCalendarSync,
  useSyncState,
} from "@/lib/hooks/useCalendar";
import type { CalendarEvent } from "@/types";

function getWeekRange() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setDate(end.getDate() + 7);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function formatTimeRange(event: CalendarEvent) {
  const start = new Date(event.startDateTime);
  const end = new Date(event.endDateTime);

  if (event.isAllDay) return "All day";

  return `${start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} – ${end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const isTomorrow =
    d.toDateString() ===
    new Date(now.getTime() + 86400000).toDateString();

  if (isToday) return "Today";
  if (isTomorrow) return "Tomorrow";
  return d.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function groupEventsByDate(events: CalendarEvent[]) {
  const groups: Record<string, CalendarEvent[]> = {};
  for (const event of events) {
    const key = new Date(event.startDateTime).toDateString();
    if (!groups[key]) groups[key] = [];
    groups[key].push(event);
  }
  return Object.entries(groups).sort(
    ([a], [b]) => new Date(a).getTime() - new Date(b).getTime()
  );
}

function EventCard({ event }: { event: CalendarEvent }) {
  const [expanded, setExpanded] = useState(false);
  const attendeeCount = event.attendees?.length || 0;

  return (
    <div
      className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 transition-shadow hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium text-[var(--foreground)]">
            {event.subject || "(No subject)"}
          </h3>
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
            {formatTimeRange(event)}
          </p>
          {event.location && (
            <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
              {event.location}
            </p>
          )}
          {event.organizerName && (
            <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
              Organizer: {event.organizerName}
            </p>
          )}
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          {event.showAs && (
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                event.showAs === "busy"
                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  : event.showAs === "tentative"
                    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                    : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              }`}
            >
              {event.showAs}
            </span>
          )}
          {event.webLink && (
            <a
              href={event.webLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[var(--primary)] hover:underline"
            >
              Open
            </a>
          )}
        </div>
      </div>

      {attendeeCount > 0 && (
        <div className="mt-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            {expanded ? "Hide" : "Show"} {attendeeCount} attendee{attendeeCount !== 1 ? "s" : ""}
          </button>
          {expanded && (
            <div className="mt-1 space-y-0.5">
              {event.attendees.map((a, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      a.response === "accepted"
                        ? "bg-green-500"
                        : a.response === "declined"
                          ? "bg-red-500"
                          : a.response === "tentativelyAccepted"
                            ? "bg-yellow-500"
                            : "bg-gray-400"
                    }`}
                  />
                  <span>{a.name || a.email}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CalendarPage() {
  const [daysForward, setDaysForward] = useState(7);
  const { start } = getWeekRange();
  const end = new Date(start);
  end.setDate(end.getDate() + daysForward);
  end.setHours(23, 59, 59, 999);

  const { data, isLoading, error } = useCalendarEventsInRange(
    start.toISOString(),
    end.toISOString()
  );

  const syncMutation = useCalendarSync();
  const { data: syncData } = useSyncState();

  const events = data?.events || [];
  const grouped = groupEventsByDate(events);

  const hasCredentials = (syncData?.credentials?.length ?? 0) > 0;
  const hasSyncState = (syncData?.syncStates?.length ?? 0) > 0;

  const handleSync = () => {
    if (!syncData?.credentials?.length) return;
    const cred = syncData.credentials[0];
    // Use the sync state mailbox if available, otherwise prompt is needed
    const mailbox =
      syncData.syncStates?.[0]?.mailbox || "";

    if (!mailbox) {
      alert(
        "No mailbox configured. Please set up calendar sync from the Integrations page first."
      );
      return;
    }

    syncMutation.mutate({
      credentialId: cred.id,
      mailbox,
      daysBack: 7,
      daysForward,
    });
  };

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--foreground)]">Calendar</h1>
        <div className="flex items-center gap-3">
          <select
            value={daysForward}
            onChange={(e) => setDaysForward(Number(e.target.value))}
            className="rounded-md border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-sm text-[var(--foreground)]"
          >
            <option value={7}>Next 7 days</option>
            <option value={14}>Next 14 days</option>
            <option value={30}>Next 30 days</option>
          </select>
          {hasCredentials && hasSyncState && (
            <button
              onClick={handleSync}
              disabled={syncMutation.isPending}
              className="rounded-md bg-[var(--primary)] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
            >
              {syncMutation.isPending ? "Syncing..." : "Sync Now"}
            </button>
          )}
        </div>
      </div>

      {syncMutation.isSuccess && (
        <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
          Synced {syncMutation.data.synced} events.
          {syncMutation.data.errors > 0 &&
            ` (${syncMutation.data.errors} errors)`}
        </div>
      )}

      {!hasCredentials && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 text-center">
          <h2 className="mb-2 text-base font-medium text-[var(--foreground)]">
            Connect your Microsoft 365 Calendar
          </h2>
          <p className="mb-4 text-sm text-[var(--muted-foreground)]">
            Set up Azure AD credentials in Integrations to sync your calendar
            events.
          </p>
          <a
            href="/admin/integrations"
            className="inline-block rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
          >
            Go to Integrations
          </a>
        </div>
      )}

      {hasCredentials && !hasSyncState && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 text-center">
          <h2 className="mb-2 text-base font-medium text-[var(--foreground)]">
            Start your first calendar sync
          </h2>
          <p className="mb-4 text-sm text-[var(--muted-foreground)]">
            Your Azure AD credentials are configured. Enter your mailbox email
            to begin syncing calendar events.
          </p>
          <SyncSetupForm
            credentials={syncData?.credentials || []}
            onSync={(credentialId, mailbox) => {
              syncMutation.mutate({ credentialId, mailbox, daysBack: 7, daysForward: 30 });
            }}
            isPending={syncMutation.isPending}
          />
        </div>
      )}

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-lg border border-[var(--border)] bg-[var(--card)] p-4"
            >
              <div className="h-4 w-1/3 rounded bg-[var(--muted-foreground)]/20" />
              <div className="mt-2 h-3 w-1/2 rounded bg-[var(--muted-foreground)]/10" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          Failed to load calendar events.
        </div>
      )}

      {!isLoading && !error && grouped.length === 0 && hasSyncState && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 text-center text-sm text-[var(--muted-foreground)]">
          No events in the selected range. Try syncing or expanding the date
          range.
        </div>
      )}

      <div className="space-y-6">
        {grouped.map(([dateStr, dayEvents]) => (
          <div key={dateStr}>
            <h2 className="mb-2 text-sm font-semibold text-[var(--foreground)]">
              {formatDate(dayEvents[0].startDateTime)}
            </h2>
            <div className="space-y-2">
              {dayEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SyncSetupForm({
  credentials,
  onSync,
  isPending,
}: {
  credentials: Array<{ id: string; label: string }>;
  onSync: (credentialId: string, mailbox: string) => void;
  isPending: boolean;
}) {
  const [mailbox, setMailbox] = useState("");
  const [credentialId, setCredentialId] = useState(credentials[0]?.id || "");

  return (
    <div className="mx-auto max-w-sm space-y-3">
      {credentials.length > 1 && (
        <select
          value={credentialId}
          onChange={(e) => setCredentialId(e.target.value)}
          className="w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)]"
        >
          {credentials.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      )}
      <input
        type="email"
        placeholder="user@example.com"
        value={mailbox}
        onChange={(e) => setMailbox(e.target.value)}
        className="w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
      />
      <button
        onClick={() => {
          if (mailbox.trim() && credentialId) {
            onSync(credentialId, mailbox.trim());
          }
        }}
        disabled={!mailbox.trim() || !credentialId || isPending}
        className="w-full rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? "Syncing..." : "Sync Calendar"}
      </button>
    </div>
  );
}
