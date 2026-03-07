"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CommandItem {
  id: string;
  label: string;
  section: string;
  icon: React.ReactNode;
  shortcut?: string;
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
}

// ---------------------------------------------------------------------------
// Fuzzy match helper
// ---------------------------------------------------------------------------

function fuzzyMatch(text: string, query: string): boolean {
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  let qi = 0;
  for (let i = 0; i < lower.length && qi < q.length; i++) {
    if (lower[i] === q[qi]) qi++;
  }
  return qi === q.length;
}

// ---------------------------------------------------------------------------
// Icons (inline SVGs matching codebase style)
// ---------------------------------------------------------------------------

function SearchIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-[var(--muted-foreground)]">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function NavIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function MeetingIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 18a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <circle cx="12" cy="10" r="2" />
      <line x1="8" x2="8" y1="2" y2="4" />
      <line x1="16" x2="16" y1="2" y2="4" />
    </svg>
  );
}

function BrainCaptureIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
      <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [meetingResults, setMeetingResults] = useState<MeetingResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Navigate helper
  const go = useCallback(
    (href: string) => {
      router.push(href);
      onClose();
    },
    [router, onClose]
  );

  // ---- Static commands (navigation + actions) ----------------------------
  const staticCommands: CommandItem[] = useMemo(
    () => [
      // Navigation
      { id: "nav-brain", label: "Open Brain", section: "Navigation", icon: <NavIcon />, shortcut: "Ctrl+B", onSelect: () => go("/brain") },
      { id: "nav-dashboard", label: "Go to Dashboard", section: "Navigation", icon: <NavIcon />, onSelect: () => go("/dashboard") },
      { id: "nav-boards", label: "Go to Kanban Boards", section: "Navigation", icon: <NavIcon />, onSelect: () => go("/boards") },
      { id: "nav-inbox", label: "Go to Inbox", section: "Navigation", icon: <NavIcon />, onSelect: () => go("/inbox") },
      { id: "nav-meetings", label: "Go to Meetings", section: "Navigation", icon: <NavIcon />, onSelect: () => go("/krisp") },
      { id: "nav-calendar", label: "Go to Calendar", section: "Navigation", icon: <NavIcon />, onSelect: () => go("/calendar") },
      { id: "nav-decisions", label: "Go to Decisions", section: "Navigation", icon: <NavIcon />, onSelect: () => go("/decisions") },
      { id: "nav-reviews", label: "Go to Weekly Reviews", section: "Navigation", icon: <NavIcon />, onSelect: () => go("/weekly-reviews") },
      { id: "nav-pages", label: "Go to Pages", section: "Navigation", icon: <NavIcon />, onSelect: () => go("/workspace") },
      { id: "nav-analytics", label: "Go to Analytics", section: "Navigation", icon: <NavIcon />, onSelect: () => go("/analytics") },
      { id: "nav-integrations", label: "Go to Integrations", section: "Navigation", icon: <NavIcon />, onSelect: () => go("/admin/integrations") },
      { id: "nav-prompts", label: "Go to AI Prompts", section: "Navigation", icon: <NavIcon />, onSelect: () => go("/admin/prompts") },
      { id: "nav-extensions", label: "Go to Extensions", section: "Navigation", icon: <NavIcon />, onSelect: () => go("/admin/extensions") },
      // Actions
      { id: "action-brain-capture", label: "Capture to Brain", section: "Actions", icon: <BrainCaptureIcon />, onSelect: () => go("/brain") },
      { id: "action-new-card", label: "Create New Card", section: "Actions", icon: <PlusIcon />, onSelect: () => go("/boards") },
      { id: "action-compose-email", label: "Compose Email", section: "Actions", icon: <MailIcon />, onSelect: () => go("/inbox") },
      { id: "action-search-meetings", label: "Search Meetings", section: "Actions", icon: <MeetingIcon />, onSelect: () => go("/krisp") },
    ],
    [go]
  );

  // ---- Filter static commands by query ----------------------------------
  const filteredStatic = useMemo(() => {
    if (!query) return staticCommands;
    return staticCommands.filter((cmd) => fuzzyMatch(cmd.label, query));
  }, [query, staticCommands]);

  // ---- Meeting search items ---------------------------------------------
  const meetingItems: CommandItem[] = useMemo(
    () =>
      meetingResults.map((m) => ({
        id: `meeting-${m.id}`,
        label: m.title,
        section: "Meetings",
        icon: <MeetingIcon />,
        shortcut: m.date ?? undefined,
        onSelect: () => go(`/krisp?meeting_id=${m.id}`),
      })),
    [meetingResults, go]
  );

  // ---- All visible items ------------------------------------------------
  const allItems = useMemo(
    () => [...filteredStatic, ...meetingItems],
    [filteredStatic, meetingItems]
  );

  // ---- Debounced meeting search -----------------------------------------
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
          { signal: controller.signal }
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

  // ---- Reset state on open/close ----------------------------------------
  useEffect(() => {
    if (open) {
      setQuery("");
      setMeetingResults([]);
      setActiveIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // ---- Keep active index in bounds --------------------------------------
  useEffect(() => {
    setActiveIndex(0);
  }, [allItems.length]);

  // ---- Scroll active item into view -------------------------------------
  useEffect(() => {
    if (!listRef.current) return;
    const active = listRef.current.querySelector('[data-active="true"]');
    active?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  // ---- Keyboard navigation ----------------------------------------------
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
      allItems[activeIndex].onSelect();
      return;
    }
  };

  if (!open) return null;

  // ---- Group items by section for rendering -----------------------------
  const sections: { title: string; items: CommandItem[] }[] = [];
  const sectionMap = new Map<string, CommandItem[]>();
  for (const item of allItems) {
    let arr = sectionMap.get(item.section);
    if (!arr) {
      arr = [];
      sectionMap.set(item.section, arr);
      sections.push({ title: item.section, items: arr });
    }
    arr.push(item);
  }

  // Global index counter for active highlighting
  let globalIdx = 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm animate-[fadeIn_100ms_ease-out]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Palette */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command Palette"
        className="fixed left-1/2 top-[15%] z-[60] w-full max-w-xl -translate-x-1/2 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-2xl animate-[modalIn_150ms_ease-out]"
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
          />
          {searchLoading && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--muted-foreground)] border-t-transparent" />
          )}
          <kbd className="rounded border border-[var(--border)] bg-[var(--muted)] px-1.5 py-0.5 text-xs text-[var(--muted-foreground)]">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-80 overflow-auto py-1">
          {allItems.length === 0 && query.length > 0 && (
            <p className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
              No results found
            </p>
          )}

          {sections.map((section) => (
            <div key={section.title}>
              <div className="px-4 pb-1 pt-3 text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                {section.title}
              </div>
              {section.items.map((item) => {
                const idx = globalIdx++;
                const isActive = idx === activeIndex;
                return (
                  <button
                    key={item.id}
                    data-active={isActive}
                    className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors ${
                      isActive
                        ? "bg-[var(--accent)] text-[var(--foreground)]"
                        : "text-[var(--foreground)] hover:bg-[var(--accent)]"
                    }`}
                    onClick={() => item.onSelect()}
                    onMouseEnter={() => setActiveIndex(idx)}
                  >
                    <span className="shrink-0 text-[var(--muted-foreground)]">
                      {item.icon}
                    </span>
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.shortcut && (
                      <kbd className="ml-auto rounded border border-[var(--border)] bg-[var(--muted)] px-1.5 py-0.5 text-[10px] text-[var(--muted-foreground)]">
                        {item.shortcut}
                      </kbd>
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {!query && (
            <p className="px-4 py-4 text-center text-xs text-[var(--muted-foreground)]">
              Start typing to search across navigation, meetings, and actions...
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 border-t border-[var(--border)] px-4 py-2 text-xs text-[var(--muted-foreground)]">
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-[var(--border)] bg-[var(--muted)] px-1 py-0.5">&uarr;</kbd>
            <kbd className="rounded border border-[var(--border)] bg-[var(--muted)] px-1 py-0.5">&darr;</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-[var(--border)] bg-[var(--muted)] px-1 py-0.5">&crarr;</kbd>
            select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-[var(--border)] bg-[var(--muted)] px-1 py-0.5">Esc</kbd>
            close
          </span>
        </div>
      </div>

      {/* Keyframe styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes modalIn {
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
