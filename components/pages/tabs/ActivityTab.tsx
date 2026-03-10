"use client";

import { useQuery } from "@tanstack/react-query";
import type { Page } from "@/types";

interface ActivityEvent {
  id: string;
  userId: string;
  eventType: string;
  title: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  entityType: string | null;
  entityId: string | null;
  createdAt: string;
}

const EVENT_TYPE_DISPLAY: Record<string, { icon: string; color: string }> = {
  "page.created": { icon: "📄", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  "page.updated": { icon: "✏️", color: "bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-400" },
  "email.classified": { icon: "📧", color: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400" },
  "email.received": { icon: "📥", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  "smart_label.triggered": { icon: "✨", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
  "smart_label.folder_synced": { icon: "📁", color: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400" },
  "decision.created": { icon: "⚖️", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
  "thought.created": { icon: "💭", color: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400" },
};

function getEventDisplay(eventType: string) {
  return EVENT_TYPE_DISPLAY[eventType] ?? {
    icon: "📌",
    color: "bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-400",
  };
}

function formatEventType(eventType: string): string {
  return eventType.replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function ActivityTab({ page }: { page: Page }) {
  const { data, isLoading } = useQuery<{ events: ActivityEvent[]; nextCursor: string | null; hasMore: boolean }>({
    queryKey: ["page-activity", page.id],
    queryFn: async () => {
      const res = await fetch(`/api/pages/${page.id}/activity?limit=50`);
      if (!res.ok) throw new Error("Failed to fetch activity");
      return res.json();
    },
  });

  const events = data?.events ?? [];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Activity</h2>
        <p className="text-xs text-[var(--muted-foreground)]">
          A log of all actions and events related to this page
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="h-8 w-8 rounded-full bg-[var(--accent)]" />
              <div className="flex-1">
                <div className="h-4 w-48 rounded bg-[var(--accent)]" />
                <div className="mt-1 h-3 w-32 rounded bg-[var(--accent)]" />
              </div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-3 text-4xl opacity-30">📋</div>
          <h3 className="text-base font-medium text-[var(--foreground)]">No activity yet</h3>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Activity will appear here as you and the AI interact with this page.
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-[var(--border)]" />

          <div className="space-y-0">
            {events.map((event, idx) => {
              const display = getEventDisplay(event.eventType);
              return (
                <div key={event.id} className="relative flex gap-3 py-3 pl-1">
                  {/* Timeline dot */}
                  <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--card)] border border-[var(--border)] text-sm">
                    {display.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${display.color}`}>
                        {formatEventType(event.eventType)}
                      </span>
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {formatTimestamp(event.createdAt)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm font-medium text-[var(--foreground)]">
                      {event.title}
                    </p>
                    {event.description && (
                      <p className="mt-0.5 text-xs text-[var(--muted-foreground)] line-clamp-2">
                        {event.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
