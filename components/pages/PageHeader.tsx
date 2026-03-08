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
  const [showSmartConfig, setShowSmartConfig] = useState(false);
  const [smartRule, setSmartRule] = useState(page.smartRule || "");
  const [smartActive, setSmartActive] = useState(page.smartActive);
  const updatePage = useUpdatePage(page.id);
  const titleRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const isEntriesPage = page.pageType === "knowledge" || page.pageType === "decisions";
  const hasSmartRule = !!page.smartRule;
  const showSmartControls = isEntriesPage || hasSmartRule || page.pageType === "page";

  useEffect(() => {
    setTitle(page.title);
  }, [page.title]);

  useEffect(() => {
    setSmartRule(page.smartRule || "");
    setSmartActive(page.smartActive);
  }, [page.smartRule, page.smartActive]);

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

  const handleSaveSmartConfig = () => {
    updatePage.mutate({ smart_rule: smartRule || null, smart_active: smartActive });
    setShowSmartConfig(false);
  };

  return (
    <div className="mb-8">
      {/* Color bar for pages with a color set */}
      {page.color && (
        <div
          className="mb-4 h-1.5 rounded-full"
          style={{ backgroundColor: page.color }}
        />
      )}

      {/* Icon + page type badge */}
      <div className="relative mb-3 flex items-center gap-3">
        <button
          className="text-5xl leading-none hover:opacity-80 transition-opacity"
          onClick={handleIconClick}
          title="Change icon"
        >
          {page.icon || (page.pageType === "knowledge" ? "🧠" : page.pageType === "decisions" ? "⚖️" : page.isDatabase ? "📊" : "📄")}
        </button>

        {showSmartControls && (
          <div className="flex items-center gap-2">
            {isEntriesPage && (
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

            {/* Smart rule toggle */}
            <button
              className="flex h-6 items-center gap-1 rounded-md border border-[var(--border)] px-2 text-xs text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)] transition-colors"
              onClick={() => setShowSmartConfig(!showSmartConfig)}
              title="Configure smart rule"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
              </svg>
              Smart Rule
            </button>
          </div>
        )}

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

      {/* Smart Rule Configuration Panel */}
      {showSmartConfig && (
        <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">
              Smart Rule Configuration
            </h3>
            <button
              onClick={() => setShowSmartConfig(false)}
              className="rounded p-1 text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18" /><path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
          <p className="mb-3 text-xs text-[var(--muted-foreground)]">
            Define a rule and the AI will automatically add matching content (emails, knowledge, decisions) to this page.
          </p>
          <textarea
            value={smartRule}
            onChange={(e) => setSmartRule(e.target.value)}
            placeholder={
              page.pageType === "knowledge"
                ? "e.g., Technical architecture discussions and system design decisions"
                : page.pageType === "decisions"
                ? "e.g., Budget approvals and financial commitments over $1000"
                : "e.g., Emails about marketing partnerships or collaborations"
            }
            rows={3}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none"
          />
          <div className="mt-3 flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-[var(--foreground)]">
              <input
                type="checkbox"
                checked={smartActive}
                onChange={(e) => setSmartActive(e.target.checked)}
                className="h-4 w-4 rounded border-[var(--border)] accent-[var(--primary)]"
              />
              Auto-classify new content
            </label>
            <button
              onClick={handleSaveSmartConfig}
              className="rounded-lg bg-[var(--primary)] px-4 py-1.5 text-sm font-medium text-white transition-colors hover:opacity-90"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
