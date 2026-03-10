# Second Noggin Landing Page Design

## Overview
Premium, minimal landing page for secondnoggin.com targeting founders and executives. Dark aesthetic (Linear/Raycast style), confident tone, "Book a Demo" as primary CTA.

## Target Audience
Founders and executives overwhelmed by meetings, emails, and decisions who need a second brain to stay on top of everything.

## Page Sections

### 1. Hero
- Dark gradient background (deep navy `#0a0e1a` to near-black)
- Headline: "Your second brain for the boardroom"
- Subheadline: One sentence about consolidating meetings, emails, decisions, and tasks
- Two CTAs: "Book a Demo" (primary, blue gradient) + "See How It Works" (ghost outline)
- Subtle animated mesh/grid background

### 2. Problem Statement Strip
- Single impactful line: "Executives spend 23 hours/week in meetings. Most of what's said is lost."
- Large typography, minimal styling

### 3. Feature Showcase (3x2 grid)
Each card: icon + title + one-line description on dark card with subtle border glow on hover.

1. **AI Brain Chat** — Ask questions across all your meetings, emails, and decisions
2. **Meeting Intelligence** — Auto-capture key points, speakers, and action items from every meeting
3. **Email Intelligence** — Semantic search and auto-classification across your inbox
4. **Decision Register** — Track every decision with rationale, confidence, and context
5. **Weekly Synthesis** — AI-generated executive briefings delivered to your inbox
6. **Kanban & Tasks** — Action items flow automatically from meetings and emails into boards

### 4. How It Works (3 steps)
1. Connect your tools (calendar, email, Krisp)
2. AI captures and organizes everything automatically
3. Ask, review, and decide — all in one place

### 5. Integration Logos Strip
Microsoft 365, Gmail, Zoom, Krisp, Telegram — subtle gray/muted logos

### 6. Social Proof / Quote
Placeholder for testimonial or bold product statement

### 7. Final CTA
Dark section: "Ready to stop losing context?" + Book a Demo button

### 8. Footer
secondnoggin.com, copyright, minimal links

## Technical Approach
- New route group `(marketing)` with its own layout (no app sidebar/auth)
- Root `app/page.tsx` serves landing page (replace current redirect to /boards)
- Authenticated users who hit `/` still get redirected to `/boards` via session check
- Dark-mode only for landing page (forced dark class on layout)
- Tailwind utility classes, Geist fonts from existing setup
- CSS `@keyframes` for subtle animations (fade-in on scroll, gradient shifts)
- No additional dependencies

## File Structure
```
app/
  (marketing)/
    layout.tsx        — Marketing layout (dark, no sidebar)
    page.tsx          — Landing page component
    components/
      Hero.tsx
      ProblemStatement.tsx
      FeatureShowcase.tsx
      HowItWorks.tsx
      Integrations.tsx
      SocialProof.tsx
      FinalCTA.tsx
      Footer.tsx
  page.tsx            — Root redirect (auth check → /boards or marketing page)
```
