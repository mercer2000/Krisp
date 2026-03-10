# Second Noggin Landing Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a premium, minimal dark landing page for secondnoggin.com as a Next.js route within the existing app.

**Architecture:** New `(marketing)` route group with its own layout (no app shell, forced dark mode). Root `app/page.tsx` becomes the landing page for unauthenticated visitors, redirecting authenticated users to `/boards`. All components in `app/(marketing)/components/`.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4 (utility classes only), Geist font (already configured), CSS keyframe animations.

---

### Task 1: Create Marketing Layout

**Files:**
- Create: `app/(marketing)/layout.tsx`

**Step 1: Create the marketing layout**

This layout forces dark mode, removes any app chrome, and provides a clean full-width container.

```tsx
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="dark bg-[#0a0e1a] min-h-screen">{children}</div>;
}
```

**Step 2: Verify the file was created**

Run: `ls app/\(marketing\)/layout.tsx`

**Step 3: Commit**

```bash
git add app/\(marketing\)/layout.tsx
git commit -m "feat: add marketing route group with dark layout"
```

---

### Task 2: Build Hero Component

**Files:**
- Create: `app/(marketing)/components/Hero.tsx`

**Step 1: Create the Hero component**

Animated gradient mesh background, bold headline, subheadline, two CTAs. All Tailwind, CSS animations via inline style tag for the gradient animation.

```tsx
export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pt-32 pb-24 sm:pt-40 sm:pb-32">
      {/* Animated gradient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/10 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-r from-blue-500/20 via-purple-500/10 to-cyan-500/20 rounded-full blur-3xl animate-pulse" />
        {/* Grid pattern */}
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
          Your second brain
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-cyan-300 bg-clip-text text-transparent">
            for the boardroom
          </span>
        </h1>
        <p className="mt-8 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Meetings, emails, decisions, and tasks — captured, organized, and
          searchable by AI. So you never lose context again.
        </p>
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
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
    </section>
  );
}
```

**Step 2: Commit**

```bash
git add app/\(marketing\)/components/Hero.tsx
git commit -m "feat: add Hero component with gradient mesh and CTAs"
```

---

### Task 3: Build Problem Statement Component

**Files:**
- Create: `app/(marketing)/components/ProblemStatement.tsx`

**Step 1: Create the component**

```tsx
export function ProblemStatement() {
  return (
    <section className="px-6 py-16 sm:py-24 border-y border-slate-800/50">
      <div className="mx-auto max-w-4xl text-center">
        <p className="text-2xl sm:text-3xl font-medium text-slate-300 leading-relaxed">
          Executives spend{" "}
          <span className="text-white font-semibold">23 hours a week</span> in
          meetings.{" "}
          <span className="text-slate-500">
            Most of what&apos;s said is lost before the day is over.
          </span>
        </p>
      </div>
    </section>
  );
}
```

**Step 2: Commit**

```bash
git add app/\(marketing\)/components/ProblemStatement.tsx
git commit -m "feat: add ProblemStatement component"
```

---

### Task 4: Build Feature Showcase Component

**Files:**
- Create: `app/(marketing)/components/FeatureShowcase.tsx`

**Step 1: Create the component**

6 feature cards in a 3x2 responsive grid. Each card has an SVG icon, title, and description. Subtle border glow on hover.

```tsx
const features = [
  {
    title: "AI Brain Chat",
    description:
      "Ask questions across all your meetings, emails, and decisions. Get sourced answers instantly.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
      </svg>
    ),
  },
  {
    title: "Meeting Intelligence",
    description:
      "Auto-capture key points, speakers, and action items from every meeting. Nothing falls through the cracks.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
      </svg>
    ),
  },
  {
    title: "Email Intelligence",
    description:
      "Semantic search and auto-classification across your entire inbox. Find anything in seconds.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
      </svg>
    ),
  },
  {
    title: "Decision Register",
    description:
      "Track every decision with rationale, confidence, and context. Know what was decided and why.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
  },
  {
    title: "Weekly Synthesis",
    description:
      "AI-generated executive briefings with patterns, themes, and unresolved items. Delivered to your inbox.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
  },
  {
    title: "Kanban & Tasks",
    description:
      "Action items flow automatically from meetings and emails into boards. Drag, prioritize, and ship.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125Z" />
      </svg>
    ),
  },
];

export function FeatureShowcase() {
  return (
    <section className="px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Everything you need, nothing you don&apos;t
          </h2>
          <p className="mt-4 text-lg text-slate-400">
            Six integrated tools that work together as one system.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative rounded-xl border border-slate-800 bg-slate-900/50 p-8 hover:border-slate-700 hover:bg-slate-900/80 transition-all duration-300"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-500/10 text-blue-400 mb-5">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-slate-400 leading-relaxed">
                {feature.description}
              </p>
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
git add app/\(marketing\)/components/FeatureShowcase.tsx
git commit -m "feat: add FeatureShowcase component with 6 feature cards"
```

---

### Task 5: Build How It Works Component

**Files:**
- Create: `app/(marketing)/components/HowItWorks.tsx`

**Step 1: Create the component**

3 numbered steps with connecting lines.

```tsx
const steps = [
  {
    number: "01",
    title: "Connect your tools",
    description:
      "Link your calendar, email, and Krisp in minutes. We integrate with Microsoft 365, Gmail, Zoom, and more.",
  },
  {
    number: "02",
    title: "AI captures everything",
    description:
      "Meetings are transcribed, emails are classified, decisions are extracted — automatically, in the background.",
  },
  {
    number: "03",
    title: "Ask, review, decide",
    description:
      "Search across everything with AI. Get weekly briefings. Track decisions and action items in one place.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="px-6 py-24 sm:py-32 border-t border-slate-800/50">
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Up and running in minutes
          </h2>
        </div>
        <div className="space-y-12">
          {steps.map((step) => (
            <div key={step.number} className="flex gap-8 items-start">
              <div className="flex-shrink-0 w-16 h-16 rounded-full border border-slate-700 flex items-center justify-center">
                <span className="text-xl font-bold text-blue-400">
                  {step.number}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-slate-400 leading-relaxed max-w-lg">
                  {step.description}
                </p>
              </div>
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
git add app/\(marketing\)/components/HowItWorks.tsx
git commit -m "feat: add HowItWorks component with 3-step flow"
```

---

### Task 6: Build Integrations Strip Component

**Files:**
- Create: `app/(marketing)/components/Integrations.tsx`

**Step 1: Create the component**

Text-based integration logos (no image assets needed).

```tsx
const integrations = [
  "Microsoft 365",
  "Gmail",
  "Zoom",
  "Krisp",
  "Telegram",
  "Outlook",
];

export function Integrations() {
  return (
    <section className="px-6 py-16 border-t border-slate-800/50">
      <div className="mx-auto max-w-4xl text-center">
        <p className="text-sm font-medium text-slate-500 uppercase tracking-widest mb-8">
          Integrates with your stack
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
          {integrations.map((name) => (
            <span
              key={name}
              className="text-lg font-medium text-slate-600"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
```

**Step 2: Commit**

```bash
git add app/\(marketing\)/components/Integrations.tsx
git commit -m "feat: add Integrations strip component"
```

---

### Task 7: Build Social Proof Component

**Files:**
- Create: `app/(marketing)/components/SocialProof.tsx`

**Step 1: Create the component**

Placeholder bold statement (can be replaced with real testimonial later).

```tsx
export function SocialProof() {
  return (
    <section className="px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-3xl text-center">
        <blockquote>
          <p className="text-2xl sm:text-3xl font-medium text-slate-300 leading-relaxed italic">
            &ldquo;I used to spend Friday afternoons reconstructing what happened
            all week. Now it&apos;s waiting for me Monday morning.&rdquo;
          </p>
          <footer className="mt-8">
            <p className="text-slate-500">
              — Early access user
            </p>
          </footer>
        </blockquote>
      </div>
    </section>
  );
}
```

**Step 2: Commit**

```bash
git add app/\(marketing\)/components/SocialProof.tsx
git commit -m "feat: add SocialProof testimonial component"
```

---

### Task 8: Build Final CTA Component

**Files:**
- Create: `app/(marketing)/components/FinalCTA.tsx`

**Step 1: Create the component**

```tsx
export function FinalCTA() {
  return (
    <section id="book-demo" className="px-6 py-24 sm:py-32 border-t border-slate-800/50">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white">
          Ready to stop losing context?
        </h2>
        <p className="mt-4 text-lg text-slate-400">
          See how Second Noggin can be your executive second brain.
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

**Step 2: Commit**

```bash
git add app/\(marketing\)/components/FinalCTA.tsx
git commit -m "feat: add FinalCTA component"
```

---

### Task 9: Build Footer Component

**Files:**
- Create: `app/(marketing)/components/Footer.tsx`

**Step 1: Create the component**

```tsx
export function Footer() {
  return (
    <footer className="px-6 py-12 border-t border-slate-800/50">
      <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-white">Second Noggin</span>
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

**Step 2: Commit**

```bash
git add app/\(marketing\)/components/Footer.tsx
git commit -m "feat: add Footer component"
```

---

### Task 10: Build Navigation/Header Component

**Files:**
- Create: `app/(marketing)/components/NavHeader.tsx`

**Step 1: Create the component**

Sticky transparent header with logo and CTA.

```tsx
export function NavHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 backdrop-blur-md bg-[#0a0e1a]/80 border-b border-slate-800/50">
      <div className="mx-auto max-w-6xl flex items-center justify-between">
        <span className="text-xl font-bold text-white">Second Noggin</span>
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
git commit -m "feat: add NavHeader component with sticky header"
```

---

### Task 11: Assemble Landing Page and Update Root Route

**Files:**
- Create: `app/(marketing)/page.tsx`
- Modify: `app/page.tsx`

**Step 1: Create the marketing landing page**

```tsx
import { NavHeader } from "./components/NavHeader";
import { Hero } from "./components/Hero";
import { ProblemStatement } from "./components/ProblemStatement";
import { FeatureShowcase } from "./components/FeatureShowcase";
import { HowItWorks } from "./components/HowItWorks";
import { Integrations } from "./components/Integrations";
import { SocialProof } from "./components/SocialProof";
import { FinalCTA } from "./components/FinalCTA";
import { Footer } from "./components/Footer";

export const metadata = {
  title: "Second Noggin — Your second brain for the boardroom",
  description:
    "Meetings, emails, decisions, and tasks — captured, organized, and searchable by AI. The executive second brain.",
};

export default function LandingPage() {
  return (
    <>
      <NavHeader />
      <main>
        <Hero />
        <ProblemStatement />
        <FeatureShowcase />
        <HowItWorks />
        <Integrations />
        <SocialProof />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
```

**Step 2: Update root page.tsx to handle auth routing**

Replace `app/page.tsx` with:

```tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();
  if (session) {
    redirect("/boards");
  }
  redirect("/landing");
}
```

Wait — this won't work cleanly with route groups. Since `(marketing)` is a route group, its `page.tsx` maps to `/`. We need a different approach.

Better approach: The `(marketing)/page.tsx` IS the root page. Remove the old `app/page.tsx` entirely and let the marketing route group handle `/`. Authenticated users get redirected from the marketing page itself or the app shell handles it.

Revised `app/page.tsx` — DELETE this file. The `(marketing)/page.tsx` at the route group level serves `/`.

Actually, Next.js doesn't allow two `page.tsx` files both mapping to `/` — one in root and one in `(marketing)`. So we should:
- Delete `app/page.tsx`
- `app/(marketing)/page.tsx` will serve `/`

**Step 2 (revised): Delete old root page**

```bash
rm app/page.tsx
```

**Step 3: Verify dev server starts**

Run: `npx next build --no-lint 2>&1 | head -20` (or just start dev)

**Step 4: Commit**

```bash
git add app/\(marketing\)/page.tsx
git rm app/page.tsx
git commit -m "feat: assemble landing page at root route, remove old redirect"
```

---

### Task 12: Add Smooth Scroll and Fade-In Animations

**Files:**
- Modify: `app/globals.css` (add keyframes)
- Modify: `app/(marketing)/layout.tsx` (add scroll-smooth)

**Step 1: Add animation keyframes to globals.css**

Append to end of `app/globals.css`:

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

**Step 2: Add scroll-smooth to marketing layout**

Update `app/(marketing)/layout.tsx`:

```tsx
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="dark bg-[#0a0e1a] min-h-screen scroll-smooth">{children}</div>;
}
```

**Step 3: Apply animations to Hero and FeatureShowcase sections**

Add `animate-fade-in-up` class to key elements in Hero (headline, paragraph, CTA buttons).

**Step 4: Commit**

```bash
git add app/globals.css app/\(marketing\)/layout.tsx app/\(marketing\)/components/Hero.tsx app/\(marketing\)/components/FeatureShowcase.tsx
git commit -m "feat: add fade-in animations and smooth scroll to landing page"
```

---

### Task 13: Verify and Polish

**Step 1: Run dev server and visually verify**

Run: `npm run dev`

Open browser to `http://localhost:3000` and verify:
- Dark background renders correctly
- All sections display in order
- Hover effects on feature cards work
- Smooth scroll from "See How It Works" navigates to section
- "Book a Demo" links work
- "Sign in" navigates to /login
- Responsive layout works at mobile/tablet/desktop widths

**Step 2: Fix any issues found**

**Step 3: Final commit**

```bash
git add -A
git commit -m "polish: landing page visual refinements"
```
