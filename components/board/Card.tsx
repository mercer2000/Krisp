"use client";

import { useState } from "react";
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

interface CardProps {
  card: CardType;
  onClick: () => void;
  onDelete?: (cardId: string) => void;
}

export function Card({ card, onClick, onDelete }: CardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`group relative cursor-grab rounded-lg border bg-white shadow-sm transition-all active:cursor-grabbing dark:bg-slate-800 ${
        isDragging
          ? "opacity-50 shadow-lg ring-2 ring-[var(--primary)] border-[var(--primary)]"
          : "border-transparent hover:border-blue-500 hover:shadow-md"
      }`}
    >
      {/* Quick delete button (top-right, visible on hover) */}
      {onDelete && (
        confirmDelete ? (
          <div
            className="absolute top-1 right-1 z-10 flex items-center gap-1 rounded-md bg-red-50 dark:bg-red-900/40 px-1.5 py-0.5 shadow-sm border border-red-200 dark:border-red-800"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-[10px] text-red-600 dark:text-red-400 font-medium whitespace-nowrap">Delete?</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(card.id);
              }}
              className="rounded px-1 py-0.5 text-[10px] font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              Yes
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setConfirmDelete(false);
              }}
              className="rounded px-1 py-0.5 text-[10px] font-medium bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 transition-colors"
            >
              No
            </button>
          </div>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setConfirmDelete(true);
            }}
            className="absolute top-1 right-1 z-10 hidden group-hover:flex items-center justify-center h-6 w-6 rounded-md bg-white/90 dark:bg-slate-700/90 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 shadow-sm border border-slate-200 dark:border-slate-600 transition-colors"
            title="Delete card"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        )
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

            {/* Comment count icon */}
            <span className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
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
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              0
            </span>
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
      </div>
    </div>
  );
}
