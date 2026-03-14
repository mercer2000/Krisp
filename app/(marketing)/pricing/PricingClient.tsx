"use client";

import { useState, useTransition } from "react";
import { createCheckoutSession } from "./actions";

const PLANS = [
  {
    key: "standard",
    name: "Focus",
    description: "Get organized — email + meetings in one place",
    monthlyPrice: 19,
    annualPrice: 149,
    monthlyPriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STANDARD_MONTHLY ?? "",
    annualPriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STANDARD_ANNUAL ?? "",
    features: [
      "500 Open Brain captures/mo",
      "1 email account",
      "5 Kanban boards",
      "Unlimited cards",
      "Meeting recording & transcription",
      "Email classification & action items",
      "Basic weekly briefing",
      "Email support",
    ],
  },
  {
    key: "pro",
    name: "Second Brain",
    description: "Your complete work intelligence system",
    monthlyPrice: 39,
    annualPrice: 349,
    monthlyPriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY ?? "",
    annualPriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL ?? "",
    highlighted: true,
    features: [
      "Unlimited Open Brain captures",
      "3 email accounts",
      "Unlimited boards & cards",
      "Brain Chat — AI search across everything",
      "Decision Register with full context",
      "Full AI-powered weekly briefing",
      "Daily briefing",
      "Full MCP read/write access",
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
    const priceId = annual ? plan.annualPriceId : plan.monthlyPriceId;
    if (!priceId) return;
    setLoadingPlan(plan.key);
    startTransition(async () => {
      await createCheckoutSession(priceId);
    });
  }

  return (
    <div>
      {/* Founder's pricing banner */}
      <div className="flex items-center justify-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
          </span>
          <span className="text-sm font-medium text-amber-400">
            Founder&apos;s Pricing — lock in your rate for life
          </span>
        </div>
      </div>

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
            Save up to 25%
          </span>
        )}
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
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
              <span className="text-4xl font-bold text-white">
                ${annual ? Math.round(plan.annualPrice / 12) : plan.monthlyPrice}
              </span>
              <span className="text-slate-400 text-sm">/mo</span>
              {annual && (
                <div className="text-xs text-slate-500 mt-1">
                  ${plan.annualPrice}/yr billed annually
                </div>
              )}
            </div>
            <button
              onClick={() => handleSubscribe(plan)}
              disabled={isPending}
              className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 ${
                plan.highlighted
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-slate-700 text-white hover:bg-slate-600"
              }`}
            >
              {isPending && loadingPlan === plan.key
                ? "Redirecting..."
                : "Start 14-day free trial"}
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

      {/* Guarantee */}
      <div className="mt-12 max-w-2xl mx-auto">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-emerald-400"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            <h3 className="text-base font-semibold text-emerald-400">
              The &ldquo;3 Hours Back&rdquo; Guarantee
            </h3>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed max-w-lg mx-auto">
            If you don&apos;t save at least 3 hours in your first week, cancel
            instantly — no questions asked.
          </p>
        </div>
      </div>

      {/* Competitor comparison */}
      <div className="mt-16 max-w-2xl mx-auto text-center">
        <h3 className="text-lg font-semibold text-white mb-6">
          Compare what you&apos;d pay elsewhere
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-4">
            <p className="text-slate-400 mb-1">SaneBox</p>
            <p className="text-white font-semibold">$7–36/mo</p>
            <p className="text-xs text-slate-500 mt-1">Email sorting only</p>
          </div>
          <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-4">
            <p className="text-slate-400 mb-1">Fyxer</p>
            <p className="text-white font-semibold">$30–50/mo</p>
            <p className="text-xs text-slate-500 mt-1">Email + notes</p>
          </div>
          <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-4">
            <p className="text-slate-400 mb-1">Superhuman</p>
            <p className="text-white font-semibold">$25–33/mo</p>
            <p className="text-xs text-slate-500 mt-1">Email client</p>
          </div>
          <div className="rounded-lg border border-blue-500/30 bg-blue-500/[0.06] p-4">
            <p className="text-blue-400 mb-1">MyOpenBrain</p>
            <p className="text-white font-semibold">$19–39/mo</p>
            <p className="text-xs text-blue-400/70 mt-1">All 6 tools in one</p>
          </div>
        </div>
      </div>
    </div>
  );
}
