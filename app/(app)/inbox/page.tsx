"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useInboxCache } from "@/lib/hooks/useInboxCache";
import type { EmailListItem, EmailListResponse, EmailSearchResponse, EmailSearchItem, EmailLabelChip } from "@/types/email";
import type { SmartLabelChip, EmailDraft } from "@/types/smartLabel";

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

function SmartLabelChips({ labels }: { labels?: SmartLabelChip[] }) {
  if (!labels || labels.length === 0) return null;
  return (
    <span className="inline-flex items-center gap-1 flex-shrink-0">
      {labels.slice(0, 3).map((label) => (
        <span
          key={label.id}
          className="text-[10px] leading-tight px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap"
          style={{
            backgroundColor: label.color + "22",
            color: label.color,
            border: `1px solid ${label.color}44`,
          }}
          title={label.confidence != null ? `${label.name} (${label.confidence}% confidence, ${label.assigned_by})` : label.name}
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
  const cache = useInboxCache();
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

  // Smart label state
  const [smartLabelMap, setSmartLabelMap] = useState<Record<string, SmartLabelChip[]>>({});
  const [filterSmartLabel, setFilterSmartLabel] = useState<string | null>(null);
  const [allSmartLabels, setAllSmartLabels] = useState<{ id: string; name: string; color: string }[]>([]);

  // Classification tracking state — IDs of emails processed by the classifier
  const [classifiedIds, setClassifiedIds] = useState<Set<number | string>>(new Set());

  // Draft state
  const [draftMap, setDraftMap] = useState<Record<string, EmailDraft>>({});
  const [expandedDraft, setExpandedDraft] = useState<string | null>(null);

  // Smart label creation from email
  const [showCreateSmartLabel, setShowCreateSmartLabel] = useState(false);
  const [smartLabelEmailContext, setSmartLabelEmailContext] = useState<{ sender: string; subject: string; preview: string; provider: string; emailId: string | number } | null>(null);
  const [smartLabelName, setSmartLabelName] = useState("");
  const [smartLabelPrompt, setSmartLabelPrompt] = useState("");
  const [smartLabelColor, setSmartLabelColor] = useState("#6366F1");
  const [creatingSmart, setCreatingSmart] = useState(false);
  const [suggestingPrompt, setSuggestingPrompt] = useState(false);

  // Forward state
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardEmailId, setForwardEmailId] = useState<string | number | null>(null);
  const [forwardEmailContext, setForwardEmailContext] = useState<{ sender: string; subject: string | null } | null>(null);
  const [forwardRecipient, setForwardRecipient] = useState("");
  const [forwardMessage, setForwardMessage] = useState("");
  const [forwardGenerating, setForwardGenerating] = useState(false);
  const [forwardSending, setForwardSending] = useState(false);
  const [forwardIntent, setForwardIntent] = useState<string | null>(null);
  const forwardUserEdited = useRef(false);

  // Auto-generate forwarding draft when forward modal opens
  useEffect(() => {
    if (!showForwardModal || !forwardEmailId) return;
    let cancelled = false;

    async function generateDraft() {
      setForwardGenerating(true);
      try {
        const res = await fetch(`/api/emails/${forwardEmailId}/forward`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ generateDraft: true }),
        });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (cancelled) return;
        if (!forwardUserEdited.current && data.draft) {
          setForwardMessage(data.draft);
        }
        if (data.intent) {
          setForwardIntent(data.intent);
        }
      } catch {
        // Fail silently — leave compose body blank
      } finally {
        if (!cancelled) setForwardGenerating(false);
      }
    }

    generateDraft();
    return () => { cancelled = true; };
  }, [showForwardModal, forwardEmailId]);

  // VIP contacts state
  const [vipMap, setVipMap] = useState<Record<string, boolean>>({});
  const [showVipManager, setShowVipManager] = useState(false);
  const [vipContactList, setVipContactList] = useState<{ id: string; email: string; display_name: string | null; notify_on_new: boolean; created_at: string }[]>([]);
  const [newVipEmail, setNewVipEmail] = useState("");
  const [newVipName, setNewVipName] = useState("");
  const [addingVip, setAddingVip] = useState(false);

  // Newsletter & Spam state
  const [activeFolder, setActiveFolder] = useState<"inbox" | "newsletter" | "spam" | "vip" | "all">("inbox");
  const [detecting, setDetecting] = useState(false);
  const [detectingSpam, setDetectingSpam] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showWhitelistManager, setShowWhitelistManager] = useState(false);
  const [whitelist, setWhitelist] = useState<{ id: string; sender_email: string; created_at: string }[]>([]);
  const [newWhitelistEmail, setNewWhitelistEmail] = useState("");
  const [addingWhitelist, setAddingWhitelist] = useState(false);

  const hasFetchedOnce = useRef(false);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  // Fetch labels, smart labels, and connected accounts on mount
  // Load cached data instantly, then revalidate in the background
  useEffect(() => {
    // Restore cached labels
    const cachedLabels = cache.getCachedLabels();
    if (cachedLabels?.data) setAllLabels(cachedLabels.data as LabelDef[]);
    // Restore cached accounts
    const cachedAccounts = cache.getCachedAccounts();
    if (cachedAccounts?.accounts) setAccounts(cachedAccounts.accounts as EmailAccount[]);
    // Restore cached smart labels
    const cachedSmart = cache.getCachedSmartLabels();
    if (cachedSmart?.data) setAllSmartLabels(cachedSmart.data as { id: string; name: string; color: string }[]);

    // Revalidate in background
    fetch("/api/emails/labels")
      .then((r) => r.json())
      .then((d) => { if (d.data) { setAllLabels(d.data); cache.cacheLabels(d.data); } })
      .catch(() => {});
    fetch("/api/emails/accounts")
      .then((r) => r.json())
      .then((d) => { if (d.accounts) { setAccounts(d.accounts); cache.cacheAccounts(d.accounts); } })
      .catch(() => {});
    fetch("/api/smart-labels")
      .then((r) => r.json())
      .then((d) => { if (d.data) { const mapped = d.data.map((l: { id: string; name: string; color: string }) => ({ id: l.id, name: l.name, color: l.color })); setAllSmartLabels(mapped); cache.cacheSmartLabels(mapped); } })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchEmails = useCallback(async (silent = false) => {
    const fetchParams = { page, limit, query, afterDate, beforeDate, filterAccount, filterProvider, activeFolder };

    if (!silent) {
      setError(null);
      setSimilarities({});

      // Stale-while-revalidate: show cached data immediately to avoid loading flash
      if (query && !afterDate && !beforeDate) {
        const cached = cache.getCachedSearch(fetchParams);
        if (cached) {
          setEmails(cached.response.data);
          setTotal(cached.response.data.length);
          setIsSemanticSearch(true);
          setEmbeddingStatus(cached.response.embedding_status);
          const sims: Record<string | number, number> = {};
          for (const item of cached.response.data as EmailSearchItem[]) {
            sims[item.id] = item.similarity;
          }
          setSimilarities(sims);
          // Skip loading state — we have cached data, will revalidate below
        } else {
          setInitialLoading(true);
        }
      } else {
        const cached = cache.getCachedEmails(fetchParams);
        if (cached) {
          setEmails(cached.response.data);
          setTotal(cached.response.total);
          setIsSemanticSearch(false);
          setEmbeddingStatus(null);
        } else {
          setInitialLoading(true);
        }
      }
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
        cache.cacheSearchResponse(fetchParams, data);
      } else {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(limit));
        if (query) params.set("q", query);
        if (afterDate) params.set("after", new Date(afterDate).toISOString());
        if (beforeDate) params.set("before", new Date(beforeDate).toISOString());
        if (filterAccount) params.set("accountId", filterAccount);
        if (filterProvider) params.set("provider", filterProvider);
        if (activeFolder !== "all" && activeFolder !== "vip") params.set("folder", activeFolder);

        const res = await fetch(`/api/emails?${params}`);
        if (!res.ok) throw new Error("Failed to fetch emails");
        const data: EmailListResponse = await res.json();
        setEmails(data.data);
        setTotal(data.total);
        setIsSemanticSearch(false);
        setEmbeddingStatus(null);
        cache.cacheListResponse(fetchParams, data);
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
  }, [page, limit, query, afterDate, beforeDate, filterAccount, filterProvider, activeFolder, cache]);

  // Initial fetch + fetch on filter/page changes
  useEffect(() => {
    fetchEmails(hasFetchedOnce.current);
  }, [fetchEmails]);

  // Fetch smart labels for displayed emails (split by provider)
  useEffect(() => {
    if (emails.length === 0) return;
    const outlookIds = emails.filter((e) => e.provider !== "gmail").map((e) => String(e.id));
    const gmailIds = emails.filter((e) => e.provider === "gmail").map((e) => String(e.id));

    const fetches: Promise<Record<string, SmartLabelChip[]>>[] = [];
    if (outlookIds.length > 0) {
      fetches.push(
        fetch("/api/smart-labels/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemType: "email", itemIds: outlookIds }),
        }).then((r) => r.json()).then((d) => d.data || {}).catch(() => ({}))
      );
    }
    if (gmailIds.length > 0) {
      fetches.push(
        fetch("/api/smart-labels/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemType: "gmail_email", itemIds: gmailIds }),
        }).then((r) => r.json()).then((d) => d.data || {}).catch(() => ({}))
      );
    }
    if (fetches.length > 0) {
      Promise.all(fetches).then((results) => {
        const merged: Record<string, SmartLabelChip[]> = {};
        for (const r of results) {
          for (const [k, v] of Object.entries(r)) {
            merged[k] = v;
          }
        }
        setSmartLabelMap(merged);
      });
    }

    // Also fetch which emails have been classified by AI
    const classifiedFetches: Promise<string[]>[] = [];
    if (outlookIds.length > 0) {
      classifiedFetches.push(
        fetch("/api/smart-labels/classified", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemType: "email", itemIds: outlookIds }),
        }).then((r) => r.json()).then((d) => d.data || []).catch(() => [])
      );
    }
    if (gmailIds.length > 0) {
      classifiedFetches.push(
        fetch("/api/smart-labels/classified", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemType: "gmail_email", itemIds: gmailIds }),
        }).then((r) => r.json()).then((d) => d.data || []).catch(() => [])
      );
    }
    if (classifiedFetches.length > 0) {
      Promise.all(classifiedFetches).then((results) => {
        const ids = new Set<number | string>();
        for (const arr of results) {
          for (const id of arr) ids.add(id);
        }
        setClassifiedIds(ids);
      });
    }

    // Fetch pending drafts for displayed emails
    const draftFetches: Promise<Record<string, EmailDraft>>[] = [];
    if (outlookIds.length > 0) {
      draftFetches.push(
        fetch("/api/smart-labels/drafts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emailType: "email", emailIds: outlookIds }),
        }).then((r) => r.json()).then((d) => d.data || {}).catch(() => ({}))
      );
    }
    if (gmailIds.length > 0) {
      draftFetches.push(
        fetch("/api/smart-labels/drafts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emailType: "gmail_email", emailIds: gmailIds }),
        }).then((r) => r.json()).then((d) => d.data || {}).catch(() => ({}))
      );
    }
    if (draftFetches.length > 0) {
      Promise.all(draftFetches).then((results) => {
        const merged: Record<string, EmailDraft> = {};
        for (const r of results) {
          for (const [k, v] of Object.entries(r)) {
            merged[k] = v;
          }
        }
        setDraftMap(merged);
      });
    }

    // Batch-check VIP status for displayed senders
    const senders = [...new Set(emails.map((e) => e.sender))];
    if (senders.length > 0) {
      fetch("/api/vip-contacts/batch-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senders }),
      })
        .then((r) => r.json())
        .then((d) => { if (d.vipMap) setVipMap(d.vipMap); })
        .catch(() => {});
    }
  }, [emails]);

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
    setFilterSmartLabel(null);
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
      cache.invalidateAll();
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

  // Sync emails from all providers
  const handleSync = async () => {
    setSyncing(true);
    try {
      const results = await Promise.allSettled([
        fetch("/api/outlook/sync", { method: "POST" }),
        fetch("/api/gmail/sync", { method: "POST" }),
      ]);

      let totalInserted = 0;
      for (const result of results) {
        if (result.status === "fulfilled" && result.value.ok) {
          const data = await result.value.json();
          totalInserted += data.inserted ?? 0;
        }
      }

      if (totalInserted > 0) {
        cache.invalidateAll();
        toast({ title: "Sync complete", description: `${totalInserted} new messages synced` });
        fetchEmails(false);
      } else {
        toast({ title: "Sync complete", description: "No new messages" });
      }
    } catch (err) {
      toast({ title: "Sync failed", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  // Classify all emails on the current page
  const handleClassify = async () => {
    setClassifying(true);
    try {
      // Send all visible email IDs so every message on the page gets classified
      const currentPageIds = emails.map((e) => typeof e.id === "string" ? parseInt(e.id, 10) : e.id);
      const res = await fetch("/api/emails/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailIds: currentPageIds }),
      });
      if (!res.ok) throw new Error("Failed to classify");
      const data = await res.json();

      // Track which emails were processed
      if (data.processedIds) {
        setClassifiedIds((prev) => {
          const next = new Set(prev);
          for (const id of data.processedIds) next.add(id);
          return next;
        });
      }

      cache.invalidateAll();
      toast({
        title: "Classification complete",
        description: `${data.total} emails checked, ${data.classified} labeled`,
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
      cache.invalidateAll();
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

  // Detect spam
  const handleDetectSpam = async () => {
    setDetectingSpam(true);
    try {
      const res = await fetch("/api/emails/spam/detect", { method: "POST" });
      if (!res.ok) throw new Error("Failed to detect spam");
      const data = await res.json();
      cache.invalidateAll();
      toast({
        title: "Spam detection complete",
        description: `${data.marked} spam emails detected out of ${data.total} scanned`,
        variant: "success",
      });
      hasFetchedOnce.current = false;
      fetchEmails(false);
    } catch {
      toast({ title: "Spam detection failed", variant: "destructive" });
    } finally {
      setDetectingSpam(false);
    }
  };

  // Handle unsubscribe click
  const handleUnsubscribe = (e: React.MouseEvent, link: string) => {
    e.stopPropagation();
    e.preventDefault();
    window.open(link, "_blank", "noopener,noreferrer");
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

  // Fetch VIP contacts
  const fetchVipContacts = async () => {
    try {
      const res = await fetch("/api/vip-contacts");
      if (res.ok) {
        const data = await res.json();
        if (data.data) setVipContactList(data.data);
      }
    } catch {
      // silent
    }
  };

  // Add VIP contact
  const handleAddVip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVipEmail.trim()) return;
    setAddingVip(true);
    try {
      const res = await fetch("/api/vip-contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newVipEmail.trim(),
          displayName: newVipName.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to add VIP contact");
      }
      const { data: entry } = await res.json();
      setVipContactList((prev) => [entry, ...prev]);
      setNewVipEmail("");
      setNewVipName("");
      // Refresh VIP map for inbox
      setVipMap((prev) => ({ ...prev, [entry.email]: true }));
      toast({ title: "VIP contact added", variant: "success" });
    } catch (err) {
      toast({
        title: "Failed to add VIP contact",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setAddingVip(false);
    }
  };

  // Remove VIP contact
  const handleRemoveVip = async (id: string, email: string) => {
    try {
      const res = await fetch(`/api/vip-contacts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove");
      setVipContactList((prev) => prev.filter((v) => v.id !== id));
      setVipMap((prev) => {
        const next = { ...prev };
        delete next[email];
        return next;
      });
      toast({ title: "VIP contact removed", variant: "success" });
    } catch {
      toast({ title: "Failed to remove VIP contact", variant: "destructive" });
    }
  };

  // Quick-add sender as VIP from email row
  const handleQuickAddVip = async (sender: string) => {
    try {
      const res = await fetch("/api/vip-contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: sender }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to add VIP contact");
      }
      setVipMap((prev) => ({ ...prev, [sender]: true }));
      toast({ title: `${sender} marked as VIP`, variant: "success" });
    } catch (err) {
      toast({
        title: "Failed to add VIP",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
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

  // Open the smart label creation modal with email context
  const openSmartLabelCreator = (email: EmailListItem) => {
    setSmartLabelEmailContext({
      sender: email.sender,
      subject: email.subject || "",
      preview: email.preview || "",
      provider: email.provider,
      emailId: email.id,
    });
    setSmartLabelName("");
    setSmartLabelPrompt("");
    setSmartLabelColor("#6366F1");
    setShowCreateSmartLabel(true);
  };

  // Suggest a prompt using AI
  const handleSuggestPrompt = async () => {
    if (!smartLabelEmailContext) return;
    setSuggestingPrompt(true);
    try {
      const res = await fetch("/api/smart-labels/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: smartLabelEmailContext.sender,
          subject: smartLabelEmailContext.subject,
          preview: smartLabelEmailContext.preview,
          labelName: smartLabelName || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to get suggestion");
      const { data } = await res.json();
      if (data.prompt) setSmartLabelPrompt(data.prompt);
      if (data.name && !smartLabelName) setSmartLabelName(data.name);
    } catch {
      toast({ title: "Failed to generate suggestion", variant: "destructive" });
    } finally {
      setSuggestingPrompt(false);
    }
  };

  // Create the smart label
  const handleCreateSmartLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smartLabelName.trim() || !smartLabelPrompt.trim()) return;
    setCreatingSmart(true);
    try {
      const res = await fetch("/api/smart-labels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: smartLabelName.trim(),
          prompt: smartLabelPrompt.trim(),
          color: smartLabelColor,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to create smart label");
      }
      const { data: label } = await res.json();
      setAllSmartLabels((prev) => [...prev, { id: label.id, name: label.name, color: label.color }]);
      setShowCreateSmartLabel(false);
      toast({ title: "Smart label created", description: `"${label.name}" is ready. Classify emails to apply it.`, variant: "success" });
    } catch (err) {
      toast({
        title: "Failed to create smart label",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setCreatingSmart(false);
    }
  };

  const hasActiveFilters = query || afterDate || beforeDate || filterLabel || filterAccount || filterSmartLabel;
  const pageNumbers = getPageNumbers(page, totalPages);

  // Filter emails by selected label, smart label, or VIP (client-side)
  let filteredEmails = emails;
  if (activeFolder === "vip") {
    filteredEmails = filteredEmails.filter((e) => vipMap[e.sender]);
  }
  if (filterLabel) {
    filteredEmails = filteredEmails.filter((e) => e.labels?.some((l) => l.id === filterLabel));
  }
  if (filterSmartLabel) {
    filteredEmails = filteredEmails.filter((e) =>
      smartLabelMap[String(e.id)]?.some((l) => l.id === filterSmartLabel)
    );
  }

  return (
    <div className="flex h-full flex-col bg-[var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">
              {activeFolder === "newsletter" ? "Newsletters" : activeFolder === "spam" ? "Spam" : activeFolder === "vip" ? "VIP Inbox" : "Inbox"}
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
            {/* Sync button */}
            <button
              onClick={handleSync}
              disabled={syncing}
              className="px-3 py-2 text-sm font-medium rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors disabled:opacity-40"
              title="Sync emails from all connected accounts"
            >
              {syncing ? (
                <span className="flex items-center gap-1.5">
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Syncing...
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 2v6h-6" />
                    <path d="M3 12a9 9 0 0115-6.7L21 8" />
                    <path d="M3 22v-6h6" />
                    <path d="M21 12a9 9 0 01-15 6.7L3 16" />
                  </svg>
                  Sync
                </span>
              )}
            </button>

            {/* Classify button */}
            <button
              onClick={handleClassify}
              disabled={classifying}
              className="px-3 py-2 text-sm font-medium rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors disabled:opacity-40"
              title="Classify all emails on this page with AI"
              data-testid="classify-button"
            >
              {classifying ? (
                <span className="flex items-center gap-1.5">
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Classifying ({emails.length})...
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
                  </svg>
                  Classify All
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

            {/* Detect spam button */}
            <button
              onClick={handleDetectSpam}
              disabled={detectingSpam}
              className="px-3 py-2 text-sm font-medium rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors disabled:opacity-40"
              title="Detect spam and unwanted emails"
              data-testid="detect-spam-button"
            >
              {detectingSpam ? (
                <span className="flex items-center gap-1.5">
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Scanning...
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                  </svg>
                  Spam
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

        {/* Folder tabs: Inbox / VIP / Newsletters / All */}
        <div className="px-6 pb-2 flex items-center gap-1 border-b border-[var(--border)]" data-testid="folder-tabs">
          {([
            { key: "inbox" as const, label: "Inbox" },
            { key: "vip" as const, label: "VIP" },
            { key: "newsletter" as const, label: "Newsletters" },
            { key: "spam" as const, label: "Spam" },
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
          {activeFolder === "vip" && (
            <button
              onClick={() => { fetchVipContacts(); setShowVipManager(true); }}
              className="ml-auto text-xs px-2.5 py-1 rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
              data-testid="manage-vip-button"
            >
              Manage VIPs
            </button>
          )}
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
        {(allLabels.length > 0 || allSmartLabels.length > 0) && (
          <div className="px-6 pb-3 flex items-center gap-2 flex-wrap" data-testid="label-filter-bar">
            {allLabels.length > 0 && (
              <>
                <span className="text-xs text-[var(--muted-foreground)] mr-1">Labels:</span>
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
              </>
            )}

            {/* Smart label filters */}
            {allSmartLabels.length > 0 && (
              <>
                {allLabels.length > 0 && <span className="text-[10px] text-[var(--muted-foreground)] px-1">|</span>}
                <span className="text-xs text-[var(--muted-foreground)] mr-1">Smart:</span>
                {allSmartLabels.map((sl) => (
                  <button
                    key={sl.id}
                    onClick={() => setFilterSmartLabel(filterSmartLabel === sl.id ? null : sl.id)}
                    className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                      filterSmartLabel === sl.id
                        ? "border-current"
                        : "border-transparent hover:border-current"
                    }`}
                    style={{
                      backgroundColor: filterSmartLabel === sl.id ? sl.color + "22" : sl.color + "11",
                      color: sl.color,
                    }}
                    data-testid={`smart-label-filter-${sl.name}`}
                  >
                    {sl.name}
                  </button>
                ))}
              </>
            )}
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
            {filteredEmails.map((email) => {
              const emailDraft = draftMap[String(email.id)];
              const isDraftExpanded = expandedDraft === String(email.id);
              return (
              <div key={email.id}>
              <div
                className="flex items-start gap-4 px-6 py-4 hover:bg-[var(--accent)]/50 transition-colors group"
              >
                {/* Status indicators */}
                <div className="w-4 flex-shrink-0 pt-1 flex flex-col items-center gap-1">
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
                  {email.is_spam && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-red-500"
                      aria-label="Spam"
                    >
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                    </svg>
                  )}
                  {(classifiedIds.has(String(email.id)) || classifiedIds.has(email.id)) && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-emerald-500"
                      aria-label="Classified by AI"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                  {emailDraft && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-blue-500"
                      aria-label="Draft reply ready"
                    >
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                      <path d="m15 5 4 4" />
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
                    <span className="text-sm font-medium text-[var(--foreground)] truncate max-w-[200px] inline-flex items-center gap-1">
                      {email.sender}
                      {vipMap[email.sender] && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0"
                          style={{ backgroundColor: "#F59E0B22", color: "#D97706", border: "1px solid #F59E0B44" }}
                          title="VIP Contact"
                          data-testid="vip-badge"
                        >
                          VIP
                        </span>
                      )}
                    </span>

                    {/* Subject */}
                    <span className="text-sm text-[var(--foreground)] truncate flex-1">
                      {email.subject || "(No subject)"}
                    </span>

                    {/* Label chips */}
                    <LabelChips labels={email.labels} />
                    <SmartLabelChips labels={smartLabelMap[String(email.id)]} />

                    {/* Draft indicator badge */}
                    {emailDraft && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 font-medium"
                        style={{ backgroundColor: "#3B82F622", color: "#3B82F6" }}
                      >
                        Draft Ready
                      </span>
                    )}

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

                {/* Unsubscribe button — always visible for emails with unsubscribe link */}
                {email.unsubscribe_link && (
                  <button
                    onClick={(e) => handleUnsubscribe(e, email.unsubscribe_link!)}
                    className="flex-shrink-0 px-2.5 py-1 text-xs font-medium rounded-md bg-red-500/10 text-red-600 hover:bg-red-500/20 border border-red-500/20 transition-colors"
                    title="Unsubscribe from this sender"
                    data-testid="unsubscribe-button"
                  >
                    Unsubscribe
                  </button>
                )}

                {/* Actions */}
                <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* VIP toggle */}
                  {!vipMap[email.sender] && (
                    <button
                      onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleQuickAddVip(email.sender); }}
                      className="p-1.5 rounded-md text-[var(--muted-foreground)] hover:text-amber-600 hover:bg-amber-500/10 transition-colors"
                      title="Mark as VIP"
                      data-testid="mark-vip-button"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); openSmartLabelCreator(email); }}
                    className="p-1.5 rounded-md text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors"
                    title="Create smart label from this email"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
                      <line x1="7" y1="7" x2="7.01" y2="7" />
                      <line x1="17" y1="2" x2="17" y2="7" />
                      <line x1="14.5" y1="4.5" x2="19.5" y2="4.5" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setForwardEmailId(email.id);
                      setForwardEmailContext({ sender: email.sender, subject: email.subject });
                      setForwardRecipient("");
                      setForwardMessage("");
                      setForwardIntent(null);
                      forwardUserEdited.current = false;
                      setShowForwardModal(true);
                    }}
                    className="p-1.5 rounded-md text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors"
                    title="Forward email"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 17 20 12 15 7" />
                      <path d="M4 18v-2a4 4 0 0 1 4-4h12" />
                    </svg>
                  </button>
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

              {/* Draft preview strip */}
              {emailDraft && (
                <div
                  className="mx-6 mb-2 rounded-md border-l-2 border-dashed"
                  style={{
                    borderColor: "#3B82F6",
                    backgroundColor: "var(--background)",
                  }}
                >
                  <button
                    onClick={() => setExpandedDraft(isDraftExpanded ? null : String(email.id))}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[var(--accent)]/30 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                      <path d="m15 5 4 4" />
                    </svg>
                    <span className="text-xs italic truncate flex-1" style={{ color: "var(--muted-foreground)" }}>
                      {emailDraft.draft_body.slice(0, 120)}...
                    </span>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded font-medium flex-shrink-0"
                      style={{ backgroundColor: "#3B82F622", color: "#3B82F6" }}
                    >
                      Review Draft
                    </span>
                  </button>
                  {isDraftExpanded && (
                    <div className="px-3 pb-3 space-y-2">
                      <textarea
                        defaultValue={emailDraft.draft_body}
                        rows={6}
                        className="w-full px-3 py-2 rounded-md border text-sm resize-y"
                        style={{
                          backgroundColor: "var(--input-bg)",
                          borderColor: "var(--border)",
                          color: "var(--foreground)",
                        }}
                        id={`draft-editor-${emailDraft.id}`}
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            const textarea = document.getElementById(`draft-editor-${emailDraft.id}`) as HTMLTextAreaElement;
                            const body = textarea?.value || emailDraft.draft_body;
                            try {
                              const res = await fetch(`/api/smart-labels/drafts/${emailDraft.id}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ action: "send", draftBody: body }),
                              });
                              if (res.ok) {
                                toast({ title: "Draft sent", variant: "success" });
                                setDraftMap((prev) => {
                                  const next = { ...prev };
                                  delete next[String(email.id)];
                                  return next;
                                });
                                setExpandedDraft(null);
                              } else {
                                toast({ title: "Failed to send", variant: "destructive" });
                              }
                            } catch {
                              toast({ title: "Failed to send", variant: "destructive" });
                            }
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium"
                          style={{ backgroundColor: "#3B82F6", color: "#fff" }}
                        >
                          Send
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              const res = await fetch(`/api/smart-labels/drafts/${emailDraft.id}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ action: "regenerate" }),
                              });
                              const data = await res.json();
                              if (res.ok && data.data) {
                                setDraftMap((prev) => ({
                                  ...prev,
                                  [String(email.id)]: data.data,
                                }));
                                toast({ title: "Draft regenerated", variant: "success" });
                              } else {
                                toast({ title: "Failed to regenerate", variant: "destructive" });
                              }
                            } catch {
                              toast({ title: "Failed to regenerate", variant: "destructive" });
                            }
                          }}
                          className="px-3 py-1.5 rounded-md text-xs font-medium border transition-colors"
                          style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                        >
                          Regenerate
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              const res = await fetch(`/api/smart-labels/drafts/${emailDraft.id}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ action: "discard" }),
                              });
                              if (res.ok) {
                                setDraftMap((prev) => {
                                  const next = { ...prev };
                                  delete next[String(email.id)];
                                  return next;
                                });
                                setExpandedDraft(null);
                                toast({ title: "Draft discarded", variant: "success" });
                              }
                            } catch {
                              toast({ title: "Failed to discard", variant: "destructive" });
                            }
                          }}
                          className="px-3 py-1.5 rounded-md text-xs font-medium text-red-500 hover:bg-red-500/10 transition-colors"
                        >
                          Discard
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              </div>
              );
            })}
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

      {/* VIP Contacts Manager Modal */}
      <Modal
        open={showVipManager}
        onClose={() => setShowVipManager(false)}
        title="VIP Contacts"
      >
        <div className="space-y-4" data-testid="vip-manager-modal">
          <p className="text-xs text-[var(--muted-foreground)]">
            Emails from VIP contacts will be highlighted with a gold badge and surfaced in the VIP tab.
          </p>

          {/* Existing VIP contacts */}
          {vipContactList.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-auto">
              {vipContactList.map((contact) => (
                <div key={contact.id} className="flex items-center justify-between py-1.5">
                  <div className="min-w-0">
                    <span className="text-sm text-[var(--foreground)] truncate block">
                      {contact.email}
                    </span>
                    {contact.display_name && (
                      <span className="text-xs text-[var(--muted-foreground)] truncate block">
                        {contact.display_name}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveVip(contact.id, contact.email)}
                    className="text-xs text-[var(--muted-foreground)] hover:text-[var(--destructive)] transition-colors flex-shrink-0 ml-2"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--muted-foreground)] py-2">
              No VIP contacts yet. Add email addresses or domains below.
            </p>
          )}

          {/* Add VIP contact */}
          <form onSubmit={handleAddVip} className="border-t border-[var(--border)] pt-4 space-y-2">
            <p className="text-xs font-medium text-[var(--muted-foreground)]">
              Add VIP contact or domain
            </p>
            <input
              type="text"
              value={newVipEmail}
              onChange={(e) => setNewVipEmail(e.target.value)}
              placeholder="email@example.com or example.com"
              maxLength={512}
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              data-testid="vip-email-input"
            />
            <input
              type="text"
              value={newVipName}
              onChange={(e) => setNewVipName(e.target.value)}
              placeholder="Display name (optional)"
              maxLength={255}
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              data-testid="vip-name-input"
            />
            <button
              type="submit"
              disabled={addingVip || !newVipEmail.trim()}
              className="w-full px-4 py-2 text-sm font-medium bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40"
              data-testid="add-vip-button"
            >
              {addingVip ? "Adding..." : "Add VIP"}
            </button>
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

      {/* Create Smart Label Modal */}
      <Modal
        open={showCreateSmartLabel}
        onClose={() => setShowCreateSmartLabel(false)}
        title="Create Smart Label"
      >
        <form onSubmit={handleCreateSmartLabel} className="space-y-4" data-testid="create-smart-label-modal">
          {/* Email context preview */}
          {smartLabelEmailContext && (
            <div className="p-3 rounded-lg bg-[var(--secondary)]/50 border border-[var(--border)]">
              <p className="text-xs text-[var(--muted-foreground)] mb-1">Based on email from:</p>
              <p className="text-sm font-medium text-[var(--foreground)] truncate">{smartLabelEmailContext.sender}</p>
              {smartLabelEmailContext.subject && (
                <p className="text-xs text-[var(--muted-foreground)] truncate mt-0.5">{smartLabelEmailContext.subject}</p>
              )}
            </div>
          )}

          {/* Label name */}
          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
              Label Name
            </label>
            <input
              type="text"
              value={smartLabelName}
              onChange={(e) => setSmartLabelName(e.target.value)}
              placeholder="e.g., Newsletters, Follow-ups, Important..."
              maxLength={100}
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              data-testid="smart-label-name-input"
            />
          </div>

          {/* Matching prompt with AI suggestion */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-[var(--muted-foreground)]">
                Matching Rule
              </label>
              <button
                type="button"
                onClick={handleSuggestPrompt}
                disabled={suggestingPrompt}
                className="text-xs px-2 py-1 rounded-md bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20 transition-colors disabled:opacity-40 flex items-center gap-1"
                data-testid="suggest-prompt-button"
              >
                {suggestingPrompt ? (
                  <>
                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Suggesting...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
                    </svg>
                    AI Suggest
                  </>
                )}
              </button>
            </div>
            <textarea
              value={smartLabelPrompt}
              onChange={(e) => setSmartLabelPrompt(e.target.value)}
              placeholder="Describe what emails should match this label, e.g., 'Emails from newsletters and marketing subscriptions'"
              maxLength={5000}
              rows={3}
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] resize-none"
              data-testid="smart-label-prompt-input"
            />
            <p className="text-[10px] text-[var(--muted-foreground)] mt-1">
              Write a plain English description of which emails should be tagged with this label.
            </p>
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
              Color
            </label>
            <div className="flex items-center gap-2">
              {["#6366F1", "#EC4899", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EF4444", "#06B6D4"].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSmartLabelColor(c)}
                  className="w-6 h-6 rounded-full transition-transform"
                  style={{
                    backgroundColor: c,
                    transform: smartLabelColor === c ? "scale(1.2)" : "scale(1)",
                    boxShadow: smartLabelColor === c ? `0 0 0 2px var(--background), 0 0 0 4px ${c}` : "none",
                  }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowCreateSmartLabel(false)}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creatingSmart || !smartLabelName.trim() || !smartLabelPrompt.trim()}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-40"
              data-testid="create-smart-label-submit"
            >
              {creatingSmart ? "Creating..." : "Create Label"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Forward email modal */}
      <Modal
        open={showForwardModal}
        onClose={() => setShowForwardModal(false)}
        title="Forward email"
      >
        <div className="space-y-4">
          {/* Original email context */}
          {forwardEmailContext && (
            <div className="p-3 rounded-lg bg-[var(--secondary)]/50 border border-[var(--border)]">
              <p className="text-xs text-[var(--muted-foreground)] mb-1">Forwarding:</p>
              <p className="text-sm font-medium text-[var(--foreground)] truncate">
                {forwardEmailContext.subject || "(No subject)"}
              </p>
              <p className="text-xs text-[var(--muted-foreground)] truncate mt-0.5">
                From: {forwardEmailContext.sender}
              </p>
            </div>
          )}

          {/* Recipient email */}
          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
              Recipient Email
            </label>
            <input
              type="email"
              value={forwardRecipient}
              onChange={(e) => setForwardRecipient(e.target.value)}
              placeholder="recipient@example.com"
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              data-testid="forward-recipient-input"
            />
          </div>

          {/* Forwarding message */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-[var(--muted-foreground)]">
                Message (optional)
              </label>
              {forwardIntent && !forwardGenerating && (
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] font-medium"
                  title={`AI detected this as: ${forwardIntent.replace("_", " ")}`}
                >
                  {forwardIntent.replace("_", " ")}
                </span>
              )}
            </div>
            <div className="relative">
              <textarea
                value={forwardMessage}
                onChange={(e) => { forwardUserEdited.current = true; setForwardMessage(e.target.value); }}
                placeholder={forwardGenerating ? "" : "Add a message to include with the forwarded email..."}
                rows={4}
                className={`w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] resize-y${forwardGenerating && !forwardMessage ? " opacity-60" : ""}`}
                data-testid="forward-message-input"
              />
              {forwardGenerating && !forwardMessage && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Generating suggestion...
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowForwardModal(false)}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                if (!forwardRecipient.trim() || !forwardEmailId) {
                  toast({ title: "Enter a recipient email", variant: "destructive" });
                  return;
                }
                setForwardSending(true);
                try {
                  const res = await fetch(`/api/emails/${forwardEmailId}/forward`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      recipientEmail: forwardRecipient.trim(),
                      message: forwardMessage || undefined,
                    }),
                  });
                  if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    throw new Error(data.error || "Failed to forward");
                  }
                  toast({
                    title: "Email forwarded",
                    description: `Sent to ${forwardRecipient.trim()}`,
                    variant: "success",
                  });
                  setShowForwardModal(false);
                } catch (err) {
                  toast({
                    title: "Forward failed",
                    description: err instanceof Error ? err.message : "Failed to forward email",
                    variant: "destructive",
                  });
                } finally {
                  setForwardSending(false);
                }
              }}
              disabled={forwardSending || !forwardRecipient.trim()}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-40"
              data-testid="forward-send-button"
            >
              {forwardSending ? "Sending..." : "Forward"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
