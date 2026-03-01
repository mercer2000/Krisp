"use client";

import { useState, useEffect, useCallback } from "react";
import type { ActionItem, ActionItemStatus, Priority } from "@/types";

const STATUS_OPTIONS: { value: ActionItemStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const PRIORITY_OPTIONS: { value: Priority; label: string; color: string }[] = [
  { value: "urgent", label: "Urgent", color: "#dc2626" },
  { value: "high", label: "High", color: "#f59e0b" },
  { value: "medium", label: "Medium", color: "#3b82f6" },
  { value: "low", label: "Low", color: "#6b7280" },
];

const STATUS_COLORS: Record<ActionItemStatus, string> = {
  open: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  in_progress: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  completed: "bg-green-500/15 text-green-600 dark:text-green-400",
  cancelled: "bg-gray-500/15 text-gray-500",
};

export default function ActionItemsPage() {
  const [items, setItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ActionItemStatus | "all">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sendingReminders, setSendingReminders] = useState(false);
  const [reminderResult, setReminderResult] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      const url =
        filter === "all"
          ? "/api/action-items"
          : `/api/action-items?status=${filter}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setItems(data.actionItems ?? []);
    } catch {
      console.error("Failed to load action items");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    fetchItems();
  }, [fetchItems]);

  const updateItem = async (
    id: string,
    updates: Partial<ActionItem>
  ) => {
    try {
      const res = await fetch(`/api/action-items/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update");
      const data = await res.json();
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...data.actionItem } : item))
      );
      setEditingId(null);
    } catch {
      console.error("Failed to update action item");
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const res = await fetch(`/api/action-items/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch {
      console.error("Failed to delete action item");
    }
  };

  const sendReminders = async () => {
    setSendingReminders(true);
    setReminderResult(null);
    try {
      const res = await fetch("/api/action-items/remind", { method: "POST" });
      const data = await res.json();
      setReminderResult(data.message);
    } catch {
      setReminderResult("Failed to send reminders");
    } finally {
      setSendingReminders(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const isOverdue = (item: ActionItem) => {
    if (!item.dueDate || item.status === "completed" || item.status === "cancelled") return false;
    return item.dueDate < new Date().toISOString().split("T")[0];
  };

  const openCount = items.filter(
    (i) => i.status === "open" || i.status === "in_progress"
  ).length;
  const overdueCount = items.filter(isOverdue).length;

  return (
    <div className="flex h-full flex-col bg-[var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">
              Action Items
            </h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              {openCount} open{overdueCount > 0 && `, ${overdueCount} overdue`}
            </p>
          </div>
          <button
            onClick={sendReminders}
            disabled={sendingReminders}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {sendingReminders ? "Sending..." : "Send Reminders"}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-auto px-6 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Reminder result */}
          {reminderResult && (
            <div className="mb-4 p-3 bg-[var(--primary)]/10 border border-[var(--primary)]/20 rounded-lg text-sm text-[var(--foreground)]">
              {reminderResult}
              <button
                onClick={() => setReminderResult(null)}
                className="ml-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                &times;
              </button>
            </div>
          )}

          {/* Filter tabs */}
          <div className="flex gap-1 mb-6 border-b border-[var(--border)]">
            {[
              { value: "all" as const, label: "All" },
              ...STATUS_OPTIONS,
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  filter === opt.value
                    ? "border-[var(--primary)] text-[var(--foreground)]"
                    : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Items list */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="p-4 bg-[var(--card)] border border-[var(--border)] rounded-lg animate-pulse"
                >
                  <div className="h-4 bg-[var(--secondary)] rounded w-3/4 mb-2" />
                  <div className="h-3 bg-[var(--secondary)] rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
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
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
              <h3 className="text-xl font-medium text-[var(--foreground)] mb-2">
                No Action Items
              </h3>
              <p className="text-[var(--muted-foreground)] max-w-md mx-auto">
                Extract action items from your meetings to see them here. Open a
                meeting and click "Extract Action Items".
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => {
                const overdue = isOverdue(item);
                const editing = editingId === item.id;

                return (
                  <div
                    key={item.id}
                    className={`p-4 bg-[var(--card)] border rounded-lg transition-colors ${
                      overdue
                        ? "border-red-500/40"
                        : "border-[var(--border)]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <button
                        onClick={() =>
                          updateItem(item.id, {
                            status:
                              item.status === "completed" ? "open" : "completed",
                          })
                        }
                        className={`mt-0.5 w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                          item.status === "completed"
                            ? "bg-green-500 border-green-500 text-white"
                            : "border-[var(--border)] hover:border-[var(--primary)]"
                        }`}
                      >
                        {item.status === "completed" && (
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3
                            className={`font-medium text-[var(--foreground)] ${
                              item.status === "completed"
                                ? "line-through opacity-60"
                                : ""
                            }`}
                          >
                            {item.title}
                          </h3>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              STATUS_COLORS[item.status]
                            }`}
                          >
                            {
                              STATUS_OPTIONS.find(
                                (s) => s.value === item.status
                              )?.label
                            }
                          </span>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{
                              color: PRIORITY_OPTIONS.find(
                                (p) => p.value === item.priority
                              )?.color,
                              backgroundColor: `${
                                PRIORITY_OPTIONS.find(
                                  (p) => p.value === item.priority
                                )?.color
                              }20`,
                            }}
                          >
                            {
                              PRIORITY_OPTIONS.find(
                                (p) => p.value === item.priority
                              )?.label
                            }
                          </span>
                        </div>

                        {item.description && (
                          <p className="text-sm text-[var(--muted-foreground)] mt-1 line-clamp-2">
                            {item.description}
                          </p>
                        )}

                        <div className="flex items-center gap-3 mt-2 text-xs text-[var(--muted-foreground)]">
                          {item.assignee && (
                            <span className="flex items-center gap-1">
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                              </svg>
                              {item.assignee}
                            </span>
                          )}
                          {item.dueDate && (
                            <span
                              className={`flex items-center gap-1 ${
                                overdue ? "text-red-500 font-medium" : ""
                              }`}
                            >
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                              {overdue ? "Overdue: " : ""}
                              {formatDate(item.dueDate)}
                            </span>
                          )}
                          {item.meetingTitle && (
                            <span className="flex items-center gap-1">
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                              </svg>
                              {item.meetingTitle}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() =>
                            setEditingId(editing ? null : item.id)
                          }
                          className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)] transition-colors"
                          title="Edit"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:bg-red-500/10 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Edit panel */}
                    {editing && (
                      <EditPanel
                        item={item}
                        onSave={(updates) => updateItem(item.id, updates)}
                        onCancel={() => setEditingId(null)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function EditPanel({
  item,
  onSave,
  onCancel,
}: {
  item: ActionItem;
  onSave: (updates: Partial<ActionItem>) => void;
  onCancel: () => void;
}) {
  const [status, setStatus] = useState(item.status);
  const [priority, setPriority] = useState(item.priority);
  const [assignee, setAssignee] = useState(item.assignee || "");
  const [dueDate, setDueDate] = useState(item.dueDate || "");

  return (
    <div className="mt-3 pt-3 border-t border-[var(--border)] grid grid-cols-2 gap-3">
      <div>
        <label className="text-xs font-medium text-[var(--muted-foreground)] block mb-1">
          Status
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as ActionItemStatus)}
          className="w-full px-2 py-1.5 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs font-medium text-[var(--muted-foreground)] block mb-1">
          Priority
        </label>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
          className="w-full px-2 py-1.5 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]"
        >
          {PRIORITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs font-medium text-[var(--muted-foreground)] block mb-1">
          Assignee
        </label>
        <input
          type="text"
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
          placeholder="Name..."
          className="w-full px-2 py-1.5 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-[var(--muted-foreground)] block mb-1">
          Due Date
        </label>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full px-2 py-1.5 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]"
        />
      </div>
      <div className="col-span-2 flex justify-end gap-2 mt-1">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-sm rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--accent)] transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() =>
            onSave({
              status,
              priority,
              assignee: assignee || null,
              dueDate: dueDate || null,
            })
          }
          className="px-3 py-1.5 text-sm rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
        >
          Save
        </button>
      </div>
    </div>
  );
}
