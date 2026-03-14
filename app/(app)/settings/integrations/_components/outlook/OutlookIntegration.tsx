"use client";

import { useState, useEffect, useCallback } from "react";
import { IntegrationDetailLayout } from "../IntegrationDetailLayout";
import { getIntegration } from "../integrations";

interface OutlookAccountInfo {
  id: string;
  outlookEmail: string;
  tokenExpiry: string;
  isExpired: boolean;
  lastSyncAt: string | null;
  emailActionBoardId: string | null;
  createdAt: string;
  updatedAt: string;
}

export function OutlookIntegration({ tenantId: _tenantId }: { tenantId: string }) {
  const integration = getIntegration("outlook")!;

  const [status, setStatus] = useState<{
    connected: boolean;
    accounts: OutlookAccountInfo[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncingAccounts, setSyncingAccounts] = useState<Set<string>>(new Set());
  const [calendarSyncingAccounts, setCalendarSyncingAccounts] = useState<Set<string>>(new Set());
  const [disconnectingAccounts, setDisconnectingAccounts] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [syncResults, setSyncResults] = useState<Record<string, {
    total: number;
    inserted: number;
    skipped: number;
  }>>({});
  const [calendarSyncResults, setCalendarSyncResults] = useState<Record<string, {
    synced: number;
    errors: number;
  }>>({});
  const [boards, setBoards] = useState<{ id: string; title: string }[]>([]);
  const [savingBoard, setSavingBoard] = useState<Record<string, boolean>>({});

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [res, boardsRes] = await Promise.all([
        fetch("/api/outlook/oauth"),
        fetch("/api/v1/boards"),
      ]);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setStatus(data);
      if (boardsRes.ok) {
        const boardsData = await boardsRes.json();
        setBoards(boardsData.map((b: { id: string; title: string }) => ({ id: b.id, title: b.title })));
      }
    } catch {
      setError("Failed to load Outlook connection status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Check for OAuth callback result in URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected") === "true") {
      setSuccess("Outlook account connected successfully!");
      setTimeout(() => setSuccess(null), 5000);
      fetchStatus();
      const url = new URL(window.location.href);
      url.searchParams.delete("connected");
      window.history.replaceState({}, "", url.toString());
    }
    if (params.get("error")) {
      setError(`Connection failed: ${params.get("error")}`);
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url.toString());
    }
  }, [fetchStatus]);

  const handleConnect = () => {
    window.location.href = "/api/outlook/oauth?action=connect";
  };

  const handleDisconnect = async (accountId: string) => {
    setDisconnectingAccounts((prev) => new Set(prev).add(accountId));
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/outlook/oauth?accountId=${accountId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to disconnect");
      setSuccess("Outlook account disconnected");
      setTimeout(() => setSuccess(null), 5000);
      await fetchStatus();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to disconnect Outlook"
      );
    } finally {
      setDisconnectingAccounts((prev) => {
        const next = new Set(prev);
        next.delete(accountId);
        return next;
      });
    }
  };

  const handleSync = async (accountId: string) => {
    setSyncingAccounts((prev) => new Set(prev).add(accountId));
    setError(null);
    setSyncResults((prev) => {
      const next = { ...prev };
      delete next[accountId];
      return next;
    });
    try {
      const res = await fetch("/api/outlook/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync failed");
      setSyncResults((prev) => ({
        ...prev,
        [accountId]: { total: data.total, inserted: data.inserted, skipped: data.skipped },
      }));
      setSuccess(`Sync complete: ${data.inserted} new emails imported`);
      setTimeout(() => setSuccess(null), 5000);
      await fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncingAccounts((prev) => {
        const next = new Set(prev);
        next.delete(accountId);
        return next;
      });
    }
  };

  const handleCalendarSync = async (accountId: string) => {
    setCalendarSyncingAccounts((prev) => new Set(prev).add(accountId));
    setError(null);
    setCalendarSyncResults((prev) => {
      const next = { ...prev };
      delete next[accountId];
      return next;
    });
    try {
      const res = await fetch("/api/outlook/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId, daysBack: 7, daysForward: 30 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Calendar sync failed");
      setCalendarSyncResults((prev) => ({
        ...prev,
        [accountId]: { synced: data.synced, errors: data.errors },
      }));
      setSuccess(`Calendar sync complete: ${data.synced} events synced`);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Calendar sync failed");
    } finally {
      setCalendarSyncingAccounts((prev) => {
        const next = new Set(prev);
        next.delete(accountId);
        return next;
      });
    }
  };

  const handleBoardChange = async (accountId: string, boardId: string | null) => {
    setSavingBoard((prev) => ({ ...prev, [accountId]: true }));
    try {
      const res = await fetch(`/api/outlook/accounts/${accountId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailActionBoardId: boardId }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setStatus((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          accounts: prev.accounts.map((a) =>
            a.id === accountId ? { ...a, emailActionBoardId: boardId } : a
          ),
        };
      });
      setSuccess("Auto-ticket board updated");
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Failed to update board setting");
    } finally {
      setSavingBoard((prev) => ({ ...prev, [accountId]: false }));
    }
  };

  const accounts = status?.accounts || [];
  const isConnected = accounts.length > 0;

  const connectionSection = (
    <div>
      <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">
        Connected Accounts
      </h3>
      <p className="text-sm text-[var(--muted-foreground)] mb-3">
        Connect one or more Microsoft accounts (Outlook.com, Hotmail, Live, Office 365) to
        sync emails and calendar events using delegated OAuth permissions.
      </p>

      {error && (
        <div className="mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-600">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-green-600">
          {success}
        </div>
      )}

      {loading ? (
        <div className="p-4 rounded-lg bg-[var(--secondary)] border border-[var(--border)] text-sm text-[var(--muted-foreground)]">
          Loading...
        </div>
      ) : (
        <div className="space-y-4">
          {accounts.length > 0 ? (
            accounts.map((account) => (
              <div
                key={account.id}
                className="p-4 rounded-lg border border-[var(--border)] bg-[var(--secondary)]"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      account.isExpired ? "bg-amber-500" : "bg-green-500"
                    }`}
                  />
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    {account.outlookEmail}
                  </span>
                  {account.isExpired && (
                    <span className="text-xs text-amber-500">(token expired, will auto-refresh)</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                  <div>
                    <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                      Connected Since
                    </span>
                    <p className="text-[var(--foreground)] mt-0.5">
                      {new Date(account.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                      Last Sync
                    </span>
                    <p className="text-[var(--foreground)] mt-0.5">
                      {account.lastSyncAt
                        ? new Date(account.lastSyncAt).toLocaleString()
                        : "Never"}
                    </p>
                  </div>
                </div>

                {syncResults[account.id] && (
                  <div className="mb-3 p-2 rounded bg-blue-500/10 border border-blue-500/20 text-xs text-[var(--foreground)]">
                    Fetched {syncResults[account.id].total} messages: {syncResults[account.id].inserted} new, {syncResults[account.id].skipped} already existed.
                  </div>
                )}

                {calendarSyncResults[account.id] && (
                  <div className="mb-3 p-2 rounded bg-blue-500/10 border border-blue-500/20 text-xs text-[var(--foreground)]">
                    Calendar: {calendarSyncResults[account.id].synced} events synced.
                    {calendarSyncResults[account.id].errors > 0 && ` (${calendarSyncResults[account.id].errors} errors)`}
                  </div>
                )}

                {/* Per-account Kanban board selector */}
                <div className="mb-3">
                  <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                    Auto-Create Kanban Tickets
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <select
                      value={account.emailActionBoardId ?? ""}
                      onChange={(e) => handleBoardChange(account.id, e.target.value || null)}
                      disabled={savingBoard[account.id]}
                      className="flex-1 px-2 py-1.5 text-xs rounded-md border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] disabled:opacity-50"
                    >
                      <option value="">-- Disabled --</option>
                      {boards.map((board) => (
                        <option key={board.id} value={board.id}>
                          {board.title}
                        </option>
                      ))}
                    </select>
                    {savingBoard[account.id] && (
                      <span className="text-xs text-[var(--muted-foreground)]">Saving...</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => handleSync(account.id)}
                    disabled={syncingAccounts.has(account.id)}
                    className="px-3 py-1.5 text-xs font-medium rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {syncingAccounts.has(account.id) ? "Syncing..." : "Sync Emails"}
                  </button>
                  <button
                    onClick={() => handleCalendarSync(account.id)}
                    disabled={calendarSyncingAccounts.has(account.id)}
                    className="px-3 py-1.5 text-xs font-medium rounded-md bg-[#0078D4] text-white hover:bg-[#106ebe] transition-colors disabled:opacity-50"
                  >
                    {calendarSyncingAccounts.has(account.id) ? "Syncing..." : "Sync Calendar"}
                  </button>
                  <button
                    onClick={() => handleDisconnect(account.id)}
                    disabled={disconnectingAccounts.has(account.id)}
                    className="px-3 py-1.5 text-xs font-medium rounded-md border border-red-500/30 text-red-600 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                  >
                    {disconnectingAccounts.has(account.id) ? "Disconnecting..." : "Disconnect"}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--secondary)]">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                <span className="text-sm font-medium text-[var(--muted-foreground)]">
                  No Accounts Connected
                </span>
              </div>
              <p className="text-sm text-[var(--muted-foreground)]">
                Connect your Outlook account to start importing emails and
                syncing calendar events. You will be redirected to Microsoft to
                authorize the app.
              </p>
            </div>
          )}

          <button
            onClick={handleConnect}
            className="px-4 py-2 text-sm font-medium rounded-md bg-[#0078D4] text-white hover:bg-[#106ebe] transition-colors"
          >
            {accounts.length > 0 ? "Add Another Account" : "Connect Outlook Account"}
          </button>
        </div>
      )}
    </div>
  );

  const settingsSection = (
    <div className="space-y-6">
      {/* How It Works */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">
          How It Works
        </h3>
        <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--secondary)]">
                <th className="px-4 py-3 text-left font-medium text-[var(--foreground)]">
                  Step
                </th>
                <th className="px-4 py-3 text-left font-medium text-[var(--foreground)]">
                  What Happens
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              <tr>
                <td className="px-4 py-3 font-medium text-[var(--foreground)]">
                  Connect
                </td>
                <td className="px-4 py-3 text-[var(--muted-foreground)]">
                  You sign in with your Microsoft account and consent to share your mailbox.
                  Tokens are stored securely.
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-[var(--foreground)]">
                  Email Sync
                </td>
                <td className="px-4 py-3 text-[var(--muted-foreground)]">
                  Click &quot;Sync Emails Now&quot; to pull recent inbox messages. The system
                  deduplicates and only imports new emails.
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-[var(--foreground)]">
                  Calendar Sync
                </td>
                <td className="px-4 py-3 text-[var(--muted-foreground)]">
                  Click &quot;Sync Calendar Now&quot; to pull calendar events from the past
                  7 days to 30 days ahead. Events are deduplicated and updated on each sync.
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-[var(--foreground)]">
                  Auto-refresh
                </td>
                <td className="px-4 py-3 text-[var(--muted-foreground)]">
                  Access tokens expire after ~1 hour. The system automatically refreshes
                  using your stored refresh token.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Important Notes */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">
          Important Notes
        </h3>
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-[var(--foreground)]">
            <span className="font-medium">Push + pull sync:</span> New emails are
            delivered automatically via Microsoft Graph push notifications. A background
            sync also runs hourly as a safety net. You can still use the &quot;Sync Emails
            Now&quot; button for an immediate pull.
          </div>
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-[var(--foreground)]">
            <span className="font-medium">Calendar scope:</span> Calendar sync
            uses the <code className="px-1 py-0.5 rounded bg-[var(--secondary)] text-xs">Calendars.Read</code> permission.
            If you connected before this feature was added, disconnect and reconnect to
            grant the new permission.
          </div>
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-[var(--foreground)]">
            <span className="font-medium">Rate limits:</span> Personal Microsoft accounts
            have more restrictive rate limits than Microsoft 365 accounts. The sync fetches
            up to 50 messages per request.
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <IntegrationDetailLayout
      integration={integration}
      connected={isConnected}
      connectionSection={connectionSection}
      settingsSection={settingsSection}
    />
  );
}
