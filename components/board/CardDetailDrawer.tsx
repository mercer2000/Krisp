"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useUpdateCard, useDeleteCard, useAddTag, useDeleteTag, useCreateCard } from "@/lib/hooks/useCards";
import { MeetingDetailDrawer } from "@/components/meeting/MeetingDetailDrawer";
import type { Card, Priority, ChecklistItem } from "@/types";

// ---------------------------------------------------------------------------
// Meeting source type (returned by /api/v1/cards/[id]/meeting)
// ---------------------------------------------------------------------------

interface MeetingSource {
  id: number;
  meeting_title: string | null;
  meeting_start_date: string | null;
  meeting_duration: number | null;
  speakers: (string | { index: number; first_name?: string; last_name?: string })[];
}

// ---------------------------------------------------------------------------
// Priority config (mirrors Card.tsx)
// ---------------------------------------------------------------------------

const PRIORITY_OPTIONS: { value: Priority; label: string; color: string }[] = [
  { value: "low", label: "Low", color: "#22c55e" },
  { value: "medium", label: "Medium", color: "#3b82f6" },
  { value: "high", label: "High", color: "#f97316" },
  { value: "urgent", label: "Urgent", color: "#ef4444" },
];

// ---------------------------------------------------------------------------
// CardDetailDrawer
// ---------------------------------------------------------------------------

interface CardDetailDrawerProps {
  card: Card | null;
  boardId: string;
  onClose: () => void;
}

export function CardDetailDrawer({ card, boardId, onClose }: CardDetailDrawerProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [tagLabel, setTagLabel] = useState("");
  const [tagColor, setTagColor] = useState("#3b82f6");

  // Checklist state
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  // Meeting source state
  const [meetingSource, setMeetingSource] = useState<MeetingSource | null>(null);
  const [meetingLoading, setMeetingLoading] = useState(false);
  const [openMeetingId, setOpenMeetingId] = useState<number | null>(null);

  const drawerRef = useRef<HTMLDivElement>(null);

  const updateCard = useUpdateCard(boardId);
  const deleteCard = useDeleteCard(boardId);
  const addTag = useAddTag(boardId);
  const deleteTag = useDeleteTag(boardId);
  const createCard = useCreateCard(boardId);

  // Sync local state when card changes
  useEffect(() => {
    if (card) {
      setTitle(card.title);
      setDescription(card.description ?? "");
      setPriority(card.priority);
      setDueDate(card.dueDate ? card.dueDate.split("T")[0] : "");
      setChecklist(card.checklist ?? []);
      setNewItemTitle("");
    }
  }, [card]);

  // Fetch linked meeting when card changes
  useEffect(() => {
    if (!card) {
      setMeetingSource(null);
      return;
    }
    // Only check for meeting link if the card has a "Meeting" tag
    const hasMeetingTag = card.tags?.some(
      (t) => t.label.toLowerCase() === "meeting"
    );
    if (!hasMeetingTag) {
      setMeetingSource(null);
      return;
    }
    setMeetingLoading(true);
    fetch(`/api/v1/cards/${card.id}/meeting`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setMeetingSource(data.meeting ?? null))
      .catch(() => setMeetingSource(null))
      .finally(() => setMeetingLoading(false));
  }, [card?.id, card?.tags]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // ── Checklist helpers (must be above early return to preserve hook order) ──
  const saveChecklist = useCallback(
    (items: ChecklistItem[]) => {
      if (!card) return;
      setChecklist(items);
      updateCard.mutate({ id: card.id, checklist: items.length ? items : null });
    },
    [card, updateCard],
  );

  if (!card) return null;

  const handleSave = () => {
    updateCard.mutate({
      id: card.id,
      title: title.trim() || card.title,
      description: description.trim() || null,
      priority,
      dueDate: dueDate || null,
    });
  };

  const handleDelete = () => {
    if (window.confirm("Delete this card? This cannot be undone.")) {
      deleteCard.mutate(card.id, { onSuccess: onClose });
    }
  };

  const handleAddTag = () => {
    const label = tagLabel.trim();
    if (!label) return;
    addTag.mutate(
      { cardId: card.id, label, color: tagColor },
      { onSuccess: () => setTagLabel("") }
    );
  };

  const handleAddChecklistItem = () => {
    const t = newItemTitle.trim();
    if (!t) return;
    const item: ChecklistItem = { id: crypto.randomUUID(), title: t, done: false };
    saveChecklist([...checklist, item]);
    setNewItemTitle("");
  };

  const handleToggleChecklistItem = (itemId: string) => {
    saveChecklist(checklist.map((i) => (i.id === itemId ? { ...i, done: !i.done } : i)));
  };

  const handleDeleteChecklistItem = (itemId: string) => {
    saveChecklist(checklist.filter((i) => i.id !== itemId));
  };

  const handleConvertToCard = (item: ChecklistItem) => {
    createCard.mutate(
      { columnId: card.columnId, title: item.title },
      { onSuccess: () => saveChecklist(checklist.filter((i) => i.id !== item.id)) },
    );
  };

  // Drag-to-reorder handlers
  const handleDragStart = (idx: number) => setDragIdx(idx);

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const reordered = [...checklist];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(idx, 0, moved);
    setChecklist(reordered);
    setDragIdx(idx);
  };

  const handleDragEnd = () => {
    setDragIdx(null);
    // Persist the final order
    updateCard.mutate({ id: card.id, checklist: checklist.length ? checklist : null });
  };

  const doneCount = checklist.filter((i) => i.done).length;

  const tags = card.tags ?? [];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-[var(--border)] bg-[var(--background)] shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Card Details</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSave}
              className="w-full rounded-lg border border-[var(--input)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--ring)] transition-shadow"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleSave}
              rows={4}
              placeholder="Add a description..."
              className="w-full rounded-lg border border-[var(--input)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none focus:ring-2 focus:ring-[var(--ring)] transition-shadow resize-none"
            />
          </div>

          {/* Checklist */}
          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
              Checklist
              {checklist.length > 0 && (
                <span className="ml-1.5 text-[10px] font-normal text-[var(--muted-foreground)]">
                  {doneCount}/{checklist.length} done
                </span>
              )}
            </label>

            {/* Progress bar */}
            {checklist.length > 0 && (
              <div className="h-1.5 w-full rounded-full bg-[var(--secondary)] mb-2 overflow-hidden">
                <div
                  className="h-full rounded-full bg-green-500 transition-all"
                  style={{ width: `${(doneCount / checklist.length) * 100}%` }}
                />
              </div>
            )}

            {/* Items */}
            <div className="space-y-1 mb-2">
              {checklist.map((item, idx) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragEnd={handleDragEnd}
                  className={`group/item flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors ${
                    dragIdx === idx
                      ? "bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-300"
                      : "hover:bg-[var(--accent)]"
                  }`}
                >
                  {/* Drag handle */}
                  <span className="cursor-grab text-[var(--muted-foreground)] opacity-0 group-hover/item:opacity-100 transition-opacity">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="9" cy="5" r="1.5" />
                      <circle cx="15" cy="5" r="1.5" />
                      <circle cx="9" cy="12" r="1.5" />
                      <circle cx="15" cy="12" r="1.5" />
                      <circle cx="9" cy="19" r="1.5" />
                      <circle cx="15" cy="19" r="1.5" />
                    </svg>
                  </span>

                  {/* Checkbox */}
                  <button
                    onClick={() => handleToggleChecklistItem(item.id)}
                    className={`flex-shrink-0 h-4 w-4 rounded border transition-colors ${
                      item.done
                        ? "bg-green-500 border-green-500 text-white"
                        : "border-slate-300 dark:border-slate-600 hover:border-green-400"
                    }`}
                  >
                    {item.done && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>

                  {/* Title */}
                  <span
                    className={`flex-1 text-xs min-w-0 truncate ${
                      item.done
                        ? "line-through text-[var(--muted-foreground)]"
                        : "text-[var(--foreground)]"
                    }`}
                  >
                    {item.title}
                  </span>

                  {/* Actions (visible on hover) */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity">
                    {/* Convert to card */}
                    <button
                      onClick={() => handleConvertToCard(item)}
                      className="p-1 rounded text-[var(--muted-foreground)] hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                      title="Convert to card"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="3" width="20" height="18" rx="2" />
                        <path d="M8 12h8" />
                        <path d="M12 8v8" />
                      </svg>
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDeleteChecklistItem(item.id)}
                      className="p-1 rounded text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                      title="Remove item"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add item */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddChecklistItem()}
                placeholder="Add item..."
                className="flex-1 rounded-lg border border-[var(--input)] bg-[var(--card)] px-3 py-1.5 text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none focus:ring-2 focus:ring-[var(--ring)] transition-shadow"
              />
              <button
                onClick={handleAddChecklistItem}
                disabled={!newItemTitle.trim()}
                className="shrink-0 rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-[var(--primary-foreground)] transition-colors hover:opacity-90 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>

          {/* Source Meeting */}
          {meetingLoading && (
            <div className="rounded-lg border border-[var(--border)] p-3 animate-pulse">
              <div className="h-3 bg-[var(--secondary)] rounded w-24 mb-2" />
              <div className="h-4 bg-[var(--secondary)] rounded w-3/4" />
            </div>
          )}
          {meetingSource && (
            <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-3 space-y-2">
              <label className="block text-xs font-medium text-[var(--muted-foreground)]">
                Source Meeting
              </label>
              <div className="flex items-start gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-indigo-500 mt-0.5 flex-shrink-0"
                >
                  <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--foreground)] truncate">
                    {meetingSource.meeting_title || "Untitled Meeting"}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {meetingSource.meeting_start_date
                      ? new Date(meetingSource.meeting_start_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Unknown date"}
                    {meetingSource.meeting_duration
                      ? ` \u00B7 ${Math.floor(meetingSource.meeting_duration / 60)} min`
                      : ""}
                  </p>
                  {Array.isArray(meetingSource.speakers) && meetingSource.speakers.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {meetingSource.speakers.slice(0, 3).map((speaker, i) => {
                        const name = typeof speaker === "string"
                          ? speaker
                          : [speaker.first_name, speaker.last_name].filter(Boolean).join(" ") || `Speaker ${speaker.index}`;
                        return (
                          <span
                            key={i}
                            className="text-[10px] px-1.5 py-0.5 bg-[var(--secondary)] text-[var(--secondary-foreground)] rounded"
                          >
                            {name}
                          </span>
                        );
                      })}
                      {meetingSource.speakers.length > 3 && (
                        <span className="text-[10px] px-1.5 py-0.5 text-[var(--muted-foreground)]">
                          +{meetingSource.speakers.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpenMeetingId(meetingSource.id)}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View Full Conversation
              </button>
            </div>
          )}

          {/* Priority */}
          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
              Priority
            </label>
            <div className="flex gap-2">
              {PRIORITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setPriority(opt.value);
                    updateCard.mutate({ id: card.id, priority: opt.value });
                  }}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                    priority === opt.value
                      ? "ring-2 ring-offset-1 ring-offset-[var(--background)]"
                      : "opacity-60 hover:opacity-100"
                  }`}
                  style={{
                    backgroundColor: `${opt.color}20`,
                    color: opt.color,
                    ...(priority === opt.value ? { ringColor: opt.color } : {}),
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => {
                setDueDate(e.target.value);
                updateCard.mutate({ id: card.id, dueDate: e.target.value || null });
              }}
              className="w-full rounded-lg border border-[var(--input)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--ring)] transition-shadow"
            />
          </div>

          {/* Snooze */}
          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
              Snooze
            </label>
            {card.snoozedUntil ? (
              <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                    Snoozed until {new Date(card.snoozedUntil).toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={() => {
                    updateCard.mutate({
                      id: card.id,
                      snoozedUntil: null,
                      snoozeReturnColumnId: null,
                    });
                  }}
                  className="w-full rounded-lg px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-800/30 hover:bg-amber-200 dark:hover:bg-amber-800/50 transition-colors"
                >
                  Wake up now
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "1h", hours: 1 },
                  { label: "4h", hours: 4 },
                  { label: "1d", hours: 24 },
                  { label: "3d", hours: 72 },
                  { label: "1w", hours: 168 },
                  { label: "2w", hours: 336 },
                ].map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => {
                      const until = new Date(Date.now() + opt.hours * 60 * 60 * 1000).toISOString();
                      updateCard.mutate({
                        id: card.id,
                        snoozedUntil: until,
                        snoozeReturnColumnId: card.columnId,
                      });
                    }}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs text-[var(--foreground)] hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:border-amber-300 dark:hover:border-amber-700 transition-colors"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
              Tags
            </label>
            {/* Existing tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                  >
                    {tag.label}
                    <button
                      onClick={() => deleteTag.mutate(tag.id)}
                      className="ml-0.5 rounded-full hover:bg-black/10 p-0.5"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Add tag */}
            <div className="flex gap-2">
              <input
                type="text"
                value={tagLabel}
                onChange={(e) => setTagLabel(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                placeholder="New tag..."
                className="flex-1 rounded-lg border border-[var(--input)] bg-[var(--card)] px-3 py-1.5 text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none focus:ring-2 focus:ring-[var(--ring)] transition-shadow"
              />
              <input
                type="color"
                value={tagColor}
                onChange={(e) => setTagColor(e.target.value)}
                className="h-7 w-7 shrink-0 cursor-pointer rounded border-none p-0"
              />
              <button
                onClick={handleAddTag}
                disabled={!tagLabel.trim()}
                className="shrink-0 rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-[var(--primary-foreground)] transition-colors hover:opacity-90 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[var(--border)] px-4 py-3">
          <button
            onClick={handleDelete}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--destructive)] transition-colors hover:bg-[var(--destructive)]/10"
          >
            Delete Card
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-lg px-3 py-1.5 text-xs text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)]"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Meeting Detail Drawer (opens on top of card drawer) */}
      {openMeetingId !== null && (
        <MeetingDetailDrawer
          meetingId={openMeetingId}
          onClose={() => setOpenMeetingId(null)}
        />
      )}
    </>
  );
}
