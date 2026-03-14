"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface WebhookLog {
  id: string;
  source: string;
  tenantId: string | null;
  status: string;
  method: string | null;
  durationMs: number | null;
  messageCount: number | null;
  errorMessage: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface GraphSub {
  id: string;
  tenantId: string;
  subscriptionId: string;
  resource: string;
  expirationDateTime: string;
  active: boolean;
}

interface Metrics {
  total: number;
  bySource: Record<string, number>;
  byStatus: Record<string, number>;
  avgDurationMs: number;
  totalMessagesProcessed: number;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  success: { bg: "bg-emerald-500/10", text: "text-emerald-400" },
  error: { bg: "bg-red-500/10", text: "text-red-400" },
  skipped: { bg: "bg-amber-500/10", text: "text-amber-400" },
  validation: { bg: "bg-blue-500/10", text: "text-blue-400" },
};

const SOURCE_OPTIONS = [
  { value: "", label: "All sources" },
  { value: "graph", label: "Graph" },
  { value: "gmail_pubsub", label: "Gmail Pub/Sub" },
  { value: "gmail_apps_script", label: "Gmail Apps Script" },
  { value: "m365", label: "M365" },
  { value: "outlook_sync", label: "Outlook Sync" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "success", label: "Success" },
  { value: "error", label: "Error" },
  { value: "skipped", label: "Skipped" },
  { value: "validation", label: "Validation" },
];

const TIME_OPTIONS = [
  { value: "1", label: "1h" },
  { value: "6", label: "6h" },
  { value: "24", label: "24h" },
  { value: "48", label: "48h" },
  { value: "168", label: "7d" },
];

export function WebhooksClient() {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [graphSubs, setGraphSubs] = useState<GraphSub[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  const [source, setSource] = useState("");
  const [status, setStatus] = useState("");
  const [hours, setHours] = useState("24");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams({ hours });
      if (source) params.set("source", source);
      if (status) params.set("status", status);

      const res = await fetch(`/api/admin/webhook-logs?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs ?? []);
        setGraphSubs(data.graphSubscriptions ?? []);
        setMetrics(data.metrics ?? null);
      }
    } finally {
      setLoading(false);
    }
  }, [source, status, hours]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  // Auto-refresh polling
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchData, 30_000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, fetchData]);

  const successRate =
    metrics && metrics.total > 0
      ? Math.round(((metrics.byStatus["success"] || 0) / metrics.total) * 100)
      : 0;

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-6">
          Webhook Monitor
        </h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-[var(--muted)] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          Webhook Monitor
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchData()}
            className="rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
          >
            Refresh
          </button>
          <label className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-refresh (30s)
          </label>
        </div>
      </div>

      {/* Metric cards */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="Total Invocations" value={metrics.total} />
          <MetricCard label="Success Rate" value={`${successRate}%`} />
          <MetricCard label="Avg Duration" value={`${metrics.avgDurationMs}ms`} />
          <MetricCard label="Emails Processed" value={metrics.totalMessagesProcessed} />
        </div>
      )}

      {/* Graph subscriptions */}
      {graphSubs.length > 0 && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
          <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3">
            Active Graph Subscriptions
          </h2>
          <div className="space-y-2">
            {graphSubs.map((sub) => {
              const exp = new Date(sub.expirationDateTime);
              const hoursLeft = (exp.getTime() - Date.now()) / (1000 * 60 * 60);
              const isExpiring = hoursLeft < 24;
              return (
                <div
                  key={sub.id}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="text-[var(--muted-foreground)]">
                    <span className="font-mono text-xs">{sub.tenantId.slice(0, 8)}...</span>
                    {" "}&mdash; {sub.resource}
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      isExpiring
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-emerald-500/10 text-emerald-400"
                    }`}
                  >
                    {isExpiring
                      ? `Expires in ${Math.max(0, Math.round(hoursLeft))}h`
                      : `Expires ${exp.toLocaleDateString()}`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="rounded-md border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] px-3 py-1.5 text-sm"
        >
          {SOURCE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-md border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] px-3 py-1.5 text-sm"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <div className="flex rounded-md border border-[var(--border)] overflow-hidden">
          {TIME_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => setHours(o.value)}
              className={`px-3 py-1.5 text-sm ${
                hours === o.value
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "bg-[var(--card)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Logs table */}
      <div className="rounded-lg border border-[var(--border)] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--muted)]/50">
              <th className="text-left px-4 py-2 font-medium text-[var(--muted-foreground)]">Time</th>
              <th className="text-left px-4 py-2 font-medium text-[var(--muted-foreground)]">Source</th>
              <th className="text-left px-4 py-2 font-medium text-[var(--muted-foreground)]">Tenant</th>
              <th className="text-left px-4 py-2 font-medium text-[var(--muted-foreground)]">Status</th>
              <th className="text-right px-4 py-2 font-medium text-[var(--muted-foreground)]">Duration</th>
              <th className="text-right px-4 py-2 font-medium text-[var(--muted-foreground)]">Messages</th>
              <th className="text-left px-4 py-2 font-medium text-[var(--muted-foreground)]">Error</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[var(--muted-foreground)]">
                  No webhook logs found for this time window.
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const colors = STATUS_COLORS[log.status] || { bg: "bg-slate-500/10", text: "text-slate-400" };
                return (
                  <tr key={log.id} className="border-b border-[var(--border)] hover:bg-[var(--muted)]/30">
                    <td className="px-4 py-2 font-mono text-xs text-[var(--muted-foreground)] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-[var(--foreground)]">{log.source}</td>
                    <td className="px-4 py-2 font-mono text-xs text-[var(--muted-foreground)]">
                      {log.tenantId ? `${log.tenantId.slice(0, 8)}...` : "-"}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${colors.bg} ${colors.text}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right text-[var(--muted-foreground)] tabular-nums">
                      {log.durationMs != null ? `${log.durationMs}ms` : "-"}
                    </td>
                    <td className="px-4 py-2 text-right text-[var(--muted-foreground)] tabular-nums">
                      {log.messageCount ?? "-"}
                    </td>
                    <td className="px-4 py-2 text-red-400 text-xs max-w-[300px] truncate">
                      {log.errorMessage || ""}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="text-xs text-[var(--muted-foreground)]">{label}</div>
      <div className="text-2xl font-bold text-[var(--foreground)] mt-1">{value}</div>
    </div>
  );
}
