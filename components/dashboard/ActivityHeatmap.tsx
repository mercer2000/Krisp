"use client";

import { useState, useEffect, useMemo, useCallback } from "react";

interface DayActivity {
  date: string;
  total: number;
  cards: number;
  meetings: number;
  emails: number;
  thoughts: number;
}

const CELL_SIZE = 13;
const CELL_GAP = 3;
const CELL_STEP = CELL_SIZE + CELL_GAP;
const ROWS = 7; // days in a week
const MONTH_LABEL_HEIGHT = 16;
const DAY_LABEL_WIDTH = 28;

const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

function getLevel(count: number, max: number): number {
  if (count === 0) return 0;
  if (max === 0) return 0;
  const ratio = count / max;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

const LEVEL_COLORS_LIGHT = [
  "var(--heatmap-0, #ebedf0)",
  "var(--heatmap-1, #9be9a8)",
  "var(--heatmap-2, #40c463)",
  "var(--heatmap-3, #30a14e)",
  "var(--heatmap-4, #216e39)",
];

const LEVEL_COLORS_DARK = [
  "var(--heatmap-0, #161b22)",
  "var(--heatmap-1, #0e4429)",
  "var(--heatmap-2, #006d32)",
  "var(--heatmap-3, #26a641)",
  "var(--heatmap-4, #39d353)",
];

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ActivityHeatmap() {
  const [days, setDays] = useState<DayActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<{
    day: DayActivity;
    x: number;
    y: number;
  } | null>(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/dashboard/heatmap");
        if (!res.ok) return;
        const json = await res.json();
        setDays(json.days ?? []);
      } catch {
        // silent fail
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(
      document.documentElement.classList.contains("dark") || mq.matches
    );
    const handler = () =>
      setIsDark(
        document.documentElement.classList.contains("dark") || mq.matches
      );
    mq.addEventListener("change", handler);
    const observer = new MutationObserver(handler);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => {
      mq.removeEventListener("change", handler);
      observer.disconnect();
    };
  }, []);

  const levelColors = isDark ? LEVEL_COLORS_DARK : LEVEL_COLORS_LIGHT;

  const { weeks, monthLabels, maxCount, totalActivity } = useMemo(() => {
    if (days.length === 0)
      return { weeks: [], monthLabels: [], maxCount: 0, totalActivity: 0 };

    // Group days into weeks (columns). Each week starts on Sunday.
    const grouped: DayActivity[][] = [];
    let currentWeek: DayActivity[] = [];

    for (let i = 0; i < days.length; i++) {
      const d = new Date(days[i].date + "T00:00:00");
      const dayOfWeek = d.getDay(); // 0=Sun

      if (dayOfWeek === 0 && currentWeek.length > 0) {
        grouped.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(days[i]);
    }
    if (currentWeek.length > 0) grouped.push(currentWeek);

    // Month labels
    const labels: { label: string; col: number }[] = [];
    let lastMonth = -1;
    for (let col = 0; col < grouped.length; col++) {
      const firstDay = grouped[col][0];
      const month = new Date(firstDay.date + "T00:00:00").getMonth();
      if (month !== lastMonth) {
        labels.push({
          label: new Date(firstDay.date + "T00:00:00").toLocaleDateString(
            "en-US",
            { month: "short" }
          ),
          col,
        });
        lastMonth = month;
      }
    }

    let max = 0;
    let total = 0;
    for (const day of days) {
      if (day.total > max) max = day.total;
      total += day.total;
    }

    return {
      weeks: grouped,
      monthLabels: labels,
      maxCount: max,
      totalActivity: total,
    };
  }, [days]);

  const handleMouseEnter = useCallback(
    (day: DayActivity, e: React.MouseEvent) => {
      const rect = (e.target as SVGElement).getBoundingClientRect();
      setTooltip({ day, x: rect.left + rect.width / 2, y: rect.top });
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-[140px] bg-[var(--secondary)] rounded" />
      </div>
    );
  }

  const svgWidth = DAY_LABEL_WIDTH + weeks.length * CELL_STEP;
  const svgHeight = MONTH_LABEL_HEIGHT + ROWS * CELL_STEP;

  return (
    <div data-testid="activity-heatmap">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-[var(--muted-foreground)]">
          {totalActivity} activities in the last year
        </p>
      </div>
      <div className="overflow-x-auto">
        <svg
          width={svgWidth}
          height={svgHeight}
          role="img"
          aria-label="Activity heatmap showing daily capture activity over the past year"
        >
          {/* Month labels */}
          {monthLabels.map((m) => (
            <text
              key={`month-${m.col}`}
              x={DAY_LABEL_WIDTH + m.col * CELL_STEP}
              y={12}
              className="fill-[var(--muted-foreground)]"
              fontSize={10}
              fontFamily="system-ui, sans-serif"
            >
              {m.label}
            </text>
          ))}

          {/* Day labels (Mon, Wed, Fri) */}
          {DAY_LABELS.map(
            (label, i) =>
              label && (
                <text
                  key={`day-${i}`}
                  x={0}
                  y={MONTH_LABEL_HEIGHT + i * CELL_STEP + CELL_SIZE - 2}
                  className="fill-[var(--muted-foreground)]"
                  fontSize={10}
                  fontFamily="system-ui, sans-serif"
                >
                  {label}
                </text>
              )
          )}

          {/* Heatmap cells */}
          {weeks.map((week, col) =>
            week.map((day) => {
              const d = new Date(day.date + "T00:00:00");
              const row = d.getDay();
              const level = getLevel(day.total, maxCount);
              return (
                <rect
                  key={day.date}
                  x={DAY_LABEL_WIDTH + col * CELL_STEP}
                  y={MONTH_LABEL_HEIGHT + row * CELL_STEP}
                  width={CELL_SIZE}
                  height={CELL_SIZE}
                  rx={2}
                  ry={2}
                  fill={levelColors[level]}
                  data-date={day.date}
                  data-count={day.total}
                  data-testid={`heatmap-cell-${day.date}`}
                  onMouseEnter={(e) => handleMouseEnter(day, e)}
                  onMouseLeave={handleMouseLeave}
                  style={{ cursor: "pointer" }}
                />
              );
            })
          )}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3 justify-end">
        <span className="text-[10px] text-[var(--muted-foreground)]">Less</span>
        {levelColors.map((color, i) => (
          <div
            key={i}
            style={{
              width: 11,
              height: 11,
              borderRadius: 2,
              backgroundColor: color,
            }}
          />
        ))}
        <span className="text-[10px] text-[var(--muted-foreground)]">More</span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 shadow-lg text-xs"
          style={{
            left: tooltip.x,
            top: tooltip.y - 8,
            transform: "translate(-50%, -100%)",
          }}
          data-testid="heatmap-tooltip"
        >
          <div className="font-semibold text-[var(--foreground)] mb-1">
            {formatDateLabel(tooltip.day.date)}
          </div>
          <div className="text-[var(--muted-foreground)]">
            <strong className="text-[var(--foreground)]">
              {tooltip.day.total}
            </strong>{" "}
            {tooltip.day.total === 1 ? "activity" : "activities"}
          </div>
          {tooltip.day.total > 0 && (
            <div className="mt-1 space-y-0.5 text-[var(--muted-foreground)]">
              {tooltip.day.cards > 0 && (
                <div>
                  {tooltip.day.cards} card{tooltip.day.cards !== 1 ? "s" : ""}
                </div>
              )}
              {tooltip.day.meetings > 0 && (
                <div>
                  {tooltip.day.meetings} meeting
                  {tooltip.day.meetings !== 1 ? "s" : ""}
                </div>
              )}
              {tooltip.day.emails > 0 && (
                <div>
                  {tooltip.day.emails} email{tooltip.day.emails !== 1 ? "s" : ""}
                </div>
              )}
              {tooltip.day.thoughts > 0 && (
                <div>
                  {tooltip.day.thoughts} thought
                  {tooltip.day.thoughts !== 1 ? "s" : ""}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
