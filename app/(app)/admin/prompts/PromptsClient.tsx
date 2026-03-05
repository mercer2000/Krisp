"use client";

import { useState, useEffect, useCallback } from "react";

// ── Types ──────────────────────────────────────────────

interface PromptEntry {
  key: string;
  name: string;
  description: string;
  category: string;
  defaultText: string;
  activeText: string;
  isCustom: boolean;
  version: number;
  updatedAt: string | null;
}

interface HistoryEntry {
  id: string;
  promptText: string;
  version: number;
  createdAt: string;
}

// ── Icons ──────────────────────────────────────────────

function ChevronDown({ open }: { open: boolean }) {
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
      className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

// ── Prompt Card ────────────────────────────────────────

function PromptCard({
  prompt,
  onSave,
  onReset,
}: {
  prompt: PromptEntry;
  onSave: (key: string, text: string) => Promise<void>;
  onReset: (key: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(prompt.activeText);
  const [saving, setSaving] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setEditText(prompt.activeText);
  }, [prompt.activeText]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const charCount = editText.length;
  const defaultLen = prompt.defaultText.length;
  const lengthDiff = Math.abs(charCount - defaultLen);
  const significantDeviation = prompt.isCustom && lengthDiff > defaultLen * 0.5;

  const handleSave = async () => {
    if (!editText.trim()) return;
    setSaving(true);
    try {
      await onSave(prompt.key, editText);
      setEditing(false);
      setToast("Saved");
    } catch {
      setToast("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setSaving(true);
    try {
      await onReset(prompt.key);
      setEditText(prompt.defaultText);
      setShowConfirmReset(false);
      setEditing(false);
      setToast("Reset to default");
    } catch {
      setToast("Reset failed");
    } finally {
      setSaving(false);
    }
  };

  const loadHistory = async () => {
    if (showHistory) {
      setShowHistory(false);
      return;
    }
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/settings/prompts/history?key=${prompt.key}`);
      const data = await res.json();
      setHistory(data.history ?? []);
      setShowHistory(true);
    } catch {
      setToast("Failed to load history");
    } finally {
      setLoadingHistory(false);
    }
  };

  const restoreVersion = (text: string) => {
    setEditText(text);
    setEditing(true);
    setShowHistory(false);
  };

  return (
    <div className="border border-[var(--border)] rounded-xl bg-[var(--card)] overflow-hidden">
      {/* Header - always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-[var(--accent)]/50 transition-colors"
      >
        <ChevronDown open={expanded} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-[var(--foreground)]">
              {prompt.name}
            </span>
            {prompt.isCustom ? (
              <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-amber-500/15 text-amber-600 dark:text-amber-400">
                Custom
              </span>
            ) : (
              <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                Default
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5 truncate">
            {prompt.description}
          </p>
        </div>
        {prompt.updatedAt && (
          <span className="text-[10px] text-[var(--muted-foreground)] whitespace-nowrap">
            v{prompt.version} &middot;{" "}
            {new Date(prompt.updatedAt).toLocaleDateString()}
          </span>
        )}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-[var(--border)] px-5 py-4 space-y-3">
          {/* Warning banner for significant deviation */}
          {significantDeviation && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
              </svg>
              <span>
                This prompt deviates significantly in length from the default ({charCount} chars vs {defaultLen} default). Large changes may affect AI behavior unexpectedly.
              </span>
            </div>
          )}

          {/* Prompt text area */}
          {editing ? (
            <div className="space-y-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full min-h-[200px] p-3 rounded-lg bg-[var(--secondary)] border border-[var(--border)] text-sm text-[var(--foreground)] font-mono resize-y focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                spellCheck={false}
              />
              <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                <span>{charCount.toLocaleString()} characters</span>
                <span>~{Math.ceil(charCount / 4).toLocaleString()} tokens (approx)</span>
              </div>
            </div>
          ) : (
            <div
              onClick={() => setEditing(true)}
              className="p-3 rounded-lg bg-[var(--secondary)] border border-[var(--border)] text-sm text-[var(--foreground)] font-mono whitespace-pre-wrap cursor-text max-h-[300px] overflow-y-auto"
            >
              {prompt.activeText}
            </div>
          )}

          {/* Action bar */}
          <div className="flex items-center gap-2 flex-wrap">
            {editing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving || !editText.trim()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--primary)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <SaveIcon />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={() => {
                    setEditText(prompt.activeText);
                    setEditing(false);
                  }}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--accent)] transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
              >
                Edit Prompt
              </button>
            )}

            {prompt.isCustom && (
              <>
                {showConfirmReset ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-[var(--muted-foreground)]">Reset to factory default?</span>
                    <button
                      onClick={handleReset}
                      disabled={saving}
                      className="px-2 py-1 text-xs font-medium rounded bg-red-500/15 text-red-600 dark:text-red-400 hover:bg-red-500/25 transition-colors"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setShowConfirmReset(false)}
                      className="px-2 py-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowConfirmReset(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--accent)] transition-colors"
                  >
                    <ResetIcon />
                    Reset to Default
                  </button>
                )}
              </>
            )}

            <button
              onClick={loadHistory}
              disabled={loadingHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--accent)] transition-colors ml-auto"
            >
              <HistoryIcon />
              {loadingHistory ? "Loading..." : showHistory ? "Hide History" : "History"}
            </button>
          </div>

          {/* Version history */}
          {showHistory && (
            <div className="border-t border-[var(--border)] pt-3 space-y-2">
              <h4 className="text-xs font-medium text-[var(--muted-foreground)]">
                Version History (last 5)
              </h4>
              {history.length === 0 ? (
                <p className="text-xs text-[var(--muted-foreground)]">No previous versions.</p>
              ) : (
                history.map((h) => (
                  <div
                    key={h.id}
                    className="flex items-start justify-between gap-3 p-2 rounded-lg bg-[var(--secondary)] border border-[var(--border)]"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                        <span>v{h.version}</span>
                        <span>&middot;</span>
                        <span>{new Date(h.createdAt).toLocaleString()}</span>
                      </div>
                      <pre className="text-xs font-mono text-[var(--foreground)] mt-1 whitespace-pre-wrap max-h-[80px] overflow-hidden">
                        {h.promptText.slice(0, 200)}
                        {h.promptText.length > 200 ? "..." : ""}
                      </pre>
                    </div>
                    <button
                      onClick={() => restoreVersion(h.promptText)}
                      className="px-2 py-1 text-[10px] font-medium rounded border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--accent)] transition-colors whitespace-nowrap flex-shrink-0"
                    >
                      Restore
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Toast */}
          {toast && (
            <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {toast}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────

export function PromptsClient({ userId }: { userId: string }) {
  const [prompts, setPrompts] = useState<PromptEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const fetchPrompts = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/prompts");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setPrompts(data.prompts);
    } catch {
      setError("Failed to load prompts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  const handleSave = async (key: string, text: string) => {
    const res = await fetch("/api/settings/prompts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, text }),
    });
    if (!res.ok) throw new Error("Save failed");
    await fetchPrompts();
  };

  const handleReset = async (key: string) => {
    const res = await fetch("/api/settings/prompts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
    if (!res.ok) throw new Error("Reset failed");
    await fetchPrompts();
  };

  const categories = ["all", ...new Set(prompts.map((p) => p.category))];
  const filtered =
    filterCategory === "all"
      ? prompts
      : prompts.filter((p) => p.category === filterCategory);

  // Group by category
  const grouped = filtered.reduce<Record<string, PromptEntry[]>>((acc, p) => {
    (acc[p.category] ??= []).push(p);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-[var(--muted-foreground)]">Loading prompts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[var(--foreground)]">
          AI & Prompts
        </h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          View and customize the system prompts powering your AI features. Changes take effect immediately.
        </p>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-1.5">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filterCategory === cat
                ? "bg-[var(--primary)] text-white"
                : "border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
            }`}
          >
            {cat === "all" ? "All Prompts" : cat}
          </button>
        ))}
      </div>

      {/* Stats bar */}
      <div className="flex gap-4 text-xs text-[var(--muted-foreground)]">
        <span>{prompts.length} total prompts</span>
        <span>{prompts.filter((p) => p.isCustom).length} customized</span>
      </div>

      {/* Grouped prompt cards */}
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category} className="space-y-3">
          <h2 className="text-sm font-semibold text-[var(--foreground)] border-b border-[var(--border)] pb-2">
            {category}
          </h2>
          {items.map((prompt) => (
            <PromptCard
              key={prompt.key}
              prompt={prompt}
              onSave={handleSave}
              onReset={handleReset}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
