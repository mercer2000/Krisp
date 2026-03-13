"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import type { ActionItem, Board, Column } from "@/types";
import type { MeetingAnalytics } from "@/types/analytics";

// ---------------------------------------------------------------------------
// AI-generated card preview type
// ---------------------------------------------------------------------------

interface GeneratedCard {
  actionItemId: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  dueDate: string | null;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface KeyPointContent {
  id: string;
  description: string;
}

interface Speaker {
  index: number;
  first_name?: string;
  last_name?: string;
}

interface MeetingDetail {
  id: number;
  meeting_id: string;
  meeting_title: string | null;
  meeting_start_date: string | null;
  meeting_end_date: string | null;
  meeting_duration: number | null;
  speakers: (string | Speaker)[];
  participants: string[];
  content: KeyPointContent[];
  raw_content: string | null;
  event_type: string | null;
}

interface MeetingDetailDrawerProps {
  meetingId: number | null;
  onClose: () => void;
}

// Distinct colors for speakers (hue-shifted for good contrast in both themes)
const SPEAKER_COLORS = [
  { bg: "rgba(59, 130, 246, 0.12)", border: "rgba(59, 130, 246, 0.3)", text: "rgb(96, 165, 250)", name: "rgb(59, 130, 246)" },   // blue
  { bg: "rgba(16, 185, 129, 0.12)", border: "rgba(16, 185, 129, 0.3)", text: "rgb(52, 211, 153)", name: "rgb(16, 185, 129)" },   // emerald
  { bg: "rgba(245, 158, 11, 0.12)", border: "rgba(245, 158, 11, 0.3)", text: "rgb(251, 191, 36)", name: "rgb(245, 158, 11)" },   // amber
  { bg: "rgba(168, 85, 247, 0.12)", border: "rgba(168, 85, 247, 0.3)", text: "rgb(192, 132, 252)", name: "rgb(168, 85, 247)" },  // purple
  { bg: "rgba(239, 68, 68, 0.12)", border: "rgba(239, 68, 68, 0.3)", text: "rgb(248, 113, 113)", name: "rgb(239, 68, 68)" },     // red
  { bg: "rgba(236, 72, 153, 0.12)", border: "rgba(236, 72, 153, 0.3)", text: "rgb(244, 114, 182)", name: "rgb(236, 72, 153)" },  // pink
  { bg: "rgba(6, 182, 212, 0.12)", border: "rgba(6, 182, 212, 0.3)", text: "rgb(34, 211, 238)", name: "rgb(6, 182, 212)" },      // cyan
  { bg: "rgba(132, 204, 22, 0.12)", border: "rgba(132, 204, 22, 0.3)", text: "rgb(163, 230, 53)", name: "rgb(132, 204, 22)" },   // lime
];

// ---------------------------------------------------------------------------
// Transcript parser: splits raw_content into speaker-attributed segments
// ---------------------------------------------------------------------------

interface TranscriptSegment {
  speaker: string;
  speakerIndex: number;
  timestamp: string | null;
  text: string;
}

function parseTranscript(
  rawContent: string,
  speakers: (string | Speaker)[]
): TranscriptSegment[] {
  const speakerNames: string[] = speakers.map((s) => {
    if (typeof s === "string") return s;
    return [s.first_name, s.last_name].filter(Boolean).join(" ") || `Speaker ${s.index}`;
  });

  // Build a regex that matches inline speaker turns in Krisp format:
  //   "Speaker Name | MM:SS text" or "Speaker Name | HH:MM:SS text"
  // Also supports colon-separated format: "Speaker Name: text"
  const allNames = [
    ...speakerNames.map((n) => escapeRegex(n)),
    "Speaker\\s*\\d+",
  ];
  const nameAlternation = allNames.join("|");

  // Krisp pipe+timestamp format: "Name | 00:13 text"
  const pipePattern = new RegExp(
    `(${nameAlternation})\\s*\\|\\s*(\\d{1,2}:\\d{2}(?::\\d{2})?)\\s*`,
    "gi"
  );

  // Colon-separated format: "Name: text" (line-based)
  const colonPattern = speakerNames.length > 0
    ? new RegExp(
        `^(${nameAlternation})\\s*:\\s*`,
        "im"
      )
    : /^(Speaker\s*\d+)\s*:\s*/im;

  const rawSegments: TranscriptSegment[] = [];

  // First try pipe+timestamp parsing (Krisp's native format)
  const pipeMatches = [...rawContent.matchAll(pipePattern)];

  if (pipeMatches.length > 0) {
    for (let i = 0; i < pipeMatches.length; i++) {
      const match = pipeMatches[i];
      const speaker = match[1].trim();
      const timestamp = match[2];
      const startIdx = match.index! + match[0].length;
      const endIdx = i + 1 < pipeMatches.length ? pipeMatches[i + 1].index! : rawContent.length;
      const text = rawContent.slice(startIdx, endIdx).trim();

      const speakerIdx = findSpeakerIndex(speaker, speakerNames);

      if (text) {
        rawSegments.push({
          speaker,
          speakerIndex: speakerIdx,
          timestamp,
          text,
        });
      }
    }
  } else {
    // Fallback: colon-separated line-based parsing
    const lines = rawContent.split("\n");
    let currentSpeaker = "";
    let currentIndex = -1;
    let currentText: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const match = trimmed.match(colonPattern);
      if (match) {
        if (currentText.length > 0 && currentSpeaker) {
          rawSegments.push({
            speaker: currentSpeaker,
            speakerIndex: currentIndex,
            timestamp: null,
            text: currentText.join(" "),
          });
        }
        currentSpeaker = match[1].trim();
        currentIndex = findSpeakerIndex(currentSpeaker, speakerNames);
        currentText = [trimmed.slice(match[0].length).trim()].filter(Boolean);
      } else {
        if (currentSpeaker) {
          currentText.push(trimmed);
        } else {
          currentSpeaker = speakerNames[0] || "Speaker";
          currentIndex = 0;
          currentText.push(trimmed);
        }
      }
    }

    if (currentText.length > 0 && currentSpeaker) {
      rawSegments.push({
        speaker: currentSpeaker,
        speakerIndex: currentIndex,
        timestamp: null,
        text: currentText.join(" "),
      });
    }
  }

  // Merge consecutive segments from the same speaker
  const merged: TranscriptSegment[] = [];
  for (const seg of rawSegments) {
    const prev = merged[merged.length - 1];
    if (prev && prev.speaker.toLowerCase() === seg.speaker.toLowerCase()) {
      prev.text += " " + seg.text;
    } else {
      merged.push({ ...seg });
    }
  }

  // Fallback: if no segments parsed, return single block
  if (merged.length === 0 && rawContent.trim()) {
    return [
      {
        speaker: speakerNames[0] || "Transcript",
        speakerIndex: 0,
        timestamp: null,
        text: rawContent.trim(),
      },
    ];
  }

  return merged;
}

function findSpeakerIndex(speaker: string, speakerNames: string[]): number {
  const idx = speakerNames.findIndex(
    (n) => n.toLowerCase() === speaker.toLowerCase()
  );
  if (idx !== -1) return idx;
  const num = speaker.match(/Speaker\s*(\d+)/i);
  return num ? parseInt(num[1], 10) : 0;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getSpeakerName(speaker: string | Speaker): string {
  if (typeof speaker === "string") return speaker;
  return [speaker.first_name, speaker.last_name].filter(Boolean).join(" ") || `Speaker ${speaker.index}`;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "Unknown date";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(seconds: number | null) {
  if (!seconds) return "";
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}h ${remainingMins}m`;
}

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-500/15 text-blue-600",
  in_progress: "bg-amber-500/15 text-amber-600",
  completed: "bg-green-500/15 text-green-600",
  cancelled: "bg-gray-500/15 text-gray-500",
};

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MeetingDetailDrawer({ meetingId, onClose }: MeetingDetailDrawerProps) {
  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"transcript" | "action-items" | "analytics">("transcript");
  const [hasAutoSwitchedTab, setHasAutoSwitchedTab] = useState(false);

  // Per-meeting analytics state
  const [meetingAnalytics, setMeetingAnalytics] = useState<MeetingAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Action items state
  const [meetingActionItems, setMeetingActionItems] = useState<ActionItem[]>([]);
  const [actionItemsLoading, setActionItemsLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  // Board selection state
  const [boardsList, setBoardsList] = useState<Board[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [defaultBoardId, setDefaultBoardId] = useState<string | null>(null);

  // AI card generation state
  const [generatingCards, setGeneratingCards] = useState(false);
  const [generatedCards, setGeneratedCards] = useState<GeneratedCard[]>([]);
  const [showCardPreview, setShowCardPreview] = useState(false);
  const [cardGenError, setCardGenError] = useState<string | null>(null);
  const [creatingCards, setCreatingCards] = useState(false);
  const [boardColumns, setBoardColumns] = useState<Column[]>([]);
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);

  // Speaker filter state for transcript view
  const [filteredSpeaker, setFilteredSpeaker] = useState<string | null>(null);

  // Copy transcript state
  const [copied, setCopied] = useState(false);

  const handleCopyTranscript = useCallback(async () => {
    if (!meeting?.raw_content) return;
    try {
      await navigator.clipboard.writeText(meeting.raw_content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = meeting.raw_content;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [meeting?.raw_content]);

  // Load boards list and default board setting
  useEffect(() => {
    fetch("/api/v1/boards")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: Board[]) => setBoardsList(data))
      .catch(() => setBoardsList([]));

    fetch("/api/settings/default-board")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        setDefaultBoardId(data.defaultBoardId);
        setSelectedBoardId(data.defaultBoardId);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!meetingId) {
      setMeeting(null);
      setMeetingActionItems([]);
      setMeetingAnalytics(null);
      setActiveTab("transcript");
      setFilteredSpeaker(null);
      return;
    }

    setLoading(true);
    setError(null);
    setActiveTab("transcript");

    fetch(`/api/meetings/${meetingId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch meeting");
        return res.json();
      })
      .then((data) => setMeeting(data.meeting))
      .catch(() => setError("Failed to load meeting details"))
      .finally(() => setLoading(false));

    // Fetch per-meeting analytics
    setAnalyticsLoading(true);
    fetch(`/api/meetings/${meetingId}/analytics`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setMeetingAnalytics(data))
      .catch(() => setMeetingAnalytics(null))
      .finally(() => setAnalyticsLoading(false));

    // Fetch action items for this meeting
    setActionItemsLoading(true);
    setHasAutoSwitchedTab(false);
    fetch(`/api/action-items?meetingId=${meetingId}`)
      .then((res) => res.ok ? res.json() : Promise.reject())
      .then((data) => {
        const items: ActionItem[] = data.actionItems ?? [];
        setMeetingActionItems(items);
        // Auto-switch to action items tab if there are auto-extracted items
        if (items.length > 0 && items.some(i => i.extractionSource === "auto_webhook")) {
          setActiveTab("action-items");
          setHasAutoSwitchedTab(true);
        }
      })
      .catch(() => setMeetingActionItems([]))
      .finally(() => setActionItemsLoading(false));
  }, [meetingId]);

  const handleExtract = async (force = false) => {
    if (!meetingId) return;
    setExtracting(true);
    setExtractError(null);

    try {
      const res = await fetch("/api/action-items/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingId,
          boardId: selectedBoardId || undefined,
          force,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Extraction failed");
      }

      const data = await res.json();
      setMeetingActionItems(data.actionItems ?? []);
      setActiveTab("action-items");
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : "Failed to extract action items");
    } finally {
      setExtracting(false);
    }
  };

  const handleSetDefaultBoard = async (boardId: string | null) => {
    setSelectedBoardId(boardId);
    setDefaultBoardId(boardId);
    try {
      await fetch("/api/settings/default-board", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boardId }),
      });
    } catch {
      // silently fail — the local state is still updated
    }
  };

  // Fetch columns when a board is selected for card generation preview
  useEffect(() => {
    if (!selectedBoardId) {
      setBoardColumns([]);
      setSelectedColumnId(null);
      return;
    }
    fetch(`/api/v1/boards/${selectedBoardId}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        const cols: Column[] = data.columns ?? [];
        setBoardColumns(cols);
        if (cols.length > 0) setSelectedColumnId(cols[0].id);
      })
      .catch(() => {
        setBoardColumns([]);
        setSelectedColumnId(null);
      });
  }, [selectedBoardId]);

  const handleGenerateCards = async () => {
    if (!meetingId) return;
    setGeneratingCards(true);
    setCardGenError(null);

    try {
      const res = await fetch("/api/action-items/generate-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Generation failed");
      }

      const data = await res.json();
      const cards: GeneratedCard[] = data.cards ?? [];
      if (cards.length === 0) {
        setCardGenError("No unlinked action items to generate cards from");
        return;
      }
      setGeneratedCards(cards);
      setShowCardPreview(true);
    } catch (err) {
      setCardGenError(err instanceof Error ? err.message : "Failed to generate cards");
    } finally {
      setGeneratingCards(false);
    }
  };

  const handleBulkCreateCards = async () => {
    if (!selectedBoardId || !selectedColumnId || generatedCards.length === 0) return;
    setCreatingCards(true);
    setCardGenError(null);

    try {
      const res = await fetch("/api/action-items/bulk-create-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cards: generatedCards,
          boardId: selectedBoardId,
          columnId: selectedColumnId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Creation failed");
      }

      // Refresh action items to show linked status
      const aiRes = await fetch(`/api/action-items?meetingId=${meetingId}`);
      if (aiRes.ok) {
        const aiData = await aiRes.json();
        setMeetingActionItems(aiData.actionItems ?? []);
      }

      setShowCardPreview(false);
      setGeneratedCards([]);
    } catch (err) {
      setCardGenError(err instanceof Error ? err.message : "Failed to create cards");
    } finally {
      setCreatingCards(false);
    }
  };

  const handleUpdateGeneratedCard = (index: number, updates: Partial<GeneratedCard>) => {
    setGeneratedCards((prev) =>
      prev.map((card, i) => (i === index ? { ...card, ...updates } : card))
    );
  };

  const handleRemoveGeneratedCard = (index: number) => {
    setGeneratedCards((prev) => prev.filter((_, i) => i !== index));
  };

  const unlinkedCount = meetingActionItems.filter((i) => !i.cardId && !i.deletedAt).length;

  const speakerNames = meeting?.speakers?.map(getSpeakerName) ?? [];

  // Build speaker → color index map
  const speakerColorMap = useMemo(() => {
    const map = new Map<string, number>();
    speakerNames.forEach((name, i) => {
      map.set(name.toLowerCase(), i % SPEAKER_COLORS.length);
    });
    return map;
  }, [speakerNames.join(",")]);

  const segments = useMemo(
    () =>
      meeting?.raw_content
        ? parseTranscript(meeting.raw_content, meeting.speakers ?? [])
        : [],
    [meeting?.raw_content, meeting?.speakers]
  );

  // Collect unique speakers from segments (includes any speakers found during parsing
  // that might not be in the speakers metadata array)
  const allSpeakers = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    // Start with metadata speakers
    for (const name of speakerNames) {
      if (!seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        result.push(name);
      }
    }
    // Add any speakers found only in transcript
    for (const seg of segments) {
      if (!seen.has(seg.speaker.toLowerCase())) {
        seen.add(seg.speaker.toLowerCase());
        result.push(seg.speaker);
        speakerColorMap.set(seg.speaker.toLowerCase(), result.length - 1);
      }
    }
    return result;
  }, [speakerNames, segments, speakerColorMap]);

  return (
    <Drawer
      open={meetingId !== null}
      onClose={onClose}
      title={meeting?.meeting_title || "Meeting Details"}
      width="max-w-2xl"
    >
      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-4 bg-[var(--secondary)] rounded w-3/4" />
          <div className="h-3 bg-[var(--secondary)] rounded w-1/2" />
          <div className="h-3 bg-[var(--secondary)] rounded w-2/3" />
          <div className="mt-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-[var(--secondary)] rounded" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="p-4 bg-[var(--destructive)]/10 border border-[var(--destructive)]/20 rounded-lg text-[var(--destructive)]">
          {error}
        </div>
      ) : meeting ? (
        <div className="space-y-5">
          {/* Meeting metadata */}
          <div className="space-y-2">
            <p className="text-sm text-[var(--muted-foreground)]">
              {formatDate(meeting.meeting_start_date)}
              {meeting.meeting_duration ? ` \u00B7 ${formatDuration(meeting.meeting_duration)}` : ""}
            </p>

            {/* Speaker legend */}
            {allSpeakers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {allSpeakers.map((name, i) => {
                  const colorIdx = speakerColorMap.get(name.toLowerCase()) ?? (i % SPEAKER_COLORS.length);
                  const color = SPEAKER_COLORS[colorIdx];
                  const isActive = filteredSpeaker === null || filteredSpeaker === name.toLowerCase();
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() =>
                        setFilteredSpeaker((prev) =>
                          prev === name.toLowerCase() ? null : name.toLowerCase()
                        )
                      }
                      className="text-xs px-2.5 py-1 rounded-full font-medium transition-opacity cursor-pointer"
                      style={{
                        backgroundColor: color.bg,
                        border: `1px solid ${color.border}`,
                        color: color.name,
                        opacity: isActive ? 1 : 0.35,
                      }}
                      title={
                        filteredSpeaker === name.toLowerCase()
                          ? "Show all speakers"
                          : `Filter to ${name}`
                      }
                    >
                      {name}
                    </button>
                  );
                })}
                {filteredSpeaker !== null && (
                  <button
                    type="button"
                    onClick={() => setFilteredSpeaker(null)}
                    className="text-xs px-2 py-1 rounded-full font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--border)] transition-colors"
                  >
                    Show all
                  </button>
                )}
              </div>
            )}

            {/* Auto-extraction badge */}
            {meetingActionItems.length > 0 && meetingActionItems.some(i => i.extractionSource === "auto_webhook") && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
                <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-green-700">
                  {meetingActionItems.filter(i => i.extractionSource === "auto_webhook").length} action item{meetingActionItems.filter(i => i.extractionSource === "auto_webhook").length !== 1 ? "s" : ""} auto-extracted
                  {meetingActionItems.some(i => i.cardId) && (
                    <> &middot; {meetingActionItems.filter(i => i.cardId).length} added to Kanban</>
                  )}
                </span>
              </div>
            )}

            {/* Board selector */}
            {boardsList.length > 0 && meetingActionItems.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
                  </svg>
                  <select
                    value={selectedBoardId || ""}
                    onChange={(e) => setSelectedBoardId(e.target.value || null)}
                    className="text-sm px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]"
                  >
                    <option value="">No board</option>
                    {boardsList.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.title}
                      </option>
                    ))}
                  </select>
                  {selectedBoardId && selectedBoardId !== defaultBoardId && (
                    <button
                      onClick={() => handleSetDefaultBoard(selectedBoardId)}
                      className="text-xs text-[var(--primary)] hover:underline whitespace-nowrap"
                      title="Set as default board for action items"
                    >
                      Set default
                    </button>
                  )}
                  {selectedBoardId && selectedBoardId === defaultBoardId && (
                    <span className="text-xs text-[var(--muted-foreground)] whitespace-nowrap">
                      (default)
                    </span>
                  )}
                </div>

                {!selectedBoardId && !meetingActionItems.some(i => i.cardId) && (
                  <span className="text-xs text-amber-600">
                    Select a board to create Kanban cards
                  </span>
                )}
              </div>
            )}
            {extractError && (
              <p className="text-sm text-[var(--destructive)]">{extractError}</p>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-[var(--border)]">
            <button
              type="button"
              onClick={() => setActiveTab("transcript")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "transcript"
                  ? "border-[var(--primary)] text-[var(--foreground)]"
                  : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              Transcript
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("action-items")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "action-items"
                  ? "border-[var(--primary)] text-[var(--foreground)]"
                  : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              Action Items{meetingActionItems.length > 0 ? ` (${meetingActionItems.length})` : ""}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("analytics")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "analytics"
                  ? "border-[var(--primary)] text-[var(--foreground)]"
                  : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              Analytics
            </button>
          </div>

          {/* Tab content */}
          {activeTab === "transcript" ? (
            <div className="space-y-2.5">
              {segments.length > 0 && meeting?.raw_content && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleCopyTranscript}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors"
                  >
                    {copied ? (
                      <>
                        <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Copied
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy transcript
                      </>
                    )}
                  </button>
                </div>
              )}
              {segments.length > 0 ? (
                segments.map((seg, i) => {
                  const colorIdx = speakerColorMap.get(seg.speaker.toLowerCase()) ?? (seg.speakerIndex % SPEAKER_COLORS.length);
                  const color = SPEAKER_COLORS[colorIdx >= 0 ? colorIdx : 0];
                  const isDimmed = filteredSpeaker !== null && filteredSpeaker !== seg.speaker.toLowerCase();
                  return (
                    <div
                      key={i}
                      className="rounded-lg px-3.5 py-2.5 transition-opacity duration-200"
                      style={{
                        backgroundColor: color.bg,
                        borderLeft: `3px solid ${color.border}`,
                        opacity: isDimmed ? 0.25 : 1,
                      }}
                    >
                      <div className="flex items-baseline gap-2 mb-1">
                        <span
                          className="text-xs font-semibold"
                          style={{ color: color.name }}
                        >
                          {seg.speaker}
                        </span>
                        {seg.timestamp && (
                          <span className="text-[10px] text-[var(--muted-foreground)] font-mono">
                            {seg.timestamp}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[var(--foreground)] leading-relaxed">
                        {seg.text}
                      </p>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-[var(--muted-foreground)] italic py-4 text-center">
                  No transcript available for this meeting
                </p>
              )}
            </div>
          ) : activeTab === "analytics" ? (
            <div className="space-y-4">
              {analyticsLoading ? (
                <div className="space-y-4 animate-pulse py-2">
                  <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-4 bg-[var(--secondary)]/50 rounded-lg">
                        <div className="h-4 bg-[var(--secondary)] rounded w-1/2 mb-2" />
                        <div className="h-6 bg-[var(--secondary)] rounded w-3/4" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : meetingAnalytics ? (
                <>
                  {/* Sentiment */}
                  <div className="p-4 bg-[var(--card)] border border-[var(--border)] rounded-lg">
                    <h4 className="text-xs font-medium text-[var(--muted-foreground)] mb-3">Sentiment Breakdown</h4>
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <span className={`text-lg font-bold ${
                          meetingAnalytics.sentiment.overall > 0.15
                            ? "text-emerald-500"
                            : meetingAnalytics.sentiment.overall < -0.15
                              ? "text-red-500"
                              : "text-[var(--muted-foreground)]"
                        }`}>
                          {meetingAnalytics.sentiment.overall > 0.15
                            ? "Positive"
                            : meetingAnalytics.sentiment.overall < -0.15
                              ? "Negative"
                              : "Neutral"}
                        </span>
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                          <span className="text-xs text-[var(--muted-foreground)] w-16">Positive</span>
                          <div className="flex-1 h-2 rounded-full bg-[var(--secondary)]">
                            <div className="h-2 rounded-full bg-emerald-500 transition-all" style={{ width: `${Math.round(meetingAnalytics.sentiment.positive * 100)}%` }} />
                          </div>
                          <span className="text-xs text-[var(--foreground)] w-10 text-right">{Math.round(meetingAnalytics.sentiment.positive * 100)}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-slate-400 flex-shrink-0" />
                          <span className="text-xs text-[var(--muted-foreground)] w-16">Neutral</span>
                          <div className="flex-1 h-2 rounded-full bg-[var(--secondary)]">
                            <div className="h-2 rounded-full bg-slate-400 transition-all" style={{ width: `${Math.round(meetingAnalytics.sentiment.neutral * 100)}%` }} />
                          </div>
                          <span className="text-xs text-[var(--foreground)] w-10 text-right">{Math.round(meetingAnalytics.sentiment.neutral * 100)}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                          <span className="text-xs text-[var(--muted-foreground)] w-16">Negative</span>
                          <div className="flex-1 h-2 rounded-full bg-[var(--secondary)]">
                            <div className="h-2 rounded-full bg-red-500 transition-all" style={{ width: `${Math.round(meetingAnalytics.sentiment.negative * 100)}%` }} />
                          </div>
                          <span className="text-xs text-[var(--foreground)] w-10 text-right">{Math.round(meetingAnalytics.sentiment.negative * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Talk-Time Distribution */}
                  <div className="p-4 bg-[var(--card)] border border-[var(--border)] rounded-lg">
                    <h4 className="text-xs font-medium text-[var(--muted-foreground)] mb-3">Talk-Time Distribution</h4>
                    {meetingAnalytics.talkTime.length > 0 ? (
                      <div className="space-y-2">
                        {meetingAnalytics.talkTime.map((s, i) => {
                          const barColors = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];
                          return (
                            <div key={s.speaker} className="flex items-center gap-3">
                              <div className="w-24 text-xs text-[var(--foreground)] truncate" title={s.speaker}>
                                {s.speaker}
                              </div>
                              <div className="flex-1 h-2 rounded-full bg-[var(--secondary)]">
                                <div
                                  className="h-2 rounded-full transition-all"
                                  style={{ width: `${s.percentage}%`, backgroundColor: barColors[i % barColors.length] }}
                                />
                              </div>
                              <div className="w-20 text-xs text-[var(--muted-foreground)] text-right">
                                {s.percentage}% ({s.wordCount})
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-[var(--muted-foreground)]">No speaker data</p>
                    )}
                  </div>

                  {/* Engagement Score */}
                  <div className="p-4 bg-[var(--card)] border border-[var(--border)] rounded-lg">
                    <h4 className="text-xs font-medium text-[var(--muted-foreground)] mb-3">Engagement Score</h4>
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`text-3xl font-bold ${
                        meetingAnalytics.engagement.score >= 70
                          ? "text-emerald-500"
                          : meetingAnalytics.engagement.score >= 40
                            ? "text-amber-500"
                            : "text-red-500"
                      }`}>
                        {meetingAnalytics.engagement.score}
                      </div>
                      <span className="text-sm text-[var(--muted-foreground)]">/ 100</span>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-xs mb-0.5">
                          <span className="text-[var(--muted-foreground)]">Participant Balance</span>
                          <span className="text-[var(--foreground)]">{meetingAnalytics.engagement.factors.participantBalance}</span>
                        </div>
                        <div className="h-2 rounded-full bg-[var(--secondary)]">
                          <div className="h-2 rounded-full bg-indigo-500 transition-all" style={{ width: `${meetingAnalytics.engagement.factors.participantBalance}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-0.5">
                          <span className="text-[var(--muted-foreground)]">Key Points Density</span>
                          <span className="text-[var(--foreground)]">{meetingAnalytics.engagement.factors.keyPointsDensity}</span>
                        </div>
                        <div className="h-2 rounded-full bg-[var(--secondary)]">
                          <div className="h-2 rounded-full bg-amber-500 transition-all" style={{ width: `${meetingAnalytics.engagement.factors.keyPointsDensity}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-0.5">
                          <span className="text-[var(--muted-foreground)]">Duration Score</span>
                          <span className="text-[var(--foreground)]">{meetingAnalytics.engagement.factors.duration}</span>
                        </div>
                        <div className="h-2 rounded-full bg-[var(--secondary)]">
                          <div className="h-2 rounded-full bg-emerald-500 transition-all" style={{ width: `${meetingAnalytics.engagement.factors.duration}%` }} />
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-[var(--muted-foreground)]">
                      {meetingAnalytics.keyPointsCount} key point{meetingAnalytics.keyPointsCount !== 1 ? "s" : ""} &middot; {meetingAnalytics.participantCount} participant{meetingAnalytics.participantCount !== 1 ? "s" : ""}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-[var(--muted-foreground)]">
                    No analytics data available for this meeting
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {actionItemsLoading ? (
                <div className="space-y-3 animate-pulse py-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-3 rounded-lg bg-[var(--secondary)]/50 space-y-2">
                      <div className="h-4 bg-[var(--secondary)] rounded w-3/4" />
                      <div className="h-3 bg-[var(--secondary)] rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : meetingActionItems.length > 0 ? (
                <>
                  {meetingActionItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg bg-[var(--secondary)]/50 space-y-1"
                    >
                      <div className="flex items-center gap-2">
                        <h4 className={`text-sm font-medium text-[var(--foreground)] ${item.status === "completed" ? "line-through opacity-60" : ""}`}>
                          {item.title}
                        </h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[item.status] || ""}`}>
                          {STATUS_LABELS[item.status] || item.status}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-xs text-[var(--muted-foreground)] line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      <div className="flex gap-3 text-xs text-[var(--muted-foreground)] flex-wrap">
                        {item.assignee && <span>Assigned: {item.assignee}</span>}
                        {item.dueDate && <span>Due: {item.dueDate}</span>}
                        {item.priority && <span>Priority: {item.priority}</span>}
                        {item.extractionSource === "auto_webhook" && (
                          <span className="text-green-600">Auto-extracted</span>
                        )}
                        {item.cardId && (
                          <span className="inline-flex items-center gap-1 text-[var(--primary)]">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
                            </svg>
                            On Kanban
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Generate Kanban Cards button */}
                  {unlinkedCount > 0 && (
                    <div className="pt-3 border-t border-[var(--border)]">
                      <button
                        onClick={handleGenerateCards}
                        disabled={generatingCards || !selectedBoardId}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50 transition-opacity"
                        data-testid="generate-kanban-cards-btn"
                      >
                        {generatingCards ? (
                          <>
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Generating cards...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Generate Kanban Cards ({unlinkedCount} item{unlinkedCount !== 1 ? "s" : ""})
                          </>
                        )}
                      </button>
                      {!selectedBoardId && (
                        <p className="text-xs text-amber-600 mt-1.5 text-center">
                          Select a board above to generate cards
                        </p>
                      )}
                      {cardGenError && (
                        <p className="text-xs text-[var(--destructive)] mt-1.5 text-center">{cardGenError}</p>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-6">
                  <svg className="w-10 h-10 mx-auto text-[var(--muted-foreground)]/40 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-sm text-[var(--muted-foreground)] mb-1">
                    No action items found
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)] mb-3">
                    Action items are extracted automatically when meetings arrive.
                  </p>
                  <button
                    onClick={() => handleExtract(false)}
                    disabled={extracting}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors disabled:opacity-50"
                  >
                    {extracting ? (
                      <>
                        <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Extracting...
                      </>
                    ) : (
                      "Re-extract manually"
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : null}

      {/* Card Preview Modal */}
      {showCardPreview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowCardPreview(false)}
          />
          <div className="relative bg-[var(--background)] border border-[var(--border)] rounded-xl shadow-2xl w-full max-w-xl max-h-[80vh] flex flex-col mx-4" data-testid="card-preview-modal">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] flex-shrink-0">
              <div>
                <h3 className="text-base font-semibold text-[var(--foreground)]">
                  Review Generated Cards
                </h3>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  {generatedCards.length} card{generatedCards.length !== 1 ? "s" : ""} will be created
                </p>
              </div>
              <button
                onClick={() => setShowCardPreview(false)}
                className="p-1.5 rounded-lg hover:bg-[var(--secondary)] text-[var(--muted-foreground)] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Board + Column selector */}
            <div className="px-5 py-3 border-b border-[var(--border)] flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-xs font-medium text-[var(--muted-foreground)] block mb-1">Board</label>
                  <select
                    value={selectedBoardId || ""}
                    onChange={(e) => setSelectedBoardId(e.target.value || null)}
                    className="w-full text-sm px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]"
                  >
                    <option value="">Select board</option>
                    {boardsList.map((b) => (
                      <option key={b.id} value={b.id}>{b.title}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium text-[var(--muted-foreground)] block mb-1">Column</label>
                  <select
                    value={selectedColumnId || ""}
                    onChange={(e) => setSelectedColumnId(e.target.value || null)}
                    className="w-full text-sm px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]"
                    disabled={boardColumns.length === 0}
                  >
                    {boardColumns.length === 0 ? (
                      <option value="">No columns</option>
                    ) : (
                      boardColumns.map((col) => (
                        <option key={col.id} value={col.id}>{col.title}</option>
                      ))
                    )}
                  </select>
                </div>
              </div>
            </div>

            {/* Card list */}
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
              {generatedCards.map((card, i) => (
                <div
                  key={card.actionItemId}
                  className="p-3 rounded-lg border border-[var(--border)] bg-[var(--secondary)]/30 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <input
                      type="text"
                      value={card.title}
                      onChange={(e) =>
                        handleUpdateGeneratedCard(i, { title: e.target.value })
                      }
                      className="flex-1 text-sm font-medium bg-transparent text-[var(--foreground)] border-b border-transparent hover:border-[var(--border)] focus:border-[var(--primary)] focus:outline-none px-0 py-0.5"
                    />
                    <button
                      onClick={() => handleRemoveGeneratedCard(i)}
                      className="p-1 rounded hover:bg-[var(--destructive)]/10 text-[var(--muted-foreground)] hover:text-[var(--destructive)] transition-colors flex-shrink-0"
                      title="Remove card"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <textarea
                    value={card.description}
                    onChange={(e) =>
                      handleUpdateGeneratedCard(i, { description: e.target.value })
                    }
                    rows={2}
                    className="w-full text-xs bg-transparent text-[var(--muted-foreground)] border border-transparent hover:border-[var(--border)] focus:border-[var(--primary)] focus:outline-none rounded px-1.5 py-1 resize-none"
                  />
                  <div className="flex items-center gap-3">
                    <select
                      value={card.priority}
                      onChange={(e) =>
                        handleUpdateGeneratedCard(i, {
                          priority: e.target.value as GeneratedCard["priority"],
                        })
                      }
                      className="text-xs px-2 py-1 rounded border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                    <input
                      type="date"
                      value={card.dueDate || ""}
                      onChange={(e) =>
                        handleUpdateGeneratedCard(i, {
                          dueDate: e.target.value || null,
                        })
                      }
                      className="text-xs px-2 py-1 rounded border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]"
                    />
                  </div>
                </div>
              ))}
              {generatedCards.length === 0 && (
                <p className="text-sm text-[var(--muted-foreground)] text-center py-4">
                  All cards have been removed
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-[var(--border)] flex items-center justify-between flex-shrink-0">
              <button
                onClick={() => setShowCardPreview(false)}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors"
              >
                Cancel
              </button>
              {cardGenError && (
                <p className="text-xs text-[var(--destructive)]">{cardGenError}</p>
              )}
              <button
                onClick={handleBulkCreateCards}
                disabled={creatingCards || generatedCards.length === 0 || !selectedBoardId || !selectedColumnId}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50 transition-opacity"
                data-testid="confirm-create-cards-btn"
              >
                {creatingCards ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creating...
                  </>
                ) : (
                  <>Create {generatedCards.length} Card{generatedCards.length !== 1 ? "s" : ""}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
}
