"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { adminCancelSubscription, adminChangePlan, adminIssueRefund } from "./actions";

interface SubscriptionRow {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  stripeSubscriptionId: string;
  planName: string;
  status: string;
  monthlyAmount: number;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

interface RevenueMetrics {
  totalMrr: number;
  activeCount: number;
  pastDueCount: number;
  canceledCount: number;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "Active" },
  trialing: { bg: "bg-blue-500/10", text: "text-blue-400", label: "Trialing" },
  past_due: { bg: "bg-amber-500/10", text: "text-amber-400", label: "Past Due" },
  canceled: { bg: "bg-red-500/10", text: "text-red-400", label: "Canceled" },
  unpaid: { bg: "bg-red-500/10", text: "text-red-400", label: "Unpaid" },
  incomplete: { bg: "bg-slate-500/10", text: "text-slate-400", label: "Incomplete" },
};

type ModalState =
  | { type: "none" }
  | { type: "detail"; sub: SubscriptionRow }
  | { type: "cancel"; sub: SubscriptionRow }
  | { type: "changePlan"; sub: SubscriptionRow }
  | { type: "refund"; sub: SubscriptionRow };

export function SubscriptionsClient({ adminId }: { adminId: string }) {
  const [subs, setSubs] = useState<SubscriptionRow[]>([]);
  const [metrics, setMetrics] = useState<RevenueMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/subscriptions");
      if (res.ok) {
        const data = await res.json();
        setSubs(data.subscriptions ?? []);
        setMetrics(data.metrics ?? null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  const filtered = subs.filter((s) => {
    const matchSearch =
      !search ||
      s.userName.toLowerCase().includes(search.toLowerCase()) ||
      s.userEmail.toLowerCase().includes(search.toLowerCase()) ||
      s.stripeSubscriptionId.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  function handleCancelSubscription(sub: SubscriptionRow, immediate: boolean, reason: string) {
    startTransition(async () => {
      const result = await adminCancelSubscription(sub.stripeSubscriptionId, immediate, reason);
      if ("success" in result) {
        setFeedback(`Subscription ${immediate ? "canceled" : "set to cancel at period end"}`);
        setModal({ type: "none" });
        fetchData();
      }
    });
  }

  function handleChangePlan(sub: SubscriptionRow, newPriceId: string) {
    startTransition(async () => {
      const result = await adminChangePlan(sub.stripeSubscriptionId, newPriceId, true);
      if ("success" in result) {
        setFeedback("Plan changed successfully");
        setModal({ type: "none" });
        fetchData();
      }
    });
  }

  function handleRefund(sub: SubscriptionRow) {
    startTransition(async () => {
      // Refund the most recent invoice — we pass the Stripe subscription ID
      // and the admin action will find the latest invoice
      const result = await adminIssueRefund(sub.stripeSubscriptionId);
      if ("success" in result) {
        setFeedback("Refund issued successfully");
        setModal({ type: "none" });
      } else if ("error" in result) {
        setFeedback(`Refund failed: ${result.error}`);
        setModal({ type: "none" });
      }
    });
  }

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-6">
          Subscription Management
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
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-6">
        Subscription Management
      </h1>

      {/* Feedback toast */}
      {feedback && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 rounded-lg bg-[var(--card)] border border-[var(--border)] text-sm text-[var(--foreground)] shadow-lg">
          {feedback}
        </div>
      )}

      {/* Revenue metrics */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <MetricCard label="Monthly Revenue" value={`$${(metrics.totalMrr / 100).toFixed(2)}`} />
          <MetricCard label="Active" value={String(metrics.activeCount)} color="text-emerald-400" />
          <MetricCard label="Past Due" value={String(metrics.pastDueCount)} color="text-amber-400" />
          <MetricCard label="Canceled" value={String(metrics.canceledCount)} color="text-red-400" />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by name, email, or Stripe ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] text-sm flex-1 min-w-[200px]"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] text-sm"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="trialing">Trialing</option>
          <option value="past_due">Past Due</option>
          <option value="canceled">Canceled</option>
          <option value="unpaid">Unpaid</option>
        </select>
      </div>

      {/* Subscription table */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
                <th className="text-left px-4 py-3 text-[var(--muted-foreground)] font-medium">Customer</th>
                <th className="text-left px-4 py-3 text-[var(--muted-foreground)] font-medium">Plan</th>
                <th className="text-left px-4 py-3 text-[var(--muted-foreground)] font-medium">Status</th>
                <th className="text-left px-4 py-3 text-[var(--muted-foreground)] font-medium">MRR</th>
                <th className="text-left px-4 py-3 text-[var(--muted-foreground)] font-medium">Period End</th>
                <th className="text-right px-4 py-3 text-[var(--muted-foreground)] font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[var(--muted-foreground)]">
                    No subscriptions found.
                  </td>
                </tr>
              ) : (
                filtered.map((sub) => {
                  const si = STATUS_COLORS[sub.status] ?? STATUS_COLORS.incomplete;
                  return (
                    <tr key={sub.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--accent)] transition-colors">
                      <td className="px-4 py-3">
                        <div className="text-[var(--foreground)] font-medium">{sub.userName}</div>
                        <div className="text-xs text-[var(--muted-foreground)]">{sub.userEmail}</div>
                      </td>
                      <td className="px-4 py-3 text-[var(--foreground)]">{sub.planName}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${si.bg} ${si.text}`}>
                          {si.label}
                        </span>
                        {sub.cancelAtPeriodEnd && (
                          <span className="ml-1 text-xs text-amber-500">cancelling</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[var(--foreground)]">
                        ${(sub.monthlyAmount / 100).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-[var(--foreground)]">
                        {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-1 justify-end">
                          <button
                            onClick={() => setModal({ type: "detail", sub })}
                            className="px-2 py-1 rounded text-xs border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
                          >
                            View
                          </button>
                          {sub.status !== "canceled" && (
                            <button
                              onClick={() => setModal({ type: "cancel", sub })}
                              className="px-2 py-1 rounded text-xs border border-[var(--border)] text-[var(--muted-foreground)] hover:text-red-400 hover:border-red-400/30 transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            onClick={() => setModal({ type: "refund", sub })}
                            className="px-2 py-1 rounded text-xs border border-[var(--border)] text-[var(--muted-foreground)] hover:text-amber-400 hover:border-amber-400/30 transition-colors"
                          >
                            Refund
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail modal */}
      {modal.type === "detail" && (
        <ModalWrapper onClose={() => setModal({ type: "none" })}>
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Subscription Detail</h3>
          <div className="space-y-2 text-sm">
            <DetailRow label="Customer" value={`${modal.sub.userName} (${modal.sub.userEmail})`} />
            <DetailRow label="Plan" value={modal.sub.planName} />
            <DetailRow label="Status" value={modal.sub.status} />
            <DetailRow label="MRR" value={`$${(modal.sub.monthlyAmount / 100).toFixed(2)}`} />
            <DetailRow label="Period End" value={new Date(modal.sub.currentPeriodEnd).toLocaleDateString()} />
            <DetailRow label="Cancel at Period End" value={modal.sub.cancelAtPeriodEnd ? "Yes" : "No"} />
            <DetailRow label="Stripe Sub ID" value={modal.sub.stripeSubscriptionId} />
            <DetailRow label="User ID" value={modal.sub.userId} />
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setModal({ type: "changePlan", sub: modal.sub })}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90"
            >
              Change plan
            </button>
            {modal.sub.status !== "canceled" && (
              <button
                onClick={() => setModal({ type: "cancel", sub: modal.sub })}
                className="px-3 py-1.5 rounded-lg text-sm font-medium border border-red-400/30 text-red-400 hover:bg-red-400/10"
              >
                Cancel
              </button>
            )}
            <button
              onClick={() => setModal({ type: "refund", sub: modal.sub })}
              className="px-3 py-1.5 rounded-lg text-sm font-medium border border-amber-400/30 text-amber-400 hover:bg-amber-400/10"
            >
              Refund
            </button>
          </div>
        </ModalWrapper>
      )}

      {/* Cancel modal */}
      {modal.type === "cancel" && (
        <CancelModal
          sub={modal.sub}
          isPending={isPending}
          onCancel={(immediate, reason) => handleCancelSubscription(modal.sub, immediate, reason)}
          onClose={() => setModal({ type: "none" })}
        />
      )}

      {/* Change plan modal */}
      {modal.type === "changePlan" && (
        <ChangePlanModal
          sub={modal.sub}
          isPending={isPending}
          onChangePlan={(priceId) => handleChangePlan(modal.sub, priceId)}
          onClose={() => setModal({ type: "none" })}
        />
      )}

      {/* Refund modal */}
      {modal.type === "refund" && (
        <ModalWrapper onClose={() => setModal({ type: "none" })}>
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">Issue Refund</h3>
          <p className="text-sm text-[var(--muted-foreground)] mb-4">
            This will refund the most recent invoice for <strong>{modal.sub.userName}</strong>.
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setModal({ type: "none" })}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-[var(--border)] text-[var(--foreground)]"
            >
              Cancel
            </button>
            <button
              onClick={() => handleRefund(modal.sub)}
              disabled={isPending}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50"
            >
              {isPending ? "Processing..." : "Confirm refund"}
            </button>
          </div>
        </ModalWrapper>
      )}
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="text-xs text-[var(--muted-foreground)] mb-1">{label}</div>
      <div className={`text-xl font-bold ${color ?? "text-[var(--foreground)]"}`}>{value}</div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-[var(--muted-foreground)]">{label}</span>
      <span className="text-[var(--foreground)] font-mono text-xs break-all max-w-[60%] text-right">{value}</span>
    </div>
  );
}

function ModalWrapper({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="rounded-lg bg-[var(--card)] border border-[var(--border)] p-6 max-w-lg w-full max-h-[80vh] overflow-auto">
        <div className="flex justify-end mb-2">
          <button onClick={onClose} className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function CancelModal({
  sub,
  isPending,
  onCancel,
  onClose,
}: {
  sub: SubscriptionRow;
  isPending: boolean;
  onCancel: (immediate: boolean, reason: string) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [immediate, setImmediate] = useState(false);

  return (
    <ModalWrapper onClose={onClose}>
      <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">Cancel Subscription</h3>
      <p className="text-sm text-[var(--muted-foreground)] mb-4">
        Cancel subscription for <strong>{sub.userName}</strong> ({sub.userEmail}).
      </p>
      <div className="space-y-3 mb-4">
        <label className="flex items-center gap-2 text-sm text-[var(--foreground)]">
          <input
            type="checkbox"
            checked={immediate}
            onChange={(e) => setImmediate(e.target.checked)}
            className="rounded"
          />
          Cancel immediately (not at period end)
        </label>
        <textarea
          placeholder="Reason for cancellation..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] text-sm resize-none h-20"
        />
      </div>
      <div className="flex gap-3 justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg text-sm font-medium border border-[var(--border)] text-[var(--foreground)]"
        >
          Back
        </button>
        <button
          onClick={() => onCancel(immediate, reason)}
          disabled={isPending}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
        >
          {isPending ? "Cancelling..." : "Confirm cancel"}
        </button>
      </div>
    </ModalWrapper>
  );
}

function ChangePlanModal({
  sub,
  isPending,
  onChangePlan,
  onClose,
}: {
  sub: SubscriptionRow;
  isPending: boolean;
  onChangePlan: (priceId: string) => void;
  onClose: () => void;
}) {
  const [selectedPriceId, setSelectedPriceId] = useState("");

  // Use NEXT_PUBLIC env vars for price IDs
  const priceOptions = [
    { label: "Standard Monthly", priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STANDARD_MONTHLY ?? "" },
    { label: "Standard Annual", priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STANDARD_ANNUAL ?? "" },
    { label: "Pro Monthly", priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY ?? "" },
    { label: "Pro Annual", priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL ?? "" },
  ].filter((o) => o.priceId);

  return (
    <ModalWrapper onClose={onClose}>
      <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">Change Plan</h3>
      <p className="text-sm text-[var(--muted-foreground)] mb-4">
        Override plan for <strong>{sub.userName}</strong>. Current: {sub.planName}.
      </p>
      <select
        value={selectedPriceId}
        onChange={(e) => setSelectedPriceId(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] text-sm mb-4"
      >
        <option value="">Select a plan...</option>
        {priceOptions.map((o) => (
          <option key={o.priceId} value={o.priceId}>{o.label}</option>
        ))}
      </select>
      <div className="flex gap-3 justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg text-sm font-medium border border-[var(--border)] text-[var(--foreground)]"
        >
          Back
        </button>
        <button
          onClick={() => selectedPriceId && onChangePlan(selectedPriceId)}
          disabled={isPending || !selectedPriceId}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? "Changing..." : "Confirm change"}
        </button>
      </div>
    </ModalWrapper>
  );
}
