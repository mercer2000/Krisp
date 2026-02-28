"use client";

import { useState } from "react";
import { useCreateColumn } from "@/lib/hooks/useColumns";

// ---------------------------------------------------------------------------
// AddColumnButton
// ---------------------------------------------------------------------------

interface AddColumnButtonProps {
  boardId: string;
}

export function AddColumnButton({ boardId }: AddColumnButtonProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const createColumn = useCreateColumn(boardId);

  const handleSubmit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;

    createColumn.mutate(
      { title: trimmed },
      {
        onSuccess: () => {
          setTitle("");
          setIsAdding(false);
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") {
      setTitle("");
      setIsAdding(false);
    }
  };

  const handleCancel = () => {
    setTitle("");
    setIsAdding(false);
  };

  if (isAdding) {
    return (
      <div className="flex w-72 shrink-0 flex-col gap-2 rounded-xl bg-slate-100 p-3 dark:bg-slate-800/50">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Column title..."
          autoFocus
          className="w-full rounded-lg border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none focus:ring-2 focus:ring-[var(--ring)] transition-shadow"
        />
        <div className="flex items-center gap-2">
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || createColumn.isPending}
            className="rounded-lg bg-[var(--primary)] px-3 py-1.5 text-sm font-medium text-[var(--primary-foreground)] transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createColumn.isPending ? "Adding..." : "Add Column"}
          </button>
          <button
            onClick={handleCancel}
            className="rounded-lg px-3 py-1.5 text-sm text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsAdding(true)}
      className="flex h-12 w-72 shrink-0 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--border)] text-[var(--muted-foreground)] transition-all hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/5"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
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
      <span className="text-sm font-medium">Add Column</span>
    </button>
  );
}
