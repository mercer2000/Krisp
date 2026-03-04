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
];

export function PageHeader({ page }: { page: Page }) {
  const [title, setTitle] = useState(page.title);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
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

  return (
    <div className="mb-8">
      {/* Icon */}
      <div className="relative mb-3">
        <button
          className="text-5xl leading-none hover:opacity-80 transition-opacity"
          onClick={handleIconClick}
          title="Change icon"
        >
          {page.icon || (page.isDatabase ? "📊" : "📄")}
        </button>
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
