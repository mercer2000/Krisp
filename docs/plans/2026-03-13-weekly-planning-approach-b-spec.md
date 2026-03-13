# Weekly Planning System — Approach B Spec: AI Conversation Flow

**Date:** 2026-03-13
**Status:** Not selected (documented for future reference)

## Overview

Instead of the structured 3-tab flow (Approach A), the weekly planning session is a guided **AI conversation** using the existing Brain chat interface. The AI acts as a productivity coach, walking the user through reviewing, assessing, and planning their week in a natural dialogue.

## How It Works

### Session Initiation

- User opens Brain and selects "Weekly Planning Session" (a special session type)
- Or, the app prompts them via notification/email: "Ready to plan your week?"
- The AI begins with a structured opening based on the user's data

### Conversation Flow

The AI guides the user through 5 phases in a single conversation:

**Phase 1: Assessment (if previous plan exists)**
- AI presents last week's Big 3 completion status conversationally: "Last week you set three priorities. Let's see how they went..."
- Asks reflective questions: "You didn't get to 'Redesign landing page' — what got in the way?"
- User responds naturally; AI captures insights

**Phase 2: Review**
- AI summarizes the week's activity: meetings, emails, decisions, action items
- Highlights patterns: "You had 12 meetings this week, up from 8 last week. Most were client-related."
- User can ask follow-up questions or skip ahead

**Phase 3: Big 3 Selection**
- AI suggests 3 priorities for next week with reasoning: "Based on your overdue items and Q1 goals, I'd suggest..."
- User can accept, modify, or pick their own
- AI confirms selections and explains the Focus column behavior

**Phase 4: Daily Themes**
- AI proposes themes day by day: "Monday looks meeting-heavy with 4 calls, so I'd theme it 'Client Day'. Tuesday is clear — perfect for 'Deep Build'..."
- User adjusts as needed
- AI curates 5-7 tasks per day as it goes

**Phase 5: Confirmation**
- AI summarizes the full plan in a structured format
- User confirms → AI writes all data to DB (weekly_plan, daily_themes, Big 3 flags, Focus column)

### Data Extraction

The AI must extract structured data from the conversation and persist it:
- Big 3 card IDs (matched from user descriptions to actual cards)
- Daily themes and rationale
- Curated task lists per day
- Assessment score (calculated from conversation + data)
- User reflections (extracted from their responses)

This requires a post-conversation processing step where the AI produces structured JSON from the chat transcript.

### Data Model

Same tables as Approach A (`weekly_plans`, `daily_themes`, card modifications). The difference is how the data gets populated — via conversation extraction rather than form interaction.

### Brain Chat Modifications

- New session type: `weekly-planning`
- Session has a `weeklyPlanId` field linking to the generated plan
- The AI uses a specialized system prompt for planning sessions (different from general Brain chat)
- Planning sessions are tagged/filterable in the Brain session list
- The conversation transcript is stored as the "audit trail" for the plan

## Kanban & Daily Theme Integration

Identical to Approach A:
- Focus column with Big 3 cards
- Big 3 visual badges
- Daily theme banner on Kanban board
- Daily briefing includes theme + curated tasks
- Week rollover logic

## Assessment Email

Same as Approach A — cron-triggered HTML email with score, Big 3 status, highlights, and CTA linking to Brain for the next planning session (instead of the Weekly Review page).

## Trade-offs vs Approach A

### Advantages

- **More natural interaction** — feels like a coaching session, not a form
- **Flexible exploration** — user can ask "why?" or go deeper on any topic
- **Leverages existing Brain infrastructure** — chat UI, session management, markdown rendering already built
- **Lower UI development cost** — no new tabs, pickers, or grids to build; the AI handles the UX
- **Richer reflection data** — free-form conversation captures nuance that a text area can't

### Disadvantages

- **Harder to skim/review later** — a chat transcript is less scannable than structured tabs
- **Data extraction complexity** — converting conversation to structured DB records is error-prone; requires careful prompt engineering and possibly a second AI pass
- **Less email-friendly** — the assessment email needs structured data, but the source is unstructured conversation
- **Slower iteration** — changing one day's theme means re-engaging in conversation rather than clicking a dropdown
- **Reproducibility** — the same inputs may produce different conversation flows, making debugging harder
- **Session dependency** — if the user abandons the conversation mid-flow, partial data handling is complex
- **Cost** — longer conversations = more tokens = higher AI costs per planning session

## When Approach B Makes More Sense

- If the user base prefers conversational AI interactions over structured UIs
- If Brain becomes the primary interface (and the app moves toward an "AI assistant first" model)
- If future features add voice input (spoken planning session)
- As a premium/optional mode alongside the structured Approach A

## Hybrid Possibility

Approach A for the structured flow + a "Chat with your plan" button that opens a Brain session pre-loaded with the plan context, for users who want to explore or reflect more deeply. This gives the best of both worlds without the data extraction complexity.
