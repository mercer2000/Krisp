# Desktop Recorder Feature Page — Design Spec

**Date:** 2026-03-13
**Status:** Approved
**Route:** `/features/desktop-recorder`
**File:** `app/(marketing)/features/desktop-recorder/page.tsx`

## Context

MyOpenBrain now has a full desktop recorder for Windows that automatically records and transcribes every call, populating the user's knowledge graph. This page is a marketing feature page targeting individual knowledge workers. It follows the "Before & After" narrative approach — leading with pain, resolving with the product.

Competitor context: Recall.ai sells a developer SDK for desktop recording. MyOpenBrain is an end-user product — no code, no setup, no bots. The page should implicitly differentiate on this without naming competitors.

## Target Audience

Individual knowledge workers drowning in meetings who want their calls to become searchable, actionable knowledge without effort.

## Core Message

"Your meetings become searchable knowledge." Every call is silently recorded, transcribed, and fed into an AI knowledge graph that connects meetings with emails, decisions, and tasks.

## Visual Identity

- **Accent color:** Cyan/teal — distinct from landing page (blue), research page (amber)
- **Design system:** Same dark theme, slate cards, gradient text as existing marketing pages
- **Components:** Reuses NavHeader, Footer from `app/(marketing)/components/`

## Page Sections

### 1. Hero

- **Badge:** Pill with "Desktop Recorder" label (cyan accent, same style as research page "Research" badge)
- **Headline:** "Every call becomes searchable knowledge"
- **Subtext:** "MyOpenBrain silently records and transcribes every call on your Windows PC — then extracts decisions, action items, and key points into a knowledge graph you can search across everything."
- **CTA:** "Start Your Free 14-Day Trial" button linking to `/auth/sign-up`
- **Sub-CTA:** "No credit card required. Set up in minutes."
- **Background:** Subtle cyan/teal gradient glow (similar to hero treatment on landing and research pages)

### 2. The Problem — Three Cards

Three pain-point cards in a 1x3 grid (same pattern as ProblemTriptych on landing page, but with cyan/teal accent instead of red):

1. **"The meeting ends. The memory fades."**
   Body: "You had 4 calls today. By tomorrow, you'll remember fragments. By next week, almost nothing."

2. **"Notes can't keep up with conversation."**
   Body: "You're either participating or transcribing. You can't do both well."

3. **"Searching for 'that thing someone said' is hopeless."**
   Body: "It's somewhere in a call last week. Or was it an email? Good luck finding it."

### 3. How It Works — Three Steps

Numbered steps (similar to HowItWorks on landing page):

1. **"Install on your Windows PC"**
   Body: "A lightweight app that runs in the background. No configuration needed."

2. **"It records every call automatically"**
   Body: "Zoom, Teams, Meet, Slack, any audio call. No bots join your meeting — it captures locally."

3. **"AI extracts what matters"**
   Body: "Key points, decisions, and action items are pulled from the transcript and added to your knowledge graph. Search across all your calls, emails, and tasks in one place."

### 4. What You Get — Four Feature Cards

2x2 grid of feature cards (blue accent, similar to strategy cards on research page):

1. **"Searchable transcripts"**
   Body: "Full transcripts from every call, searchable by keyword or natural language query."

2. **"Auto-extracted decisions"**
   Body: "Decisions are identified with context, participants, and rationale — no manual tagging."

3. **"Action items on your board"**
   Body: "Tasks mentioned in calls flow directly to your Kanban board with due dates."

4. **"Cross-source AI queries"**
   Body: "Ask questions across all your meetings, emails, and tasks. 'What did we decide about the launch date?' gets a sourced answer."

### 5. No Bots, No Friction — Differentiator

A single prominent card with cyan border/accent:

- **Headline:** "No bots. No awkward 'Recorder has joined.' No permissions to manage."
- **Body:** "Unlike meeting bot services, MyOpenBrain records directly on your desktop. Your colleagues never know — and you never have to ask permission to record your own machine's audio. It works with every platform: Zoom, Microsoft Teams, Google Meet, Slack Huddles, and even in-person conversations."

### 6. Research Tie-In — Compact Callout

A small callout card linking to `/research`:
"Research shows knowledge workers lose 28% of their week to email and meeting overhead." with a "See the data" arrow link.

### 7. CTA

Same pattern as research page bottom CTA:
- Subtle blue background glow
- **Headline:** "Stop losing what was said"
- **Body:** "Install once. Every call after that becomes part of your searchable knowledge."
- **CTA:** "Start Your Free 14-Day Trial" → `/auth/sign-up`
- **Sub-CTA:** "No credit card required. Set up in minutes."

## Navigation Changes

- Add "Features" link to NavHeader (between "Research" and "Sign in"), linking to `/features/desktop-recorder`

## Files to Create/Modify

- **Create:** `app/(marketing)/features/desktop-recorder/page.tsx` — the feature page (server component)
- **Modify:** `app/(marketing)/components/NavHeader.tsx` — add "Features" link

## Out of Scope

- No pricing information on this page
- No comparison table with competitors
- No video/animation of the recorder in action (screenshot placeholders only)
- No additional feature pages (single page scope)
