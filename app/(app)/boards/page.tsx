"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBoards, useCreateBoard, useDeleteBoard } from "@/lib/hooks/useBoard";
import type { Board } from "@/types";

// ---------------------------------------------------------------------------
// Skeleton loader for board cards
// ---------------------------------------------------------------------------

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
      <div className="mb-3 h-5 w-3/4 rounded bg-[var(--muted)]" />
      <div className="mb-2 h-3 w-full rounded bg-[var(--muted)]" />
      <div className="mb-4 h-3 w-2/3 rounded bg-[var(--muted)]" />
      <div className="flex items-center justify-between">
        <div className="h-3 w-16 rounded bg-[var(--muted)]" />
        <div className="h-3 w-20 rounded bg-[var(--muted)]" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Color picker presets
// ---------------------------------------------------------------------------

const COLOR_PRESETS = [
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#6366f1",
  "#f43f5e",
];

// ---------------------------------------------------------------------------
// Create Board Modal
// ---------------------------------------------------------------------------

function CreateBoardModal({
  onClose,
  onCreate,
  isLoading,
}: {
  onClose: () => void;
  onCreate: (data: { title: string; description?: string; backgroundColor?: string }) => void;
  isLoading: boolean;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("#3b82f6");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onCreate({
      title: title.trim(),
      description: description.trim() || undefined,
      backgroundColor,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-2xl">
        <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">
          Create New Board
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label
              htmlFor="board-title"
              className="mb-1 block text-sm font-medium text-[var(--foreground)]"
            >
              Title
            </label>
            <input
              id="board-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My new board"
              autoFocus
              className="w-full rounded-lg border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none focus:ring-2 focus:ring-[var(--ring)] transition-shadow"
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="board-desc"
              className="mb-1 block text-sm font-medium text-[var(--foreground)]"
            >
              Description
            </label>
            <textarea
              id="board-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={3}
              className="w-full resize-none rounded-lg border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none focus:ring-2 focus:ring-[var(--ring)] transition-shadow"
            />
          </div>

          {/* Background Color */}
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
              Background Color
            </label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setBackgroundColor(color)}
                  className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${
                    backgroundColor === color
                      ? "border-[var(--foreground)] scale-110"
                      : "border-transparent"
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || isLoading}
              className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Creating..." : "Create Board"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Board Card
// ---------------------------------------------------------------------------

function BoardCard({
  board,
  onClick,
  onDelete,
}: {
  board: Board;
  onClick: () => void;
  onDelete: () => void;
}) {
  const updatedAt = new Date(board.updatedAt);
  const timeAgo = getTimeAgo(updatedAt);

  return (
    <div
      onClick={onClick}
      className="group relative cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm transition-all hover:shadow-md"
      style={{ borderLeftWidth: "4px", borderLeftColor: board.backgroundColor }}
    >
      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (window.confirm("Are you sure you want to delete this board?")) {
            onDelete();
          }
        }}
        className="absolute right-3 top-3 rounded-md p-1 text-[var(--muted-foreground)] opacity-0 transition-all hover:bg-[var(--destructive)]/10 hover:text-[var(--destructive)] group-hover:opacity-100"
        aria-label="Delete board"
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
          <path d="M3 6h18" />
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
        </svg>
      </button>

      {/* Title */}
      <h3 className="mb-1 pr-6 text-base font-semibold text-[var(--card-foreground)] line-clamp-1">
        {board.title}
      </h3>

      {/* Description preview */}
      {board.description && (
        <p className="mb-3 text-sm text-[var(--muted-foreground)] line-clamp-2">
          {board.description}
        </p>
      )}
      {!board.description && <div className="mb-3" />}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
        <span>Updated {timeAgo}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper: relative time
// ---------------------------------------------------------------------------

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function BoardsPage() {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: boards, isLoading, error } = useBoards();
  const createBoard = useCreateBoard();
  const deleteBoard = useDeleteBoard();

  const handleCreate = (data: {
    title: string;
    description?: string;
    backgroundColor?: string;
  }) => {
    createBoard.mutate(data, {
      onSuccess: () => setShowCreateModal(false),
    });
  };

  return (
    <div className="h-full bg-[var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center px-6 py-4">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            Your Boards
          </h1>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Error state */}
        {error && (
          <div className="mb-6 rounded-lg border border-[var(--destructive)]/30 bg-[var(--destructive)]/10 px-4 py-3 text-sm text-[var(--destructive)]">
            Failed to load boards: {error.message}
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {/* Board grid */}
        {!isLoading && boards && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {boards.map((board) => (
              <BoardCard
                key={board.id}
                board={board}
                onClick={() => router.push(`/boards/${board.id}`)}
                onDelete={() => deleteBoard.mutate(board.id)}
              />
            ))}

            {/* Create Board card */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[var(--border)] bg-transparent text-[var(--muted-foreground)] transition-all hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/5"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
              <span className="text-sm font-medium">Create Board</span>
            </button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && boards && boards.length === 0 && (
          <div className="mt-12 text-center">
            <p className="text-lg text-[var(--muted-foreground)]">
              No boards yet. Create your first board to get started.
            </p>
          </div>
        )}
      </main>

      {/* Create Board Modal */}
      {showCreateModal && (
        <CreateBoardModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreate}
          isLoading={createBoard.isPending}
        />
      )}
    </div>
  );
}
