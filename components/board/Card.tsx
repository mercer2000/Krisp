"use client";

import { useState, useRef, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Card as CardType } from "@/types";

// ---------------------------------------------------------------------------
// Priority configuration
// ---------------------------------------------------------------------------

const PRIORITY_CONFIG: Record<
  CardType["priority"],
  { label: string; color: string; bg: string }
> = {
  low: { label: "Low", color: "#22c55e", bg: "bg-green-100 dark:bg-green-900/30" },
  medium: { label: "Medium", color: "#3b82f6", bg: "bg-blue-100 dark:bg-blue-900/30" },
  high: { label: "High", color: "#f97316", bg: "bg-orange-100 dark:bg-orange-900/30" },
  urgent: { label: "Urgent", color: "#ef4444", bg: "bg-red-100 dark:bg-red-900/30" },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isOverdue(dueDate: string): boolean {
  const due = new Date(dueDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return due < now;
}

function formatDueDate(dueDate: string): string {
  const date = new Date(dueDate);
  const now = new Date();
  const diffDays = Math.ceil(
    (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays <= 7) return `${diffDays}d left`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Generate a consistent avatar color from a card ID
function avatarColor(id: string): string {
  const colors = ["#6366f1", "#8b5cf6", "#ec4899", "#f97316", "#14b8a6", "#3b82f6"];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

// ---------------------------------------------------------------------------
// Card Component
// ---------------------------------------------------------------------------

interface ColumnOption {
  id: string;
  title: string;
}

interface CardProps {
  card: CardType;
  onClick: () => void;
  onDelete?: (cardId: string) => void;
  onMove?: (cardId: string, targetColumnId: string) => void;
  onSnooze?: (cardId: string, snoozedUntil: string, returnColumnId: string) => void;
  columns?: ColumnOption[];
  currentColumnId?: string;
  isInSnoozeColumn?: boolean;
  isSelected?: boolean;
  hasSelection?: boolean;
  onSelect?: (cardId: string, e: React.MouseEvent) => void;
}

// Format a snooze countdown
function formatSnoozeRemaining(snoozedUntil: string): string {
  const until = new Date(snoozedUntil);
  const now = new Date();
  const diffMs = until.getTime() - now.getTime();
  if (diffMs <= 0) return "Waking up...";
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m left`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ${diffMins % 60}m left`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ${diffHours % 24}h left`;
}

export function Card({ card, onClick, onDelete, onMove, onSnooze, columns, currentColumnId, isInSnoozeColumn, isSelected, hasSelection, onSelect }: CardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [showSnoozePicker, setShowSnoozePicker] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside this card
  useEffect(() => {
    if (!showMoveMenu && !confirmDelete && !showSnoozePicker) return;
    const handler = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setShowMoveMenu(false);
        setConfirmDelete(false);
        setShowSnoozePicker(false);
      }
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [showMoveMenu, confirmDelete, showSnoozePicker]);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: {
      type: "card",
      card,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityInfo = PRIORITY_CONFIG[card.priority];
  const overdue = card.dueDate ? isOverdue(card.dueDate) : false;
  const tags = card.tags ?? [];
  const visibleTags = tags.slice(0, 3);
  const extraTagCount = tags.length - 3;
  const hasMeetingTag = tags.some((t) => t.label.toLowerCase() === "meeting");
  const checklistItems = card.checklist ?? [];
  const checklistTotal = checklistItems.length;
  const checklistDone = checklistItems.filter((i) => i.done).length;

  const handleClick = (e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      e.stopPropagation();
      onSelect?.(card.id, e);
      return;
    }
    onClick();
  };

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        (cardRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className={`group relative cursor-grab rounded-lg border bg-white shadow-sm transition-all active:cursor-grabbing dark:bg-slate-800 ${
        isDragging
          ? "opacity-50 shadow-lg ring-2 ring-[var(--primary)] border-[var(--primary)]"
          : isSelected
            ? "border-blue-500 ring-2 ring-blue-400 shadow-md bg-blue-50/50 dark:bg-blue-900/20"
            : card.isBigThree
              ? "border-amber-300 ring-2 ring-amber-400 hover:shadow-md"
              : "border-transparent hover:border-blue-500 hover:shadow-md"
      }`}
    >
      {/* Selection checkbox (visible on hover or when any card is selected) */}
      {onSelect && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(card.id, e);
          }}
          className={`absolute top-1 left-1 z-10 flex items-center justify-center h-5 w-5 rounded border transition-all ${
            isSelected
              ? "bg-blue-500 border-blue-500 text-white"
              : hasSelection
                ? "bg-white/90 dark:bg-slate-700/90 border-slate-300 dark:border-slate-500 text-transparent hover:border-blue-400"
                : "bg-white/90 dark:bg-slate-700/90 border-slate-300 dark:border-slate-500 text-transparent hidden group-hover:flex hover:border-blue-400"
          }`}
          title={isSelected ? "Deselect card" : "Select card"}
        >
          {isSelected && (
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </button>
      )}

      {/* Big 3 star badge */}
      {card.isBigThree && (
        <span
          className="absolute top-1 right-1 z-[5] flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400"
          title="Big 3 priority"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </span>
      )}


      {/* Move column picker dropdown */}
      {showMoveMenu && columns && (
        <div
          className="absolute top-1 right-1 z-20 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg py-1 min-w-[140px]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-2 py-1 text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
            Move to
          </div>
          {columns
            .filter((col) => col.id !== currentColumnId)
            .map((col) => (
              <button
                key={col.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onMove?.(card.id, col.id);
                  setShowMoveMenu(false);
                }}
                className="flex w-full items-center gap-2 px-2 py-1.5 text-xs text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6" />
                </svg>
                {col.title}
              </button>
            ))}
          {columns.filter((col) => col.id !== currentColumnId).length === 0 && (
            <div className="px-2 py-1.5 text-xs text-[var(--muted-foreground)]">No other columns</div>
          )}
          <div className="border-t border-slate-200 dark:border-slate-700 mt-1 pt-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMoveMenu(false);
              }}
              className="flex w-full items-center gap-2 px-2 py-1.5 text-xs text-[var(--muted-foreground)] hover:bg-[var(--accent)] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Snooze duration picker dropdown */}
      {showSnoozePicker && (
        <div
          className="absolute top-1 right-1 z-20 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg py-1 min-w-[160px]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-2 py-1 text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
            Snooze for
          </div>
          {[
            { label: "1 hour", hours: 1 },
            { label: "4 hours", hours: 4 },
            { label: "1 day", hours: 24 },
            { label: "3 days", hours: 72 },
            { label: "1 week", hours: 168 },
            { label: "2 weeks", hours: 336 },
          ].map((opt) => (
            <button
              key={opt.label}
              onClick={(e) => {
                e.stopPropagation();
                const until = new Date(Date.now() + opt.hours * 60 * 60 * 1000).toISOString();
                onSnooze?.(card.id, until, currentColumnId ?? "");
                setShowSnoozePicker(false);
              }}
              className="flex w-full items-center gap-2 px-2 py-1.5 text-xs text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {opt.label}
            </button>
          ))}
          <div className="border-t border-slate-200 dark:border-slate-700 mt-1 pt-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowSnoozePicker(false);
              }}
              className="flex w-full items-center gap-2 px-2 py-1.5 text-xs text-[var(--muted-foreground)] hover:bg-[var(--accent)] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Tag strip at top of card (colored pills) */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 px-3 pt-2.5 pb-0">
          {visibleTags.map((tag) => (
            <span
              key={tag.id}
              className="inline-block h-1.5 w-8 rounded-full"
              style={{ backgroundColor: tag.color }}
              title={tag.label}
            />
          ))}
          {extraTagCount > 0 && (
            <span
              className="inline-block h-1.5 w-4 rounded-full bg-slate-300 dark:bg-slate-600"
              title={`+${extraTagCount} more`}
            />
          )}
        </div>
      )}

      {/* Color label top border */}
      {card.colorLabel && tags.length === 0 && (
        <div
          className="h-1 rounded-t-lg"
          style={{ backgroundColor: card.colorLabel }}
        />
      )}

      {/* Card content */}
      <div className="p-3">
        {/* Title */}
        <h4 className="text-sm font-medium text-[var(--card-foreground)] line-clamp-2">
          {card.title}
        </h4>

        {/* Description preview */}
        {card.description && (
          <p className="mt-1 text-xs text-[var(--muted-foreground)] line-clamp-2 leading-relaxed">
            {card.description}
          </p>
        )}

        {/* Checklist items preview */}
        {checklistTotal > 0 && (
          <div className="mt-2 space-y-0.5">
            {checklistItems.slice(0, 3).map((item) => (
              <div key={item.id} className="flex items-center gap-1.5">
                <div
                  className={`h-3 w-3 shrink-0 rounded-sm border flex items-center justify-center ${
                    item.done
                      ? "bg-green-500 border-green-500"
                      : "border-slate-300 dark:border-slate-600"
                  }`}
                >
                  {item.done && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <span
                  className={`text-xs truncate ${
                    item.done
                      ? "line-through text-[var(--muted-foreground)]"
                      : "text-[var(--card-foreground)]"
                  }`}
                >
                  {item.title}
                </span>
              </div>
            ))}
            {checklistTotal > 3 && (
              <span className="text-xs text-[var(--muted-foreground)] pl-[18px]">
                +{checklistTotal - 3} more
              </span>
            )}
          </div>
        )}

        {/* Meta row */}
        <div className="mt-2 flex items-center gap-2">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
            {/* Priority badge */}
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${priorityInfo.bg}`}
              style={{ color: priorityInfo.color }}
            >
              {priorityInfo.label}
            </span>

            {/* Due date */}
            {card.dueDate && (
              <span
                className={`inline-flex items-center gap-1 text-xs ${
                  overdue
                    ? "font-medium text-[var(--destructive)]"
                    : "text-[var(--muted-foreground)]"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {formatDueDate(card.dueDate)}
              </span>
            )}

            {/* Checklist completion badge */}
            {checklistTotal > 0 && (
              <span
                className={`inline-flex items-center gap-1 text-xs font-medium ${
                  checklistDone === checklistTotal
                    ? "text-green-500"
                    : "text-[var(--muted-foreground)]"
                }`}
                title={`${checklistDone}/${checklistTotal} checklist items done`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                </svg>
                {checklistDone}/{checklistTotal}
              </span>
            )}

            {/* Meeting source indicator */}
            {hasMeetingTag && (
              <span
                className="inline-flex items-center gap-1 text-xs text-indigo-500"
                title="From meeting"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </span>
            )}

            {/* Snooze countdown */}
            {card.snoozedUntil && (
              <span
                className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400"
                title={`Snoozed until ${new Date(card.snoozedUntil).toLocaleString()}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {formatSnoozeRemaining(card.snoozedUntil)}
              </span>
            )}
          </div>

          {/* Assignee avatar placeholder */}
          <div
            className="h-6 w-6 shrink-0 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
            style={{ backgroundColor: avatarColor(card.id) }}
            title="Unassigned"
          >
            {card.title.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Tag labels (text) */}
        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1">
            {visibleTags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: `${tag.color}20`,
                  color: tag.color,
                }}
              >
                {tag.label}
              </span>
            ))}
            {extraTagCount > 0 && (
              <span className="text-xs text-[var(--muted-foreground)]">
                +{extraTagCount} more
              </span>
            )}
          </div>
        )}

        {/* Action buttons — always visible for touch accessibility */}
        {(onMove || onDelete) && (
          <div className="mt-2 flex items-center gap-1 border-t border-slate-100 dark:border-slate-700/50 pt-2">
            {onMove && columns && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMoveMenu(!showMoveMenu);
                  setConfirmDelete(false);
                }}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)] transition-colors"
                title="Move to column"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 9l4-4 4 4" />
                  <path d="M9 5v12" />
                  <path d="M19 15l-4 4-4-4" />
                  <path d="M15 19V7" />
                </svg>
                Move
              </button>
            )}
            {onSnooze && !isInSnoozeColumn && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSnoozePicker(!showSnoozePicker);
                  setShowMoveMenu(false);
                  setConfirmDelete(false);
                }}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[var(--muted-foreground)] hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-600 transition-colors"
                title="Snooze card"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Snooze
              </button>
            )}
            {onDelete && !confirmDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDelete(true);
                  setShowMoveMenu(false);
                }}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[var(--muted-foreground)] hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors"
                title="Delete card"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
                Delete
              </button>
            )}
            {onDelete && confirmDelete && (
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <span className="text-xs text-red-600 dark:text-red-400 font-medium">Delete?</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(card.id);
                  }}
                  className="rounded-md px-2 py-1 text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  Yes
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDelete(false);
                  }}
                  className="rounded-md px-2 py-1 text-xs text-[var(--muted-foreground)] hover:bg-[var(--accent)] transition-colors"
                >
                  No
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
