"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type {
  WeeklyReview,
  TopicCluster,
  CrossDayPattern,
} from "@/types";

// ── Types for Plan & Assess ──────────────────────────────

interface WeeklyPlan {
  id: string;
  weekStart: string;
  weekEnd: string;
  bigThreeCardIds: string[];
  aiAssessment: string | null;
  userReflection: string | null;
  assessmentScore: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface AssessmentResult {
  score: number;
  bigThreeSummary: Array<{
    cardId: string;
    title: string;
    status: "completed" | "in_progress" | "not_started";
    note: string;
  }>;
  themeAdherence: Array<{
    date: string;
    theme: string;
    adherence: "high" | "medium" | "low";
    note: string;
  }>;
  highlights: string[];
  carryForward: Array<{
    cardId: string;
    title: string;
    reason: string;
  }>;
  narrative: string;
}

interface PlanSuggestion {
  suggestedBigThree: Array<{
    cardId: string;
    reason: string;
  }>;
  dailyThemes: Array<{
    date: string;
    theme: string;
    rationale: string;
  }>;
}

interface BoardCard {
  id: string;
  title: string;
  priority: string;
  dueDate: string | null;
  columnTitle: string;
}

// ── Helpers ──────────────────────────────────────────────

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

function getDayName(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
  });
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

const PRIORITY_ORDER: Record<string, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const ADHERENCE_COLORS: Record<string, string> = {
  high: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  low: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const BIG_THREE_STATUS_ICON: Record<string, { icon: string; color: string }> = {
  completed: { icon: "\u2713", color: "text-emerald-600 dark:text-emerald-400" },
  in_progress: { icon: "\u25CB", color: "text-blue-600 dark:text-blue-400" },
  not_started: { icon: "\u2717", color: "text-red-500 dark:text-red-400" },
};

/**
 * Try to extract structured data from a synthesisReport that contains raw JSON.
 */
function tryParseSynthesisJson(report: string | null | undefined): {
  topicClusters: TopicCluster[];
  crossDayPatterns: CrossDayPattern[];
  synthesisReport: string;
} | null {
  if (!report) return null;
  const cleaned = report
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed && typeof parsed === "object" && parsed.synthesisReport) {
      return parsed;
    }
  } catch {
    // not JSON
  }
  return null;
}

function getScoreColor(score: number): string {
  if (score >= 8) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 5) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-500 dark:text-red-400";
}

function getScoreRingColor(score: number): string {
  if (score >= 8) return "stroke-emerald-500";
  if (score >= 5) return "stroke-yellow-500";
  return "stroke-red-500";
}

// ── Score Sparkline (existing) ───────────────────────────

function ScoreSparkline({ scores }: { scores: Array<{ week: string; score: number }> }) {
  if (scores.length < 2) return null;

  const width = 200;
  const height = 40;
  const padding = 4;
  const maxScore = 10;

  const points = scores.map((s, i) => ({
    x: padding + (i / (scores.length - 1)) * (width - 2 * padding),
    y: height - padding - (s.score / maxScore) * (height - 2 * padding),
  }));

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const lastScore = scores[scores.length - 1];
  const scoreColor = lastScore.score >= 8 ? "#22c55e" : lastScore.score >= 5 ? "#eab308" : "#ef4444";

  return (
    <div className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2">
      <div className="flex flex-col items-center justify-center mr-1">
        <span className="text-xl font-bold" style={{ color: scoreColor }}>
          {lastScore.score}
        </span>
        <span className="text-[10px] text-[var(--muted-foreground)]">latest</span>
      </div>
      <svg width={width} height={height} className="shrink-0">
        <path d={pathD} fill="none" stroke={scoreColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={2.5} fill={scoreColor} />
        ))}
      </svg>
      <span className="text-xs text-[var(--muted-foreground)] whitespace-nowrap">
        Last {scores.length} weeks
      </span>
    </div>
  );
}

// ── Score Gauge Component ────────────────────────────────

function ScoreGauge({ score }: { score: number }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const pct = (score / 10) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-gray-200 dark:text-gray-700"
        />
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          strokeWidth="8"
          strokeDasharray={`${pct} ${circumference - pct}`}
          strokeDashoffset={circumference / 4}
          strokeLinecap="round"
          className={getScoreRingColor(score)}
          style={{ transition: "stroke-dasharray 0.5s ease" }}
        />
        <text
          x="50" y="50"
          textAnchor="middle"
          dominantBaseline="central"
          className={`text-2xl font-bold ${getScoreColor(score)}`}
          fill="currentColor"
          fontSize="24"
        >
          {score}
        </text>
      </svg>
      <span className="mt-1 text-xs text-[var(--muted-foreground)]">
        out of 10
      </span>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────

export default function WeeklyReviewsPage() {
  // Existing review state
  const [reviews, setReviews] = useState<WeeklyReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReview, setSelectedReview] = useState<WeeklyReview | null>(
    null
  );
  const [generating, setGenerating] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [scoreHistory, setScoreHistory] = useState<Array<{ week: string; score: number }>>([]);

  // Tab state
  const [activeTab, setActiveTab] = useState<"assess" | "review" | "plan">("review");

  // Assess tab state
  const [previousPlan, setPreviousPlan] = useState<WeeklyPlan | null>(null);
  const [assessmentData, setAssessmentData] = useState<AssessmentResult | null>(null);
  const [assessLoading, setAssessLoading] = useState(false);
  const [reflectionText, setReflectionText] = useState("");
  const [savingReflection, setSavingReflection] = useState(false);
  const [reflectionSaved, setReflectionSaved] = useState(false);

  // Plan tab state
  const [boardId, setBoardId] = useState<string | null>(null);
  const [allCards, setAllCards] = useState<BoardCard[]>([]);
  const [suggestions, setSuggestions] = useState<PlanSuggestion | null>(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [selectedBigThree, setSelectedBigThree] = useState<string[]>([]);
  const [editedThemes, setEditedThemes] = useState<
    Array<{ date: string; theme: string; rationale: string; suggestedCardIds?: string[] }>
  >([]);
  const [confirmingPlan, setConfirmingPlan] = useState(false);
  const [planConfirmed, setPlanConfirmed] = useState(false);

  // ── Fetch reviews ───────────────────────────────────────

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

  // Fetch score history from weekly plans
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/weekly-plans");
        if (!res.ok) return;
        const data = await res.json();
        const plans = Array.isArray(data.plans) ? data.plans : Array.isArray(data) ? data : [];
        const scored = plans
          .filter((p: { assessmentScore?: number | null; weekStart?: string }) => p.assessmentScore != null && p.weekStart)
          .map((p: { assessmentScore: number; weekStart: string }) => ({
            week: p.weekStart,
            score: p.assessmentScore,
          }))
          .sort((a: { week: string }, b: { week: string }) => a.week.localeCompare(b.week))
          .slice(-8);
        setScoreHistory(scored);
      } catch {
        // silently ignore — sparkline is optional
      }
    })();
  }, []);

  // ── Fetch previous plan (for Assess tab) ───────────────

  useEffect(() => {
    if (activeTab !== "assess") return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/weekly-plans");
        if (!res.ok) return;
        const data = await res.json();
        const plans: WeeklyPlan[] = Array.isArray(data.plans)
          ? data.plans
          : Array.isArray(data)
          ? data
          : [];
        // Most recent plan (already ordered by weekStart desc)
        const plan = plans[0] ?? null;
        if (!cancelled) {
          setPreviousPlan(plan);
          if (plan?.userReflection) {
            setReflectionText(plan.userReflection);
          } else {
            setReflectionText("");
          }
          setReflectionSaved(false);

          // Parse assessment data if it exists
          if (plan?.aiAssessment) {
            try {
              const parsed = JSON.parse(plan.aiAssessment);
              setAssessmentData(parsed);
            } catch {
              setAssessmentData(null);
            }
          } else {
            setAssessmentData(null);
          }
        }
      } catch {
        // Ignore errors fetching plans
      }
    })();
    return () => { cancelled = true; };
  }, [activeTab]);

  // ── Fetch board + cards (for Plan tab) ──────────────────

  useEffect(() => {
    if (activeTab !== "plan") return;
    let cancelled = false;
    (async () => {
      try {
        // Fetch user's first board
        const boardRes = await fetch("/api/v1/boards");
        if (!boardRes.ok) return;
        const boardsData = await boardRes.json();
        const firstBoard = boardsData[0];
        if (!firstBoard || cancelled) return;
        setBoardId(firstBoard.id);

        // Fetch cards from columns
        const colRes = await fetch(`/api/v1/boards/${firstBoard.id}/columns`);
        if (!colRes.ok || cancelled) return;
        const columnsData = await colRes.json();

        const fetchedCards: BoardCard[] = [];
        for (const col of columnsData) {
          if (col.cards) {
            for (const card of col.cards) {
              if (!card.archived && !card.deletedAt && !card.snoozedUntil) {
                fetchedCards.push({
                  id: card.id,
                  title: card.title,
                  priority: card.priority || "medium",
                  dueDate: card.dueDate || null,
                  columnTitle: col.title,
                });
              }
            }
          }
        }

        fetchedCards.sort(
          (a, b) =>
            (PRIORITY_ORDER[a.priority] ?? 3) -
            (PRIORITY_ORDER[b.priority] ?? 3)
        );

        if (!cancelled) setAllCards(fetchedCards);
      } catch {
        // Ignore errors
      }
    })();
    return () => { cancelled = true; };
  }, [activeTab]);

  // ── Review actions ──────────────────────────────────────

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

  // ── Assess actions ──────────────────────────────────────

  const handleGenerateAssessment = async (planId: string) => {
    setAssessLoading(true);
    try {
      const res = await fetch(`/api/weekly-plans/${planId}/assess`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to generate assessment");
      const data: AssessmentResult = await res.json();
      setAssessmentData(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate assessment"
      );
    } finally {
      setAssessLoading(false);
    }
  };

  const handleSaveReflection = async () => {
    if (!previousPlan) return;
    setSavingReflection(true);
    try {
      const res = await fetch(
        `/api/weekly-plans/${previousPlan.id}/reflection`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reflection: reflectionText }),
        }
      );
      if (!res.ok) throw new Error("Failed to save reflection");
      setReflectionSaved(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save reflection"
      );
    } finally {
      setSavingReflection(false);
    }
  };

  // ── Plan actions ────────────────────────────────────────

  const handleGetSuggestions = async () => {
    setSuggestionsLoading(true);
    try {
      const res = await fetch("/api/weekly-plans/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("Failed to get suggestions");
      const data: PlanSuggestion = await res.json();
      setSuggestions(data);
      // Pre-select the AI-suggested Big 3
      setSelectedBigThree(data.suggestedBigThree.map((s) => s.cardId));
      // Initialize editable themes
      setEditedThemes(
        data.dailyThemes.map((t) => ({
          date: t.date,
          theme: t.theme,
          rationale: t.rationale,
        }))
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to get suggestions"
      );
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const handleToggleBigThree = (cardId: string) => {
    setSelectedBigThree((prev) => {
      if (prev.includes(cardId)) {
        return prev.filter((id) => id !== cardId);
      }
      if (prev.length >= 3) return prev;
      return [...prev, cardId];
    });
  };

  const handleThemeEdit = (index: number, newTheme: string) => {
    setEditedThemes((prev) =>
      prev.map((t, i) => (i === index ? { ...t, theme: newTheme } : t))
    );
  };

  const handleConfirmPlan = async () => {
    if (!boardId || selectedBigThree.length === 0 || editedThemes.length === 0)
      return;
    setConfirmingPlan(true);
    try {
      const weekStart = editedThemes[0].date;
      const weekEnd = editedThemes[editedThemes.length - 1].date;

      // 1. Create the plan
      const createRes = await fetch("/api/weekly-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekStart,
          weekEnd,
          bigThreeCardIds: selectedBigThree,
          themes: editedThemes,
          weeklyReviewId: selectedReview?.id,
        }),
      });
      if (!createRes.ok) throw new Error("Failed to create plan");
      const { id: planId } = await createRes.json();

      // 2. Activate the plan
      const activateRes = await fetch(
        `/api/weekly-plans/${planId}/activate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ boardId }),
        }
      );
      if (!activateRes.ok) throw new Error("Failed to activate plan");

      setPlanConfirmed(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to confirm plan"
      );
    } finally {
      setConfirmingPlan(false);
    }
  };

  // ── Derived review data ─────────────────────────────────

  const parsedFromReport = useMemo(
    () =>
      selectedReview &&
      (selectedReview.topicClusters as TopicCluster[])?.length === 0
        ? tryParseSynthesisJson(selectedReview.synthesisReport)
        : null,
    [selectedReview]
  );

  const topicClusters = (
    parsedFromReport?.topicClusters ??
    selectedReview?.topicClusters ??
    []
  ) as TopicCluster[];
  const crossDayPatterns = (
    parsedFromReport?.crossDayPatterns ??
    selectedReview?.crossDayPatterns ??
    []
  ) as CrossDayPattern[];
  const synthesisText =
    parsedFromReport?.synthesisReport ?? selectedReview?.synthesisReport ?? "";
  const unresolvedItems = (selectedReview?.unresolvedActionItems ?? []) as Array<{
    id: string;
    title: string;
    priority: string;
    dueDate: string | null;
    assignee: string | null;
  }>;

  // ── Tab bar ─────────────────────────────────────────────

  const tabBar = (
    <div className="flex border-b border-gray-200 dark:border-gray-700">
      {(["assess", "review", "plan"] as const).map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`px-4 py-2 text-sm font-medium capitalize ${
            activeTab === tab
              ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );

  // ── Assess tab content ──────────────────────────────────

  const assessContent = !previousPlan ? (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-sm text-[var(--muted-foreground)]">
        No plan to assess yet. Start by creating your first weekly plan in the
        Plan tab.
      </p>
      <button
        onClick={() => setActiveTab("plan")}
        className="mt-4 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
      >
        Go to Plan
      </button>
    </div>
  ) : (
    <div className="max-w-3xl space-y-6">
      {/* Plan header */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-[var(--foreground)]">
          {formatWeekLabel(previousPlan.weekStart, previousPlan.weekEnd)}
        </h2>
        <span
          className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
            STATUS_COLORS[previousPlan.status] || "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
          }`}
        >
          {previousPlan.status}
        </span>
      </div>

      {/* Generate assessment if none exists */}
      {!assessmentData && !assessLoading && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 text-center">
          <p className="mb-4 text-sm text-[var(--muted-foreground)]">
            Generate an AI assessment of how last week went.
          </p>
          <button
            onClick={() => handleGenerateAssessment(previousPlan.id)}
            className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
          >
            Generate Assessment
          </button>
        </div>
      )}

      {/* Loading state */}
      {assessLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-3 inline-block animate-spin">
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
              Generating assessment...
            </p>
          </div>
        </div>
      )}

      {/* Assessment results */}
      {assessmentData && (
        <>
          {/* Score gauge */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
            <div className="flex items-center gap-6">
              <ScoreGauge score={assessmentData.score} />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-[var(--foreground)]">
                  Week Score
                </h3>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  {assessmentData.score >= 8
                    ? "Excellent week!"
                    : assessmentData.score >= 5
                    ? "Solid progress this week."
                    : "Room for improvement."}
                </p>
              </div>
            </div>
          </div>

          {/* Big 3 Summary */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
            <h3 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
              Big 3 Summary
            </h3>
            <div className="space-y-3">
              {assessmentData.bigThreeSummary.map((item) => {
                const statusInfo =
                  BIG_THREE_STATUS_ICON[item.status] ||
                  BIG_THREE_STATUS_ICON.not_started;
                return (
                  <div key={item.cardId} className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${statusInfo.color}`}
                    >
                      {statusInfo.icon}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[var(--foreground)]">
                        {item.title}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {item.note}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Narrative */}
          {assessmentData.narrative && (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
              <h3 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
                AI Analysis
              </h3>
              <div className="space-y-3 text-sm leading-relaxed text-[var(--foreground)]">
                {assessmentData.narrative.split("\n\n").map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>
          )}

          {/* Theme Adherence */}
          {assessmentData.themeAdherence.length > 0 && (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
              <h3 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
                Theme Adherence
              </h3>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {assessmentData.themeAdherence.map((entry) => (
                  <div
                    key={entry.date}
                    className="rounded-lg border border-[var(--border)] p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-[var(--muted-foreground)]">
                        {getDayName(entry.date)} {formatDate(entry.date)}
                      </span>
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          ADHERENCE_COLORS[entry.adherence] ||
                          ADHERENCE_COLORS.medium
                        }`}
                      >
                        {entry.adherence}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-[var(--foreground)]">
                      {entry.theme}
                    </p>
                    {entry.note && (
                      <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                        {entry.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Highlights */}
          {assessmentData.highlights && assessmentData.highlights.length > 0 && (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
              <h3 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
                Highlights
              </h3>
              <ul className="space-y-1.5">
                {assessmentData.highlights.map((h, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-[var(--foreground)]"
                  >
                    <span className="mt-1 block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-500" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* User Reflection */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
            <h3 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
              Your Reflection
            </h3>
            <textarea
              value={reflectionText}
              onChange={(e) => {
                setReflectionText(e.target.value);
                setReflectionSaved(false);
              }}
              placeholder="How did this week feel? What would you do differently?"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={4}
            />
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={handleSaveReflection}
                disabled={savingReflection || !reflectionText.trim()}
                className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
              >
                {savingReflection ? "Saving..." : "Save Reflection"}
              </button>
              {reflectionSaved && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400">
                  Saved successfully
                </span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );

  // ── Review tab content (existing detail) ────────────────

  const reviewContent = !selectedReview ? (
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
      <button
        onClick={() => handleDelete(selectedReview.id)}
        className="mt-4 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-800 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-900/20"
      >
        Delete
      </button>
    </div>
  ) : (
    <div className="max-w-3xl space-y-6">
      {/* Review header */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-[var(--foreground)]">
          {formatWeekLabel(selectedReview.weekStart, selectedReview.weekEnd)}
        </h2>
        <div className="flex gap-2 flex-shrink-0">
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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
      {synthesisText && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
          <h3 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
            Synthesis
          </h3>
          <div className="space-y-3 text-sm leading-relaxed text-[var(--foreground)]">
            {synthesisText.split("\n\n").map((p, i) => (
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
              <div key={i} className="border-l-2 border-indigo-400 pl-4">
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
                className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2"
              >
                <span
                  className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                    PRIORITY_BADGE[item.priority] || PRIORITY_BADGE.medium
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
  );

  // ── Plan tab content ────────────────────────────────────

  const planContent = planConfirmed ? (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-3 text-4xl text-emerald-500">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>
      <h3 className="text-lg font-bold text-[var(--foreground)]">
        Plan Activated!
      </h3>
      <p className="mt-2 text-sm text-[var(--muted-foreground)]">
        Your Big 3 cards have been moved to the Focus column and daily themes
        are set. Check your Kanban board to see the changes.
      </p>
    </div>
  ) : (
    <div className="max-w-3xl space-y-6">
      {/* Get Suggestions button */}
      {!suggestions && !suggestionsLoading && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 text-center">
          <p className="mb-4 text-sm text-[var(--muted-foreground)]">
            Let AI analyze your cards, calendar, and previous weeks to suggest
            priorities and daily themes.
          </p>
          <button
            onClick={handleGetSuggestions}
            disabled={suggestionsLoading}
            className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
          >
            Get AI Suggestions
          </button>
        </div>
      )}

      {/* Loading state */}
      {suggestionsLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-3 inline-block animate-spin">
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
              Generating suggestions...
            </p>
          </div>
        </div>
      )}

      {suggestions && (
        <>
          {/* Big 3 Picker */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">
                Big 3 Priorities
              </h3>
              <span className="text-xs text-[var(--muted-foreground)]">
                {selectedBigThree.length}/3 selected
              </span>
            </div>
            <p className="mb-3 text-xs text-[var(--muted-foreground)]">
              Select the 3 most important cards to focus on this week.
              AI-suggested items are pre-selected.
            </p>
            <div className="space-y-2 max-h-[400px] overflow-auto">
              {allCards.map((card) => {
                const isSelected = selectedBigThree.includes(card.id);
                const aiSuggested = suggestions.suggestedBigThree.some(
                  (s) => s.cardId === card.id
                );
                const reason = suggestions.suggestedBigThree.find(
                  (s) => s.cardId === card.id
                )?.reason;

                return (
                  <button
                    key={card.id}
                    onClick={() => handleToggleBigThree(card.id)}
                    disabled={!isSelected && selectedBigThree.length >= 3}
                    className={`w-full rounded-lg border p-3 text-left transition-colors ${
                      isSelected
                        ? "border-blue-400 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/20"
                        : "border-[var(--border)] bg-[var(--background)] hover:border-[var(--primary)]/50 disabled:opacity-40"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border text-xs ${
                          isSelected
                            ? "border-blue-500 bg-blue-500 text-white"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                      >
                        {isSelected && "\u2713"}
                      </div>
                      <span className="flex-1 text-sm font-medium text-[var(--foreground)]">
                        {card.title}
                      </span>
                      <span
                        className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                          PRIORITY_BADGE[card.priority] ||
                          PRIORITY_BADGE.medium
                        }`}
                      >
                        {card.priority}
                      </span>
                      {card.dueDate && (
                        <span className="text-[10px] text-[var(--muted-foreground)]">
                          due {card.dueDate}
                        </span>
                      )}
                    </div>
                    {aiSuggested && reason && (
                      <p className="mt-1 ml-7 text-xs text-blue-600 dark:text-blue-400">
                        AI: {reason}
                      </p>
                    )}
                  </button>
                );
              })}
              {allCards.length === 0 && (
                <p className="text-sm text-[var(--muted-foreground)] py-4 text-center">
                  No cards found. Create cards on your Kanban board first.
                </p>
              )}
            </div>
          </div>

          {/* Daily Themes Grid */}
          {editedThemes.length > 0 && (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
              <h3 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
                Daily Themes
              </h3>
              <p className="mb-3 text-xs text-[var(--muted-foreground)]">
                Each day has a focus theme. Click to edit a theme.
              </p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {editedThemes.map((theme, index) => (
                  <div
                    key={theme.date}
                    className="rounded-lg border border-[var(--border)] p-3"
                  >
                    <div className="mb-1 text-xs font-medium text-[var(--muted-foreground)]">
                      {getDayName(theme.date)} {formatDate(theme.date)}
                    </div>
                    <input
                      type="text"
                      value={theme.theme}
                      onChange={(e) =>
                        handleThemeEdit(index, e.target.value)
                      }
                      className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm font-medium text-[var(--foreground)] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    {theme.rationale && (
                      <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">
                        {theme.rationale}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confirm Plan */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => {
                setSuggestions(null);
                setSelectedBigThree([]);
                setEditedThemes([]);
              }}
              className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--accent)]"
            >
              Reset
            </button>
            <button
              onClick={handleConfirmPlan}
              disabled={
                confirmingPlan ||
                selectedBigThree.length === 0 ||
                editedThemes.length === 0
              }
              className="rounded-lg bg-[var(--primary)] px-6 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
            >
              {confirmingPlan ? "Activating..." : "Confirm Plan"}
            </button>
          </div>
        </>
      )}
    </div>
  );

  // ── Review list panel ───────────────────────────────────

  const reviewList = (
    <div className="space-y-2">
      {scoreHistory.length >= 2 && (
        <div className="mb-3">
          <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            Weekly Score Trend
          </h3>
          <ScoreSparkline scores={scoreHistory} />
        </div>
      )}

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
        reviews.map((review) => (
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
        ))
      )}
    </div>
  );

  // ── Render active tab content ───────────────────────────

  const activeContent =
    activeTab === "assess"
      ? assessContent
      : activeTab === "plan"
      ? planContent
      : reviewContent;

  return (
    <div className="flex h-full flex-col bg-[var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--background)]">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <div className="min-w-0">
            {/* On mobile, show back button when viewing detail */}
            <div className="flex items-center gap-2">
              {selectedReview && (
                <button
                  onClick={() => setSelectedReview(null)}
                  className="flex-shrink-0 rounded-lg p-1.5 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] md:hidden"
                  aria-label="Back to list"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
              )}
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-[var(--foreground)] sm:text-xl">
                  Weekly Reviews
                </h1>
                <p className="hidden text-sm text-[var(--muted-foreground)] sm:block">
                  AI-generated synthesis of your meetings, emails, decisions, and
                  action items
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex-shrink-0 rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50 sm:px-4 sm:py-2 sm:text-sm"
          >
            {generating ? "Generating..." : "+ Generate"}
          </button>
        </div>
      </header>

      {/* Main content - desktop: side-by-side, mobile: list or detail */}
      <div className="flex flex-1 overflow-hidden">
        {/* Review list - hidden on mobile when a review is selected */}
        <main
          className={`w-full flex-shrink-0 overflow-auto border-r border-[var(--border)] px-4 py-4 md:block md:w-[340px] ${
            selectedReview ? "hidden" : "block"
          }`}
        >
          {reviewList}
        </main>

        {/* Detail panel - hidden on mobile when no review is selected */}
        <section
          className={`flex-1 overflow-auto ${
            selectedReview ? "block" : "hidden md:block"
          }`}
        >
          {/* Tab bar */}
          <div className="sticky top-0 z-10 bg-[var(--background)] px-4 pt-4 sm:px-6 sm:pt-6">
            {tabBar}
          </div>
          {/* Tab content */}
          <div className="px-4 py-4 sm:px-6 sm:py-6">
            {activeContent}
          </div>
        </section>
      </div>
    </div>
  );
}
