"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { resendEmail } from "./actions";

/* ---------- Types ---------- */

interface EmailRow {
  id: string;
  userId: string | null;
  recipientEmail: string;
  fromEmail: string;
  type: string;
  subject: string;
  resendId: string | null;
  status: string;
  originalEmailLogId: string | null;
  createdAt: string;
  updatedAt: string;
  userName: string | null;
}

interface EmailDetail extends EmailRow {
  htmlBody: string;
}

interface EmailEvent {
  id: string;
  emailLogId: string;
  eventType: string;
  metadata: Record<string, unknown> | null;
  occurredAt: string;
  createdAt: string;
}

interface Metrics {
  total: number;
  delivered: number;
  bounced: number;
  opened: number;
  complained: number;
}

/* ---------- Helpers ---------- */

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  sent: { bg: "bg-blue-500/20", text: "text-blue-400" },
  delivered: { bg: "bg-green-500/20", text: "text-green-400" },
  opened: { bg: "bg-green-500/20", text: "text-green-300" },
  bounced: { bg: "bg-yellow-500/20", text: "text-yellow-400" },
  complained: { bg: "bg-red-500/20", text: "text-red-400" },
};

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  billing: { bg: "bg-red-500/15", text: "text-red-400" },
  daily_briefing: { bg: "bg-blue-500/15", text: "text-blue-400" },
  weekly_review: { bg: "bg-green-500/15", text: "text-green-400" },
  weekly_plan: { bg: "bg-teal-500/15", text: "text-teal-400" },
  reminder: { bg: "bg-purple-500/15", text: "text-purple-400" },
  password_reset: { bg: "bg-gray-500/15", text: "text-gray-400" },
  account: { bg: "bg-gray-500/15", text: "text-gray-400" },
  action_item: { bg: "bg-orange-500/15", text: "text-orange-400" },
};

function getTypeColor(type: string) {
  const prefix = type.split(".")[0];
  return TYPE_COLORS[prefix] ?? TYPE_COLORS[type] ?? { bg: "bg-gray-500/15", text: "text-gray-400" };
}

function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const RESENDABLE_STATUSES = ["bounced", "complained"];

const EMAIL_TYPES = [
  { value: "", label: "All types" },
  { value: "billing", label: "Billing" },
  { value: "daily_briefing", label: "Daily Briefing" },
  { value: "weekly_review", label: "Weekly Review" },
  { value: "weekly_plan", label: "Weekly Plan" },
  { value: "reminder", label: "Reminder" },
  { value: "password_reset", label: "Password Reset" },
  { value: "account", label: "Account" },
  { value: "action_item", label: "Action Item" },
];

/* ---------- Component ---------- */

export function EmailsClient({ adminId }: { adminId: string }) {
  const [emails, setEmails] = useState<EmailRow[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({ total: 0, delivered: 0, bounced: 0, opened: 0, complained: 0 });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [range, setRange] = useState("24h");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<{ email: EmailDetail; events: EmailEvent[] } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [confirmResend, setConfirmResend] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  const pageSize = 50;

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchEmails = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ range, page: String(page) });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (typeFilter) params.set("type", typeFilter);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/emails?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setEmails(data.emails);
      setTotal(data.total);
      setMetrics(data.metrics);
    } catch (err) {
      console.error("Failed to fetch emails:", err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, typeFilter, statusFilter, range, page]);

  useEffect(() => { fetchEmails(); }, [fetchEmails]);

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/emails/${id}`);
      if (!res.ok) throw new Error("Failed to fetch detail");
      const data = await res.json();
      setDetail(data);
    } catch (err) {
      console.error("Failed to fetch email detail:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleResend = (emailLogId: string) => {
    startTransition(async () => {
      const result = await resendEmail(emailLogId);
      if (result.error) {
        setFeedback(`Error: ${result.error}`);
      } else {
        setFeedback("Email resent successfully");
        fetchEmails();
      }
      setConfirmResend(null);
      setTimeout(() => setFeedback(null), 3000);
    });
  };

  const totalPages = Math.ceil(total / pageSize);
  const deliveryRate = metrics.total > 0 ? ((metrics.delivered / metrics.total) * 100).toFixed(1) : "0";
  const openRate = metrics.total > 0 ? ((metrics.opened / metrics.total) * 100).toFixed(1) : "0";

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Email Logs</h1>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <MetricCard label={`Sent (${range})`} value={String(metrics.total)} />
          <MetricCard label="Delivered" value={`${deliveryRate}%`} color="text-green-400" />
          <MetricCard label="Bounced" value={String(metrics.bounced)} color="text-red-400" />
          <MetricCard label="Opened" value={`${openRate}%`} color="text-blue-400" />
          <MetricCard label="Complaints" value={String(metrics.complained)} color="text-yellow-400" />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <input
            type="text"
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm"
          >
            {EMAIL_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm"
          >
            <option value="">All statuses</option>
            <option value="sent">Sent</option>
            <option value="delivered">Delivered</option>
            <option value="bounced">Bounced</option>
            <option value="opened">Opened</option>
            <option value="complained">Complained</option>
          </select>
          <div className="flex rounded-lg border border-[var(--border)] overflow-hidden">
            {["24h", "7d", "30d"].map((r) => (
              <button
                key={r}
                onClick={() => { setRange(r); setPage(1); }}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  range === r
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                    : "bg-[var(--card)] text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
                <th className="text-left px-4 py-3 text-[var(--muted-foreground)] font-medium">Time</th>
                <th className="text-left px-4 py-3 text-[var(--muted-foreground)] font-medium">Recipient</th>
                <th className="text-left px-4 py-3 text-[var(--muted-foreground)] font-medium">Type</th>
                <th className="text-left px-4 py-3 text-[var(--muted-foreground)] font-medium">Subject</th>
                <th className="text-left px-4 py-3 text-[var(--muted-foreground)] font-medium">Status</th>
                <th className="text-right px-4 py-3 text-[var(--muted-foreground)] font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-[var(--border)]">
                    <td colSpan={6} className="px-4 py-3">
                      <div className="h-5 rounded bg-[var(--muted)] animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : emails.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[var(--muted-foreground)]">
                    No emails found
                  </td>
                </tr>
              ) : (
                emails.map((email) => {
                  const sc = STATUS_COLORS[email.status] ?? STATUS_COLORS.sent;
                  const tc = getTypeColor(email.type);
                  return (
                    <tr
                      key={email.id}
                      className="border-t border-[var(--border)] hover:bg-[var(--accent)] transition-colors cursor-pointer"
                      onClick={() => openDetail(email.id)}
                    >
                      <td className="px-4 py-3 text-[var(--muted-foreground)] whitespace-nowrap">
                        {relativeTime(email.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-[var(--foreground)]">{email.recipientEmail}</div>
                        {email.userName && (
                          <div className="text-xs text-[var(--muted-foreground)]">{email.userName}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tc.bg} ${tc.text}`}>
                          {email.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--foreground)] max-w-[250px] truncate">
                        {email.subject}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${sc.bg} ${sc.text}`}>
                          {email.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => openDetail(email.id)}
                          className="px-2 py-1 text-xs rounded border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--accent)] transition-colors"
                        >
                          View
                        </button>
                        {RESENDABLE_STATUSES.includes(email.status) && (
                          <button
                            onClick={() => setConfirmResend(email.id)}
                            className="ml-2 px-2 py-1 text-xs rounded border border-red-400/30 text-red-400 hover:bg-red-400/10 transition-colors"
                          >
                            Resend
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center px-4 py-3 border-t border-[var(--border)]">
              <span className="text-xs text-[var(--muted-foreground)]">
                Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-xs rounded border border-[var(--border)] text-[var(--muted-foreground)] disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 text-xs rounded border border-[var(--border)] text-[var(--muted-foreground)] disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Drawer */}
      {(detail || detailLoading) && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDetail(null)} />
          <div className="relative w-full max-w-xl bg-[var(--card)] border-l border-[var(--border)] overflow-y-auto animate-slide-in-right">
            {detailLoading && !detail ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-8 rounded bg-[var(--muted)] animate-pulse" />
                ))}
              </div>
            ) : detail ? (
              <>
                {/* Drawer Header */}
                <div className="flex justify-between items-start p-4 border-b border-[var(--border)]">
                  <div>
                    <h2 className="text-lg font-semibold">{detail.email.subject}</h2>
                    <p className="text-sm text-[var(--muted-foreground)] mt-1">
                      Sent {relativeTime(detail.email.createdAt)} to {detail.email.recipientEmail}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {RESENDABLE_STATUSES.includes(detail.email.status) && (
                      <button
                        onClick={() => setConfirmResend(detail.email.id)}
                        className="px-3 py-1.5 text-xs rounded-lg border border-red-400/30 text-red-400 hover:bg-red-400/10 transition-colors"
                      >
                        Resend Email
                      </button>
                    )}
                    <button
                      onClick={() => setDetail(null)}
                      className="px-2 py-1.5 text-lg rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--accent)] transition-colors leading-none"
                    >
                      ×
                    </button>
                  </div>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 border-b border-[var(--border)]">
                  <div className="p-4 border-r border-b border-[var(--border)]">
                    <div className="text-xs text-[var(--muted-foreground)] uppercase">Recipient</div>
                    <div className="mt-1">{detail.email.userName ? `${detail.email.userName} <${detail.email.recipientEmail}>` : detail.email.recipientEmail}</div>
                  </div>
                  <div className="p-4 border-b border-[var(--border)]">
                    <div className="text-xs text-[var(--muted-foreground)] uppercase">Type</div>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(detail.email.type).bg} ${getTypeColor(detail.email.type).text}`}>
                        {detail.email.type}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 border-r border-[var(--border)]">
                    <div className="text-xs text-[var(--muted-foreground)] uppercase">Resend ID</div>
                    <div className="mt-1 font-mono text-xs text-blue-400">{detail.email.resendId ?? "—"}</div>
                  </div>
                  <div className="p-4">
                    <div className="text-xs text-[var(--muted-foreground)] uppercase">Status</div>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${(STATUS_COLORS[detail.email.status] ?? STATUS_COLORS.sent).bg} ${(STATUS_COLORS[detail.email.status] ?? STATUS_COLORS.sent).text}`}>
                        {detail.email.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Event Timeline */}
                <div className="p-4 border-b border-[var(--border)]">
                  <h3 className="text-xs text-[var(--muted-foreground)] uppercase font-semibold mb-3">Delivery Timeline</h3>
                  {detail.events.length === 0 ? (
                    <p className="text-sm text-[var(--muted-foreground)]">No delivery events received yet</p>
                  ) : (
                    <div className="space-y-0 pl-2">
                      {detail.events.map((event, idx) => {
                        const isLast = idx === detail.events.length - 1;
                        const isBounce = event.eventType.includes("bounced");
                        const isComplaint = event.eventType.includes("complained");
                        const dotColor = isBounce || isComplaint ? "bg-red-400" : "bg-green-400";
                        const bounceReason = isBounce && event.metadata
                          ? (event.metadata as Record<string, unknown>).bounce_type ||
                            (event.metadata as Record<string, unknown>).message ||
                            JSON.stringify(event.metadata)
                          : null;
                        return (
                          <div key={event.id} className="flex gap-3 relative pb-4">
                            <div className="relative z-10 flex flex-col items-center">
                              <div className={`w-2.5 h-2.5 rounded-full ${dotColor} mt-1.5`} />
                              {!isLast && (
                                <div className="w-0.5 flex-1 bg-[var(--border)] mt-1" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="text-sm">{event.eventType}</div>
                              <div className="text-xs text-[var(--muted-foreground)]">
                                {new Date(event.occurredAt).toLocaleString()}
                              </div>
                              {bounceReason && (
                                <div className="mt-1 text-xs text-red-400 bg-red-400/10 px-2 py-1 rounded border-l-2 border-red-400">
                                  {String(bounceReason)}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* HTML Preview */}
                <div className="p-4">
                  <h3 className="text-xs text-[var(--muted-foreground)] uppercase font-semibold mb-3">Email Preview</h3>
                  <div className="rounded-lg border border-[var(--border)] overflow-hidden bg-white">
                    <iframe
                      srcDoc={detail.email.htmlBody}
                      sandbox=""
                      className="w-full min-h-[300px] border-0"
                      title="Email preview"
                    />
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Resend Confirmation Modal */}
      {confirmResend && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmResend(null)} />
          <div className="relative bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Resend Email?</h3>
            <p className="text-sm text-[var(--muted-foreground)] mb-4">
              This will send a new copy of this email to the original recipient.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmResend(null)}
                className="px-3 py-2 text-sm rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--accent)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleResend(confirmResend)}
                disabled={isPending}
                className="px-3 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isPending ? "Sending..." : "Resend"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {feedback && (
        <div className="fixed top-4 right-4 z-[70] px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm shadow-lg">
          {feedback}
        </div>
      )}
    </div>
  );
}

/* ---------- Sub-components ---------- */

function MetricCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
      <div className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${color ?? "text-[var(--foreground)]"}`}>{value}</div>
    </div>
  );
}
