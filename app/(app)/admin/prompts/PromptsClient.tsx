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

// ── Prompt Row ─────────────────────────────────────────

function PromptRow({ prompt, onClick }: { prompt: PromptEntry; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg border hover:bg-[var(--accent)]/50 transition-colors"
      style={{ borderColor: "var(--border)" }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-[var(--foreground)]">{prompt.name}</span>
          {prompt.isCustom ? (
            <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-amber-500/15 text-amber-600 dark:text-amber-400">Custom</span>
          ) : (
            <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">Default</span>
          )}
        </div>
        <p className="text-xs text-[var(--muted-foreground)] mt-0.5 truncate">{prompt.description}</p>
      </div>
      {prompt.updatedAt && (
        <span className="text-[10px] text-[var(--muted-foreground)] whitespace-nowrap flex-shrink-0">
          v{prompt.version} &middot; {new Date(prompt.updatedAt).toLocaleDateString()}
        </span>
      )}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><path d="m9 18 6-6-6-6" /></svg>
    </button>
  );
}

// ── Prompt Drawer ──────────────────────────────────────

function PromptDrawer({
  prompt,
  open,
  onClose,
  onSave,
  onReset,
}: {
  prompt: PromptEntry;
  open: boolean;
  onClose: () => void;
  onSave: (key: string, text: string) => Promise<void>;
  onReset: (key: string) => Promise<void>;
}) {
  const [editText, setEditText] = useState(prompt.activeText);
  const [saving, setSaving] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [enhancing, setEnhancing] = useState(false);

  useEffect(() => {
    setEditText(prompt.activeText);
    setShowConfirmReset(false);
    setShowHistory(false);
    setHistory([]);
    setToast(null);
  }, [prompt.key, prompt.activeText]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const hasChanges = editText !== prompt.activeText;
  const charCount = editText.length;
  const defaultLen = prompt.defaultText.length;
  const significantDeviation = prompt.isCustom && Math.abs(charCount - defaultLen) > defaultLen * 0.5;

  const handleSave = async () => {
    if (!editText.trim()) return;
    setSaving(true);
    try {
      await onSave(prompt.key, editText);
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
      setToast("Reset to default");
    } catch {
      setToast("Reset failed");
    } finally {
      setSaving(false);
    }
  };

  const loadHistory = async () => {
    if (showHistory) { setShowHistory(false); return; }
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

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />}
      <div
        className="fixed top-0 right-0 h-full w-full max-w-lg z-50 shadow-2xl transition-transform duration-300 ease-in-out overflow-y-auto"
        style={{
          backgroundColor: "var(--card)",
          borderLeft: "1px solid var(--border)",
          transform: open ? "translateX(0)" : "translateX(100%)",
        }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-[var(--accent)] transition-colors" title="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18" /><line x1="6" x2="18" y1="6" y2="18" /></svg>
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold truncate" style={{ color: "var(--foreground)" }}>{prompt.name}</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{prompt.description}</p>
          </div>
          {prompt.isCustom ? (
            <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 flex-shrink-0">Custom</span>
          ) : (
            <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex-shrink-0">Default</span>
          )}
        </div>

        <div className="px-5 py-5 space-y-4">
          {/* Deviation warning */}
          {significantDeviation && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <path d="M12 9v4" /><path d="M12 17h.01" />
              </svg>
              <span>This prompt deviates significantly from the default ({charCount} chars vs {defaultLen}). Large changes may affect AI behavior unexpectedly.</span>
            </div>
          )}

          {/* Editor */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Prompt Text</label>
              <button
                onClick={async () => {
                  if (!editText.trim()) return;
                  setEnhancing(true);
                  try {
                    const res = await fetch("/api/settings/prompts/enhance", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ text: editText, name: prompt.name, description: prompt.description }),
                    });
                    const data = await res.json();
                    if (res.ok && data.text) setEditText(data.text);
                    else setToast("Enhancement failed");
                  } catch { setToast("Enhancement failed"); }
                  finally { setEnhancing(false); }
                }}
                disabled={enhancing || !editText.trim()}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors disabled:opacity-40"
                style={{ color: "#8B5CF6" }}
                title="Use AI to improve this prompt's clarity, specificity, and effectiveness"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></svg>
                {enhancing ? "Enhancing..." : "Enhance with AI"}
              </button>
            </div>
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full min-h-[250px] p-3 rounded-lg border text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
              style={{ backgroundColor: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }}
              spellCheck={false}
            />
            <div className="flex items-center justify-between text-[11px] mt-1" style={{ color: "var(--muted-foreground)" }}>
              <span>{charCount.toLocaleString()} characters</span>
              <span>~{Math.ceil(charCount / 4).toLocaleString()} tokens</span>
            </div>
          </div>

          {/* Save / Discard */}
          {hasChanges && (
            <div className="flex items-center gap-2">
              <button onClick={handleSave} disabled={saving || !editText.trim()} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50" style={{ backgroundColor: "var(--primary)", color: "#fff" }}>
                <SaveIcon /> {saving ? "Saving..." : "Save Changes"}
              </button>
              <button onClick={() => setEditText(prompt.activeText)} className="px-3 py-2 text-sm rounded-md border transition-colors" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
                Discard
              </button>
            </div>
          )}

          <hr style={{ borderColor: "var(--border)" }} />

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {prompt.isCustom && (
              <>
                {showConfirmReset ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>Reset to factory default?</span>
                    <button onClick={handleReset} disabled={saving} className="px-2 py-1 text-xs font-medium rounded bg-red-500/15 text-red-600 dark:text-red-400 hover:bg-red-500/25 transition-colors">Confirm</button>
                    <button onClick={() => setShowConfirmReset(false)} className="px-2 py-1 text-xs hover:text-[var(--foreground)]" style={{ color: "var(--muted-foreground)" }}>Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setShowConfirmReset(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors hover:bg-[var(--accent)]" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
                    <ResetIcon /> Reset to Default
                  </button>
                )}
              </>
            )}

            <button onClick={loadHistory} disabled={loadingHistory} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors hover:bg-[var(--accent)] ml-auto" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
              <HistoryIcon /> {loadingHistory ? "Loading..." : showHistory ? "Hide History" : "History"}
            </button>
          </div>

          {/* Version history */}
          {showHistory && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Version History (last 5)</h4>
              {history.length === 0 ? (
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>No previous versions.</p>
              ) : (
                history.map((h) => (
                  <div key={h.id} className="flex items-start justify-between gap-3 p-2 rounded-lg border" style={{ borderColor: "var(--border)", backgroundColor: "var(--secondary)" }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs" style={{ color: "var(--muted-foreground)" }}>
                        <span>v{h.version}</span>
                        <span>&middot;</span>
                        <span>{new Date(h.createdAt).toLocaleString()}</span>
                      </div>
                      <pre className="text-xs font-mono mt-1 whitespace-pre-wrap max-h-[80px] overflow-hidden" style={{ color: "var(--foreground)" }}>
                        {h.promptText.slice(0, 200)}{h.promptText.length > 200 ? "..." : ""}
                      </pre>
                    </div>
                    <button
                      onClick={() => { setEditText(h.promptText); setShowHistory(false); }}
                      className="px-2 py-1 text-[10px] font-medium rounded border transition-colors hover:bg-[var(--accent)] whitespace-nowrap flex-shrink-0"
                      style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
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
            <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{toast}</div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Main Component ─────────────────────────────────────

export function PromptsClient({ userId }: { userId: string }) {
  const [prompts, setPrompts] = useState<PromptEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [editingKey, setEditingKey] = useState<string | null>(null);

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
  const filtered = filterCategory === "all" ? prompts : prompts.filter((p) => p.category === filterCategory);

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

  const editingPrompt = editingKey ? prompts.find((p) => p.key === editingKey) : null;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[var(--foreground)]">AI Prompts</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          View and customize the system prompts powering your AI features. Click any prompt to edit it. Changes take effect immediately.
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

      {/* Stats */}
      <div className="flex gap-4 text-xs text-[var(--muted-foreground)]">
        <span>{prompts.length} total prompts</span>
        <span>{prompts.filter((p) => p.isCustom).length} customized</span>
      </div>

      {/* Grouped prompt rows */}
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category} className="space-y-2">
          <h2 className="text-sm font-semibold text-[var(--foreground)] border-b border-[var(--border)] pb-2">{category}</h2>
          {items.map((prompt) => (
            <PromptRow key={prompt.key} prompt={prompt} onClick={() => setEditingKey(prompt.key)} />
          ))}
        </div>
      ))}

      {/* Edit drawer */}
      {editingPrompt && (
        <PromptDrawer
          prompt={editingPrompt}
          open={true}
          onClose={() => setEditingKey(null)}
          onSave={handleSave}
          onReset={handleReset}
        />
      )}
    </div>
  );
}
