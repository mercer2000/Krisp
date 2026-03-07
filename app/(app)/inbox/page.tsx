"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import type { EmailListItem, EmailListResponse, EmailSearchResponse, EmailSearchItem, EmailLabelChip } from "@/types/email";

const POLL_INTERVAL = 15_000; // 15 seconds

interface EmailAccount {
  id: string;
  email: string;
  provider: "outlook" | "gmail" | "zoom";
}

function OutlookIcon({ size = 12 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function GmailIcon({ size = 12 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function ZoomIcon({ size = 12 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 10l5-3v10l-5-3z" />
      <rect width="13" height="10" x="1" y="7" rx="2" />
    </svg>
  );
}

function ProviderIcon({ provider, size = 12 }: { provider: "outlook" | "gmail" | "zoom"; size?: number }) {
  if (provider === "gmail") return <GmailIcon size={size} />;
  if (provider === "zoom") return <ZoomIcon size={size} />;
  return <OutlookIcon size={size} />;
}

interface LabelDef {
  id: string;
  name: string;
  color: string;
  is_system: boolean;
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function formatAbsoluteTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "ellipsis")[] = [];
  pages.push(1);
  if (current > 3) pages.push("ellipsis");
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i);
  }
  if (current < total - 2) pages.push("ellipsis");
  pages.push(total);
  return pages;
}

/** Compute contrasting text color (black or white) for a hex background. */
function contrastText(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#000000" : "#FFFFFF";
}

function LabelChips({ labels }: { labels?: EmailLabelChip[] }) {
  if (!labels || labels.length === 0) return null;
  return (
    <span className="inline-flex items-center gap-1 flex-shrink-0" data-testid="email-label-chips">
      {labels.slice(0, 3).map((label) => (
        <span
          key={label.id}
          className="text-[10px] leading-tight px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap"
          style={{
            backgroundColor: label.color + "22",
            color: label.color,
            border: `1px solid ${label.color}44`,
          }}
          title={label.confidence != null ? `${label.name} (${label.confidence}% confidence)` : label.name}
        >
          {label.name}
        </span>
      ))}
      {labels.length > 3 && (
        <span className="text-[10px] text-[var(--muted-foreground)]">
          +{labels.length - 3}
        </span>
      )}
    </span>
  );
}

export default function InboxPage() {
  const { toast } = useToast();
  const [emails, setEmails] = useState<EmailListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [afterDate, setAfterDate] = useState("");
  const [beforeDate, setBeforeDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSemanticSearch, setIsSemanticSearch] = useState(false);
  const [similarities, setSimilarities] = useState<Record<string | number, number>>({});
  const [embeddingStatus, setEmbeddingStatus] = useState<{ total: number; embedded: number; pending: number } | null>(null);

  // Account state
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [filterAccount, setFilterAccount] = useState<string | null>(null);
  const [filterProvider, setFilterProvider] = useState<"outlook" | "gmail" | "zoom" | null>(null);

  // Label state
  const [allLabels, setAllLabels] = useState<LabelDef[]>([]);
  const [filterLabel, setFilterLabel] = useState<string | null>(null);
  const [classifying, setClassifying] = useState(false);
  const [showLabelManager, setShowLabelManager] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#6366F1");
  const [creatingLabel, setCreatingLabel] = useState(false);

  // Newsletter state
  const [activeFolder, setActiveFolder] = useState<"inbox" | "newsletter" | "all">("inbox");
  const [detecting, setDetecting] = useState(false);
  const [showWhitelistManager, setShowWhitelistManager] = useState(false);
  const [whitelist, setWhitelist] = useState<{ id: string; sender_email: string; created_at: string }[]>([]);
  const [newWhitelistEmail, setNewWhitelistEmail] = useState("");
  const [addingWhitelist, setAddingWhitelist] = useState(false);

  const hasFetchedOnce = useRef(false);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  // Fetch labels and connected accounts on mount
  useEffect(() => {
    fetch("/api/emails/labels")
      .then((r) => r.json())
      .then((d) => { if (d.data) setAllLabels(d.data); })
      .catch(() => {});
    fetch("/api/emails/accounts")
      .then((r) => r.json())
      .then((d) => { if (d.accounts) setAccounts(d.accounts); })
      .catch(() => {});
  }, []);

  const fetchEmails = useCallback(async (silent = false) => {
    if (!silent) {
      setInitialLoading(true);
      setError(null);
      setSimilarities({});
    }

    try {
      if (query && !afterDate && !beforeDate) {
        const params = new URLSearchParams();
        params.set("q", query);
        params.set("limit", "20");

        const res = await fetch(`/api/emails/search?${params}`);
        if (!res.ok) throw new Error("Failed to search emails");
        const data: EmailSearchResponse = await res.json();
        setEmails(data.data);
        setTotal(data.data.length);
        setIsSemanticSearch(true);
        setEmbeddingStatus(data.embedding_status);

        const sims: Record<string | number, number> = {};
        for (const item of data.data as EmailSearchItem[]) {
          sims[item.id] = item.similarity;
        }
        setSimilarities(sims);
      } else {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(limit));
        if (query) params.set("q", query);
        if (afterDate) params.set("after", new Date(afterDate).toISOString());
        if (beforeDate) params.set("before", new Date(beforeDate).toISOString());
        if (filterAccount) params.set("accountId", filterAccount);
        if (filterProvider) params.set("provider", filterProvider);
        if (activeFolder !== "all") params.set("folder", activeFolder);

        const res = await fetch(`/api/emails?${params}`);
        if (!res.ok) throw new Error("Failed to fetch emails");
        const data: EmailListResponse = await res.json();
        setEmails(data.data);
        setTotal(data.total);
        setIsSemanticSearch(false);
        setEmbeddingStatus(null);
      }
    } catch {
      if (!silent) {
        setError("Failed to load emails. Please try again.");
      }
    } finally {
      if (!silent) {
        setInitialLoading(false);
        hasFetchedOnce.current = true;
      }
    }
  }, [page, limit, query, afterDate, beforeDate, filterAccount, filterProvider, activeFolder]);

  // Initial fetch + fetch on filter/page changes
  useEffect(() => {
    fetchEmails(hasFetchedOnce.current);
  }, [fetchEmails]);

  // Background polling: only on page 1 with no active search/filters
  useEffect(() => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }

    const shouldPoll = page === 1 && !query && !afterDate && !beforeDate;
    if (shouldPoll) {
      pollTimer.current = setInterval(() => {
        fetchEmails(true);
      }, POLL_INTERVAL);
    }

    return () => {
      if (pollTimer.current) {
        clearInterval(pollTimer.current);
        pollTimer.current = null;
      }
    };
  }, [page, query, afterDate, beforeDate, filterAccount, filterProvider, activeFolder, fetchEmails]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    hasFetchedOnce.current = false;
    setPage(1);
    setQuery(searchInput);
  };

  const clearFilters = () => {
    hasFetchedOnce.current = false;
    setAfterDate("");
    setBeforeDate("");
    setSearchInput("");
    setQuery("");
    setPage(1);
    setFilterLabel(null);
    setFilterAccount(null);
    setFilterProvider(null);
    setActiveFolder("inbox");
    setIsSemanticSearch(false);
    setSimilarities({});
    setEmbeddingStatus(null);
  };

  const [deletingId, setDeletingId] = useState<number | string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | string | null>(null);

  const confirmDelete = async () => {
    if (deleteTarget === null) return;
    const emailId = deleteTarget;
    setDeleteTarget(null);

    const previousEmails = emails;
    const previousTotal = total;

    // Optimistic update
    setEmails((prev) => prev.filter((e) => e.id !== emailId));
    setTotal((prev) => prev - 1);
    setDeletingId(emailId);

    try {
      const res = await fetch(`/api/emails/${emailId}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to delete");
      }
      toast({ title: "Email deleted", variant: "success" });
    } catch (err) {
      // Revert on error
      setEmails(previousEmails);
      setTotal(previousTotal);
      toast({
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Failed to delete email",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Classify emails
  const handleClassify = async () => {
    setClassifying(true);
    try {
      const res = await fetch("/api/emails/classify", { method: "POST" });
      if (!res.ok) throw new Error("Failed to classify");
      const data = await res.json();
      toast({
        title: "Classification complete",
        description: `${data.classified} emails classified`,
        variant: "success",
      });
      // Refresh to show new labels
      hasFetchedOnce.current = false;
      fetchEmails(false);
    } catch {
      toast({ title: "Classification failed", variant: "destructive" });
    } finally {
      setClassifying(false);
    }
  };

  // Detect newsletters
  const handleDetectNewsletters = async () => {
    setDetecting(true);
    try {
      const res = await fetch("/api/emails/newsletter/detect", { method: "POST" });
      if (!res.ok) throw new Error("Failed to detect newsletters");
      const data = await res.json();
      toast({
        title: "Newsletter detection complete",
        description: `${data.marked} newsletters detected, ${data.whitelisted} whitelisted senders skipped`,
        variant: "success",
      });
      hasFetchedOnce.current = false;
      fetchEmails(false);
    } catch {
      toast({ title: "Newsletter detection failed", variant: "destructive" });
    } finally {
      setDetecting(false);
    }
  };

  // Fetch whitelist
  const fetchWhitelist = async () => {
    try {
      const res = await fetch("/api/emails/newsletter/whitelist");
      if (res.ok) {
        const data = await res.json();
        if (data.data) setWhitelist(data.data);
      }
    } catch {
      // silent
    }
  };

  // Add to whitelist
  const handleAddWhitelist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWhitelistEmail.trim()) return;
    setAddingWhitelist(true);
    try {
      const res = await fetch("/api/emails/newsletter/whitelist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderEmail: newWhitelistEmail.trim() }),
      });
      if (!res.ok) throw new Error("Failed to add to whitelist");
      const { data: entry } = await res.json();
      setWhitelist((prev) => [...prev, entry]);
      setNewWhitelistEmail("");
      toast({ title: "Sender whitelisted", variant: "success" });
    } catch {
      toast({ title: "Failed to add to whitelist", variant: "destructive" });
    } finally {
      setAddingWhitelist(false);
    }
  };

  // Remove from whitelist
  const handleRemoveWhitelist = async (id: string) => {
    try {
      const res = await fetch(`/api/emails/newsletter/whitelist/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove");
      setWhitelist((prev) => prev.filter((w) => w.id !== id));
      toast({ title: "Sender removed from whitelist", variant: "success" });
    } catch {
      toast({ title: "Failed to remove from whitelist", variant: "destructive" });
    }
  };

  // Create custom label
  const handleCreateLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabelName.trim()) return;
    setCreatingLabel(true);
    try {
      const res = await fetch("/api/emails/labels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newLabelName.trim(), color: newLabelColor }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to create label");
      }
      const { data: label } = await res.json();
      setAllLabels((prev) => [...prev, label]);
      setNewLabelName("");
      toast({ title: "Label created", variant: "success" });
    } catch (err) {
      toast({
        title: "Failed to create label",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setCreatingLabel(false);
    }
  };

  // Delete custom label
  const handleDeleteLabel = async (labelId: string) => {
    try {
      const res = await fetch(`/api/emails/labels/${labelId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete label");
      setAllLabels((prev) => prev.filter((l) => l.id !== labelId));
      if (filterLabel === labelId) setFilterLabel(null);
      toast({ title: "Label deleted", variant: "success" });
    } catch {
      toast({ title: "Failed to delete label", variant: "destructive" });
    }
  };

  const hasActiveFilters = query || afterDate || beforeDate || filterLabel || filterAccount;
  const pageNumbers = getPageNumbers(page, totalPages);

  // Filter emails by selected label (client-side)
  const filteredEmails = filterLabel
    ? emails.filter((e) => e.labels?.some((l) => l.id === filterLabel))
    : emails;

  return (
    <div className="flex h-full flex-col bg-[var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">
              {activeFolder === "newsletter" ? "Newsletters" : "Inbox"}
            </h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              {total} {total === 1 ? "message" : "messages"}
              {filterAccount && accounts.length > 0 && (
                <span className="ml-1">
                  in {accounts.find((a) => a.id === filterAccount)?.email ?? "selected account"}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Classify button */}
            <button
              onClick={handleClassify}
              disabled={classifying}
              className="px-3 py-2 text-sm font-medium rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors disabled:opacity-40"
              title="Auto-classify emails with AI"
              data-testid="classify-button"
            >
              {classifying ? (
                <span className="flex items-center gap-1.5">
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Classifying...
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
                  </svg>
                  Classify
                </span>
              )}
            </button>

            {/* Detect newsletters button */}
            <button
              onClick={handleDetectNewsletters}
              disabled={detecting}
              className="px-3 py-2 text-sm font-medium rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors disabled:opacity-40"
              title="Detect newsletter and marketing emails"
              data-testid="detect-newsletters-button"
            >
              {detecting ? (
                <span className="flex items-center gap-1.5">
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Detecting...
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2zm0 0a2 2 0 01-2-2v-9c0-1.1.9-2 2-2h2" />
                    <path d="M18 14h-8" />
                    <path d="M15 18h-5" />
                    <path d="M10 6h8v4h-8V6z" />
                  </svg>
                  Detect
                </span>
              )}
            </button>

            {/* Manage labels button */}
            <button
              onClick={() => setShowLabelManager(true)}
              className="px-3 py-2 text-sm font-medium rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
              data-testid="manage-labels-button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block mr-1">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
              Labels
            </button>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search emails..."
                className="w-64 px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent"
              />
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:opacity-90 transition-opacity"
              >
                Search
              </button>
            </form>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                showFilters || hasActiveFilters
                  ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/5"
                  : "border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]"
              }`}
            >
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
                className="inline-block mr-1"
              >
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              Filters
            </button>
          </div>
        </div>

        {/* Folder tabs: Inbox / Newsletters / All */}
        <div className="px-6 pb-2 flex items-center gap-1 border-b border-[var(--border)]" data-testid="folder-tabs">
          {([
            { key: "inbox" as const, label: "Inbox" },
            { key: "newsletter" as const, label: "Newsletters" },
            { key: "all" as const, label: "All" },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                if (activeFolder !== tab.key) {
                  hasFetchedOnce.current = false;
                  setActiveFolder(tab.key);
                  setPage(1);
                }
              }}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeFolder === tab.key
                  ? "text-[var(--primary)] border-b-2 border-[var(--primary)]"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
              data-testid={`folder-tab-${tab.key}`}
            >
              {tab.label}
            </button>
          ))}
          {activeFolder === "newsletter" && (
            <button
              onClick={() => { fetchWhitelist(); setShowWhitelistManager(true); }}
              className="ml-auto text-xs px-2.5 py-1 rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
              data-testid="manage-whitelist-button"
            >
              Whitelist
            </button>
          )}
        </div>

        {/* Account filter chips */}
        {accounts.length > 1 && (
          <div className="px-6 pb-2 flex items-center gap-2 flex-wrap" data-testid="account-filter-bar">
            <span className="text-xs text-[var(--muted-foreground)] mr-1">Account:</span>
            <button
              onClick={() => { hasFetchedOnce.current = false; setFilterAccount(null); setFilterProvider(null); setPage(1); }}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                !filterAccount
                  ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                  : "border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
              }`}
            >
              All accounts
            </button>
            {accounts.map((account) => (
              <button
                key={account.id}
                onClick={() => {
                  hasFetchedOnce.current = false;
                  if (filterAccount === account.id) {
                    setFilterAccount(null);
                    setFilterProvider(null);
                  } else {
                    setFilterAccount(account.id);
                    setFilterProvider(account.provider);
                  }
                  setPage(1);
                }}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors flex items-center gap-1.5 ${
                  filterAccount === account.id
                    ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                    : "border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
                }`}
                data-testid={`account-filter-${account.email}`}
              >
                <ProviderIcon provider={account.provider} size={12} />
                {account.email}
              </button>
            ))}
          </div>
        )}

        {/* Label filter chips */}
        {allLabels.length > 0 && (
          <div className="px-6 pb-3 flex items-center gap-2 flex-wrap" data-testid="label-filter-bar">
            <span className="text-xs text-[var(--muted-foreground)] mr-1">Filter:</span>
            <button
              onClick={() => setFilterLabel(null)}
              className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                !filterLabel
                  ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                  : "border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
              }`}
            >
              All
            </button>
            {allLabels.map((label) => (
              <button
                key={label.id}
                onClick={() => setFilterLabel(filterLabel === label.id ? null : label.id)}
                className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                  filterLabel === label.id
                    ? "border-current"
                    : "border-transparent hover:border-current"
                }`}
                style={{
                  backgroundColor: filterLabel === label.id ? label.color + "22" : label.color + "11",
                  color: label.color,
                }}
                data-testid={`label-filter-${label.name}`}
              >
                {label.name}
              </button>
            ))}
          </div>
        )}

        {/* Filter panel */}
        {showFilters && (
          <div className="px-6 pb-4 flex items-end gap-4 flex-wrap">
            {accounts.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                  Account
                </label>
                <select
                  value={filterAccount ?? ""}
                  onChange={(e) => {
                    hasFetchedOnce.current = false;
                    const selectedId = e.target.value || null;
                    const selectedAccount = accounts.find((a) => a.id === selectedId);
                    setFilterAccount(selectedId);
                    setFilterProvider(selectedAccount?.provider ?? null);
                    setPage(1);
                  }}
                  className="px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                >
                  <option value="">All accounts</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.provider === "gmail" ? "[Gmail]" : account.provider === "zoom" ? "[Zoom]" : "[Outlook]"} {account.email}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                After
              </label>
              <input
                type="date"
                value={afterDate}
                onChange={(e) => { hasFetchedOnce.current = false; setAfterDate(e.target.value); setPage(1); }}
                className="px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                Before
              </label>
              <input
                type="date"
                value={beforeDate}
                onChange={(e) => { hasFetchedOnce.current = false; setBeforeDate(e.target.value); setPage(1); }}
                className="px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
        )}
      </header>

      {/* Email list */}
      <main className="flex-1 overflow-auto">
        {error && (
          <div className="mx-6 mt-4 p-4 bg-[var(--destructive)]/10 border border-[var(--destructive)]/20 rounded-lg text-[var(--destructive)] text-sm">
            {error}
          </div>
        )}

        {/* Embedding status banner */}
        {embeddingStatus && embeddingStatus.pending > 0 && embeddingStatus.total > 0 && (
          embeddingStatus.pending / embeddingStatus.total > 0.2
        ) && (
          <div className="mx-6 mt-4 p-3 bg-[var(--primary)]/5 border border-[var(--primary)]/20 rounded-lg text-sm text-[var(--muted-foreground)]">
            Search index is still building — results may be incomplete. ({embeddingStatus.embedded}/{embeddingStatus.total} emails indexed)
          </div>
        )}

        {/* Semantic search indicator */}
        {isSemanticSearch && !initialLoading && emails.length > 0 && (
          <div className="px-6 pt-3 pb-1 flex items-center justify-between">
            <span className="text-xs text-[var(--muted-foreground)]">
              Showing {emails.length} results ranked by relevance
            </span>
            <span className="text-xs text-[var(--muted-foreground)]">
              Semantic search powered by OpenAI
            </span>
          </div>
        )}

        {initialLoading ? (
          <div className="divide-y divide-[var(--border)]">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="px-6 py-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-4 h-4 bg-[var(--secondary)] rounded" />
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div className="h-4 bg-[var(--secondary)] rounded w-40" />
                      <div className="h-4 bg-[var(--secondary)] rounded w-64 flex-1" />
                      <div className="h-3 bg-[var(--secondary)] rounded w-16" />
                    </div>
                    <div className="h-3 bg-[var(--secondary)] rounded w-96 mt-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredEmails.length === 0 ? (
          <div className="text-center py-20">
            <svg
              className="w-16 h-16 mx-auto text-[var(--muted-foreground)]/30 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <h3 className="text-xl font-medium text-[var(--foreground)] mb-2">
              {hasActiveFilters ? "No matching emails" : "No emails yet"}
            </h3>
            <p className="text-[var(--muted-foreground)] max-w-md mx-auto">
              {hasActiveFilters
                ? "Try adjusting your search or filters."
                : "Emails will appear here once they are received via webhook integrations."
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {filteredEmails.map((email) => (
              <div
                key={email.id}
                className="flex items-start gap-4 px-6 py-4 hover:bg-[var(--accent)]/50 transition-colors group"
              >
                {/* Attachment indicator */}
                <div className="w-4 flex-shrink-0 pt-1">
                  {email.has_attachments && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-[var(--muted-foreground)]"
                      aria-label="Has attachments"
                    >
                      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                    </svg>
                  )}
                </div>

                {/* Content - clickable link to detail */}
                <Link
                  href={`/inbox/${email.id}`}
                  className="flex-1 min-w-0"
                >
                  <div className="flex items-baseline gap-3">
                    {/* Sender */}
                    <span className="text-sm font-medium text-[var(--foreground)] truncate max-w-[200px]">
                      {email.sender}
                    </span>

                    {/* Subject */}
                    <span className="text-sm text-[var(--foreground)] truncate flex-1">
                      {email.subject || "(No subject)"}
                    </span>

                    {/* Label chips */}
                    <LabelChips labels={email.labels} />

                    {/* Time */}
                    <span
                      className="text-xs text-[var(--muted-foreground)] flex-shrink-0"
                      title={formatAbsoluteTime(email.received_at)}
                    >
                      {formatRelativeTime(email.received_at)}
                    </span>

                    {/* Similarity badge (semantic search only) */}
                    {similarities[email.id] !== undefined && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex-shrink-0"
                        title={`Relevance: ${Math.round(similarities[email.id] * 100)}%`}
                      >
                        {Math.round(similarities[email.id] * 100)}%
                      </span>
                    )}
                  </div>

                  {/* Preview + account indicator */}
                  <div className="flex items-center gap-2 mt-1">
                    {email.preview && (
                      <p className="text-xs text-[var(--muted-foreground)] truncate flex-1 min-w-0">
                        {email.preview}
                      </p>
                    )}
                    {accounts.length > 1 && email.account_id && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--muted-foreground)] flex-shrink-0 truncate max-w-[200px] inline-flex items-center gap-1"
                        title={accounts.find((a) => a.id === email.account_id)?.email ?? "Unknown account"}
                      >
                        <ProviderIcon provider={email.provider} size={10} />
                        {accounts.find((a) => a.id === email.account_id)?.email ?? "Unknown"}
                      </span>
                    )}
                  </div>
                </Link>

                {/* Actions */}
                <div className="flex-shrink-0 flex items-center gap-1">
                  {email.web_link && (
                    <a
                      href={email.web_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
                      title={`Open in ${email.provider === "gmail" ? "Gmail" : email.provider === "zoom" ? "Zoom" : "Outlook"}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 3h6v6" />
                        <path d="M10 14 21 3" />
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      </svg>
                    </a>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); setDeleteTarget(email.id); }}
                    disabled={deletingId === email.id}
                    className="p-1.5 rounded-md text-[var(--muted-foreground)] hover:text-[var(--destructive)] hover:bg-[var(--destructive)]/10 transition-colors disabled:opacity-40"
                    title="Delete email"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Pagination (hidden during semantic search) */}
      {totalPages > 1 && !initialLoading && !isSemanticSearch && (
        <footer className="border-t border-[var(--border)] px-6 py-3 flex items-center justify-between bg-[var(--background)]">
          <span className="text-sm text-[var(--muted-foreground)]">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 text-sm font-medium rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            {pageNumbers.map((p, i) =>
              p === "ellipsis" ? (
                <span key={`ellipsis-${i}`} className="px-2 py-1.5 text-sm text-[var(--muted-foreground)]">
                  ...
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`min-w-[36px] px-2 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    p === page
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                      : "border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)]"
                  }`}
                >
                  {p}
                </button>
              )
            )}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 text-sm font-medium rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </footer>
      )}

      {/* Delete confirmation modal */}
      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete email"
      >
        <p className="text-sm text-[var(--muted-foreground)] mb-6">
          This email will be permanently removed from your inbox and your mailbox. This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setDeleteTarget(null)}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={confirmDelete}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-[var(--destructive)] text-white hover:opacity-90 transition-opacity"
          >
            Delete
          </button>
        </div>
      </Modal>

      {/* Label Manager Modal */}
      <Modal
        open={showLabelManager}
        onClose={() => setShowLabelManager(false)}
        title="Manage Labels"
      >
        <div className="space-y-4" data-testid="label-manager-modal">
          {/* Existing labels */}
          <div className="space-y-2">
            {allLabels.map((label) => (
              <div key={label.id} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: label.color }}
                  />
                  <span className="text-sm text-[var(--foreground)]">{label.name}</span>
                  {label.is_system && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--muted-foreground)]">
                      System
                    </span>
                  )}
                </div>
                {!label.is_system && (
                  <button
                    onClick={() => handleDeleteLabel(label.id)}
                    className="text-xs text-[var(--muted-foreground)] hover:text-[var(--destructive)] transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Create new label */}
          <form onSubmit={handleCreateLabel} className="border-t border-[var(--border)] pt-4">
            <p className="text-xs font-medium text-[var(--muted-foreground)] mb-2">
              Create custom label
            </p>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={newLabelColor}
                onChange={(e) => setNewLabelColor(e.target.value)}
                className="w-8 h-8 rounded border border-[var(--border)] cursor-pointer"
              />
              <input
                type="text"
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                placeholder="Label name..."
                maxLength={100}
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                data-testid="new-label-name-input"
              />
              <button
                type="submit"
                disabled={creatingLabel || !newLabelName.trim()}
                className="px-4 py-2 text-sm font-medium bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40"
                data-testid="create-label-button"
              >
                {creatingLabel ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Newsletter Whitelist Manager Modal */}
      <Modal
        open={showWhitelistManager}
        onClose={() => setShowWhitelistManager(false)}
        title="Newsletter Whitelist"
      >
        <div className="space-y-4" data-testid="whitelist-manager-modal">
          <p className="text-xs text-[var(--muted-foreground)]">
            Whitelisted senders will never be moved to the Newsletter folder, even if detected as newsletters.
          </p>

          {/* Existing whitelist entries */}
          {whitelist.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-auto">
              {whitelist.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-[var(--foreground)] truncate">
                    {entry.sender_email}
                  </span>
                  <button
                    onClick={() => handleRemoveWhitelist(entry.id)}
                    className="text-xs text-[var(--muted-foreground)] hover:text-[var(--destructive)] transition-colors flex-shrink-0 ml-2"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--muted-foreground)] py-2">
              No whitelisted senders yet.
            </p>
          )}

          {/* Add to whitelist */}
          <form onSubmit={handleAddWhitelist} className="border-t border-[var(--border)] pt-4">
            <p className="text-xs font-medium text-[var(--muted-foreground)] mb-2">
              Add sender to whitelist
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newWhitelistEmail}
                onChange={(e) => setNewWhitelistEmail(e.target.value)}
                placeholder="sender@example.com"
                maxLength={512}
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                data-testid="whitelist-email-input"
              />
              <button
                type="submit"
                disabled={addingWhitelist || !newWhitelistEmail.trim()}
                className="px-4 py-2 text-sm font-medium bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40"
                data-testid="add-whitelist-button"
              >
                {addingWhitelist ? "Adding..." : "Add"}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
