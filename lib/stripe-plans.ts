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
    name: "Trial Expired",
    description: "Subscribe to continue using MyOpenBrain",
    monthlyPriceId: "",
    annualPriceId: "",
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      "Read-only access to existing data",
      "Up to 1 Kanban board",
      "10 Open Brain captures",
    ],
    featureMatrix: {
      "Kanban boards": "1 (read-only)",
      "Kanban cards": "Read-only",
      "Open Brain captures": "10/month",
      "Email integrations": false,
      "MCP access": false,
      "AI features": false,
      "Brain Chat": false,
      "Decision Register": false,
      "Meeting search": true,
      "Weekly briefing": false,
      "Daily briefing": false,
      "Priority support": false,
    },
    limits: {
      maxBoards: 1,
      maxCards: 10,
      maxBrainCaptures: 10,
      maxEmailAccounts: 0,
      mcpAccess: "none",
      aiFeatures: false,
    },
  },
  standard: {
    name: "Focus",
    description: "Get organized — email + meetings in one place",
    monthlyPriceId: process.env.STRIPE_PRICE_STANDARD_MONTHLY ?? "",
    annualPriceId: process.env.STRIPE_PRICE_STANDARD_ANNUAL ?? "",
    monthlyPrice: 1900, // $19
    annualPrice: 14900, // $149
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
    featureMatrix: {
      "Kanban boards": "Up to 5",
      "Kanban cards": "Unlimited",
      "Open Brain captures": "500/month",
      "Email integrations": "1 account",
      "MCP access": false,
      "AI features": false,
      "Brain Chat": false,
      "Decision Register": false,
      "Meeting search": true,
      "Weekly briefing": "Basic",
      "Daily briefing": false,
      "Priority support": false,
    },
    limits: {
      maxBoards: 5,
      maxCards: Infinity,
      maxBrainCaptures: 500,
      maxEmailAccounts: 1,
      mcpAccess: "none",
      aiFeatures: false,
    },
  },
  pro: {
    name: "Second Brain",
    description: "Your complete work intelligence system",
    monthlyPriceId: process.env.STRIPE_PRICE_PRO_MONTHLY ?? "",
    annualPriceId: process.env.STRIPE_PRICE_PRO_ANNUAL ?? "",
    monthlyPrice: 3900, // $39
    annualPrice: 34900, // $349
    highlighted: true,
    features: [
      "Unlimited Open Brain captures",
      "3 email accounts",
      "Unlimited Kanban boards & cards",
      "Brain Chat — AI search across everything",
      "Decision Register with full context",
      "Full AI-powered weekly briefing",
      "Daily briefing",
      "Full MCP read/write access",
      "Priority support",
      "Early access to new features",
    ],
    featureMatrix: {
      "Kanban boards": "Unlimited",
      "Kanban cards": "Unlimited",
      "Open Brain captures": "Unlimited",
      "Email integrations": "3 accounts",
      "MCP access": "Read/Write",
      "AI features": true,
      "Brain Chat": "Unlimited",
      "Decision Register": true,
      "Meeting search": true,
      "Weekly briefing": "Full AI synthesis",
      "Daily briefing": true,
      "Priority support": true,
    },
    limits: {
      maxBoards: Infinity,
      maxCards: Infinity,
      maxBrainCaptures: Infinity,
      maxEmailAccounts: 3,
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
  ],
  standard: [
    "meeting_search",
    "kanban_board",
    "email_inbox",
    "weekly_review",
    "decisions",
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
