"use client";

import { useState, useEffect, useCallback } from "react";
import { IntegrationDetailLayout } from "../IntegrationDetailLayout";
import { getIntegration } from "../integrations";

export function TelegramIntegration({ tenantId: _tenantId }: { tenantId: string }) {
  const integration = getIntegration("telegram")!;

  const [status, setStatus] = useState<{
    connected: boolean;
    botUsername?: string;
    chatId?: string;
    active?: boolean;
    webhook?: {
      url?: string;
      pendingUpdates?: number;
      lastError?: string;
      lastErrorDate?: string;
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [botToken, setBotToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/telegram");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setStatus(data);
    } catch {
      setError("Failed to load Telegram status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleConnect = async () => {
    if (!botToken.trim()) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botToken: botToken.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to connect bot");
        return;
      }
      setBotToken("");
      setSuccess(`Connected to @${data.botUsername}`);
      setTimeout(() => setSuccess(null), 4000);
      await fetchStatus();
    } catch {
      setError("Failed to connect Telegram bot");
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/telegram", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setSuccess("Telegram bot disconnected");
      setTimeout(() => setSuccess(null), 4000);
      await fetchStatus();
    } catch {
      setError("Failed to disconnect Telegram bot");
    } finally {
      setDisconnecting(false);
    }
  };

  const isConnected = status?.connected === true;

  const connectionSection = (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-[var(--muted-foreground)]">
          Connect a Telegram bot to chat with your Brain AI from anywhere. The
          bot has access to the same meetings, emails, decisions, and action items
          as the web-based Brain Chat. Messages sent via Telegram are processed
          through the same AI and stored in your Brain conversation history.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-600">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-green-600">
          {success}
        </div>
      )}

      {loading ? (
        <div className="py-8 text-center text-sm text-[var(--muted-foreground)]">
          Loading...
        </div>
      ) : status?.connected ? (
        /* Connected state */
        <div className="space-y-6">
          <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--foreground)]">
                  Connected to{" "}
                  <span className="font-semibold text-[#0088CC]">
                    @{status.botUsername}
                  </span>
                </p>
                {status.chatId ? (
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                    Chat linked (ID: {status.chatId})
                  </p>
                ) : (
                  <p className="text-xs text-amber-600 mt-0.5">
                    Send /start to your bot on Telegram to link the chat
                  </p>
                )}
              </div>
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="px-3 py-1.5 text-xs font-medium rounded-md border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
              >
                {disconnecting ? "Disconnecting..." : "Disconnect"}
              </button>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-[var(--secondary)] border border-[var(--border)]">
            <h4 className="text-sm font-medium text-[var(--foreground)] mb-2">
              How to use
            </h4>
            <ol className="text-sm text-[var(--muted-foreground)] space-y-1.5 list-decimal list-inside">
              <li>
                Open Telegram and search for{" "}
                <span className="font-medium text-[var(--foreground)]">
                  @{status.botUsername}
                </span>
              </li>
              <li>Send <code className="px-1 py-0.5 rounded bg-[var(--accent)] text-xs">/start</code> to begin</li>
              <li>Type any question to query your Second Brain</li>
            </ol>
          </div>

          {/* Webhook Debug Info */}
          {status.webhook && (
            <div className="p-4 rounded-lg bg-[var(--secondary)] border border-[var(--border)]">
              <h4 className="text-sm font-medium text-[var(--foreground)] mb-2">
                Webhook Status
              </h4>
              <div className="text-xs text-[var(--muted-foreground)] space-y-1 font-mono">
                <p>URL: {status.webhook.url || "(not set)"}</p>
                <p>Pending updates: {status.webhook.pendingUpdates ?? 0}</p>
                {status.webhook.lastError && (
                  <p className="text-red-500">
                    Last error: {status.webhook.lastError}
                    {status.webhook.lastErrorDate && (
                      <> ({new Date(status.webhook.lastErrorDate).toLocaleString()})</>
                    )}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Disconnected state - setup form */
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">
              Connect Your Bot
            </h3>
            <p className="text-sm text-[var(--muted-foreground)] mb-4">
              Enter your Telegram bot token to connect. The webhook will be
              automatically registered.
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none"
              />
              <button
                onClick={handleConnect}
                disabled={!botToken.trim() || saving}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-[var(--primary)] text-white hover:opacity-90 transition-colors disabled:opacity-50"
              >
                {saving ? "Connecting..." : "Connect"}
              </button>
            </div>
          </div>

          {/* Setup guide */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">
              Setup Guide
            </h3>
            <ol className="space-y-5">
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-sm font-semibold">
                  1
                </span>
                <div className="flex-1">
                  <p className="font-medium text-[var(--foreground)]">Create a Telegram Bot</p>
                  <p className="text-sm text-[var(--muted-foreground)] mt-1">
                    Open Telegram and message{" "}
                    <span className="font-medium text-[#0088CC]">@BotFather</span>.
                    Send <code className="px-1 py-0.5 rounded bg-[var(--secondary)] text-xs">/newbot</code>{" "}
                    and follow the prompts to create a new bot.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-sm font-semibold">
                  2
                </span>
                <div className="flex-1">
                  <p className="font-medium text-[var(--foreground)]">Copy the Bot Token</p>
                  <p className="text-sm text-[var(--muted-foreground)] mt-1">
                    BotFather will give you a token that looks like{" "}
                    <code className="px-1 py-0.5 rounded bg-[var(--secondary)] text-xs">
                      123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
                    </code>
                    . Copy this token.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-sm font-semibold">
                  3
                </span>
                <div className="flex-1">
                  <p className="font-medium text-[var(--foreground)]">Paste Token Above</p>
                  <p className="text-sm text-[var(--muted-foreground)] mt-1">
                    Paste the bot token into the field above and click{" "}
                    <span className="font-medium text-[var(--foreground)]">Connect</span>.
                    The webhook will be registered automatically.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-sm font-semibold">
                  4
                </span>
                <div className="flex-1">
                  <p className="font-medium text-[var(--foreground)]">Start Chatting</p>
                  <p className="text-sm text-[var(--muted-foreground)] mt-1">
                    Open your bot in Telegram and send{" "}
                    <code className="px-1 py-0.5 rounded bg-[var(--secondary)] text-xs">/start</code>
                    . Then start asking questions about your meetings, emails,
                    and action items.
                  </p>
                </div>
              </li>
            </ol>
          </div>
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
