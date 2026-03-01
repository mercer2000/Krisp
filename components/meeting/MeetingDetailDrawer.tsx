"use client";

import React, { useEffect, useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import type { ActionItem } from "@/types";

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
  text: string;
}

function parseTranscript(
  rawContent: string,
  speakers: (string | Speaker)[]
): TranscriptSegment[] {
  // Build a map of speaker names for matching
  const speakerNames: string[] = speakers.map((s) => {
    if (typeof s === "string") return s;
    return [s.first_name, s.last_name].filter(Boolean).join(" ") || `Speaker ${s.index}`;
  });

  // Try to parse speaker-prefixed lines like "John Smith: Hello everyone"
  // or "Speaker 1: Hello everyone"
  const segments: TranscriptSegment[] = [];

  // Build regex to match speaker prefixes
  // Match patterns like "Name:", "Speaker N:", or just timestamps with speakers
  const speakerPattern = speakerNames.length > 0
    ? new RegExp(
        `^(${speakerNames.map(n => escapeRegex(n)).join("|")}|Speaker\\s*\\d+)\\s*:\\s*`,
        "im"
      )
    : /^(Speaker\s*\d+)\s*:\s*/im;

  const lines = rawContent.split("\n");
  let currentSpeaker = "";
  let currentIndex = -1;
  let currentText: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const match = trimmed.match(speakerPattern);
    if (match) {
      // Save previous segment
      if (currentText.length > 0 && currentSpeaker) {
        segments.push({
          speaker: currentSpeaker,
          speakerIndex: currentIndex,
          text: currentText.join(" "),
        });
      }

      currentSpeaker = match[1].trim();
      currentIndex = speakerNames.findIndex(
        (n) => n.toLowerCase() === currentSpeaker.toLowerCase()
      );
      if (currentIndex === -1) {
        // Try matching "Speaker N" pattern
        const num = currentSpeaker.match(/Speaker\s*(\d+)/i);
        currentIndex = num ? parseInt(num[1], 10) : segments.length;
      }
      currentText = [trimmed.slice(match[0].length).trim()].filter(Boolean);
    } else {
      // Continuation of current speaker's text
      if (currentSpeaker) {
        currentText.push(trimmed);
      } else {
        // No speaker detected yet — treat as first speaker
        currentSpeaker = speakerNames[0] || "Speaker";
        currentIndex = 0;
        currentText.push(trimmed);
      }
    }
  }

  // Push final segment
  if (currentText.length > 0 && currentSpeaker) {
    segments.push({
      speaker: currentSpeaker,
      speakerIndex: currentIndex,
      text: currentText.join(" "),
    });
  }

  // If parsing produced no segments (unstructured transcript), return as single block
  if (segments.length === 0 && rawContent.trim()) {
    return [
      {
        speaker: speakerNames[0] || "Transcript",
        speakerIndex: 0,
        text: rawContent.trim(),
      },
    ];
  }

  return segments;
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
  const [activeTab, setActiveTab] = useState<"transcript" | "key-points" | "action-items">("transcript");

  // Action items state
  const [meetingActionItems, setMeetingActionItems] = useState<ActionItem[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  useEffect(() => {
    if (!meetingId) {
      setMeeting(null);
      setMeetingActionItems([]);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`/api/meetings/${meetingId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch meeting");
        return res.json();
      })
      .then((data) => setMeeting(data.meeting))
      .catch(() => setError("Failed to load meeting details"))
      .finally(() => setLoading(false));

    // Fetch action items for this meeting
    fetch(`/api/action-items?meetingId=${meetingId}`)
      .then((res) => res.ok ? res.json() : Promise.reject())
      .then((data) => setMeetingActionItems(data.actionItems ?? []))
      .catch(() => setMeetingActionItems([]));
  }, [meetingId]);

  const handleExtract = async () => {
    if (!meetingId) return;
    setExtracting(true);
    setExtractError(null);

    try {
      const res = await fetch("/api/action-items/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Extraction failed");
      }

      const data = await res.json();
      setMeetingActionItems((prev) => [...prev, ...(data.actionItems ?? [])]);
      setActiveTab("action-items");
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : "Failed to extract action items");
    } finally {
      setExtracting(false);
    }
  };

  const speakerNames = meeting?.speakers?.map(getSpeakerName) ?? [];

  // Build speaker → color index map
  const speakerColorMap = new Map<string, number>();
  speakerNames.forEach((name, i) => {
    speakerColorMap.set(name.toLowerCase(), i % SPEAKER_COLORS.length);
  });

  const segments = meeting?.raw_content
    ? parseTranscript(meeting.raw_content, meeting.speakers ?? [])
    : [];

  const keyPoints = meeting?.content?.filter(
    (item): item is KeyPointContent => "description" in item
  ) ?? [];

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
            {speakerNames.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {speakerNames.map((name, i) => {
                  const color = SPEAKER_COLORS[i % SPEAKER_COLORS.length];
                  return (
                    <span
                      key={i}
                      className="text-xs px-2.5 py-1 rounded-full font-medium"
                      style={{
                        backgroundColor: color.bg,
                        border: `1px solid ${color.border}`,
                        color: color.name,
                      }}
                    >
                      {name}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Extract Action Items button */}
            <button
              onClick={handleExtract}
              disabled={extracting}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {extracting ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Extracting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  Extract Action Items
                </>
              )}
            </button>
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
              onClick={() => setActiveTab("key-points")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "key-points"
                  ? "border-[var(--primary)] text-[var(--foreground)]"
                  : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              Key Points{keyPoints.length > 0 ? ` (${keyPoints.length})` : ""}
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
          </div>

          {/* Tab content */}
          {activeTab === "transcript" ? (
            <div className="space-y-1">
              {segments.length > 0 ? (
                segments.map((seg, i) => {
                  const colorIdx = speakerColorMap.get(seg.speaker.toLowerCase()) ?? (seg.speakerIndex % SPEAKER_COLORS.length);
                  const color = SPEAKER_COLORS[colorIdx >= 0 ? colorIdx : 0];
                  return (
                    <div
                      key={i}
                      className="rounded-lg px-3 py-2"
                      style={{ backgroundColor: color.bg, borderLeft: `3px solid ${color.border}` }}
                    >
                      <span
                        className="text-xs font-semibold block mb-0.5"
                        style={{ color: color.name }}
                      >
                        {seg.speaker}
                      </span>
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
          ) : activeTab === "key-points" ? (
            <div className="space-y-2">
              {keyPoints.length > 0 ? (
                keyPoints.map((kp, i) => (
                  <div
                    key={kp.id || i}
                    className="flex gap-3 p-3 rounded-lg bg-[var(--secondary)]/50"
                  >
                    <span className="text-[var(--primary)] font-medium text-sm mt-0.5 flex-shrink-0">
                      {i + 1}.
                    </span>
                    <p className="text-sm text-[var(--foreground)] leading-relaxed">
                      {kp.description}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[var(--muted-foreground)] italic py-4 text-center">
                  No key points recorded for this meeting
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {meetingActionItems.length > 0 ? (
                meetingActionItems.map((item) => (
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
                    <div className="flex gap-3 text-xs text-[var(--muted-foreground)]">
                      {item.assignee && <span>Assigned: {item.assignee}</span>}
                      {item.dueDate && <span>Due: {item.dueDate}</span>}
                      {item.priority && <span>Priority: {item.priority}</span>}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-[var(--muted-foreground)] italic mb-3">
                    No action items extracted yet
                  </p>
                  <button
                    onClick={handleExtract}
                    disabled={extracting}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    Extract Action Items
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : null}
    </Drawer>
  );
}
