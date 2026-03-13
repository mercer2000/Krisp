"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import {
  SHORTCUT_REGISTRY,
  primaryShortcutDisplay,
} from "@/lib/shortcuts/registry";
import { useIsMac } from "@/lib/hooks/useKeyboardShortcuts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CommandItem {
  id: string;
  label: string;
  section: string;
  icon: React.ReactNode;
  shortcut?: string;
  description?: string;
  onSelect: () => void;
}

interface MeetingResult {
  id: number;
  title: string;
  date: string | null;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onOpenShortcutSheet?: () => void;
}

// ---------------------------------------------------------------------------
// Fuzzy match helper — returns matched char indices for highlighting
// ---------------------------------------------------------------------------

function fuzzyMatch(
  text: string,
  query: string,
): { matches: boolean; indices: number[] } {
  if (!query) return { matches: true, indices: [] };
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  const indices: number[] = [];
  let qi = 0;
  for (let i = 0; i < lower.length && qi < q.length; i++) {
    if (lower[i] === q[qi]) {
      indices.push(i);
      qi++;
    }
  }
  return { matches: qi === q.length, indices };
}

// ---------------------------------------------------------------------------
// Highlighted label renderer
// ---------------------------------------------------------------------------

function HighlightedLabel({
  text,
  indices,
}: {
  text: string;
  indices: number[];
}) {
  if (indices.length === 0) return <>{text}</>;
  const set = new Set(indices);
  return (
    <>
      {text.split("").map((char, i) =>
        set.has(i) ? (
          <span key={i} className="text-[var(--primary)] font-semibold">
            {char}
          </span>
        ) : (
          <span key={i}>{char}</span>
        ),
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Category → icon mapping
// ---------------------------------------------------------------------------

function CategoryIcon({ category }: { category: string }) {
  switch (category) {
    case "Navigation":
      return (
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
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      );
    case "Kanban":
      return (
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
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M9 3v18" />
          <path d="M15 3v18" />
        </svg>
      );
    case "Email":
      return (
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
        >
          <rect width="20" height="16" x="2" y="4" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
      );
    case "Meetings":
      return (
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
        >
          <path d="M17 18a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2" />
          <rect width="18" height="18" x="3" y="4" rx="2" />
          <circle cx="12" cy="10" r="2" />
          <line x1="8" x2="8" y1="2" y2="4" />
          <line x1="16" x2="16" y1="2" y2="4" />
        </svg>
      );
    case "Open Brain":
      return (
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
        >
          <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
          <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
          <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
        </svg>
      );
    case "Global":
      return (
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
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
          <path d="M2 12h20" />
        </svg>
      );
    default:
      return (
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
        >
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
  }
}

function SearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 text-[var(--muted-foreground)]"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CommandPalette({
  open,
  onClose,
  onOpenShortcutSheet,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [meetingResults, setMeetingResults] = useState<MeetingResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const isMac = useIsMac();

  // Navigate helper
  const go = useCallback(
    (href: string) => {
      router.push(href);
      onClose();
    },
    [router, onClose],
  );

  // ---- Build commands from the shortcut registry --------------------------
  const staticCommands: CommandItem[] = useMemo(() => {
    const items: CommandItem[] = [];

    for (const entry of SHORTCUT_REGISTRY) {
      // Skip the palette toggle itself — it's handled externally
      if (entry.isPaletteToggle) continue;

      // Special handling for shortcut-reference
      if (entry.id === "shortcut-reference") {
        items.push({
          id: entry.id,
          label: entry.label,
          section: entry.category,
          icon: <CategoryIcon category={entry.category} />,
          shortcut: primaryShortcutDisplay(entry, isMac),
          description: entry.description,
          onSelect: () => {
            onClose();
            onOpenShortcutSheet?.();
          },
        });
        continue;
      }

      let onSelect: () => void;
      if (entry.action.type === "navigate") {
        const href = entry.action.href;
        onSelect = () => go(href);
      } else {
        // callback type — dispatch a custom event so AppShell can handle it
        const actionId =
          entry.action.type === "callback" ? entry.action.id : entry.id;
        onSelect = () => {
          window.dispatchEvent(
            new CustomEvent("palette-action", { detail: actionId }),
          );
          onClose();
        };
      }

      items.push({
        id: entry.id,
        label: entry.label,
        section: entry.category,
        icon: <CategoryIcon category={entry.category} />,
        shortcut: primaryShortcutDisplay(entry, isMac),
        description: entry.description,
        onSelect,
      });
    }

    return items;
  }, [go, onClose, onOpenShortcutSheet, isMac]);

  // ---- Filter static commands by query with fuzzy matching ----------------
  const filteredStatic = useMemo(() => {
    if (!query)
      return staticCommands.map((cmd) => ({ cmd, indices: [] as number[] }));
    const results: { cmd: CommandItem; indices: number[] }[] = [];
    for (const cmd of staticCommands) {
      const { matches, indices } = fuzzyMatch(cmd.label, query);
      if (matches) results.push({ cmd, indices });
    }
    return results;
  }, [query, staticCommands]);

  // ---- Meeting search items -----------------------------------------------
  const meetingItems: { cmd: CommandItem; indices: number[] }[] = useMemo(
    () =>
      meetingResults.map((m) => ({
        cmd: {
          id: `meeting-${m.id}`,
          label: m.title,
          section: "Meetings",
          icon: <CategoryIcon category="Meetings" />,
          shortcut: m.date ?? undefined,
          onSelect: () => go(`/krisp?meeting_id=${m.id}`),
        },
        indices: [],
      })),
    [meetingResults, go],
  );

  // ---- All visible items --------------------------------------------------
  const allItems = useMemo(
    () => [...filteredStatic, ...meetingItems],
    [filteredStatic, meetingItems],
  );

  // ---- Debounced meeting search -------------------------------------------
  useEffect(() => {
    if (!open || query.length < 2) {
      setMeetingResults([]);
      return;
    }

    setSearchLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/command-palette/search?q=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        );
        if (res.ok) {
          const data = await res.json();
          setMeetingResults(data.meetings ?? []);
        }
      } catch {
        // Ignore abort errors
      } finally {
        setSearchLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, open]);

  // ---- Reset state on open/close ------------------------------------------
  useEffect(() => {
    if (open) {
      setQuery("");
      setMeetingResults([]);
      setActiveIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // ---- Keep active index in bounds ----------------------------------------
  useEffect(() => {
    setActiveIndex(0);
  }, [allItems.length]);

  // ---- Scroll active item into view ---------------------------------------
  useEffect(() => {
    if (!listRef.current) return;
    const active = listRef.current.querySelector('[data-active="true"]');
    active?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  // ---- Keyboard navigation ------------------------------------------------
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, allItems.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === "Enter" && allItems[activeIndex]) {
      e.preventDefault();
      allItems[activeIndex].cmd.onSelect();
      return;
    }
  };

  if (!open) return null;

  // ---- Group items by section for rendering -------------------------------
  const sections: {
    title: string;
    items: { cmd: CommandItem; indices: number[] }[];
  }[] = [];
  const sectionMap = new Map<
    string,
    { cmd: CommandItem; indices: number[] }[]
  >();
  for (const item of allItems) {
    let arr = sectionMap.get(item.cmd.section);
    if (!arr) {
      arr = [];
      sectionMap.set(item.cmd.section, arr);
      sections.push({ title: item.cmd.section, items: arr });
    }
    arr.push(item);
  }

  // Global index counter for active highlighting
  let globalIdx = 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
        style={{ animation: "cpFadeIn 100ms ease-out" }}
      />

      {/* Palette */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command Palette"
        className="fixed left-1/2 top-[15%] z-[60] w-full max-w-xl -translate-x-1/2 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-2xl"
        style={{ animation: "cpModalIn 150ms ease-out" }}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
          <SearchIcon />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] outline-none"
            role="combobox"
            aria-expanded="true"
            aria-controls="command-palette-list"
            aria-activedescendant={
              allItems[activeIndex]
                ? `cp-item-${allItems[activeIndex].cmd.id}`
                : undefined
            }
          />
          {searchLoading && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--muted-foreground)] border-t-transparent" />
          )}
          <kbd className="rounded border border-[var(--border)] bg-[var(--muted)] px-1.5 py-0.5 text-xs text-[var(--muted-foreground)]">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          id="command-palette-list"
          role="listbox"
          className="max-h-80 overflow-auto py-1"
        >
          {allItems.length === 0 && query.length > 0 && (
            <p className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
              No results found
            </p>
          )}

          {sections.map((section) => (
            <div key={section.title} role="group" aria-label={section.title}>
              <div className="px-4 pb-1 pt-3 text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                {section.title}
              </div>
              {section.items.map((item) => {
                const idx = globalIdx++;
                const isActive = idx === activeIndex;
                return (
                  <button
                    key={item.cmd.id}
                    id={`cp-item-${item.cmd.id}`}
                    role="option"
                    aria-selected={isActive}
                    data-active={isActive}
                    className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors ${
                      isActive
                        ? "bg-[var(--accent)] text-[var(--foreground)]"
                        : "text-[var(--foreground)] hover:bg-[var(--accent)]"
                    }`}
                    onClick={() => item.cmd.onSelect()}
                    onMouseEnter={() => setActiveIndex(idx)}
                  >
                    <span className="shrink-0 text-[var(--muted-foreground)]">
                      {item.cmd.icon}
                    </span>
                    <span className="flex-1 truncate">
                      <HighlightedLabel
                        text={item.cmd.label}
                        indices={item.indices}
                      />
                      {item.cmd.description && (
                        <span className="ml-2 text-xs text-[var(--muted-foreground)]">
                          {item.cmd.description}
                        </span>
                      )}
                    </span>
                    {item.cmd.shortcut && (
                      <kbd className="ml-auto shrink-0 rounded border border-[var(--border)] bg-[var(--muted)] px-1.5 py-0.5 text-[10px] text-[var(--muted-foreground)]">
                        {item.cmd.shortcut}
                      </kbd>
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {!query && (
            <p className="px-4 py-4 text-center text-xs text-[var(--muted-foreground)]">
              Start typing to search across navigation, meetings, and
              actions...
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 border-t border-[var(--border)] px-4 py-2 text-xs text-[var(--muted-foreground)]">
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-[var(--border)] bg-[var(--muted)] px-1 py-0.5">
              &uarr;
            </kbd>
            <kbd className="rounded border border-[var(--border)] bg-[var(--muted)] px-1 py-0.5">
              &darr;
            </kbd>
            navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-[var(--border)] bg-[var(--muted)] px-1 py-0.5">
              &crarr;
            </kbd>
            select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-[var(--border)] bg-[var(--muted)] px-1 py-0.5">
              Esc
            </kbd>
            close
          </span>
          <span className="ml-auto flex items-center gap-1">
            <kbd className="rounded border border-[var(--border)] bg-[var(--muted)] px-1 py-0.5">
              ?
            </kbd>
            all shortcuts
          </span>
        </div>
      </div>

      {/* Keyframe styles */}
      <style>{`
        @keyframes cpFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes cpModalIn {
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
