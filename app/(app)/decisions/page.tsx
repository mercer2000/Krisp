"use client";

import { useState, useEffect, useCallback } from "react";
import type { Decision, DecisionStatus, DecisionCategory, Priority } from "@/types";

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const STATUS_COLORS: Record<DecisionStatus, string> = {
  active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  reconsidered: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  archived: "bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400",
};

const CATEGORY_COLORS: Record<DecisionCategory, string> = {
  technical: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  process: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  budget: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  strategic: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  other: "bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-400",
};

const PRIORITY_COLORS: Record<Priority, string> = {
  low: "text-gray-500",
  medium: "text-blue-500",
  high: "text-orange-500",
  urgent: "text-red-500",
};

export default function DecisionsPage() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Detail/Annotation panel
  const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null);
  const [annotationText, setAnnotationText] = useState("");
  const [saving, setSaving] = useState(false);

  // Manual creation
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    statement: "",
    context: "",
    rationale: "",
    category: "other" as DecisionCategory,
    priority: "medium" as Priority,
  });
  const [creating, setCreating] = useState(false);

  const fetchDecisions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (categoryFilter) params.set("category", categoryFilter);
      if (searchQuery) params.set("q", searchQuery);

      const res = await fetch(`/api/decisions?${params}`);
      if (!res.ok) throw new Error("Failed to fetch decisions");
      const data = await res.json();
      setDecisions(data.decisions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load decisions");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, searchQuery]);

  useEffect(() => {
    fetchDecisions();
  }, [fetchDecisions]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
  };

  const handleSaveAnnotation = async () => {
    if (!selectedDecision) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/decisions/${selectedDecision.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ annotation: annotationText }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const data = await res.json();
      setDecisions((prev) =>
        prev.map((d) => (d.id === data.decision.id ? data.decision : d))
      );
      setSelectedDecision(data.decision);
    } catch {
      setError("Failed to save annotation");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: DecisionStatus) => {
    try {
      const res = await fetch(`/api/decisions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update");
      const data = await res.json();
      setDecisions((prev) =>
        prev.map((d) => (d.id === data.decision.id ? data.decision : d))
      );
      if (selectedDecision?.id === id) {
        setSelectedDecision(data.decision);
      }
    } catch {
      setError("Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/decisions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setDecisions((prev) => prev.filter((d) => d.id !== id));
      if (selectedDecision?.id === id) {
        setSelectedDecision(null);
      }
    } catch {
      setError("Failed to delete decision");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.statement.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      if (!res.ok) throw new Error("Failed to create");
      const data = await res.json();
      setDecisions((prev) => [data.decision, ...prev]);
      setShowCreateForm(false);
      setCreateForm({
        statement: "",
        context: "",
        rationale: "",
        category: "other",
        priority: "medium",
      });
    } catch {
      setError("Failed to create decision");
    } finally {
      setCreating(false);
    }
  };

  const openDetail = (decision: Decision) => {
    setSelectedDecision(decision);
    setAnnotationText(decision.annotation || "");
  };

  return (
    <div className="flex h-full flex-col bg-[var(--background)]">
      {/* Pages integration banner */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--primary)]/5 px-6 py-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--primary)]">
          <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
        </svg>
        <span className="text-xs text-[var(--foreground)]">
          Decisions can now be organized into Pages with smart rules for auto-classification.
        </span>
        <a href="/workspace" className="ml-auto text-xs font-medium text-[var(--primary)] hover:underline">
          Open Pages
        </a>
      </div>
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--background)]">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-bold text-[var(--foreground)]">
              Decision Register
            </h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              Track decisions from meetings, emails, and manual entries
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
          >
            + New Decision
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-3 border-t border-[var(--border)] px-6 py-3">
          <form onSubmit={handleSearch} className="flex flex-1 gap-2">
            <input
              type="text"
              placeholder="Search decisions..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
            >
              Search
            </button>
          </form>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="reconsidered">Reconsidered</option>
            <option value="archived">Archived</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
          >
            <option value="">All Categories</option>
            <option value="technical">Technical</option>
            <option value="process">Process</option>
            <option value="budget">Budget</option>
            <option value="strategic">Strategic</option>
            <option value="other">Other</option>
          </select>

          {(searchQuery || statusFilter || categoryFilter) && (
            <button
              onClick={() => {
                setSearchInput("");
                setSearchQuery("");
                setStatusFilter("");
                setCategoryFilter("");
              }}
              className="text-sm text-[var(--muted-foreground)] underline hover:text-[var(--foreground)]"
            >
              Clear filters
            </button>
          )}
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Decision list */}
        <main className="flex-1 overflow-auto px-6 py-6">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
              {error}
              <button
                onClick={() => setError(null)}
                className="ml-2 font-medium underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-lg border border-[var(--border)] bg-[var(--card)]"
                />
              ))}
            </div>
          ) : decisions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 text-5xl opacity-30">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                  <path d="M20 3v4" />
                  <path d="M22 5h-4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-[var(--foreground)]">
                No decisions yet
              </h3>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Create a decision manually or extract them from meetings and emails.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {decisions.map((decision) => (
                <div
                  key={decision.id}
                  onClick={() => openDetail(decision)}
                  className={`cursor-pointer rounded-lg border bg-[var(--card)] p-4 transition-colors hover:border-[var(--muted-foreground)] ${
                    selectedDecision?.id === decision.id
                      ? "border-[var(--primary)] ring-1 ring-[var(--primary)]"
                      : "border-[var(--border)]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[var(--foreground)] leading-snug">
                        {decision.statement}
                      </p>
                      {decision.context && (
                        <p className="mt-1 text-sm text-[var(--muted-foreground)] line-clamp-2">
                          {decision.context}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2">
                      {decision.confidence != null && decision.confidence < 100 && (
                        <span className="text-xs text-[var(--muted-foreground)]">
                          {decision.confidence}%
                        </span>
                      )}
                      <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${PRIORITY_COLORS[decision.priority]}`}>
                        {decision.priority}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[decision.status]}`}
                    >
                      {decision.status}
                    </span>
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_COLORS[decision.category]}`}
                    >
                      {decision.category}
                    </span>

                    {decision.meetingTitle && (
                      <span className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17 18a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2" />
                          <rect width="18" height="18" x="3" y="4" rx="2" />
                          <circle cx="12" cy="10" r="2" />
                        </svg>
                        {decision.meetingTitle}
                      </span>
                    )}

                    {decision.emailId && (
                      <span className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 12h-6l-2 3H10l-2-3H2" />
                          <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
                        </svg>
                        From email
                      </span>
                    )}

                    {decision.extractionSource === "ai_detection" && (
                      <span className="inline-flex items-center gap-1 rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                        AI detected
                      </span>
                    )}

                    <span className="ml-auto text-xs text-[var(--muted-foreground)]">
                      {formatDate(decision.decisionDate || decision.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Detail panel */}
        {selectedDecision && (
          <aside className="w-[400px] flex-shrink-0 overflow-auto border-l border-[var(--border)] bg-[var(--card)] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--foreground)]">
                Decision Detail
              </h2>
              <button
                onClick={() => setSelectedDecision(null)}
                className="rounded p-1 text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Statement */}
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                  Decision
                </label>
                <p className="mt-1 text-sm font-medium text-[var(--foreground)]">
                  {selectedDecision.statement}
                </p>
              </div>

              {/* Status */}
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                  Status
                </label>
                <div className="mt-1 flex gap-1">
                  {(["active", "reconsidered", "archived"] as DecisionStatus[]).map(
                    (s) => (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(selectedDecision.id, s)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                          selectedDecision.status === s
                            ? STATUS_COLORS[s]
                            : "bg-[var(--accent)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                        }`}
                      >
                        {s}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Context */}
              {selectedDecision.context && (
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                    Context
                  </label>
                  <p className="mt-1 text-sm text-[var(--foreground)]">
                    {selectedDecision.context}
                  </p>
                </div>
              )}

              {/* Rationale */}
              {selectedDecision.rationale && (
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                    Rationale
                  </label>
                  <p className="mt-1 text-sm text-[var(--foreground)]">
                    {selectedDecision.rationale}
                  </p>
                </div>
              )}

              {/* Participants */}
              {selectedDecision.participants && selectedDecision.participants.length > 0 && (
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                    Participants
                  </label>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {selectedDecision.participants.map((p, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-[var(--accent)] px-2.5 py-0.5 text-xs text-[var(--foreground)]"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                    Category
                  </label>
                  <p className="mt-1">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_COLORS[selectedDecision.category]}`}>
                      {selectedDecision.category}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                    Priority
                  </label>
                  <p className={`mt-1 text-sm font-medium capitalize ${PRIORITY_COLORS[selectedDecision.priority]}`}>
                    {selectedDecision.priority}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                    Source
                  </label>
                  <p className="mt-1 text-sm text-[var(--foreground)]">
                    {selectedDecision.extractionSource === "ai_detection"
                      ? "AI Detected"
                      : "Manual"}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                    Date
                  </label>
                  <p className="mt-1 text-sm text-[var(--foreground)]">
                    {formatDate(selectedDecision.decisionDate || selectedDecision.createdAt)}
                  </p>
                </div>
              </div>

              {/* Source reference */}
              {selectedDecision.meetingTitle && (
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                    Source Meeting
                  </label>
                  <p className="mt-1 text-sm text-[var(--primary)]">
                    {selectedDecision.meetingTitle}
                  </p>
                </div>
              )}

              {/* Confidence */}
              {selectedDecision.confidence != null && (
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                    AI Confidence
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-2 flex-1 rounded-full bg-[var(--accent)]">
                      <div
                        className="h-2 rounded-full bg-[var(--primary)]"
                        style={{ width: `${selectedDecision.confidence}%` }}
                      />
                    </div>
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {selectedDecision.confidence}%
                    </span>
                  </div>
                </div>
              )}

              {/* Annotation */}
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                  Notes / Annotation
                </label>
                <textarea
                  value={annotationText}
                  onChange={(e) => setAnnotationText(e.target.value)}
                  placeholder="Add notes about this decision..."
                  rows={4}
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none"
                />
                <button
                  onClick={handleSaveAnnotation}
                  disabled={saving}
                  className="mt-2 rounded-lg bg-[var(--primary)] px-4 py-1.5 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Notes"}
                </button>
              </div>

              {/* Delete */}
              <div className="border-t border-[var(--border)] pt-4">
                <button
                  onClick={() => handleDelete(selectedDecision.id)}
                  className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  Delete this decision
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Create Decision Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-xl bg-[var(--card)] p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--foreground)]">
                Record a Decision
              </h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="rounded p-1 text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                  Decision Statement *
                </label>
                <input
                  type="text"
                  value={createForm.statement}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, statement: e.target.value })
                  }
                  placeholder="We decided to..."
                  required
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                  Context
                </label>
                <textarea
                  value={createForm.context}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, context: e.target.value })
                  }
                  placeholder="What prompted this decision?"
                  rows={2}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                  Rationale
                </label>
                <textarea
                  value={createForm.rationale}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, rationale: e.target.value })
                  }
                  placeholder="Why was this decision made?"
                  rows={2}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                    Category
                  </label>
                  <select
                    value={createForm.category}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        category: e.target.value as DecisionCategory,
                      })
                    }
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                  >
                    <option value="technical">Technical</option>
                    <option value="process">Process</option>
                    <option value="budget">Budget</option>
                    <option value="strategic">Strategic</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                    Priority
                  </label>
                  <select
                    value={createForm.priority}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        priority: e.target.value as Priority,
                      })
                    }
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--accent)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create Decision"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
