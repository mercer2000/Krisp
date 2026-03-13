"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useUpdateBoard } from "@/lib/hooks/useBoard";
import { SearchBar } from "./SearchBar";
import type { Board, Priority } from "@/types";

// ---------------------------------------------------------------------------
// Filter Types
// ---------------------------------------------------------------------------

export type DueDateFilter = "all" | "overdue" | "due_soon" | "no_date";
export type BoardView = "kanban" | "list";

export interface BoardFilters {
  priority: Priority | "all";
  dueDate: DueDateFilter;
  view: BoardView;
  tag: string; // "all" or a specific tag label
}

// ---------------------------------------------------------------------------
// BoardHeader
// ---------------------------------------------------------------------------

interface BoardHeaderProps {
  board: Board;
  filters: BoardFilters;
  onFiltersChange: (filters: BoardFilters) => void;
  availableTags?: string[];
}

export function BoardHeader({ board, filters, onFiltersChange, availableTags = [] }: BoardHeaderProps) {
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
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md">
      {/* Top row: back button, title, search */}
      <div className="flex items-center gap-4 px-4 py-3">
        {/* Back arrow */}
        <Link
          href="/boards?list=1"
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

        {/* Search */}
        <SearchBar boardId={board.id} onCardSelect={() => {}} />

        {/* View switcher */}
        <div className="flex items-center rounded-lg border border-[var(--border)] bg-[var(--card)]">
          <button
            onClick={() => onFiltersChange({ ...filters, view: "kanban" })}
            className={`flex items-center gap-1 rounded-l-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
              filters.view === "kanban"
                ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
            title="Kanban view"
          >
            {/* Kanban icon */}
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="18" rx="1" />
              <rect x="14" y="3" width="7" height="10" rx="1" />
            </svg>
          </button>
          <button
            onClick={() => onFiltersChange({ ...filters, view: "list" })}
            className={`flex items-center gap-1 rounded-r-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
              filters.view === "list"
                ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
            title="List view"
          >
            {/* List icon */}
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 border-t border-[var(--border)]/50 px-4 py-2">
        <span className="text-xs font-medium text-[var(--muted-foreground)]">Filters:</span>

        {/* Priority filter */}
        <select
          value={filters.priority}
          onChange={(e) =>
            onFiltersChange({ ...filters, priority: e.target.value as Priority | "all" })
          }
          className="rounded-md border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-xs text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--ring)]"
        >
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {/* Due Date filter */}
        <select
          value={filters.dueDate}
          onChange={(e) =>
            onFiltersChange({ ...filters, dueDate: e.target.value as DueDateFilter })
          }
          className="rounded-md border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-xs text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--ring)]"
        >
          <option value="all">All Dates</option>
          <option value="overdue">Overdue</option>
          <option value="due_soon">Due Soon (7 days)</option>
          <option value="no_date">No Date</option>
        </select>

        {/* Tag / Page filter */}
        {availableTags.length > 0 && (
          <select
            value={filters.tag}
            onChange={(e) =>
              onFiltersChange({ ...filters, tag: e.target.value })
            }
            className="rounded-md border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-xs text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--ring)]"
          >
            <option value="all">All Tags</option>
            {availableTags.map((tag) => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        )}

        {/* Clear filters */}
        {(filters.priority !== "all" || filters.dueDate !== "all" || filters.tag !== "all") && (
          <button
            onClick={() => onFiltersChange({ ...filters, priority: "all", dueDate: "all", tag: "all" })}
            className="rounded-md px-2 py-1 text-xs text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
          >
            Clear
          </button>
        )}
      </div>
    </header>
  );
}
