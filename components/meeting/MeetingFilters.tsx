"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { MeetingFilterState } from "@/lib/hooks/useMeetingFilters";

// ── Types ─────────────────────────────────────────────────
interface MeetingFiltersProps {
  filters: MeetingFilterState;
  onFiltersChange: (updates: Partial<MeetingFilterState>) => void;
  onRemoveFilter: (key: string) => void;
  onClearAll: () => void;
  hasActiveFilters: boolean;
  totalCount: number;
  filteredCount: number;
  availableParticipants: string[];
}

interface DurationPreset {
  label: string;
  min: number | null;
  max: number | null;
}

const DATE_PRESETS = [
  { label: "Today", days: 0 },
  { label: "Last 7 Days", days: 7 },
  { label: "Last 30 Days", days: 30 },
  { label: "This Month", days: -1 }, // special
  { label: "Custom Range", days: -2 }, // special
] as const;

const DURATION_PRESETS: DurationPreset[] = [
  { label: "Under 15 min", min: null, max: 900 },
  { label: "15–30 min", min: 900, max: 1800 },
  { label: "30–60 min", min: 1800, max: 3600 },
  { label: "Over 1 hour", min: 3600, max: null },
];

const ACTION_ITEM_STATUSES = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

// ── Helper ───────────────────────────────────────────────
function getDatePresetDates(preset: (typeof DATE_PRESETS)[number]): {
  from: string;
  to: string;
} {
  const today = new Date();
  const to = today.toISOString().slice(0, 10);

  if (preset.days === 0) {
    return { from: to, to };
  }
  if (preset.days === -1) {
    // This month
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return { from: firstOfMonth.toISOString().slice(0, 10), to };
  }
  const from = new Date(today);
  from.setDate(from.getDate() - preset.days);
  return { from: from.toISOString().slice(0, 10), to };
}

function getActiveDurationLabel(
  min: string | null,
  max: string | null
): string | null {
  const minNum = min ? Number(min) : null;
  const maxNum = max ? Number(max) : null;
  const match = DURATION_PRESETS.find(
    (p) => p.min === minNum && p.max === maxNum
  );
  return match?.label ?? (min || max ? "Custom Duration" : null);
}

// ── Component ────────────────────────────────────────────
export function MeetingFilters({
  filters,
  onFiltersChange,
  onRemoveFilter,
  onClearAll,
  hasActiveFilters,
  totalCount,
  filteredCount,
  availableParticipants,
}: MeetingFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDateCustom, setShowDateCustom] = useState(false);
  const [participantSearch, setParticipantSearch] = useState("");
  const [showParticipantDropdown, setShowParticipantDropdown] = useState(false);
  const participantRef = useRef<HTMLDivElement>(null);
  const keywordInputRef = useRef<HTMLInputElement>(null);
  const [keywordDraft, setKeywordDraft] = useState(filters.keyword ?? "");

  // Sync keyword draft when URL changes externally
  useEffect(() => {
    setKeywordDraft(filters.keyword ?? "");
  }, [filters.keyword]);

  // Close participant dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (
        participantRef.current &&
        !participantRef.current.contains(e.target as Node)
      ) {
        setShowParticipantDropdown(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredParticipants = availableParticipants.filter(
    (p) =>
      p.toLowerCase().includes(participantSearch.toLowerCase()) &&
      !filters.participants.includes(p)
  );

  const handleKeywordSubmit = useCallback(() => {
    if (keywordDraft.trim()) {
      onFiltersChange({ keyword: keywordDraft.trim() });
    } else {
      onRemoveFilter("keyword");
    }
  }, [keywordDraft, onFiltersChange, onRemoveFilter]);

  // ── Active Filter Chips ─────────────────────────────────
  const activeChips: { key: string; label: string }[] = [];

  if (filters.dateFrom || filters.dateTo) {
    const from = filters.dateFrom ?? "...";
    const to = filters.dateTo ?? "...";
    activeChips.push({ key: "date", label: `Date: ${from} to ${to}` });
  }
  const durationLabel = getActiveDurationLabel(
    filters.durationMin,
    filters.durationMax
  );
  if (durationLabel) {
    activeChips.push({ key: "duration", label: `Duration: ${durationLabel}` });
  }
  if (filters.participants.length > 0) {
    activeChips.push({
      key: "participants",
      label: `Participants: ${filters.participants.join(", ")}`,
    });
  }
  if (filters.hasActionItems !== null) {
    activeChips.push({
      key: "hasActionItems",
      label: filters.hasActionItems
        ? "Has Action Items"
        : "No Action Items",
    });
  }
  if (filters.actionItemStatus) {
    const s = ACTION_ITEM_STATUSES.find(
      (x) => x.value === filters.actionItemStatus
    );
    activeChips.push({
      key: "actionItemStatus",
      label: `Action Items: ${s?.label ?? filters.actionItemStatus}`,
    });
  }
  if (filters.hasTranscript !== null) {
    activeChips.push({
      key: "hasTranscript",
      label: filters.hasTranscript ? "Has Transcript" : "No Transcript",
    });
  }
  if (filters.keyword) {
    activeChips.push({
      key: "keyword",
      label: `Keyword: "${filters.keyword}"`,
    });
  }

  const handleRemoveChip = (chipKey: string) => {
    if (chipKey === "date") {
      onFiltersChange({ dateFrom: null, dateTo: null } as Partial<MeetingFilterState>);
    } else if (chipKey === "duration") {
      onFiltersChange({ durationMin: null, durationMax: null } as Partial<MeetingFilterState>);
    } else {
      onRemoveFilter(chipKey);
    }
  };

  return (
    <div className="mb-6">
      {/* Toggle & Result Count */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
          aria-expanded={isExpanded}
          aria-controls="meeting-filter-panel"
        >
          <svg
            className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          Filters
          {hasActiveFilters && (
            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-[var(--primary)] text-[var(--primary-foreground)]">
              {activeChips.length}
            </span>
          )}
        </button>

        <span className="text-sm text-[var(--muted-foreground)]">
          {hasActiveFilters
            ? `Showing ${filteredCount} of ${totalCount} meetings`
            : `${totalCount} meetings`}
        </span>
      </div>

      {/* Active Filter Chips */}
      {activeChips.length > 0 && (
        <div
          className="flex flex-wrap items-center gap-2 mb-3"
          role="list"
          aria-label="Active filters"
        >
          {activeChips.map((chip) => (
            <span
              key={chip.key}
              role="listitem"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20"
            >
              {chip.label}
              <button
                type="button"
                onClick={() => handleRemoveChip(chip.key)}
                className="hover:text-[var(--destructive)] transition-colors"
                aria-label={`Remove ${chip.label} filter`}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs text-[var(--muted-foreground)] hover:text-[var(--destructive)] transition-colors underline"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Filter Panel */}
      {isExpanded && (
        <div
          id="meeting-filter-panel"
          className="p-4 bg-[var(--card)] border border-[var(--border)] rounded-lg space-y-4"
          role="region"
          aria-label="Meeting filters"
        >
          {/* Row 1: Keyword Search + Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Keyword Search */}
            <div>
              <label
                htmlFor="filter-keyword"
                className="block text-xs font-medium text-[var(--muted-foreground)] mb-1.5"
              >
                Search by Keyword
              </label>
              <div className="flex gap-2">
                <input
                  ref={keywordInputRef}
                  id="filter-keyword"
                  type="text"
                  value={keywordDraft}
                  onChange={(e) => setKeywordDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleKeywordSubmit();
                  }}
                  placeholder="Title, key points, summary..."
                  className="flex-1 px-3 py-2 text-sm rounded-md border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                />
                <button
                  type="button"
                  onClick={handleKeywordSubmit}
                  className="px-3 py-2 text-sm rounded-md bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:opacity-80 transition-opacity"
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1.5">
                Date Range
              </label>
              <div className="flex flex-wrap gap-1.5">
                {DATE_PRESETS.map((preset) => {
                  if (preset.days === -2) {
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setShowDateCustom(!showDateCustom)}
                        className={`px-2.5 py-1.5 text-xs rounded-md border transition-colors ${
                          showDateCustom
                            ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                            : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--muted-foreground)]"
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  }
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        const { from, to } = getDatePresetDates(preset);
                        onFiltersChange({ dateFrom: from, dateTo: to });
                        setShowDateCustom(false);
                      }}
                      className="px-2.5 py-1.5 text-xs rounded-md border border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--muted-foreground)] transition-colors"
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
              {showDateCustom && (
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="date"
                    aria-label="Start date"
                    value={filters.dateFrom ?? ""}
                    onChange={(e) =>
                      onFiltersChange({ dateFrom: e.target.value || null })
                    }
                    className="px-2 py-1.5 text-xs rounded-md border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                  />
                  <span className="text-xs text-[var(--muted-foreground)]">to</span>
                  <input
                    type="date"
                    aria-label="End date"
                    value={filters.dateTo ?? ""}
                    onChange={(e) =>
                      onFiltersChange({ dateTo: e.target.value || null })
                    }
                    className="px-2 py-1.5 text-xs rounded-md border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Duration + Participants */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Duration */}
            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1.5">
                Duration
              </label>
              <div className="flex flex-wrap gap-1.5">
                {DURATION_PRESETS.map((preset) => {
                  const isActive =
                    (preset.min === null
                      ? !filters.durationMin
                      : filters.durationMin === String(preset.min)) &&
                    (preset.max === null
                      ? !filters.durationMax
                      : filters.durationMax === String(preset.max)) &&
                    (filters.durationMin || filters.durationMax);
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        if (isActive) {
                          onFiltersChange({
                            durationMin: null,
                            durationMax: null,
                          } as Partial<MeetingFilterState>);
                        } else {
                          onFiltersChange({
                            durationMin: preset.min !== null ? String(preset.min) : null,
                            durationMax: preset.max !== null ? String(preset.max) : null,
                          } as Partial<MeetingFilterState>);
                        }
                      }}
                      className={`px-2.5 py-1.5 text-xs rounded-md border transition-colors ${
                        isActive
                          ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                          : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--muted-foreground)]"
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Participants */}
            <div ref={participantRef}>
              <label
                htmlFor="filter-participants"
                className="block text-xs font-medium text-[var(--muted-foreground)] mb-1.5"
              >
                Participants
              </label>
              {/* Selected participants */}
              {filters.participants.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {filters.participants.map((p) => (
                    <span
                      key={p}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-md bg-[var(--secondary)] text-[var(--secondary-foreground)]"
                    >
                      {p}
                      <button
                        type="button"
                        onClick={() =>
                          onFiltersChange({
                            participants: filters.participants.filter(
                              (x) => x !== p
                            ),
                          })
                        }
                        className="hover:text-[var(--destructive)]"
                        aria-label={`Remove ${p}`}
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="relative">
                <input
                  id="filter-participants"
                  type="text"
                  value={participantSearch}
                  onChange={(e) => {
                    setParticipantSearch(e.target.value);
                    setShowParticipantDropdown(true);
                  }}
                  onFocus={() => setShowParticipantDropdown(true)}
                  placeholder="Search participants..."
                  className="w-full px-3 py-2 text-sm rounded-md border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                  role="combobox"
                  aria-expanded={showParticipantDropdown}
                  aria-controls="participant-listbox"
                />
                {showParticipantDropdown && filteredParticipants.length > 0 && (
                  <ul
                    id="participant-listbox"
                    role="listbox"
                    className="absolute z-10 w-full mt-1 max-h-40 overflow-auto rounded-md border border-[var(--border)] bg-[var(--card)] shadow-lg"
                  >
                    {filteredParticipants.slice(0, 20).map((p) => (
                      <li
                        key={p}
                        role="option"
                        aria-selected={false}
                        className="px-3 py-2 text-sm cursor-pointer hover:bg-[var(--secondary)] text-[var(--foreground)]"
                        onClick={() => {
                          onFiltersChange({
                            participants: [...filters.participants, p],
                          });
                          setParticipantSearch("");
                          setShowParticipantDropdown(false);
                        }}
                      >
                        {p}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Row 3: Toggles + Action Item Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Has Action Items */}
            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1.5">
                Action Items
              </label>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    onFiltersChange({
                      hasActionItems:
                        filters.hasActionItems === true ? null : true,
                    })
                  }
                  className={`px-2.5 py-1.5 text-xs rounded-md border transition-colors ${
                    filters.hasActionItems === true
                      ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                      : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--muted-foreground)]"
                  }`}
                >
                  Has Items
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onFiltersChange({
                      hasActionItems:
                        filters.hasActionItems === false ? null : false,
                    })
                  }
                  className={`px-2.5 py-1.5 text-xs rounded-md border transition-colors ${
                    filters.hasActionItems === false
                      ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                      : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--muted-foreground)]"
                  }`}
                >
                  No Items
                </button>
              </div>
            </div>

            {/* Action Item Status */}
            <div>
              <label
                htmlFor="filter-action-status"
                className="block text-xs font-medium text-[var(--muted-foreground)] mb-1.5"
              >
                Action Item Status
              </label>
              <select
                id="filter-action-status"
                value={filters.actionItemStatus ?? ""}
                onChange={(e) =>
                  onFiltersChange({
                    actionItemStatus: e.target.value || null,
                  })
                }
                className="w-full px-3 py-2 text-sm rounded-md border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              >
                <option value="">Any Status</option>
                {ACTION_ITEM_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Has Transcript */}
            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1.5">
                Transcript
              </label>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    onFiltersChange({
                      hasTranscript:
                        filters.hasTranscript === true ? null : true,
                    })
                  }
                  className={`px-2.5 py-1.5 text-xs rounded-md border transition-colors ${
                    filters.hasTranscript === true
                      ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                      : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--muted-foreground)]"
                  }`}
                >
                  Has Transcript
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onFiltersChange({
                      hasTranscript:
                        filters.hasTranscript === false ? null : false,
                    })
                  }
                  className={`px-2.5 py-1.5 text-xs rounded-md border transition-colors ${
                    filters.hasTranscript === false
                      ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                      : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--muted-foreground)]"
                  }`}
                >
                  No Transcript
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
