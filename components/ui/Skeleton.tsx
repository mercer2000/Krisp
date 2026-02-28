import React from "react";

// ---------------------------------------------------------------------------
// Base Skeleton
// ---------------------------------------------------------------------------

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={[
        "animate-pulse rounded-lg bg-[var(--muted)]",
        className,
      ].join(" ")}
    />
  );
}

// ---------------------------------------------------------------------------
// SkeletonCard – placeholder for a Kanban card
// ---------------------------------------------------------------------------

export function SkeletonCard() {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm space-y-3">
      {/* Title line */}
      <Skeleton className="h-4 w-3/4" />
      {/* Description lines */}
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
      {/* Footer row (avatar + badge) */}
      <div className="flex items-center justify-between pt-1">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-md" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SkeletonColumn – placeholder for an entire Kanban column
// ---------------------------------------------------------------------------

interface SkeletonColumnProps {
  /** Number of card placeholders to render. Default: 3 */
  cards?: number;
}

export function SkeletonColumn({ cards = 3 }: SkeletonColumnProps) {
  return (
    <div className="flex w-72 shrink-0 flex-col rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 space-y-3">
      {/* Column header */}
      <div className="flex items-center justify-between px-1">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-5 w-5 rounded-md" />
      </div>

      {/* Cards */}
      {Array.from({ length: cards }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
