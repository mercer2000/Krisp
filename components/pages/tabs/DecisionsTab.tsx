"use client";

import { useState } from "react";
import { usePageEntries, useCreatePageEntry, useDeletePageEntry } from "@/lib/hooks/usePages";
import type { Page, PageEntry } from "@/types";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function DecisionsTab({ page }: { page: Page }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<PageEntry | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  const { data, isLoading } = usePageEntries(page.id, "decision");
  const createEntry = useCreatePageEntry(page.id);
  const deleteEntry = useDeletePageEntry();

  const entries = data?.entries ?? [];

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() && !newContent.trim()) return;
    createEntry.mutate(
      { entry_type: "decision", title: newTitle, content: newContent },
      {
        onSuccess: () => {
          setNewTitle("");
          setNewContent("");
          setShowAddForm(false);
        },
      },
    );
  };

  const handleDelete = (entryId: string) => {
    deleteEntry.mutate(entryId);
    if (selectedEntry?.id === entryId) setSelectedEntry(null);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Decisions</h2>
          <p className="text-xs text-[var(--muted-foreground)]">
            Key decisions made in the context of this page
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:opacity-90"
        >
          + Add Decision
        </button>
      </div>

      {/* Entry list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg border border-[var(--border)] bg-[var(--card)]" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-3 text-4xl opacity-30">⚖️</div>
          <h3 className="text-base font-medium text-[var(--foreground)]">No decisions recorded yet</h3>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {page.smartRule
              ? "Decisions will be added automatically when AI matches content."
              : "Record decisions manually or set up a smart rule to auto-collect."}
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-4 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
          >
            Record First Decision
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.id}
              onClick={() => setSelectedEntry(selectedEntry?.id === entry.id ? null : entry)}
              className={`cursor-pointer rounded-lg border bg-[var(--card)] p-4 transition-colors hover:border-[var(--muted-foreground)] ${
                selectedEntry?.id === entry.id
                  ? "border-[var(--primary)] ring-1 ring-[var(--primary)]"
                  : "border-[var(--border)]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">⚖️</span>
                    <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                      Decision
                    </span>
                    {entry.confidence != null && (
                      <span className="text-[10px] text-[var(--muted-foreground)]">
                        {entry.confidence}% match
                      </span>
                    )}
                  </div>
                  {entry.title && (
                    <p className="font-medium text-[var(--foreground)] leading-snug">{entry.title}</p>
                  )}
                  {entry.content && (
                    <p className="mt-1 text-sm text-[var(--muted-foreground)] line-clamp-2">{entry.content}</p>
                  )}
                </div>
                <span className="text-xs text-[var(--muted-foreground)] shrink-0">
                  {formatDate(entry.createdAt)}
                </span>
              </div>

              {selectedEntry?.id === entry.id && (
                <div className="mt-3 border-t border-[var(--border)] pt-3">
                  {entry.content && (
                    <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap">{entry.content}</p>
                  )}
                  {entry.sourceType && (
                    <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                      Source: {entry.sourceType}
                      {entry.sourceId && ` (${entry.sourceId.slice(0, 8)}...)`}
                    </p>
                  )}
                  <div className="mt-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(entry.id); }}
                      className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Entry Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-xl bg-[var(--card)] p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--foreground)]">Record a Decision</h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="rounded p-1 text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Decision</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="What was decided?"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Context & Rationale</label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Why was this decision made? What alternatives were considered?"
                  rows={5}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--accent)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createEntry.isPending}
                  className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
                >
                  {createEntry.isPending ? "Recording..." : "Record Decision"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
