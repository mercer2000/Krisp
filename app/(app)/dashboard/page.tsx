"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import ActivityHeatmap from "@/components/dashboard/ActivityHeatmap";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type WidgetId =
  | "analyticsOverview"
  | "activityHeatmap"
  | "dailyBriefing"
  | "upcomingEvents"
  | "overdueCards"
  | "recentMeetings"
  | "meetingCount"
  | "emailCount"
  | "actionItemsDue";

interface SparklinePoint {
  date: string;
  value: number;
}

interface StatSummary {
  week: number;
  month: number;
}

interface WidgetConfig {
  id: WidgetId;
  visible: boolean;
}

interface DashboardData {
  config: WidgetConfig[] | null;
  widgets: {
    upcomingEvents: {
      id: string;
      subject: string | null;
      startDateTime: string;
      endDateTime: string;
      location: string | null;
      isAllDay: boolean;
      attendees: { email: string; name: string; response: string; type: string }[] | null;
    }[];
    overdueCards: {
      id: string;
      title: string;
      dueDate: string | null;
      priority: string;
      columnTitle: string;
      boardTitle: string;
      boardId: string;
    }[];
    recentMeetings: {
      id: number;
      meetingTitle: string | null;
      meetingStartDate: string | null;
      meetingDuration: number | null;
    }[];
    meetingCount: number;
    emailCount: number;
    actionItemsDue: {
      id: string;
      title: string;
      dueDate: string | null;
      priority: string;
      status: string;
    }[];
    dailyBriefing: {
      id: string;
      briefingDate: string;
      status: string;
      briefingHtml: string | null;
      overdueCardCount: number;
      emailCount: number;
      meetingCount: number;
      actionItemCount: number;
      createdAt: string;
    } | null;
  };
  analytics: {
    summary: {
      cardsCompleted: StatSummary;
      meetingsAttended: StatSummary;
      emailsProcessed: StatSummary;
      thoughtsCaptured: StatSummary;
      actionItemsResolved: StatSummary;
    };
    sparklines: {
      cards: SparklinePoint[];
      meetings: SparklinePoint[];
      emails: SparklinePoint[];
      thoughts: SparklinePoint[];
      actionItems: SparklinePoint[];
    };
  };
}

const DEFAULT_LAYOUT: WidgetConfig[] = [
  { id: "analyticsOverview", visible: true },
  { id: "activityHeatmap", visible: true },
  { id: "dailyBriefing", visible: true },
  { id: "upcomingEvents", visible: true },
  { id: "overdueCards", visible: true },
  { id: "recentMeetings", visible: true },
  { id: "meetingCount", visible: true },
  { id: "emailCount", visible: true },
  { id: "actionItemsDue", visible: true },
];

const WIDGET_META: Record<WidgetId, { title: string; icon: string }> = {
  analyticsOverview: { title: "Analytics Overview", icon: "📈" },
  activityHeatmap: { title: "Activity Heatmap", icon: "🟩" },
  dailyBriefing: { title: "Daily Briefing", icon: "🌅" },
  upcomingEvents: { title: "Upcoming Events", icon: "📅" },
  overdueCards: { title: "Overdue Cards", icon: "⚠️" },
  recentMeetings: { title: "Recent Meetings", icon: "🎙️" },
  meetingCount: { title: "Meeting Count", icon: "📊" },
  emailCount: { title: "Email Count", icon: "✉️" },
  actionItemsDue: { title: "Action Items Due", icon: "✅" },
};

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

function formatDate(dateStr: string | null) {
  if (!dateStr) return "--";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDuration(seconds: number | null) {
  if (!seconds) return "--";
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function priorityColor(p: string) {
  switch (p) {
    case "urgent":
      return "text-red-500";
    case "high":
      return "text-orange-500";
    case "medium":
      return "text-amber-500";
    default:
      return "text-[var(--muted-foreground)]";
  }
}

// ---------------------------------------------------------------------------
// Sortable Widget Wrapper
// ---------------------------------------------------------------------------

function SortableWidget({
  id,
  children,
  fullWidth = false,
}: {
  id: string;
  children: React.ReactNode;
  fullWidth?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} className={fullWidth ? "col-span-full" : ""}>
      <div className="group relative h-full">
        <button
          {...listeners}
          className="absolute top-3 right-3 z-10 flex h-7 w-7 items-center justify-center rounded-md opacity-0 transition-opacity group-hover:opacity-100 bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-grab active:cursor-grabbing"
          title="Drag to reorder"
          aria-label="Drag to reorder"
        >
          <GripIcon size={14} />
        </button>
        {children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Widget Content Components
// ---------------------------------------------------------------------------

function UpcomingEventsWidget({
  data,
}: {
  data: DashboardData["widgets"]["upcomingEvents"];
}) {
  if (data.length === 0) {
    return (
      <EmptyState message="No upcoming events in the next 7 days" />
    );
  }
  return (
    <ul className="space-y-2">
      {data.map((evt) => {
        const attendees = evt.attendees ?? [];
        return (
          <li
            key={evt.id}
            className="flex items-start gap-3 rounded-md p-2 hover:bg-[var(--secondary)]/50 transition-colors"
          >
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 text-xs font-bold">
              {new Date(evt.startDateTime).getDate()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-[var(--foreground)] truncate">
                {evt.subject || "Untitled"}
              </div>
              <div className="text-xs text-[var(--muted-foreground)]">
                {evt.isAllDay
                  ? "All day"
                  : formatDate(evt.startDateTime)}
                {evt.location && ` · ${evt.location}`}
              </div>
              {attendees.length > 0 && (
                <div className="mt-1 flex items-center gap-1 text-[10px] text-[var(--muted-foreground)]">
                  <PersonIcon size={10} />
                  <span className="truncate">
                    {attendees.length <= 2
                      ? attendees.map((a) => a.name || a.email).join(", ")
                      : `${attendees.slice(0, 2).map((a) => a.name || a.email).join(", ")} +${attendees.length - 2}`}
                  </span>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function OverdueCardsWidget({
  data,
}: {
  data: DashboardData["widgets"]["overdueCards"];
}) {
  if (data.length === 0) {
    return <EmptyState message="No overdue cards" />;
  }
  return (
    <ul className="space-y-2">
      {data.map((card) => (
        <li key={card.id}>
          <Link
            href={`/boards/${card.boardId}`}
            className="flex items-start gap-3 rounded-md p-2 hover:bg-[var(--secondary)]/50 transition-colors"
          >
            <div
              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-xs font-bold ${priorityColor(card.priority)}`}
            >
              {card.priority.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-[var(--foreground)] truncate">
                {card.title}
              </div>
              <div className="text-xs text-[var(--muted-foreground)]">
                Due {card.dueDate} · {card.boardTitle} / {card.columnTitle}
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function RecentMeetingsWidget({
  data,
}: {
  data: DashboardData["widgets"]["recentMeetings"];
}) {
  if (data.length === 0) {
    return <EmptyState message="No meetings recorded yet" />;
  }
  return (
    <ul className="space-y-2">
      {data.map((m) => (
        <li
          key={m.id}
          className="flex items-start gap-3 rounded-md p-2 hover:bg-[var(--secondary)]/50 transition-colors"
        >
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
            <MicIcon size={14} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-[var(--foreground)] truncate">
              {m.meetingTitle || "Untitled Meeting"}
            </div>
            <div className="text-xs text-[var(--muted-foreground)]">
              {formatDate(m.meetingStartDate)} · {formatDuration(m.meetingDuration)}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function StatWidget({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-4">
      <div className={`text-4xl font-bold ${color}`}>{value}</div>
      <div className="text-sm text-[var(--muted-foreground)] mt-1">
        {label}
      </div>
    </div>
  );
}

function ActionItemsDueWidget({
  data,
}: {
  data: DashboardData["widgets"]["actionItemsDue"];
}) {
  if (data.length === 0) {
    return <EmptyState message="No action items due" />;
  }
  return (
    <ul className="space-y-2">
      {data.map((item) => (
        <li
          key={item.id}
          className="flex items-start gap-3 rounded-md p-2 hover:bg-[var(--secondary)]/50 transition-colors"
        >
          <div
            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-xs font-bold ${priorityColor(item.priority)}`}
          >
            {item.status === "in_progress" ? "▶" : "○"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-[var(--foreground)] truncate">
              {item.title}
            </div>
            <div className="text-xs text-[var(--muted-foreground)]">
              Due {item.dueDate || "N/A"} · {item.priority}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function DailyBriefingWidget({
  data,
  onGenerate,
}: {
  data: DashboardData["widgets"]["dailyBriefing"];
  onGenerate: () => Promise<void> | void;
}) {
  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    try {
      await onGenerate();
    } finally {
      setGenerating(false);
    }
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-6 gap-3">
        <p className="text-sm text-[var(--muted-foreground)]">
          No briefing yet for today
        </p>
        <button
          onClick={handleGenerate}
          disabled={generating}
          data-testid="generate-briefing-btn"
          className="px-4 py-2 text-sm font-medium rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {generating ? "Generating..." : "Generate Briefing"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
        <span>{data.overdueCardCount} overdue</span>
        <span>{data.meetingCount} meetings</span>
        <span>{data.emailCount} emails</span>
        <span>{data.actionItemCount} actions</span>
      </div>
      <div
        className="prose prose-sm max-w-none text-[var(--foreground)] [&_p]:my-1 [&_ul]:my-1 [&_li]:my-0.5 [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-1 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1"
        data-testid="briefing-content"
        dangerouslySetInnerHTML={{ __html: data.briefingHtml || "" }}
      />
      <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between">
        <span className="text-xs text-[var(--muted-foreground)]">
          Generated {new Date(data.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
        </span>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="text-xs text-[var(--primary)] hover:underline disabled:opacity-50"
        >
          {generating ? "Regenerating..." : "Regenerate"}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sparkline SVG
// ---------------------------------------------------------------------------

function Sparkline({
  data,
  color,
  width = 120,
  height = 32,
}: {
  data: SparklinePoint[];
  color: string;
  width?: number;
  height?: number;
}) {
  if (data.length === 0) return null;

  const values = data.map((d) => d.value);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const padY = 2;

  const points = data.map((d, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * width;
    const y = padY + (1 - (d.value - min) / range) * (height - padY * 2);
    return `${x},${y}`;
  });

  const areaPoints = [
    `0,${height}`,
    ...points,
    `${width},${height}`,
  ].join(" ");

  return (
    <svg width={width} height={height} className="block">
      <polygon points={areaPoints} fill={color} opacity={0.12} />
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Analytics Icons
// ---------------------------------------------------------------------------

function CardsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function MeetingsIconSmall() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 18a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <circle cx="12" cy="10" r="2" />
    </svg>
  );
}

function EmailsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function ThoughtsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
      <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
    </svg>
  );
}

function ActionItemsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Analytics Overview Widget
// ---------------------------------------------------------------------------

function AnalyticsStatCard({
  label,
  icon,
  week,
  month,
  sparkline,
  color,
  period,
}: {
  label: string;
  icon: React.ReactNode;
  week: number;
  month: number;
  sparkline: SparklinePoint[];
  color: string;
  period: "week" | "month";
}) {
  const value = period === "week" ? week : month;
  return (
    <div className="p-3 bg-[var(--secondary)]/30 rounded-lg flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span style={{ color }}>{icon}</span>
        <span className="text-xs text-[var(--muted-foreground)]">{label}</span>
      </div>
      <div className="flex items-end justify-between gap-2">
        <div>
          <div className="text-2xl font-bold text-[var(--foreground)]">
            {value}
          </div>
          <div className="text-[10px] text-[var(--muted-foreground)]">
            {period === "week" ? "this week" : "this month"}
            {period === "week" && month > 0 && (
              <span className="ml-1">/ {month} mo</span>
            )}
          </div>
        </div>
        <Sparkline data={sparkline} color={color} width={80} height={24} />
      </div>
    </div>
  );
}

function AnalyticsOverviewWidget({
  analytics,
}: {
  analytics: DashboardData["analytics"];
}) {
  const [period, setPeriod] = useState<"week" | "month">("week");

  const stats = [
    {
      label: "Cards Completed",
      icon: <CardsIcon />,
      color: "#6366f1",
      ...analytics.summary.cardsCompleted,
      sparkline: analytics.sparklines.cards,
    },
    {
      label: "Meetings",
      icon: <MeetingsIconSmall />,
      color: "#f59e0b",
      ...analytics.summary.meetingsAttended,
      sparkline: analytics.sparklines.meetings,
    },
    {
      label: "Emails",
      icon: <EmailsIcon />,
      color: "#10b981",
      ...analytics.summary.emailsProcessed,
      sparkline: analytics.sparklines.emails,
    },
    {
      label: "Thoughts",
      icon: <ThoughtsIcon />,
      color: "#8b5cf6",
      ...analytics.summary.thoughtsCaptured,
      sparkline: analytics.sparklines.thoughts,
    },
    {
      label: "Actions Resolved",
      icon: <ActionItemsIcon />,
      color: "#ec4899",
      ...analytics.summary.actionItemsResolved,
      sparkline: analytics.sparklines.actionItems,
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-end mb-3">
        <div className="flex items-center gap-0.5 rounded-md border border-[var(--border)] bg-[var(--secondary)]/50 p-0.5">
          <button
            onClick={() => setPeriod("week")}
            className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${
              period === "week"
                ? "bg-[var(--primary)] text-white"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setPeriod("month")}
            className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${
              period === "month"
                ? "bg-[var(--primary)] text-white"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            Month
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {stats.map((s) => (
          <AnalyticsStatCard
            key={s.label}
            label={s.label}
            icon={s.icon}
            week={s.week}
            month={s.month}
            sparkline={s.sparkline}
            color={s.color}
            period={period}
          />
        ))}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-6 text-sm text-[var(--muted-foreground)]">
      {message}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function GripIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="9" cy="5" r="1" />
      <circle cx="9" cy="12" r="1" />
      <circle cx="9" cy="19" r="1" />
      <circle cx="15" cy="5" r="1" />
      <circle cx="15" cy="12" r="1" />
      <circle cx="15" cy="19" r="1" />
    </svg>
  );
}

function PersonIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ChevronIcon({ size = 16, direction = "down" }: { size?: number; direction?: "up" | "down" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: direction === "up" ? "rotate(180deg)" : undefined, transition: "transform 200ms" }}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function MicIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Widget Card Shell
// ---------------------------------------------------------------------------

function WidgetCard({
  widgetId,
  children,
  collapsible = false,
}: {
  widgetId: WidgetId;
  children: React.ReactNode;
  collapsible?: boolean;
}) {
  const meta = WIDGET_META[widgetId];
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-full flex-col rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
      <div
        className={`flex items-center gap-2 ${collapsible ? "cursor-pointer select-none" : ""} ${collapsed ? "" : "mb-3"}`}
        onClick={collapsible ? () => setCollapsed((c) => !c) : undefined}
        role={collapsible ? "button" : undefined}
        aria-expanded={collapsible ? !collapsed : undefined}
        data-testid={collapsible ? `collapse-toggle-${widgetId}` : undefined}
      >
        <span className="text-base">{meta.icon}</span>
        <h3 className="text-sm font-semibold text-[var(--foreground)] flex-1">
          {meta.title}
        </h3>
        {collapsible && (
          <ChevronIcon size={14} direction={collapsed ? "down" : "up"} />
        )}
      </div>
      {!collapsed && <div className="flex-1 overflow-auto">{children}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Render Widget
// ---------------------------------------------------------------------------

function renderWidget(
  id: WidgetId,
  data: DashboardData,
  onGenerateBriefing?: () => void
) {
  const widgets = data.widgets;
  switch (id) {
    case "analyticsOverview":
      return (
        <WidgetCard widgetId={id} collapsible>
          <AnalyticsOverviewWidget analytics={data.analytics} />
        </WidgetCard>
      );
    case "activityHeatmap":
      return (
        <WidgetCard widgetId={id} collapsible>
          <ActivityHeatmap />
        </WidgetCard>
      );
    case "dailyBriefing":
      return (
        <WidgetCard widgetId={id} collapsible>
          <DailyBriefingWidget
            data={widgets.dailyBriefing}
            onGenerate={onGenerateBriefing || (() => {})}
          />
        </WidgetCard>
      );
    case "upcomingEvents":
      return (
        <WidgetCard widgetId={id} collapsible>
          <UpcomingEventsWidget data={widgets.upcomingEvents} />
        </WidgetCard>
      );
    case "overdueCards":
      return (
        <WidgetCard widgetId={id}>
          <OverdueCardsWidget data={widgets.overdueCards} />
        </WidgetCard>
      );
    case "recentMeetings":
      return (
        <WidgetCard widgetId={id}>
          <RecentMeetingsWidget data={widgets.recentMeetings} />
        </WidgetCard>
      );
    case "meetingCount":
      return (
        <WidgetCard widgetId={id}>
          <StatWidget
            value={widgets.meetingCount}
            label="meetings in the last 30 days"
            color="text-violet-500"
          />
        </WidgetCard>
      );
    case "emailCount":
      return (
        <WidgetCard widgetId={id}>
          <StatWidget
            value={widgets.emailCount}
            label="emails in the last 30 days"
            color="text-blue-500"
          />
        </WidgetCard>
      );
    case "actionItemsDue":
      return (
        <WidgetCard widgetId={id}>
          <ActionItemsDueWidget data={widgets.actionItemsDue} />
        </WidgetCard>
      );
  }
}

// ---------------------------------------------------------------------------
// Dashboard Page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [layout, setLayout] = useState<WidgetConfig[]>(DEFAULT_LAYOUT);
  const [activeId, setActiveId] = useState<WidgetId | null>(null);

  const handleGenerateBriefing = useCallback(async () => {
    try {
      const res = await fetch("/api/daily-briefing", { method: "POST" });
      if (!res.ok) throw new Error("Failed to generate briefing");
      const json = await res.json();
      if (json.briefing && data) {
        setData({
          ...data,
          widgets: {
            ...data.widgets,
            dailyBriefing: json.briefing,
          },
        });
      }
    } catch (err) {
      console.error("Failed to generate briefing:", err);
    }
  }, [data]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/dashboard");
        if (!res.ok) throw new Error("Failed to load dashboard");
        const json: DashboardData = await res.json();
        setData(json);
        if (json.config && Array.isArray(json.config) && json.config.length > 0) {
          // Merge saved config with defaults so newly-added widgets appear
          const savedIds = new Set(json.config.map((w: WidgetConfig) => w.id));
          const missing = DEFAULT_LAYOUT.filter((w) => !savedIds.has(w.id));
          setLayout([...missing, ...json.config]);
        }
      } catch {
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const saveLayout = useCallback(async (newLayout: WidgetConfig[]) => {
    try {
      await fetch("/api/dashboard", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: newLayout }),
      });
    } catch {
      // silent fail for config save
    }
  }, []);

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as WidgetId);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = layout.findIndex((w) => w.id === active.id);
    const newIndex = layout.findIndex((w) => w.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newLayout = [...layout];
    const [moved] = newLayout.splice(oldIndex, 1);
    newLayout.splice(newIndex, 0, moved);
    setLayout(newLayout);
    saveLayout(newLayout);
  }

  const visibleWidgets = layout.filter((w) => w.visible);
  const widgetIds = visibleWidgets.map((w) => w.id);

  // Skeleton loading
  if (loading) {
    return (
      <div className="flex h-full flex-col bg-[var(--background)]">
        <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md">
          <div className="flex items-center px-6 py-4">
            <div>
              <h1 className="text-2xl font-bold text-[var(--foreground)]">
                Dashboard
              </h1>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">
                Your workspace at a glance
              </p>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto px-6 py-8">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div
                key={i}
                className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 animate-pulse"
              >
                <div className="h-5 bg-[var(--secondary)] rounded w-2/3 mb-4" />
                <div className="space-y-3">
                  <div className="h-10 bg-[var(--secondary)] rounded" />
                  <div className="h-10 bg-[var(--secondary)] rounded" />
                  <div className="h-10 bg-[var(--secondary)] rounded" />
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-full flex-col bg-[var(--background)]">
        <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md">
          <div className="flex items-center px-6 py-4">
            <h1 className="text-2xl font-bold text-[var(--foreground)]">
              Dashboard
            </h1>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-[var(--destructive)]">
              {error || "No data available"}
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-[var(--background)]">
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md">
        <div className="flex items-center px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">
              Dashboard
            </h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Your workspace at a glance — drag widgets to rearrange
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={widgetIds} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleWidgets.map((w) => (
                  <SortableWidget key={w.id} id={w.id} fullWidth={w.id === "activityHeatmap" || w.id === "analyticsOverview"}>
                    {renderWidget(w.id, data, handleGenerateBriefing)}
                  </SortableWidget>
                ))}
              </div>
            </SortableContext>

            <DragOverlay>
              {activeId ? (
                <div className="rounded-lg border-2 border-[var(--primary)] bg-[var(--card)] p-4 shadow-lg opacity-90">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
                    <span>{WIDGET_META[activeId].icon}</span>
                    <span>{WIDGET_META[activeId].title}</span>
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </main>
    </div>
  );
}
