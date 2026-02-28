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
import { useReorderColumns } from "@/lib/hooks/useColumns";
import { useMoveCard, useReorderCards } from "@/lib/hooks/useCards";
import type { BoardWithColumns, Card as CardType, ColumnWithCards } from "@/types";

// ---------------------------------------------------------------------------
// KanbanBoard
// ---------------------------------------------------------------------------

interface KanbanBoardProps {
  board: BoardWithColumns;
}

// Use pointer position for collision detection (follows the cursor exactly),
// falling back to closest-center when the pointer is in a gap between columns.
const collisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) return pointerCollisions;
  return closestCenter(args);
};

export function KanbanBoard({ board }: KanbanBoardProps) {
  const [activeCard, setActiveCard] = useState<CardType | null>(null);
  const [dragSourceColumnId, setDragSourceColumnId] = useState<string | null>(
    null
  );

  // Local columns state for real-time cross-column drag feedback.
  // During a drag, cards are moved between columns in this state so that
  // SortableContext containers update and the card renders in the new column.
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

    // Determine target column ID from the over item.
    // This is safe outside the updater — the over item (not the active card)
    // doesn't move between columns, so stale localColumns won't mis-identify it.
    let targetColumnId: string | undefined;
    if (isColumnId(overId)) {
      targetColumnId = overId;
    } else {
      const overCol = findColumnByCardId(overId);
      if (overCol) targetColumnId = overCol.id;
    }
    if (!targetColumnId) return;

    // Move card from source to target column.
    // CRITICAL: find the source column from `prev` (latest state), NOT from the
    // render closure. handleDragOver fires rapidly and the closure's
    // `localColumns` can be stale — the card may have already been moved by a
    // previous queued state update.
    setLocalColumns((prev) => {
      const srcCol = prev.find((col) =>
        col.cards.some((c) => c.id === activeId)
      );
      if (!srcCol) return prev;

      // Already in the target column — no-op
      if (srcCol.id === targetColumnId) return prev;

      const dstCol = prev.find((c) => c.id === targetColumnId);
      if (!dstCol) return prev;

      const movedCard = srcCol.cards.find((c) => c.id === activeId)!;

      // Remove from source, reassign positions
      const srcCards = srcCol.cards
        .filter((c) => c.id !== activeId)
        .sort((a, b) => a.position - b.position)
        .map((c, i) => ({ ...c, position: i * 1024 }));

      // Insert into target at the right position
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

    if (!over) {
      setActiveCard(null);
      setDragSourceColumnId(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

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

    // Card drag — find which column the card is in now (after dragOver moves)
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
      // Cross-column move — card already in target column from dragOver
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
  };

  // -- Card click handler --
  const handleCardClick = useCallback((_card: CardType) => {
    // Card detail panel will be implemented separately
  }, []);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex flex-1 gap-4 overflow-x-auto p-4">
        <SortableContext
          items={columnIds}
          strategy={horizontalListSortingStrategy}
        >
          {localColumns.map((column) => (
            <Column
              key={column.id}
              column={column}
              boardId={board.id}
              onCardClick={handleCardClick}
            />
          ))}
        </SortableContext>

        <AddColumnButton boardId={board.id} />
      </div>

      <DragOverlay>
        {activeCard ? (
          <div className="w-72 rotate-2 scale-105 opacity-90">
            <CardComponent card={activeCard} onClick={() => {}} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
