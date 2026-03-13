"use client";

import { useEffect, useRef, useMemo } from "react";
import {
  SHORTCUT_REGISTRY,
  formatShortcut,
  groupByCategory,
  type ShortcutCategory,
} from "@/lib/shortcuts/registry";
import { useIsMac } from "@/lib/hooks/useKeyboardShortcuts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ShortcutReferenceSheetProps {
  open: boolean;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Category ordering
// ---------------------------------------------------------------------------

const CATEGORY_ORDER: ShortcutCategory[] = [
  "Global",
  "Navigation",
  "Kanban",
  "Email",
  "Meetings",
  "Open Brain",
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ShortcutReferenceSheet({
  open,
  onClose,
}: ShortcutReferenceSheetProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const isMac = useIsMac();

  const grouped = useMemo(() => groupByCategory(), []);

  // Focus trap + escape
  useEffect(() => {
    if (!open) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
        style={{ animation: "srsFadeIn 100ms ease-out" }}
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard Shortcuts Reference"
        className="fixed left-1/2 top-[8%] z-[70] w-full max-w-2xl max-h-[84vh] -translate-x-1/2 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-2xl flex flex-col"
        style={{ animation: "srsModalIn 150ms ease-out" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <h2 className="text-base font-semibold text-[var(--foreground)]">
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)] transition-colors"
          >
            <kbd className="rounded border border-[var(--border)] bg-[var(--muted)] px-1.5 py-0.5 text-xs">
              Esc
            </kbd>
            close
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {CATEGORY_ORDER.map((cat) => {
              const entries = grouped.get(cat);
              if (!entries || entries.length === 0) return null;

              return (
                <div key={cat}>
                  <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                    {cat}
                  </h3>
                  <div className="space-y-1">
                    {entries.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-[var(--accent)] transition-colors"
                      >
                        <span className="text-[var(--foreground)]">
                          {entry.label}
                        </span>
                        <span className="flex items-center gap-1">
                          {entry.keys.length > 0 ? (
                            entry.keys.map((k, i) => (
                              <kbd
                                key={i}
                                className="inline-flex items-center gap-0.5 rounded border border-[var(--border)] bg-[var(--muted)] px-2 py-0.5 text-[11px] font-mono text-[var(--muted-foreground)]"
                              >
                                {formatShortcut(k, isMac)
                                  .split("+")
                                  .map((part, pi, arr) => (
                                    <span key={pi}>
                                      {part}
                                      {pi < arr.length - 1 && (
                                        <span className="mx-0.5 opacity-40">
                                          +
                                        </span>
                                      )}
                                    </span>
                                  ))}
                              </kbd>
                            ))
                          ) : (
                            <span className="text-xs text-[var(--muted-foreground)] opacity-40">
                              —
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--border)] px-6 py-3 text-xs text-[var(--muted-foreground)]">
          <span>
            Press{" "}
            <kbd className="rounded border border-[var(--border)] bg-[var(--muted)] px-1 py-0.5">
              {isMac ? "\u2318" : "Ctrl"}+K
            </kbd>{" "}
            to open the command palette
          </span>
        </div>
      </div>

      {/* Keyframe styles */}
      <style>{`
        @keyframes srsFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes srsModalIn {
          from {
            opacity: 0;
            transform: translateX(-50%) scale(0.95) translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) scale(1) translateY(0);
          }
        }
      `}</style>
    </>
  );
}
