"use client";

import { useState, useEffect, useCallback } from "react";
import { Drawer } from "@/components/ui/Drawer";

// ── Types ──────────────────────────────────────────────

interface AiLogEntry {
  id: string;
  userId: string;
  triggerType: string;
  promptKey: string | null;
  model: string;
  prompt: string;
  response: string;
  entityType: string | null;
  entityId: string | null;
  durationMs: number | null;
  tokenEstimate: number | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ── Helpers ────────────────────────────────────────────

const TRIGGER_COLORS: Record<string, { bg: string; text: string }> = {
  smart_label_classify: { bg: "bg-purple-500/15", text: "text-purple-600 dark:text-purple-400" },
  smart_label_draft: { bg: "bg-purple-500/15", text: "text-purple-600 dark:text-purple-400" },
  smart_label_suggest: { bg: "bg-purple-500/15", text: "text-purple-600 dark:text-purple-400" },
  email_classify: { bg: "bg-blue-500/15", text: "text-blue-600 dark:text-blue-400" },
  email_actions: { bg: "bg-blue-500/15", text: "text-blue-600 dark:text-blue-400" },
  email_reply_draft: { bg: "bg-blue-500/15", text: "text-blue-600 dark:text-blue-400" },
  email_forward_draft: { bg: "bg-blue-500/15", text: "text-blue-600 dark:text-blue-400" },
  email_triage_card: { bg: "bg-blue-500/15", text: "text-blue-600 dark:text-blue-400" },
  extract_action_items: { bg: "bg-green-500/15", text: "text-green-600 dark:text-green-400" },
  extract_decisions: { bg: "bg-green-500/15", text: "text-green-600 dark:text-green-400" },
  brain_chat: { bg: "bg-amber-500/15", text: "text-amber-600 dark:text-amber-400" },
  intent_classify: { bg: "bg-amber-500/15", text: "text-amber-600 dark:text-amber-400" },
  search: { bg: "bg-teal-500/15", text: "text-teal-600 dark:text-teal-400" },
  weekly_review: { bg: "bg-rose-500/15", text: "text-rose-600 dark:text-rose-400" },
  weekly_plan: { bg: "bg-rose-500/15", text: "text-rose-600 dark:text-rose-400" },
  week_assessment: { bg: "bg-rose-500/15", text: "text-rose-600 dark:text-rose-400" },
  daily_briefing: { bg: "bg-orange-500/15", text: "text-orange-600 dark:text-orange-400" },
  priority_review: { bg: "bg-red-500/15", text: "text-red-600 dark:text-red-400" },
  generate_cards: { bg: "bg-cyan-500/15", text: "text-cyan-600 dark:text-cyan-400" },
  zapier_ingest: { bg: "bg-gray-500/15", text: "text-gray-600 dark:text-gray-400" },
  prompt_enhance: { bg: "bg-violet-500/15", text: "text-violet-600 dark:text-violet-400" },
  page_ask: { bg: "bg-emerald-500/15", text: "text-emerald-600 dark:text-emerald-400" },
  page_rule_classify: { bg: "bg-emerald-500/15", text: "text-emerald-600 dark:text-emerald-400" },
  generate_smart_rule: { bg: "bg-emerald-500/15", text: "text-emerald-600 dark:text-emerald-400" },
  post_reply_processing: { bg: "bg-indigo-500/15", text: "text-indigo-600 dark:text-indigo-400" },
};

function getTriggerColor(trigger: string) {
  return TRIGGER_COLORS[trigger] ?? { bg: "bg-gray-500/15", text: "text-gray-600 dark:text-gray-400" };
}

function formatTrigger(trigger: string): string {
  return trigger.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ── Log Row ────────────────────────────────────────────

function LogRow({ log, onClick }: { log: AiLogEntry; onClick: () => void }) {
  const color = getTriggerColor(log.triggerType);
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg border hover:bg-[var(--accent)]/50 transition-colors"
      style={{ borderColor: "var(--border)" }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${color.bg} ${color.text}`}>
            {formatTrigger(log.triggerType)}
          </span>
          {log.promptKey && (
            <span className="text-[10px] text-[var(--muted-foreground)] font-mono">
              {log.promptKey}
            </span>
          )}
          {log.entityType && log.entityId && (
            <span className="text-[10px] text-[var(--muted-foreground)]">
              {log.entityType}#{log.entityId}
            </span>
          )}
        </div>
        <p className="text-xs text-[var(--muted-foreground)] mt-1 truncate">
          {log.prompt.slice(0, 120)}...
        </p>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="text-[10px] text-[var(--muted-foreground)] whitespace-nowrap">
          {relativeTime(log.createdAt)}
        </span>
        <div className="flex items-center gap-2 text-[10px] text-[var(--muted-foreground)]">
          {log.durationMs != null && <span>{log.durationMs}ms</span>}
          {log.tokenEstimate != null && <span>~{log.tokenEstimate.toLocaleString()} tok</span>}
        </div>
        <span className="text-[10px] text-[var(--muted-foreground)] font-mono">{log.model.split("/").pop()}</span>
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
        <path d="m9 18 6-6-6-6" />
      </svg>
    </button>
  );
}

// ── Detail Drawer ──────────────────────────────────────

function LogDetailDrawer({ log, open, onClose }: { log: AiLogEntry; open: boolean; onClose: () => void }) {
  const color = getTriggerColor(log.triggerType);

  return (
    <Drawer open={open} onClose={onClose} title="AI Call Details" width="max-w-2xl">
      <div className="space-y-5">
        {/* Metadata */}
        <div className="flex flex-wrap gap-2">
          <span className={`px-2 py-1 text-xs font-medium rounded ${color.bg} ${color.text}`}>
            {formatTrigger(log.triggerType)}
          </span>
          <span className="px-2 py-1 text-xs font-mono rounded bg-[var(--secondary)] text-[var(--muted-foreground)]">
            {log.model}
          </span>
          {log.durationMs != null && (
            <span className="px-2 py-1 text-xs rounded bg-[var(--secondary)] text-[var(--muted-foreground)]">
              {log.durationMs}ms
            </span>
          )}
          {log.tokenEstimate != null && (
            <span className="px-2 py-1 text-xs rounded bg-[var(--secondary)] text-[var(--muted-foreground)]">
              ~{log.tokenEstimate.toLocaleString()} tokens
            </span>
          )}
        </div>

        {/* Entity info */}
        {(log.entityType || log.promptKey) && (
          <div className="flex gap-4 text-xs text-[var(--muted-foreground)]">
            {log.promptKey && <span>Prompt: <span className="font-mono">{log.promptKey}</span></span>}
            {log.entityType && log.entityId && <span>Entity: {log.entityType}#{log.entityId}</span>}
          </div>
        )}

        <div className="text-xs text-[var(--muted-foreground)]">
          {new Date(log.createdAt).toLocaleString()}
        </div>

        <hr style={{ borderColor: "var(--border)" }} />

        {/* Prompt */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-[var(--foreground)]">Prompt Sent</span>
          </div>
          <pre className="text-xs font-mono whitespace-pre-wrap p-3 rounded-lg border overflow-x-auto max-h-[400px] overflow-y-auto" style={{ backgroundColor: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }}>
            {log.prompt}
          </pre>
        </div>

        {/* Response */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-[var(--foreground)]">AI Response</span>
          </div>
          <pre className="text-xs font-mono whitespace-pre-wrap p-3 rounded-lg border overflow-x-auto max-h-[400px] overflow-y-auto" style={{ backgroundColor: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }}>
            {log.response}
          </pre>
        </div>
      </div>
    </Drawer>
  );
}

// ── Main Component ─────────────────────────────────────

export function AiLogsClient({ adminId }: { adminId: string }) {
  const [logs, setLogs] = useState<AiLogEntry[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterTrigger, setFilterTrigger] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<AiLogEntry | null>(null);

  const fetchLogs = useCallback(async (page = 1, triggerType?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "50" });
      if (triggerType && triggerType !== "all") {
        params.set("triggerType", triggerType);
      }
      const res = await fetch(`/api/admin/ai-logs?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch {
      setError("Failed to load AI logs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs(1, filterTrigger);
  }, [fetchLogs, filterTrigger]);

  const triggerTypes = [
    "all",
    "smart_label_classify",
    "smart_label_draft",
    "email_classify",
    "email_actions",
    "email_reply_draft",
    "email_forward_draft",
    "extract_action_items",
    "extract_decisions",
    "brain_chat",
    "intent_classify",
    "search",
    "weekly_review",
    "weekly_plan",
    "week_assessment",
    "daily_briefing",
    "priority_review",
    "generate_cards",
    "zapier_ingest",
    "prompt_enhance",
    "page_ask",
    "page_rule_classify",
    "post_reply_processing",
  ];

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[var(--foreground)]">AI Call Inspector</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Inspect every AI call — see the full prompt, response, trigger, and outcome. Use this to fine-tune system prompts.
        </p>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-1.5">
        {triggerTypes.map((t) => (
          <button
            key={t}
            onClick={() => { setFilterTrigger(t); }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filterTrigger === t
                ? "bg-[var(--primary)] text-white"
                : "border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
            }`}
          >
            {t === "all" ? "All Triggers" : formatTrigger(t)}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-xs text-[var(--muted-foreground)]">
        <span>{pagination.total} total calls</span>
        <span>Page {pagination.page} of {pagination.totalPages || 1}</span>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="text-sm text-[var(--muted-foreground)]">Loading AI logs...</div>
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 gap-2">
          <div className="text-sm text-[var(--muted-foreground)]">No AI calls logged yet.</div>
          <div className="text-xs text-[var(--muted-foreground)]">AI calls will appear here as they happen.</div>
        </div>
      ) : (
        /* Log list */
        <div className="space-y-2">
          {logs.map((log) => (
            <LogRow key={log.id} log={log} onClick={() => setSelectedLog(log)} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => fetchLogs(pagination.page - 1, filterTrigger)}
            disabled={pagination.page <= 1}
            className="px-3 py-1.5 text-xs font-medium rounded-md border transition-colors disabled:opacity-30 hover:bg-[var(--accent)]"
            style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
          >
            Previous
          </button>
          <span className="text-xs text-[var(--muted-foreground)]">
            {pagination.page} / {pagination.totalPages}
          </span>
          <button
            onClick={() => fetchLogs(pagination.page + 1, filterTrigger)}
            disabled={pagination.page >= pagination.totalPages}
            className="px-3 py-1.5 text-xs font-medium rounded-md border transition-colors disabled:opacity-30 hover:bg-[var(--accent)]"
            style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
          >
            Next
          </button>
        </div>
      )}

      {/* Detail drawer */}
      {selectedLog && (
        <LogDetailDrawer
          log={selectedLog}
          open={true}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  );
}
