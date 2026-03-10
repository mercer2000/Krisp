"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ── Types ────────────────────────────────────────────────
interface ActivityEvent {
  id: string;
  eventType: string;
  title: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  entityType: string | null;
  entityId: string | null;
  createdAt: string;
}

type FilterCategory = "all" | "email" | "smart_label" | "card" | "board" | "decision" | "action_item" | "thought" | "page" | "meeting" | "calendar" | "integration" | "review";

const FILTER_CATEGORIES: { key: FilterCategory; label: string; prefix: string }[] = [
  { key: "all", label: "All", prefix: "" },
  { key: "email", label: "Email", prefix: "email." },
  { key: "smart_label", label: "Smart Labels", prefix: "smart_label." },
  { key: "card", label: "Cards", prefix: "card." },
  { key: "board", label: "Boards", prefix: "board." },
  { key: "decision", label: "Decisions", prefix: "decision." },
  { key: "action_item", label: "Action Items", prefix: "action_item." },
  { key: "thought", label: "Thoughts", prefix: "thought." },
  { key: "page", label: "Pages", prefix: "page." },
  { key: "meeting", label: "Meetings", prefix: "meeting." },
  { key: "calendar", label: "Calendar", prefix: "calendar." },
  { key: "integration", label: "Integrations", prefix: "integration." },
  { key: "review", label: "Reviews", prefix: "weekly_review.,daily_briefing." },
];

// ── Event Type Config ────────────────────────────────────
const EVENT_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  "email.received": { icon: "📨", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/40" },
  "email.sent": { icon: "📤", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/40" },
  "email.classified": { icon: "🏷️", color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-950/40" },
  "email.draft_created": { icon: "📝", color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-50 dark:bg-sky-950/40" },
  "email.draft_sent": { icon: "✉️", color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-50 dark:bg-sky-950/40" },
  "email.labeled": { icon: "🔖", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/40" },
  "smart_label.triggered": { icon: "⚡", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/40" },
  "smart_label.created": { icon: "✨", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/40" },
  "smart_label.updated": { icon: "🔄", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/40" },
  "smart_label.folder_synced": { icon: "📁", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/40" },
  "card.created": { icon: "➕", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
  "card.moved": { icon: "↔️", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
  "card.completed": { icon: "✅", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
  "card.deleted": { icon: "🗑️", color: "text-gray-500 dark:text-gray-400", bg: "bg-gray-50 dark:bg-gray-900/40" },
  "board.created": { icon: "📋", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
  "decision.created": { icon: "🎯", color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/40" },
  "decision.status_changed": { icon: "🔀", color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/40" },
  "action_item.created": { icon: "📌", color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950/40" },
  "action_item.completed": { icon: "🎉", color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950/40" },
  "thought.created": { icon: "💡", color: "text-pink-600 dark:text-pink-400", bg: "bg-pink-50 dark:bg-pink-950/40" },
  "thought.linked": { icon: "🔗", color: "text-pink-600 dark:text-pink-400", bg: "bg-pink-50 dark:bg-pink-950/40" },
  "thought.reminder_sent": { icon: "🔔", color: "text-pink-600 dark:text-pink-400", bg: "bg-pink-50 dark:bg-pink-950/40" },
  "page.created": { icon: "📄", color: "text-teal-600 dark:text-teal-400", bg: "bg-teal-50 dark:bg-teal-950/40" },
  "page.updated": { icon: "✏️", color: "text-teal-600 dark:text-teal-400", bg: "bg-teal-50 dark:bg-teal-950/40" },
  "meeting.received": { icon: "🎤", color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-950/40" },
  "meeting.transcript_ready": { icon: "📜", color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-950/40" },
  "calendar.event_synced": { icon: "📅", color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-50 dark:bg-cyan-950/40" },
  "calendar.connected": { icon: "🔌", color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-50 dark:bg-cyan-950/40" },
  "integration.connected": { icon: "🔌", color: "text-gray-600 dark:text-gray-400", bg: "bg-gray-50 dark:bg-gray-900/40" },
  "integration.webhook_received": { icon: "📡", color: "text-gray-600 dark:text-gray-400", bg: "bg-gray-50 dark:bg-gray-900/40" },
  "weekly_review.generated": { icon: "📊", color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-950/40" },
  "daily_briefing.sent": { icon: "☀️", color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-50 dark:bg-yellow-950/40" },
};

function getEventConfig(eventType: string) {
  return EVENT_CONFIG[eventType] ?? { icon: "•", color: "text-gray-500", bg: "bg-gray-50 dark:bg-gray-900/40" };
}

// ── Date helpers ─────────────────────────────────────────
function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDateHeading(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const eventDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffMs = today.getTime() - eventDay.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString("en-US", { weekday: "long" });
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function groupByDate(events: ActivityEvent[]): { date: string; heading: string; items: ActivityEvent[] }[] {
  const groups: Map<string, ActivityEvent[]> = new Map();
  for (const event of events) {
    const d = new Date(event.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(event);
  }
  return Array.from(groups.entries()).map(([date, items]) => ({
    date,
    heading: formatDateHeading(items[0].createdAt),
    items,
  }));
}

function humanizeEventType(eventType: string): string {
  const [category, action] = eventType.split(".");
  const cat = category.replace(/_/g, " ");
  const act = action?.replace(/_/g, " ") ?? "";
  return `${cat} ${act}`.trim();
}

// ── Main Component ───────────────────────────────────────
export default function ActivityFeedPage() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterCategory>("all");
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchEvents = useCallback(async (cursor?: string | null, append = false) => {
    if (!append) setLoading(true);
    else setLoadingMore(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (cursor) params.set("cursor", cursor);
      params.set("limit", "50");

      if (filter !== "all") {
        const category = FILTER_CATEGORIES.find((c) => c.key === filter);
        if (category) {
          // Handle categories with multiple prefixes (e.g. "weekly_review.,daily_briefing.")
          const prefixes = category.prefix.split(",").filter(Boolean);
          const eventTypesForCategory = Object.keys(EVENT_CONFIG).filter((et) =>
            prefixes.some((p) => et.startsWith(p))
          );
          if (eventTypesForCategory.length > 0) {
            params.set("types", eventTypesForCategory.join(","));
          }
        }
      }

      const res = await fetch(`/api/activity?${params}`);
      if (!res.ok) throw new Error("Failed to fetch activity");
      const data = await res.json();

      if (append) {
        setEvents((prev) => [...prev, ...data.events]);
      } else {
        setEvents(data.events);
      }
      setHasMore(data.hasMore);
      setNextCursor(data.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load activity");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Infinite scroll
  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          fetchEvents(nextCursor, true);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, nextCursor, loadingMore, fetchEvents]);

  const grouped = groupByDate(events);

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: "var(--foreground)",
            margin: 0,
          }}
        >
          Activity Feed
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "var(--muted-foreground, #6b7280)",
            marginTop: 4,
          }}
        >
          See everything happening across your workspace
        </p>
      </div>

      {/* Filter Pills */}
      <div
        style={{
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          marginBottom: 24,
          paddingBottom: 16,
          borderBottom: "1px solid var(--border, #e5e7eb)",
        }}
      >
        {FILTER_CATEGORIES.map((cat) => {
          const isActive = filter === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setFilter(cat.key)}
              style={{
                padding: "6px 14px",
                borderRadius: 9999,
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                border: "1px solid",
                borderColor: isActive
                  ? "var(--primary, #2563eb)"
                  : "var(--border, #e5e7eb)",
                backgroundColor: isActive
                  ? "var(--primary, #2563eb)"
                  : "transparent",
                color: isActive
                  ? "white"
                  : "var(--muted-foreground, #6b7280)",
                cursor: "pointer",
                transition: "all 150ms ease",
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
                padding: "12px 0",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  backgroundColor: "var(--muted, #f3f4f6)",
                  flexShrink: 0,
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    width: "60%",
                    height: 14,
                    borderRadius: 4,
                    backgroundColor: "var(--muted, #f3f4f6)",
                    marginBottom: 8,
                    animation: "pulse 1.5s ease-in-out infinite",
                  }}
                />
                <div
                  style={{
                    width: "40%",
                    height: 12,
                    borderRadius: 4,
                    backgroundColor: "var(--muted, #f3f4f6)",
                    animation: "pulse 1.5s ease-in-out infinite",
                  }}
                />
              </div>
            </div>
          ))}
          <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div
          style={{
            padding: 16,
            borderRadius: 8,
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            color: "#ef4444",
            fontSize: 14,
            textAlign: "center",
          }}
        >
          {error}
          <button
            onClick={() => fetchEvents()}
            style={{
              marginLeft: 8,
              textDecoration: "underline",
              cursor: "pointer",
              background: "none",
              border: "none",
              color: "inherit",
              fontSize: "inherit",
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && events.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "64px 16px",
            color: "var(--muted-foreground, #6b7280)",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>
            <ActivityEmptyIcon />
          </div>
          <p style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>
            No activity yet
          </p>
          <p style={{ fontSize: 14 }}>
            {filter === "all"
              ? "Activity will appear here as you use the app — receiving emails, creating cards, running smart labels, and more."
              : "No activity matching this filter. Try selecting a different category."}
          </p>
        </div>
      )}

      {/* Event List */}
      {!loading && !error && events.length > 0 && (
        <div>
          {grouped.map((group) => (
            <div key={group.date} style={{ marginBottom: 32 }}>
              {/* Date Heading */}
              <div
                style={{
                  position: "sticky",
                  top: 0,
                  zIndex: 5,
                  backgroundColor: "var(--background, #fff)",
                  padding: "8px 0",
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--muted-foreground, #6b7280)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {group.heading}
                </span>
              </div>

              {/* Timeline */}
              <div style={{ position: "relative", paddingLeft: 24 }}>
                {/* Vertical line */}
                <div
                  style={{
                    position: "absolute",
                    left: 17,
                    top: 4,
                    bottom: 4,
                    width: 2,
                    backgroundColor: "var(--border, #e5e7eb)",
                    borderRadius: 1,
                  }}
                />

                {group.items.map((event) => {
                  const config = getEventConfig(event.eventType);
                  return (
                    <div
                      key={event.id}
                      style={{
                        position: "relative",
                        paddingLeft: 24,
                        paddingBottom: 20,
                      }}
                    >
                      {/* Dot on timeline */}
                      <div
                        style={{
                          position: "absolute",
                          left: -11,
                          top: 6,
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          border: "2px solid var(--background, #fff)",
                          backgroundColor: "var(--border, #d1d5db)",
                        }}
                      />

                      {/* Event Card */}
                      <div
                        style={{
                          display: "flex",
                          gap: 12,
                          alignItems: "flex-start",
                          padding: "10px 14px",
                          borderRadius: 10,
                          border: "1px solid var(--border, #e5e7eb)",
                          backgroundColor: "var(--card, #fff)",
                          transition: "box-shadow 150ms ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow =
                            "0 1px 3px rgba(0,0,0,0.06)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        {/* Icon */}
                        <div
                          className={config.bg}
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 8,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 18,
                            flexShrink: 0,
                          }}
                        >
                          {config.icon}
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              gap: 8,
                            }}
                          >
                            <p
                              style={{
                                fontSize: 14,
                                fontWeight: 500,
                                color: "var(--foreground)",
                                margin: 0,
                                lineHeight: 1.4,
                              }}
                            >
                              {event.title}
                            </p>
                            <span
                              style={{
                                fontSize: 12,
                                color: "var(--muted-foreground, #9ca3af)",
                                whiteSpace: "nowrap",
                                flexShrink: 0,
                              }}
                            >
                              {formatTime(event.createdAt)}
                            </span>
                          </div>

                          {event.description && (
                            <p
                              style={{
                                fontSize: 13,
                                color: "var(--muted-foreground, #6b7280)",
                                margin: "4px 0 0",
                                lineHeight: 1.5,
                              }}
                            >
                              {event.description}
                            </p>
                          )}

                          {/* Event type badge */}
                          <div style={{ marginTop: 6 }}>
                            <span
                              className={config.bg}
                              style={{
                                display: "inline-block",
                                fontSize: 11,
                                fontWeight: 500,
                                padding: "2px 8px",
                                borderRadius: 9999,
                                textTransform: "capitalize",
                              }}
                            >
                              <span className={config.color}>
                                {humanizeEventType(event.eventType)}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Load more sentinel */}
          <div ref={sentinelRef} style={{ height: 1 }} />

          {loadingMore && (
            <div
              style={{
                textAlign: "center",
                padding: "16px 0",
                color: "var(--muted-foreground, #9ca3af)",
                fontSize: 13,
              }}
            >
              Loading more...
            </div>
          )}

          {!hasMore && events.length > 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "24px 0",
                color: "var(--muted-foreground, #9ca3af)",
                fontSize: 13,
              }}
            >
              You&apos;ve reached the beginning of your activity log
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Empty State Icon ─────────────────────────────────────
function ActivityEmptyIcon() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ margin: "0 auto", opacity: 0.4 }}
    >
      <path d="M12 8v4l3 3" />
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}
