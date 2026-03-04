"use client";

import { useState } from "react";
import {
  usePriorityReview,
  type PrioritySuggestion,
} from "@/lib/hooks/usePriorityReview";

// ---------------------------------------------------------------------------
// Priority helpers
// ---------------------------------------------------------------------------

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
  medium:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  urgent: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${PRIORITY_COLORS[priority] ?? PRIORITY_COLORS.medium}`}
    >
      {priority}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Suggestion Card
// ---------------------------------------------------------------------------

function SuggestionCard({
  suggestion,
  onAccept,
  onDismiss,
  isAccepting,
}: {
  suggestion: PrioritySuggestion;
  onAccept: () => void;
  onDismiss: () => void;
  isAccepting: boolean;
}) {
  const hasPriorityChange =
    suggestion.suggestedPriority !== suggestion.currentPriority;

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 transition-colors hover:border-[var(--primary)]/30">
      {/* Card title */}
      <p className="mb-2 text-sm font-medium text-[var(--card-foreground)] line-clamp-2">
        {suggestion.cardTitle}
      </p>

      {/* Priority change */}
      {hasPriorityChange && (
        <div className="mb-2 flex items-center gap-1.5 text-xs">
          <span className="text-[var(--muted-foreground)]">Priority:</span>
          <PriorityBadge priority={suggestion.currentPriority} />
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
            className="text-[var(--muted-foreground)]"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
          <PriorityBadge priority={suggestion.suggestedPriority} />
        </div>
      )}

      {/* Due date suggestion */}
      {suggestion.suggestedDueDate && (
        <div className="mb-2 flex items-center gap-1.5 text-xs">
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
            className="text-[var(--muted-foreground)]"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span className="text-[var(--muted-foreground)]">Suggested due:</span>
          <span className="font-medium text-[var(--card-foreground)]">
            {new Date(suggestion.suggestedDueDate + "T00:00:00").toLocaleDateString()}
          </span>
        </div>
      )}

      {/* Reason */}
      <p className="mb-3 text-xs leading-relaxed text-[var(--muted-foreground)]">
        {suggestion.reason}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onAccept}
          disabled={isAccepting}
          className="flex items-center gap-1 rounded-md bg-[var(--primary)] px-2.5 py-1 text-xs font-medium text-[var(--primary-foreground)] transition-colors hover:opacity-90 disabled:opacity-50"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Accept
        </button>
        <button
          onClick={onDismiss}
          className="flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
        >
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
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
          Dismiss
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Panel
// ---------------------------------------------------------------------------

export function PriorityReviewPanel({ boardId }: { boardId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const {
    suggestions,
    isAnalyzing,
    analyzeError,
    isAccepting,
    analyze,
    accept,
    dismiss,
  } = usePriorityReview(boardId);

  return (
    <div
      data-testid="priority-review-panel"
      className="flex flex-col border-l border-[var(--border)] bg-[var(--background)]"
      style={{ width: isOpen ? 340 : 48 }}
    >
      {/* Collapsed toggle button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex h-full w-full flex-col items-center justify-start gap-2 px-1 py-4 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
          title="Open Priority Review"
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
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
          </svg>
          <span
            className="text-[10px] font-medium tracking-wider"
            style={{ writingMode: "vertical-lr" }}
          >
            PRIORITY REVIEW
          </span>
          {suggestions.length > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--primary)] text-[10px] font-bold text-[var(--primary-foreground)]">
              {suggestions.length}
            </span>
          )}
        </button>
      )}

      {/* Expanded panel */}
      {isOpen && (
        <div className="flex h-full flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-2 border-b border-[var(--border)] px-3 py-3">
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
              className="shrink-0 text-[var(--primary)]"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
            </svg>
            <h2 className="flex-1 text-sm font-semibold text-[var(--foreground)]">
              Priority Review
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              className="flex h-6 w-6 items-center justify-center rounded text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
              title="Close panel"
            >
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
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Analyze button */}
          <div className="border-b border-[var(--border)] px-3 py-3">
            <button
              onClick={() => analyze()}
              disabled={isAnalyzing}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-3 py-2 text-sm font-medium text-[var(--primary-foreground)] transition-colors hover:opacity-90 disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Analyzing...
                </>
              ) : (
                <>
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
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  Analyze Priorities
                </>
              )}
            </button>
            <p className="mt-1.5 text-center text-[10px] text-[var(--muted-foreground)]">
              AI reviews cards against meetings, emails &amp; action items
            </p>
          </div>

          {/* Error */}
          {analyzeError && (
            <div className="mx-3 mt-3 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
              {analyzeError.message}
            </div>
          )}

          {/* Suggestions list */}
          <div className="flex-1 overflow-y-auto px-3 py-3">
            {suggestions.length === 0 && !isAnalyzing && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
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
                  className="mb-2 text-[var(--muted-foreground)]/50"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
                </svg>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Click &quot;Analyze Priorities&quot; to get AI-powered suggestions for your cards.
                </p>
              </div>
            )}

            {isAnalyzing && (
              <div className="flex flex-col items-center justify-center gap-3 py-8">
                <svg
                  className="h-8 w-8 animate-spin text-[var(--primary)]"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Analyzing your board...
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              {suggestions.map((suggestion) => (
                <SuggestionCard
                  key={suggestion.cardId}
                  suggestion={suggestion}
                  onAccept={() => accept(suggestion)}
                  onDismiss={() => dismiss(suggestion.cardId)}
                  isAccepting={isAccepting}
                />
              ))}
            </div>
          </div>

          {/* Footer summary */}
          {suggestions.length > 0 && (
            <div className="border-t border-[var(--border)] px-3 py-2">
              <p className="text-[10px] text-[var(--muted-foreground)]">
                {suggestions.length} suggestion{suggestions.length !== 1 ? "s" : ""} remaining
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
