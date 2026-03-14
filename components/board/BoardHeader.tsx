"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUpdateBoard, useBoards } from "@/lib/hooks/useBoard";
import { SearchBar } from "./SearchBar";
import type { Board, Priority } from "@/types";

// ---------------------------------------------------------------------------
// Daily Theme Types & Hook
// ---------------------------------------------------------------------------

interface DailyTheme {
  id: string;
  theme: string;
  date: string;
  aiRationale: string | null;
  suggestedCardIds: string[];
}

function useTodayTheme() {
  const [theme, setTheme] = useState<DailyTheme | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/daily-themes/today")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data && data.id) setTheme(data);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return theme;
}

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
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [showBoardSwitcher, setShowBoardSwitcher] = useState(false);
  const [themeExpanded, setThemeExpanded] = useState(false);
  const todayTheme = useTodayTheme();
  const [editTitle, setEditTitle] = useState(board.title);
  const inputRef = useRef<HTMLInputElement>(null);
  const switcherRef = useRef<HTMLDivElement>(null);
  const updateBoard = useUpdateBoard(board.id);
  const { data: allBoards } = useBoards();

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Close board switcher on click outside
  useEffect(() => {
    if (!showBoardSwitcher) return;
    const handleClick = (e: MouseEvent) => {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setShowBoardSwitcher(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showBoardSwitcher]);

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

        {/* Board title (click to edit) + board switcher dropdown */}
        <div className="relative min-w-0 flex-1" ref={switcherRef}>
          <div className="flex items-center gap-1">
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
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="max-w-md truncate rounded-lg px-2 py-1 text-lg font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--accent)]"
                  title="Click to edit board title"
                >
                  {board.title}
                </button>
                {/* Board switcher chevron */}
                <button
                  onClick={() => setShowBoardSwitcher(!showBoardSwitcher)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
                  aria-label="Switch board"
                  title="Switch board"
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
                    className={`transition-transform ${showBoardSwitcher ? "rotate-180" : ""}`}
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
              </>
            )}
          </div>

          {/* Board switcher dropdown */}
          {showBoardSwitcher && allBoards && allBoards.length > 1 && (
            <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-lg border border-[var(--border)] bg-[var(--card)] py-1 shadow-lg">
              {allBoards
                .filter((b) => b.id !== board.id)
                .map((b) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      setShowBoardSwitcher(false);
                      router.push(`/boards/${b.id}`);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--accent)]"
                  >
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: b.backgroundColor }}
                    />
                    <span className="truncate">{b.title}</span>
                  </button>
                ))}
            </div>
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

      {/* Daily theme banner */}
      {todayTheme && (
        <div className="border-t border-[var(--border)]/50">
          <button
            onClick={() => setThemeExpanded(!themeExpanded)}
            className="flex w-full items-center gap-2 border-l-4 border-blue-500 bg-blue-50 px-4 py-2 text-left transition-colors hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30"
          >
            {/* Target icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0 text-blue-500"
            >
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
            </svg>
            <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
              Today&apos;s Theme:
            </span>
            <span className="text-xs font-semibold text-blue-900 dark:text-blue-100">
              {todayTheme.theme}
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`ml-auto shrink-0 text-blue-400 transition-transform ${themeExpanded ? "rotate-180" : ""}`}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          {themeExpanded && (
            <div className="border-l-4 border-blue-500 bg-blue-50/50 px-4 py-2 dark:bg-blue-900/10">
              {todayTheme.aiRationale && (
                <p className="mb-2 text-xs text-[var(--muted-foreground)] italic">
                  {todayTheme.aiRationale}
                </p>
              )}
              {todayTheme.suggestedCardIds.length > 0 && (
                <div className="space-y-1">
                  <span className="text-xs font-medium text-[var(--muted-foreground)]">
                    Suggested tasks ({todayTheme.suggestedCardIds.length}):
                  </span>
                  {todayTheme.suggestedCardIds.map((cardId) => (
                    <div
                      key={cardId}
                      className="flex items-center gap-2 rounded-md bg-white/60 px-2 py-1 text-xs text-[var(--foreground)] dark:bg-slate-800/40"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                      <span className="truncate font-mono text-[10px] text-[var(--muted-foreground)]">
                        {cardId.slice(0, 8)}...
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {todayTheme.suggestedCardIds.length === 0 && !todayTheme.aiRationale && (
                <p className="text-xs text-[var(--muted-foreground)]">
                  No additional details for today&apos;s theme.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
