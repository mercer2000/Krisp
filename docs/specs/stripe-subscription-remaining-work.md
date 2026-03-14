# Stripe Subscription — Remaining Work

Status audit as of 2026-03-14.

---

## What's Working

| Area | Status | Files |
|------|--------|-------|
| Stripe client init | Done | `lib/stripe.ts` |
| Plan config (Focus $19, Second Brain $39) | Done | `lib/stripe-plans.ts` |
| Checkout with 14-day trial | Done | `app/(marketing)/pricing/actions.ts`, `app/(app)/billing/actions.ts` |
| Webhook handler (6 events) | Done | `app/api/webhooks/stripe/route.ts` |
| Subscription CRUD in DB | Done | `lib/db/schema.ts` (subscriptions table) |
| Billing UI with trial banner | Done | `app/(app)/billing/BillingClient.tsx` |
| Cancel / reactivate / switch plan | Done | `app/(app)/billing/actions.ts` |
| Stripe customer portal | Done | `app/(app)/billing/actions.ts` |
| Billing emails (6 templates) | Done | `lib/billing-emails.ts` |
| Access helpers (`hasActiveAccess`, `hasAccess`) | Done | `lib/access.ts` |
| Feature gate functions (`requireFeature`, `requirePlan`) | Built, unused | `lib/subscription-gate.ts` |
| Idempotent webhook processing | Done | `stripeWebhookEvents` table |
| RLS on subscriptions table | Done | Schema uses `crudPolicy` |
| Webhook bypasses RLS correctly | Done | Uses plain `db` (owner role), not `getAuthDb()` |

---

## Remaining Work

### 1. Feature Gating — Not Enforced (HIGH)

`requireFeature()` and `requirePlan()` exist in `lib/subscription-gate.ts` but **zero API routes call them**. Every authenticated user can access all features regardless of plan.

Routes that need gating:

| Feature Key | Routes | Required Plan |
|-------------|--------|---------------|
| `brain_chat` | `app/api/brain/chat/route.ts`, `app/api/brain/sessions/*/route.ts` | pro |
| `decision_register` | `app/api/decisions/route.ts`, `app/api/decisions/[id]/route.ts`, `app/api/decisions/extract/route.ts` | pro |
| `daily_briefing` | `app/api/daily-briefing/route.ts`, `app/api/cron/daily-briefing/route.ts` | pro |
| `zapier_webhooks` | `app/api/integrations/zapier/*/route.ts` | pro |
| `email_inbox` | `app/api/emails/route.ts` (write/sync operations) | standard |
| `weekly_review` | `app/api/weekly-plans/*/route.ts` | standard |

Usage pattern (already built):
```ts
export async function POST(req: Request) {
  const gate = await requireFeature("brain_chat");
  if (gate) return gate; // returns 403 with upgrade info
  // ... handler logic
}
```

Limit enforcement (boards, cards, captures) also needs implementation — `PLANS[key].limits` is defined but not checked.

### 2. Trial Abuse Prevention (HIGH)

Both checkout entry points unconditionally set `trial_period_days: 14`. A user can cancel, then re-subscribe and get another 14-day trial.

**Fix options (pick one):**

A. **Check for existing subscription before offering trial** — query the `subscriptions` table for any previous record for the user (including canceled). If found, omit `trial_period_days`.

B. **Use Stripe customer metadata** — set `metadata.has_trialed = "true"` on the Stripe customer after first checkout. Check it before creating the next checkout session.

C. **Configure in Stripe Dashboard** — use Stripe's built-in "first subscription only" trial setting on each price (Price → Subscription settings → Free trial days). This moves trial logic entirely to Stripe.

Files to change: `app/(marketing)/pricing/actions.ts:52`, `app/(app)/billing/actions.ts:152`

### 3. Environment Variables Not Documented (HIGH)

`.env.example` is missing all Stripe variables. Anyone setting up the project will have a broken billing flow.

Add to `.env.example`:
```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STANDARD_MONTHLY=price_...
STRIPE_PRICE_STANDARD_ANNUAL=price_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_ANNUAL=price_...
NEXT_PUBLIC_STRIPE_PRICE_STANDARD_MONTHLY=price_...
NEXT_PUBLIC_STRIPE_PRICE_STANDARD_ANNUAL=price_...
NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY=price_...
NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL=price_...
```

### 4. Stripe Products/Prices Not Created (SETUP)

Before billing works, you need to create these in the Stripe Dashboard (or via API):

1. **Product: "Focus"** with two prices — $19/mo recurring, $149/yr recurring
2. **Product: "Second Brain"** with two prices — $39/mo recurring, $349/yr recurring
3. Copy each price ID into the env vars above
4. **Configure the Customer Portal** — Stripe Dashboard → Settings → Billing → Customer portal. Enable: invoice history, payment method updates, subscription cancellation.
5. **Register webhook endpoint** — Stripe Dashboard → Developers → Webhooks. URL: `https://yourdomain.com/api/webhooks/stripe`. Events to subscribe:
   - `checkout.session.completed`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.trial_will_end`

### 5. Client-Side Feature Gating (MEDIUM)

The SideNav shows all nav items regardless of plan. Premium features (Brain Chat, Decisions, Daily Briefing) should either be hidden or show an upgrade prompt for users on lower-tier plans. The `useSubscription()` hook already exposes `hasFeature()` for this.

### 6. Hardcoded Trial Duration (LOW)

`14` is hardcoded in two files. Consider an env var `TRIAL_PERIOD_DAYS=14` or a constant in `lib/stripe-plans.ts` for single-source-of-truth.

---

## How to Test Locally

### Prerequisites

1. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli)
2. Create a Stripe account (test mode is fine)
3. Create test products and prices in the Dashboard
4. Set all env vars in `.env.local`

### Webhook Forwarding

```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the webhook signing secret (`whsec_...`) into `STRIPE_WEBHOOK_SECRET` in `.env.local`.

### Manual Test Scenarios

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 1 | New user checkout | Go to `/pricing` → click "Start 14-day free trial" → complete Stripe checkout with test card `4242 4242 4242 4242` | Subscription created with `status: trialing`. Trial banner shows in app. Billing page shows "First billing date". |
| 2 | Trial countdown | After checkout, visit `/settings/billing` | Blue trial banner with days remaining. Status badge shows "Trialing". |
| 3 | Trial-to-paid conversion | In Stripe CLI: `stripe trigger invoice.paid` or wait for trial to end (use `stripe subscriptions update <sub_id> --trial-end now` to force) | Status changes to `active`. Trial banner disappears. Invoice appears in history. |
| 4 | Trial ending email | `stripe trigger customer.subscription.trial_will_end` | Email sent with days remaining. |
| 5 | Payment failure | Use test card `4000 0000 0000 0341` for the checkout | Status changes to `past_due`. Amber banner appears. Payment failed email sent. |
| 6 | Cancel subscription | Billing page → "Cancel plan" → confirm | `cancelAtPeriodEnd: true`. Shows "Access until [date]" with reactivate button. |
| 7 | Reactivate | After canceling, click "Reactivate" | `cancelAtPeriodEnd: false`. Normal billing resumes. |
| 8 | Switch plan | Billing page → "Select plan" → choose different tier | Price changes. Prorated invoice created. |
| 9 | Manage billing portal | Billing page → "Manage billing" | Redirects to Stripe portal. Can update card, view invoices. |
| 10 | Webhook idempotency | Send same webhook event twice | Second time is a no-op (returns `{ received: true }` without processing). |

### Useful Stripe CLI Commands

```bash
# Trigger specific events
stripe trigger checkout.session.completed
stripe trigger invoice.paid
stripe trigger invoice.payment_failed
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
stripe trigger customer.subscription.trial_will_end

# End a trial immediately (forces conversion)
stripe subscriptions update sub_xxx --trial-end now

# List recent events
stripe events list --limit 5

# View a specific subscription
stripe subscriptions retrieve sub_xxx
```

### Test Card Numbers

| Card | Behavior |
|------|----------|
| `4242 4242 4242 4242` | Succeeds |
| `4000 0000 0000 3220` | Requires 3D Secure |
| `4000 0000 0000 0341` | Attaches but first charge fails |
| `4000 0000 0000 9995` | Always declines |

---

## Writing Tests

Vitest is already configured (`vitest.config.ts`, tests in `__tests__/`). The billing logic is well-suited for unit testing because the core functions are pure or have clear DB boundaries.

### What to Test

#### 1. Plan Resolution (pure functions, no mocking needed)

```ts
// __tests__/billing/stripe-plans.test.ts
import { describe, it, expect, vi } from "vitest";
import {
  resolvePlanKey,
  hasFeatureAccess,
  getRequiredPlanForFeature,
  getFeaturesForPlan,
  PLANS,
} from "@/lib/stripe-plans";

describe("resolvePlanKey", () => {
  it("returns free for null price ID", () => {
    expect(resolvePlanKey(null)).toBe("free");
  });
  it("returns free for unknown price ID", () => {
    expect(resolvePlanKey("price_unknown")).toBe("free");
  });
  it("resolves standard monthly", () => {
    const priceId = PLANS.standard.monthlyPriceId;
    if (priceId) expect(resolvePlanKey(priceId)).toBe("standard");
  });
});

describe("hasFeatureAccess", () => {
  it("free plan has meeting_search", () => {
    expect(hasFeatureAccess("", "meeting_search")).toBe(true);
  });
  it("free plan lacks brain_chat", () => {
    expect(hasFeatureAccess("", "brain_chat")).toBe(false);
  });
});

describe("getRequiredPlanForFeature", () => {
  it("brain_chat requires pro", () => {
    expect(getRequiredPlanForFeature("brain_chat")).toBe("pro");
  });
  it("email_inbox requires standard", () => {
    expect(getRequiredPlanForFeature("email_inbox")).toBe("standard");
  });
});

describe("getFeaturesForPlan", () => {
  it("pro includes all standard features", () => {
    const standard = getFeaturesForPlan("standard");
    const pro = getFeaturesForPlan("pro");
    standard.forEach((f) => expect(pro).toContain(f));
  });
});
```

#### 2. Access Logic (pure functions)

```ts
// __tests__/billing/access.test.ts
import { describe, it, expect } from "vitest";
import { hasActiveAccess } from "@/lib/access";
import type { UserSubscription } from "@/lib/access";

const baseSub: UserSubscription = {
  stripeSubscriptionId: "sub_test",
  stripePriceId: "price_test",
  stripeCurrentPeriodEnd: new Date(Date.now() + 86400000), // tomorrow
  status: "active",
  cancelAtPeriodEnd: false,
};

describe("hasActiveAccess", () => {
  it("returns false for null subscription", () => {
    expect(hasActiveAccess(null)).toBe(false);
  });

  it("returns true for active subscription with future period end", () => {
    expect(hasActiveAccess(baseSub)).toBe(true);
  });

  it("returns true for trialing subscription", () => {
    expect(hasActiveAccess({ ...baseSub, status: "trialing" })).toBe(true);
  });

  it("returns false for active subscription with expired period", () => {
    const expired = { ...baseSub, stripeCurrentPeriodEnd: new Date(Date.now() - 86400000) };
    expect(hasActiveAccess(expired)).toBe(false);
  });

  it("returns false for canceled subscription", () => {
    expect(hasActiveAccess({ ...baseSub, status: "canceled" })).toBe(false);
  });

  it("allows past_due within 3-day grace period", () => {
    const pastDue = {
      ...baseSub,
      status: "past_due" as const,
      stripeCurrentPeriodEnd: new Date(Date.now() - 86400000), // 1 day ago
    };
    expect(hasActiveAccess(pastDue)).toBe(true); // within 3 day grace
  });

  it("denies past_due after grace period", () => {
    const pastDue = {
      ...baseSub,
      status: "past_due" as const,
      stripeCurrentPeriodEnd: new Date(Date.now() - 5 * 86400000), // 5 days ago
    };
    expect(hasActiveAccess(pastDue)).toBe(false);
  });
});
```

#### 3. Webhook Handler (requires mocking Stripe + DB)

```ts
// __tests__/billing/webhook.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock stripe and db before imports
vi.mock("@/lib/stripe", () => ({
  stripe: {
    webhooks: { constructEvent: vi.fn() },
    subscriptions: { retrieve: vi.fn() },
    invoices: { retrieve: vi.fn() },
  },
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  },
}));

vi.mock("@/lib/billing-emails", () => ({
  sendSubscriptionConfirmedEmail: vi.fn(),
  sendPaymentFailedEmail: vi.fn(),
  sendSubscriptionCanceledEmail: vi.fn(),
  sendTrialEndingSoonEmail: vi.fn(),
  sendInvoicePaidEmail: vi.fn(),
}));

describe("Stripe webhook handler", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("rejects requests without signature", async () => {
    const { POST } = await import("@/app/api/webhooks/stripe/route");
    const req = new Request("http://localhost/api/webhooks/stripe", {
      method: "POST",
      body: "{}",
      headers: {},
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  // Add more tests for each event type...
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run in watch mode
npm run test:watch

# Run specific test file
npx vitest __tests__/billing/stripe-plans.test.ts

# Run with coverage
npx vitest --coverage
```

---

## Priority Order

1. **Create Stripe products/prices** and set env vars — nothing works without this
2. **Add env vars to `.env.example`** — 5 minutes
3. **Write unit tests** for plan resolution and access logic — validates existing code
4. **Prevent trial abuse** — check for prior subscription before offering trial
5. **Add `requireFeature()` to premium API routes** — enforce paid plans
6. **Add client-side feature gating** in SideNav/components — hide or upsell

---

## File Reference

| File | Role |
|------|------|
| `lib/stripe.ts` | Stripe SDK client |
| `lib/stripe-plans.ts` | Plan definitions, feature matrix, price resolution |
| `lib/access.ts` | `hasActiveAccess()`, `hasAccess()`, `getUserPlanInfo()` |
| `lib/subscription-gate.ts` | `requireFeature()`, `requirePlan()` for API routes |
| `lib/billing-emails.ts` | 6 transactional email templates |
| `lib/hooks/useSubscription.ts` | Client-side subscription hook with `hasFeature()` |
| `lib/db/schema.ts:2182-2233` | `subscriptions` + `stripeWebhookEvents` tables |
| `lib/db/authDb.ts` | RLS-aware DB (NOT used by webhooks, correctly) |
| `app/api/webhooks/stripe/route.ts` | Webhook handler (6 events) |
| `app/api/billing/subscription/route.ts` | GET current subscription |
| `app/api/billing/plans/route.ts` | GET all plans |
| `app/api/billing/invoices/route.ts` | GET invoice history |
| `app/(app)/billing/actions.ts` | Portal, cancel, reactivate, switch |
| `app/(app)/billing/BillingClient.tsx` | Billing settings UI |
| `app/(marketing)/pricing/actions.ts` | Checkout session creation |
| `app/(marketing)/pricing/PricingClient.tsx` | Pricing page UI |
| `components/ui/TrialBanner.tsx` | App-wide trial countdown banner |
