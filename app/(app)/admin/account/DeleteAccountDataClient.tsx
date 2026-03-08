"use client";

import { useState, useCallback } from "react";
import { signOut } from "next-auth/react";

// ── Data categories ───────────────────────────────────────
const DATA_CATEGORIES = [
  {
    id: "inbox",
    label: "Inbox / Emails",
    description:
      "Messages, Gmail sync, Zoom chats, attachments, embeddings, smart labels, VIP contacts, newsletters, drafts, briefings, reviews",
  },
  {
    id: "kanban",
    label: "Kanban Boards",
    description: "Boards, columns, cards, tags, checklists",
  },
  {
    id: "meetings",
    label: "Meeting Transcripts",
    description: "Krisp webhooks, key points, speakers, action items linked to meetings",
  },
  {
    id: "brain",
    label: "Open Brain Memories",
    description: "Thoughts, vector embeddings, chat sessions, thought links, reminders",
  },
  {
    id: "pages",
    label: "Pages / Notes",
    description: "Workspaces, pages, blocks, database rows, page entries",
  },
  {
    id: "action_items",
    label: "Action Items",
    description: "All lifecycle states — open, in progress, completed, cancelled",
  },
  {
    id: "calendar",
    label: "Calendar Events",
    description: "Calendar events, sync state, Microsoft Graph subscriptions",
  },
  {
    id: "decisions",
    label: "Decisions",
    description: "Decision records, context, rationale, annotations",
  },
  {
    id: "settings",
    label: "Settings & Integrations",
    description:
      "OAuth tokens (Google, Outlook, Zoom), webhook secrets, outbound webhooks, Telegram bots, custom prompts, Zapier logs",
  },
] as const;

const CONFIRMATION_PHRASE = "DELETE MY DATA";

// ── Icons ─────────────────────────────────────────────────

function AlertTriangleIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

function LoaderIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="animate-spin"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────

export function DeleteAccountDataClient() {
  const allIds = DATA_CATEGORIES.map((c) => c.id);
  const [selected, setSelected] = useState<Set<string>>(new Set(allIds));
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    deletedCategories: string[];
    isFullWipe: boolean;
  } | null>(null);

  const phraseMatches =
    confirmText.trim().toUpperCase() === CONFIRMATION_PHRASE;
  const canSubmit = selected.size > 0 && phraseMatches && !loading;

  const toggleCategory = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) =>
      prev.size === allIds.length ? new Set() : new Set(allIds)
    );
  }, [allIds]);

  const handleDelete = useCallback(async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/account/delete-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categories: Array.from(selected),
          confirmationPhrase: confirmText.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.error || `Request failed with status ${res.status}`
        );
      }

      const data = await res.json();
      setResult(data);

      if (data.isFullWipe) {
        // Full wipe: sign out after a brief delay so user sees the message
        setTimeout(() => {
          signOut({ callbackUrl: "/login?deleted=1" });
        }, 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  }, [canSubmit, selected, confirmText]);

  // Post-deletion success screen
  if (result) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 text-green-500">
          <CheckIcon />
        </div>
        <h3 className="text-lg font-semibold text-[var(--foreground)]">
          Data Deleted Successfully
        </h3>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          The following categories have been permanently removed:
        </p>
        <ul className="mt-3 space-y-1">
          {result.deletedCategories.map((c) => (
            <li
              key={c}
              className="text-sm text-[var(--muted-foreground)]"
            >
              {c}
            </li>
          ))}
        </ul>
        {result.isFullWipe && (
          <p className="mt-4 text-sm font-medium text-[var(--foreground)]">
            All data has been removed. You will be signed out shortly.
          </p>
        )}
        {!result.isFullWipe && (
          <button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
          >
            Continue
          </button>
        )}
      </div>
    );
  }

  const selectedLabels = DATA_CATEGORIES.filter((c) =>
    selected.has(c.id)
  ).map((c) => c.label);

  return (
    <div className="space-y-6">
      {/* Danger zone header */}
      <div className="rounded-xl border-2 border-red-500/30 bg-red-500/5 p-6">
        <div className="flex items-center gap-3 text-red-500">
          <AlertTriangleIcon />
          <h2 className="text-lg font-bold">Danger Zone</h2>
        </div>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Permanently delete your account data. This action is{" "}
          <strong className="text-[var(--foreground)]">irreversible</strong>.
          Select which categories to delete below.
        </p>
      </div>

      {/* Category selection */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">
            Data Categories
          </h3>
          <button
            onClick={toggleAll}
            className="text-xs font-medium text-[var(--primary)] hover:underline"
          >
            {selected.size === allIds.length ? "Deselect All" : "Select All"}
          </button>
        </div>

        <div className="space-y-2">
          {DATA_CATEGORIES.map((cat) => {
            const checked = selected.has(cat.id);
            return (
              <label
                key={cat.id}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                  checked
                    ? "border-red-500/40 bg-red-500/5"
                    : "border-[var(--border)] bg-[var(--background)] hover:border-[var(--muted-foreground)]/30"
                }`}
              >
                <div className="mt-0.5">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleCategory(cat.id)}
                    className="sr-only"
                  />
                  <div
                    className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                      checked
                        ? "border-red-500 bg-red-500 text-white"
                        : "border-[var(--muted-foreground)]/40"
                    }`}
                  >
                    {checked && <CheckIcon />}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    {cat.label}
                  </span>
                  <p className="mt-0.5 text-xs text-[var(--muted-foreground)] leading-relaxed">
                    {cat.description}
                  </p>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Summary & confirmation */}
      {selected.size > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
          <div className="rounded-lg bg-red-500/5 border border-red-500/20 p-3">
            <p className="text-sm text-[var(--foreground)]">
              You are about to permanently delete:{" "}
              <strong>
                {selectedLabels.join(", ")}
              </strong>{" "}
              ({selected.size} {selected.size === 1 ? "category" : "categories"}{" "}
              selected)
            </p>
          </div>

          <div>
            <label
              htmlFor="confirm-phrase"
              className="block text-sm font-medium text-[var(--foreground)] mb-1.5"
            >
              Type{" "}
              <code className="rounded bg-red-500/10 px-1.5 py-0.5 text-xs font-bold text-red-500">
                {CONFIRMATION_PHRASE}
              </code>{" "}
              to confirm
            </label>
            <input
              id="confirm-phrase"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={CONFIRMATION_PHRASE}
              disabled={loading}
              autoComplete="off"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/50 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
              {error}
            </div>
          )}

          <button
            onClick={handleDelete}
            disabled={!canSubmit}
            className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all ${
              canSubmit
                ? "bg-red-600 hover:bg-red-700 active:scale-[0.98]"
                : "cursor-not-allowed bg-red-600/40"
            }`}
          >
            {loading ? (
              <>
                <LoaderIcon /> Deleting data...
              </>
            ) : (
              <>
                <TrashIcon /> Delete Selected Data
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
