"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useInboxCache } from "@/lib/hooks/useInboxCache";
import type { EmailListItem, EmailListResponse, EmailSearchResponse, EmailSearchItem, EmailLabelChip, EmailDetail } from "@/types/email";
import type { SmartLabelChip, EmailDraft } from "@/types/smartLabel";
import { InboxFilterDrawer } from "@/components/email/InboxFilterDrawer";
import { SendToPageModal } from "@/components/email/SendToPageModal";

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

/** Strip dangerous HTML tags/attributes for email preview. */
function sanitizePreviewHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/\s*on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, "");
}

/** Renders sanitized email HTML inside an iframe for the preview pane. Links open in new tabs. */
function PreviewHtmlFrame({ html }: { html: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(300);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument;
    if (!doc) return;

    const safe = sanitizePreviewHtml(html);
    doc.open();
    doc.write(`<!DOCTYPE html>
<html><head><base target="_blank"><style>
  body { margin: 0; padding: 0; background: #fff; color: #1a1a1a; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 14px; line-height: 1.6; word-break: break-word; overflow-wrap: break-word; }
  img { max-width: 100%; height: auto; }
  a { color: #2563eb; }
  pre, code { white-space: pre-wrap; }
  table { max-width: 100%; }
</style></head><body>${safe}</body></html>`);
    doc.close();

    // Force all links to open in new tab (belt + suspenders with <base target="_blank">)
    doc.querySelectorAll("a").forEach((a) => {
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener noreferrer");
    });

    const resize = () => { if (doc.body) setHeight(doc.body.scrollHeight); };
    const images = doc.querySelectorAll("img");
    let loaded = 0;
    const onImgLoad = () => { loaded++; if (loaded >= images.length) resize(); };
    images.forEach((img) => {
      if (img.complete) loaded++;
      else { img.addEventListener("load", onImgLoad); img.addEventListener("error", onImgLoad); }
    });
    resize();
    const timer = setTimeout(resize, 200);
    return () => {
      clearTimeout(timer);
      images.forEach((img) => { img.removeEventListener("load", onImgLoad); img.removeEventListener("error", onImgLoad); });
    };
  }, [html]);

  return (
    <iframe
      ref={iframeRef}
      sandbox="allow-same-origin allow-popups"
      style={{ width: "100%", height, border: "none", borderRadius: "4px" }}
      title="Email preview"
    />
  );
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
  const [showMobileFilters, setShowMobileFilters] = useState(false);
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

  // Smart rule pages state
  const [allSmartRulePages, setAllSmartRulePages] = useState<{ id: string; name: string; color: string }[]>([]);
  const [filterSmartRulePage, setFilterSmartRulePage] = useState<string | null>(null);
  const [smartRulePageMap, setSmartRulePageMap] = useState<Record<string, { pageId: string; pageName: string; pageColor: string }[]>>({});

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

  // Send to Page state
  const [showSendToPage, setShowSendToPage] = useState(false);
  const [sendToPageEmails, setSendToPageEmails] = useState<EmailListItem[]>([]);
  const [bulkSelected, setBulkSelected] = useState<Set<string | number>>(new Set());

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

  // Folder & Spam state
  const [activeFolder, setActiveFolder] = useState<"inbox" | "spam" | "done" | "all">("inbox");

  // Focused email for keyboard navigation
  const [focusedEmailId, setFocusedEmailId] = useState<string | number | null>(null);

  // Preview pane state
  const [previewEmail, setPreviewEmail] = useState<EmailDetail | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const previewAbortRef = useRef<AbortController | null>(null);

  // Resizable column width (persisted in localStorage)
  const [listWidth, setListWidth] = useState<number>(() => {
    if (typeof window === "undefined") return 480;
    const saved = localStorage.getItem("inbox-list-width");
    return saved ? Math.max(280, Math.min(800, parseInt(saved, 10))) : 480;
  });
  const [isResizing, setIsResizing] = useState(false);
  const listColumnRef = useRef<HTMLDivElement>(null);
  const resizeStartXRef = useRef(0);
  const resizeStartWidthRef = useRef(0);

  // Fetch email detail when focused email changes
  useEffect(() => {
    if (focusedEmailId == null) {
      setPreviewEmail(null);
      return;
    }

    // Abort any in-flight preview fetch
    previewAbortRef.current?.abort();
    const controller = new AbortController();
    previewAbortRef.current = controller;

    setPreviewLoading(true);
    fetch(`/api/emails/${focusedEmailId}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data: EmailDetail) => {
        if (!controller.signal.aborted) {
          setPreviewEmail(data);
          setPreviewLoading(false);
        }
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (!controller.signal.aborted) {
          setPreviewEmail(null);
          setPreviewLoading(false);
        }
      });

    return () => controller.abort();
  }, [focusedEmailId]);

  // Resize handle drag logic — uses direct DOM mutation for smooth dragging,
  // commits to React state only on mouseup.
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    resizeStartXRef.current = e.clientX;
    resizeStartWidthRef.current = listColumnRef.current?.offsetWidth ?? listWidth;
    setIsResizing(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    function onMouseMove(ev: MouseEvent) {
      const delta = ev.clientX - resizeStartXRef.current;
      const newWidth = Math.max(280, Math.min(800, resizeStartWidthRef.current + delta));
      // Direct DOM mutation — no React re-render per pixel
      if (listColumnRef.current) {
        listColumnRef.current.style.width = `${newWidth}px`;
      }
    }
    function onMouseUp(ev: MouseEvent) {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      setIsResizing(false);
      // Read final width from DOM and commit to React state + localStorage
      const delta = ev.clientX - resizeStartXRef.current;
      const finalWidth = Math.max(280, Math.min(800, resizeStartWidthRef.current + delta));
      setListWidth(finalWidth);
      localStorage.setItem("inbox-list-width", String(finalWidth));
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    }
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, [listWidth]);

  const [syncing, setSyncing] = useState(false);

  // Pinned tabs state (persisted in localStorage)
  const [pinnedAccounts, setPinnedAccounts] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem("inbox-pinned-accounts") || "[]"); } catch { return []; }
  });
  const [pinnedLabels, setPinnedLabels] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem("inbox-pinned-labels") || "[]"); } catch { return []; }
  });
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [showLabelDropdown, setShowLabelDropdown] = useState(false);
  const accountDropdownRef = useRef<HTMLDivElement>(null);
  const labelDropdownRef = useRef<HTMLDivElement>(null);

  // Persist pinned state
  useEffect(() => {
    localStorage.setItem("inbox-pinned-accounts", JSON.stringify(pinnedAccounts));
  }, [pinnedAccounts]);
  useEffect(() => {
    localStorage.setItem("inbox-pinned-labels", JSON.stringify(pinnedLabels));
  }, [pinnedLabels]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(e.target as Node)) {
        setShowAccountDropdown(false);
      }
      if (labelDropdownRef.current && !labelDropdownRef.current.contains(e.target as Node)) {
        setShowLabelDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const togglePinAccount = useCallback((accountId: string) => {
    setPinnedAccounts((prev) =>
      prev.includes(accountId) ? prev.filter((id) => id !== accountId) : [...prev, accountId]
    );
  }, []);

  const togglePinLabel = useCallback((labelId: string) => {
    setPinnedLabels((prev) =>
      prev.includes(labelId) ? prev.filter((id) => id !== labelId) : [...prev, labelId]
    );
  }, []);

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
    fetch("/api/pages/smart-rules")
      .then((r) => r.json())
      .then((d) => { if (d.data) setAllSmartRulePages(d.data); })
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
        if (activeFolder !== "all") params.set("folder", activeFolder);

        const res = await fetch(`/api/emails?${params}`);
        if (!res.ok) throw new Error("Failed to fetch emails");
        const data: EmailListResponse = await res.json();
        setEmails(data.data);
        setTotal(data.total);
        setIsSemanticSearch(false);
        setEmbeddingStatus(null);
        if (data.data.length > 0) setFocusedEmailId(data.data[0].id);
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

    // Fetch smart rule page assignments for displayed emails
    const pageRuleFetches: Promise<Record<string, { pageId: string; pageName: string; pageColor: string }[]>>[] = [];
    if (outlookIds.length > 0) {
      pageRuleFetches.push(
        fetch("/api/pages/smart-rules/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemType: "email", itemIds: outlookIds }),
        }).then((r) => r.json()).then((d) => d.data || {}).catch(() => ({}))
      );
    }
    if (gmailIds.length > 0) {
      pageRuleFetches.push(
        fetch("/api/pages/smart-rules/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemType: "gmail_email", itemIds: gmailIds }),
        }).then((r) => r.json()).then((d) => d.data || {}).catch(() => ({}))
      );
    }
    if (pageRuleFetches.length > 0) {
      Promise.all(pageRuleFetches).then((results) => {
        const merged: Record<string, { pageId: string; pageName: string; pageColor: string }[]> = {};
        for (const r of results) {
          for (const [k, v] of Object.entries(r)) {
            merged[k] = v;
          }
        }
        setSmartRulePageMap(merged);
      });
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
    setFilterSmartRulePage(null);
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
      const parts = [`${data.classified} labeled`];
      if (data.spamMarked > 0) parts.push(`${data.spamMarked} spam`);
      toast({
        title: "Classification complete",
        description: `${data.total} emails processed: ${parts.join(", ")}`,
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

  // Handle unsubscribe click
  const handleUnsubscribe = (e: React.MouseEvent, link: string) => {
    e.stopPropagation();
    e.preventDefault();
    window.open(link, "_blank", "noopener,noreferrer");
  };

  // Toggle read/unread status
  const handleToggleRead = async (emailId: string | number, currentlyRead: boolean) => {
    const newRead = !currentlyRead;
    // Optimistic update
    setEmails((prev) => prev.map((em) => em.id === emailId ? { ...em, is_read: newRead } : em));
    try {
      const res = await fetch(`/api/emails/${emailId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_read: newRead }),
      });
      if (!res.ok) throw new Error("Failed to update");
    } catch {
      // Revert on failure
      setEmails((prev) => prev.map((em) => em.id === emailId ? { ...em, is_read: currentlyRead } : em));
      toast({ title: "Failed to update read status", variant: "destructive" });
    }
  };

  // Mark email as done / undone
  const handleMarkDone = async (emailId: string | number, currentlyDone: boolean) => {
    const newDone = !currentlyDone;
    const prevEmails = emails;
    // Optimistic: remove from view in inbox/done tabs, toggle in "all"
    setEmails((prev) => {
      if ((activeFolder === "inbox" && newDone) || (activeFolder === "done" && !newDone)) {
        return prev.filter((em) => em.id !== emailId);
      }
      return prev.map((em) => em.id === emailId ? { ...em, is_done: newDone, is_read: newDone ? true : em.is_read } : em);
    });
    try {
      const res = await fetch(`/api/emails/${emailId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_done: newDone }),
      });
      if (!res.ok) throw new Error("Failed to update");
      cache.invalidateAll();
      toast({ title: newDone ? "Done" : "Moved back to inbox", variant: "success" });
    } catch {
      setEmails(prevEmails);
      toast({ title: "Failed to update", variant: "destructive" });
    }
  };

  // Remove all labels (system + smart) from an email — "0" key shortcut
  const handleRemoveAllLabels = async (emailId: string | number) => {
    const email = emails.find((em) => em.id === emailId);
    if (!email) return;

    const systemLabels = email.labels ?? [];
    const itemType = email.provider === "gmail" ? "gmail_email" : "email";
    const smartLabels = smartLabelMap[String(emailId)] ?? [];

    if (systemLabels.length === 0 && smartLabels.length === 0) {
      toast({ title: "No labels to remove", variant: "default" });
      return;
    }

    // Optimistic UI: clear labels
    const prevEmails = emails;
    const prevSmartLabelMap = { ...smartLabelMap };
    setEmails((prev) => prev.map((em) => em.id === emailId ? { ...em, labels: [] } : em));
    setSmartLabelMap((prev) => { const next = { ...prev }; delete next[String(emailId)]; return next; });

    try {
      const deletes: Promise<Response>[] = [];
      // Remove system labels
      for (const label of systemLabels) {
        deletes.push(fetch(`/api/emails/${emailId}/labels?labelId=${label.id}`, { method: "DELETE" }));
      }
      // Remove smart labels
      for (const label of smartLabels) {
        deletes.push(fetch(`/api/smart-labels/${label.id}/items?itemType=${encodeURIComponent(itemType)}&itemId=${encodeURIComponent(String(emailId))}`, { method: "DELETE" }));
      }
      await Promise.all(deletes);
      cache.invalidateAll();
      toast({ title: "All labels removed", variant: "success" });
    } catch {
      setEmails(prevEmails);
      setSmartLabelMap(prevSmartLabelMap);
      toast({ title: "Failed to remove labels", variant: "destructive" });
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

  const hasActiveFilters = query || afterDate || beforeDate || filterLabel || filterAccount || filterSmartLabel || filterSmartRulePage;
  const pageNumbers = getPageNumbers(page, totalPages);

  // Unread count from loaded emails
  const unreadCount = emails.filter((e) => !e.is_read).length;

  // Filter emails by selected label or smart label (client-side)
  let filteredEmails = emails;
  if (filterLabel) {
    filteredEmails = filteredEmails.filter((e) => e.labels?.some((l) => l.id === filterLabel));
  }
  if (filterSmartLabel) {
    filteredEmails = filteredEmails.filter((e) =>
      smartLabelMap[String(e.id)]?.some((l) => l.id === filterSmartLabel)
    );
  }
  if (filterSmartRulePage) {
    filteredEmails = filteredEmails.filter((e) =>
      smartRulePageMap[String(e.id)]?.some((p) => p.pageId === filterSmartRulePage)
    );
  }

  // Keyboard shortcuts: arrow navigation, E/Right=done, Ctrl+Shift+P=send to page
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      const editable = (e.target as HTMLElement)?.isContentEditable;
      if (tag === "INPUT" || tag === "TEXTAREA" || editable) return;

      // Ctrl+Shift+P → Send to Page
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        const selected = emails.filter((em) => bulkSelected.has(em.id));
        if (selected.length > 0) {
          setSendToPageEmails(selected);
          setShowSendToPage(true);
        }
        return;
      }

      // Enter → open focused email in full detail view
      if (e.key === "Enter" && focusedEmailId != null) {
        e.preventDefault();
        window.location.href = `/inbox/${focusedEmailId}`;
        return;
      }

      // Escape → close preview pane (deselect focused email)
      if (e.key === "Escape" && focusedEmailId != null) {
        e.preventDefault();
        setFocusedEmailId(null);
        return;
      }

      // Arrow Up → focus previous email
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedEmailId((prev) => {
          const idx = filteredEmails.findIndex((em) => em.id === prev);
          if (idx <= 0) return filteredEmails[0]?.id ?? null;
          return filteredEmails[idx - 1].id;
        });
        return;
      }

      // Arrow Down → focus next email
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedEmailId((prev) => {
          const idx = filteredEmails.findIndex((em) => em.id === prev);
          if (idx < 0) return filteredEmails[0]?.id ?? null;
          if (idx >= filteredEmails.length - 1) return prev;
          return filteredEmails[idx + 1].id;
        });
        return;
      }

      // Right arrow or E → mark as done (bulk if selected, else focused)
      if (e.key === "ArrowRight" || e.key === "e" || e.key === "E") {
        e.preventDefault();
        if (bulkSelected.size > 0) {
          // Bulk done
          const ids = Array.from(bulkSelected);
          setEmails((prev) => prev.filter((em) => !bulkSelected.has(em.id)));
          setBulkSelected(new Set());
          Promise.allSettled(ids.map((id) =>
            fetch(`/api/emails/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_done: true }) })
          )).then(() => {
            cache.invalidateAll();
            toast({ title: `${ids.length} emails done`, variant: "success" });
          });
        } else if (focusedEmailId != null) {
          const idx = filteredEmails.findIndex((em) => em.id === focusedEmailId);
          const email = filteredEmails[idx];
          if (email && !email.is_done) {
            // Advance focus to next email before removing
            const nextId = filteredEmails[idx + 1]?.id ?? filteredEmails[idx - 1]?.id ?? null;
            setFocusedEmailId(nextId);
            handleMarkDone(email.id, false);
          }
        }
        return;
      }

      // Left arrow → undo done (move back to inbox) when in Done tab
      if (e.key === "ArrowLeft" && activeFolder === "done" && focusedEmailId != null) {
        e.preventDefault();
        const idx = filteredEmails.findIndex((em) => em.id === focusedEmailId);
        const email = filteredEmails[idx];
        if (email) {
          const nextId = filteredEmails[idx + 1]?.id ?? filteredEmails[idx - 1]?.id ?? null;
          setFocusedEmailId(nextId);
          handleMarkDone(email.id, true);
        }
        return;
      }

      // 0 → remove all labels from focused email (misclassification correction)
      if (e.key === "0" && focusedEmailId != null) {
        e.preventDefault();
        handleRemoveAllLabels(focusedEmailId);
        return;
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [emails, filteredEmails, bulkSelected, focusedEmailId, activeFolder]);

  // Scroll focused email into view during keyboard navigation
  useEffect(() => {
    if (focusedEmailId == null) return;
    const el = document.querySelector(`[data-email-id="${focusedEmailId}"]`);
    if (el) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [focusedEmailId]);

  return (
    <div className="flex h-full flex-col bg-[var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-3 py-3 md:px-6 md:py-4">
          <div className="min-w-0">
            <h1 className="text-lg md:text-2xl font-bold text-[var(--foreground)]">
              {activeFolder === "done" ? "Done" : activeFolder === "spam" ? "Spam" : activeFolder === "all" ? "All Mail" : "Inbox"}
            </h1>
            <p className="text-xs md:text-sm text-[var(--muted-foreground)] mt-0.5 md:mt-1 truncate">
              {total} {total === 1 ? "message" : "messages"}
              {filterAccount && accounts.length > 0 && (
                <span className="ml-1 hidden sm:inline">
                  in {accounts.find((a) => a.id === filterAccount)?.email ?? "selected account"}
                </span>
              )}
            </p>
          </div>

          {/* Desktop toolbar */}
          <div className="hidden md:flex items-center gap-3">
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
              title="Classify and detect spam for all emails on this page"
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

          {/* Mobile toolbar — icon-only buttons */}
          <div className="flex md:hidden items-center gap-1">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="p-2 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--accent)] transition-colors disabled:opacity-40"
              title="Sync"
            >
              {syncing ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 2v6h-6" />
                  <path d="M3 12a9 9 0 0115-6.7L21 8" />
                  <path d="M3 22v-6h6" />
                  <path d="M21 12a9 9 0 01-15 6.7L3 16" />
                </svg>
              )}
            </button>
            <div className="relative">
              <button
                onClick={() => setShowMobileFilters(true)}
                className={`p-2 rounded-lg transition-colors ${
                  hasActiveFilters
                    ? "text-[var(--primary)] bg-[var(--primary)]/10"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
                }`}
                title="Filters"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
              </button>
              {(() => {
                const count = [filterAccount, filterLabel, filterSmartLabel, filterSmartRulePage, afterDate, beforeDate].filter(Boolean).length;
                return count > 0 ? (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] text-[10px] font-bold leading-none px-1">
                    {count}
                  </span>
                ) : null;
              })()}
            </div>
          </div>
        </div>

        {/* Mobile search bar */}
        <div className="md:hidden px-3 pb-2">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search emails..."
              className="flex-1 min-w-0 px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent"
            />
            <button
              type="submit"
              className="px-3 py-2 text-sm font-medium bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:opacity-90 transition-opacity flex-shrink-0"
            >
              Search
            </button>
          </form>
        </div>

        {/* Combined tab bar: folders + pinned accounts + pinned labels + dropdowns */}
        <div className="px-3 md:px-6 pb-2 flex items-center gap-0.5 md:gap-1 border-b border-[var(--border)]" data-testid="folder-tabs">
          <div className="flex items-center gap-0.5 md:gap-1 overflow-x-auto min-w-0 flex-1">
          {/* Folder tabs */}
          {([
            { key: "inbox" as const, label: "Inbox" },
            { key: "done" as const, label: "Done" },
            { key: "spam" as const, label: "Spam" },
            { key: "all" as const, label: "All" },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                if (activeFolder !== tab.key) {
                  hasFetchedOnce.current = false;
                  setFilterAccount(null);
                  setFilterProvider(null);
                  setFilterLabel(null);
                  setFilterSmartLabel(null);
                  setFilterSmartRulePage(null);
                  setActiveFolder(tab.key);
                  setPage(1);
                }
              }}
              className={`px-3 md:px-4 py-2 text-xs md:text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                activeFolder === tab.key && !filterAccount && !filterLabel && !filterSmartLabel && !filterSmartRulePage
                  ? "text-[var(--primary)] border-b-2 border-[var(--primary)]"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
              data-testid={`folder-tab-${tab.key}`}
            >
              {tab.label}
              {tab.key === "inbox" && unreadCount > 0 && (
                <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          ))}

          {/* Separator between folders and pinned items */}
          {(pinnedAccounts.length > 0 || pinnedLabels.length > 0) && (
            <span className="mx-1 md:mx-2 h-4 w-px bg-[var(--border)] flex-shrink-0" />
          )}

          {/* Pinned account tabs */}
          {pinnedAccounts.map((accountId) => {
            const account = accounts.find((a) => a.id === accountId);
            if (!account) return null;
            const isActive = filterAccount === accountId;
            return (
              <button
                key={`pinned-account-${accountId}`}
                onClick={() => {
                  hasFetchedOnce.current = false;
                  if (isActive) {
                    setFilterAccount(null);
                    setFilterProvider(null);
                  } else {
                    setFilterAccount(accountId);
                    setFilterProvider(account.provider);
                    setFilterLabel(null);
                    setFilterSmartLabel(null);
                    setFilterSmartRulePage(null);
                  }
                  setPage(1);
                }}
                className={`group px-2.5 md:px-3 py-2 text-xs md:text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? "text-[var(--primary)] border-b-2 border-[var(--primary)]"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
                data-testid={`pinned-account-tab-${account.email}`}
              >
                <ProviderIcon provider={account.provider} size={12} />
                <span className="max-w-[120px] truncate">{account.email.split("@")[0]}</span>
                <span
                  onClick={(e) => { e.stopPropagation(); togglePinAccount(accountId); }}
                  className="ml-0.5 opacity-0 group-hover:opacity-100 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-opacity cursor-pointer"
                  title="Unpin"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </span>
              </button>
            );
          })}

          {/* Pinned label tabs */}
          {pinnedLabels.map((labelId) => {
            const label = allLabels.find((l) => l.id === labelId) || allSmartLabels.find((l) => l.id === labelId) || allSmartRulePages.find((p) => p.id === labelId);
            if (!label) return null;
            const isSmartLabel = allSmartLabels.some((sl) => sl.id === labelId);
            const isSmartRulePage = allSmartRulePages.some((p) => p.id === labelId);
            const isActive = isSmartRulePage ? filterSmartRulePage === labelId : isSmartLabel ? filterSmartLabel === labelId : filterLabel === labelId;
            return (
              <button
                key={`pinned-label-${labelId}`}
                onClick={() => {
                  if (isActive) {
                    if (isSmartRulePage) setFilterSmartRulePage(null);
                    else if (isSmartLabel) setFilterSmartLabel(null);
                    else setFilterLabel(null);
                  } else {
                    setFilterAccount(null);
                    setFilterProvider(null);
                    setFilterLabel(null);
                    setFilterSmartLabel(null);
                    setFilterSmartRulePage(null);
                    if (isSmartRulePage) {
                      setFilterSmartRulePage(labelId);
                    } else if (isSmartLabel) {
                      setFilterSmartLabel(labelId);
                    } else {
                      setFilterLabel(labelId);
                    }
                  }
                  setPage(1);
                }}
                className={`group px-2.5 md:px-3 py-2 text-xs md:text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? "border-b-2"
                    : "hover:opacity-80"
                }`}
                style={{
                  color: label.color,
                  borderColor: isActive ? label.color : "transparent",
                }}
                data-testid={`pinned-label-tab-${label.name}`}
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: label.color }} />
                {label.name}
                <span
                  onClick={(e) => { e.stopPropagation(); togglePinLabel(labelId); }}
                  className="ml-0.5 opacity-0 group-hover:opacity-100 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-opacity cursor-pointer"
                  title="Unpin"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </span>
              </button>
            );
          })}

          </div>
          {/* Account dropdown */}
          {accounts.length > 0 && (
            <div className="relative flex-shrink-0 hidden md:flex" ref={accountDropdownRef}>
              <button
                onClick={() => { setShowAccountDropdown(!showAccountDropdown); setShowLabelDropdown(false); }}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1 ${
                  filterAccount
                    ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                    : "border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]"
                }`}
                data-testid="account-dropdown-trigger"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                Account
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              {showAccountDropdown && (
                <div className="absolute right-0 top-full mt-1 w-72 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-50 py-1">
                  <button
                    onClick={() => {
                      hasFetchedOnce.current = false;
                      setFilterAccount(null);
                      setFilterProvider(null);
                      setPage(1);
                      setShowAccountDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                      !filterAccount ? "text-[var(--primary)] bg-[var(--primary)]/5 font-medium" : "text-[var(--foreground)] hover:bg-[var(--accent)]"
                    }`}
                  >
                    All accounts
                  </button>
                  {accounts.map((account) => {
                    const isPinned = pinnedAccounts.includes(account.id);
                    return (
                      <div key={account.id} className="flex items-center group">
                        <button
                          onClick={() => {
                            hasFetchedOnce.current = false;
                            if (filterAccount === account.id) {
                              setFilterAccount(null);
                              setFilterProvider(null);
                            } else {
                              setFilterAccount(account.id);
                              setFilterProvider(account.provider);
                              setFilterLabel(null);
                              setFilterSmartLabel(null);
                              setFilterSmartRulePage(null);
                            }
                            setPage(1);
                            setShowAccountDropdown(false);
                          }}
                          className={`flex-1 text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                            filterAccount === account.id ? "text-[var(--primary)] bg-[var(--primary)]/5 font-medium" : "text-[var(--foreground)] hover:bg-[var(--accent)]"
                          }`}
                        >
                          <ProviderIcon provider={account.provider} size={14} />
                          <span className="truncate">{account.email}</span>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); togglePinAccount(account.id); }}
                          className={`px-2 py-2 text-xs transition-colors flex-shrink-0 ${
                            isPinned ? "text-[var(--primary)]" : "text-[var(--muted-foreground)] opacity-0 group-hover:opacity-100"
                          } hover:text-[var(--primary)]`}
                          title={isPinned ? "Unpin from tabs" : "Pin to tabs"}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill={isPinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 17v5" />
                            <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16h14v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 2-2H6a2 2 0 0 0 2 2 1 1 0 0 1 1 1z" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Label dropdown */}
          {(allLabels.length > 0 || allSmartLabels.length > 0 || allSmartRulePages.length > 0) && (
            <div className="relative flex-shrink-0 hidden md:block" ref={labelDropdownRef}>
              <button
                onClick={() => { setShowLabelDropdown(!showLabelDropdown); setShowAccountDropdown(false); }}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1 ${
                  filterLabel || filterSmartLabel || filterSmartRulePage
                    ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                    : "border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]"
                }`}
                data-testid="label-dropdown-trigger"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                Labels
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              {showLabelDropdown && (
                <div className="absolute right-0 top-full mt-1 w-64 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-50 py-1 max-h-80 overflow-auto">
                  <button
                    onClick={() => {
                      setFilterLabel(null);
                      setFilterSmartLabel(null);
                      setFilterSmartRulePage(null);
                      setPage(1);
                      setShowLabelDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      !filterLabel && !filterSmartLabel && !filterSmartRulePage ? "text-[var(--primary)] bg-[var(--primary)]/5 font-medium" : "text-[var(--foreground)] hover:bg-[var(--accent)]"
                    }`}
                  >
                    All labels
                  </button>
                  {allLabels.length > 0 && (
                    <div className="px-3 pt-2 pb-1">
                      <span className="text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Labels</span>
                    </div>
                  )}
                  {allLabels.map((label) => {
                    const isPinned = pinnedLabels.includes(label.id);
                    return (
                      <div key={label.id} className="flex items-center group">
                        <button
                          onClick={() => {
                            setFilterLabel(filterLabel === label.id ? null : label.id);
                            setFilterSmartLabel(null);
                            setFilterSmartRulePage(null);
                            setFilterAccount(null);
                            setFilterProvider(null);
                            setPage(1);
                            setShowLabelDropdown(false);
                          }}
                          className={`flex-1 text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                            filterLabel === label.id ? "font-medium" : "hover:bg-[var(--accent)]"
                          }`}
                          style={{ color: filterLabel === label.id ? label.color : undefined }}
                        >
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: label.color }} />
                          {label.name}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); togglePinLabel(label.id); }}
                          className={`px-2 py-2 text-xs transition-colors flex-shrink-0 ${
                            isPinned ? "text-[var(--primary)]" : "text-[var(--muted-foreground)] opacity-0 group-hover:opacity-100"
                          } hover:text-[var(--primary)]`}
                          title={isPinned ? "Unpin from tabs" : "Pin to tabs"}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill={isPinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 17v5" />
                            <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16h14v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 2-2H6a2 2 0 0 0 2 2 1 1 0 0 1 1 1z" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                  {allSmartLabels.length > 0 && (
                    <div className="px-3 pt-2 pb-1">
                      <span className="text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Smart Labels</span>
                    </div>
                  )}
                  {allSmartLabels.map((sl) => {
                    const isPinned = pinnedLabels.includes(sl.id);
                    return (
                      <div key={sl.id} className="flex items-center group">
                        <button
                          onClick={() => {
                            setFilterSmartLabel(filterSmartLabel === sl.id ? null : sl.id);
                            setFilterLabel(null);
                            setFilterSmartRulePage(null);
                            setFilterAccount(null);
                            setFilterProvider(null);
                            setPage(1);
                            setShowLabelDropdown(false);
                          }}
                          className={`flex-1 text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                            filterSmartLabel === sl.id ? "font-medium" : "hover:bg-[var(--accent)]"
                          }`}
                          style={{ color: filterSmartLabel === sl.id ? sl.color : undefined }}
                        >
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: sl.color }} />
                          {sl.name}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); togglePinLabel(sl.id); }}
                          className={`px-2 py-2 text-xs transition-colors flex-shrink-0 ${
                            isPinned ? "text-[var(--primary)]" : "text-[var(--muted-foreground)] opacity-0 group-hover:opacity-100"
                          } hover:text-[var(--primary)]`}
                          title={isPinned ? "Unpin from tabs" : "Pin to tabs"}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill={isPinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 17v5" />
                            <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16h14v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 2-2H6a2 2 0 0 0 2 2 1 1 0 0 1 1 1z" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                  {allSmartRulePages.length > 0 && (
                    <div className="px-3 pt-2 pb-1">
                      <span className="text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Smart Rules</span>
                    </div>
                  )}
                  {allSmartRulePages.map((srp) => {
                    const isPinned = pinnedLabels.includes(srp.id);
                    return (
                      <div key={srp.id} className="flex items-center group">
                        <button
                          onClick={() => {
                            setFilterSmartRulePage(filterSmartRulePage === srp.id ? null : srp.id);
                            setFilterLabel(null);
                            setFilterSmartLabel(null);
                            setFilterAccount(null);
                            setFilterProvider(null);
                            setPage(1);
                            setShowLabelDropdown(false);
                          }}
                          className={`flex-1 text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                            filterSmartRulePage === srp.id ? "font-medium" : "hover:bg-[var(--accent)]"
                          }`}
                          style={{ color: filterSmartRulePage === srp.id ? srp.color : undefined }}
                        >
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: srp.color }} />
                          {srp.name}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); togglePinLabel(srp.id); }}
                          className={`px-2 py-2 text-xs transition-colors flex-shrink-0 ${
                            isPinned ? "text-[var(--primary)]" : "text-[var(--muted-foreground)] opacity-0 group-hover:opacity-100"
                          } hover:text-[var(--primary)]`}
                          title={isPinned ? "Unpin from tabs" : "Pin to tabs"}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill={isPinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 17v5" />
                            <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16h14v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 2-2H6a2 2 0 0 0 2 2 1 1 0 0 1 1 1z" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Filter panel — hidden on mobile, shown in drawer instead */}
        {showFilters && (
          <div className="px-3 md:px-6 pb-4 hidden md:flex items-end gap-3 md:gap-4 flex-wrap">
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

      {/* Email list + Preview pane */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left column: email list */}
        <div
          ref={listColumnRef}
          className={`${focusedEmailId != null ? "hidden md:flex md:flex-col flex-shrink-0" : "flex-1 flex flex-col"} overflow-auto`}
          style={focusedEmailId != null ? { width: listWidth } : undefined}
        >
        {error && (
          <div className="mx-3 md:mx-6 mt-4 p-3 md:p-4 bg-[var(--destructive)]/10 border border-[var(--destructive)]/20 rounded-lg text-[var(--destructive)] text-sm">
            {error}
          </div>
        )}

        {/* Embedding status banner */}
        {embeddingStatus && embeddingStatus.pending > 0 && embeddingStatus.total > 0 && (
          embeddingStatus.pending / embeddingStatus.total > 0.2
        ) && (
          <div className="mx-3 md:mx-6 mt-4 p-3 bg-[var(--primary)]/5 border border-[var(--primary)]/20 rounded-lg text-sm text-[var(--muted-foreground)]">
            Search index is still building — results may be incomplete. ({embeddingStatus.embedded}/{embeddingStatus.total} emails indexed)
          </div>
        )}

        {/* Semantic search indicator */}
        {isSemanticSearch && !initialLoading && emails.length > 0 && (
          <div className="px-3 md:px-6 pt-3 pb-1 flex items-center justify-between">
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
              <div key={i} className="px-3 md:px-6 py-3 md:py-4 animate-pulse">
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
          <>
          {/* Bulk action bar */}
          {bulkSelected.size > 0 && (
            <div className="flex items-center gap-3 px-4 md:px-6 py-2 bg-[var(--primary)]/5 border-b border-[var(--border)]">
              <span className="text-xs font-medium text-[var(--foreground)]">
                {bulkSelected.size} selected
              </span>
              <button
                onClick={async () => {
                  const ids = Array.from(bulkSelected);
                  const prevEmails = emails;
                  setEmails((prev) => prev.filter((em) => !bulkSelected.has(em.id)));
                  setBulkSelected(new Set());
                  await Promise.allSettled(ids.map((id) =>
                    fetch(`/api/emails/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_done: true }) })
                  ));
                  cache.invalidateAll();
                  toast({ title: `${ids.length} emails done`, variant: "success" });
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md text-emerald-700 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                Done
              </button>
              <button
                onClick={() => {
                  const selected = filteredEmails.filter((e) => bulkSelected.has(e.id));
                  if (selected.length > 0) {
                    setSendToPageEmails(selected);
                    setShowSendToPage(true);
                  }
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md text-emerald-700 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m22 2-7 20-4-9-9-4Z" />
                  <path d="M22 2 11 13" />
                </svg>
                Send all to Page
              </button>
              <button
                onClick={async () => {
                  const ids = Array.from(bulkSelected);
                  setEmails((prev) => prev.map((em) => ids.includes(em.id) ? { ...em, is_read: true } : em));
                  await Promise.allSettled(ids.map((id) =>
                    fetch(`/api/emails/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_read: true }) })
                  ));
                  setBulkSelected(new Set());
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md text-[var(--primary)] bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 border border-[var(--primary)]/20 transition-colors"
              >
                Mark read
              </button>
              <button
                onClick={async () => {
                  const ids = Array.from(bulkSelected);
                  setEmails((prev) => prev.map((em) => ids.includes(em.id) ? { ...em, is_read: false } : em));
                  await Promise.allSettled(ids.map((id) =>
                    fetch(`/api/emails/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_read: false }) })
                  ));
                  setBulkSelected(new Set());
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md text-[var(--muted-foreground)] bg-[var(--secondary)] hover:bg-[var(--accent)] border border-[var(--border)] transition-colors"
              >
                Mark unread
              </button>
              <button
                onClick={() => setBulkSelected(new Set())}
                className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors ml-auto"
              >
                Clear selection
              </button>
            </div>
          )}
          <div className="divide-y divide-[var(--border)]">
            {filteredEmails.map((email) => {
              const emailDraft = draftMap[String(email.id)];
              const isDraftExpanded = expandedDraft === String(email.id);
              return (
              <div key={email.id}>
              <div
                data-email-id={email.id}
                onClick={() => setFocusedEmailId(email.id)}
                className={`flex items-start gap-2 md:gap-4 md:relative px-3 md:px-6 py-3 md:py-4 hover:bg-[var(--accent)]/50 transition-colors group ${!email.is_read ? "bg-[var(--primary)]/[0.03]" : ""} ${focusedEmailId === email.id ? "border-l-[3px] border-[var(--primary)] pl-[9px] md:pl-[21px] bg-[var(--primary)]/10 shadow-[inset_0_0_0_1px_var(--primary)]" : "border-l-[3px] border-transparent"}`}
              >
                {/* Unread indicator dot */}
                <div className="flex-shrink-0 pt-2 w-2 hidden md:flex items-start">
                  {!email.is_read && (
                    <span className="block w-2 h-2 rounded-full bg-[var(--primary)]" title="Unread" />
                  )}
                </div>

                {/* Bulk selection checkbox */}
                <div className="hidden md:flex items-center pt-1 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={bulkSelected.has(email.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      setBulkSelected((prev) => {
                        const next = new Set(prev);
                        if (next.has(email.id)) next.delete(email.id);
                        else next.add(email.id);
                        return next;
                      });
                    }}
                    className="w-3.5 h-3.5 rounded border-[var(--border)] accent-[var(--primary)] cursor-pointer"
                    title="Select for bulk actions"
                  />
                </div>

                {/* Status indicators */}
                <div className="w-4 flex-shrink-0 pt-1 hidden md:flex flex-col items-center gap-1">
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

                {/* Content - clickable link to detail (mobile) / focus for preview (desktop) */}
                <Link
                  href={`/inbox/${email.id}`}
                  className="flex-1 min-w-0"
                  onClick={(e) => {
                    // On desktop (md+), prevent navigation — just focus for preview
                    if (window.innerWidth >= 768) {
                      e.preventDefault();
                      setFocusedEmailId(email.id);
                    }
                  }}
                >
                  {/* Mobile layout: sender + time on top, subject below */}
                  <div className="flex items-center gap-2 md:hidden">
                    <span className={`text-sm text-[var(--foreground)] truncate min-w-0 flex-1 inline-flex items-center gap-1 ${!email.is_read ? "font-semibold" : "font-medium"}`}>
                      {!email.is_read && <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] flex-shrink-0 md:hidden" />}
                      {(email.provider === "outlook" || email.provider === "gmail") && (
                        <span className="flex-shrink-0 text-[var(--muted-foreground)]" title={email.provider === "gmail" ? "Gmail" : "Outlook"}>
                          <ProviderIcon provider={email.provider} size={12} />
                        </span>
                      )}
                      {email.sender}
                    </span>
                    <span
                      className="text-[10px] text-[var(--muted-foreground)] flex-shrink-0"
                      title={formatAbsoluteTime(email.received_at)}
                    >
                      {formatRelativeTime(email.received_at)}
                    </span>
                  </div>
                  <div className="md:hidden mt-0.5">
                    <p className={`text-sm text-[var(--foreground)] truncate ${!email.is_read ? "font-semibold" : ""}`}>
                      {email.subject || "(No subject)"}
                    </p>
                  </div>
                  {/* Mobile label chips */}
                  {((email.labels && email.labels.length > 0) || smartLabelMap[String(email.id)]?.length) && (
                    <div className="md:hidden flex items-center gap-1 mt-1 flex-wrap">
                      <LabelChips labels={email.labels} />
                      <SmartLabelChips labels={smartLabelMap[String(email.id)]} />
                    </div>
                  )}
                  {/* Mobile preview */}
                  {email.preview && (
                    <p className="md:hidden text-xs text-[var(--muted-foreground)] truncate mt-0.5">
                      {email.preview}
                    </p>
                  )}

                  {/* Desktop layout: single row */}
                  <div className="hidden md:flex items-baseline gap-3">
                    {/* Sender */}
                    <span className={`text-sm text-[var(--foreground)] truncate max-w-[200px] inline-flex items-center gap-1 ${!email.is_read ? "font-semibold" : "font-medium"}`}>
                      {(email.provider === "outlook" || email.provider === "gmail") && (
                        <span className="flex-shrink-0 text-[var(--muted-foreground)]" title={email.provider === "gmail" ? "Gmail" : "Outlook"}>
                          <ProviderIcon provider={email.provider} size={12} />
                        </span>
                      )}
                      {email.sender}
                    </span>

                    {/* Subject */}
                    <span className={`text-sm text-[var(--foreground)] truncate flex-1 ${!email.is_read ? "font-semibold" : ""}`}>
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

                  {/* Preview + account indicator (desktop) */}
                  <div className="hidden md:flex items-center gap-2 mt-1">
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
                    className="hidden md:block flex-shrink-0 px-2.5 py-1 text-xs font-medium rounded-md bg-red-500/10 text-red-600 hover:bg-red-500/20 border border-red-500/20 transition-colors"
                    title="Unsubscribe from this sender"
                    data-testid="unsubscribe-button"
                  >
                    Unsubscribe
                  </button>
                )}

                {/* Actions — hidden on mobile (accessible from detail page) */}
                <div className="hidden md:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-6 top-3 bg-[var(--background)] group-hover:bg-[var(--accent)] rounded-md pl-1">
                  {/* Done / Undo done */}
                  <button
                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleMarkDone(email.id, !!email.is_done); }}
                    className={`p-1.5 rounded-md transition-colors ${email.is_done ? "text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10" : "text-[var(--muted-foreground)] hover:text-emerald-600 hover:bg-emerald-500/10"}`}
                    title={email.is_done ? "Move to inbox" : "Done"}
                    data-testid="toggle-done-button"
                  >
                    {email.is_done ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
                        <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                    )}
                  </button>
                  {/* Read/Unread toggle */}
                  <button
                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleToggleRead(email.id, !!email.is_read); }}
                    className="p-1.5 rounded-md text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors"
                    title={email.is_read ? "Mark as unread" : "Mark as read"}
                    data-testid="toggle-read-button"
                  >
                    {email.is_read ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="20" height="16" x="2" y="4" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                        <path d="m16 19 2 2 4-4" />
                      </svg>
                    )}
                  </button>
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
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setSendToPageEmails([email]);
                      setShowSendToPage(true);
                    }}
                    className="p-1.5 rounded-md text-[var(--muted-foreground)] hover:text-emerald-600 hover:bg-emerald-500/10 transition-colors"
                    title="Send to Page"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m22 2-7 20-4-9-9-4Z" />
                      <path d="M22 2 11 13" />
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
                  className="mx-3 md:mx-6 mb-2 rounded-md border-l-2 border-dashed"
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
          </>
        )}
        </div>

        {/* Resize handle */}
        {focusedEmailId != null && (
          <div
            className="hidden md:flex items-stretch flex-shrink-0 cursor-col-resize group"
            onMouseDown={handleResizeStart}
          >
            <div className="w-1 hover:w-1.5 bg-[var(--border)] group-hover:bg-[var(--primary)]/40 group-active:bg-[var(--primary)] transition-colors" />
          </div>
        )}

        {/* Transparent overlay during resize — prevents iframe from stealing mouse events */}
        {isResizing && (
          <div className="fixed inset-0 z-50 cursor-col-resize" />
        )}

        {/* Right column: preview pane (desktop only) */}
        {focusedEmailId != null && (
          <div className="hidden md:flex flex-col flex-1 overflow-hidden bg-[var(--background)]">
            {previewLoading ? (
              <div className="flex-1 p-6 space-y-4 animate-pulse">
                <div className="h-6 bg-[var(--secondary)] rounded w-3/4" />
                <div className="h-4 bg-[var(--secondary)] rounded w-1/2" />
                <div className="h-4 bg-[var(--secondary)] rounded w-1/3" />
                <div className="h-px bg-[var(--border)] my-4" />
                <div className="space-y-2">
                  <div className="h-4 bg-[var(--secondary)] rounded w-full" />
                  <div className="h-4 bg-[var(--secondary)] rounded w-5/6" />
                  <div className="h-4 bg-[var(--secondary)] rounded w-4/6" />
                </div>
              </div>
            ) : previewEmail ? (
              <div className="flex-1 overflow-auto">
                <div className="px-5 py-4 border-b border-[var(--border)]">
                  {/* Subject + open full link */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h2 className="text-base font-semibold text-[var(--foreground)] leading-snug">
                      {previewEmail.subject || "(No subject)"}
                    </h2>
                    <Link
                      href={`/inbox/${previewEmail.id}`}
                      className="flex-shrink-0 text-xs text-[var(--primary)] hover:underline whitespace-nowrap"
                    >
                      Open full
                    </Link>
                  </div>
                  {/* From / To / Date */}
                  <div className="space-y-1 text-xs text-[var(--muted-foreground)]">
                    <div><span className="inline-block w-10">From</span> <span className="text-[var(--foreground)]">{previewEmail.sender}</span></div>
                    {previewEmail.recipients.length > 0 && (
                      <div><span className="inline-block w-10">To</span> <span className="text-[var(--foreground)]">{previewEmail.recipients.join(", ")}</span></div>
                    )}
                    {previewEmail.cc.length > 0 && (
                      <div><span className="inline-block w-10">CC</span> <span className="text-[var(--foreground)]">{previewEmail.cc.join(", ")}</span></div>
                    )}
                    <div>
                      <span className="inline-block w-10">Date</span>{" "}
                      <span className="text-[var(--foreground)]">
                        {new Date(previewEmail.received_at).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Email body */}
                <div className="p-5">
                  {previewEmail.body_html ? (
                    <PreviewHtmlFrame html={previewEmail.body_html} />
                  ) : previewEmail.body_plain_text ? (
                    <pre className="whitespace-pre-wrap text-sm text-[var(--foreground)] font-sans leading-relaxed">
                      {previewEmail.body_plain_text}
                    </pre>
                  ) : (
                    <p className="text-[var(--muted-foreground)] italic text-sm">No message body</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-sm text-[var(--muted-foreground)]">
                Email not found
              </div>
            )}
          </div>
        )}
      </main>

      {/* Pagination (hidden during semantic search) */}
      {totalPages > 1 && !initialLoading && !isSemanticSearch && (
        <footer className="border-t border-[var(--border)] px-3 md:px-6 py-3 flex items-center justify-between bg-[var(--background)]">
          <span className="text-xs md:text-sm text-[var(--muted-foreground)]">
            {page}/{totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-2 md:px-3 py-1.5 text-xs md:text-sm font-medium rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Prev
            </button>
            <span className="hidden md:contents">
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
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-2 md:px-3 py-1.5 text-xs md:text-sm font-medium rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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

      {/* Send to Page Modal */}
      <SendToPageModal
        open={showSendToPage}
        onClose={() => {
          setShowSendToPage(false);
          setSendToPageEmails([]);
        }}
        emails={sendToPageEmails}
        onSent={(title) => {
          toast({
            title: "Sent to page",
            description: `Content sent to "${title}"`,
            variant: "success",
          });
          setBulkSelected(new Set());
        }}
      />

      {/* Mobile filter drawer */}
      <div className="md:hidden">
        <InboxFilterDrawer
          open={showMobileFilters}
          onClose={() => setShowMobileFilters(false)}
          accounts={accounts}
          filterAccount={filterAccount}
          setFilterAccount={setFilterAccount}
          setFilterProvider={setFilterProvider}
          allLabels={allLabels}
          filterLabel={filterLabel}
          setFilterLabel={setFilterLabel}
          allSmartLabels={allSmartLabels}
          filterSmartLabel={filterSmartLabel}
          setFilterSmartLabel={setFilterSmartLabel}
          allSmartRulePages={allSmartRulePages}
          filterSmartRulePage={filterSmartRulePage}
          setFilterSmartRulePage={setFilterSmartRulePage}
          afterDate={afterDate}
          setAfterDate={setAfterDate}
          beforeDate={beforeDate}
          setBeforeDate={setBeforeDate}
          hasActiveFilters={!!hasActiveFilters}
          clearFilters={clearFilters}
          hasFetchedOnce={hasFetchedOnce}
          setPage={setPage}
        />
      </div>
    </div>
  );
}
