"use client";

import { use, useState, useEffect } from "react";
import { useBoard } from "@/lib/hooks/useBoard";
import { BoardHeader, type BoardFilters, type BoardView } from "@/components/board/BoardHeader";
import { KanbanBoard } from "@/components/board/KanbanBoard";
import { PriorityReviewPanel } from "@/components/board/PriorityReviewPanel";

// ---------------------------------------------------------------------------
// Skeleton loader for columns
// ---------------------------------------------------------------------------

function SkeletonColumn() {
  return (
    <div className="flex w-72 shrink-0 flex-col gap-3 rounded-xl bg-slate-100 p-3 dark:bg-slate-800/50">
      {/* Accent bar */}
      <div className="h-1 w-full rounded-t-xl bg-slate-300 dark:bg-slate-600 animate-pulse" />
      {/* Header skeleton */}
      <div className="flex items-center gap-2">
        <div className="h-4 w-24 animate-pulse rounded bg-[var(--muted)]" />
        <div className="ml-auto h-5 w-6 animate-pulse rounded-full bg-[var(--muted)]" />
      </div>

      {/* Card skeletons */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-lg border border-[var(--border)] bg-white p-3 dark:bg-slate-800"
        >
          <div className="mb-2 h-4 w-3/4 rounded bg-[var(--muted)]" />
          <div className="flex gap-2">
            <div className="h-3 w-12 rounded-full bg-[var(--muted)]" />
            <div className="h-3 w-16 rounded-full bg-[var(--muted)]" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Board Page
// ---------------------------------------------------------------------------

const DEFAULT_FILTERS: BoardFilters = {
  priority: "all",
  dueDate: "all",
  view: "kanban",
};

interface BoardPageProps {
  params: Promise<{ boardId: string }>;
}

export default function BoardPage({ params }: BoardPageProps) {
  const { boardId } = use(params);
  const { data: board, isLoading, error } = useBoard(boardId);

  // Persist view preference to localStorage
  const [filters, setFilters] = useState<BoardFilters>(DEFAULT_FILTERS);

  // Remember this board as the last viewed board
  useEffect(() => {
    try {
      localStorage.setItem("last-board-id", boardId);
    } catch {}
  }, [boardId]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("board-view-pref");
      if (stored) {
        const view = stored as BoardView;
        if (view === "kanban" || view === "list") {
          setFilters((f) => ({ ...f, view }));
        }
      }
    } catch {}
  }, []);

  const handleFiltersChange = (next: BoardFilters) => {
    setFilters(next);
    try {
      localStorage.setItem("board-view-pref", next.view);
    } catch {}
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-full flex-col bg-[var(--background)]">
        {/* Header skeleton */}
        <header className="flex items-center gap-4 border-b border-[var(--border)] bg-[var(--background)]/80 px-4 py-3 backdrop-blur-md">
          <div className="h-8 w-8 animate-pulse rounded-lg bg-[var(--muted)]" />
          <div className="h-6 w-48 animate-pulse rounded bg-[var(--muted)]" />
        </header>

        {/* Columns skeleton */}
        <div className="flex flex-1 gap-4 overflow-x-auto p-4">
          <SkeletonColumn />
          <SkeletonColumn />
          <SkeletonColumn />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-full items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <h2 className="mb-2 text-lg font-semibold text-[var(--foreground)]">
            Failed to load board
          </h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            {error.message}
          </p>
          <a
            href="/boards"
            className="mt-4 inline-block rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] transition-colors hover:opacity-90"
          >
            Back to Boards
          </a>
        </div>
      </div>
    );
  }

  // No board found
  if (!board) {
    return (
      <div className="flex h-full items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <h2 className="mb-2 text-lg font-semibold text-[var(--foreground)]">
            Board not found
          </h2>
          <a
            href="/boards"
            className="mt-4 inline-block rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] transition-colors hover:opacity-90"
          >
            Back to Boards
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-[var(--background)]">
      <BoardHeader
        board={board}
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <KanbanBoard board={board} filters={filters} />
        </div>
        <PriorityReviewPanel boardId={board.id} />
      </div>
    </div>
  );
}
