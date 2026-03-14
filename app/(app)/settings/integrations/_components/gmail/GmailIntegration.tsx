"use client";

import { useState, useEffect, useCallback } from "react";
import { IntegrationDetailLayout } from "../IntegrationDetailLayout";
import { getIntegration } from "../integrations";

interface WatchStatus {
  active: boolean;
  watch: {
    emailAddress: string;
    historyId: string | null;
    expiration: string | null;
    topicName: string;
    createdAt: string;
    updatedAt: string;
  } | null;
}

export function GmailIntegration({ tenantId: _tenantId }: { tenantId: string }) {
  const integration = getIntegration("gmail")!;

  const [status, setStatus] = useState<WatchStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/gmail/oauth");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setStatus(data.connected ? {
        active: true,
        watch: {
          emailAddress: data.emailAddress,
          historyId: data.historyId,
          expiration: data.expiration,
          topicName: data.topicName,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        },
      } : { active: false, watch: null });
    } catch {
      setError("Failed to load Gmail connection status");
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
    if (params.get("gmail_connected") === "true") {
      setSuccess("Gmail connected successfully!");
      setTimeout(() => setSuccess(null), 5000);
      fetchStatus();
      const url = new URL(window.location.href);
      url.searchParams.delete("gmail_connected");
      window.history.replaceState({}, "", url.toString());
    }
    if (params.get("gmail_error")) {
      setError(`Gmail connection failed: ${params.get("gmail_error")}`);
      const url = new URL(window.location.href);
      url.searchParams.delete("gmail_error");
      window.history.replaceState({}, "", url.toString());
    }
  }, [fetchStatus]);

  const handleConnect = () => {
    window.location.href = "/api/gmail/oauth?action=connect";
  };

  const handleDisconnect = async () => {
    setActionLoading("disconnect");
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/gmail/oauth", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to disconnect");
      }
      setSuccess("Gmail disconnected");
      setTimeout(() => setSuccess(null), 5000);
      await fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disconnect Gmail");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRenew = async () => {
    setActionLoading("renew");
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/gmail/watch", { method: "PUT" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.details || data.error || "Renewal failed");
      }
      setSuccess("Gmail watch renewed successfully");
      setTimeout(() => setSuccess(null), 5000);
      await fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to renew watch");
    } finally {
      setActionLoading(null);
    }
  };

  const isExpiringSoon = status?.watch?.expiration
    ? new Date(status.watch.expiration).getTime() - Date.now() < 24 * 60 * 60 * 1000
    : false;

  const isExpired = status?.watch?.expiration
    ? new Date(status.watch.expiration).getTime() < Date.now()
    : false;

  const isConnected = status?.active === true;

  const connectionSection = (
    <div>
      <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">
        Connection Status
      </h3>

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
      ) : status?.active && status.watch ? (
        <div className="space-y-4">
          {/* Active watch display */}
          <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--secondary)]">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-2.5 h-2.5 rounded-full ${isExpired ? "bg-red-500" : isExpiringSoon ? "bg-amber-500" : "bg-green-500"}`} />
              <span className="text-sm font-medium text-[var(--foreground)]">
                {isExpired ? "Watch Expired" : isExpiringSoon ? "Watch Expiring Soon" : "Watch Active"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                  Email
                </span>
                <p className="text-[var(--foreground)] mt-0.5">{status.watch.emailAddress}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                  Topic
                </span>
                <p className="text-[var(--foreground)] mt-0.5 break-all">{status.watch.topicName}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                  History ID
                </span>
                <p className="text-[var(--foreground)] mt-0.5 font-mono">{status.watch.historyId ?? "\u2014"}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                  Expires
                </span>
                <p className={`mt-0.5 ${isExpired ? "text-red-600 font-medium" : isExpiringSoon ? "text-amber-600 font-medium" : "text-[var(--foreground)]"}`}>
                  {status.watch.expiration
                    ? new Date(status.watch.expiration).toLocaleString()
                    : "\u2014"}
                </p>
              </div>
            </div>
          </div>

          {(isExpiringSoon || isExpired) && (
            <div className={`p-3 rounded-lg text-sm ${isExpired ? "bg-red-500/10 border border-red-500/20 text-red-600" : "bg-amber-500/10 border border-amber-500/20 text-amber-700"}`}>
              {isExpired
                ? "Your watch subscription has expired. Pub/Sub notifications are no longer being delivered. Renew now to resume email ingestion."
                : "Your watch subscription expires within 24 hours. Renew it to prevent interruption."}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleRenew}
              disabled={actionLoading !== null}
              className="px-4 py-2 text-sm font-medium rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {actionLoading === "renew" ? "Renewing..." : "Renew Watch"}
            </button>
            <button
              onClick={handleDisconnect}
              disabled={actionLoading !== null}
              className="px-4 py-2 text-sm font-medium rounded-md border border-red-500/30 text-red-600 hover:bg-red-500/10 transition-colors disabled:opacity-50"
            >
              {actionLoading === "disconnect" ? "Disconnecting..." : "Disconnect"}
            </button>
          </div>

          <p className="text-sm text-[var(--muted-foreground)]">
            Clicking <span className="font-medium text-[var(--foreground)]">Connect Gmail</span> will
            open Google&apos;s sign-in page where you grant read-only access to your inbox.
            We&apos;ll automatically set up real-time notifications so new emails appear here
            within seconds. The connection renews every 7 days &mdash; you&apos;ll see a reminder
            when it&apos;s time.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--secondary)]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
              <span className="text-sm font-medium text-[var(--muted-foreground)]">
                Not Connected
              </span>
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">
              Connect your Gmail account to automatically monitor your inbox.
              The OAuth flow will grant read-only access and set up real-time
              notifications.
            </p>
          </div>

          <button
            onClick={handleConnect}
            disabled={actionLoading !== null}
            className="px-4 py-2 text-sm font-medium rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Connect Gmail
          </button>

          <p className="text-sm text-[var(--muted-foreground)]">
            Clicking <span className="font-medium text-[var(--foreground)]">Connect Gmail</span> will
            open Google&apos;s sign-in page where you grant read-only access to your inbox.
            We&apos;ll automatically set up real-time notifications so new emails appear here
            within seconds. The connection renews every 7 days &mdash; you&apos;ll see a reminder
            when it&apos;s time.
          </p>
        </div>
      )}
    </div>
  );

  return (
    <IntegrationDetailLayout
      integration={integration}
      connected={isConnected}
      connectionSection={connectionSection}
    />
  );
}
