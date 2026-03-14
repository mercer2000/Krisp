"use client";

import { useState, useEffect } from "react";
import type { CalendarEvent } from "@/types";
import { useBoards, useBoard } from "@/lib/hooks/useBoard";
import { useCreateCard } from "@/lib/hooks/useCards";
import { formatTimeRange } from "./calendarUtils";

interface CreateCardFromEventProps {
  event: CalendarEvent;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateCardFromEvent({
  event,
  onClose,
  onCreated,
}: CreateCardFromEventProps) {
  const [title, setTitle] = useState(event.subject || "");
  const [selectedBoardId, setSelectedBoardId] = useState("");
  const [selectedColumnId, setSelectedColumnId] = useState("");

  const { data: boards } = useBoards();
  const { data: boardData } = useBoard(selectedBoardId);
  const createCard = useCreateCard(selectedBoardId);

  // Auto-select first board when boards load
  useEffect(() => {
    if (boards && boards.length > 0 && !selectedBoardId) {
      setSelectedBoardId(boards[0].id);
    }
  }, [boards, selectedBoardId]);

  // Auto-select first column when board data loads
  useEffect(() => {
    if (boardData?.columns && boardData.columns.length > 0) {
      setSelectedColumnId(boardData.columns[0].id);
    } else {
      setSelectedColumnId("");
    }
  }, [boardData]);

  function buildDescription(): string {
    const parts: string[] = [];
    if (event.location) parts.push(`Location: ${event.location}`);
    if (event.organizerName || event.organizerEmail) {
      parts.push(`Organizer: ${event.organizerName || event.organizerEmail}`);
    }
    parts.push(`Time: ${formatTimeRange(event)}`);
    return parts.join("\n");
  }

  function handleCreate() {
    if (!selectedColumnId || !title.trim()) return;
    createCard.mutate(
      {
        columnId: selectedColumnId,
        title: title.trim(),
        description: buildDescription(),
      },
      {
        onSuccess: () => onCreated(),
      },
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-sm rounded-lg border bg-popover shadow-lg"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="space-y-3 p-4">
          {/* Header */}
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Create Card
          </p>

          {/* Title input */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Card title"
            className="w-full rounded-md border bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
          />

          {/* Board selector */}
          <select
            value={selectedBoardId}
            onChange={(e) => setSelectedBoardId(e.target.value)}
            className="w-full rounded-md border bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
          >
            {!boards || boards.length === 0 ? (
              <option value="">No boards available</option>
            ) : (
              boards.map((board) => (
                <option key={board.id} value={board.id}>
                  {board.title}
                </option>
              ))
            )}
          </select>

          {/* Column selector */}
          <select
            value={selectedColumnId}
            onChange={(e) => setSelectedColumnId(e.target.value)}
            className="w-full rounded-md border bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
          >
            {!boardData?.columns || boardData.columns.length === 0 ? (
              <option value="">No columns available</option>
            ) : (
              boardData.columns.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.title}
                </option>
              ))
            )}
          </select>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded-md bg-primary px-3 py-1.5 text-sm text-white hover:bg-primary/90 disabled:opacity-50"
              disabled={
                !selectedColumnId || !title.trim() || createCard.isPending
              }
              onClick={handleCreate}
            >
              {createCard.isPending ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
