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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type WidgetId =
  | "upcomingEvents"
  | "overdueCards"
  | "recentMeetings"
  | "meetingCount"
  | "emailCount"
  | "actionItemsDue";

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
  };
}

const DEFAULT_LAYOUT: WidgetConfig[] = [
  { id: "upcomingEvents", visible: true },
  { id: "overdueCards", visible: true },
  { id: "recentMeetings", visible: true },
  { id: "meetingCount", visible: true },
  { id: "emailCount", visible: true },
  { id: "actionItemsDue", visible: true },
];

const WIDGET_META: Record<WidgetId, { title: string; icon: string }> = {
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
}: {
  id: string;
  children: React.ReactNode;
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
    <div ref={setNodeRef} style={style} {...attributes}>
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
      {data.map((evt) => (
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
          </div>
        </li>
      ))}
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
}: {
  widgetId: WidgetId;
  children: React.ReactNode;
}) {
  const meta = WIDGET_META[widgetId];
  return (
    <div className="flex h-full flex-col rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-base">{meta.icon}</span>
        <h3 className="text-sm font-semibold text-[var(--foreground)]">
          {meta.title}
        </h3>
      </div>
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Render Widget
// ---------------------------------------------------------------------------

function renderWidget(id: WidgetId, widgets: DashboardData["widgets"]) {
  switch (id) {
    case "upcomingEvents":
      return (
        <WidgetCard widgetId={id}>
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
          setLayout(json.config);
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
            {[1, 2, 3, 4, 5, 6].map((i) => (
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
                  <SortableWidget key={w.id} id={w.id}>
                    {renderWidget(w.id, data.widgets)}
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
