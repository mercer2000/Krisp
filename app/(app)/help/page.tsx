"use client";

import { useState } from "react";

// ── Section Data ────────────────────────────────────────

interface Section {
  id: string;
  title: string;
  icon: string;
  content: React.ReactNode;
}

const SECTIONS: Section[] = [
  {
    id: "overview",
    title: "Getting Started",
    icon: "rocket",
    content: (
      <>
        <p className="mb-4 text-[var(--muted-foreground)]">
          MyOpenBrain helps you stay on top of your week with a structured
          planning ritual. Every week you follow a simple three-step flow:
        </p>
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <StepCard
            number="1"
            title="Assess"
            description="Review how last week went. See your score, reflect on what worked, and identify what to carry forward."
            color="blue"
          />
          <StepCard
            number="2"
            title="Review"
            description="Read your AI-generated weekly synthesis — topic clusters, cross-day patterns, and unresolved action items."
            color="purple"
          />
          <StepCard
            number="3"
            title="Plan"
            description="Choose your hero priorities, set daily themes, and confirm your plan for the upcoming week."
            color="green"
          />
        </div>
        <p className="text-[var(--muted-foreground)]">
          The entire session is designed to take about 30 minutes. Open{" "}
          <strong>Reviews</strong> from the sidebar and you will see the three
          tabs across the top of the detail pane.
        </p>
      </>
    ),
  },
  {
    id: "hero-priorities",
    title: "Hero Priorities",
    icon: "star",
    content: (
      <>
        <p className="mb-4 text-[var(--muted-foreground)]">
          Each week you select the tasks from your Kanban board that would
          make the week a success. These are your hero priorities — the
          items that move the needle most.
        </p>
        <h4 className="text-sm font-semibold mb-2">How it works</h4>
        <ol className="list-decimal list-inside space-y-2 text-[var(--muted-foreground)] mb-4">
          <li>
            Open the <strong>Plan</strong> tab in your Weekly Review.
          </li>
          <li>
            Click <strong>Get AI Suggestions</strong>. The AI analyzes your
            open cards — considering priorities, due dates, and items that have
            been carried forward — and pre-selects the top priorities.
          </li>
          <li>
            Accept the suggestions or swap them for different cards. You can
            select as many cards as you need from your board.
          </li>
          <li>
            When you confirm the plan, the selected cards are tagged as hero priorities
            and moved into a dedicated <strong>Focus</strong> column at the
            front of your Kanban board.
          </li>
        </ol>
        <h4 className="text-sm font-semibold mb-2">Visual cues</h4>
        <ul className="list-disc list-inside space-y-1 text-[var(--muted-foreground)]">
          <li>
            Hero priority cards display a gold star badge and an amber glow border,
            visible in every column — not just Focus.
          </li>
          <li>
            The Focus column has a distinct blue accent background and cannot
            be reordered or deleted while a plan is active.
          </li>
          <li>
            When a hero priority card is completed or the week rolls over, it
            automatically returns to its original column.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "daily-themes",
    title: "Daily Themes",
    icon: "palette",
    content: (
      <>
        <p className="mb-4 text-[var(--muted-foreground)]">
          Instead of tackling a scattered to-do list each morning, every day
          gets a <strong>theme</strong> — a single focus area that guides what
          you work on.
        </p>
        <h4 className="text-sm font-semibold mb-2">AI-suggested themes</h4>
        <p className="mb-4 text-[var(--muted-foreground)]">
          When you plan your week, the AI examines your calendar events,
          meeting schedule, hero priorities, and open tasks to suggest a
          theme for each day (Monday through Sunday). For example:
        </p>
        <div className="grid grid-cols-7 gap-1 mb-4 text-center text-xs">
          {[
            { day: "Mon", theme: "Client Focus" },
            { day: "Tue", theme: "Deep Build" },
            { day: "Wed", theme: "Admin & Ops" },
            { day: "Thu", theme: "Strategy" },
            { day: "Fri", theme: "Creative" },
            { day: "Sat", theme: "Learning" },
            { day: "Sun", theme: "Recharge" },
          ].map(({ day, theme }) => (
            <div
              key={day}
              className="rounded-lg border border-[var(--border)] p-2 bg-[var(--accent)]/30"
            >
              <div className="font-semibold text-[var(--foreground)]">{day}</div>
              <div className="text-[var(--muted-foreground)] mt-0.5">{theme}</div>
            </div>
          ))}
        </div>
        <p className="mb-4 text-[var(--muted-foreground)]">
          The AI avoids scheduling deep-work themes on days packed with
          meetings and distributes your hero priorities across the week. You can
          override any theme by clicking on it in the Plan tab.
        </p>
        <h4 className="text-sm font-semibold mb-2">Curated task lists</h4>
        <p className="text-[var(--muted-foreground)]">
          For each themed day, the AI picks <strong>5-7 tasks</strong> from
          your Kanban board that best match the theme. Hero priorities are always
          included on relevant days. You will see today&apos;s curated list in
          three places:
        </p>
        <ul className="list-disc list-inside space-y-1 mt-2 text-[var(--muted-foreground)]">
          <li>The <strong>Plan</strong> tab during weekly planning</li>
          <li>Your <strong>daily briefing email</strong> each morning</li>
          <li>A <strong>theme banner</strong> at the top of your Kanban board</li>
        </ul>
      </>
    ),
  },
  {
    id: "assessment",
    title: "End-of-Week Assessment",
    icon: "chart",
    content: (
      <>
        <p className="mb-4 text-[var(--muted-foreground)]">
          Every Friday you receive an AI-generated assessment of how your week
          went against your plan. The assessment arrives in two ways:
        </p>
        <ul className="list-disc list-inside space-y-1 mb-4 text-[var(--muted-foreground)]">
          <li>
            <strong>Email</strong> — a summary lands in your inbox Friday
            afternoon with your score, hero priorities status, highlights, and a link
            to plan next week.
          </li>
          <li>
            <strong>In the app</strong> — the <strong>Assess</strong> tab in
            your next Weekly Review shows the full interactive version where
            you can add your own reflections.
          </li>
        </ul>
        <h4 className="text-sm font-semibold mb-2">Your weekly score (1-10)</h4>
        <p className="mb-4 text-[var(--muted-foreground)]">
          The score is a weighted composite of four factors:
        </p>
        <div className="space-y-3 mb-4">
          <ScoreBar label="Hero priorities completion" weight={40} color="blue" />
          <ScoreBar label="Theme adherence" weight={30} color="purple" />
          <ScoreBar label="Action item closure" weight={20} color="green" />
          <ScoreBar label="Reflection streak" weight={10} color="amber" />
        </div>
        <h4 className="text-sm font-semibold mb-2">What the assessment includes</h4>
        <ul className="list-disc list-inside space-y-1 text-[var(--muted-foreground)]">
          <li>Status of each hero priority (completed, in progress, not started)</li>
          <li>Per-day theme adherence (high, medium, low)</li>
          <li>Highlights — your wins for the week</li>
          <li>Carry-forward items — suggestions for next week&apos;s priorities</li>
          <li>A supportive narrative reflecting on patterns and suggesting adjustments</li>
        </ul>
      </>
    ),
  },
  {
    id: "reflection",
    title: "Personal Reflection",
    icon: "pencil",
    content: (
      <>
        <p className="mb-4 text-[var(--muted-foreground)]">
          After reviewing the AI assessment, you can add your own thoughts in
          the <strong>Assess</strong> tab. This is a free-text area where you
          can note what you learned, what you would do differently, or
          anything else on your mind.
        </p>
        <p className="mb-4 text-[var(--muted-foreground)]">
          Saving your reflection marks the plan as fully assessed and
          contributes to your <strong>reflection streak</strong>. Reflecting
          for three or more consecutive weeks earns a 10% bonus on your
          weekly score.
        </p>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--accent)]/20 p-4">
          <p className="text-sm font-medium text-[var(--foreground)] mb-1">
            Why reflect?
          </p>
          <p className="text-sm text-[var(--muted-foreground)]">
            The most effective planning isn&apos;t just about setting goals — it&apos;s
            about building a feedback loop. Your reflections feed into next
            week&apos;s AI suggestions, making each plan smarter than the last.
          </p>
        </div>
      </>
    ),
  },
  {
    id: "kanban",
    title: "Kanban Integration",
    icon: "columns",
    content: (
      <>
        <p className="mb-4 text-[var(--muted-foreground)]">
          Your Kanban board is tightly connected to the weekly planning
          system. Here is what changes when you activate a plan:
        </p>
        <h4 className="text-sm font-semibold mb-2">Focus column</h4>
        <p className="mb-4 text-[var(--muted-foreground)]">
          A special column appears at the front of your board containing your
          hero priority cards. This column has a blue accent background and a target
          icon. It cannot be reordered or deleted while a plan is active. When
          the week ends, cards return to their original columns automatically.
        </p>
        <h4 className="text-sm font-semibold mb-2">Theme banner</h4>
        <p className="mb-4 text-[var(--muted-foreground)]">
          A subtle banner appears at the top of your board showing today&apos;s
          theme. Click it to expand the curated task list — the 5-7 cards the
          AI selected for today. Clicking a task in the list highlights it on
          the board.
        </p>
        <h4 className="text-sm font-semibold mb-2">Week rollover</h4>
        <p className="text-[var(--muted-foreground)]">
          When you confirm a new plan (or Monday arrives), the previous
          week&apos;s hero priority flags are cleared, cards in the Focus column return
          to their original columns, and fresh hero priority cards take their place.
          This happens automatically — no manual cleanup needed.
        </p>
      </>
    ),
  },
  {
    id: "briefings",
    title: "Daily Briefings & Emails",
    icon: "mail",
    content: (
      <>
        <p className="mb-4 text-[var(--muted-foreground)]">
          The weekly planning system enhances two existing email features:
        </p>
        <h4 className="text-sm font-semibold mb-2">Daily briefing</h4>
        <p className="mb-4 text-[var(--muted-foreground)]">
          Your morning briefing email now includes a <strong>Today&apos;s
          Theme</strong> section at the top, showing the theme name and the
          curated task list for the day. This replaces the generic overdue
          cards section with a more intentional, themed view of your work.
        </p>
        <h4 className="text-sm font-semibold mb-2">Weekly assessment email</h4>
        <p className="mb-4 text-[var(--muted-foreground)]">
          Every Friday afternoon you receive an assessment email containing
          your weekly score, hero priorities status, highlights, and items
          to carry forward. A &quot;Plan Next Week&quot; button links directly to the
          Reviews page so you can start your next planning session.
        </p>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--accent)]/20 p-4">
          <p className="text-sm font-medium text-[var(--foreground)] mb-1">
            Tip
          </p>
          <p className="text-sm text-[var(--muted-foreground)]">
            Use the Friday assessment email as your trigger to start the
            weekly planning ritual. Click the button, spend 30 minutes in
            the Assess &rarr; Review &rarr; Plan flow, and you&apos;re set for
            next week.
          </p>
        </div>
      </>
    ),
  },
  {
    id: "score-trend",
    title: "Tracking Progress",
    icon: "trending",
    content: (
      <>
        <p className="mb-4 text-[var(--muted-foreground)]">
          Over time, your weekly scores build into a visible trend. On the
          Reviews list page you will see a <strong>sparkline chart</strong>{" "}
          showing your last several weeks of scores. This helps you:
        </p>
        <ul className="list-disc list-inside space-y-1 mb-4 text-[var(--muted-foreground)]">
          <li>Spot whether your weeks are getting more or less productive</li>
          <li>Identify patterns — are certain weeks consistently low?</li>
          <li>Stay motivated by watching your trend line climb</li>
        </ul>
        <p className="text-[var(--muted-foreground)]">
          The score colors tell you at a glance how you are doing:
        </p>
        <div className="flex gap-4 mt-3">
          <ScoreBadge color="green" range="8-10" label="Great week" />
          <ScoreBadge color="yellow" range="5-7" label="Solid effort" />
          <ScoreBadge color="red" range="1-4" label="Room to grow" />
        </div>
      </>
    ),
  },
  {
    id: "quick-start",
    title: "Quick Start Checklist",
    icon: "check",
    content: (
      <>
        <p className="mb-4 text-[var(--muted-foreground)]">
          Ready to plan your first week? Follow these steps:
        </p>
        <ol className="space-y-3">
          <ChecklistItem
            step={1}
            text="Make sure you have some cards on your Kanban board — these are the tasks the AI will suggest as priorities."
          />
          <ChecklistItem
            step={2}
            text='Go to Reviews in the sidebar and click the Plan tab.'
          />
          <ChecklistItem
            step={3}
            text='Click "Get AI Suggestions" to let the AI analyze your tasks and calendar.'
          />
          <ChecklistItem
            step={4}
            text="Review the suggested hero priorities and daily themes. Adjust anything that doesn't feel right."
          />
          <ChecklistItem
            step={5}
            text='Click "Confirm Plan" to activate. Your Focus column and hero priority badges will appear on the Kanban board immediately.'
          />
          <ChecklistItem
            step={6}
            text="Each morning, check your daily briefing email or the theme banner on your board to see what to focus on."
          />
          <ChecklistItem
            step={7}
            text="On Friday, check your assessment email. Click through to the Assess tab, add your reflection, and plan the next week."
          />
        </ol>
        <div className="mt-6 rounded-lg border border-[var(--border)] bg-[var(--accent)]/20 p-4">
          <p className="text-sm font-medium text-[var(--foreground)] mb-1">
            The 30-minute ritual
          </p>
          <p className="text-sm text-[var(--muted-foreground)]">
            The most impactful habit you can build is spending 30 minutes
            each week in the Assess &rarr; Review &rarr; Plan flow. Do it
            consistently — Friday evening or Monday morning — and the
            compounding effect on your productivity will be significant.
          </p>
        </div>
      </>
    ),
  },
];

// ── Helper Components ────────────────────────────────────

function StepCard({
  number,
  title,
  description,
  color,
}: {
  number: string;
  title: string;
  description: string;
  color: "blue" | "purple" | "green";
}) {
  const colors = {
    blue: "border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300",
    purple: "border-purple-500 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300",
    green: "border-green-500 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300",
  };
  return (
    <div className={`rounded-lg border-l-4 p-4 ${colors[color]}`}>
      <div className="text-2xl font-bold opacity-40 mb-1">{number}</div>
      <div className="font-semibold text-[var(--foreground)] mb-1">{title}</div>
      <div className="text-sm text-[var(--muted-foreground)]">{description}</div>
    </div>
  );
}

function ScoreBar({
  label,
  weight,
  color,
}: {
  label: string;
  weight: number;
  color: "blue" | "purple" | "green" | "amber";
}) {
  const bg = {
    blue: "bg-blue-500",
    purple: "bg-purple-500",
    green: "bg-green-500",
    amber: "bg-amber-500",
  };
  return (
    <div className="flex items-center gap-3">
      <div className="w-32 text-sm text-[var(--muted-foreground)] shrink-0">
        {label}
      </div>
      <div className="flex-1 h-3 rounded-full bg-[var(--accent)] overflow-hidden">
        <div
          className={`h-full rounded-full ${bg[color]}`}
          style={{ width: `${weight}%` }}
        />
      </div>
      <div className="w-10 text-sm font-medium text-[var(--foreground)] text-right">
        {weight}%
      </div>
    </div>
  );
}

function ScoreBadge({
  color,
  range,
  label,
}: {
  color: "green" | "yellow" | "red";
  range: string;
  label: string;
}) {
  const styles = {
    green: "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300",
    yellow: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300",
    red: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
  };
  return (
    <div className={`rounded-lg px-3 py-2 text-center ${styles[color]}`}>
      <div className="text-lg font-bold">{range}</div>
      <div className="text-xs">{label}</div>
    </div>
  );
}

function ChecklistItem({ step, text }: { step: number; text: string }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-bold text-white">
        {step}
      </span>
      <span className="text-[var(--muted-foreground)] text-sm leading-relaxed">
        {text}
      </span>
    </li>
  );
}

// ── Section Icons ────────────────────────────────────────

function SectionIcon({ type, size = 20 }: { type: string; size?: number }) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (type) {
    case "rocket":
      return (
        <svg {...props}>
          <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
          <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
          <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
          <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
        </svg>
      );
    case "star":
      return (
        <svg {...props}>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
    case "palette":
      return (
        <svg {...props}>
          <circle cx="13.5" cy="6.5" r="0.5" fill="currentColor" />
          <circle cx="17.5" cy="10.5" r="0.5" fill="currentColor" />
          <circle cx="8.5" cy="7.5" r="0.5" fill="currentColor" />
          <circle cx="6.5" cy="12" r="0.5" fill="currentColor" />
          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
        </svg>
      );
    case "chart":
      return (
        <svg {...props}>
          <path d="M3 3v18h18" />
          <path d="m19 9-5 5-4-4-3 3" />
        </svg>
      );
    case "pencil":
      return (
        <svg {...props}>
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          <path d="m15 5 4 4" />
        </svg>
      );
    case "columns":
      return (
        <svg {...props}>
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
          <line x1="9" x2="9" y1="3" y2="21" />
          <line x1="15" x2="15" y1="3" y2="21" />
        </svg>
      );
    case "mail":
      return (
        <svg {...props}>
          <rect width="20" height="16" x="2" y="4" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
      );
    case "trending":
      return (
        <svg {...props}>
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
          <polyline points="16 7 22 7 22 13" />
        </svg>
      );
    case "check":
      return (
        <svg {...props}>
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      );
    default:
      return null;
  }
}

// ── Main Page Component ──────────────────────────────────

export default function HelpPage() {
  const [activeSection, setActiveSection] = useState("overview");

  return (
    <div className="flex h-full">
      {/* Left navigation */}
      <aside className="hidden w-56 shrink-0 border-r border-[var(--border)] bg-[var(--card)] p-4 lg:block overflow-y-auto">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-3">
          Help Guide
        </h2>
        <nav className="space-y-0.5">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              onClick={() => {
                setActiveSection(section.id);
                document
                  .getElementById(`section-${section.id}`)
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                activeSection === section.id
                  ? "bg-[var(--primary)]/10 text-[var(--primary)] font-medium"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
              }`}
            >
              <SectionIcon type={section.icon} size={16} />
              {section.title}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-6 py-8">
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
            Weekly Planning Guide
          </h1>
          <p className="text-[var(--muted-foreground)] mb-8">
            Everything you need to know about planning and winning your week
            with MyOpenBrain.
          </p>

          <div className="space-y-12">
            {SECTIONS.map((section) => (
              <section
                key={section.id}
                id={`section-${section.id}`}
                className="scroll-mt-8"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
                    <SectionIcon type={section.icon} size={18} />
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">
                    {section.title}
                  </h3>
                </div>
                {section.content}
              </section>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
