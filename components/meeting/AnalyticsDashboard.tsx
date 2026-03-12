"use client";

import { useState, useEffect, useMemo } from "react";
import type {
  AnalyticsSummary,
  MeetingAnalytics,
  AnalyticsTrend,
  SpeakerTalkTime,
} from "@/types/analytics";

// ---------------------------------------------------------------------------
// SVG chart helpers
// ---------------------------------------------------------------------------

const CHART_COLORS = [
  "#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316",
];

function SentimentBadge({ value }: { value: number }) {
  const label =
    value > 0.15 ? "Positive" : value < -0.15 ? "Negative" : "Neutral";
  const color =
    value > 0.15
      ? "text-emerald-500"
      : value < -0.15
        ? "text-red-500"
        : "text-[var(--muted-foreground)]";
  return <span className={`text-sm font-medium ${color}`}>{label}</span>;
}

function MiniBar({
  value,
  max,
  color,
}: {
  value: number;
  max: number;
  color: string;
}) {
  const width = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="h-2 w-full rounded-full bg-[var(--secondary)]">
      <div
        className="h-2 rounded-full transition-all"
        style={{ width: `${width}%`, backgroundColor: color }}
      />
    </div>
  );
}

function TrendLineChart({
  data,
  dataKey,
  color,
  height = 120,
  label,
  formatY,
}: {
  data: AnalyticsTrend[];
  dataKey: "sentimentAvg" | "engagementAvg" | "meetingCount";
  color: string;
  height?: number;
  label: string;
  formatY?: (v: number) => string;
}) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-sm text-[var(--muted-foreground)]"
        style={{ height }}
      >
        No trend data yet
      </div>
    );
  }

  const values = data.map((d) => d[dataKey]);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;
  const padding = 30;
  const chartWidth = 400;
  const chartHeight = height - 20;

  const points = data.map((d, i) => {
    const x = padding + (i / Math.max(data.length - 1, 1)) * (chartWidth - padding * 2);
    const y = chartHeight - padding - ((d[dataKey] - minVal) / range) * (chartHeight - padding * 2);
    return { x, y, d };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  // Area fill
  const areaD = `${pathD} L ${points[points.length - 1].x} ${chartHeight - padding} L ${points[0].x} ${chartHeight - padding} Z`;

  return (
    <div>
      <div className="text-xs font-medium text-[var(--muted-foreground)] mb-2">
        {label}
      </div>
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full"
        style={{ height }}
      >
        {/* Area fill */}
        <path d={areaD} fill={color} opacity={0.1} />
        {/* Line */}
        <path d={pathD} fill="none" stroke={color} strokeWidth={2} />
        {/* Data points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={3} fill={color} />
            {/* Show value on hover via title */}
            <title>
              {p.d.date}: {formatY ? formatY(p.d[dataKey]) : p.d[dataKey]}
            </title>
          </g>
        ))}
        {/* X-axis labels */}
        {points.length <= 15 &&
          points.map((p, i) => (
            <text
              key={i}
              x={p.x}
              y={chartHeight - 5}
              textAnchor="middle"
              className="fill-[var(--muted-foreground)]"
              fontSize={9}
            >
              {p.d.date.slice(5)}
            </text>
          ))}
        {/* Y-axis labels */}
        <text
          x={5}
          y={padding}
          className="fill-[var(--muted-foreground)]"
          fontSize={9}
        >
          {formatY ? formatY(maxVal) : maxVal}
        </text>
        <text
          x={5}
          y={chartHeight - padding}
          className="fill-[var(--muted-foreground)]"
          fontSize={9}
        >
          {formatY ? formatY(minVal) : minVal}
        </text>
      </svg>
    </div>
  );
}

function DonutChart({
  slices,
  size = 100,
}: {
  slices: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const total = slices.reduce((s, sl) => s + sl.value, 0) || 1;
  const r = size / 2 - 6;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  let offset = 0;
  const arcs = slices.map((sl) => {
    const pct = sl.value / total;
    const dashLength = pct * circumference;
    const dashOffset = -offset;
    offset += dashLength;
    return { ...sl, dashLength, dashOffset, pct };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {arcs.map((arc, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={arc.color}
          strokeWidth={10}
          strokeDasharray={`${arc.dashLength} ${circumference - arc.dashLength}`}
          strokeDashoffset={arc.dashOffset}
          transform={`rotate(-90 ${cx} ${cy})`}
        >
          <title>
            {arc.label}: {Math.round(arc.pct * 100)}%
          </title>
        </circle>
      ))}
    </svg>
  );
}

function TalkTimeBar({
  speakers,
}: {
  speakers: SpeakerTalkTime[];
}) {
  if (speakers.length === 0) {
    return (
      <div className="text-sm text-[var(--muted-foreground)]">
        No speaker data
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {speakers.map((s, i) => (
        <div key={s.speaker} className="flex items-center gap-3">
          <div className="w-24 text-xs text-[var(--foreground)] truncate" title={s.speaker}>
            {s.speaker}
          </div>
          <div className="flex-1">
            <MiniBar value={s.percentage} max={100} color={CHART_COLORS[i % CHART_COLORS.length]} />
          </div>
          <div className="w-12 text-xs text-[var(--muted-foreground)] text-right">
            {s.percentage}%
          </div>
        </div>
      ))}
    </div>
  );
}

function ScoreGauge({ score, label }: { score: number; label: string }) {
  const r = 40;
  const circumference = Math.PI * r; // semicircle
  const progress = (score / 100) * circumference;
  const color =
    score >= 70 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex flex-col items-center">
      <svg width={100} height={60} viewBox="0 0 100 60">
        <path
          d="M 10 55 A 40 40 0 0 1 90 55"
          fill="none"
          stroke="var(--secondary)"
          strokeWidth={8}
          strokeLinecap="round"
        />
        <path
          d="M 10 55 A 40 40 0 0 1 90 55"
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
        />
        <text
          x={50}
          y={48}
          textAnchor="middle"
          className="fill-[var(--foreground)]"
          fontSize={18}
          fontWeight="bold"
        >
          {score}
        </text>
      </svg>
      <span className="text-xs text-[var(--muted-foreground)] mt-1">
        {label}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AnalyticsDashboard — embeddable analytics content (no page shell)
// ---------------------------------------------------------------------------

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMeeting, setSelectedMeeting] =
    useState<MeetingAnalytics | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch("/api/analytics");
        if (!res.ok) throw new Error("Failed to fetch analytics");
        const json = await res.json();
        setData(json);
      } catch {
        setError("Failed to load analytics data.");
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  const sentimentSlices = useMemo(() => {
    if (!data) return [];
    return [
      { label: "Positive", value: data.overallSentiment.positive, color: "#10b981" },
      { label: "Neutral", value: data.overallSentiment.neutral, color: "#94a3b8" },
      { label: "Negative", value: data.overallSentiment.negative, color: "#ef4444" },
    ];
  }, [data]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Unknown";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "--";
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="p-5 bg-[var(--card)] border border-[var(--border)] rounded-lg animate-pulse"
          >
            <div className="h-5 bg-[var(--secondary)] rounded w-3/4 mb-3" />
            <div className="h-20 bg-[var(--secondary)] rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <p className="text-[var(--destructive)]">{error || "No data available"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Subtitle */}
      <p className="text-sm text-[var(--muted-foreground)]">
        Sentiment trends, talk-time distribution, and engagement scores
        across {data.totalMeetings} meeting{data.totalMeetings !== 1 ? "s" : ""}
      </p>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Meetings */}
        <div className="p-5 bg-[var(--card)] border border-[var(--border)] rounded-lg">
          <div className="text-sm text-[var(--muted-foreground)] mb-1">
            Total Meetings
          </div>
          <div className="text-3xl font-bold text-[var(--foreground)]">
            {data.totalMeetings}
          </div>
        </div>

        {/* Overall Sentiment */}
        <div className="p-5 bg-[var(--card)] border border-[var(--border)] rounded-lg">
          <div className="text-sm text-[var(--muted-foreground)] mb-1">
            Overall Sentiment
          </div>
          <div className="flex items-center gap-3">
            <DonutChart slices={sentimentSlices} size={50} />
            <SentimentBadge value={data.overallSentiment.overall} />
          </div>
        </div>

        {/* Engagement Score */}
        <div className="p-5 bg-[var(--card)] border border-[var(--border)] rounded-lg">
          <div className="text-sm text-[var(--muted-foreground)] mb-1">
            Avg Engagement
          </div>
          <ScoreGauge score={data.overallEngagement} label="" />
        </div>

        {/* Top Speaker */}
        <div className="p-5 bg-[var(--card)] border border-[var(--border)] rounded-lg">
          <div className="text-sm text-[var(--muted-foreground)] mb-1">
            Most Active Speaker
          </div>
          {data.topSpeakers.length > 0 ? (
            <div>
              <div className="text-lg font-semibold text-[var(--foreground)] truncate">
                {data.topSpeakers[0].speaker}
              </div>
              <div className="text-xs text-[var(--muted-foreground)]">
                {data.topSpeakers[0].totalWords.toLocaleString()} words across{" "}
                {data.topSpeakers[0].meetingCount} meeting
                {data.topSpeakers[0].meetingCount !== 1 ? "s" : ""}
              </div>
            </div>
          ) : (
            <div className="text-sm text-[var(--muted-foreground)]">--</div>
          )}
        </div>
      </div>

      {/* Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 bg-[var(--card)] border border-[var(--border)] rounded-lg">
          <TrendLineChart
            data={data.trends}
            dataKey="sentimentAvg"
            color="#6366f1"
            height={160}
            label="Sentiment Over Time"
            formatY={(v) => (v >= 0 ? `+${v.toFixed(2)}` : v.toFixed(2))}
          />
        </div>
        <div className="p-5 bg-[var(--card)] border border-[var(--border)] rounded-lg">
          <TrendLineChart
            data={data.trends}
            dataKey="engagementAvg"
            color="#10b981"
            height={160}
            label="Engagement Over Time"
            formatY={(v) => `${Math.round(v)}`}
          />
        </div>
      </div>

      {/* Top Speakers & Meeting Count Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Speakers */}
        <div className="p-5 bg-[var(--card)] border border-[var(--border)] rounded-lg">
          <h3 className="text-sm font-medium text-[var(--foreground)] mb-4">
            Top Speakers (by word count)
          </h3>
          {data.topSpeakers.length > 0 ? (
            <div className="space-y-3">
              {data.topSpeakers.slice(0, 8).map((s, i) => (
                <div key={s.speaker} className="flex items-center gap-3">
                  <div className="w-28 text-xs text-[var(--foreground)] truncate" title={s.speaker}>
                    {s.speaker}
                  </div>
                  <div className="flex-1">
                    <MiniBar
                      value={s.totalWords}
                      max={data.topSpeakers[0].totalWords}
                      color={CHART_COLORS[i % CHART_COLORS.length]}
                    />
                  </div>
                  <div className="w-16 text-xs text-[var(--muted-foreground)] text-right">
                    {s.totalWords.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-[var(--muted-foreground)]">
              No speaker data available
            </div>
          )}
        </div>

        {/* Meeting Count Trend */}
        <div className="p-5 bg-[var(--card)] border border-[var(--border)] rounded-lg">
          <TrendLineChart
            data={data.trends}
            dataKey="meetingCount"
            color="#f59e0b"
            height={160}
            label="Meetings Per Day"
            formatY={(v) => `${Math.round(v)}`}
          />
        </div>
      </div>

      {/* Individual Meeting Breakdown */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
          Meeting Breakdown
        </h2>
        <div className="space-y-3">
          {data.meetings.map((m) => (
            <div
              key={m.meetingId}
              className={`p-4 bg-[var(--card)] border rounded-lg cursor-pointer transition-all ${
                selectedMeeting?.meetingId === m.meetingId
                  ? "border-[var(--primary)] ring-1 ring-[var(--primary)]"
                  : "border-[var(--border)] hover:border-[var(--muted-foreground)]"
              }`}
              onClick={() =>
                setSelectedMeeting(
                  selectedMeeting?.meetingId === m.meetingId ? null : m
                )
              }
            >
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <div className="flex-1 min-w-[200px]">
                  <div className="font-medium text-[var(--foreground)] leading-snug">
                    {m.meetingTitle || "Untitled Meeting"}
                  </div>
                  <div className="text-xs text-[var(--muted-foreground)] mt-0.5">
                    {formatDate(m.meetingDate)} &middot;{" "}
                    {formatDuration(m.duration)} &middot;{" "}
                    {m.participantCount} participant{m.participantCount !== 1 ? "s" : ""}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <SentimentBadge value={m.sentiment.overall} />
                  </div>
                  <div className="text-center">
                    <span
                      className={`text-sm font-medium ${
                        m.engagement.score >= 70
                          ? "text-emerald-500"
                          : m.engagement.score >= 40
                            ? "text-amber-500"
                            : "text-red-500"
                      }`}
                    >
                      {m.engagement.score}
                    </span>
                    <span className="text-xs text-[var(--muted-foreground)] ml-1">
                      engagement
                    </span>
                  </div>
                  <svg
                    className={`w-4 h-4 text-[var(--muted-foreground)] transition-transform ${
                      selectedMeeting?.meetingId === m.meetingId
                        ? "rotate-180"
                        : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>

              {/* Expanded detail */}
              {selectedMeeting?.meetingId === m.meetingId && (
                <div className="mt-4 pt-4 border-t border-[var(--border)] grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Sentiment Breakdown */}
                  <div>
                    <div className="text-xs font-medium text-[var(--muted-foreground)] mb-2">
                      Sentiment Breakdown
                    </div>
                    <div className="flex items-center gap-4">
                      <DonutChart
                        slices={[
                          {
                            label: "Positive",
                            value: m.sentiment.positive,
                            color: "#10b981",
                          },
                          {
                            label: "Neutral",
                            value: m.sentiment.neutral,
                            color: "#94a3b8",
                          },
                          {
                            label: "Negative",
                            value: m.sentiment.negative,
                            color: "#ef4444",
                          },
                        ]}
                        size={70}
                      />
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          Positive: {Math.round(m.sentiment.positive * 100)}%
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-slate-400" />
                          Neutral: {Math.round(m.sentiment.neutral * 100)}%
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-500" />
                          Negative: {Math.round(m.sentiment.negative * 100)}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Talk-Time Distribution */}
                  <div>
                    <div className="text-xs font-medium text-[var(--muted-foreground)] mb-2">
                      Talk-Time Distribution
                    </div>
                    <TalkTimeBar speakers={m.talkTime} />
                  </div>

                  {/* Engagement Factors */}
                  <div>
                    <div className="text-xs font-medium text-[var(--muted-foreground)] mb-2">
                      Engagement Factors
                    </div>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-xs mb-0.5">
                          <span className="text-[var(--muted-foreground)]">
                            Participant Balance
                          </span>
                          <span className="text-[var(--foreground)]">
                            {m.engagement.factors.participantBalance}
                          </span>
                        </div>
                        <MiniBar
                          value={m.engagement.factors.participantBalance}
                          max={100}
                          color="#6366f1"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-0.5">
                          <span className="text-[var(--muted-foreground)]">
                            Key Points Density
                          </span>
                          <span className="text-[var(--foreground)]">
                            {m.engagement.factors.keyPointsDensity}
                          </span>
                        </div>
                        <MiniBar
                          value={m.engagement.factors.keyPointsDensity}
                          max={100}
                          color="#f59e0b"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-0.5">
                          <span className="text-[var(--muted-foreground)]">
                            Duration Score
                          </span>
                          <span className="text-[var(--foreground)]">
                            {m.engagement.factors.duration}
                          </span>
                        </div>
                        <MiniBar
                          value={m.engagement.factors.duration}
                          max={100}
                          color="#10b981"
                        />
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-[var(--muted-foreground)]">
                      {m.keyPointsCount} key point{m.keyPointsCount !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {data.meetings.length === 0 && (
            <div className="text-center py-16">
              <svg
                className="w-16 h-16 mx-auto text-[var(--muted-foreground)]/30 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <h3 className="text-xl font-medium text-[var(--foreground)] mb-2">
                No Analytics Data Yet
              </h3>
              <p className="text-[var(--muted-foreground)] max-w-md mx-auto">
                Analytics will appear here once meeting data is available from
                Krisp webhooks.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
