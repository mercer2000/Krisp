"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useUpdatePage } from "@/lib/hooks/usePages";
import type { Page } from "@/types";

const COMMON_EMOJIS = [
  "📄", "📝", "📋", "📌", "📎", "📊", "📈", "📉", "📅", "📆",
  "🎯", "🎨", "🎵", "🎬", "🎮", "🎲", "🏆", "🏅", "🥇", "🏠",
  "💡", "💻", "📱", "🔧", "🔨", "⚙️", "🔑", "🔒", "🔓", "📦",
  "🚀", "⭐", "❤️", "🔥", "✅", "❌", "⚠️", "💬", "🗂️", "📁",
  "🌟", "🌈", "☀️", "🌙", "🍎", "🍕", "☕", "🎁", "💰", "🔔",
  "🧠", "⚖️", "📧", "🏷️", "📚", "💎", "🎪", "🌐", "📡", "🔬",
];

const PRESET_COLORS = [
  "#EF4444", "#F97316", "#F59E0B", "#10B981",
  "#3B82F6", "#6366F1", "#8B5CF6", "#EC4899",
  "#14B8A6", "#84CC16", "#06B6D4", "#F43F5E",
];

export function PageHeader({ page }: { page: Page }) {
  const [title, setTitle] = useState(page.title);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const updatePage = useUpdatePage(page.id);
  const titleRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setTitle(page.title);
  }, [page.title]);

  const debouncedUpdate = useCallback(
    (newTitle: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        updatePage.mutate({ title: newTitle });
      }, 500);
    },
    [updatePage]
  );

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setTitle(v);
    debouncedUpdate(v);
  };

  const handleIconClick = () => {
    setShowEmojiPicker(!showEmojiPicker);
  };

  const handleEmojiSelect = (emoji: string) => {
    updatePage.mutate({ icon: emoji });
    setShowEmojiPicker(false);
  };

  const handleColorSelect = (color: string) => {
    updatePage.mutate({ color });
    setShowColorPicker(false);
  };

  return (
    <div className="mb-6">
      {/* Color bar for pages with a color set */}
      {page.color && (
        <div
          className="mb-4 h-1.5 rounded-full"
          style={{ backgroundColor: page.color }}
        />
      )}

      {/* Icon + badges */}
      <div className="relative mb-3 flex items-center gap-3">
        <button
          className="text-5xl leading-none hover:opacity-80 transition-opacity"
          onClick={handleIconClick}
          title="Change icon"
        >
          {page.icon || (page.pageType === "knowledge" ? "🧠" : page.pageType === "decisions" ? "⚖️" : page.isDatabase ? "📊" : "📄")}
        </button>

        <div className="flex items-center gap-2">
          {/* Page type badge */}
          {(page.pageType === "knowledge" || page.pageType === "decisions") && (
            <span className="rounded-full bg-[var(--accent)] px-2.5 py-0.5 text-xs font-medium text-[var(--muted-foreground)] capitalize">
              {page.pageType}
            </span>
          )}

          {/* Color picker toggle */}
          <button
            className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--border)] hover:border-[var(--foreground)] transition-colors"
            style={{ backgroundColor: page.color || "transparent" }}
            onClick={() => setShowColorPicker(!showColorPicker)}
            title="Change color"
          >
            {!page.color && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="13.5" cy="6.5" r="2.5" />
                <circle cx="17.5" cy="10.5" r="2.5" />
                <circle cx="8.5" cy="7.5" r="2.5" />
                <circle cx="6.5" cy="12.5" r="2.5" />
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2Z" />
              </svg>
            )}
          </button>

          {/* Smart rule active indicator */}
          {page.smartRule && (
            <span
              className={`flex h-6 items-center gap-1 rounded-md px-2 text-[10px] font-medium ${
                page.smartActive
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-gray-100 text-gray-500 dark:bg-gray-800/50 dark:text-gray-400"
              }`}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
              </svg>
              Smart Rule {page.smartActive ? "Active" : "Inactive"}
            </span>
          )}

          {/* Outlook folder badge */}
          {page.smartRuleFolderId && (
            <span className="flex h-6 items-center gap-1 rounded-md bg-sky-500/10 px-2 text-[10px] font-medium text-sky-600 dark:text-sky-400">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
              </svg>
              {page.smartRuleFolderName || "Outlook"}
            </span>
          )}
        </div>

        {/* Emoji picker */}
        {showEmojiPicker && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowEmojiPicker(false)} />
            <div className="absolute left-0 top-16 z-50 w-72 rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 shadow-lg">
              <p className="mb-2 text-xs font-medium text-[var(--muted-foreground)]">Choose icon</p>
              <div className="grid grid-cols-10 gap-1">
                {COMMON_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    className="flex h-7 w-7 items-center justify-center rounded text-lg hover:bg-[var(--accent)]"
                    onClick={() => handleEmojiSelect(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <button
                className="mt-2 text-xs text-[var(--destructive)] hover:underline"
                onClick={() => {
                  updatePage.mutate({ icon: "" });
                  setShowEmojiPicker(false);
                }}
              >
                Remove icon
              </button>
            </div>
          </>
        )}

        {/* Color picker dropdown */}
        {showColorPicker && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowColorPicker(false)} />
            <div className="absolute left-14 top-16 z-50 w-52 rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 shadow-lg">
              <p className="mb-2 text-xs font-medium text-[var(--muted-foreground)]">Page color</p>
              <div className="grid grid-cols-6 gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    className={`h-6 w-6 rounded-full border-2 transition-all hover:scale-110 ${
                      page.color === color ? "border-[var(--foreground)] ring-2 ring-[var(--primary)]" : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorSelect(color)}
                  />
                ))}
              </div>
              {page.color && (
                <button
                  className="mt-2 text-xs text-[var(--destructive)] hover:underline"
                  onClick={() => {
                    updatePage.mutate({ color: null });
                    setShowColorPicker(false);
                  }}
                >
                  Remove color
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Title */}
      <input
        ref={titleRef}
        type="text"
        value={title}
        onChange={handleTitleChange}
        placeholder="Untitled"
        className="w-full bg-transparent text-[2.5rem] font-bold leading-tight text-[var(--foreground)] placeholder-[var(--muted-foreground)]/40 outline-none"
      />
    </div>
  );
}
