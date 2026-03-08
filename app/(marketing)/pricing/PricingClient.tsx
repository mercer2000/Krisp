"use client";

import { useState, useTransition } from "react";
import { createCheckoutSession } from "./actions";

const PLANS = [
  {
    key: "free",
    name: "Free",
    description: "Get started with the basics",
    monthlyPrice: 0,
    annualPrice: 0,
    monthlyPriceId: "",
    annualPriceId: "",
    features: [
      "Up to 3 Kanban boards",
      "Up to 50 cards",
      "100 Open Brain captures",
      "1 email account",
      "Community support",
    ],
  },
  {
    key: "standard",
    name: "Standard",
    description: "For professionals who need more",
    monthlyPrice: 12,
    annualPrice: 99,
    monthlyPriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STANDARD_MONTHLY ?? "",
    annualPriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STANDARD_ANNUAL ?? "",
    highlighted: true,
    features: [
      "Unlimited boards & cards",
      "1,000 Open Brain captures/mo",
      "2 email integrations",
      "MCP read access",
      "Email support",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    description: "Unlock everything",
    monthlyPrice: 29,
    annualPrice: 249,
    monthlyPriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY ?? "",
    annualPriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL ?? "",
    features: [
      "Unlimited everything",
      "All email integrations",
      "Full MCP read/write",
      "AI features unlocked",
      "Priority support",
      "Early access to new features",
    ],
  },
];

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400 flex-shrink-0 mt-0.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function PricingClient() {
  const [annual, setAnnual] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  function handleSubscribe(plan: (typeof PLANS)[number]) {
    if (plan.key === "free") return; // No checkout needed for free
    const priceId = annual ? plan.annualPriceId : plan.monthlyPriceId;
    if (!priceId) return;
    setLoadingPlan(plan.key);
    startTransition(async () => {
      await createCheckoutSession(priceId);
    });
  }

  return (
    <div>
      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-3 mb-12">
        <span className={`text-sm font-medium ${!annual ? "text-white" : "text-slate-400"}`}>
          Monthly
        </span>
        <button
          onClick={() => setAnnual(!annual)}
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
            annual ? "bg-blue-500" : "bg-slate-700"
          }`}
          aria-label="Toggle annual billing"
        >
          <span
            className={`inline-block h-5 w-5 rounded-full bg-white transition-transform ${
              annual ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
        <span className={`text-sm font-medium ${annual ? "text-white" : "text-slate-400"}`}>
          Annual
        </span>
        {annual && (
          <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Save 30%
          </span>
        )}
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {PLANS.map((plan) => (
          <div
            key={plan.key}
            className={`relative rounded-xl p-6 text-left ${
              plan.highlighted
                ? "bg-slate-800/80 border-2 border-blue-500/40 shadow-lg shadow-blue-500/5"
                : "bg-slate-800/40 border border-slate-700/50"
            }`}
          >
            {plan.highlighted && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-500 text-white">
                  Most popular
                </span>
              </div>
            )}
            <h3 className="text-lg font-semibold text-white mb-1">
              {plan.name}
            </h3>
            <p className="text-sm text-slate-400 mb-4">{plan.description}</p>
            <div className="mb-6">
              {plan.monthlyPrice === 0 ? (
                <span className="text-4xl font-bold text-white">Free</span>
              ) : (
                <>
                  <span className="text-4xl font-bold text-white">
                    ${annual ? Math.round(plan.annualPrice / 12) : plan.monthlyPrice}
                  </span>
                  <span className="text-slate-400 text-sm">/mo</span>
                  {annual && (
                    <div className="text-xs text-slate-500 mt-1">
                      ${plan.annualPrice}/yr billed annually
                    </div>
                  )}
                </>
              )}
            </div>
            <button
              onClick={() => handleSubscribe(plan)}
              disabled={isPending || plan.key === "free"}
              className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 ${
                plan.key === "free"
                  ? "bg-slate-700/50 text-slate-400 cursor-default"
                  : plan.highlighted
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-slate-700 text-white hover:bg-slate-600"
              }`}
            >
              {plan.key === "free"
                ? "Current default"
                : isPending && loadingPlan === plan.key
                ? "Redirecting..."
                : "Get started"}
            </button>
            <ul className="mt-6 space-y-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-slate-300">
                  <CheckIcon />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
