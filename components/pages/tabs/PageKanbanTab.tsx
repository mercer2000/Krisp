"use client";

import { useState, useMemo } from "react";
import { useBoards, useBoard } from "@/lib/hooks/useBoard";
import { KanbanBoard } from "@/components/board/KanbanBoard";
import type { Page } from "@/types";
import type { BoardFilters } from "@/components/board/BoardHeader";

interface PageKanbanTabProps {
  page: Page;
}

const DEFAULT_FILTERS: BoardFilters = {
  priority: "all",
  dueDate: "all",
  view: "kanban",
  tag: "all",
};

export function PageKanbanTab({ page }: PageKanbanTabProps) {
  const { data: boards, isLoading: boardsLoading } = useBoards();
  const [filters, setFilters] = useState<BoardFilters>(DEFAULT_FILTERS);

  // Use the first board (most recently updated)
  const boardId = boards?.[0]?.id;
  const { data: board, isLoading: boardLoading } = useBoard(boardId ?? "");

  const isLoading = boardsLoading || boardLoading;

  // Filter the board to only show cards tagged with this page's title
  const filteredBoard = useMemo(() => {
    if (!board) return null;

    const pageTitle = page.title.toLowerCase();

    return {
      ...board,
      columns: board.columns.map((col) => ({
        ...col,
        cards: col.cards.filter((card) =>
          card.tags?.some((tag) => tag.label.toLowerCase() === pageTitle)
        ),
      })),
    };
  }, [board, page.title]);

  // Count total cards across all columns
  const totalCards = useMemo(() => {
    if (!filteredBoard) return 0;
    return filteredBoard.columns.reduce((sum, col) => sum + col.cards.length, 0);
  }, [filteredBoard]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-5 w-40 animate-pulse rounded bg-[var(--muted)]" />
        </div>
        <div className="flex gap-4 overflow-x-auto">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="w-72 shrink-0 rounded-xl bg-[var(--muted)]/30 p-3 space-y-3"
            >
              <div className="h-4 w-24 animate-pulse rounded bg-[var(--muted)]" />
              <div className="h-20 animate-pulse rounded-lg bg-[var(--muted)]" />
              <div className="h-20 animate-pulse rounded-lg bg-[var(--muted)]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!boards?.length) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
        <p className="text-sm text-[var(--muted-foreground)]">
          No Kanban board found. Create a board first to see tasks here.
        </p>
        <a
          href="/boards"
          className="mt-3 inline-block rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] transition-colors hover:opacity-90"
        >
          Go to Boards
        </a>
      </div>
    );
  }

  if (!filteredBoard) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-medium text-[var(--foreground)]">
            Tasks tagged &ldquo;{page.title}&rdquo;
          </h3>
          <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] font-medium text-[var(--muted-foreground)]">
            {totalCards} {totalCards === 1 ? "card" : "cards"}
          </span>
        </div>

        {/* Inline filters */}
        <div className="flex items-center gap-2">
          <select
            value={filters.priority}
            onChange={(e) =>
              setFilters({ ...filters, priority: e.target.value as BoardFilters["priority"] })
            }
            className="rounded-md border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-xs text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--ring)]"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={filters.dueDate}
            onChange={(e) =>
              setFilters({ ...filters, dueDate: e.target.value as BoardFilters["dueDate"] })
            }
            className="rounded-md border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-xs text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--ring)]"
          >
            <option value="all">All Dates</option>
            <option value="overdue">Overdue</option>
            <option value="due_soon">Due Soon (7 days)</option>
            <option value="no_date">No Date</option>
          </select>

          {(filters.priority !== "all" || filters.dueDate !== "all") && (
            <button
              onClick={() => setFilters(DEFAULT_FILTERS)}
              className="rounded-md px-2 py-1 text-xs text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {totalCards === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)]/50 p-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)]">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--muted-foreground)]">
              <rect x="3" y="3" width="7" height="18" rx="1" />
              <rect x="14" y="3" width="7" height="10" rx="1" />
            </svg>
          </div>
          <p className="text-sm font-medium text-[var(--foreground)]">No tasks yet</p>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            Cards tagged &ldquo;{page.title}&rdquo; will appear here automatically when smart rules match incoming emails or meetings.
            You can also manually tag any card on your board.
          </p>
          <a
            href={`/boards/${boardId}`}
            className="mt-3 inline-block rounded-lg bg-[var(--primary)] px-4 py-2 text-xs font-medium text-[var(--primary-foreground)] transition-colors hover:opacity-90"
          >
            Open Board
          </a>
        </div>
      ) : (
        <div className="-mx-16 rounded-xl border border-[var(--border)] bg-[var(--background)]" style={{ height: "min(600px, 60vh)" }}>
          <div className="h-full overflow-hidden">
            <KanbanBoard board={filteredBoard} filters={filters} />
          </div>
        </div>
      )}
    </div>
  );
}
