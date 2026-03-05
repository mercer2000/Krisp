# SecondNoggin Landing Page Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the SecondNoggin landing page with better messaging, screenshot placeholders, feature deep-dives, FAQ section, and problem-focused storytelling targeting knowledge workers.

**Architecture:** Replace existing marketing components with new ones. Reusable `FeatureDeepDive` component for alternating layout sections. Client-side `FAQ` component with accordion state. All in `app/(marketing)/components/`.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4 (utility classes only), Geist font (already configured).

---

### Task 1: Update NavHeader with SecondNoggin branding

**Files:**
- Modify: `app/(marketing)/components/NavHeader.tsx`

**Step 1: Update the component**

Replace the entire file contents:

```tsx
export function NavHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 backdrop-blur-md bg-[#0a0e1a]/80 border-b border-slate-800/50">
      <div className="mx-auto max-w-6xl flex items-center justify-between">
        <span className="text-xl font-bold text-white">SecondNoggin</span>
        <div className="flex items-center gap-6">
          <a href="/login" className="text-sm text-slate-400 hover:text-white transition-colors">
            Sign in
          </a>
          <a
            href="#book-demo"
            className="inline-flex items-center px-5 py-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium hover:bg-blue-500/20 transition-all"
          >
            Book a Demo
          </a>
        </div>
      </div>
    </header>
  );
}
```

**Step 2: Commit**

```bash
git add app/\(marketing\)/components/NavHeader.tsx
git commit -m "feat: update NavHeader with SecondNoggin branding"
```

---

### Task 2: Rewrite Hero with new copy and screenshot placeholder

**Files:**
- Modify: `app/(marketing)/components/Hero.tsx`

**Step 1: Replace the Hero component**

```tsx
export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pt-32 pb-16 sm:pt-40 sm:pb-24">
      {/* Animated gradient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/10 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-r from-blue-500/20 via-purple-500/10 to-cyan-500/20 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-white leading-[1.1]">
          Stop losing context.
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-cyan-300 bg-clip-text text-transparent">
            Start shipping decisions.
          </span>
        </h1>
        <p className="mt-8 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Meetings, emails, decisions, and tasks — captured by AI, searchable
          in seconds. Your entire work context in one place.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#book-demo"
            className="inline-flex items-center px-8 py-4 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold text-lg hover:from-blue-400 hover:to-blue-500 transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
          >
            Book a Demo
          </a>
          <a
            href="#how-it-works"
            className="inline-flex items-center px-8 py-4 rounded-lg border border-slate-700 text-slate-300 font-semibold text-lg hover:border-slate-500 hover:text-white transition-all"
          >
            See How It Works
          </a>
        </div>
      </div>

      {/* Screenshot placeholder */}
      <div className="mx-auto max-w-5xl mt-16">
        <div className="rounded-xl border-2 border-dashed border-slate-700 bg-slate-900/30 aspect-[16/9] flex items-center justify-center">
          <span className="text-slate-600 text-lg font-medium">
            Screenshot: Dashboard
          </span>
        </div>
      </div>
    </section>
  );
}
```

**Step 2: Commit**

```bash
git add app/\(marketing\)/components/Hero.tsx
git commit -m "feat: rewrite Hero with new copy and screenshot placeholder"
```

---

### Task 3: Create ProblemTriptych component

**Files:**
- Create: `app/(marketing)/components/ProblemTriptych.tsx`
- Delete: `app/(marketing)/components/ProblemStatement.tsx`

**Step 1: Create the component**

```tsx
const problems = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
    title: "Meetings vanish from memory",
    body: "You sat through 6 hours of meetings yesterday. How much do you actually remember?",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
      </svg>
    ),
    title: "Decisions get buried in threads",
    body: "Someone decided something in a meeting last month. Good luck finding it in Slack, email, or your notes.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
      </svg>
    ),
    title: "Action items fall through cracks",
    body: "Tasks get assigned in meetings, written on sticky notes, and forgotten by Friday.",
  },
];

export function ProblemTriptych() {
  return (
    <section className="px-6 py-20 sm:py-28 border-y border-slate-800/50">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {problems.map((problem) => (
            <div
              key={problem.title}
              className="rounded-xl border border-slate-800 bg-slate-900/50 p-8"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-red-500/10 text-red-400 mb-5">
                {problem.icon}
              </div>
              <h3 className="text-lg font-semibold text-white mb-3">
                {problem.title}
              </h3>
              <p className="text-slate-400 leading-relaxed">
                {problem.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

**Step 2: Delete old ProblemStatement**

```bash
rm app/\(marketing\)/components/ProblemStatement.tsx
```

**Step 3: Commit**

```bash
git add app/\(marketing\)/components/ProblemTriptych.tsx
git rm app/\(marketing\)/components/ProblemStatement.tsx
git commit -m "feat: add ProblemTriptych, remove old ProblemStatement"
```

---

### Task 4: Create SolutionOverview component

**Files:**
- Create: `app/(marketing)/components/SolutionOverview.tsx`

**Step 1: Create the component**

```tsx
const streams = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
      </svg>
    ),
    label: "Meetings",
    description: "Transcribed and searchable",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
      </svg>
    ),
    label: "Emails",
    description: "Classified and indexed",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
    label: "Decisions",
    description: "Tracked with context",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125Z" />
      </svg>
    ),
    label: "Tasks",
    description: "Organized on boards",
  },
];

export function SolutionOverview() {
  return (
    <section className="px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            One system for your entire work context
          </h2>
          <p className="mt-4 text-lg text-slate-400">
            Four streams of information, one intelligent brain.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
          {streams.map((stream) => (
            <div
              key={stream.label}
              className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 text-center"
            >
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 mb-3">
                {stream.icon}
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">
                {stream.label}
              </h3>
              <p className="text-xs text-slate-500">{stream.description}</p>
            </div>
          ))}
        </div>

        {/* Connecting arrow */}
        <div className="flex justify-center mb-12">
          <svg className="w-6 h-12 text-slate-700" fill="none" viewBox="0 0 24 48" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 0v40m0 0-6-6m6 6 6-6" />
          </svg>
        </div>

        {/* Unified dashboard screenshot */}
        <div className="rounded-xl border-2 border-dashed border-slate-700 bg-slate-900/30 aspect-[16/9] flex items-center justify-center">
          <span className="text-slate-600 text-lg font-medium">
            Screenshot: Unified Dashboard
          </span>
        </div>
      </div>
    </section>
  );
}
```

**Step 2: Commit**

```bash
git add app/\(marketing\)/components/SolutionOverview.tsx
git commit -m "feat: add SolutionOverview component with 4 input streams"
```

---

### Task 5: Create FeatureDeepDive component and 4 feature sections

**Files:**
- Create: `app/(marketing)/components/FeatureDeepDive.tsx`
- Delete: `app/(marketing)/components/FeatureShowcase.tsx`

**Step 1: Create the reusable component**

```tsx
interface FeatureDeepDiveProps {
  headline: string;
  body: string;
  bullets: string[];
  screenshotLabel: string;
  reverse?: boolean;
}

export function FeatureDeepDive({
  headline,
  body,
  bullets,
  screenshotLabel,
  reverse = false,
}: FeatureDeepDiveProps) {
  return (
    <div
      className={`flex flex-col ${
        reverse ? "lg:flex-row-reverse" : "lg:flex-row"
      } gap-12 lg:gap-16 items-center`}
    >
      {/* Text */}
      <div className="flex-1">
        <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">
          {headline}
        </h3>
        <p className="text-slate-400 leading-relaxed mb-6">{body}</p>
        <ul className="space-y-3">
          {bullets.map((bullet) => (
            <li key={bullet} className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m4.5 12.75 6 6 9-13.5"
                />
              </svg>
              <span className="text-slate-300">{bullet}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Screenshot placeholder */}
      <div className="flex-1 w-full">
        <div className="rounded-xl border-2 border-dashed border-slate-700 bg-slate-900/30 aspect-[4/3] flex items-center justify-center">
          <span className="text-slate-600 font-medium">
            Screenshot: {screenshotLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Delete old FeatureShowcase**

```bash
rm app/\(marketing\)/components/FeatureShowcase.tsx
```

**Step 3: Commit**

```bash
git add app/\(marketing\)/components/FeatureDeepDive.tsx
git rm app/\(marketing\)/components/FeatureShowcase.tsx
git commit -m "feat: add reusable FeatureDeepDive, remove old FeatureShowcase"
```

---

### Task 6: Create FAQ component

**Files:**
- Create: `app/(marketing)/components/FAQ.tsx`

**Step 1: Create the component**

This is a client component for accordion state.

```tsx
"use client";

import { useState } from "react";

const faqs = [
  {
    question: "How does it capture my meetings?",
    answer:
      "SecondNoggin integrates with Krisp and Zoom. Meetings are automatically transcribed, and AI extracts key points, decisions, and action items.",
  },
  {
    question: "Is my data private and secure?",
    answer:
      "Your data is encrypted at rest and in transit. We never use your data to train AI models. You can export or delete your data at any time.",
  },
  {
    question: "How accurate is the AI?",
    answer:
      "Our AI uses state-of-the-art models for transcription and extraction. Every AI-generated insight includes source attribution so you can verify.",
  },
  {
    question: "How long does setup take?",
    answer:
      "Most users are up and running in under 10 minutes. Connect your calendar and email, and SecondNoggin starts working immediately.",
  },
  {
    question: "How is this different from Notion / Otter / Fireflies?",
    answer:
      "Those tools do one thing well. SecondNoggin unifies meetings, emails, decisions, and tasks into one searchable system with AI that works across all your data.",
  },
  {
    question: "Can I export my data?",
    answer:
      "Yes. Your data is yours. Export anytime in standard formats.",
  },
  {
    question: "Does my whole team need to use it?",
    answer:
      "No. SecondNoggin works for individuals. Team features are available but not required.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="px-6 py-24 sm:py-32 border-t border-slate-800/50">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-16">
          Frequently asked questions
        </h2>
        <div className="space-y-2">
          {faqs.map((faq, index) => (
            <div
              key={faq.question}
              className="rounded-lg border border-slate-800 bg-slate-900/50"
            >
              <button
                onClick={() =>
                  setOpenIndex(openIndex === index ? null : index)
                }
                className="w-full flex items-center justify-between px-6 py-5 text-left"
              >
                <span className="text-white font-medium pr-4">
                  {faq.question}
                </span>
                <svg
                  className={`w-5 h-5 text-slate-500 flex-shrink-0 transition-transform duration-200 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m19.5 8.25-7.5 7.5-7.5-7.5"
                  />
                </svg>
              </button>
              {openIndex === index && (
                <div className="px-6 pb-5">
                  <p className="text-slate-400 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

**Step 2: Commit**

```bash
git add app/\(marketing\)/components/FAQ.tsx
git commit -m "feat: add FAQ accordion component"
```

---

### Task 7: Update FinalCTA, Footer, and HowItWorks with SecondNoggin branding

**Files:**
- Modify: `app/(marketing)/components/FinalCTA.tsx`
- Modify: `app/(marketing)/components/Footer.tsx`
- Modify: `app/(marketing)/components/HowItWorks.tsx`

**Step 1: Update FinalCTA**

```tsx
export function FinalCTA() {
  return (
    <section id="book-demo" className="px-6 py-24 sm:py-32 border-t border-slate-800/50">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white">
          Stop trusting your memory.
          <br />
          Start using your second brain.
        </h2>
        <p className="mt-4 text-lg text-slate-400">
          See how SecondNoggin keeps you in control of every meeting, decision, and task.
        </p>
        <div className="mt-10">
          <a
            href="mailto:hello@secondnoggin.com?subject=Demo Request"
            className="inline-flex items-center px-8 py-4 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold text-lg hover:from-blue-400 hover:to-blue-500 transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
          >
            Book a Demo
          </a>
        </div>
      </div>
    </section>
  );
}
```

**Step 2: Update Footer**

```tsx
export function Footer() {
  return (
    <footer className="px-6 py-12 border-t border-slate-800/50">
      <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-white">SecondNoggin</span>
        </div>
        <p className="text-sm text-slate-500">
          &copy; {new Date().getFullYear()} secondnoggin.com. All rights
          reserved.
        </p>
      </div>
    </footer>
  );
}
```

**Step 3: HowItWorks is already correct — no changes needed.**

**Step 4: Commit**

```bash
git add app/\(marketing\)/components/FinalCTA.tsx app/\(marketing\)/components/Footer.tsx
git commit -m "feat: update FinalCTA and Footer with SecondNoggin branding"
```

---

### Task 8: Assemble the new landing page

**Files:**
- Modify: `app/(marketing)/page.tsx`
- Delete: `app/(marketing)/components/SocialProof.tsx`

**Step 1: Update page.tsx with new component imports**

```tsx
import { NavHeader } from "./components/NavHeader";
import { Hero } from "./components/Hero";
import { ProblemTriptych } from "./components/ProblemTriptych";
import { SolutionOverview } from "./components/SolutionOverview";
import { FeatureDeepDive } from "./components/FeatureDeepDive";
import { HowItWorks } from "./components/HowItWorks";
import { Integrations } from "./components/Integrations";
import { FAQ } from "./components/FAQ";
import { FinalCTA } from "./components/FinalCTA";
import { Footer } from "./components/Footer";

export const metadata = {
  title: "SecondNoggin — Your AI second brain for work",
  description:
    "Meetings, emails, decisions, and tasks — captured by AI, searchable in seconds. Your entire work context in one place.",
};

export default function LandingPage() {
  return (
    <>
      <NavHeader />
      <main>
        <Hero />
        <ProblemTriptych />
        <SolutionOverview />

        {/* Feature Deep-Dives */}
        <section className="px-6 py-24 sm:py-32 border-t border-slate-800/50">
          <div className="mx-auto max-w-6xl space-y-24 sm:space-y-32">
            <FeatureDeepDive
              headline="Ask anything across all your data"
              body="Natural language search across meetings, emails, decisions, and tasks. Get sourced answers with context, not just keyword matches."
              bullets={[
                "Conversational interface",
                "Source attribution on every answer",
                "Suggested prompts to get started",
              ]}
              screenshotLabel="Brain Chat"
            />
            <FeatureDeepDive
              headline="Every meeting becomes searchable and actionable"
              body="Key points, speakers, and action items are automatically extracted. Search across your entire meeting history with AI."
              bullets={[
                "Auto-extracted key points",
                "Speaker identification",
                "Action items flow to your board",
              ]}
              screenshotLabel="Meeting Search"
              reverse
            />
            <FeatureDeepDive
              headline="Track what was decided, when, and why"
              body="Decisions are captured from meetings and emails with rationale, participants, and confidence. Never ask 'what did we decide?' again."
              bullets={[
                "Auto-extracted from meetings",
                "Status tracking",
                "Full context and rationale",
              ]}
              screenshotLabel="Decision Register"
            />
            <FeatureDeepDive
              headline="AI briefings delivered to your inbox"
              body="Every week, get a synthesis of your meetings, decisions, and open action items. Topic clusters, cross-day patterns, and unresolved items — all summarized."
              bullets={[
                "Topic clustering across sources",
                "Unresolved action item alerts",
                "Email delivery",
              ]}
              screenshotLabel="Weekly Review"
              reverse
            />
          </div>
        </section>

        <HowItWorks />
        <Integrations />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
```

**Step 2: Delete SocialProof**

```bash
rm app/\(marketing\)/components/SocialProof.tsx
```

**Step 3: Commit**

```bash
git add app/\(marketing\)/page.tsx
git rm app/\(marketing\)/components/SocialProof.tsx
git commit -m "feat: assemble redesigned landing page with all new sections"
```

---

### Task 9: Add animations and smooth scroll

**Files:**
- Modify: `app/globals.css`
- Modify: `app/(marketing)/layout.tsx`

**Step 1: Append animation keyframes to globals.css**

Add to end of file:

```css
/* Landing page animations */
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fade-in-up 0.6s ease-out both;
}
```

**Step 2: Update marketing layout with scroll-smooth**

```tsx
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="dark bg-[#0a0e1a] min-h-screen scroll-smooth">{children}</div>;
}
```

**Step 3: Commit**

```bash
git add app/globals.css app/\(marketing\)/layout.tsx
git commit -m "feat: add fade-in animations and smooth scroll"
```

---

### Task 10: Verify dev server builds and visual check

**Step 1: Kill any existing dev server on port 3001 and restart**

```bash
# Find and kill process on 3001
netstat -ano | grep :3001
taskkill //F //PID <pid>

# Start fresh
cd /c/Code/Krisp/.worktrees/landing-page && npm run dev
```

**Step 2: Open http://localhost:3001 and verify:**

- NavHeader shows "SecondNoggin"
- Hero has new copy and screenshot placeholder
- Three problem cards display
- Solution overview with 4 stream cards and arrow
- Four alternating feature deep-dives with screenshot placeholders
- How It Works section
- Integrations strip
- FAQ accordion opens/closes
- Final CTA with "Book a Demo"
- Footer with "SecondNoggin"

**Step 3: Fix any issues found and commit**

```bash
git add -A
git commit -m "polish: landing page visual refinements"
```
