"use client";

import { useState, useEffect, useCallback } from "react";
import { IntegrationDetailLayout } from "../IntegrationDetailLayout";
import { getIntegration } from "../integrations";
import { CopyButton, CodeBlock } from "../shared";

interface IngestLog {
  id: string;
  source: string;
  routingTarget: string;
  status: "success" | "failed";
  errorMessage: string | null;
  thoughtId: string | null;
  cardId: string | null;
  createdAt: string;
}

export function ZapierIntegration({ tenantId }: { tenantId: string }) {
  const integration = getIntegration("zapier")!;

  const [secret, setSecret] = useState<string | null>(null);
  const [fullSecret, setFullSecret] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [logs, setLogs] = useState<IngestLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [showPayloadGuide, setShowPayloadGuide] = useState(false);

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://your-domain.com";

  const fetchSecret = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/integrations/zapier/secret");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setSecret(data.secret);
      setWebhookUrl(
        data.webhookUrl ||
          `${origin}/api/integrations/zapier/ingest?user_id=${tenantId}`
      );
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [origin, tenantId]);

  const fetchLogs = useCallback(async () => {
    try {
      setLogsLoading(true);
      const res = await fetch("/api/integrations/zapier/logs?limit=20");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setLogs(data.data ?? []);
    } catch {
      // ignore
    } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSecret();
    fetchLogs();
  }, [fetchSecret, fetchLogs]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/integrations/zapier/secret", {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to generate");
      const data = await res.json();
      setFullSecret(data.secret);
      setSecret(
        data.secret.slice(0, 8) + "..." + data.secret.slice(-4)
      );
      setWebhookUrl(
        data.webhookUrl ||
          `${origin}/api/integrations/zapier/ingest?user_id=${tenantId}`
      );
    } catch {
      // ignore
    } finally {
      setGenerating(false);
    }
  };

  const handleRevoke = async () => {
    try {
      await fetch("/api/integrations/zapier/secret", { method: "DELETE" });
      setSecret(null);
      setFullSecret(null);
    } catch {
      // ignore
    }
  };

  const samplePayload = JSON.stringify(
    {
      message:
        "Team standup: decided to prioritize the mobile app redesign for Q2.",
      source: "Slack",
      author: "Jane Smith",
      timestamp: new Date().toISOString(),
      tags: ["standup", "mobile"],
      routing_target: "both",
      title: "Prioritize mobile app redesign",
      priority: "high",
      idempotency_key: "slack-msg-12345",
    },
    null,
    2
  );

  const isConnected = secret !== null;

  const connectionSection = (
    <div className="space-y-8">
      {/* Webhook URL & Secret */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">
          Webhook URL
        </h3>
        <p className="text-sm text-[var(--muted-foreground)] mb-3">
          Use this URL as the &ldquo;Webhooks by Zapier&rdquo; POST action
          URL.
        </p>
        {loading ? (
          <div className="h-10 bg-[var(--secondary)] rounded animate-pulse" />
        ) : (
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg break-all text-[var(--foreground)]">
              {webhookUrl}
            </code>
            <CopyButton text={webhookUrl} />
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">
          Webhook Secret
        </h3>
        <p className="text-sm text-[var(--muted-foreground)] mb-3">
          Include this token as a{" "}
          <code className="text-xs bg-[var(--secondary)] px-1 py-0.5 rounded">
            Bearer
          </code>{" "}
          token in the Authorization header.
        </p>

        {loading ? (
          <div className="h-10 bg-[var(--secondary)] rounded animate-pulse" />
        ) : secret ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)]">
                {fullSecret || secret}
              </code>
              {fullSecret && <CopyButton text={fullSecret} />}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors disabled:opacity-50"
              >
                {generating ? "Regenerating..." : "Regenerate Secret"}
              </button>
              <button
                onClick={handleRevoke}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
              >
                Revoke
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-[#FF4A00] text-white hover:bg-[#E54400] transition-colors disabled:opacity-50"
          >
            {generating ? "Generating..." : "Generate Webhook Secret"}
          </button>
        )}
      </div>

      {/* Zapier Setup Instructions */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">
          Zapier Setup
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-[var(--muted-foreground)]">
          <li>Create a new Zap in Zapier</li>
          <li>
            Set your trigger (e.g., &ldquo;New Message in Channel&rdquo; for
            Slack)
          </li>
          <li>
            Add &ldquo;Webhooks by Zapier&rdquo; as the action and choose
            &ldquo;POST&rdquo;
          </li>
          <li>Set the URL to your webhook URL above</li>
          <li>
            Under Headers, add:{" "}
            <code className="bg-[var(--secondary)] px-1 py-0.5 rounded text-xs">
              Authorization: Bearer YOUR_SECRET
            </code>
          </li>
          <li>
            Set Payload Type to{" "}
            <code className="bg-[var(--secondary)] px-1 py-0.5 rounded text-xs">
              json
            </code>
          </li>
          <li>Map your Zap fields to the payload schema below</li>
        </ol>
      </div>

      {/* Payload Schema */}
      <div>
        <button
          onClick={() => setShowPayloadGuide(!showPayloadGuide)}
          className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)] mb-3 hover:text-[var(--primary)] transition-colors"
        >
          <span>
            {showPayloadGuide ? "Hide" : "Show"} Payload Schema & Examples
          </span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`transition-transform ${showPayloadGuide ? "rotate-180" : ""}`}
          >
            <path d="M3 4.5L6 7.5L9 4.5" />
          </svg>
        </button>

        {showPayloadGuide && (
          <div className="space-y-6">
            {/* Field mapping table */}
            <div>
              <h4 className="text-sm font-medium text-[var(--foreground)] mb-2">
                Payload Fields
              </h4>
              <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--secondary)]">
                      <th className="px-4 py-2 text-left font-medium text-[var(--foreground)]">Field</th>
                      <th className="px-4 py-2 text-left font-medium text-[var(--foreground)]">Required</th>
                      <th className="px-4 py-2 text-left font-medium text-[var(--foreground)]">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {[
                      { field: "message", required: "Yes", desc: "The message body / content to ingest" },
                      { field: "source", required: "No", desc: 'Source system name (e.g., "Slack", "Notion"). Defaults to "zapier"' },
                      { field: "author", required: "No", desc: "Author / sender name" },
                      { field: "timestamp", required: "No", desc: "ISO 8601 timestamp from source" },
                      { field: "tags", required: "No", desc: "Array of string tags (max 10)" },
                      { field: "routing_target", required: "No", desc: '"brain" (default), "kanban", or "both"' },
                      { field: "title", required: "No", desc: "Card title (kanban only; auto-derived from message if omitted)" },
                      { field: "priority", required: "No", desc: '"low", "medium" (default), "high", or "urgent"' },
                      { field: "target_column", required: "No", desc: "Kanban column name (defaults to first column)" },
                      { field: "target_board", required: "No", desc: "Kanban board name (defaults to your default board)" },
                      { field: "idempotency_key", required: "No", desc: "Unique key to prevent duplicate processing on retries" },
                    ].map((row) => (
                      <tr key={row.field} className="hover:bg-[var(--accent)]/50">
                        <td className="px-4 py-2 font-mono text-xs text-[var(--foreground)]">{row.field}</td>
                        <td className="px-4 py-2 text-[var(--muted-foreground)]">{row.required}</td>
                        <td className="px-4 py-2 text-[var(--muted-foreground)]">{row.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sample payload */}
            <div>
              <h4 className="text-sm font-medium text-[var(--foreground)] mb-2">
                Sample Payload
              </h4>
              <CodeBlock>{samplePayload}</CodeBlock>
            </div>

            {/* Source app examples */}
            <div>
              <h4 className="text-sm font-medium text-[var(--foreground)] mb-2">
                Field Mapping Examples
              </h4>
              <div className="space-y-4">
                <div className="rounded-lg border border-[var(--border)] p-4">
                  <h5 className="text-sm font-semibold text-[var(--foreground)] mb-1">Slack &rarr; Krisp</h5>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[var(--border)]">
                          <th className="px-3 py-1.5 text-left text-[var(--muted-foreground)]">Slack Field</th>
                          <th className="px-3 py-1.5 text-left text-[var(--muted-foreground)]">Payload Key</th>
                        </tr>
                      </thead>
                      <tbody className="text-[var(--foreground)]">
                        <tr><td className="px-3 py-1">Message Text</td><td className="px-3 py-1 font-mono text-xs">message</td></tr>
                        <tr><td className="px-3 py-1">Channel Name</td><td className="px-3 py-1 font-mono text-xs">tags[0]</td></tr>
                        <tr><td className="px-3 py-1">User Name</td><td className="px-3 py-1 font-mono text-xs">author</td></tr>
                        <tr><td className="px-3 py-1">Timestamp</td><td className="px-3 py-1 font-mono text-xs">timestamp</td></tr>
                        <tr><td className="px-3 py-1">(static: &ldquo;Slack&rdquo;)</td><td className="px-3 py-1 font-mono text-xs">source</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="rounded-lg border border-[var(--border)] p-4">
                  <h5 className="text-sm font-semibold text-[var(--foreground)] mb-1">Gmail &rarr; Krisp</h5>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[var(--border)]">
                          <th className="px-3 py-1.5 text-left text-[var(--muted-foreground)]">Gmail Field</th>
                          <th className="px-3 py-1.5 text-left text-[var(--muted-foreground)]">Payload Key</th>
                        </tr>
                      </thead>
                      <tbody className="text-[var(--foreground)]">
                        <tr><td className="px-3 py-1">Body Plain</td><td className="px-3 py-1 font-mono text-xs">message</td></tr>
                        <tr><td className="px-3 py-1">Subject</td><td className="px-3 py-1 font-mono text-xs">title</td></tr>
                        <tr><td className="px-3 py-1">From Email</td><td className="px-3 py-1 font-mono text-xs">author</td></tr>
                        <tr><td className="px-3 py-1">Date</td><td className="px-3 py-1 font-mono text-xs">timestamp</td></tr>
                        <tr><td className="px-3 py-1">(static: &ldquo;Gmail&rdquo;)</td><td className="px-3 py-1 font-mono text-xs">source</td></tr>
                        <tr><td className="px-3 py-1">Message ID</td><td className="px-3 py-1 font-mono text-xs">idempotency_key</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="rounded-lg border border-[var(--border)] p-4">
                  <h5 className="text-sm font-semibold text-[var(--foreground)] mb-1">Notion &rarr; Krisp</h5>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[var(--border)]">
                          <th className="px-3 py-1.5 text-left text-[var(--muted-foreground)]">Notion Field</th>
                          <th className="px-3 py-1.5 text-left text-[var(--muted-foreground)]">Payload Key</th>
                        </tr>
                      </thead>
                      <tbody className="text-[var(--foreground)]">
                        <tr><td className="px-3 py-1">Page Content / Body</td><td className="px-3 py-1 font-mono text-xs">message</td></tr>
                        <tr><td className="px-3 py-1">Page Title</td><td className="px-3 py-1 font-mono text-xs">title</td></tr>
                        <tr><td className="px-3 py-1">Last Edited By</td><td className="px-3 py-1 font-mono text-xs">author</td></tr>
                        <tr><td className="px-3 py-1">Last Edited Time</td><td className="px-3 py-1 font-mono text-xs">timestamp</td></tr>
                        <tr><td className="px-3 py-1">(static: &ldquo;Notion&rdquo;)</td><td className="px-3 py-1 font-mono text-xs">source</td></tr>
                        <tr><td className="px-3 py-1">Page ID</td><td className="px-3 py-1 font-mono text-xs">idempotency_key</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const activitySection = (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">
          Recent Ingest Events
        </h3>
        <button
          onClick={fetchLogs}
          className="px-3 py-1.5 text-xs font-medium rounded-md border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
        >
          Refresh
        </button>
      </div>

      {logsLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-12 bg-[var(--secondary)] rounded animate-pulse"
            />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)] py-4 text-center">
          No ingest events yet. Set up a Zap to get started.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--secondary)]">
                <th className="px-4 py-2 text-left font-medium text-[var(--foreground)]">Time</th>
                <th className="px-4 py-2 text-left font-medium text-[var(--foreground)]">Source</th>
                <th className="px-4 py-2 text-left font-medium text-[var(--foreground)]">Target</th>
                <th className="px-4 py-2 text-left font-medium text-[var(--foreground)]">Status</th>
                <th className="px-4 py-2 text-left font-medium text-[var(--foreground)]">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-[var(--accent)]/50">
                  <td className="px-4 py-2 text-[var(--muted-foreground)] whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-[var(--foreground)]">
                    {log.source}
                  </td>
                  <td className="px-4 py-2 text-[var(--muted-foreground)]">
                    {log.routingTarget}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                        log.status === "success"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-[var(--muted-foreground)] text-xs max-w-[200px] truncate">
                    {log.errorMessage ||
                      (log.thoughtId
                        ? `thought: ${log.thoughtId.slice(0, 8)}...`
                        : log.cardId
                          ? `card: ${log.cardId.slice(0, 8)}...`
                          : "\u2014")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <IntegrationDetailLayout
      integration={integration}
      connected={isConnected}
      connectionSection={connectionSection}
      activitySection={activitySection}
    />
  );
}
