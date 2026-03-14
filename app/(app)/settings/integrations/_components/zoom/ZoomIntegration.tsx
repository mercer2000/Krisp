"use client";

import { useState, useEffect, useCallback } from "react";
import { IntegrationDetailLayout } from "../IntegrationDetailLayout";
import { getIntegration } from "../integrations";
import { CopyButton } from "../shared";

interface ZoomAccountInfo {
  id: string;
  zoomEmail: string;
  zoomUserId: string | null;
  tokenExpiry: string;
  isExpired: boolean;
  lastSyncAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function ZoomIntegration({ tenantId: _tenantId }: { tenantId: string }) {
  const integration = getIntegration("zoom")!;

  const origin = typeof window !== "undefined" ? window.location.origin : "https://your-domain.com";
  const zoomWebhookUrl = `${origin}/api/webhooks/zoom`;

  const [status, setStatus] = useState<{
    connected: boolean;
    accounts: ZoomAccountInfo[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncingAccounts, setSyncingAccounts] = useState<Set<string>>(new Set());
  const [disconnectingAccounts, setDisconnectingAccounts] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [syncResults, setSyncResults] = useState<Record<string, {
    total: number;
    inserted: number;
    skipped: number;
  }>>({});

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/zoom/oauth");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setStatus(data);
    } catch {
      setError("Failed to load Zoom connection status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected") === "true") {
      setSuccess("Zoom account connected successfully!");
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
    window.location.href = "/api/zoom/oauth?action=connect";
  };

  const handleDisconnect = async (accountId: string) => {
    setDisconnectingAccounts((prev) => new Set(prev).add(accountId));
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/zoom/oauth?accountId=${accountId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to disconnect");
      setSuccess("Zoom account disconnected");
      setTimeout(() => setSuccess(null), 5000);
      await fetchStatus();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to disconnect Zoom"
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
      const res = await fetch("/api/zoom/sync", {
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
      setSuccess(`Sync complete: ${data.inserted} new messages imported`);
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

  const accounts = status?.accounts || [];
  const isConnected = accounts.length > 0;

  const connectionSection = (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-[var(--muted-foreground)]">
          The Zoom Chat integration captures all direct messages and channel messages
          in real-time via a Zoom Marketplace OAuth app. Messages are persisted with
          full multi-tenant isolation and support for message edits and deletions.
        </p>
      </div>

      {/* Account Manager */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">
          Connected Accounts
        </h3>
        <p className="text-sm text-[var(--muted-foreground)] mb-3">
          Connect one or more Zoom accounts to sync Team Chat messages via API polling.
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
                    <div className={`w-2.5 h-2.5 rounded-full ${account.isExpired ? "bg-amber-500" : "bg-green-500"}`} />
                    <span className="text-sm font-medium text-[var(--foreground)]">{account.zoomEmail}</span>
                    {account.isExpired && (
                      <span className="text-xs text-amber-500">(token expired, will auto-refresh)</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                    <div>
                      <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Connected Since</span>
                      <p className="text-[var(--foreground)] mt-0.5">{new Date(account.createdAt).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Last Sync</span>
                      <p className="text-[var(--foreground)] mt-0.5">{account.lastSyncAt ? new Date(account.lastSyncAt).toLocaleString() : "Never"}</p>
                    </div>
                  </div>

                  {syncResults[account.id] && (
                    <div className="mb-3 p-2 rounded bg-blue-500/10 border border-blue-500/20 text-xs text-[var(--foreground)]">
                      Fetched {syncResults[account.id].total} messages: {syncResults[account.id].inserted} new, {syncResults[account.id].skipped} already existed.
                    </div>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => handleSync(account.id)}
                      disabled={syncingAccounts.has(account.id)}
                      className="px-3 py-1.5 text-xs font-medium rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {syncingAccounts.has(account.id) ? "Syncing..." : "Sync Now"}
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
                  <span className="text-sm font-medium text-[var(--muted-foreground)]">No Accounts Connected</span>
                </div>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Connect your Zoom account to start syncing chat messages.
                  You will be redirected to Zoom to authorize the app.
                </p>
              </div>
            )}

            <button
              onClick={handleConnect}
              className="px-4 py-2 text-sm font-medium rounded-md bg-[#2D8CFF] text-white hover:bg-[#2681eb] transition-colors"
            >
              Connect Zoom Account
            </button>
          </div>
        )}
      </div>

      {/* Webhook Endpoint */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">
          Webhook Endpoint
        </h3>
        <p className="text-sm text-[var(--muted-foreground)] mb-3">
          This is the shared webhook endpoint for Zoom events. Zoom identifies the
          tenant via the account_id in the webhook payload (matched to the OAuth connection).
        </p>
        <div className="flex items-center p-3 rounded-lg bg-[var(--secondary)] border border-[var(--border)]">
          <code className="flex-1 text-sm text-[var(--foreground)] break-all">
            {zoomWebhookUrl}
          </code>
          <CopyButton text={zoomWebhookUrl} />
        </div>
      </div>
    </div>
  );

  const settingsSection = (
    <div className="space-y-3">
      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-[var(--foreground)]">
        <span className="font-medium">Token Refresh:</span> Zoom access tokens expire
        after 1 hour. The system automatically refreshes tokens using the stored refresh
        token when needed.
      </div>
      <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-[var(--foreground)]">
        <span className="font-medium">Multi-tenant Isolation:</span> Zoom identifies
        your account via the <code className="px-1 py-0.5 rounded bg-[var(--secondary)] text-xs">account_id</code> in
        webhook payloads. Each webhook event is routed to the correct tenant automatically.
      </div>
      <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-[var(--foreground)]">
        <span className="font-medium">Message Types:</span> Both direct messages (DMs)
        and channel messages are captured and tagged with their type for easy filtering.
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
