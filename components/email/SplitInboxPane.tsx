"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { EmailListItem, EmailListResponse, EmailLabelChip } from "@/types/email";
import type { InboxSection, InboxSectionFilterCriteria } from "@/types/inboxSection";
import { useAppAwarePolling } from "@/lib/mobile/app-state";
import { isNativeMobile } from "@/lib/mobile/platform";

const PANE_POLL_INTERVAL = isNativeMobile() ? 60_000 : 20_000;

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Now";
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function ProviderIcon({ provider, size = 12 }: { provider: "outlook" | "gmail" | "zoom"; size?: number }) {
  if (provider === "gmail") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    );
  }
  if (provider === "zoom") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 10l5-3v10l-5-3z" />
        <rect width="13" height="10" x="1" y="7" rx="2" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function LabelChips({ labels }: { labels?: EmailLabelChip[] }) {
  if (!labels || labels.length === 0) return null;
  return (
    <span className="inline-flex items-center gap-0.5 flex-shrink-0">
      {labels.slice(0, 2).map((label) => (
        <span
          key={label.id}
          className="text-[9px] leading-tight px-1 py-0.5 rounded-full font-medium whitespace-nowrap"
          style={{
            backgroundColor: label.color + "22",
            color: label.color,
            border: `1px solid ${label.color}44`,
          }}
        >
          {label.name}
        </span>
      ))}
      {labels.length > 2 && (
        <span className="text-[9px] text-[var(--muted-foreground)]">+{labels.length - 2}</span>
      )}
    </span>
  );
}

interface SplitInboxPaneProps {
  section: InboxSection | null;
  sections: InboxSection[];
  onSectionChange: (sectionId: string | null) => void;
  onEmailClick: (emailId: string | number) => void;
  focusedEmailId: string | number | null;
  paneId: "left" | "right";
  onSwapPanes?: () => void;
  otherSectionId: string | null;
}

export function SplitInboxPane({
  section,
  sections,
  onSectionChange,
  onEmailClick,
  focusedEmailId,
  paneId,
  onSwapPanes,
  otherSectionId,
}: SplitInboxPaneProps) {
  const [emails, setEmails] = useState<EmailListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSectionPicker, setShowSectionPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const hasFetched = useRef(false);
  const isDuplicate = section && otherSectionId === section.id;

  const fetchEmails = useCallback(async (silent = false) => {
    if (!section) {
      setEmails([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    if (!silent) setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("limit", "50");

      const criteria = section.filterCriteria as InboxSectionFilterCriteria;
      if (criteria.provider) params.set("provider", criteria.provider);
      if (criteria.accountId) params.set("accountId", criteria.accountId);
      if (criteria.folder && criteria.folder !== "all") params.set("folder", criteria.folder);
      if (criteria.unreadOnly) params.set("unreadOnly", "true");
      if (criteria.senderDomain) params.set("senderDomain", criteria.senderDomain);
      if (criteria.labelId) params.set("labelId", criteria.labelId);
      if (criteria.smartLabelId) params.set("smartLabelId", criteria.smartLabelId);

      const res = await fetch(`/api/emails?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data: EmailListResponse = await res.json();

      // Client-side filtering for criteria the API doesn't support directly
      let items = data.data;
      if (criteria.senderDomain) {
        const domain = criteria.senderDomain.toLowerCase();
        items = items.filter((e) => e.sender.toLowerCase().includes(`@${domain}`));
      }
      if (criteria.unreadOnly) {
        items = items.filter((e) => !e.is_read);
      }

      setEmails(items);
      setTotal(items.length);
    } catch {
      if (!silent) setError("Failed to load emails");
    } finally {
      if (!silent) {
        setLoading(false);
        hasFetched.current = true;
      }
    }
  }, [section]);

  useEffect(() => {
    hasFetched.current = false;
    fetchEmails(false);
  }, [fetchEmails]);

  // Polling — pauses when app is backgrounded on mobile
  useAppAwarePolling(() => fetchEmails(true), PANE_POLL_INTERVAL, !!section);

  // Close picker on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowSectionPicker(false);
      }
    }
    if (showSectionPicker) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [showSectionPicker]);

  const unreadCount = emails.filter((e) => !e.is_read).length;

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 border-r lg:border-r border-b lg:border-b-0 border-[var(--border)] last:border-r-0 last:border-b-0 min-w-0">
      {/* Pane header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border)] bg-[var(--background)] flex-shrink-0">
        {/* Section picker */}
        <div className="relative flex-1 min-w-0" ref={pickerRef}>
          <button
            onClick={() => setShowSectionPicker(!showSectionPicker)}
            className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)] hover:text-[var(--primary)] transition-colors min-w-0"
          >
            {section && (
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: section.color }}
              />
            )}
            <span className="truncate">{section?.name || "Select section..."}</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {showSectionPicker && (
            <div className="absolute top-full left-0 mt-1 w-56 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-50 py-1 max-h-64 overflow-auto">
              <button
                onClick={() => { onSectionChange(null); setShowSectionPicker(false); }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-[var(--accent)] transition-colors ${!section ? "text-[var(--primary)] font-medium" : "text-[var(--foreground)]"}`}
              >
                All Mail
              </button>
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { onSectionChange(s.id); setShowSectionPicker(false); }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-[var(--accent)] transition-colors flex items-center gap-2 ${section?.id === s.id ? "text-[var(--primary)] font-medium" : "text-[var(--foreground)]"}`}
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="truncate">{s.name}</span>
                  {otherSectionId === s.id && (
                    <span className="text-[10px] text-[var(--muted-foreground)] ml-auto flex-shrink-0">other pane</span>
                  )}
                </button>
              ))}
              {sections.length === 0 && (
                <p className="px-3 py-2 text-xs text-[var(--muted-foreground)]">
                  No sections created yet
                </p>
              )}
            </div>
          )}
        </div>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[var(--primary)] text-white flex-shrink-0">
            {unreadCount}
          </span>
        )}

        {/* Swap button */}
        {onSwapPanes && (
          <button
            onClick={onSwapPanes}
            className="p-1 rounded text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors flex-shrink-0"
            title="Swap panes"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
        )}
      </div>

      {/* Duplicate warning */}
      {isDuplicate && (
        <div className="px-3 py-1.5 bg-amber-500/10 border-b border-amber-500/20 text-[10px] text-amber-600">
          Same section in both panes
        </div>
      )}

      {/* Email list */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="divide-y divide-[var(--border)]">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="px-3 py-3 animate-pulse">
                <div className="flex items-center gap-2">
                  <div className="h-3 bg-[var(--secondary)] rounded w-24" />
                  <div className="h-3 bg-[var(--secondary)] rounded flex-1" />
                  <div className="h-3 bg-[var(--secondary)] rounded w-10" />
                </div>
                <div className="h-2.5 bg-[var(--secondary)] rounded w-3/4 mt-1.5" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-4 text-center text-sm text-[var(--destructive)]">{error}</div>
        ) : !section ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--muted-foreground)]/30 mb-3">
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            <p className="text-sm text-[var(--muted-foreground)]">
              Select a section to filter emails
            </p>
          </div>
        ) : emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--muted-foreground)]/30 mb-3">
              <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p className="text-sm font-medium text-[var(--foreground)] mb-1">No matching emails</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              &ldquo;{section.name}&rdquo; has no emails. Try adjusting the section criteria.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {emails.map((email) => (
              <div
                key={email.id}
                data-email-id={email.id}
                onClick={() => onEmailClick(email.id)}
                className={`px-3 py-2.5 cursor-pointer hover:bg-[var(--accent)]/50 transition-colors ${
                  !email.is_read ? "bg-[var(--primary)]/[0.03]" : ""
                } ${
                  focusedEmailId === email.id
                    ? "border-l-[3px] border-[var(--primary)] pl-[9px] bg-[var(--primary)]/10"
                    : "border-l-[3px] border-transparent"
                }`}
              >
                {/* Row: sender + time */}
                <div className="flex items-center gap-1.5">
                  {!email.is_read && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] flex-shrink-0" />
                  )}
                  <span className="flex-shrink-0 text-[var(--muted-foreground)]">
                    <ProviderIcon provider={email.provider} size={10} />
                  </span>
                  <span className={`text-sm truncate flex-1 min-w-0 ${!email.is_read ? "font-semibold text-[var(--foreground)]" : "text-[var(--foreground)]"}`}>
                    {email.sender}
                  </span>
                  <span className="text-[10px] text-[var(--muted-foreground)] flex-shrink-0">
                    {formatRelativeTime(email.received_at)}
                  </span>
                </div>

                {/* Subject */}
                <p className={`text-sm truncate mt-0.5 ${!email.is_read ? "font-medium text-[var(--foreground)]" : "text-[var(--muted-foreground)]"}`}>
                  {email.subject || "(No subject)"}
                </p>

                {/* Preview + labels */}
                <div className="flex items-center gap-1.5 mt-0.5">
                  {email.preview && (
                    <p className="text-xs text-[var(--muted-foreground)] truncate flex-1 min-w-0">
                      {email.preview}
                    </p>
                  )}
                  <LabelChips labels={email.labels} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer with count */}
      {section && !loading && emails.length > 0 && (
        <div className="px-3 py-1.5 text-[10px] text-[var(--muted-foreground)] border-t border-[var(--border)] bg-[var(--background)] flex-shrink-0">
          {total} {total === 1 ? "message" : "messages"}
        </div>
      )}
    </div>
  );
}
