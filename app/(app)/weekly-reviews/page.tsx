"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  WeeklyReview,
  TopicCluster,
  CrossDayPattern,
} from "@/types";

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatWeekLabel(start: string, end: string): string {
  return `${formatDate(start)} — ${formatDate(end)}`;
}

const STATUS_COLORS: Record<string, string> = {
  completed:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  generating:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  failed:
    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const PRIORITY_BADGE: Record<string, string> = {
  urgent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  medium: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  low: "bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400",
};

export default function WeeklyReviewsPage() {
  const [reviews, setReviews] = useState<WeeklyReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReview, setSelectedReview] = useState<WeeklyReview | null>(
    null
  );
  const [generating, setGenerating] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/weekly-reviews");
      if (!res.ok) throw new Error("Failed to fetch reviews");
      const data = await res.json();
      setReviews(data.reviews);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/weekly-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sendEmail: false }),
      });
      if (!res.ok) throw new Error("Failed to generate review");
      const data = await res.json();
      setReviews((prev) => [data.review, ...prev]);
      setSelectedReview(data.review);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate review"
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleSendEmail = async (id: string) => {
    setSendingEmail(true);
    try {
      const res = await fetch(`/api/weekly-reviews/${id}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to send email");
      // Refresh the review to get emailSentAt
      const detailRes = await fetch(`/api/weekly-reviews/${id}`);
      if (detailRes.ok) {
        const data = await detailRes.json();
        setReviews((prev) =>
          prev.map((r) => (r.id === id ? data.review : r))
        );
        setSelectedReview(data.review);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send email");
    } finally {
      setSendingEmail(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/weekly-reviews/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      setReviews((prev) => prev.filter((r) => r.id !== id));
      if (selectedReview?.id === id) setSelectedReview(null);
    } catch {
      setError("Failed to delete review");
    }
  };

  const topicClusters = (selectedReview?.topicClusters ?? []) as TopicCluster[];
  const crossDayPatterns = (selectedReview?.crossDayPatterns ??
    []) as CrossDayPattern[];
  const unresolvedItems = (selectedReview?.unresolvedActionItems ?? []) as Array<{
    id: string;
    title: string;
    priority: string;
    dueDate: string | null;
    assignee: string | null;
  }>;

  return (
    <div className="flex h-full flex-col bg-[var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--background)]">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-bold text-[var(--foreground)]">
              Weekly Reviews
            </h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              AI-generated synthesis of your meetings, emails, decisions, and
              action items
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
          >
            {generating ? "Generating..." : "+ Generate Review"}
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Review list */}
        <main className="w-[340px] flex-shrink-0 overflow-auto border-r border-[var(--border)] px-4 py-4">
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
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-lg border border-[var(--border)] bg-[var(--card)]"
                />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 text-4xl opacity-30">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M8 2v4" />
                  <path d="M16 2v4" />
                  <rect width="18" height="18" x="3" y="4" rx="2" />
                  <path d="M3 10h18" />
                  <path d="M10 14h4" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-[var(--foreground)]">
                No reviews yet
              </h3>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                Click &quot;Generate Review&quot; to create your first weekly
                synthesis.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {reviews.map((review) => (
                <button
                  key={review.id}
                  onClick={() => setSelectedReview(review)}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                    selectedReview?.id === review.id
                      ? "border-[var(--primary)] bg-[var(--primary)]/5"
                      : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      {formatWeekLabel(review.weekStart, review.weekEnd)}
                    </span>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        STATUS_COLORS[review.status] || STATUS_COLORS.completed
                      }`}
                    >
                      {review.status}
                    </span>
                  </div>
                  <div className="mt-1.5 flex gap-3 text-xs text-[var(--muted-foreground)]">
                    <span>{review.meetingCount} meetings</span>
                    <span>{review.emailCount} emails</span>
                    <span>{review.decisionCount} decisions</span>
                  </div>
                  {review.emailSentAt && (
                    <div className="mt-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                      Email sent
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </main>

        {/* Detail panel */}
        <section className="flex-1 overflow-auto px-6 py-6">
          {!selectedReview ? (
            <div className="flex h-full items-center justify-center text-sm text-[var(--muted-foreground)]">
              Select a review to view details
            </div>
          ) : selectedReview.status === "generating" ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="mb-3 text-2xl animate-spin inline-block">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                </div>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Generating review...
                </p>
              </div>
            </div>
          ) : selectedReview.status === "failed" ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-400">
                Review generation failed
              </h3>
              <p className="mt-1 text-sm text-red-600 dark:text-red-300">
                {selectedReview.synthesisReport || "Unknown error"}
              </p>
            </div>
          ) : (
            <div className="max-w-3xl space-y-6">
              {/* Review header */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[var(--foreground)]">
                  {formatWeekLabel(
                    selectedReview.weekStart,
                    selectedReview.weekEnd
                  )}
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSendEmail(selectedReview.id)}
                    disabled={sendingEmail}
                    className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--accent)] disabled:opacity-50"
                  >
                    {sendingEmail
                      ? "Sending..."
                      : selectedReview.emailSentAt
                      ? "Resend Email"
                      : "Send Email"}
                  </button>
                  <button
                    onClick={() => handleDelete(selectedReview.id)}
                    className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-800 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  {
                    label: "Meetings",
                    value: selectedReview.meetingCount,
                    color: "text-indigo-600 dark:text-indigo-400",
                  },
                  {
                    label: "Emails",
                    value: selectedReview.emailCount,
                    color: "text-indigo-600 dark:text-indigo-400",
                  },
                  {
                    label: "Decisions",
                    value: selectedReview.decisionCount,
                    color: "text-indigo-600 dark:text-indigo-400",
                  },
                  {
                    label: "Open Items",
                    value: selectedReview.actionItemCount,
                    color: "text-red-500",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 text-center"
                  >
                    <div className={`text-2xl font-bold ${stat.color}`}>
                      {stat.value}
                    </div>
                    <div className="text-xs text-[var(--muted-foreground)]">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Synthesis Report */}
              {selectedReview.synthesisReport && (
                <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
                  <h3 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
                    Synthesis
                  </h3>
                  <div className="space-y-3 text-sm leading-relaxed text-[var(--foreground)]">
                    {selectedReview.synthesisReport
                      .split("\n\n")
                      .map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}
                  </div>
                </div>
              )}

              {/* Topic Clusters */}
              {topicClusters.length > 0 && (
                <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
                  <h3 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
                    Topic Clusters
                  </h3>
                  <div className="space-y-4">
                    {topicClusters.map((cluster, i) => (
                      <div
                        key={i}
                        className="border-l-2 border-indigo-400 pl-4"
                      >
                        <h4 className="text-sm font-medium text-[var(--foreground)]">
                          {cluster.topic}
                        </h4>
                        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                          {cluster.summary}
                        </p>
                        {cluster.sources && cluster.sources.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {cluster.sources.map((src, j) => (
                              <span
                                key={j}
                                className="inline-block rounded bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                              >
                                {src.type}: {src.title}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cross-Day Patterns */}
              {crossDayPatterns.length > 0 && (
                <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
                  <h3 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
                    Cross-Day Patterns
                  </h3>
                  <div className="space-y-3">
                    {crossDayPatterns.map((pattern, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                          {pattern.occurrences}x
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[var(--foreground)]">
                            {pattern.pattern}
                          </p>
                          <p className="text-xs text-[var(--muted-foreground)]">
                            {pattern.details}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Unresolved Action Items */}
              {unresolvedItems.length > 0 && (
                <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
                  <h3 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
                    Unresolved Action Items
                  </h3>
                  <div className="space-y-2">
                    {unresolvedItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2"
                      >
                        <span
                          className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                            PRIORITY_BADGE[item.priority] ||
                            PRIORITY_BADGE.medium
                          }`}
                        >
                          {item.priority}
                        </span>
                        <span className="flex-1 text-sm text-[var(--foreground)]">
                          {item.title}
                        </span>
                        {item.dueDate && (
                          <span className="text-xs text-[var(--muted-foreground)]">
                            due {item.dueDate}
                          </span>
                        )}
                        {item.assignee && (
                          <span className="text-xs text-[var(--muted-foreground)]">
                            @ {item.assignee}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
