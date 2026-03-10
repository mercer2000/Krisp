"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useUpdatePage } from "@/lib/hooks/usePages";
import { useQueryClient } from "@tanstack/react-query";
import type { Page } from "@/types";

interface EmailAccount {
  id: string;
  email: string;
  provider: "outlook" | "gmail" | "zoom";
}

export function SmartRulesTab({ page }: { page: Page }) {
  const [smartRule, setSmartRule] = useState(page.smartRule || "");
  const [smartActive, setSmartActive] = useState(page.smartActive);
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(page.smartRuleAccountId || "");
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [saved, setSaved] = useState(false);
  const updatePage = useUpdatePage(page.id);
  const qc = useQueryClient();
  const savedTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setSmartRule(page.smartRule || "");
    setSmartActive(page.smartActive);
    setSelectedAccountId(page.smartRuleAccountId || "");
  }, [page.smartRule, page.smartActive, page.smartRuleAccountId]);

  // Fetch email accounts on mount
  useEffect(() => {
    setLoadingAccounts(true);
    fetch("/api/emails/accounts")
      .then((r) => r.json())
      .then((data) => {
        const outlookAccounts = (data.accounts || []).filter(
          (a: EmailAccount) => a.provider === "outlook"
        );
        setAccounts(outlookAccounts);
        if (!selectedAccountId && outlookAccounts.length > 0) {
          setSelectedAccountId(outlookAccounts[0].id);
        }
      })
      .catch(() => setAccounts([]))
      .finally(() => setLoadingAccounts(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = useCallback(() => {
    updatePage.mutate(
      { smart_rule: smartRule || null, smart_active: smartActive },
      {
        onSuccess: () => {
          setSaved(true);
          if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
          savedTimerRef.current = setTimeout(() => setSaved(false), 2000);
        },
      },
    );
  }, [updatePage, smartRule, smartActive]);

  const handleSyncFolder = async () => {
    if (!selectedAccountId) return;
    setSyncing(true);
    try {
      const res = await fetch(`/api/pages/${page.id}/sync-folder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: selectedAccountId }),
      });
      if (res.ok) {
        qc.invalidateQueries({ queryKey: ["page", page.id] });
      }
    } finally {
      setSyncing(false);
    }
  };

  const handleUnlinkFolder = async () => {
    setUnlinking(true);
    try {
      const res = await fetch(`/api/pages/${page.id}/sync-folder`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSelectedAccountId("");
        qc.invalidateQueries({ queryKey: ["page", page.id] });
      }
    } finally {
      setUnlinking(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Smart Rules</h2>
        <p className="text-xs text-[var(--muted-foreground)]">
          Configure AI-powered rules that automatically collect and classify content for this page.
        </p>
      </div>

      {/* Smart Rule Config */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
        <div className="mb-4 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--primary)]">
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
          </svg>
          <h3 className="text-sm font-semibold text-[var(--foreground)]">
            Smart Rule
          </h3>
          {page.smartRule && (
            <span
              className={`ml-auto rounded-full px-2 py-0.5 text-xs font-medium ${
                page.smartActive
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-gray-100 text-gray-500 dark:bg-gray-800/50 dark:text-gray-400"
              }`}
            >
              {page.smartActive ? "Active" : "Inactive"}
            </span>
          )}
        </div>

        <p className="mb-3 text-xs text-[var(--muted-foreground)]">
          Define a natural-language rule. The AI will automatically add matching content (emails, knowledge, decisions) to this page.
        </p>

        <textarea
          value={smartRule}
          onChange={(e) => setSmartRule(e.target.value)}
          placeholder="e.g., Technical architecture discussions and system design decisions about our payment infrastructure"
          rows={3}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none"
        />

        <div className="mt-3 flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-[var(--foreground)]">
            <input
              type="checkbox"
              checked={smartActive}
              onChange={(e) => setSmartActive(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--border)] accent-[var(--primary)]"
            />
            Auto-classify new content
          </label>
          <div className="flex items-center gap-2">
            {saved && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400">Saved!</span>
            )}
            <button
              onClick={handleSave}
              disabled={updatePage.isPending}
              className="rounded-lg bg-[var(--primary)] px-4 py-1.5 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
            >
              {updatePage.isPending ? "Saving..." : "Save Rule"}
            </button>
          </div>
        </div>
      </div>

      {/* Outlook Folder Sync */}
      <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
        <div className="mb-3 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-500">
            <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
          </svg>
          <h3 className="text-sm font-semibold text-[var(--foreground)]">
            Outlook Folder Sync
          </h3>
        </div>

        {page.smartRuleFolderId ? (
          <div className="flex items-center gap-2 rounded-md bg-sky-500/10 px-3 py-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-500 shrink-0">
              <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--foreground)] truncate">
                {page.smartRuleFolderName || "Linked Folder"}
              </p>
              <p className="text-[11px] text-[var(--muted-foreground)]">
                Matching emails are moved to this Outlook folder
              </p>
            </div>
            <button
              onClick={handleUnlinkFolder}
              disabled={unlinking}
              className="shrink-0 rounded px-2 py-1 text-xs text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--destructive)] transition-colors disabled:opacity-50"
            >
              {unlinking ? "..." : "Unlink"}
            </button>
          </div>
        ) : (
          <div>
            <p className="mb-2 text-xs text-[var(--muted-foreground)]">
              Create a matching Outlook folder and automatically move classified emails into it.
            </p>
            {loadingAccounts ? (
              <div className="h-8 animate-pulse rounded-lg bg-[var(--accent)]" />
            ) : accounts.length === 0 ? (
              <p className="text-xs text-[var(--muted-foreground)] italic">
                No Outlook accounts connected. Connect one in Settings to enable folder sync.
              </p>
            ) : (
              <div className="flex items-center gap-2">
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--card)] px-2 py-1.5 text-xs text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.email}</option>
                  ))}
                </select>
                <button
                  onClick={handleSyncFolder}
                  disabled={syncing || !selectedAccountId}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-sky-600 disabled:opacity-50"
                >
                  {syncing ? "Creating..." : "Link Folder"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
