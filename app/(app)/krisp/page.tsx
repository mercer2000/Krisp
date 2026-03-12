"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { MeetingDetailDrawer } from "@/components/meeting/MeetingDetailDrawer";
import { MeetingFilters } from "@/components/meeting/MeetingFilters";
import { AnalyticsDashboard } from "@/components/meeting/AnalyticsDashboard";
import { useMeetingFilters } from "@/lib/hooks/useMeetingFilters";

interface KeyPointContent {
  id: string;
  description: string;
}

interface Meeting {
  id: number;
  meeting_id: string;
  meeting_title: string | null;
  meeting_start_date: string | null;
  meeting_end_date: string | null;
  meeting_duration: number | null;
  speakers: (string | { index: number; first_name?: string; last_name?: string })[];
  participants: string[];
  content: KeyPointContent[];
  raw_content: string | null;
  event_type: string | null;
}

interface SearchResponse {
  meetings: Meeting[];
  answer: string;
  searchQuery: string;
}

type Tab = "meetings" | "analytics";

function KrispPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = (searchParams.get("tab") as Tab) || "meetings";

  const setActiveTab = (tab: Tab) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "meetings") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    const qs = params.toString();
    router.push(qs ? `/krisp?${qs}` : "/krisp");
  };

  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

  // Meeting detail drawer
  const [openMeetingId, setOpenMeetingId] = useState<number | null>(null);

  // View mode: "list" or "cards" (persisted in localStorage)
  const [viewMode, setViewMode] = useState<"list" | "cards">(() => {
    if (typeof window === "undefined") return "cards";
    return (localStorage.getItem("krisp-view-mode") as "list" | "cards") || "cards";
  });

  // Focused meeting for list-view preview pane
  const [focusedMeetingId, setFocusedMeetingId] = useState<number | null>(null);

  // Resizable list column width (persisted in localStorage)
  const [listWidth, setListWidth] = useState<number>(() => {
    if (typeof window === "undefined") return 480;
    const saved = localStorage.getItem("krisp-list-width");
    return saved ? Math.max(280, Math.min(800, parseInt(saved, 10))) : 480;
  });
  const [isResizing, setIsResizing] = useState(false);
  const listColumnRef = useRef<HTMLDivElement>(null);
  const resizeStartXRef = useRef(0);
  const resizeStartWidthRef = useRef(0);

  // All meetings loaded on page load
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [meetingsLoading, setMeetingsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [unfilteredTotal, setUnfilteredTotal] = useState(0);

  // Participants for filter dropdown
  const [availableParticipants, setAvailableParticipants] = useState<string[]>([]);

  // Filter state from URL params
  const {
    filters,
    hasActiveFilters,
    setFilters,
    removeFilter,
    clearAll,
    buildQueryString,
  } = useMeetingFilters();

  // Fetch available participants once
  useEffect(() => {
    async function fetchParticipants() {
      try {
        const res = await fetch("/api/meetings/participants");
        if (res.ok) {
          const data = await res.json();
          setAvailableParticipants(data.participants ?? []);
        }
      } catch {
        // Silently fail — participant filter will just show empty list
      }
    }
    fetchParticipants();
  }, []);

  // Persist viewMode to localStorage
  useEffect(() => {
    localStorage.setItem("krisp-view-mode", viewMode);
  }, [viewMode]);

  // Fetch meetings (with filters applied via query params)
  const fetchMeetings = useCallback(async () => {
    setMeetingsLoading(true);
    try {
      const qs = buildQueryString();
      const isFiltered = qs.length > 0;
      const url = isFiltered ? `/api/meetings?${qs}` : "/api/meetings";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setMeetings(data.meetings ?? []);
      setTotalCount(data.total ?? data.meetings?.length ?? 0);
      // When fetching without filters, also update the unfiltered total
      if (!isFiltered) {
        setUnfilteredTotal(data.total ?? data.meetings?.length ?? 0);
      }
    } catch {
      console.error("Failed to load meetings");
    } finally {
      setMeetingsLoading(false);
    }
  }, [buildQueryString]);

  // Fetch unfiltered total once (only if filters are active on first load)
  useEffect(() => {
    if (!hasActiveFilters) return;
    async function fetchUnfilteredTotal() {
      try {
        const res = await fetch("/api/meetings");
        if (res.ok) {
          const data = await res.json();
          setUnfilteredTotal(data.total ?? data.meetings?.length ?? 0);
        }
      } catch {
        // ignore
      }
    }
    fetchUnfilteredTotal();
    // Only run once on mount — we only need the baseline count
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch when filters change
  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setSelectedMeeting(null);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError("Failed to search. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Unknown date";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateShort = (dateStr: string | null) => {
    if (!dateStr) return "Unknown date";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m`;
  };

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<number | null>(null);

  const handleDeleteClick = (e: React.MouseEvent, meetingId: number) => {
    e.stopPropagation();
    setConfirmingDeleteId(meetingId);
  };

  const handleDeleteConfirm = async (e: React.MouseEvent, meetingId: number) => {
    e.stopPropagation();
    setDeletingId(meetingId);
    try {
      const res = await fetch(`/api/meetings/${meetingId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setMeetings((prev) => prev.filter((m) => m.id !== meetingId));
      setTotalCount((c) => c - 1);
      setUnfilteredTotal((c) => c - 1);
    } catch {
      alert("Failed to delete meeting. Please try again.");
    } finally {
      setDeletingId(null);
      setConfirmingDeleteId(null);
    }
  };

  const handleDeleteCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmingDeleteId(null);
  };

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    resizeStartXRef.current = e.clientX;
    resizeStartWidthRef.current = listColumnRef.current?.offsetWidth ?? listWidth;
    setIsResizing(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    function onMouseMove(ev: MouseEvent) {
      const delta = ev.clientX - resizeStartXRef.current;
      const newWidth = Math.max(280, Math.min(800, resizeStartWidthRef.current + delta));
      if (listColumnRef.current) {
        listColumnRef.current.style.width = `${newWidth}px`;
      }
    }
    function onMouseUp(ev: MouseEvent) {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      setIsResizing(false);
      const delta = ev.clientX - resizeStartXRef.current;
      const finalWidth = Math.max(280, Math.min(800, resizeStartWidthRef.current + delta));
      setListWidth(finalWidth);
      localStorage.setItem("krisp-list-width", String(finalWidth));
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    }
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, [listWidth]);

  const getActionItems = (meeting: Meeting): string[] => {
    if (!Array.isArray(meeting.content)) return [];
    return meeting.content
      .filter((item): item is KeyPointContent => "description" in item)
      .map((item) => item.description);
  };

  const focusedMeeting = meetings.find((m) => m.id === focusedMeetingId) ?? null;

  // When search results exist, display them instead of the full meeting list
  const displayedMeetings = result && result.meetings.length > 0 ? result.meetings : meetings;

  return (
    <div className="flex h-full flex-col bg-[var(--background)]">
      {/* Header with tabs */}
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md">
        <div className="flex items-center px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">
              Meetings
            </h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Recorded meetings with transcripts and action items
            </p>
          </div>
          {/* View mode toggle */}
          {activeTab === "meetings" && (
            <div className="ml-auto flex items-center rounded-lg border border-[var(--border)] overflow-hidden">
              <button
                onClick={() => setViewMode("list")}
                className={`px-2.5 py-2 text-sm transition-colors ${
                  viewMode === "list"
                    ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]"
                }`}
                title="List view"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("cards")}
                className={`px-2.5 py-2 text-sm transition-colors ${
                  viewMode === "cards"
                    ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]"
                }`}
                title="Card view"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
              </button>
            </div>
          )}
        </div>
        {/* Tab bar */}
        <div className="flex px-6 gap-1" role="tablist" aria-label="Meeting sections">
          <button
            role="tab"
            aria-selected={activeTab === "meetings"}
            aria-controls="panel-meetings"
            id="tab-meetings"
            onClick={() => setActiveTab("meetings")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === "meetings"
                ? "border-[var(--primary)] text-[var(--primary)]"
                : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--border)]"
            }`}
          >
            Meetings
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "analytics"}
            aria-controls="panel-analytics"
            id="tab-analytics"
            onClick={() => setActiveTab("analytics")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === "analytics"
                ? "border-[var(--primary)] text-[var(--primary)]"
                : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--border)]"
            }`}
          >
            Analytics
          </button>
        </div>
      </header>

      {/* Tab panels */}
      {activeTab === "meetings" ? (
        <main
          id="panel-meetings"
          role="tabpanel"
          aria-labelledby="tab-meetings"
          className="flex-1 overflow-auto px-6 py-8"
        >
          <div className="max-w-6xl mx-auto">
            {/* Search Form */}
            <form onSubmit={handleSearch} className="mb-6">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask a question about your meetings... (e.g., 'What did we discuss about the budget?')"
                  className="flex-1 px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={isLoading || !query.trim()}
                  className="px-6 py-3 bg-[var(--primary)] hover:opacity-90 disabled:opacity-50 text-[var(--primary-foreground)] font-medium rounded-lg transition-opacity focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Searching...
                    </span>
                  ) : (
                    "Search"
                  )}
                </button>
              </div>
            </form>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-[var(--destructive)]/10 border border-[var(--destructive)]/20 rounded-lg text-[var(--destructive)]">
                {error}
              </div>
            )}

            {/* Search Results */}
            {result && (
              <div className="space-y-6 mb-10">
                {/* AI Answer */}
                <div className="p-6 bg-[var(--primary)]/5 border border-[var(--primary)]/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-[var(--primary-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="font-medium text-[var(--foreground)] mb-2">AI Answer</h2>
                      <p className="text-[var(--foreground)]/80 whitespace-pre-wrap">{result.answer}</p>
                    </div>
                  </div>
                </div>

                {/* Search Result Meeting Cards */}
                {result.meetings.length > 0 && (
                  <div>
                    <h2 className="text-lg font-medium text-[var(--foreground)] mb-4">
                      Related Meetings ({result.meetings.length})
                    </h2>
                    <div className="grid gap-4">
                      {result.meetings.map((meeting) => (
                        <div
                          key={meeting.id}
                          className={`p-4 bg-[var(--card)] border rounded-lg cursor-pointer transition-all ${
                            selectedMeeting?.id === meeting.id
                              ? "border-[var(--primary)] ring-2 ring-[var(--primary)]"
                              : "border-[var(--border)] hover:border-[var(--muted-foreground)]"
                          }`}
                          onClick={() => setSelectedMeeting(selectedMeeting?.id === meeting.id ? null : meeting)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium text-[var(--foreground)]">
                                {meeting.meeting_title || "Untitled Meeting"}
                              </h3>
                              <p className="text-sm text-[var(--muted-foreground)] mt-1">
                                {formatDate(meeting.meeting_start_date)}
                                {meeting.meeting_duration && (
                                  <span className="ml-2">({formatDuration(meeting.meeting_duration)})</span>
                                )}
                              </p>
                            </div>
                            <svg
                              className={`w-5 h-5 text-[var(--muted-foreground)] transition-transform ${
                                selectedMeeting?.id === meeting.id ? "rotate-180" : ""
                              }`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>

                          {/* Speakers */}
                          {Array.isArray(meeting.speakers) && meeting.speakers.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {meeting.speakers.map((speaker, i) => {
                                const name = typeof speaker === "string"
                                  ? speaker
                                  : [speaker.first_name, speaker.last_name].filter(Boolean).join(" ") || `Speaker ${speaker.index}`;
                                return (
                                  <span
                                    key={i}
                                    className="text-xs px-2 py-1 bg-[var(--secondary)] text-[var(--secondary-foreground)] rounded"
                                  >
                                    {name}
                                  </span>
                                );
                              })}
                            </div>
                          )}

                          {/* Expanded Content */}
                          {selectedMeeting?.id === meeting.id && (
                            <div className="mt-4 pt-4 border-t border-[var(--border)]">
                              {/* Key Points */}
                              {Array.isArray(meeting.content) && meeting.content.length > 0 && (
                                <div className="mb-4">
                                  <h4 className="text-sm font-medium text-[var(--foreground)] mb-2">
                                    Key Points
                                  </h4>
                                  <ul className="space-y-2">
                                    {meeting.content.map((kp, i) => (
                                      <li
                                        key={kp.id || i}
                                        className="text-sm text-[var(--muted-foreground)] flex gap-2"
                                      >
                                        <span className="text-[var(--primary)]">&bull;</span>
                                        {kp.description}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* View Full Transcript button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMeetingId(meeting.id);
                                }}
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                View Transcript
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Recorded Meetings Card Grid */}
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
                Recorded Meetings
              </h2>

              {/* Filters */}
              <MeetingFilters
                filters={filters}
                onFiltersChange={setFilters}
                onRemoveFilter={removeFilter}
                onClearAll={clearAll}
                hasActiveFilters={hasActiveFilters}
                totalCount={hasActiveFilters ? unfilteredTotal : totalCount}
                filteredCount={totalCount}
                availableParticipants={availableParticipants}
              />

              {viewMode === "list" ? (
                meetingsLoading ? (
                  <div className="divide-y divide-[var(--border)]">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="px-4 py-3 animate-pulse">
                        <div className="flex items-center justify-between gap-3">
                          <div className="h-4 bg-[var(--secondary)] rounded w-48" />
                          <div className="h-3 bg-[var(--secondary)] rounded w-20" />
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="h-3 bg-[var(--secondary)] rounded w-12" />
                          <div className="h-3 bg-[var(--secondary)] rounded w-32" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : displayedMeetings.length === 0 ? (
                  <div className="text-center py-16">
                    {hasActiveFilters ? (
                      <>
                        <svg
                          className="w-16 h-16 mx-auto text-[var(--muted-foreground)]/30 mb-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                        <h3 className="text-xl font-medium text-[var(--foreground)] mb-2">
                          No Matching Meetings
                        </h3>
                        <p className="text-[var(--muted-foreground)] max-w-md mx-auto mb-4">
                          No meetings match your current filters. Try adjusting or clearing your filters.
                        </p>
                        <button
                          type="button"
                          onClick={clearAll}
                          className="px-4 py-2 text-sm font-medium rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
                        >
                          Clear All Filters
                        </button>
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-16 h-16 mx-auto text-[var(--muted-foreground)]/30 mb-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                        <h3 className="text-xl font-medium text-[var(--foreground)] mb-2">
                          No Meetings Yet
                        </h3>
                        <p className="text-[var(--muted-foreground)] max-w-md mx-auto">
                          Meetings will appear here once Krisp sends webhook data. Use the search bar above to query your meeting transcripts.
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex overflow-hidden -mx-6" style={{ height: "calc(100vh - 320px)" }}>
                    {/* Left panel: meeting list */}
                    <div
                      ref={listColumnRef}
                      className={`${focusedMeetingId != null ? "hidden md:flex md:flex-col" : "flex flex-col flex-1"} overflow-auto`}
                      style={focusedMeetingId != null ? { width: listWidth } : undefined}
                    >
                      <div className="divide-y divide-[var(--border)]">
                        {displayedMeetings.map((meeting) => {
                          const actionItems = getActionItems(meeting);
                          const isSelected = focusedMeetingId === meeting.id;
                          return (
                            <div
                              key={meeting.id}
                              onClick={() => {
                                if (window.innerWidth >= 768) {
                                  setFocusedMeetingId(meeting.id);
                                } else {
                                  setOpenMeetingId(meeting.id);
                                }
                              }}
                              className={`group relative px-4 py-3 cursor-pointer transition-colors ${
                                isSelected
                                  ? "bg-[var(--primary)]/10 border-l-2 border-l-[var(--primary)]"
                                  : "hover:bg-[var(--accent)] border-l-2 border-l-transparent"
                              }`}
                            >
                              {/* Delete button - confirm overlay or trash icon */}
                              {confirmingDeleteId === meeting.id ? (
                                <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-[var(--card)]/95 backdrop-blur-sm">
                                  <button
                                    type="button"
                                    onClick={(e) => handleDeleteConfirm(e, meeting.id)}
                                    disabled={deletingId === meeting.id}
                                    className="px-3 py-1 text-xs font-medium rounded-md bg-[var(--destructive)] text-white hover:opacity-90 disabled:opacity-50"
                                  >
                                    {deletingId === meeting.id ? "Deleting..." : "Delete"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleDeleteCancel}
                                    className="px-3 py-1 text-xs font-medium rounded-md border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--secondary)]"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteClick(e, meeting.id)}
                                  className="absolute top-2 right-2 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-[var(--destructive)]/10 text-[var(--muted-foreground)] hover:text-[var(--destructive)] transition-all"
                                  title="Delete meeting"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              )}

                              {/* Primary line: title + date */}
                              <div className="flex items-baseline justify-between gap-3 pr-6">
                                <h3 className="font-medium text-sm text-[var(--foreground)] truncate">
                                  {meeting.meeting_title || "Untitled Meeting"}
                                </h3>
                                <span className="text-xs text-[var(--muted-foreground)] whitespace-nowrap flex-shrink-0">
                                  {formatDateShort(meeting.meeting_start_date)}
                                </span>
                              </div>

                              {/* Secondary line: duration, speakers, item count */}
                              <div className="flex items-center gap-2 mt-1 text-xs text-[var(--muted-foreground)]">
                                {meeting.meeting_duration && (
                                  <span className="px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--secondary-foreground)]">
                                    {formatDuration(meeting.meeting_duration)}
                                  </span>
                                )}
                                {Array.isArray(meeting.speakers) && meeting.speakers.length > 0 && (
                                  <span className="truncate">
                                    {meeting.speakers.slice(0, 3).map((s) =>
                                      typeof s === "string" ? s : [s.first_name, s.last_name].filter(Boolean).join(" ") || `Speaker ${s.index}`
                                    ).join(", ")}
                                    {meeting.speakers.length > 3 ? ` +${meeting.speakers.length - 3}` : ""}
                                  </span>
                                )}
                                {actionItems.length > 0 && (
                                  <>
                                    <span className="text-[var(--border)]">&middot;</span>
                                    <span>{actionItems.length} item{actionItems.length !== 1 ? "s" : ""}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Resize handle */}
                    {focusedMeetingId != null && (
                      <div
                        className="hidden md:flex items-stretch flex-shrink-0 cursor-col-resize group"
                        onMouseDown={handleResizeStart}
                      >
                        <div className="w-1 hover:w-1.5 bg-[var(--border)] group-hover:bg-[var(--primary)]/40 group-active:bg-[var(--primary)] transition-colors" />
                      </div>
                    )}

                    {/* Transparent overlay during resize */}
                    {isResizing && (
                      <div className="fixed inset-0 z-50 cursor-col-resize" />
                    )}

                    {/* Right panel: preview pane (desktop only) */}
                    {focusedMeetingId != null ? (
                      <div className="hidden md:flex flex-col flex-1 overflow-hidden bg-[var(--background)]">
                        {focusedMeeting ? (
                          <div className="flex-1 overflow-auto">
                            {/* Header */}
                            <div className="px-5 py-4 border-b border-[var(--border)]">
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <h2 className="text-base font-semibold text-[var(--foreground)] leading-snug">
                                  {focusedMeeting.meeting_title || "Untitled Meeting"}
                                </h2>
                                <button
                                  type="button"
                                  onClick={() => setOpenMeetingId(focusedMeeting.id)}
                                  className="flex-shrink-0 text-xs text-[var(--primary)] hover:underline whitespace-nowrap"
                                >
                                  Open full
                                </button>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                                <span>{formatDate(focusedMeeting.meeting_start_date)}</span>
                                {focusedMeeting.meeting_duration && (
                                  <>
                                    <span className="text-[var(--border)]">&middot;</span>
                                    <span>{formatDuration(focusedMeeting.meeting_duration)}</span>
                                  </>
                                )}
                              </div>
                              {/* Speakers */}
                              {Array.isArray(focusedMeeting.speakers) && focusedMeeting.speakers.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                  {focusedMeeting.speakers.map((speaker, i) => {
                                    const name = typeof speaker === "string"
                                      ? speaker
                                      : [speaker.first_name, speaker.last_name].filter(Boolean).join(" ") || `Speaker ${speaker.index}`;
                                    return (
                                      <span
                                        key={i}
                                        className="text-xs px-2 py-0.5 bg-[var(--secondary)] text-[var(--secondary-foreground)] rounded"
                                      >
                                        {name}
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            {/* Body */}
                            <div className="p-5 space-y-5">
                              {/* Key Points */}
                              {Array.isArray(focusedMeeting.content) && focusedMeeting.content.length > 0 && (
                                <div>
                                  <h3 className="text-sm font-medium text-[var(--foreground)] mb-2">Key Points</h3>
                                  <ul className="space-y-2">
                                    {focusedMeeting.content.map((kp, i) => (
                                      <li key={kp.id || i} className="text-sm text-[var(--muted-foreground)] flex gap-2 leading-snug">
                                        <svg className="w-4 h-4 text-[var(--primary)] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                        <span>{kp.description}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Transcript snippet */}
                              {focusedMeeting.raw_content && (
                                <div>
                                  <h3 className="text-sm font-medium text-[var(--foreground)] mb-2">Transcript</h3>
                                  <p className="text-sm text-[var(--muted-foreground)] whitespace-pre-wrap leading-relaxed">
                                    {focusedMeeting.raw_content.length > 500
                                      ? focusedMeeting.raw_content.slice(0, 500) + "..."
                                      : focusedMeeting.raw_content}
                                  </p>
                                  {focusedMeeting.raw_content.length > 500 && (
                                    <button
                                      type="button"
                                      onClick={() => setOpenMeetingId(focusedMeeting.id)}
                                      className="mt-2 text-xs text-[var(--primary)] hover:underline"
                                    >
                                      View full transcript
                                    </button>
                                  )}
                                </div>
                              )}

                              {/* No content fallback */}
                              {(!focusedMeeting.content || focusedMeeting.content.length === 0) && !focusedMeeting.raw_content && (
                                <p className="text-sm text-[var(--muted-foreground)] italic">No content recorded for this meeting.</p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 flex items-center justify-center text-sm text-[var(--muted-foreground)]">
                            Meeting not found
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="hidden md:flex flex-col flex-1 items-center justify-center text-sm text-[var(--muted-foreground)]">
                        Select a meeting to preview
                      </div>
                    )}
                  </div>
                )
              ) : (
                meetingsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="p-5 bg-[var(--card)] border border-[var(--border)] rounded-lg animate-pulse"
                      >
                        <div className="h-5 bg-[var(--secondary)] rounded w-3/4 mb-3" />
                        <div className="h-3 bg-[var(--secondary)] rounded w-1/2 mb-4" />
                        <div className="space-y-2">
                          <div className="h-3 bg-[var(--secondary)] rounded w-full" />
                          <div className="h-3 bg-[var(--secondary)] rounded w-5/6" />
                          <div className="h-3 bg-[var(--secondary)] rounded w-4/6" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : meetings.length === 0 ? (
                  <div className="text-center py-16">
                    {hasActiveFilters ? (
                      <>
                        <svg
                          className="w-16 h-16 mx-auto text-[var(--muted-foreground)]/30 mb-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                        <h3 className="text-xl font-medium text-[var(--foreground)] mb-2">
                          No Matching Meetings
                        </h3>
                        <p className="text-[var(--muted-foreground)] max-w-md mx-auto mb-4">
                          No meetings match your current filters. Try adjusting or clearing your filters.
                        </p>
                        <button
                          type="button"
                          onClick={clearAll}
                          className="px-4 py-2 text-sm font-medium rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
                        >
                          Clear All Filters
                        </button>
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-16 h-16 mx-auto text-[var(--muted-foreground)]/30 mb-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                        <h3 className="text-xl font-medium text-[var(--foreground)] mb-2">
                          No Meetings Yet
                        </h3>
                        <p className="text-[var(--muted-foreground)] max-w-md mx-auto">
                          Meetings will appear here once Krisp sends webhook data. Use the search bar above to query your meeting transcripts.
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {meetings.map((meeting) => {
                      const actionItems = getActionItems(meeting);
                      return (
                        <div
                          key={meeting.id}
                          onClick={() => setOpenMeetingId(meeting.id)}
                          className="group relative p-5 bg-[var(--card)] border border-[var(--border)] rounded-lg hover:border-[var(--muted-foreground)] transition-colors flex flex-col cursor-pointer"
                        >
                          {/* Delete confirmation overlay */}
                          {confirmingDeleteId === meeting.id && (
                            <div
                              className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-lg bg-[var(--card)]/95 backdrop-blur-sm border border-[var(--destructive)]/30"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <p className="text-sm font-medium text-[var(--foreground)]">Delete this meeting?</p>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteConfirm(e, meeting.id)}
                                  disabled={deletingId === meeting.id}
                                  className="px-4 py-1.5 text-sm font-medium rounded-md bg-[var(--destructive)] text-white hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
                                >
                                  {deletingId === meeting.id ? (
                                    <>
                                      <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                      </svg>
                                      Deleting...
                                    </>
                                  ) : (
                                    "Delete"
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={handleDeleteCancel}
                                  disabled={deletingId === meeting.id}
                                  className="px-4 py-1.5 text-sm font-medium rounded-md border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteClick(e, meeting.id)}
                            className="absolute top-3 right-3 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-[var(--destructive)]/10 text-[var(--muted-foreground)] hover:text-[var(--destructive)] transition-all"
                            title="Delete meeting"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>

                          {/* Title */}
                          <h3 className="font-medium text-[var(--foreground)] leading-snug line-clamp-2 pr-8">
                            {meeting.meeting_title || "Untitled Meeting"}
                          </h3>

                          {/* Date & Duration */}
                          <div className="flex items-center gap-2 mt-2 text-xs text-[var(--muted-foreground)]">
                            <span>{formatDateShort(meeting.meeting_start_date)}</span>
                            {meeting.meeting_duration && (
                              <>
                                <span className="text-[var(--border)]">|</span>
                                <span>{formatDuration(meeting.meeting_duration)}</span>
                              </>
                            )}
                          </div>

                          {/* Action Items / Key Points */}
                          {actionItems.length > 0 ? (
                            <ul className="mt-3 space-y-1.5 flex-1">
                              {actionItems.slice(0, 4).map((item, i) => (
                                <li
                                  key={i}
                                  className="text-sm text-[var(--muted-foreground)] flex gap-2 leading-snug"
                                >
                                  <svg
                                    className="w-4 h-4 text-[var(--primary)] flex-shrink-0 mt-0.5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 5l7 7-7 7"
                                    />
                                  </svg>
                                  <span className="line-clamp-2">{item}</span>
                                </li>
                              ))}
                              {actionItems.length > 4 && (
                                <li className="text-xs text-[var(--muted-foreground)] pl-6">
                                  +{actionItems.length - 4} more
                                </li>
                              )}
                            </ul>
                          ) : (
                            <p className="mt-3 text-sm text-[var(--muted-foreground)]/60 italic flex-1">
                              No action items recorded
                            </p>
                          )}

                          {/* Speakers */}
                          {Array.isArray(meeting.speakers) && meeting.speakers.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-[var(--border)] flex flex-wrap gap-1.5">
                              {meeting.speakers.slice(0, 3).map((speaker, i) => {
                                const name = typeof speaker === "string"
                                  ? speaker
                                  : [speaker.first_name, speaker.last_name].filter(Boolean).join(" ") || `Speaker ${speaker.index}`;
                                return (
                                  <span
                                    key={i}
                                    className="text-xs px-2 py-0.5 bg-[var(--secondary)] text-[var(--secondary-foreground)] rounded"
                                  >
                                    {name}
                                  </span>
                                );
                              })}
                              {meeting.speakers.length > 3 && (
                                <span className="text-xs px-2 py-0.5 text-[var(--muted-foreground)]">
                                  +{meeting.speakers.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </div>
          </div>
        </main>
      ) : (
        <main
          id="panel-analytics"
          role="tabpanel"
          aria-labelledby="tab-analytics"
          className="flex-1 overflow-auto px-6 py-8"
        >
          <AnalyticsDashboard />
        </main>
      )}

      <MeetingDetailDrawer
        meetingId={openMeetingId}
        onClose={() => setOpenMeetingId(null)}
      />
    </div>
  );
}

export default function KrispPage() {
  return (
    <Suspense fallback={
      <div className="flex h-full flex-col bg-[var(--background)]">
        <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md">
          <div className="flex items-center px-6 py-4">
            <div>
              <h1 className="text-2xl font-bold text-[var(--foreground)]">Meetings</h1>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">
                Recorded meetings with transcripts and action items
              </p>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto px-6 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-5 bg-[var(--card)] border border-[var(--border)] rounded-lg animate-pulse">
                  <div className="h-5 bg-[var(--secondary)] rounded w-3/4 mb-3" />
                  <div className="h-3 bg-[var(--secondary)] rounded w-1/2 mb-4" />
                  <div className="space-y-2">
                    <div className="h-3 bg-[var(--secondary)] rounded w-full" />
                    <div className="h-3 bg-[var(--secondary)] rounded w-5/6" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    }>
      <KrispPageInner />
    </Suspense>
  );
}
