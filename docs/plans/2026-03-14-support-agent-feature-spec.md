# MyOpenBrain Support Agent — Feature Spec

> **Date:** 2026-03-14
> **Status:** Draft
> **Research Source:** ZipChat.ai features & documentation, adapted for SaaS

---

## Overview

AI-powered support agent for MyOpenBrain that handles customer questions, guides users to the right subscription plan, captures leads, and provides actionable insights — all embedded as a chat widget on the marketing site and in-app.

**Key distinction:** MyOpenBrain is a SaaS product with monthly/annual subscriptions. This spec adapts e-commerce chat patterns (product recommendations, order tracking, cart recovery) into SaaS equivalents (plan recommendations, subscription status, trial conversion).

---

## 1. Knowledge Base (Self-Training)

Automatically ingests product knowledge to answer customer questions.

| Capability | Description |
|---|---|
| **Auto-crawl** | Crawls marketing site, docs, help pages, and changelog on setup |
| **Content sources** | URLs (single/bulk), PDF uploads, direct text entry, XML sitemaps |
| **Continuous sync** | Re-crawls periodically to stay current with product changes |
| **Per-page control** | Enable/disable individual pages from the knowledge base |
| **Subscription awareness** | Knows plans, pricing, feature differences, billing cycles |

### Content Addition Methods

1. **Single Page URL** — Paste individual URLs for immediate crawling
2. **Multiple Pages** — Submit a primary URL, system scans all linked pages
3. **PDF Documents** — Upload product guides, manuals, technical docs
4. **Direct Text Entry** — Add specific text content directly
5. **CSV with Links** — Submit URL lists in CSV format for batch crawling
6. **XML Sitemaps** — Upload sitemap for comprehensive structured crawling

### How Self-Training Works

Supervised learning loop:
1. Admin reviews chat histories
2. Identifies problematic interactions
3. Creates corrections (Q&A pairs) to fix inaccuracies
4. Monitors performance over time
5. Customer feedback (thumbs up/down) feeds into improvement cycle

---

## 2. Easy Deployment (Live in 1 Click)

Embed the chat widget with minimal effort.

| Capability | Description |
|---|---|
| **JS snippet embed** | Single `<script>` tag in site header — works with any framework |
| **Auto brand setup** | Researches brand and prefills name, avatar, colors, welcome messages |
| **No-code config** | All settings managed through admin dashboard |
| **Embed anywhere** | Marketing site, app dashboard, help center, or standalone page |

---

## 3. Data Insights & Analytics

Turn conversations into actionable product and support intelligence.

| Capability | Description |
|---|---|
| **Dashboard metrics** | Chat volume, resolution rate, satisfaction ratings, response times |
| **Automated reports** | Monthly reports aggregating common questions, pain points, feature requests |
| **Conversation tagging** | Auto-tag by page source (pricing, docs, settings, etc.) |
| **Customer feedback** | Per-response thumbs up/down ratings |
| **Deflection tracking** | Measure how many support tickets the agent prevents |
| **Feature request mining** | Surface what users are asking for most |
| **Conversations API** | Programmatic access for custom dashboards or BI tools |

### Automated Monthly Report Categories

- Common product questions
- Brand/product perception
- Feature requests and gaps
- Website UX problems
- Growth action items

---

## 4. Chat Instructions (Personality & Behavior)

Define how the agent communicates and what it prioritizes.

| Capability | Description |
|---|---|
| **Master prompt** | System prompt defining tone, personality, rules, and priorities |
| **Brand voice** | Match casual/friendly, professional, or technical tone |
| **Behavioral rules** | What to do/not do, when to escalate, what to recommend |
| **Plan-aware responses** | Guide users toward upgrades when relevant (not pushy) |
| **Guardrails** | Prevent the agent from making promises, giving refunds, or sharing internal info |

### Example Master Prompt

> You are Brain, MyOpenBrain's support specialist. You are helpful, knowledgeable, and concise. Never say you are an AI unless directly asked. If a question is unclear, ask for clarification. When relevant, suggest the subscription plan that best fits the user's needs. Never make promises about future features or offer unauthorized discounts.

### Important Distinction

- **Chat Instructions** control AI behavior and personality
- **Corrections** control factual knowledge
- Corrections do NOT influence behavioral actions (escalation, etc.) — those must be in the master prompt

---

## 5. Proactive Chat (Engagement Triggers)

Automatically engage visitors at strategic moments.

| Capability | Description |
|---|---|
| **Time-based triggers** | Show message after X seconds on a page |
| **Scroll-based triggers** | Activate at scroll depth thresholds |
| **Exit intent** | Re-engage visitors about to leave |
| **Hesitation detection** | Extended time on pricing page, repeated scrolling |
| **Page targeting** | Different messages per page (pricing, features, docs, dashboard) |
| **Dynamic variables** | Personalize with `{{page_title}}`, `{{plan_name}}`, etc. |
| **Priority rules** | Page-specific messages override generic ones |
| **Two-message flow** | Pop-up notification → follow-up conversation when clicked |

### Trigger Mechanisms

- **Time-based** — Display after set duration on page (e.g., 5 seconds)
- **Scroll-based** — Activate at scroll depth thresholds (e.g., 50%)
- **Exit intent** — Re-engage visitors showing signs of leaving
- **Hesitation patterns** — Extended time on page, repeated scrolling

### Page Targeting Options

- All pages across the website
- Specific individual pages via URL
- All pages in a section (e.g., all /docs/* pages)
- Page exclusion (e.g., exclude checkout, account settings)

---

## 6. Corrections (Response Training)

Iteratively improve the agent's accuracy through admin feedback.

| Capability | Description |
|---|---|
| **Q&A corrections** | Add specific question/answer pairs to override or supplement KB |
| **Expiry dates** | Set corrections to expire (promotions, outages, temporary info) |
| **Centralized management** | Create, edit, delete corrections from admin panel |
| **Conversation review** | Browse chat histories to identify improvement opportunities |
| **Conflict resolution** | Clear precedence rules when corrections overlap with KB content |

### How Corrections Work

1. Admin identifies an inaccurate or incomplete response in chat history
2. Creates a correction as a Q&A pair (e.g., "Q: Do you have a free plan? A: Yes, we offer a free tier with...")
3. Entry is added to the knowledge base
4. Future matching queries reference the correction
5. Creates an iterative improvement loop

### Limitations

- Corrections only apply during "information search" — they do NOT affect behavioral actions
- Contradictory corrections may produce inconsistent responses
- For behavioral changes, modify the Master Prompt instead

---

## 7. Lead Generation

Capture visitor information during chat interactions.

| Capability | Description |
|---|---|
| **Email capture** | Prompt visitors for email during conversation |
| **Customizable form** | Custom title, subtitle, button labels, placeholder text |
| **Consent toggle** | Optional marketing consent message |
| **CSV export** | Download collected leads |
| **Webhook/integration** | Push leads to CRM, email marketing, or analytics tools |
| **Abandoned chat tracking** | Identify visitors who leave without providing contact info |

---

## 8. Widget Customization

Full visual control over the chat experience.

| Capability | Description |
|---|---|
| **Agent identity** | Custom name, role, avatar image |
| **Welcome message** | Customizable greeting |
| **Starter buttons** | Predefined quick-action buttons ("How do I upgrade?", "Cancel my plan", etc.) |
| **Color theming** | Hex color matching to brand |
| **Icon & size** | Modern/classic/custom icon, S/M/L bubble size |
| **Positioning** | Bottom-right/left/center with pixel-level offset |
| **Z-index control** | Prevent overlap with other UI elements |
| **White-label** | Remove branding option |

---

## 9. Human Handoff

Seamless escalation when the AI can't resolve an issue.

| Capability | Description |
|---|---|
| **Context preservation** | Full conversation history passed to human agent |
| **Configurable triggers** | Escalate based on topic, sentiment, repeat questions, or explicit request |
| **Live chat takeover** | Agent can take over in real-time |
| **Ticket creation** | Create support tickets when no agent is online |
| **Target: <3% escalation** | Well-trained agent handles 95%+ without human help |

---

## 10. Multi-Language Support

| Capability | Description |
|---|---|
| **Auto-detection** | Detects visitor language and responds accordingly |
| **95+ languages** | Broad coverage without configuration |
| **No manual setup** | Inherited from underlying LLM capabilities |

---

## 11. SaaS-Specific Adaptations

Features adapted from e-commerce patterns to SaaS subscription context.

| E-Commerce Feature | SaaS Equivalent | Description |
|---|---|---|
| Order tracking | **Subscription status** | Check plan, billing date, usage limits |
| Product recommendations | **Plan recommendations** | Suggest the right tier based on user needs |
| Cart recovery | **Trial conversion / churn prevention** | Engage users who haven't upgraded or are about to cancel |
| Size guidance | **Feature comparison** | Help users understand plan differences |

---

## 12. Integrations & Channels

| Category | Options |
|---|---|
| **Deployment** | Website widget, in-app embed |
| **Channels** | Email inbox (auto-reply to support@) |
| **CRM/Marketing** | Webhook-based integration, CSV export |
| **Analytics** | Conversations API for custom dashboards |
| **Privacy** | GDPR/CCPA compliant, data anonymization, configurable retention |

---

## 13. Spam & Abuse Protection

| Capability | Description |
|---|---|
| **Rate limiting** | Max messages per minute/hour |
| **Custom rate-limit message** | Configurable notification for limited users |

---

## Recommended Build Phases

### Phase 1 — MVP
- Knowledge Base (auto-crawl + manual content)
- Chat Instructions (master prompt)
- Widget embed + visual customization
- Easy deployment (JS snippet)
- Basic conversation history

### Phase 2 — Training & Escalation
- Corrections system (Q&A pairs)
- Human handoff with context preservation
- Analytics dashboard (basic metrics)
- Customer feedback (thumbs up/down)

### Phase 3 — Engagement & Growth
- Proactive chat triggers (time, scroll, exit intent)
- Lead generation (email capture)
- Conversations API
- Automated monthly reports

### Phase 4 — Scale & Polish
- Multi-channel (email auto-reply)
- Advanced analytics & feature request mining
- White-label option
- Subscription-aware responses (plan status, billing, usage)
