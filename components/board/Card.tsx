"use client";

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

// ---------------------------------------------------------------------------
// Card Component
// ---------------------------------------------------------------------------

interface CardProps {
  card: CardType;
  onClick: () => void;
}

export function Card({ card, onClick }: CardProps) {
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
      className={`group relative cursor-grab rounded-lg border border-[var(--border)] bg-white shadow-sm transition-all hover:shadow-md active:cursor-grabbing dark:bg-slate-800 ${
        isDragging ? "opacity-50 shadow-lg ring-2 ring-[var(--primary)]" : ""
      }`}
    >
      {/* Color label top border */}
      {card.colorLabel && (
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
        <div className="mt-2 flex flex-wrap items-center gap-2">
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
              {/* Calendar icon */}
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
        </div>

        {/* Tags */}
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
