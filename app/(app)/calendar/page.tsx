"use client";

import { useState, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
import {
  getViewDateRange,
  navigateDate,
  type ViewType,
  type CalendarAccount,
} from "@/components/calendar/calendarUtils";
import { CalendarHeader } from "@/components/calendar/CalendarHeader";
import { MonthView } from "@/components/calendar/MonthView";
import { WeekView } from "@/components/calendar/WeekView";
import { DayView } from "@/components/calendar/DayView";
import { AgendaView } from "@/components/calendar/AgendaView";
import EventDetailPopover from "@/components/calendar/EventDetailPopover";
import CreateCardFromEvent from "@/components/calendar/CreateCardFromEvent";

// ── Helpers ──────────────────────────────────────────

function parseViewParam(value: string | null): ViewType {
  if (value === "month" || value === "week" || value === "day" || value === "agenda") {
    return value;
  }
  return "week";
}

function parseDateParam(value: string | null): Date {
  if (value) {
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

// ── Page Component ───────────────────────────────────

export default function CalendarPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // ── State ──────────────────────────────────────────
  const [activeView, setActiveView] = useState<ViewType>(() =>
    parseViewParam(searchParams.get("view")),
  );
  const [currentDate, setCurrentDate] = useState<Date>(() =>
    parseDateParam(searchParams.get("date")),
  );
  const [visibleAccounts, setVisibleAccounts] = useState<Set<string> | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<{
    event: CalendarEvent;
    rect: DOMRect;
  } | null>(null);
  const [showCreateCard, setShowCreateCard] = useState(false);

  // ── URL sync helper ────────────────────────────────

  const updateURL = useCallback(
    (view: ViewType, date: Date) => {
      const params = new URLSearchParams();
      params.set("view", view);
      params.set("date", date.toISOString().slice(0, 10));
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router],
  );

  // ── Data fetching ──────────────────────────────────

  const dateRange = useMemo(
    () => getViewDateRange(activeView, currentDate),
    [activeView, currentDate],
  );

  const { data, isLoading, error } = useCalendarEventsInRange(
    dateRange.start.toISOString(),
    dateRange.end.toISOString(),
  );

  const allEvents = useMemo(() => data?.events ?? [], [data]);

  // Account status hooks
  const { data: googleStatus } = useGoogleCalendarStatus();
  const { data: outlookStatus } = useOutlookCalendarStatus();
  const { data: syncData } = useSyncState();

  // Sync mutations
  const graphSyncMutation = useCalendarSync();
  const outlookSyncMutation = useOutlookCalendarSync();
  const googleSyncMutation = useGoogleCalendarSync();

  // ── Build unified CalendarAccount array ────────────

  const accounts: CalendarAccount[] = useMemo(() => {
    const result: CalendarAccount[] = [];

    if (googleStatus?.accounts) {
      for (const a of googleStatus.accounts) {
        result.push({
          id: a.id,
          email: a.googleEmail,
          provider: "google",
          lastSyncAt: a.lastSyncAt ?? "",
        });
      }
    }

    if (outlookStatus?.accounts) {
      for (const a of outlookStatus.accounts) {
        result.push({
          id: a.id,
          email: a.outlookEmail,
          provider: "outlook",
          lastSyncAt: a.lastSyncAt ?? "",
        });
      }
    }

    if (syncData?.syncStates) {
      for (const s of syncData.syncStates) {
        result.push({
          id: s.credentialId,
          email: s.mailbox,
          provider: "graph",
          lastSyncAt: s.lastSyncAt ?? "",
        });
      }
    }

    return result;
  }, [googleStatus, outlookStatus, syncData]);

  // ── Effective visible accounts ─────────────────────

  const effectiveVisibleAccounts = useMemo(() => {
    if (visibleAccounts !== null) return visibleAccounts;
    return new Set(accounts.map((a) => a.id));
  }, [visibleAccounts, accounts]);

  // ── Derived booleans ───────────────────────────────

  const hasGoogleConnection = googleStatus?.connected === true;
  const hasOutlookConnection = outlookStatus?.connected === true;
  const hasGraphCredentials = (syncData?.credentials?.length ?? 0) > 0;
  const hasGraphSyncState = (syncData?.syncStates?.length ?? 0) > 0;
  const hasAnySource = hasGoogleConnection || hasOutlookConnection || hasGraphCredentials;

  const isSyncing =
    graphSyncMutation.isPending ||
    outlookSyncMutation.isPending ||
    googleSyncMutation.isPending;

  // ── Handlers ───────────────────────────────────────

  const handleViewChange = useCallback(
    (view: ViewType) => {
      setActiveView(view);
      updateURL(view, currentDate);
    },
    [currentDate, updateURL],
  );

  const handleNavigate = useCallback(
    (direction: "prev" | "next") => {
      const dir = direction === "prev" ? -1 : 1;
      const newDate = navigateDate(currentDate, activeView, dir);
      setCurrentDate(newDate);
      updateURL(activeView, newDate);
    },
    [currentDate, activeView, updateURL],
  );

  const handleToday = useCallback(() => {
    const today = new Date();
    setCurrentDate(today);
    updateURL(activeView, today);
  }, [activeView, updateURL]);

  const handleDayClick = useCallback(
    (date: Date) => {
      setCurrentDate(date);
      setActiveView("day");
      updateURL("day", date);
    },
    [updateURL],
  );

  const handleToggleAccount = useCallback(
    (accountId: string) => {
      setVisibleAccounts((prev) => {
        const current = prev ?? new Set(accounts.map((a) => a.id));
        const next = new Set(current);
        if (next.has(accountId)) {
          next.delete(accountId);
        } else {
          next.add(accountId);
        }
        return next;
      });
    },
    [accounts],
  );

  const handleSync = useCallback(() => {
    if (hasGoogleConnection) {
      googleSyncMutation.mutate({ daysBack: 7, daysForward: 30 });
    }
    if (hasOutlookConnection) {
      outlookSyncMutation.mutate({ daysBack: 7, daysForward: 30 });
    }
    if (hasGraphCredentials && hasGraphSyncState && syncData?.credentials?.length) {
      const cred = syncData.credentials[0];
      const mailbox = syncData.syncStates?.[0]?.mailbox || "";
      if (mailbox) {
        graphSyncMutation.mutate({
          credentialId: cred.id,
          mailbox,
          daysBack: 7,
          daysForward: 30,
        });
      }
    }
  }, [
    hasGoogleConnection,
    hasOutlookConnection,
    hasGraphCredentials,
    hasGraphSyncState,
    syncData,
    googleSyncMutation,
    outlookSyncMutation,
    graphSyncMutation,
  ]);

  const handleEventClick = useCallback(
    (event: CalendarEvent, rect: DOMRect) => {
      setSelectedEvent({ event, rect });
      setShowCreateCard(false);
    },
    [],
  );

  const handleClosePopover = useCallback(() => {
    setSelectedEvent(null);
    setShowCreateCard(false);
  }, []);

  const handleCreateCard = useCallback((_event: CalendarEvent) => {
    setShowCreateCard(true);
  }, []);

  const handleCardCreated = useCallback(() => {
    setSelectedEvent(null);
    setShowCreateCard(false);
  }, []);

  // ── Render ─────────────────────────────────────────

  return (
    <div className="flex h-full flex-col p-4">
      <CalendarHeader
        currentDate={currentDate}
        activeView={activeView}
        accounts={accounts}
        visibleAccounts={effectiveVisibleAccounts}
        isSyncing={isSyncing}
        onNavigate={handleNavigate}
        onToday={handleToday}
        onViewChange={handleViewChange}
        onToggleAccount={handleToggleAccount}
        onSync={handleSync}
      />

      {/* Empty state -- no sources connected */}
      {!hasAnySource && (
        <div className="flex flex-1 items-center justify-center">
          <div className="max-w-sm text-center">
            <h2 className="mb-2 text-base font-medium">
              Connect your Calendar
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Connect your Google Calendar, Outlook account, or set up Azure AD
              credentials in Integrations to sync your calendar events.
            </p>
            <a
              href="/settings/integrations"
              className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Go to Integrations
            </a>
          </div>
        </div>
      )}

      {/* Loading spinner */}
      {hasAnySource && isLoading && (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" className="opacity-25" />
              <path d="M4 12a8 8 0 018-8" className="opacity-75" />
            </svg>
            Loading events...
          </div>
        </div>
      )}

      {/* Error message */}
      {hasAnySource && error && (
        <div className="m-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          Failed to load calendar events.
        </div>
      )}

      {/* Active view */}
      {hasAnySource && !isLoading && !error && (
        <>
          {activeView === "month" && (
            <MonthView
              currentDate={currentDate}
              events={allEvents}
              accounts={accounts}
              visibleAccounts={effectiveVisibleAccounts}
              onEventClick={handleEventClick}
              onDayClick={handleDayClick}
            />
          )}
          {activeView === "week" && (
            <WeekView
              currentDate={currentDate}
              events={allEvents}
              accounts={accounts}
              visibleAccounts={effectiveVisibleAccounts}
              onEventClick={handleEventClick}
            />
          )}
          {activeView === "day" && (
            <DayView
              currentDate={currentDate}
              events={allEvents}
              accounts={accounts}
              visibleAccounts={effectiveVisibleAccounts}
              onEventClick={handleEventClick}
            />
          )}
          {activeView === "agenda" && (
            <AgendaView
              events={allEvents}
              accounts={accounts}
              visibleAccounts={effectiveVisibleAccounts}
              onEventClick={handleEventClick}
            />
          )}
        </>
      )}

      {/* Event detail popover */}
      {selectedEvent && !showCreateCard && (
        <EventDetailPopover
          event={selectedEvent.event}
          anchorRect={selectedEvent.rect}
          accounts={accounts}
          onClose={handleClosePopover}
          onCreateCard={handleCreateCard}
        />
      )}

      {/* Create card modal */}
      {selectedEvent && showCreateCard && (
        <CreateCardFromEvent
          event={selectedEvent.event}
          onClose={handleClosePopover}
          onCreated={handleCardCreated}
        />
      )}
    </div>
  );
}
