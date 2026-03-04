"use client";

import { useState, useEffect, useRef } from "react";
import type { BlockType } from "@/types";

interface SlashCommandItem {
  type: BlockType;
  label: string;
  description: string;
  icon: string;
}

const SLASH_COMMANDS: SlashCommandItem[] = [
  { type: "paragraph", label: "Text", description: "Plain text block", icon: "Aa" },
  { type: "heading_1", label: "Heading 1", description: "Large heading", icon: "H1" },
  { type: "heading_2", label: "Heading 2", description: "Medium heading", icon: "H2" },
  { type: "heading_3", label: "Heading 3", description: "Small heading", icon: "H3" },
  { type: "bulleted_list", label: "Bulleted List", description: "Unordered list", icon: "•" },
  { type: "numbered_list", label: "Numbered List", description: "Ordered list", icon: "1." },
  { type: "to_do", label: "To-do", description: "Checkbox item", icon: "☐" },
  { type: "toggle", label: "Toggle", description: "Collapsible block", icon: "▶" },
  { type: "code", label: "Code", description: "Code snippet", icon: "</>" },
  { type: "quote", label: "Quote", description: "Block quote", icon: "\u201C" },
  { type: "divider", label: "Divider", description: "Horizontal line", icon: "—" },
  { type: "callout", label: "Callout", description: "Highlighted note", icon: "💡" },
];

interface SlashCommandMenuProps {
  position: { top: number; left: number };
  filter: string;
  onSelect: (type: BlockType) => void;
  onClose: () => void;
}

export function SlashCommandMenu({
  position,
  filter,
  onSelect,
  onClose,
}: SlashCommandMenuProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const filtered = SLASH_COMMANDS.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(filter.toLowerCase()) ||
      cmd.type.includes(filter.toLowerCase())
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [filter]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % filtered.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + filtered.length) % filtered.length);
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[activeIndex]) {
          onSelect(filtered[activeIndex].type);
        }
        return;
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [filtered, activeIndex, onSelect, onClose]);

  // Scroll active item into view
  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    const item = menu.children[activeIndex] as HTMLElement;
    item?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  if (filtered.length === 0) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        ref={menuRef}
        className="fixed z-50 max-h-72 w-64 overflow-auto rounded-lg border border-[var(--border)] bg-[var(--card)] py-1 shadow-lg"
        style={{ top: position.top, left: position.left }}
      >
        {filtered.map((cmd, i) => (
          <button
            key={cmd.type}
            className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors ${
              i === activeIndex
                ? "bg-[var(--accent)] text-[var(--foreground)]"
                : "text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
            }`}
            onClick={() => onSelect(cmd.type)}
            onMouseEnter={() => setActiveIndex(i)}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--background)] text-xs font-medium">
              {cmd.icon}
            </span>
            <div>
              <p className="font-medium text-[var(--foreground)]">{cmd.label}</p>
              <p className="text-xs text-[var(--muted-foreground)]">{cmd.description}</p>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
