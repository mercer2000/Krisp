"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { createPortalSession, cancelSubscription, reactivateSubscription, switchPlan } from "./actions";

interface SubscriptionData {
  planName: string;
  planKey: string;
  status: string;
  stripePriceId: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  monthlyAmount: number;
}

interface InvoiceData {
  id: string;
  date: string;
  amount: number;
  status: string;
  pdfUrl: string | null;
}

interface PlanData {
  key: string;
  name: string;
  description: string;
  monthlyPrice: number;
  monthlyPriceId: string | null;
  featureMatrix: Record<string, string | boolean>;
  highlighted: boolean;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "Active" },
  trialing: { bg: "bg-blue-500/10", text: "text-blue-400", label: "Trialing" },
  past_due: { bg: "bg-amber-500/10", text: "text-amber-400", label: "Past Due" },
  canceled: { bg: "bg-red-500/10", text: "text-red-400", label: "Canceled" },
  unpaid: { bg: "bg-red-500/10", text: "text-red-400", label: "Unpaid" },
  incomplete: { bg: "bg-slate-500/10", text: "text-slate-400", label: "Incomplete" },
};

const FEATURE_MATRIX_ROWS = [
  "Kanban boards",
  "Kanban cards",
  "Open Brain captures",
  "Email integrations",
  "MCP access",
  "AI features",
  "Meeting search",
  "Weekly review",
  "Priority support",
  "Early access",
];

export function BillingClient({ userId }: { userId: string }) {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showPlanSelector, setShowPlanSelector] = useState(false);
  const [switchTarget, setSwitchTarget] = useState<PlanData | null>(null);

  const fetchBillingData = useCallback(async () => {
    try {
      const [subRes, invRes, plansRes] = await Promise.all([
        fetch("/api/billing/subscription"),
        fetch("/api/billing/invoices"),
        fetch("/api/billing/plans"),
      ]);
      if (subRes.ok) {
        const data = await subRes.json();
        setSubscription(data.subscription);
      }
      if (invRes.ok) {
        const data = await invRes.json();
        setInvoices(data.invoices ?? []);
      }
      if (plansRes.ok) {
        const data = await plansRes.json();
        setPlans(data.plans ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBillingData();
  }, [fetchBillingData]);

  function handleManagePortal() {
    startTransition(async () => {
      await createPortalSession();
    });
  }

  function handleCancel() {
    startTransition(async () => {
      await cancelSubscription();
      setShowCancelConfirm(false);
      fetchBillingData();
    });
  }

  function handleReactivate() {
    startTransition(async () => {
      await reactivateSubscription();
      fetchBillingData();
    });
  }

  function handleSwitchPlan() {
    if (!switchTarget?.monthlyPriceId) return;
    startTransition(async () => {
      await switchPlan(switchTarget.monthlyPriceId!);
      setSwitchTarget(null);
      setShowPlanSelector(false);
      fetchBillingData();
    });
  }

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-6">Billing</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-lg bg-[var(--muted)] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const currentPlanKey = subscription?.planKey ?? "free";
  const statusInfo = subscription
    ? (STATUS_COLORS[subscription.status] ?? STATUS_COLORS.incomplete)
    : null;

  const planOrder = plans.length > 0 ? plans : [];
  const currentPlanIndex = planOrder.findIndex((p) => p.key === currentPlanKey);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-6">Billing</h1>

      {/* Past due banner */}
      {subscription?.status === "past_due" && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-amber-400">Payment past due</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Update your payment method to avoid losing access.
            </p>
          </div>
          <button
            onClick={handleManagePortal}
            disabled={isPending}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-50"
          >
            Update payment
          </button>
        </div>
      )}

      {/* Subscription status card */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                {subscription ? `${subscription.planName} Plan` : "Free Plan"}
              </h2>
              {statusInfo && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.text}`}>
                  {statusInfo.label}
                </span>
              )}
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">
              {subscription
                ? `$${(subscription.monthlyAmount / 100).toFixed(2)}/mo`
                : "Free — no charge"}
            </p>
            {subscription && (
              <p className="text-sm text-[var(--muted-foreground)] mt-1">
                {subscription.cancelAtPeriodEnd
                  ? `Access until ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                  : `Next billing date: ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`}
              </p>
            )}
            {subscription?.cancelAtPeriodEnd && (
              <p className="text-sm text-amber-500 mt-2">
                Your subscription will end at the current period. You can reactivate anytime before then.
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPlanSelector(true)}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
            >
              Select plan
            </button>
            {subscription && (
              <>
                {subscription.cancelAtPeriodEnd ? (
                  <button
                    onClick={handleReactivate}
                    disabled={isPending}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    Reactivate
                  </button>
                ) : (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    disabled={isPending}
                    className="px-4 py-2 rounded-lg text-sm font-medium border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--destructive)] hover:border-[var(--destructive)] transition-colors disabled:opacity-50"
                  >
                    Cancel plan
                  </button>
                )}
                <button
                  onClick={handleManagePortal}
                  disabled={isPending}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  Manage billing
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Cancel confirmation modal */}
      {showCancelConfirm && subscription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="rounded-lg bg-[var(--card)] border border-[var(--border)] p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
              Cancel subscription?
            </h3>
            <p className="text-sm text-[var(--muted-foreground)] mb-4">
              Your access will continue until{" "}
              {new Date(subscription.currentPeriodEnd).toLocaleDateString()}.
              After that, you&apos;ll be on the Free plan.
            </p>
            <div className="text-sm text-[var(--muted-foreground)] mb-6">
              <p className="font-medium text-[var(--foreground)] mb-2">You&apos;ll lose access to:</p>
              <ul className="space-y-1 ml-4">
                {currentPlanKey === "pro" && (
                  <>
                    <li>- AI features (Brain chat, daily briefing, etc.)</li>
                    <li>- Full MCP read/write access</li>
                    <li>- Priority support</li>
                  </>
                )}
                {(currentPlanKey === "pro" || currentPlanKey === "standard") && (
                  <>
                    <li>- Unlimited boards and cards</li>
                    <li>- Extra email integrations</li>
                  </>
                )}
              </ul>
              <p className="mt-2 text-xs">Your existing data will remain accessible in read-only mode.</p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
              >
                Keep plan
              </button>
              <button
                onClick={handleCancel}
                disabled={isPending}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--destructive)] text-[var(--destructive-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isPending ? "Cancelling..." : "Cancel subscription"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plan selector modal */}
      {showPlanSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="rounded-lg bg-[var(--card)] border border-[var(--border)] p-6 max-w-4xl w-full max-h-[85vh] overflow-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-[var(--foreground)]">
                Select Plan
              </h3>
              <button
                onClick={() => setShowPlanSelector(false)}
                className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Plan columns */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {planOrder.map((plan, idx) => {
                const isCurrent = plan.key === currentPlanKey;
                const isUpgrade = idx > currentPlanIndex;
                const isDowngrade = idx < currentPlanIndex;
                const price = plan.monthlyPrice
                  ? `$${(plan.monthlyPrice / 100).toFixed(0)}`
                  : "$0";

                return (
                  <div
                    key={plan.key}
                    className={`relative rounded-xl border p-5 flex flex-col ${
                      isCurrent
                        ? "border-[var(--primary)] bg-[var(--primary)]/5"
                        : plan.highlighted
                        ? "border-[var(--primary)]/40 bg-[var(--card)]"
                        : "border-[var(--border)] bg-[var(--card)]"
                    }`}
                  >
                    {isCurrent && (
                      <span className="absolute -top-2.5 left-4 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--primary)] text-[var(--primary-foreground)]">
                        Current plan
                      </span>
                    )}
                    <h4 className="text-base font-semibold text-[var(--foreground)] mb-1">
                      {plan.name}
                    </h4>
                    <p className="text-xs text-[var(--muted-foreground)] mb-3">
                      {plan.description}
                    </p>
                    <div className="mb-4">
                      <span className="text-2xl font-bold text-[var(--foreground)]">
                        {price}
                      </span>
                      <span className="text-sm text-[var(--muted-foreground)]">/mo</span>
                    </div>

                    {/* Feature list */}
                    <ul className="flex-1 space-y-2 mb-5">
                      {FEATURE_MATRIX_ROWS.map((feature) => {
                        const val = plan.featureMatrix[feature];
                        const enabled = val !== false;
                        return (
                          <li key={feature} className="flex items-start gap-2 text-xs">
                            {enabled ? (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400 shrink-0 mt-0.5">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            ) : (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--muted-foreground)]/40 shrink-0 mt-0.5">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            )}
                            <span className={enabled ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]"}>
                              {typeof val === "string" ? `${feature}: ${val}` : feature}
                            </span>
                          </li>
                        );
                      })}
                    </ul>

                    {/* Choose Plan button */}
                    {isCurrent ? (
                      <button
                        disabled
                        className="w-full py-2.5 rounded-lg text-sm font-medium border border-[var(--border)] text-[var(--muted-foreground)] cursor-default"
                      >
                        Current plan
                      </button>
                    ) : plan.key === "free" ? (
                      <button
                        onClick={() => {
                          setShowPlanSelector(false);
                          setShowCancelConfirm(true);
                        }}
                        className="w-full py-2.5 rounded-lg text-sm font-medium border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
                      >
                        Downgrade to Free
                      </button>
                    ) : (
                      <button
                        onClick={() => setSwitchTarget(plan)}
                        disabled={isPending}
                        className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                          isUpgrade
                            ? "bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90"
                            : "border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)]"
                        }`}
                      >
                        {isUpgrade ? `Upgrade to ${plan.name}` : isDowngrade ? `Switch to ${plan.name}` : `Choose ${plan.name}`}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Switch plan confirmation modal */}
      {switchTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="rounded-lg bg-[var(--card)] border border-[var(--border)] p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
              Switch to {switchTarget.name} plan?
            </h3>
            <p className="text-sm text-[var(--muted-foreground)] mb-4">
              {subscription
                ? `Your plan will change from ${subscription.planName} to ${switchTarget.name}. Any price difference will be prorated on your next invoice.`
                : `You'll be subscribed to the ${switchTarget.name} plan at $${(switchTarget.monthlyPrice / 100).toFixed(2)}/mo.`}
            </p>
            <div className="rounded-lg bg-[var(--muted)] p-3 mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--muted-foreground)]">New plan</span>
                <span className="font-medium text-[var(--foreground)]">{switchTarget.name}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-[var(--muted-foreground)]">Price</span>
                <span className="font-medium text-[var(--foreground)]">
                  ${(switchTarget.monthlyPrice / 100).toFixed(2)}/mo
                </span>
              </div>
              {subscription && (
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-[var(--muted-foreground)]">Billing</span>
                  <span className="text-xs text-[var(--muted-foreground)]">Prorated</span>
                </div>
              )}
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setSwitchTarget(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSwitchPlan}
                disabled={isPending}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isPending ? "Switching..." : `Confirm switch to ${switchTarget.name}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoices */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
          Invoice history
        </h2>
        {invoices.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">
            {!subscription ? "No invoices — you\u2019re on the Free plan." : "No invoices yet."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-2 text-[var(--muted-foreground)] font-medium">Date</th>
                  <th className="text-left py-2 text-[var(--muted-foreground)] font-medium">Amount</th>
                  <th className="text-left py-2 text-[var(--muted-foreground)] font-medium">Status</th>
                  <th className="text-right py-2 text-[var(--muted-foreground)] font-medium">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="py-3 text-[var(--foreground)]">
                      {new Date(inv.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 text-[var(--foreground)]">
                      ${(inv.amount / 100).toFixed(2)}
                    </td>
                    <td className="py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        inv.status === "paid"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : inv.status === "open"
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-red-500/10 text-red-400"
                      }`}>
                        {inv.status === "paid" ? "Paid" : inv.status === "open" ? "Open" : "Failed"}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {inv.pdfUrl && (
                        <a
                          href={inv.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--primary)] hover:underline text-xs"
                        >
                          Download PDF
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
