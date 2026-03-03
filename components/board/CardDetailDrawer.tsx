"use client";

import { useState, useEffect, useRef } from "react";
import { useUpdateCard, useDeleteCard, useAddTag, useDeleteTag } from "@/lib/hooks/useCards";
import type { Card, Priority } from "@/types";

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

  const drawerRef = useRef<HTMLDivElement>(null);

  const updateCard = useUpdateCard(boardId);
  const deleteCard = useDeleteCard(boardId);
  const addTag = useAddTag(boardId);
  const deleteTag = useDeleteTag(boardId);

  // Sync local state when card changes
  useEffect(() => {
    if (card) {
      setTitle(card.title);
      setDescription(card.description ?? "");
      setPriority(card.priority);
      setDueDate(card.dueDate ? card.dueDate.split("T")[0] : "");
    }
  }, [card]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

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
    </>
  );
}
