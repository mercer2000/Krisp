"use client";

import { useState, useRef, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";
import { Card } from "./Card";
import { useCreateCard } from "@/lib/hooks/useCards";
import { useUpdateColumn, useDeleteColumn } from "@/lib/hooks/useColumns";
import type { ColumnWithCards, Card as CardType } from "@/types";

// ---------------------------------------------------------------------------
// Status-based accent colors for column top border
// ---------------------------------------------------------------------------

const STATUS_ACCENT: Record<string, string> = {
  "to do": "bg-blue-500",
  "todo": "bg-blue-500",
  "in progress": "bg-yellow-500",
  "blocked": "bg-red-500",
  "done": "bg-green-500",
  "complete": "bg-green-500",
  "completed": "bg-green-500",
  "draft": "bg-purple-500",
  "snooze": "bg-amber-500",
  "snoozed": "bg-amber-500",
};

function getAccentClass(title: string): string {
  return STATUS_ACCENT[title.toLowerCase()] ?? "bg-slate-400";
}

// ---------------------------------------------------------------------------
// Column Component
// ---------------------------------------------------------------------------

interface ColumnOption {
  id: string;
  title: string;
}

// Check if a column title indicates it's a snooze column
export function isSnoozeColumn(title: string): boolean {
  const t = title.toLowerCase().trim();
  return t === "snooze" || t === "snoozed";
}

interface ColumnProps {
  column: ColumnWithCards;
  boardId: string;
  onCardClick: (card: CardType) => void;
  onDeleteCard?: (cardId: string) => void;
  onMoveCard?: (cardId: string, targetColumnId: string) => void;
  onSnoozeCard?: (cardId: string, snoozedUntil: string, returnColumnId: string) => void;
  allColumns?: ColumnOption[];
  isOver?: boolean;
  selectedCardIds?: Set<string>;
  onSelectCard?: (cardId: string, e: React.MouseEvent) => void;
}

export function Column({ column, boardId, onCardClick, onDeleteCard, onMoveCard, onSnoozeCard, allColumns, isOver, selectedCardIds, onSelectCard }: ColumnProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(column.title);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const cardInputRef = useRef<HTMLInputElement>(null);

  const createCard = useCreateCard(boardId);
  const updateColumn = useUpdateColumn(boardId);
  const deleteColumn = useDeleteColumn(boardId);

  // Sortable for the column itself (drag by header)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: {
      type: "column",
      column,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Card IDs for sortable context
  const cardIds = column.cards
    .filter((c) => !c.archived)
    .sort((a, b) => a.position - b.position)
    .map((c) => c.id);

  // Focus title input when editing
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  // Focus card input when adding
  useEffect(() => {
    if (isAddingCard && cardInputRef.current) {
      cardInputRef.current.focus();
    }
  }, [isAddingCard]);

  // -- Title editing --
  const handleSaveTitle = () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== column.title) {
      updateColumn.mutate({ id: column.id, title: trimmed });
    } else {
      setEditTitle(column.title);
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveTitle();
    }
    if (e.key === "Escape") {
      setEditTitle(column.title);
      setIsEditingTitle(false);
    }
  };

  // -- Add card --
  const handleAddCard = () => {
    const trimmed = newCardTitle.trim();
    if (!trimmed) return;

    createCard.mutate(
      { columnId: column.id, title: trimmed },
      {
        onSuccess: () => {
          setNewCardTitle("");
          setIsAddingCard(false);
        },
      }
    );
  };

  const handleCardKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddCard();
    }
    if (e.key === "Escape") {
      setNewCardTitle("");
      setIsAddingCard(false);
    }
  };

  // -- Delete column --
  const handleDelete = () => {
    if (
      window.confirm(
        `Delete column "${column.title}" and all its cards? This cannot be undone.`
      )
    ) {
      deleteColumn.mutate(column.id);
    }
  };

  const activeCards = column.cards
    .filter((c) => !c.archived)
    .sort((a, b) => a.position - b.position);

  const accentClass = getAccentClass(column.title);
  const isSnoozed = isSnoozeColumn(column.title);

  // Collapsed state — show minimal icon-width column
  if (isCollapsed) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="flex w-10 shrink-0 flex-col items-center rounded-xl bg-slate-100 dark:bg-slate-800/50"
      >
        {/* Accent top border */}
        <div className={`h-1 w-full rounded-t-xl ${accentClass}`} />

        <button
          onClick={() => setIsCollapsed(false)}
          className="mt-2 p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          title={`Expand ${column.title}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>

        {/* Vertical column title */}
        <span
          className="mt-2 text-xs font-semibold text-[var(--muted-foreground)]"
          style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
        >
          {column.title}
        </span>

        {/* Card count */}
        <span className="mt-2 rounded-full bg-[var(--muted)] px-1.5 py-0.5 text-xs font-medium text-[var(--muted-foreground)]">
          {activeCards.length}
        </span>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex w-80 min-w-[320px] shrink-0 flex-col min-h-0 rounded-xl bg-slate-100 dark:bg-slate-800/50 transition-all ${
        isDragging ? "opacity-50 ring-2 ring-[var(--primary)]" : ""
      } ${isOver ? "ring-2 ring-blue-400" : ""}`}
    >
      {/* Colored accent top border */}
      <div className={`h-1 w-full rounded-t-xl ${accentClass} ${isOver ? "animate-pulse" : ""}`} />

      {/* Column Header */}
      <div className="flex items-center gap-1.5 px-3 py-2.5">
        {/* Drag handle (visible on hover) */}
        <div
          {...attributes}
          {...listeners}
          className="shrink-0 cursor-grab rounded p-0.5 text-transparent transition-colors group-hover:text-[var(--muted-foreground)] hover:!text-[var(--foreground)] hover:bg-[var(--accent)] active:cursor-grabbing"
          style={{ cursor: "grab" }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <circle cx="9" cy="5" r="1.5" />
            <circle cx="15" cy="5" r="1.5" />
            <circle cx="9" cy="12" r="1.5" />
            <circle cx="15" cy="12" r="1.5" />
            <circle cx="9" cy="19" r="1.5" />
            <circle cx="15" cy="19" r="1.5" />
          </svg>
        </div>

        {/* Color indicator or snooze clock icon */}
        {isSnoozed ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 text-amber-500"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        ) : column.color ? (
          <div
            className="h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: column.color }}
          />
        ) : null}

        {/* Title */}
        {isEditingTitle ? (
          <input
            ref={titleInputRef}
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={handleTitleKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="min-w-0 flex-1 rounded border border-[var(--input)] bg-[var(--background)] px-2 py-0.5 text-sm font-semibold text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditingTitle(true);
            }}
            className="min-w-0 flex-1 truncate rounded px-1 py-0.5 text-left text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--accent)]"
          >
            {column.title}
          </button>
        )}

        {/* Card count */}
        <span className="shrink-0 rounded-full bg-[var(--muted)] px-2 py-0.5 text-xs font-medium text-[var(--muted-foreground)]">
          {activeCards.length}
        </span>

        {/* Collapse button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsCollapsed(true);
          }}
          className="shrink-0 rounded-md p-1 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
          aria-label={`Collapse column ${column.title}`}
          title="Collapse column"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>

        {/* Delete button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDelete();
          }}
          className="shrink-0 rounded-md p-1 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--destructive)]/10 hover:text-[var(--destructive)]"
          aria-label={`Delete column ${column.title}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>
        </button>
      </div>

      {/* Add card at TOP (below header) */}
      <div className="px-2 pb-1">
        {isAddingCard ? (
          <div className="space-y-2">
            <input
              ref={cardInputRef}
              type="text"
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={handleCardKeyDown}
              placeholder="Card title..."
              className="w-full rounded-lg border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none focus:ring-2 focus:ring-[var(--ring)] transition-shadow"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddCard}
                disabled={!newCardTitle.trim() || createCard.isPending}
                className="rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-[var(--primary-foreground)] transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createCard.isPending ? "Adding..." : "Add"}
              </button>
              <button
                onClick={() => {
                  setNewCardTitle("");
                  setIsAddingCard(false);
                }}
                className="rounded-lg px-3 py-1.5 text-xs text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingCard(true)}
            className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
            Add a card
          </button>
        )}
      </div>

      {/* Cards area */}
      <div className="flex min-h-[60px] flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {activeCards.map((card) => (
            <Card
              key={card.id}
              card={card}
              onClick={() => onCardClick(card)}
              onDelete={onDeleteCard}
              onMove={onMoveCard}
              onSnooze={onSnoozeCard}
              columns={allColumns}
              currentColumnId={column.id}
              isInSnoozeColumn={isSnoozed}
              isSelected={selectedCardIds?.has(card.id)}
              hasSelection={(selectedCardIds?.size ?? 0) > 0}
              onSelect={onSelectCard}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
