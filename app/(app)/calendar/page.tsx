"use client";

import { useState, useMemo } from "react";
import {
  useCalendarEventsInRange,
  useCalendarSync,
  useSyncState,
  useOutlookCalendarStatus,
  useOutlookCalendarSync,
  useGoogleCalendarStatus,
  useGoogleCalendarSync,
} from "@/lib/hooks/useCalendar";
import type { CalendarEvent } from "@/types";

interface CalendarAccount {
  id: string;
  email: string;
  provider: "google" | "outlook" | "graph";
  lastSyncAt?: string | null;
}

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

function GoogleIcon({ size = 12 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M8 12h8" />
      <path d="M12 8v8" />
    </svg>
  );
}

function OutlookIcon({ size = 12 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function ProviderIcon({ provider, size = 12 }: { provider: "google" | "outlook" | "graph"; size?: number }) {
  return provider === "google" ? <GoogleIcon size={size} /> : <OutlookIcon size={size} />;
}

/** Determine if an event came from Google Calendar (gcal_ prefix on graphEventId) */
function isGoogleEvent(event: CalendarEvent): boolean {
  return event.graphEventId.startsWith("gcal_");
}

function EventCard({ event, showProviderBadge }: { event: CalendarEvent; showProviderBadge?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const attendeeCount = event.attendees?.length || 0;
  const isGoogle = isGoogleEvent(event);

  return (
    <div
      className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 transition-shadow hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-[var(--foreground)]">
              {event.subject || "(No subject)"}
            </h3>
            {showProviderBadge && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                  isGoogle
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                    : "bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400"
                }`}
              >
                <ProviderIcon provider={isGoogle ? "google" : "outlook"} size={10} />
                {isGoogle ? "Google" : "Outlook"}
              </span>
            )}
          </div>
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
  const [filterAccountId, setFilterAccountId] = useState<string | null>(null);
  const [filterProvider, setFilterProvider] = useState<"google" | "outlook" | "graph" | null>(null);

  const { start } = getWeekRange();
  const end = new Date(start);
  end.setDate(end.getDate() + daysForward);
  end.setHours(23, 59, 59, 999);

  const { data, isLoading, error } = useCalendarEventsInRange(
    start.toISOString(),
    end.toISOString()
  );

  // Graph API sync (Azure AD credentials)
  const graphSyncMutation = useCalendarSync();
  const { data: syncData } = useSyncState();

  // Outlook OAuth sync (personal/work Microsoft accounts)
  const { data: outlookStatus } = useOutlookCalendarStatus();
  const outlookSyncMutation = useOutlookCalendarSync();

  // Google Calendar OAuth sync
  const { data: googleStatus } = useGoogleCalendarStatus();
  const googleSyncMutation = useGoogleCalendarSync();

  const allEvents = data?.events || [];

  const hasGraphCredentials = (syncData?.credentials?.length ?? 0) > 0;
  const hasGraphSyncState = (syncData?.syncStates?.length ?? 0) > 0;
  const hasOutlookConnection = outlookStatus?.connected === true;
  const hasGoogleConnection = googleStatus?.connected === true;

  // Build unified account list
  const calendarAccounts: CalendarAccount[] = useMemo(() => {
    const accounts: CalendarAccount[] = [];
    if (googleStatus?.accounts) {
      for (const a of googleStatus.accounts) {
        accounts.push({
          id: a.id,
          email: a.googleEmail,
          provider: "google",
          lastSyncAt: a.lastSyncAt,
        });
      }
    }
    if (outlookStatus?.accounts) {
      for (const a of outlookStatus.accounts) {
        accounts.push({
          id: a.id,
          email: a.outlookEmail,
          provider: "outlook",
          lastSyncAt: a.lastSyncAt,
        });
      }
    }
    if (syncData?.syncStates) {
      for (const s of syncData.syncStates) {
        accounts.push({
          id: s.credentialId,
          email: s.mailbox,
          provider: "graph",
          lastSyncAt: s.lastSyncAt,
        });
      }
    }
    return accounts;
  }, [googleStatus, outlookStatus, syncData]);

  // Filter events based on selected account/provider
  const filteredEvents = useMemo(() => {
    if (!filterAccountId && !filterProvider) return allEvents;

    return allEvents.filter((event) => {
      if (filterProvider === "google") return isGoogleEvent(event);
      if (filterProvider === "outlook") return !isGoogleEvent(event) && !event.credentialId;
      if (filterProvider === "graph") return !!event.credentialId;
      return true;
    });
  }, [allEvents, filterAccountId, filterProvider]);

  const grouped = groupEventsByDate(filteredEvents);

  // User has at least one calendar source configured
  const hasAnySource = hasGraphCredentials || hasOutlookConnection || hasGoogleConnection;
  const hasAnySyncReady = hasGraphSyncState || hasOutlookConnection || hasGoogleConnection;

  const isSyncing = graphSyncMutation.isPending || outlookSyncMutation.isPending || googleSyncMutation.isPending;

  const handleSync = () => {
    if (filterAccountId && filterProvider) {
      // Sync only the selected account
      if (filterProvider === "google") {
        googleSyncMutation.mutate({ accountId: filterAccountId, daysBack: 7, daysForward });
      } else if (filterProvider === "outlook") {
        outlookSyncMutation.mutate({ accountId: filterAccountId, daysBack: 7, daysForward });
      } else if (filterProvider === "graph" && syncData?.syncStates?.length) {
        const syncState = syncData.syncStates.find((s) => s.credentialId === filterAccountId);
        if (syncState) {
          graphSyncMutation.mutate({
            credentialId: filterAccountId,
            mailbox: syncState.mailbox,
            daysBack: 7,
            daysForward,
          });
        }
      }
      return;
    }

    // Sync from all available sources
    if (hasGraphCredentials && hasGraphSyncState && syncData?.credentials?.length) {
      const cred = syncData.credentials[0];
      const mailbox = syncData.syncStates?.[0]?.mailbox || "";
      if (mailbox) {
        graphSyncMutation.mutate({
          credentialId: cred.id,
          mailbox,
          daysBack: 7,
          daysForward,
        });
      }
    }

    if (hasOutlookConnection) {
      outlookSyncMutation.mutate({
        daysBack: 7,
        daysForward,
      });
    }

    if (hasGoogleConnection) {
      googleSyncMutation.mutate({
        daysBack: 7,
        daysForward,
      });
    }
  };

  const syncedCount =
    (graphSyncMutation.isSuccess ? graphSyncMutation.data.synced : 0) +
    (outlookSyncMutation.isSuccess ? outlookSyncMutation.data.synced : 0) +
    (googleSyncMutation.isSuccess ? googleSyncMutation.data.synced : 0);
  const syncErrors =
    (graphSyncMutation.isSuccess ? graphSyncMutation.data.errors : 0) +
    (outlookSyncMutation.isSuccess ? outlookSyncMutation.data.errors : 0) +
    (googleSyncMutation.isSuccess ? googleSyncMutation.data.errors : 0);
  const showSyncResult = graphSyncMutation.isSuccess || outlookSyncMutation.isSuccess || googleSyncMutation.isSuccess;

  const showProviderBadges = calendarAccounts.length > 1 && !filterAccountId;

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)]">Calendar</h1>
          {filterAccountId && calendarAccounts.length > 0 && (
            <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">
              {calendarAccounts.find((a) => a.id === filterAccountId)?.email ?? "Selected account"}
            </p>
          )}
        </div>
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
          {hasAnySyncReady && (
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="rounded-md bg-[var(--primary)] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
            >
              {isSyncing ? "Syncing..." : "Sync Now"}
            </button>
          )}
        </div>
      </div>

      {/* Account filter chips */}
      {calendarAccounts.length > 1 && (
        <div className="mb-4 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-[var(--muted-foreground)] mr-1">Account:</span>
          <button
            onClick={() => { setFilterAccountId(null); setFilterProvider(null); }}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
              !filterAccountId
                ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                : "border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
            }`}
          >
            All accounts
          </button>
          {calendarAccounts.map((account) => (
            <button
              key={account.id}
              onClick={() => {
                if (filterAccountId === account.id) {
                  setFilterAccountId(null);
                  setFilterProvider(null);
                } else {
                  setFilterAccountId(account.id);
                  setFilterProvider(account.provider);
                }
              }}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors flex items-center gap-1.5 ${
                filterAccountId === account.id
                  ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                  : "border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
              }`}
            >
              <ProviderIcon provider={account.provider} size={12} />
              {account.email}
            </button>
          ))}
        </div>
      )}

      {showSyncResult && (
        <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
          Synced {syncedCount} events.
          {syncErrors > 0 && ` (${syncErrors} errors)`}
        </div>
      )}

      {!hasAnySource && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 text-center">
          <h2 className="mb-2 text-base font-medium text-[var(--foreground)]">
            Connect your Calendar
          </h2>
          <p className="mb-4 text-sm text-[var(--muted-foreground)]">
            Connect your Google Calendar, Outlook account, or set up Azure AD
            credentials in Integrations to sync your calendar events.
          </p>
          <a
            href="/admin/integrations"
            className="inline-block rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
          >
            Go to Integrations
          </a>
        </div>
      )}

      {hasGraphCredentials && !hasGraphSyncState && !hasOutlookConnection && !hasGoogleConnection && (
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
              graphSyncMutation.mutate({ credentialId, mailbox, daysBack: 7, daysForward: 30 });
            }}
            isPending={graphSyncMutation.isPending}
          />
        </div>
      )}

      {hasOutlookConnection && !hasGraphCredentials && allEvents.length === 0 && !isLoading && (
        <div className="mb-4 rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 text-center">
          <h2 className="mb-2 text-base font-medium text-[var(--foreground)]">
            Sync your Outlook calendar
          </h2>
          <p className="mb-3 text-sm text-[var(--muted-foreground)]">
            {outlookStatus?.accounts && outlookStatus.accounts.length === 1
              ? `Your Outlook account (${outlookStatus.accounts[0].outlookEmail}) is connected.`
              : `${outlookStatus?.accounts?.length ?? 0} Outlook accounts are connected.`}
            {" "}Click below to sync your calendar events.
          </p>
          <button
            onClick={() => outlookSyncMutation.mutate({ daysBack: 7, daysForward: 30 })}
            disabled={outlookSyncMutation.isPending}
            className="rounded-md bg-[#0078D4] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#106ebe] disabled:opacity-50"
          >
            {outlookSyncMutation.isPending ? "Syncing..." : "Sync Outlook Calendar"}
          </button>
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

      {!isLoading && !error && grouped.length === 0 && hasAnySyncReady && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 text-center text-sm text-[var(--muted-foreground)]">
          {filterAccountId
            ? "No events from this account in the selected range. Try syncing or expanding the date range."
            : "No events in the selected range. Try syncing or expanding the date range."}
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
                <EventCard key={event.id} event={event} showProviderBadge={showProviderBadges} />
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
