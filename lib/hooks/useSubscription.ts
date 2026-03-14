"use client";

import { useCallback, useEffect, useState } from "react";
import type { PlanKey } from "@/lib/stripe-plans";

// Feature lists duplicated here for client-side use to avoid importing
// server-only code with env var references.
const PLAN_FEATURES: Record<PlanKey, string[]> = {
  free: ["meeting_search", "kanban_board", "email_inbox", "weekly_review", "decisions"],
  standard: ["meeting_search", "kanban_board", "email_inbox", "weekly_review", "decisions", "mcp_read"],
  pro: [
    "meeting_search", "kanban_board", "email_inbox", "weekly_review", "decisions",
    "mcp_read", "mcp_write", "brain_chat", "ai_features", "advanced_analytics",
    "custom_prompts", "api_access", "priority_support", "custom_integrations",
    "zapier_webhooks", "daily_briefing", "decision_register",
  ],
};

export interface SubscriptionInfo {
  planKey: PlanKey;
  planName: string;
  status: string | null;
  stripePriceId: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  monthlyAmount: number;
  isActive: boolean;
  trialEnd: string | null;
}

const DEFAULT_INFO: SubscriptionInfo = {
  planKey: "free",
  planName: "Free",
  status: null,
  stripePriceId: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  monthlyAmount: 0,
  isActive: true,
  trialEnd: null,
};

export function useSubscription() {
  const [data, setData] = useState<SubscriptionInfo>(DEFAULT_INFO);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      const res = await fetch("/api/billing/subscription");
      if (!res.ok) throw new Error("Failed to fetch subscription");
      const json = await res.json();

      if (json.subscription) {
        setData({
          planKey: json.subscription.planKey ?? "free",
          planName: json.subscription.planName ?? "Free",
          status: json.subscription.status,
          stripePriceId: json.subscription.stripePriceId,
          currentPeriodEnd: json.subscription.currentPeriodEnd,
          cancelAtPeriodEnd: json.subscription.cancelAtPeriodEnd ?? false,
          monthlyAmount: json.subscription.monthlyAmount ?? 0,
          isActive: true,
          trialEnd: json.subscription.trialEnd ?? null,
        });
      } else {
        setData(DEFAULT_INFO);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setData(DEFAULT_INFO);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const hasFeature = useCallback(
    (feature: string): boolean => {
      const features = PLAN_FEATURES[data.planKey] ?? PLAN_FEATURES.free;
      return features.includes(feature);
    },
    [data.planKey]
  );

  return { ...data, loading, error, refetch, hasFeature };
}
