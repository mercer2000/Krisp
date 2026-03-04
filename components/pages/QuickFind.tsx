"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchPages } from "@/lib/hooks/usePages";
import { useRouter } from "next/navigation";
import type { Page } from "@/types";

interface QuickFindProps {
  workspaceId: string;
  open: boolean;
  onClose: () => void;
}

export function QuickFind({ workspaceId, open, onClose }: QuickFindProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { data: results = [] } = useSearchPages(workspaceId, debouncedQuery);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 200);
    return () => clearTimeout(timer);
  }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      setDebouncedQuery("");
      setActiveIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Reset active index on results change
  useEffect(() => {
    setActiveIndex(0);
  }, [results]);

  const handleSelect = useCallback(
    (page: Page) => {
      router.push(`/workspace/${workspaceId}/${page.id}`);
      onClose();
    },
    [router, workspaceId, onClose]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === "Enter" && results[activeIndex]) {
      e.preventDefault();
      handleSelect(results[activeIndex]);
      return;
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />
      <div className="fixed left-1/2 top-[15%] z-50 w-full max-w-lg -translate-x-1/2 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-2xl">
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-[var(--muted-foreground)]">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages..."
            className="flex-1 bg-transparent text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] outline-none"
          />
          <kbd className="rounded border border-[var(--border)] bg-[var(--muted)] px-1.5 py-0.5 text-xs text-[var(--muted-foreground)]">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-auto py-1">
          {query && results.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-[var(--muted-foreground)]">
              No pages found
            </p>
          )}
          {results.map((page, i) => (
            <button
              key={page.id}
              className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors ${
                i === activeIndex
                  ? "bg-[var(--accent)]"
                  : "hover:bg-[var(--accent)]"
              }`}
              onClick={() => handleSelect(page)}
              onMouseEnter={() => setActiveIndex(i)}
            >
              <span className="text-base leading-none">
                {page.icon || (page.isDatabase ? "📊" : "📄")}
              </span>
              <span className="flex-1 truncate text-[var(--foreground)]">
                {page.title || "Untitled"}
              </span>
            </button>
          ))}
          {!query && (
            <p className="px-4 py-6 text-center text-sm text-[var(--muted-foreground)]">
              Type to search pages...
            </p>
          )}
        </div>
      </div>
    </>
  );
}

// Hook to register Cmd+K globally
export function useQuickFind() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return { open, setOpen };
}
