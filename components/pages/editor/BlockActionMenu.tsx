"use client";

import { useState, useEffect, useRef } from "react";
import type { BlockType } from "@/types";

const TURN_INTO_OPTIONS: { type: BlockType; label: string; icon: string }[] = [
  { type: "paragraph", label: "Text", icon: "Aa" },
  { type: "heading_1", label: "Heading 1", icon: "H1" },
  { type: "heading_2", label: "Heading 2", icon: "H2" },
  { type: "heading_3", label: "Heading 3", icon: "H3" },
  { type: "bulleted_list", label: "Bulleted List", icon: "\u2022" },
  { type: "numbered_list", label: "Numbered List", icon: "1." },
  { type: "to_do", label: "To-do", icon: "\u2610" },
  { type: "quote", label: "Quote", icon: "\u201C" },
  { type: "code", label: "Code", icon: "</>" },
  { type: "callout", label: "Callout", icon: "\u{1F4A1}" },
];

interface BlockActionMenuProps {
  blockId: string;
  position: { top: number; left: number };
  blockType: BlockType;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onDelete: (blockId: string) => void;
  onDuplicate: (blockId: string) => void;
  onTurnInto: (blockId: string, type: BlockType) => void;
  onMoveUp: (blockId: string) => void;
  onMoveDown: (blockId: string) => void;
  onClose: () => void;
}

export function BlockActionMenu({
  blockId,
  position,
  blockType,
  canMoveUp,
  canMoveDown,
  onDelete,
  onDuplicate,
  onTurnInto,
  onMoveUp,
  onMoveDown,
  onClose,
}: BlockActionMenuProps) {
  const [showTurnInto, setShowTurnInto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (showTurnInto) {
          setShowTurnInto(false);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [onClose, showTurnInto]);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Menu */}
      <div
        ref={menuRef}
        className="fixed z-50 w-52 rounded-lg border border-[var(--border)] bg-[var(--card)] py-1 shadow-lg"
        style={{ top: position.top, left: position.left }}
      >
        {!showTurnInto ? (
          <>
            <MenuButton
              onClick={() => {
                onDelete(blockId);
              }}
              icon={
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3">
                  <path d="M2.5 3.5h9M5.5 3.5V2.5a1 1 0 011-1h1a1 1 0 011 1v1M3.5 3.5l.5 8a1 1 0 001 1h4a1 1 0 001-1l.5-8" />
                </svg>
              }
              label="Delete"
              shortcut="Del"
              destructive
            />
            <MenuButton
              onClick={() => onDuplicate(blockId)}
              icon={
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3">
                  <rect x="4" y="4" width="8" height="8" rx="1" />
                  <path d="M10 4V3a1 1 0 00-1-1H3a1 1 0 00-1 1v6a1 1 0 001 1h1" />
                </svg>
              }
              label="Duplicate"
              shortcut="Ctrl+D"
            />
            <div className="my-1 border-t border-[var(--border)]" />
            <MenuButton
              onClick={() => setShowTurnInto(true)}
              icon={
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3">
                  <path d="M2 5l3-3M2 5l3 3M2 5h8a2 2 0 012 2v2" />
                </svg>
              }
              label="Turn into"
              hasSubmenu
            />
            <div className="my-1 border-t border-[var(--border)]" />
            <MenuButton
              onClick={() => onMoveUp(blockId)}
              disabled={!canMoveUp}
              icon={
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3">
                  <path d="M7 11V3M7 3l-3 3M7 3l3 3" />
                </svg>
              }
              label="Move up"
            />
            <MenuButton
              onClick={() => onMoveDown(blockId)}
              disabled={!canMoveDown}
              icon={
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3">
                  <path d="M7 3v8M7 11l-3-3M7 11l3-3" />
                </svg>
              }
              label="Move down"
            />
          </>
        ) : (
          <>
            <button
              onClick={() => setShowTurnInto(false)}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-[var(--muted-foreground)] hover:bg-[var(--accent)] transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M7.5 2.5l-4 4 4 4" />
              </svg>
              Back
            </button>
            <div className="my-1 border-t border-[var(--border)]" />
            {TURN_INTO_OPTIONS.map((opt) => (
              <button
                key={opt.type}
                onClick={() => onTurnInto(blockId, opt.type)}
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors ${
                  opt.type === blockType
                    ? "bg-[var(--accent)] text-[var(--foreground)] font-medium"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
                }`}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded border border-[var(--border)] bg-[var(--background)] text-xs">
                  {opt.icon}
                </span>
                <span>{opt.label}</span>
                {opt.type === blockType && (
                  <svg
                    className="ml-auto"
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M2 7l3.5 3.5L12 4" />
                  </svg>
                )}
              </button>
            ))}
          </>
        )}
      </div>
    </>
  );
}

function MenuButton({
  onClick,
  icon,
  label,
  shortcut,
  hasSubmenu,
  destructive,
  disabled,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  hasSubmenu?: boolean;
  destructive?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors ${
        disabled
          ? "text-[var(--muted-foreground)]/40 cursor-not-allowed"
          : destructive
            ? "text-red-500 hover:bg-red-500/10"
            : "text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
      }`}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span className="flex-1">{label}</span>
      {shortcut && (
        <span className="text-xs text-[var(--muted-foreground)]/60">{shortcut}</span>
      )}
      {hasSubmenu && (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4.5 2.5l4 4-4 4" />
        </svg>
      )}
    </button>
  );
}
