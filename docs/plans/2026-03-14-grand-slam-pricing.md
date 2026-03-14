# MyOpenBrain Grand Slam Pricing Plan

Based on Alex Hormozi's $100M Offers framework. Designed to make the offer so good people feel stupid saying no.

---

## Value Equation

| Variable | Score | Rationale |
|----------|-------|-----------|
| Dream Outcome | Very High | "Never forget anything from work again" + save 3+ hrs/week |
| Perceived Likelihood | High | Automatic capture, AI extraction, zero manual effort |
| Time Delay | Very Low | 5-minute setup, instant value from first call/email |
| Effort & Sacrifice | Near Zero | Runs silently in background after install |

---

## Competitive Landscape

| Product | What It Does | Price |
|---------|-------------|-------|
| SaneBox | Email sorting only | $7-36/mo |
| Fyxer | Email drafts + meeting notes | $30-50/mo |
| Superhuman | Email client replacement | $25-33/mo |
| **MyOpenBrain** | **6 tools in one** | **$19-39/mo** |

MyOpenBrain delivers more than all three combined, priced below the cheapest single-purpose competitor.

---

## Pricing Tiers

### Free Tier (Internal Fallback Only)

**Not shown on marketing or pricing pages.** Exists only as the state users fall to after trial expiration without subscribing.

- Read-only access to existing data
- 1 Kanban board
- 10 Open Brain captures/month
- No email integrations
- No AI features

### Focus Plan — $19/mo ($149/yr)

**Positioning:** "Get organized"

For knowledge workers who want their meetings and emails captured and searchable.

| Feature | Limit |
|---------|-------|
| Open Brain captures | 500/month |
| Email accounts | 1 |
| Kanban boards | 5 |
| Kanban cards | Unlimited |
| Meeting recording & transcription | Yes |
| Email classification & action items | Yes |
| Meeting search | Yes |
| Weekly briefing | Basic |
| Brain Chat (AI search) | No |
| Decision Register | No |
| Daily briefing | No |
| MCP access | No |
| Priority support | No |

**Stripe env vars:**
- `STRIPE_PRICE_STANDARD_MONTHLY` — $19/mo
- `STRIPE_PRICE_STANDARD_ANNUAL` — $149/yr

### Second Brain Plan — $39/mo ($349/yr)

**Positioning:** "Your complete work intelligence system" (highlighted / most popular)

The full MyOpenBrain experience. Everything captured, connected, and searchable with AI.

| Feature | Limit |
|---------|-------|
| Open Brain captures | Unlimited |
| Email accounts | 3 |
| Kanban boards | Unlimited |
| Kanban cards | Unlimited |
| Meeting recording & transcription | Yes |
| Email classification & action items | Yes |
| Meeting search | Yes |
| Brain Chat (AI search) | Unlimited |
| Decision Register | Full context & rationale |
| Weekly briefing | Full AI synthesis |
| Daily briefing | Yes |
| MCP access | Read/Write |
| Priority support | Yes |
| Early access to new features | Yes |

**Stripe env vars:**
- `STRIPE_PRICE_PRO_MONTHLY` — $39/mo
- `STRIPE_PRICE_PRO_ANNUAL` — $349/yr

---

## Grand Slam Offer Stack

The landing page presents the offer as 6 individual tools bundled into one price:

| Tool | Individual Value | Comparison |
|------|-----------------|------------|
| Silent Meeting Recorder | $20/mo | Competitors charge $15-20/mo for this alone |
| AI Email Manager | $25/mo | SaneBox charges $12-36/mo for less |
| Brain Chat | $30/mo | No competitor offers cross-source AI search |
| Decision Register | $15/mo | Usually buried in enterprise tools |
| Kanban Task Board | $10/mo | Built-in, no extra app needed |
| Weekly AI Briefings | $15/mo | No competitor offers cross-source synthesis |
| **Total value** | **$115/mo** | |
| **You pay** | **$39/mo** | Or $29/mo billed annually |

---

## Guarantee

**"The 3 Hours Back Guarantee"**

> Try MyOpenBrain for 14 days with full access. If you don't save at least 3 hours in your first week, cancel instantly — no questions asked.

This is a **conditional guarantee** (Hormozi's strongest type) — names a specific, measurable outcome tied to our core value proposition (3+ hours saved per week).

---

## Scarcity & Urgency

**Founder's Pricing**

> Early adopters lock in current rates for life, even as we add features and raise prices.

This is legitimate scarcity — prices will increase as the product matures. Displayed as a pulsing amber badge on the Hero, FinalCTA, and Pricing page.

---

## Plan Naming (Hormozi MAGIC Formula)

| Internal Key | Display Name | Rationale |
|-------------|-------------|-----------|
| `free` | "Trial Expired" | Not a real plan — signals "you need to subscribe" |
| `standard` | "Focus" | Aspirational outcome: getting organized and focused |
| `pro` | "Second Brain" | Ties directly to the core product promise |

---

## Trial Strategy

- **14-day full-access trial** on the Second Brain plan (all features unlocked)
- **No credit card required** to start
- After trial expires without subscribing, users fall to the stripped-down free tier (read-only access)
- This replaces the previous "generous free tier" approach that anchored perceived value at $0

---

## Implementation Notes

### Stripe Dashboard Updates Required

1. Create new price objects in Stripe matching the new amounts:
   - Focus Monthly: $19.00/mo
   - Focus Annual: $149.00/yr
   - Second Brain Monthly: $39.00/mo
   - Second Brain Annual: $349.00/yr
2. Update environment variables with new Stripe Price IDs
3. Existing subscribers remain on their current price until they change plans

### Files Changed

| File | Change |
|------|--------|
| `lib/stripe-plans.ts` | Plan names, prices, features, limits, feature matrix |
| `app/(marketing)/components/Hero.tsx` | "6 tools in one" value prop, Founder's Pricing badge |
| `app/(marketing)/components/OfferStack.tsx` | NEW — value breakdown with crossed-out prices |
| `app/(marketing)/components/FinalCTA.tsx` | "3 Hours Back" Guarantee, Founder's Pricing badge |
| `app/(marketing)/components/FAQ.tsx` | New FAQs for guarantee, pricing, founder's pricing |
| `app/(marketing)/page.tsx` | Added OfferStack section, updated meta |
| `app/(marketing)/pricing/PricingClient.tsx` | 2-column layout, no free tier, competitor comparison |
| `app/(marketing)/pricing/page.tsx` | Updated headline and meta description |
| `app/(app)/billing/BillingClient.tsx` | Updated feature matrix and cancel modal copy |

### Existing Subscriber Migration

Existing subscribers on old pricing ($12/mo Standard, $29/mo Pro) keep their current rate through Stripe's subscription management. When they next change plans, they'll see the new pricing. This naturally creates a "grandfather" effect that reinforces the Founder's Pricing promise.
