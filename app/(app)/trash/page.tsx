"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { TrashItem, TrashItemType } from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TYPE_LABELS: Record<TrashItemType, string> = {
  card: "Card",
  action_item: "Action Item",
  email: "Email",
  meeting: "Meeting",
  decision: "Decision",
  page: "Page",
};

const TYPE_COLORS: Record<TrashItemType, string> = {
  card: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  action_item: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  email: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  meeting: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  decision: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  page: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300",
};

function formatDeletedDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function TrashIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function RestoreIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

function DeleteForeverIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
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
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function TrashPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<TrashItemType | "all">("all");
  const [confirmPurge, setConfirmPurge] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["trash"],
    queryFn: () => fetchJSON<{ items: TrashItem[] }>("/api/trash"),
  });

  const restoreMutation = useMutation({
    mutationFn: ({ id, type }: { id: string | number; type: TrashItemType }) =>
      fetchJSON(`/api/trash/${id}?type=${type}`, { method: "PATCH" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["trash"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, type }: { id: string | number; type: TrashItemType }) =>
      fetchJSON(`/api/trash/${id}?type=${type}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["trash"] }),
  });

  const purgeMutation = useMutation({
    mutationFn: () => fetchJSON("/api/trash/purge", { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trash"] });
      setConfirmPurge(false);
    },
  });

  const items = data?.items ?? [];
  const filtered = filter === "all" ? items : items.filter((i) => i.type === filter);

  const typeCounts = items.reduce(
    (acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="h-full bg-[var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="text-[var(--muted-foreground)]">
              <TrashIcon size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--foreground)]">Trash</h1>
              <p className="text-xs text-[var(--muted-foreground)]">
                Items are permanently deleted after 30 days
              </p>
            </div>
          </div>
          {items.length > 0 && (
            <div>
              {confirmPurge ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[var(--destructive)]">
                    Delete all {items.length} items?
                  </span>
                  <button
                    onClick={() => purgeMutation.mutate()}
                    disabled={purgeMutation.isPending}
                    className="rounded-lg bg-[var(--destructive)] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
                  >
                    {purgeMutation.isPending ? "Deleting..." : "Yes, delete all"}
                  </button>
                  <button
                    onClick={() => setConfirmPurge(false)}
                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)]"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmPurge(true)}
                  className="rounded-lg border border-[var(--destructive)]/30 px-3 py-1.5 text-sm font-medium text-[var(--destructive)] transition-colors hover:bg-[var(--destructive)]/10"
                >
                  Empty Trash
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-6">
        {/* Filter tabs */}
        {items.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                filter === "all"
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "bg-[var(--accent)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              All ({items.length})
            </button>
            {(["card", "action_item", "email", "meeting"] as const).map(
              (type) =>
                typeCounts[type] > 0 && (
                  <button
                    key={type}
                    onClick={() => setFilter(type)}
                    className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                      filter === type
                        ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                        : "bg-[var(--accent)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    {TYPE_LABELS[type]} ({typeCounts[type]})
                  </button>
                )
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg border border-[var(--destructive)]/30 bg-[var(--destructive)]/10 px-4 py-3 text-sm text-[var(--destructive)]">
            Failed to load trash: {error.message}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-lg border border-[var(--border)] bg-[var(--card)] p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="h-5 w-16 rounded-full bg-[var(--muted)]" />
                  <div className="h-4 w-48 rounded bg-[var(--muted)]" />
                  <div className="ml-auto h-4 w-24 rounded bg-[var(--muted)]" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Items list */}
        {!isLoading && filtered.length > 0 && (
          <div className="space-y-2">
            {filtered.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                className="group flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3 transition-colors hover:bg-[var(--accent)]/50"
              >
                {/* Type badge */}
                <span
                  className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[item.type]}`}
                >
                  {TYPE_LABELS[item.type]}
                </span>

                {/* Title */}
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--card-foreground)]">
                  {item.title}
                </span>

                {/* Days remaining */}
                <span className="shrink-0 text-xs text-[var(--muted-foreground)]">
                  {item.daysRemaining > 0
                    ? `${item.daysRemaining}d left`
                    : "Expiring soon"}
                </span>

                {/* Deleted date */}
                <span className="hidden shrink-0 text-xs text-[var(--muted-foreground)] sm:inline">
                  Deleted {formatDeletedDate(item.deletedAt)}
                </span>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() =>
                      restoreMutation.mutate({ id: item.id, type: item.type })
                    }
                    disabled={restoreMutation.isPending}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[var(--primary)] transition-colors hover:bg-[var(--primary)]/10"
                    title="Restore"
                  >
                    <RestoreIcon size={14} />
                    Restore
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm("Permanently delete this item? This cannot be undone.")) {
                        deleteMutation.mutate({ id: item.id, type: item.type });
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[var(--destructive)] transition-colors hover:bg-[var(--destructive)]/10"
                    title="Delete forever"
                  >
                    <DeleteForeverIcon size={14} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && items.length === 0 && (
          <div className="mt-16 flex flex-col items-center text-center">
            <div className="mb-4 text-[var(--muted-foreground)]">
              <TrashIcon size={48} />
            </div>
            <h2 className="mb-1 text-lg font-semibold text-[var(--foreground)]">
              Trash is empty
            </h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              Deleted items will appear here for 30 days before being permanently removed.
            </p>
          </div>
        )}

        {/* Filtered empty state */}
        {!isLoading && items.length > 0 && filtered.length === 0 && (
          <div className="mt-12 text-center">
            <p className="text-sm text-[var(--muted-foreground)]">
              No {TYPE_LABELS[filter as TrashItemType]?.toLowerCase() || ""} items in trash.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
