# SecondNoggin Landing Page Redesign — Design Doc

**Date:** 2026-03-04
**Target audience:** Knowledge workers (PMs, engineers, analysts)
**CTA:** Book a Demo (primary)
**Brand name:** SecondNoggin (one word)
**Theme:** Dark (#0a0e1a), blue/cyan gradient accents, Geist font

---

## Page Structure

### 1. NavHeader (sticky)
- Logo: "SecondNoggin"
- Links: Sign In (text), Book a Demo (ghost button)
- Transparent bg with backdrop-blur, solidifies on scroll

### 2. Hero
- **Headline:** "Stop losing context. Start shipping decisions."
- **Subheadline:** "Meetings, emails, decisions, and tasks — captured by AI, searchable in seconds. Your entire work context in one place."
- **CTAs:** "Book a Demo" (primary gradient button) | "See How It Works" (secondary outline)
- **Visual:** Large product screenshot placeholder (rounded-xl, dashed border, labeled "Screenshot: Dashboard")
- Animated gradient mesh background (existing pattern)

### 3. Problem Triptych
Three cards side by side (stacks on mobile):

| Card | Headline | Body |
|------|----------|------|
| 1 | "Meetings vanish from memory" | "You sat through 6 hours of meetings yesterday. How much do you actually remember?" |
| 2 | "Decisions get buried in threads" | "Someone decided something in a meeting last month. Good luck finding it in Slack, email, or your notes." |
| 3 | "Action items fall through cracks" | "Tasks get assigned in meetings, written on sticky notes, and forgotten by Friday." |

Each card: icon at top, dark card bg, subtle border. No CTAs.

### 4. Solution Overview
- **Headline:** "One system for your entire work context"
- **Subheadline:** "Four streams of information, one intelligent brain."
- Visual: 4 input streams (Meetings, Emails, Decisions, Tasks) shown as labeled items flowing into a central "brain" concept
- Each stream: icon + label + one-line description
- Below: screenshot placeholder of the unified dashboard

### 5. Feature Deep-Dives (4 sections, alternating left/right)

Each section: text on one side, screenshot placeholder on the other. Alternates direction.

**5a. Brain AI Chat**
- Headline: "Ask anything across all your data"
- Body: "Natural language search across meetings, emails, decisions, and tasks. Get sourced answers with context, not just keyword matches."
- Bullets: "Conversational interface" · "Source attribution on every answer" · "Suggested prompts to get started"
- Screenshot placeholder: "Screenshot: Brain Chat"

**5b. Meeting Intelligence**
- Headline: "Every meeting becomes searchable and actionable"
- Body: "Key points, speakers, and action items are automatically extracted. Search across your entire meeting history with AI."
- Bullets: "Auto-extracted key points" · "Speaker identification" · "Action items flow to your board"
- Screenshot placeholder: "Screenshot: Meeting Search"

**5c. Decision Register**
- Headline: "Track what was decided, when, and why"
- Body: "Decisions are captured from meetings and emails with rationale, participants, and confidence. Never ask 'what did we decide?' again."
- Bullets: "Auto-extracted from meetings" · "Status tracking" · "Full context and rationale"
- Screenshot placeholder: "Screenshot: Decision Register"

**5d. Weekly Synthesis**
- Headline: "AI briefings delivered to your inbox"
- Body: "Every week, get a synthesis of your meetings, decisions, and open action items. Topic clusters, cross-day patterns, and unresolved items — all summarized."
- Bullets: "Topic clustering across sources" · "Unresolved action item alerts" · "Email delivery"
- Screenshot placeholder: "Screenshot: Weekly Review"

### 6. How It Works
Three numbered steps:
1. **Connect your tools** — "Link your calendar, email, and meeting recorder in minutes."
2. **AI captures everything** — "Meetings are transcribed, emails classified, decisions extracted — automatically."
3. **Ask, review, decide** — "Search across everything. Get weekly briefings. Track decisions and tasks."

### 7. Integrations Strip
- Label: "Integrates with your stack"
- Names: Microsoft 365, Gmail, Zoom, Krisp, Telegram, Outlook

### 8. FAQ Section
Accordion-style, 7 questions:

1. **How does it capture my meetings?** — "SecondNoggin integrates with Krisp and Zoom. Meetings are automatically transcribed, and AI extracts key points, decisions, and action items."
2. **Is my data private and secure?** — "Your data is encrypted at rest and in transit. We never use your data to train AI models. You can export or delete your data at any time."
3. **How accurate is the AI?** — "Our AI uses state-of-the-art models for transcription and extraction. Every AI-generated insight includes source attribution so you can verify."
4. **How long does setup take?** — "Most users are up and running in under 10 minutes. Connect your calendar and email, and SecondNoggin starts working immediately."
5. **How is this different from Notion / Otter / Fireflies?** — "Those tools do one thing well. SecondNoggin unifies meetings, emails, decisions, and tasks into one searchable system with AI that works across all your data."
6. **Can I export my data?** — "Yes. Your data is yours. Export anytime in standard formats."
7. **Does my whole team need to use it?** — "No. SecondNoggin works for individuals. Team features are available but not required."

### 9. Final CTA
- **Headline:** "Stop trusting your memory. Start using your second brain."
- **Subheadline:** "See how SecondNoggin keeps you in control of every meeting, decision, and task."
- **CTA:** "Book a Demo" (mailto: hello@secondnoggin.com)

### 10. Footer
- Logo: "SecondNoggin"
- Copyright: © 2026 secondnoggin.com

---

## Visual Design Notes

- **Screenshot placeholders:** `rounded-xl border-2 border-dashed border-slate-700 bg-slate-900/30` with centered label text
- **Cards:** Semi-transparent bg (`bg-slate-900/50`), subtle border, hover state
- **Feature sections:** Alternating layout (text-left/image-right, then text-right/image-left)
- **FAQ:** Click-to-expand accordion, chevron indicator
- **Animations:** Fade-in-up on scroll for major sections
- **Spacing:** Generous py-24/py-32 between sections

## Components to Create/Modify

All in `app/(marketing)/components/`:
- `NavHeader.tsx` — update brand name
- `Hero.tsx` — rewrite copy, add screenshot placeholder
- `ProblemTriptych.tsx` — new component (replaces ProblemStatement)
- `SolutionOverview.tsx` — new component
- `FeatureDeepDive.tsx` — new component (reusable, alternating layout)
- `HowItWorks.tsx` — update copy
- `Integrations.tsx` — keep as-is
- `FAQ.tsx` — new component (accordion)
- `FinalCTA.tsx` — update copy and brand name
- `Footer.tsx` — update brand name
- `page.tsx` — update imports

Delete: `ProblemStatement.tsx`, `FeatureShowcase.tsx`, `SocialProof.tsx`
