// Plan configuration — maps Stripe Price IDs to features and display info.
// Price IDs are read from env vars so pricing can change without code deploys.

export type PlanKey = "free" | "standard" | "pro";

export interface PlanConfig {
  name: string;
  description: string;
  monthlyPriceId: string;
  annualPriceId: string;
  monthlyPrice: number; // cents
  annualPrice: number; // cents
  features: string[];
  featureMatrix: Record<string, string | boolean>;
  limits: {
    maxBoards: number;
    maxCards: number;
    maxBrainCaptures: number;
    maxEmailAccounts: number;
    mcpAccess: "none" | "read" | "read_write";
    aiFeatures: boolean;
  };
  highlighted?: boolean;
}

export const PLANS: Record<PlanKey, PlanConfig> = {
  free: {
    name: "Free",
    description: "Get started with the basics",
    monthlyPriceId: "",
    annualPriceId: "",
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      "Up to 3 Kanban boards",
      "Up to 50 cards",
      "100 Open Brain captures",
      "1 email account",
      "Community support",
    ],
    featureMatrix: {
      "Kanban boards": "Up to 3",
      "Kanban cards": "Up to 50",
      "Open Brain captures": "100/month",
      "Email integrations": "1 account",
      "MCP access": false,
      "AI features": false,
      "Meeting search": true,
      "Weekly review": true,
      "Priority support": false,
      "Early access": false,
    },
    limits: {
      maxBoards: 3,
      maxCards: 50,
      maxBrainCaptures: 100,
      maxEmailAccounts: 1,
      mcpAccess: "none",
      aiFeatures: false,
    },
  },
  standard: {
    name: "Standard",
    description: "For professionals who need more",
    monthlyPriceId: process.env.STRIPE_PRICE_STANDARD_MONTHLY ?? "",
    annualPriceId: process.env.STRIPE_PRICE_STANDARD_ANNUAL ?? "",
    monthlyPrice: 1200, // $12
    annualPrice: 9900, // $99
    highlighted: true,
    features: [
      "Unlimited boards & cards",
      "1,000 Open Brain captures/mo",
      "2 email integrations",
      "MCP read access",
      "Email support",
    ],
    featureMatrix: {
      "Kanban boards": "Unlimited",
      "Kanban cards": "Unlimited",
      "Open Brain captures": "1,000/month",
      "Email integrations": "2 accounts",
      "MCP access": "Read",
      "AI features": false,
      "Meeting search": true,
      "Weekly review": true,
      "Priority support": false,
      "Early access": false,
    },
    limits: {
      maxBoards: Infinity,
      maxCards: Infinity,
      maxBrainCaptures: 1000,
      maxEmailAccounts: 2,
      mcpAccess: "read",
      aiFeatures: false,
    },
  },
  pro: {
    name: "Pro",
    description: "Unlock everything",
    monthlyPriceId: process.env.STRIPE_PRICE_PRO_MONTHLY ?? "",
    annualPriceId: process.env.STRIPE_PRICE_PRO_ANNUAL ?? "",
    monthlyPrice: 2900, // $29
    annualPrice: 24900, // $249
    features: [
      "Unlimited everything",
      "All email integrations",
      "Full MCP read/write",
      "AI features unlocked",
      "Priority support",
      "Early access to new features",
    ],
    featureMatrix: {
      "Kanban boards": "Unlimited",
      "Kanban cards": "Unlimited",
      "Open Brain captures": "Unlimited",
      "Email integrations": "All (Exchange + Gmail)",
      "MCP access": "Read/Write",
      "AI features": true,
      "Meeting search": true,
      "Weekly review": true,
      "Priority support": true,
      "Early access": true,
    },
    limits: {
      maxBoards: Infinity,
      maxCards: Infinity,
      maxBrainCaptures: Infinity,
      maxEmailAccounts: Infinity,
      mcpAccess: "read_write",
      aiFeatures: true,
    },
  },
};

export const PLAN_ORDER: PlanKey[] = ["free", "standard", "pro"];

// Map a Stripe price ID to its plan key
export function getPlanByPriceId(priceId: string): { key: PlanKey; plan: PlanConfig } | null {
  for (const [key, plan] of Object.entries(PLANS)) {
    if (plan.monthlyPriceId === priceId || plan.annualPriceId === priceId) {
      return { key: key as PlanKey, plan };
    }
  }
  return null;
}

// Resolve a user's effective plan key from their price ID (free if none)
export function resolvePlanKey(stripePriceId: string | null): PlanKey {
  if (!stripePriceId) return "free";
  const found = getPlanByPriceId(stripePriceId);
  return found?.key ?? "free";
}

// Feature access by plan tier — higher tiers include all lower-tier features
const PLAN_FEATURES: Record<PlanKey, string[]> = {
  free: [
    "meeting_search",
    "kanban_board",
    "email_inbox",
    "weekly_review",
    "decisions",
  ],
  standard: [
    "meeting_search",
    "kanban_board",
    "email_inbox",
    "weekly_review",
    "decisions",
    "mcp_read",
  ],
  pro: [
    "meeting_search",
    "kanban_board",
    "email_inbox",
    "weekly_review",
    "decisions",
    "mcp_read",
    "mcp_write",
    "brain_chat",
    "ai_features",
    "advanced_analytics",
    "custom_prompts",
    "api_access",
    "priority_support",
    "custom_integrations",
    "zapier_webhooks",
    "daily_briefing",
    "decision_register",
  ],
};

export function getFeaturesForPlan(planKey: PlanKey): string[] {
  return PLAN_FEATURES[planKey] ?? [];
}

export function getFeaturesForPriceId(priceId: string): string[] {
  const found = getPlanByPriceId(priceId);
  if (!found) return PLAN_FEATURES.free;
  return PLAN_FEATURES[found.key] ?? [];
}

export function hasFeatureAccess(priceId: string, feature: string): boolean {
  return getFeaturesForPriceId(priceId).includes(feature);
}

// Get the plan required for a given feature
export function getRequiredPlanForFeature(feature: string): PlanKey {
  for (const key of PLAN_ORDER) {
    if (PLAN_FEATURES[key].includes(feature)) return key;
  }
  return "pro";
}
