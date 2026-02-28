"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useUpdateBoard } from "@/lib/hooks/useBoard";
import type { Board } from "@/types";

// ---------------------------------------------------------------------------
// BoardHeader
// ---------------------------------------------------------------------------

interface BoardHeaderProps {
  board: Board;
}

export function BoardHeader({ board }: BoardHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(board.title);
  const inputRef = useRef<HTMLInputElement>(null);
  const updateBoard = useUpdateBoard(board.id);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== board.title) {
      updateBoard.mutate({ title: trimmed });
    } else {
      setEditTitle(board.title);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      setEditTitle(board.title);
      setIsEditing(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-[var(--border)] bg-[var(--background)]/80 px-4 py-3 backdrop-blur-md">
      {/* Back arrow */}
      <Link
        href="/boards"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
        aria-label="Back to boards"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
      </Link>

      {/* Board title (click to edit) */}
      <div className="min-w-0 flex-1">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="w-full max-w-md rounded-lg border border-[var(--input)] bg-[var(--background)] px-2 py-1 text-lg font-semibold text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--ring)] transition-shadow"
          />
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="max-w-md truncate rounded-lg px-2 py-1 text-lg font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--accent)]"
            title="Click to edit board title"
          >
            {board.title}
          </button>
        )}
      </div>

    </header>
  );
}
