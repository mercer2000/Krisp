"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface CopyToPageToolbarProps {
  /** The container element to listen for text selection */
  containerRef: React.RefObject<HTMLElement | null>;
  /** Called when "Copy to Page" is clicked with the selected text */
  onCopyToPage: (selectedText: string) => void;
}

export function CopyToPageToolbar({ containerRef, onCopyToPage }: CopyToPageToolbarProps) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [selectedText, setSelectedText] = useState("");
  const toolbarRef = useRef<HTMLDivElement>(null);

  const handleSelectionChange = useCallback(() => {
    const selection = window.getSelection();
    if (
      !selection ||
      selection.isCollapsed ||
      !selection.toString().trim() ||
      !containerRef.current
    ) {
      // Small delay to allow click events on toolbar to fire before hiding
      setTimeout(() => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed || !sel.toString().trim()) {
          setVisible(false);
        }
      }, 200);
      return;
    }

    // Check if selection is within our container
    const range = selection.getRangeAt(0);
    if (!containerRef.current.contains(range.commonAncestorContainer)) {
      setVisible(false);
      return;
    }

    const text = selection.toString().trim();
    if (text.length < 5) {
      setVisible(false);
      return;
    }

    setSelectedText(text);

    // Position toolbar above the selection
    const rect = range.getBoundingClientRect();
    setPosition({
      top: rect.top + window.scrollY - 44,
      left: rect.left + window.scrollX + rect.width / 2,
    });
    setVisible(true);
  }, [containerRef]);

  useEffect(() => {
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [handleSelectionChange]);

  if (!visible) return null;

  return (
    <div
      ref={toolbarRef}
      className="fixed z-[55] animate-[fadeIn_100ms_ease-out]"
      style={{
        top: position.top,
        left: position.left,
        transform: "translateX(-50%)",
      }}
    >
      <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-lg">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onCopyToPage(selectedText);
            setVisible(false);
          }}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
          title="Copy selected text to a page"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m22 2-7 20-4-9-9-4Z" />
            <path d="M22 2 11 13" />
          </svg>
          Copy to Page
        </button>
      </div>
      {/* Arrow pointing down */}
      <div className="flex justify-center">
        <div
          className="w-2 h-2 rotate-45 border-r border-b border-[var(--border)] bg-[var(--card)]"
          style={{ marginTop: "-5px" }}
        />
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(4px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}
