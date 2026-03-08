"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useToast } from "@/components/ui/Toast";
import type { EmailListItem } from "@/types/email";
import type { Page, Workspace } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SendToPageModalProps {
  open: boolean;
  onClose: () => void;
  /** The emails to forward (single or bulk) */
  emails: EmailListItem[];
  /** Optional pre-selected text from the email body */
  selectedText?: string;
  /** Callback after successful send */
  onSent?: (destinationTitle: string, destinationType: "page" | "card", destinationId: string) => void;
}

interface CardSearchResult {
  id: string;
  title: string;
  boardTitle: string;
  columnTitle: string;
}

type DestinationType = "page" | "card" | "new-page";

interface Destination {
  id: string;
  type: DestinationType;
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Session memory for last-used destination
// ---------------------------------------------------------------------------

let lastUsedDestination: { id: string; type: "page" | "card"; label: string } | null = null;

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function SearchIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-[var(--muted-foreground)]">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function PageIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <line x1="3" x2="21" y1="9" y2="9" />
      <line x1="9" x2="9" y1="21" y2="9" />
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

function SendIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SendToPageModal({
  open,
  onClose,
  emails,
  selectedText,
  onSent,
}: SendToPageModalProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [sending, setSending] = useState(false);
  const [pages, setPages] = useState<Page[]>([]);
  const [cards, setCards] = useState<CardSearchResult[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState("");
  const [showNewPageInput, setShowNewPageInput] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // ── Fetch workspaces on open ──
  useEffect(() => {
    if (!open) return;
    fetch("/api/pages/workspaces")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setWorkspaces(data);
      })
      .catch(() => {});
  }, [open]);

  // ── Search pages and cards ──
  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        // Search pages across all workspaces
        const pageResults: Page[] = [];
        for (const ws of workspaces) {
          const url = query
            ? `/api/pages/search?workspace_id=${ws.id}&q=${encodeURIComponent(query)}`
            : `/api/pages?workspace_id=${ws.id}`;
          const res = await fetch(url, { signal: controller.signal });
          if (res.ok) {
            const data = await res.json();
            const list = Array.isArray(data) ? data : [];
            pageResults.push(...list);
          }
        }
        setPages(pageResults);

        // Search kanban cards
        if (query.length >= 2) {
          const boardsRes = await fetch("/api/v1/boards", { signal: controller.signal });
          if (boardsRes.ok) {
            const boardsData = await boardsRes.json();
            const boardList = Array.isArray(boardsData) ? boardsData : (boardsData.data ?? []);
            const cardResults: CardSearchResult[] = [];
            for (const board of boardList.slice(0, 5)) {
              const searchRes = await fetch(
                `/api/v1/boards/${board.id}/cards/search?q=${encodeURIComponent(query)}`,
                { signal: controller.signal },
              );
              if (searchRes.ok) {
                const searchData = await searchRes.json();
                const cardList = Array.isArray(searchData) ? searchData : (searchData.data ?? []);
                cardResults.push(
                  ...cardList.map((c: { id: string; title: string; columnTitle?: string }) => ({
                    id: c.id,
                    title: c.title,
                    boardTitle: board.title,
                    columnTitle: c.columnTitle || "",
                  })),
                );
              }
            }
            setCards(cardResults);
          }
        } else {
          setCards([]);
        }
      } catch {
        // Ignore abort errors
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, open, workspaces]);

  // ── Build destination list ──
  const destinations: Destination[] = useMemo(() => {
    const items: Destination[] = [];

    // Last used destination (if matches query or no query)
    if (
      lastUsedDestination &&
      (!query || lastUsedDestination.label.toLowerCase().includes(query.toLowerCase()))
    ) {
      items.push({
        id: `recent-${lastUsedDestination.id}`,
        type: lastUsedDestination.type as DestinationType,
        label: lastUsedDestination.label,
        sublabel: "Recently used",
        icon: <HistoryIcon />,
      });
    }

    // Pages
    for (const page of pages) {
      // Skip if already shown as recent
      if (lastUsedDestination && page.id === lastUsedDestination.id) continue;
      items.push({
        id: page.id,
        type: "page",
        label: page.title || "Untitled",
        sublabel: page.icon || undefined,
        icon: <PageIcon />,
      });
    }

    // Cards
    for (const card of cards) {
      if (lastUsedDestination && card.id === lastUsedDestination.id) continue;
      items.push({
        id: card.id,
        type: "card",
        label: card.title,
        sublabel: `${card.boardTitle}${card.columnTitle ? ` / ${card.columnTitle}` : ""}`,
        icon: <CardIcon />,
      });
    }

    // Create new page option
    items.push({
      id: "new-page",
      type: "new-page",
      label: query ? `Create new page: "${query}"` : "Create new page",
      icon: <PlusIcon />,
    });

    return items;
  }, [pages, cards, query]);

  // ── Reset state on open/close ──
  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      setSending(false);
      setShowNewPageInput(false);
      setNewPageTitle("");
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // ── Keep active index in bounds ──
  useEffect(() => {
    setActiveIndex(0);
  }, [destinations.length]);

  // ── Scroll active item into view ──
  useEffect(() => {
    if (!listRef.current) return;
    const active = listRef.current.querySelector('[data-active="true"]');
    active?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  // ── Send handler ──
  const handleSend = useCallback(
    async (dest: Destination) => {
      if (sending) return;
      setSending(true);

      try {
        // Handle "new page" creation
        if (dest.type === "new-page") {
          if (!showNewPageInput) {
            setShowNewPageInput(true);
            setNewPageTitle(query || (emails.length === 1 ? (emails[0].subject || "") : ""));
            setSending(false);
            return;
          }

          if (!workspaces[0]) {
            toast({ title: "No workspace found", variant: "destructive" });
            setSending(false);
            return;
          }

          const res = await fetch("/api/inbox/send-to-page", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              destination_type: "page",
              create_new_page: true,
              new_page_title: newPageTitle || query || "Forwarded Email",
              workspace_id: workspaces[0].id,
              emails: emails.map(formatEmailPayload),
              selected_text: selectedText,
            }),
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || "Failed to send");
          }

          const data = await res.json();
          lastUsedDestination = {
            id: data.destination_id,
            type: "page",
            label: data.destination_title,
          };
          onSent?.(data.destination_title, "page", data.destination_id);
          onClose();
          return;
        }

        // Send to existing page or card
        const actualId = dest.id.startsWith("recent-") ? dest.id.replace("recent-", "") : dest.id;
        const actualType = dest.type as "page" | "card";

        const res = await fetch("/api/inbox/send-to-page", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            destination_type: actualType,
            destination_id: actualId,
            emails: emails.map(formatEmailPayload),
            selected_text: selectedText,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to send");
        }

        const data = await res.json();
        lastUsedDestination = {
          id: actualId,
          type: actualType,
          label: data.destination_title || dest.label,
        };
        onSent?.(data.destination_title || dest.label, actualType, actualId);
        onClose();
      } catch (error) {
        toast({
          title: "Failed to send",
          description: error instanceof Error ? error.message : "Something went wrong",
          variant: "destructive",
        });
        setSending(false);
      }
    },
    [sending, emails, selectedText, onSent, onClose, toast, query, newPageTitle, showNewPageInput, workspaces],
  );

  // ── Keyboard navigation ──
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      if (showNewPageInput) {
        setShowNewPageInput(false);
        setSending(false);
      } else {
        onClose();
      }
      return;
    }
    if (showNewPageInput) {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSend(destinations.find((d) => d.type === "new-page")!);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, destinations.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === "Enter" && destinations[activeIndex]) {
      e.preventDefault();
      handleSend(destinations[activeIndex]);
      return;
    }
  };

  if (!open) return null;

  const emailCount = emails.length;
  const headerText = selectedText
    ? "Send excerpt to..."
    : emailCount === 1
      ? "Send email to..."
      : `Send ${emailCount} emails to...`;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm animate-[fadeIn_100ms_ease-out]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Send to Page"
        className="fixed left-1/2 top-[15%] z-[60] w-full max-w-xl -translate-x-1/2 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-2xl animate-[modalIn_150ms_ease-out]"
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--border)] bg-[var(--secondary)]/50">
          <SendIcon />
          <span className="text-sm font-medium text-[var(--foreground)]">
            {headerText}
          </span>
          {selectedText && (
            <span className="text-xs text-[var(--muted-foreground)] truncate max-w-[200px]">
              &quot;{selectedText.slice(0, 60)}{selectedText.length > 60 ? "..." : ""}&quot;
            </span>
          )}
        </div>

        {/* New page title input (shown when creating new page) */}
        {showNewPageInput ? (
          <div className="px-4 py-3 border-b border-[var(--border)]">
            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1.5">
              New page title
            </label>
            <input
              type="text"
              value={newPageTitle}
              onChange={(e) => setNewPageTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter page title..."
              className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
              autoFocus
            />
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => handleSend(destinations.find((d) => d.type === "new-page")!)}
                disabled={sending}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-[var(--primary)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {sending ? "Creating..." : "Create & Send"}
              </button>
              <button
                onClick={() => { setShowNewPageInput(false); setSending(false); }}
                className="px-3 py-1.5 text-xs font-medium rounded-md text-[var(--muted-foreground)] hover:bg-[var(--accent)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Search input */}
            <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
              <SearchIcon />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search pages, cards, or create new..."
                className="flex-1 bg-transparent text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] outline-none"
              />
              {loading && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--muted-foreground)] border-t-transparent" />
              )}
              <kbd className="rounded border border-[var(--border)] bg-[var(--muted)] px-1.5 py-0.5 text-xs text-[var(--muted-foreground)]">
                Esc
              </kbd>
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-80 overflow-auto py-1">
              {destinations.length === 0 && query.length > 0 && !loading && (
                <p className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
                  No results found
                </p>
              )}

              {/* Group by sections */}
              {renderSection("Recently Used", destinations.filter((d) => d.sublabel === "Recently used"))}
              {renderSection("Pages", destinations.filter((d) => d.type === "page" && d.sublabel !== "Recently used"))}
              {renderSection("Kanban Cards", destinations.filter((d) => d.type === "card" && d.sublabel !== "Recently used"))}
              {renderSection("Create New", destinations.filter((d) => d.type === "new-page"))}

              {!query && destinations.length <= 2 && (
                <p className="px-4 py-4 text-center text-xs text-[var(--muted-foreground)]">
                  Start typing to search across pages and kanban cards...
                </p>
              )}
            </div>
          </>
        )}

        {/* Footer */}
        {!showNewPageInput && (
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
        )}
      </div>

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

  // ── Render a section of destinations ──
  function renderSection(title: string, items: Destination[]) {
    if (items.length === 0) return null;

    return (
      <div key={title}>
        <div className="px-4 pb-1 pt-3 text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
          {title}
        </div>
        {items.map((dest) => {
          const globalIndex = destinations.indexOf(dest);
          const isActive = globalIndex === activeIndex;
          return (
            <button
              key={dest.id}
              data-active={isActive}
              className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors ${
                isActive
                  ? "bg-[var(--accent)] text-[var(--foreground)]"
                  : "text-[var(--foreground)] hover:bg-[var(--accent)]"
              }`}
              onClick={() => handleSend(dest)}
              onMouseEnter={() => setActiveIndex(globalIndex)}
              disabled={sending}
            >
              <span className="shrink-0 text-[var(--muted-foreground)]">
                {dest.icon}
              </span>
              <span className="flex-1 truncate">{dest.label}</span>
              {dest.sublabel && dest.sublabel !== "Recently used" && (
                <span className="text-xs text-[var(--muted-foreground)] truncate max-w-[200px]">
                  {dest.sublabel}
                </span>
              )}
              {dest.sublabel === "Recently used" && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--primary)]/10 text-[var(--primary)]">
                  Recent
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }
}

// ── Helper to format email for API payload ──
function formatEmailPayload(email: EmailListItem) {
  return {
    id: email.id,
    sender: email.sender,
    subject: email.subject,
    received_at: email.received_at,
    preview: email.preview,
  };
}
