"use client";

import { useState } from "react";
import { usePageEntries, useCreatePageEntry, useDeletePageEntry } from "@/lib/hooks/usePages";
import type { Page, PageEntry, PageEntryType } from "@/types";

const ENTRY_TYPE_LABELS: Record<PageEntryType, string> = {
  knowledge: "Knowledge",
  decision: "Decision",
  email_summary: "Email Summary",
  manual: "Note",
};

const ENTRY_TYPE_ICONS: Record<PageEntryType, string> = {
  knowledge: "🧠",
  decision: "⚖️",
  email_summary: "📧",
  manual: "📝",
};

const ENTRY_TYPE_COLORS: Record<PageEntryType, string> = {
  knowledge: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
  decision: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  email_summary: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  manual: "bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-400",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface PageEntriesViewProps {
  page: Page & { entries?: PageEntry[]; entryCount?: number };
}

export function PageEntriesView({ page }: PageEntriesViewProps) {
  const [filter, setFilter] = useState<string>("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<PageEntry | null>(null);

  const { data, isLoading } = usePageEntries(page.id, filter || undefined);
  const createEntry = useCreatePageEntry(page.id);
  const deleteEntry = useDeletePageEntry();

  const entries = data?.entries ?? page.entries ?? [];
  const total = data?.total ?? page.entryCount ?? 0;

  const defaultEntryType: PageEntryType =
    page.pageType === "knowledge" ? "knowledge" : page.pageType === "decisions" ? "decision" : "manual";

  // Add entry form state
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newType, setNewType] = useState<PageEntryType>(defaultEntryType);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() && !newContent.trim()) return;
    createEntry.mutate(
      {
        entry_type: newType,
        title: newTitle,
        content: newContent,
      },
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
    <div className="mt-6">
      {/* Smart rule indicator */}
      {page.smartRule && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3">
          <SparklesIcon />
          <div className="flex-1">
            <span className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
              Smart Rule
            </span>
            <p className="text-sm text-[var(--foreground)]">{page.smartRule}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {page.smartRuleFolderId && (
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700 dark:bg-sky-900/30 dark:text-sky-400">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
                </svg>
                {page.smartRuleFolderName || "Outlook"}
              </span>
            )}
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                page.smartActive
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-gray-100 text-gray-500 dark:bg-gray-800/50 dark:text-gray-400"
              }`}
            >
              {page.smartActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--muted-foreground)]">
            {total} {total === 1 ? "entry" : "entries"}
          </span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-xs text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
          >
            <option value="">All types</option>
            <option value="knowledge">Knowledge</option>
            <option value="decision">Decisions</option>
            <option value="email_summary">Email Summaries</option>
            <option value="manual">Notes</option>
          </select>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:opacity-90"
        >
          + Add Entry
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
          <div className="mb-3 text-4xl opacity-30">
            {page.pageType === "knowledge" ? "🧠" : page.pageType === "decisions" ? "⚖️" : "📄"}
          </div>
          <h3 className="text-base font-medium text-[var(--foreground)]">
            No entries yet
          </h3>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {page.smartRule
              ? "Entries will be added automatically when the AI matches content to this page's smart rule."
              : "Add entries manually or set up a smart rule to auto-collect content."}
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-4 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
          >
            Add First Entry
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
                    <span className="text-sm">{ENTRY_TYPE_ICONS[entry.entryType]}</span>
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${ENTRY_TYPE_COLORS[entry.entryType]}`}>
                      {ENTRY_TYPE_LABELS[entry.entryType]}
                    </span>
                    {entry.confidence != null && (
                      <span className="text-[10px] text-[var(--muted-foreground)]">
                        {entry.confidence}% match
                      </span>
                    )}
                  </div>
                  {entry.title && (
                    <p className="font-medium text-[var(--foreground)] leading-snug">
                      {entry.title}
                    </p>
                  )}
                  {entry.content && (
                    <p className="mt-1 text-sm text-[var(--muted-foreground)] line-clamp-2">
                      {entry.content}
                    </p>
                  )}
                </div>
                <span className="text-xs text-[var(--muted-foreground)] shrink-0">
                  {formatDate(entry.createdAt)}
                </span>
              </div>

              {/* Expanded detail */}
              {selectedEntry?.id === entry.id && (
                <div className="mt-3 border-t border-[var(--border)] pt-3">
                  {entry.content && (
                    <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap">
                      {entry.content}
                    </p>
                  )}
                  {entry.sourceType && (
                    <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                      Source: {entry.sourceType}
                      {entry.sourceId && ` (${entry.sourceId.slice(0, 8)}...)`}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(entry.id);
                      }}
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
              <h2 className="text-lg font-bold text-[var(--foreground)]">
                Add Entry
              </h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="rounded p-1 text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
              >
                <CloseIcon />
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                  Type
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as PageEntryType)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                >
                  <option value="knowledge">Knowledge</option>
                  <option value="decision">Decision</option>
                  <option value="email_summary">Email Summary</option>
                  <option value="manual">Note</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                  Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Entry title..."
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                  Content
                </label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Write your entry..."
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
                  {createEntry.isPending ? "Adding..." : "Add Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SparklesIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--primary)]">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
