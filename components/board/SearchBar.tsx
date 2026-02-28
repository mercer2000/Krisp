"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchCards } from "@/lib/hooks/useSearch";
import type { Card } from "@/types";

interface Props {
  boardId: string;
  onCardSelect: (card: Card) => void;
}

export function SearchBar({ boardId, onCardSelect }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data: results, isLoading } = useSearchCards(boardId, query);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search cards..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="w-48 pl-9 pr-3 py-1.5 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent transition-all focus:w-64"
        />
      </div>

      {open && query.length >= 2 && (
        <div className="absolute top-full mt-1 w-80 max-h-64 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-lg z-50">
          {isLoading ? (
            <div className="p-3 text-sm text-[var(--muted-foreground)]">
              Searching...
            </div>
          ) : results && results.length > 0 ? (
            results.map((card) => (
              <button
                key={card.id}
                onClick={() => {
                  onCardSelect(card);
                  setOpen(false);
                  setQuery("");
                }}
                className="w-full text-left px-3 py-2 hover:bg-[var(--accent)] transition-colors border-b border-[var(--border)] last:border-b-0"
              >
                <div className="text-sm font-medium text-[var(--foreground)] truncate">
                  {card.title}
                </div>
                {card.description && (
                  <div className="text-xs text-[var(--muted-foreground)] truncate mt-0.5">
                    {card.description.slice(0, 80)}
                  </div>
                )}
              </button>
            ))
          ) : (
            <div className="p-3 text-sm text-[var(--muted-foreground)]">
              No cards found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
