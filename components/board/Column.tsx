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
// Column Component
// ---------------------------------------------------------------------------

interface ColumnProps {
  column: ColumnWithCards;
  boardId: string;
  onCardClick: (card: CardType) => void;
}

export function Column({ column, boardId, onCardClick }: ColumnProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(column.title);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState("");
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex w-72 shrink-0 flex-col rounded-xl bg-slate-100 dark:bg-slate-800/50 ${
        isDragging ? "opacity-50 ring-2 ring-[var(--primary)]" : ""
      }`}
    >
      {/* Column Header (drag handle) */}
      <div
        {...attributes}
        {...listeners}
        className="flex cursor-grab items-center gap-2 rounded-t-xl px-3 py-3 active:cursor-grabbing"
      >
        {/* Color indicator */}
        {column.color && (
          <div
            className="h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: column.color }}
          />
        )}

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

      {/* Cards area */}
      <div className="flex min-h-[60px] flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {activeCards.map((card) => (
            <Card key={card.id} card={card} onClick={() => onCardClick(card)} />
          ))}
        </SortableContext>
      </div>

      {/* Add card area */}
      <div className="px-2 pb-2">
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
    </div>
  );
}
