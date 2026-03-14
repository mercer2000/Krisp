"use client";

import { useState, useEffect, useCallback } from "react";
import { IntegrationDetailLayout } from "../IntegrationDetailLayout";
import { getIntegration } from "../integrations";

interface GoogleAccountInfo {
  id: string;
  googleEmail: string;
  tokenExpiry: string;
  isExpired: boolean;
  lastSyncAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function GoogleCalendarIntegration({ tenantId: _tenantId }: { tenantId: string }) {
  const integration = getIntegration("google-calendar")!;

  const [status, setStatus] = useState<{
    connected: boolean;
    accounts: GoogleAccountInfo[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [calendarSyncingAccounts, setCalendarSyncingAccounts] = useState<Set<string>>(new Set());
  const [disconnectingAccounts, setDisconnectingAccounts] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [calendarSyncResults, setCalendarSyncResults] = useState<Record<string, {
    synced: number;
    errors: number;
  }>>({});

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/google/oauth");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setStatus(data);
    } catch {
      setError("Failed to load Google connection status");
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
    if (params.get("google_connected") === "true") {
      setSuccess("Google account connected successfully!");
      setTimeout(() => setSuccess(null), 5000);
      fetchStatus();
      const url = new URL(window.location.href);
      url.searchParams.delete("google_connected");
      window.history.replaceState({}, "", url.toString());
    }
    if (params.get("google_error")) {
      setError(`Google connection failed: ${params.get("google_error")}`);
      const url = new URL(window.location.href);
      url.searchParams.delete("google_error");
      window.history.replaceState({}, "", url.toString());
    }
  }, [fetchStatus]);

  const handleConnect = () => {
    window.location.href = "/api/google/oauth?action=connect";
  };

  const handleDisconnect = async (accountId: string) => {
    setDisconnectingAccounts((prev) => new Set(prev).add(accountId));
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/google/oauth?accountId=${accountId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to disconnect");
      setSuccess("Google account disconnected");
      setTimeout(() => setSuccess(null), 5000);
      await fetchStatus();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to disconnect Google"
      );
    } finally {
      setDisconnectingAccounts((prev) => {
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
      const res = await fetch("/api/google/calendar", {
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

  const accounts = status?.accounts || [];
  const isConnected = accounts.length > 0;

  const connectionSection = (
    <div>
      <p className="text-sm text-[var(--muted-foreground)] mb-6">
        Connect your Google account to sync calendar events from your primary Google Calendar.
        Events appear in the Calendar widget and can be correlated with Krisp meetings by
        timestamp overlap. Supports multiple connected Google accounts.
      </p>

      <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">
        Connected Accounts
      </h3>
      <p className="text-sm text-[var(--muted-foreground)] mb-3">
        Connect one or more Google accounts to sync calendar events. Only read-only
        calendar access is requested.
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
                    {account.googleEmail}
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

                {calendarSyncResults[account.id] && (
                  <div className="mb-3 p-2 rounded bg-blue-500/10 border border-blue-500/20 text-xs text-[var(--foreground)]">
                    Calendar: {calendarSyncResults[account.id].synced} events synced.
                    {calendarSyncResults[account.id].errors > 0 && ` (${calendarSyncResults[account.id].errors} errors)`}
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => handleCalendarSync(account.id)}
                    disabled={calendarSyncingAccounts.has(account.id)}
                    className="px-3 py-1.5 text-xs font-medium rounded-md bg-[#4285F4] text-white hover:bg-[#3367D6] transition-colors disabled:opacity-50"
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
                Connect your Google account to start syncing calendar events.
                You will be redirected to Google to authorize the app.
              </p>
            </div>
          )}

          <button
            onClick={handleConnect}
            className="px-4 py-2 text-sm font-medium rounded-md bg-[#4285F4] text-white hover:bg-[#3367D6] transition-colors"
          >
            {accounts.length > 0 ? "Add Another Account" : "Connect Google Account"}
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
                <th className="px-4 py-3 text-left font-medium text-[var(--foreground)]">Step</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--foreground)]">What Happens</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              <tr>
                <td className="px-4 py-3 font-medium text-[var(--foreground)]">Connect</td>
                <td className="px-4 py-3 text-[var(--muted-foreground)]">
                  You sign in with your Google account and consent to share your calendar.
                  OAuth tokens are stored securely.
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-[var(--foreground)]">Calendar Sync</td>
                <td className="px-4 py-3 text-[var(--muted-foreground)]">
                  Click &quot;Sync Calendar&quot; to pull events from the past 7 days to 30 days ahead.
                  Events are deduplicated and updated on each sync. Meet links are automatically extracted.
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-[var(--foreground)]">Auto-refresh</td>
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
            <span className="font-medium">Pull-based sync:</span> This integration requires
            manual syncs via the &quot;Sync Calendar&quot; button or the Calendar page Sync button.
          </div>
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-[var(--foreground)]">
            <span className="font-medium">Read-only access:</span> The integration uses the
            <code className="px-1 py-0.5 rounded bg-[var(--secondary)] text-xs mx-1">calendar.readonly</code>
            scope. It can only read your calendar events, never modify them.
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
