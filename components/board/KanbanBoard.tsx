"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import {
  DndContext,
  pointerWithin,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
  type CollisionDetection,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { Column, isSnoozeColumn } from "./Column";
import { AddColumnButton } from "./AddColumnButton";
import { CardDetailDrawer } from "./CardDetailDrawer";
import { TrashDropZone, TRASH_ZONE_ID } from "./TrashDropZone";
import { useReorderColumns, useCreateColumn } from "@/lib/hooks/useColumns";
import { useDeleteCard, useDeleteCards, useMoveCard, useReorderCards, useUpdateCard } from "@/lib/hooks/useCards";
import type { BoardWithColumns, Card as CardType, ColumnWithCards } from "@/types";
import type { BoardFilters } from "./BoardHeader";

// ---------------------------------------------------------------------------
// Lightweight card for DragOverlay — no dnd-kit hooks to avoid conflicts
// ---------------------------------------------------------------------------

function DragOverlayCard({ card }: { card: CardType }) {
  const tags = card.tags ?? [];
  const priorityLabel: Record<string, string> = {
    low: "Low", medium: "Medium", high: "High", urgent: "Urgent",
  };
  const priorityColor: Record<string, string> = {
    low: "#22c55e", medium: "#3b82f6", high: "#f97316", urgent: "#ef4444",
  };

  return (
    <div className="rounded-lg bg-white dark:bg-slate-800 p-3">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {tags.slice(0, 3).map((tag) => (
            <span
              key={tag.id}
              className="inline-block h-1.5 w-8 rounded-full"
              style={{ backgroundColor: tag.color }}
            />
          ))}
        </div>
      )}
      <h4 className="text-sm font-medium text-[var(--card-foreground)] line-clamp-2">
        {card.title}
      </h4>
      {card.description && (
        <p className="mt-1 text-xs text-[var(--muted-foreground)] line-clamp-2">
          {card.description}
        </p>
      )}
      <div className="mt-2">
        <span
          className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
          style={{ color: priorityColor[card.priority], backgroundColor: `${priorityColor[card.priority]}20` }}
        >
          {priorityLabel[card.priority]}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Filter helpers
// ---------------------------------------------------------------------------

function isOverdue(dueDate: string): boolean {
  const due = new Date(dueDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return due < now;
}

function isDueSoon(dueDate: string): boolean {
  const due = new Date(dueDate);
  const now = new Date();
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 7;
}

function applyFilters(columns: ColumnWithCards[], filters: BoardFilters): ColumnWithCards[] {
  return columns.map((col) => ({
    ...col,
    cards: col.cards.filter((card) => {
      if (card.archived) return false;

      // Priority filter
      if (filters.priority !== "all" && card.priority !== filters.priority) return false;

      // Due date filter
      if (filters.dueDate === "overdue" && (!card.dueDate || !isOverdue(card.dueDate))) return false;
      if (filters.dueDate === "due_soon" && (!card.dueDate || !isDueSoon(card.dueDate))) return false;
      if (filters.dueDate === "no_date" && card.dueDate) return false;

      // Tag filter
      if (filters.tag && filters.tag !== "all") {
        const tagLower = filters.tag.toLowerCase();
        if (!card.tags?.some((t) => t.label.toLowerCase() === tagLower)) return false;
      }

      return true;
    }),
  }));
}

// ---------------------------------------------------------------------------
// KanbanBoard
// ---------------------------------------------------------------------------

interface KanbanBoardProps {
  board: BoardWithColumns;
  filters: BoardFilters;
}

// Use pointer position for collision detection (follows the cursor exactly),
// falling back to closest-center when the pointer is in a gap between columns.
const collisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) return pointerCollisions;
  return closestCenter(args);
};

export function KanbanBoard({ board, filters }: KanbanBoardProps) {
  const [activeCard, setActiveCard] = useState<CardType | null>(null);
  const [dragSourceColumnId, setDragSourceColumnId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set());
  const [pendingSnooze, setPendingSnooze] = useState<{ cardId: string; returnColumnId: string } | null>(null);

  // Local columns state for real-time cross-column drag feedback.
  const [localColumns, setLocalColumns] = useState<ColumnWithCards[]>(() =>
    [...board.columns].sort((a, b) => a.position - b.position)
  );

  // Sync from server data when not actively dragging
  useEffect(() => {
    if (!activeCard) {
      setLocalColumns(
        [...board.columns].sort((a, b) => a.position - b.position)
      );
    }
  }, [board.columns, activeCard]);

  const reorderColumns = useReorderColumns(board.id);
  const moveCard = useMoveCard(board.id);
  const reorderCards = useReorderCards(board.id);
  const deleteCard = useDeleteCard(board.id);
  const deleteCards = useDeleteCards(board.id);
  const updateCard = useUpdateCard(board.id);
  const createColumn = useCreateColumn(board.id);

  // Auto-create a Snooze column if the board doesn't have one
  const hasSnoozeColumn = useMemo(
    () => board.columns.some((col) => isSnoozeColumn(col.title)),
    [board.columns],
  );

  useEffect(() => {
    if (!hasSnoozeColumn && !createColumn.isPending) {
      createColumn.mutate({ title: "Snooze" });
    }
  }, [hasSnoozeColumn]); // eslint-disable-line react-hooks/exhaustive-deps

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor)
  );

  const columnIds = useMemo(
    () => localColumns.map((col) => col.id),
    [localColumns]
  );

  // Apply filters to display columns
  const displayColumns = useMemo(
    () => applyFilters(localColumns, filters),
    [localColumns, filters]
  );

  const findColumnByCardId = useCallback(
    (cardId: string): ColumnWithCards | undefined => {
      return localColumns.find((col) =>
        col.cards.some((c) => c.id === cardId)
      );
    },
    [localColumns]
  );

  const isColumnId = useCallback(
    (id: string): boolean => localColumns.some((col) => col.id === id),
    [localColumns]
  );

  // -- Keyboard shortcut: "N" to add card --
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") return;
      if (target.isContentEditable) return;

      if (e.key === "n" || e.key === "N") {
        // Focus the first column's add-card button
        const addBtn = document.querySelector('[data-add-card-column]') as HTMLButtonElement;
        if (addBtn) addBtn.click();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // -- Keyboard: Delete/Backspace to delete selected cards, Escape to clear --
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") return;
      if (target.isContentEditable) return;

      if (e.key === "Escape") {
        setSelectedCardIds(new Set());
        return;
      }

      if ((e.key === "Delete" || e.key === "Backspace") && selectedCardIds.size > 0) {
        e.preventDefault();
        const count = selectedCardIds.size;
        const confirmed = window.confirm(
          `Delete ${count} selected card${count === 1 ? "" : "s"}? This cannot be undone.`
        );
        if (confirmed) {
          const ids = Array.from(selectedCardIds);
          deleteCards.mutate(ids);
          setLocalColumns((prev) =>
            prev.map((col) => ({
              ...col,
              cards: col.cards.filter((c) => !selectedCardIds.has(c.id)),
            }))
          );
          setSelectedCardIds(new Set());
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [selectedCardIds, deleteCards]);

  // -- Card selection handler (Ctrl/Cmd+click or checkbox click) --
  const handleSelectCard = useCallback((cardId: string) => {
    setSelectedCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      return next;
    });
  }, []);

  // -- Drag Start --
  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active.id as string;
    for (const col of localColumns) {
      const card = col.cards.find((c) => c.id === id);
      if (card) {
        setActiveCard(card);
        setDragSourceColumnId(col.id);
        return;
      }
    }
  };

  // -- Drag Over (cross-column card movement in local state) --
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || !activeCard) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    if (activeId === overId) return;

    // Skip column-matching logic when hovering over trash zone
    if (overId === TRASH_ZONE_ID) return;

    // Track which column is being hovered for highlight
    let targetColumnId: string | undefined;
    if (isColumnId(overId)) {
      targetColumnId = overId;
    } else {
      const overCol = findColumnByCardId(overId);
      if (overCol) targetColumnId = overCol.id;
    }
    if (!targetColumnId) return;

    setDragOverColumnId(targetColumnId);

    setLocalColumns((prev) => {
      const srcCol = prev.find((col) =>
        col.cards.some((c) => c.id === activeId)
      );
      if (!srcCol) return prev;

      if (srcCol.id === targetColumnId) return prev;

      const dstCol = prev.find((c) => c.id === targetColumnId);
      if (!dstCol) return prev;

      const movedCard = srcCol.cards.find((c) => c.id === activeId)!;

      const srcCards = srcCol.cards
        .filter((c) => c.id !== activeId)
        .sort((a, b) => a.position - b.position)
        .map((c, i) => ({ ...c, position: i * 1024 }));

      const dstActiveCards = [...dstCol.cards]
        .filter((c) => !c.archived)
        .sort((a, b) => a.position - b.position);

      let insertIndex: number;
      if (isColumnId(overId)) {
        insertIndex = dstActiveCards.length;
      } else {
        const overIndex = dstActiveCards.findIndex((c) => c.id === overId);
        insertIndex = overIndex !== -1 ? overIndex : dstActiveCards.length;
      }

      const newDstCards = [...dstActiveCards];
      newDstCards.splice(insertIndex, 0, movedCard);
      const updatedDstCards = newDstCards.map((c, i) => ({
        ...c,
        position: i * 1024,
      }));

      return prev.map((col) => {
        if (col.id === srcCol.id) return { ...col, cards: srcCards };
        if (col.id === targetColumnId)
          return { ...col, cards: updatedDstCards };
        return col;
      });
    });
  };

  // -- Drag End (persist to server) --
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setDragOverColumnId(null);

    if (!over) {
      setActiveCard(null);
      setDragSourceColumnId(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Drag-to-delete: drop on trash zone
    if (overId === TRASH_ZONE_ID && activeCard) {
      // If the dragged card is part of a selection, delete all selected cards
      const idsToDelete = selectedCardIds.has(activeCard.id) && selectedCardIds.size > 1
        ? Array.from(selectedCardIds)
        : [activeCard.id];

      if (idsToDelete.length > 1) {
        deleteCards.mutate(idsToDelete);
      } else {
        deleteCard.mutate(activeCard.id);
      }

      const deleteSet = new Set(idsToDelete);
      setLocalColumns((prev) =>
        prev.map((col) => ({
          ...col,
          cards: col.cards.filter((c) => !deleteSet.has(c.id)),
        }))
      );
      setSelectedCardIds(new Set());
      setActiveCard(null);
      setDragSourceColumnId(null);
      return;
    }

    if (!activeCard) {
      // Column drag
      if (isColumnId(activeId) && isColumnId(overId) && activeId !== overId) {
        const oldIndex = columnIds.indexOf(activeId);
        const newIndex = columnIds.indexOf(overId);
        if (oldIndex !== -1 && newIndex !== -1) {
          const newOrder = arrayMove(columnIds, oldIndex, newIndex);
          setLocalColumns((prev) =>
            newOrder.map((id) => prev.find((c) => c.id === id)!)
          );
          reorderColumns.mutate(newOrder);
        }
      }
      setActiveCard(null);
      setDragSourceColumnId(null);
      return;
    }

    // Card drag
    const currentColumn = findColumnByCardId(activeId);
    if (!currentColumn) {
      setActiveCard(null);
      setDragSourceColumnId(null);
      return;
    }

    if (dragSourceColumnId === currentColumn.id) {
      // Same column — reorder
      if (activeId !== overId && !isColumnId(overId)) {
        const sortedCards = [...currentColumn.cards]
          .filter((c) => !c.archived)
          .sort((a, b) => a.position - b.position);
        const cardIds = sortedCards.map((c) => c.id);
        const oldIndex = cardIds.indexOf(activeId);
        const newIndex = cardIds.indexOf(overId);

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          const newOrder = arrayMove(cardIds, oldIndex, newIndex);
          reorderCards.mutate({
            columnId: currentColumn.id,
            cardIds: newOrder,
          });
        }
      }
    } else {
      // Cross-column move
      const sortedCards = [...currentColumn.cards]
        .filter((c) => !c.archived)
        .sort((a, b) => a.position - b.position);
      const position = sortedCards.findIndex((c) => c.id === activeId);

      moveCard.mutate({
        cardId: activeId,
        targetColumnId: currentColumn.id,
        position: position !== -1 ? position : sortedCards.length,
      });

      // If dropped into a snooze column, show the snooze picker
      if (isSnoozeColumn(currentColumn.title) && dragSourceColumnId) {
        setPendingSnooze({ cardId: activeId, returnColumnId: dragSourceColumnId });
      }
      // If dragged out of a snooze column, clear snooze fields
      else if (dragSourceColumnId && activeCard.snoozedUntil) {
        const srcCol = board.columns.find((c) => c.id === dragSourceColumnId);
        if (srcCol && isSnoozeColumn(srcCol.title)) {
          updateCard.mutate({ id: activeId, snoozedUntil: null, snoozeReturnColumnId: null });
        }
      }
    }

    setActiveCard(null);
    setDragSourceColumnId(null);
  };

  const handleDragCancel = () => {
    setActiveCard(null);
    setDragSourceColumnId(null);
    setDragOverColumnId(null);
  };

  // -- Card click handler → open drawer --
  const handleCardClick = useCallback((card: CardType) => {
    setSelectedCard(card);
  }, []);

  const handleDeleteCard = useCallback((cardId: string) => {
    deleteCard.mutate(cardId);
  }, [deleteCard]);

  // Column options for the Move picker on each card
  const columnOptions = useMemo(
    () => localColumns.map((col) => ({ id: col.id, title: col.title })),
    [localColumns]
  );

  // Snooze a card: set snoozedUntil and snoozeReturnColumnId
  const handleSnoozeCard = useCallback((cardId: string, snoozedUntil: string, returnColumnId: string) => {
    // Find a snooze column on this board
    const snoozeCol = localColumns.find((col) => isSnoozeColumn(col.title));
    const srcCol = localColumns.find((col) => col.cards.some((c) => c.id === cardId));
    const effectiveReturnColumnId = returnColumnId || srcCol?.id || "";

    updateCard.mutate({
      id: cardId,
      snoozedUntil,
      snoozeReturnColumnId: effectiveReturnColumnId,
    });

    // If the card is not already in the snooze column, move it there
    if (snoozeCol && srcCol && srcCol.id !== snoozeCol.id) {
      const movedCard = srcCol.cards.find((c) => c.id === cardId);
      if (movedCard) {
        setLocalColumns((prev) =>
          prev.map((col) => {
            if (col.id === srcCol.id) {
              return { ...col, cards: col.cards.filter((c) => c.id !== cardId) };
            }
            if (col.id === snoozeCol.id) {
              const newPosition = col.cards.length * 1024;
              return {
                ...col,
                cards: [...col.cards, { ...movedCard, position: newPosition, snoozedUntil, snoozeReturnColumnId: effectiveReturnColumnId }],
              };
            }
            return col;
          })
        );

        const dstCardCount = snoozeCol.cards.filter((c) => !c.archived).length;
        moveCard.mutate({
          cardId,
          targetColumnId: snoozeCol.id,
          position: dstCardCount,
        });
      }
    }

    setPendingSnooze(null);
  }, [localColumns, updateCard, moveCard]);

  // Move card to a different column via the Move button
  const handleMoveCardToColumn = useCallback((cardId: string, targetColumnId: string) => {
    const srcCol = localColumns.find((col) => col.cards.some((c) => c.id === cardId));
    if (!srcCol || srcCol.id === targetColumnId) return;

    const movedCard = srcCol.cards.find((c) => c.id === cardId);
    if (!movedCard) return;

    const dstCol = localColumns.find((col) => col.id === targetColumnId);
    if (!dstCol) return;

    // Optimistic local update
    setLocalColumns((prev) =>
      prev.map((col) => {
        if (col.id === srcCol.id) {
          return { ...col, cards: col.cards.filter((c) => c.id !== cardId) };
        }
        if (col.id === targetColumnId) {
          const newPosition = col.cards.length * 1024;
          return {
            ...col,
            cards: [...col.cards, { ...movedCard, position: newPosition }],
          };
        }
        return col;
      })
    );

    // Persist to server
    const dstCardCount = dstCol.cards.filter((c) => !c.archived).length;
    moveCard.mutate({
      cardId,
      targetColumnId,
      position: dstCardCount,
    });

    // If moved to a snooze column via the Move button, show snooze picker
    if (isSnoozeColumn(dstCol.title)) {
      setPendingSnooze({ cardId, returnColumnId: srcCol.id });
    }
    // If a snoozed card is manually moved out of a snooze column, clear snooze fields
    else if (movedCard.snoozedUntil && isSnoozeColumn(srcCol.title)) {
      updateCard.mutate({ id: cardId, snoozedUntil: null, snoozeReturnColumnId: null });
    }
  }, [localColumns, moveCard, updateCard]);

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex h-full gap-4 overflow-x-auto p-4">
          <SortableContext
            items={columnIds}
            strategy={horizontalListSortingStrategy}
          >
            {displayColumns.map((column) => (
              <Column
                key={column.id}
                column={column}
                boardId={board.id}
                onCardClick={handleCardClick}
                onDeleteCard={handleDeleteCard}
                onMoveCard={handleMoveCardToColumn}
                onSnoozeCard={handleSnoozeCard}
                allColumns={columnOptions}
                isOver={dragOverColumnId === column.id}
                selectedCardIds={selectedCardIds}
                onSelectCard={handleSelectCard}
              />
            ))}
          </SortableContext>

          <AddColumnButton boardId={board.id} />
        </div>

        <DragOverlay dropAnimation={null}>
          {activeCard ? (
            <div className="w-80 rotate-2 scale-105 pointer-events-none">
              <div className="rounded-lg border-2 border-dashed border-blue-400 bg-blue-50/80 dark:bg-blue-900/30 shadow-lg">
                <DragOverlayCard card={activeCard} />
              </div>
            </div>
          ) : null}
        </DragOverlay>

        <TrashDropZone
          isVisible={activeCard !== null}
          selectedCount={activeCard && selectedCardIds.has(activeCard.id) ? selectedCardIds.size : 1}
        />
      </DndContext>

      {/* Floating selection toolbar */}
      {selectedCardIds.size > 0 && !activeCard && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 shadow-lg">
          <span className="text-sm font-medium text-[var(--foreground)]">
            {selectedCardIds.size} selected
          </span>
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
          <button
            onClick={() => {
              const count = selectedCardIds.size;
              const confirmed = window.confirm(
                `Delete ${count} selected card${count === 1 ? "" : "s"}? This cannot be undone.`
              );
              if (confirmed) {
                const ids = Array.from(selectedCardIds);
                deleteCards.mutate(ids);
                setLocalColumns((prev) =>
                  prev.map((col) => ({
                    ...col,
                    cards: col.cards.filter((c) => !selectedCardIds.has(c.id)),
                  }))
                );
                setSelectedCardIds(new Set());
              }
            }}
            className="flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
            Delete
          </button>
          <button
            onClick={() => setSelectedCardIds(new Set())}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
          >
            Clear
          </button>
        </div>
      )}

      {/* Snooze duration picker modal (appears when card is dropped into snooze column) */}
      {pendingSnooze && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={() => setPendingSnooze(null)}
          />
          <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-xl min-w-[260px]">
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">Snooze this card</h3>
            <p className="text-xs text-[var(--muted-foreground)] mb-3">Choose how long to snooze. The card will return to its original column when the time is up.</p>
            <div className="space-y-1">
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
                  onClick={() => {
                    const until = new Date(Date.now() + opt.hours * 60 * 60 * 1000).toISOString();
                    handleSnoozeCard(pendingSnooze.cardId, until, pendingSnooze.returnColumnId);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--foreground)] hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-700 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setPendingSnooze(null)}
              className="mt-3 w-full rounded-lg px-3 py-1.5 text-xs text-[var(--muted-foreground)] hover:bg-[var(--accent)] transition-colors"
            >
              Cancel (leave without snooze timer)
            </button>
          </div>
        </>
      )}

      {/* Card detail slide-over drawer */}
      <CardDetailDrawer
        card={selectedCard}
        boardId={board.id}
        onClose={() => setSelectedCard(null)}
      />
    </>
  );
}
