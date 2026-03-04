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
import { Column } from "./Column";
import { Card as CardComponent } from "./Card";
import { AddColumnButton } from "./AddColumnButton";
import { CardDetailDrawer } from "./CardDetailDrawer";
import { TrashDropZone, TRASH_ZONE_ID } from "./TrashDropZone";
import { useReorderColumns } from "@/lib/hooks/useColumns";
import { useDeleteCard, useMoveCard, useReorderCards } from "@/lib/hooks/useCards";
import type { BoardWithColumns, Card as CardType, ColumnWithCards } from "@/types";
import type { BoardFilters } from "./BoardHeader";

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
      deleteCard.mutate(activeCard.id);
      setLocalColumns((prev) =>
        prev.map((col) => ({
          ...col,
          cards: col.cards.filter((c) => c.id !== activeCard.id),
        }))
      );
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
                isOver={dragOverColumnId === column.id}
              />
            ))}
          </SortableContext>

          <AddColumnButton boardId={board.id} />
        </div>

        <DragOverlay>
          {activeCard ? (
            <div className="w-80 rotate-2 scale-105">
              {/* Ghost card with semi-transparent, dashed border */}
              <div className="rounded-lg border-2 border-dashed border-blue-400 bg-blue-50/80 dark:bg-blue-900/30 shadow-lg">
                <CardComponent card={activeCard} onClick={() => {}} />
              </div>
            </div>
          ) : null}
        </DragOverlay>

        <TrashDropZone isVisible={activeCard !== null} />
      </DndContext>

      {/* Card detail slide-over drawer */}
      <CardDetailDrawer
        card={selectedCard}
        boardId={board.id}
        onClose={() => setSelectedCard(null)}
      />
    </>
  );
}
