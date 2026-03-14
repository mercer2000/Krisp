import type { Metadata } from "next";
import { NavHeader } from "../components/NavHeader";
import { Footer } from "../components/Footer";

export const metadata: Metadata = {
  title: "The Hidden Cost of Email — Research | MyOpenBrain",
  description:
    "Research shows knowledge workers lose up to 28% of their week to email. See the data on how unmanaged email destroys productivity — and what to do about it.",
};

const stats = [
  {
    value: "28%",
    label: "of a knowledge worker's week consumed by email",
    source: "McKinsey Global Institute",
    href: "https://www.mckinsey.com/industries/technology-media-and-telecommunications/our-insights/the-social-economy",
  },
  {
    value: "1 in 3",
    label: "employees spend a full workday per week in their inbox",
    source: "mailmanager",
    href: "https://blog.mailmanager.com/blog/new-research-reveals-email-dominates-business-communication-but-poor-processes-kill-productivity-and-frustrate-employees",
  },
  {
    value: "90+",
    label: "minutes lost daily recovering focus after email interruptions",
    source: "Journal of Applied Psychology",
    href: "https://www.hrdive.com/news/excess-email-keeps-managers-from-leading-study-says/532787/",
  },
];

const findings = [
  {
    title: "Email dominates — but processes are broken",
    body: "Surveys of knowledge workers find that about one in three employees spend nearly a full workday per week just managing their inbox. The problem isn't email itself — it's the lack of systems to process it efficiently.",
    source: "mailmanager",
    href: "https://blog.mailmanager.com/blog/new-research-reveals-email-dominates-business-communication-but-poor-processes-kill-productivity-and-frustrate-employees",
  },
  {
    title: "Years of your career, spent in email",
    body: "Productivity research estimates email-related tasks can consume up to about 28% of a knowledge worker's week. Over the course of a career, that's years spent reading, sorting, searching, and responding to messages — time that could be spent on actual work.",
    source: "McKinsey Global Institute",
    href: "https://www.mckinsey.com/industries/technology-media-and-telecommunications/our-insights/the-social-economy",
  },
  {
    title: "Interruptions cost more than the interruption itself",
    body: "Employees can lose more than 90 minutes per day just recovering focus after email-related interruptions. It's not the 30 seconds it takes to read a notification — it's the 23 minutes it takes to get back to deep work afterwards.",
    source: "Journal of Applied Psychology via hrdive",
    href: "https://www.hrdive.com/news/excess-email-keeps-managers-from-leading-study-says/532787/",
  },
  {
    title: "Email is a top source of workplace stress",
    body: "Many workers report email as one of the biggest productivity drains and a major source of stress, largely due to time spent searching for messages and dealing with constant notifications. The inbox becomes a source of anxiety rather than a communication tool.",
    source: "FEEA",
    href: "https://feea.org/2024/10/email-management/",
  },
];

const strategies = [
  {
    name: "Time-boxing & batching",
    description:
      "Check email in defined blocks (e.g., 2–4 times per day) instead of constantly. This reduces context switching and protects deep-work time.",
    sources: [
      {
        label: "feea",
        href: "https://feea.org/2024/10/email-management/",
      },
    ],
  },
  {
    name: "Turn off push notifications",
    description:
      "Removing pop-ups and sounds significantly reduces attention residue and recovery time after interruptions.",
    sources: [
      {
        label: "FEEA",
        href: "https://feea.org/2024/10/email-management/",
      },
    ],
  },
  {
    name: '"Two-minute" or "one-touch" rule',
    description:
      "If a message can be handled in under two minutes, do it once and archive it. Stop revisiting the same email three or four times before acting.",
    sources: [
      {
        label: "feea",
        href: "https://feea.org/2024/10/email-management/",
      },
    ],
  },
  {
    name: "Rules, filters, and labels",
    description:
      "Automatically routing newsletters, CCs, and low-priority mail into separate folders lowers inbox volume and keeps your primary view for high-value items.",
    sources: [
      {
        label: "feea",
        href: "https://feea.org/2024/10/email-management/",
      },
    ],
  },
  {
    name: "Structured organization",
    description:
      "Research finds that structured email organization — folders, tags, or search-first habits — improves retrieval performance and lowers time lost hunting for messages.",
    sources: [
      {
        label: "FEEA",
        href: "https://feea.org/2024/10/email-management/",
      },
    ],
  },
  {
    name: "Convert emails to tasks",
    description:
      "Converting emails into calendar items or task entries prevents the inbox from acting as a to-do list — which correlates with overload and stress.",
    sources: [
      {
        label: "feea",
        href: "https://feea.org/2024/10/email-management/",
      },
    ],
  },
  {
    name: "Shared inboxes & delegation",
    description:
      "In team settings, shared inbox tools and delegation reduce individual overload and improve visibility into who owns what.",
    sources: [
      {
        label: "FEEA",
        href: "https://feea.org/2024/10/email-management/",
      },
    ],
  },
];

const experimentSteps = [
  {
    step: "1",
    action: "Turn off desktop and mobile email notifications",
    source: {
      label: "FEEA",
      href: "https://feea.org/2024/10/email-management/",
    },
  },
  {
    step: "2",
    action:
      "Schedule 3 email blocks (e.g., 9:30 AM, 1:00 PM, 4:30 PM) of 20–30 minutes each",
    source: {
      label: "feea",
      href: "https://feea.org/2024/10/email-management/",
    },
  },
  {
    step: "3",
    action:
      "During each block: archive low-value items, apply the two-minute rule, convert anything requiring real work into a task with a due date — then archive the email",
    source: {
      label: "feea",
      href: "https://feea.org/2024/10/email-management/",
    },
  },
  {
    step: "4",
    action:
      "Add filters to auto-file newsletters, automated alerts, and noisy CCs",
    source: {
      label: "FEEA",
      href: "https://feea.org/2024/10/email-management/",
    },
  },
];

export default function ResearchPage() {
  return (
    <>
      <NavHeader />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden px-6 pt-32 pb-16 sm:pt-40 sm:pb-24">
          {/* Background effects */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-b from-amber-600/8 via-transparent to-transparent" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-gradient-to-r from-amber-500/15 via-orange-500/8 to-red-500/10 rounded-full blur-3xl" />
            <div
              className="absolute inset-0 opacity-[0.02]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
                backgroundSize: "64px 64px",
              }}
            />
          </div>

          <div className="mx-auto max-w-4xl">
            <div className="flex items-center justify-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/20 bg-amber-500/5">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-amber-400 text-sm font-medium tracking-wide uppercase">
                  Research
                </span>
              </div>
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white leading-[1.1] text-center">
              The hidden cost of
              <br />
              <span className="bg-gradient-to-r from-amber-400 via-orange-300 to-red-400 bg-clip-text text-transparent">
                unmanaged email
              </span>
            </h1>
            <p className="mt-8 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed text-center">
              Knowledge workers spend up to 28% of their week on email. The
              research is clear: without a system, your inbox is silently
              destroying your productivity — and costing you real money.
            </p>
          </div>
        </section>

        {/* Stat Callouts */}
        <section className="px-6 py-16 sm:py-20 border-y border-slate-800/50">
          <div className="mx-auto max-w-5xl">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {stats.map((stat) => (
                <div
                  key={stat.value}
                  className="relative rounded-xl border border-amber-500/15 bg-amber-500/[0.03] p-8 text-center"
                >
                  <div className="text-5xl sm:text-6xl font-bold text-amber-400 tracking-tight">
                    {stat.value}
                  </div>
                  <p className="mt-3 text-slate-400 leading-relaxed text-sm">
                    {stat.label}
                  </p>
                  <a
                    href={stat.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block text-xs text-amber-500/60 hover:text-amber-400 transition-colors underline underline-offset-2"
                  >
                    {stat.source}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What the Research Says */}
        <section className="px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              What the research says
            </h2>
            <p className="text-lg text-slate-400 mb-16 max-w-2xl">
              Study after study confirms the same pattern: email is consuming a
              disproportionate share of the workweek, and most of that time is
              wasted.
            </p>

            <div className="space-y-8">
              {findings.map((finding, i) => (
                <div
                  key={finding.title}
                  className="group relative rounded-xl border border-slate-800 bg-slate-900/50 p-8 hover:border-amber-500/20 transition-colors duration-300"
                >
                  <div className="flex items-start gap-6">
                    <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 font-bold text-lg flex-shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white mb-3">
                        {finding.title}
                      </h3>
                      <p className="text-slate-400 leading-relaxed">
                        {finding.body}
                      </p>
                      <a
                        href={finding.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex items-center gap-1.5 text-sm text-amber-500/60 hover:text-amber-400 transition-colors"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                          />
                        </svg>
                        Source: {finding.source}
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* The Real Cost — money framing */}
        <section className="px-6 py-24 sm:py-32 border-t border-slate-800/50">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Put a dollar amount on it
            </h2>
            <p className="text-lg text-slate-400 mb-12 max-w-2xl">
              When you translate lost time into salary, the cost of email
              mismanagement becomes concrete.
            </p>

            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 sm:p-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">
                    The math for one employee
                  </h3>
                  <ul className="space-y-4 text-slate-400">
                    <li className="flex items-start gap-3">
                      <span className="text-amber-400 font-medium flex-shrink-0 mt-0.5">
                        &rsaquo;
                      </span>
                      <span>
                        <strong className="text-slate-200">28% of 40 hours</strong>{" "}
                        = ~11.2 hours/week on email
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-amber-400 font-medium flex-shrink-0 mt-0.5">
                        &rsaquo;
                      </span>
                      <span>
                        At{" "}
                        <strong className="text-slate-200">$50/hour</strong>{" "}
                        (a moderate knowledge worker rate)
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-amber-400 font-medium flex-shrink-0 mt-0.5">
                        &rsaquo;
                      </span>
                      <span>
                        That&apos;s{" "}
                        <strong className="text-slate-200">
                          $560/week
                        </strong>{" "}
                        or{" "}
                        <strong className="text-slate-200">
                          ~$29,000/year
                        </strong>{" "}
                        per employee
                      </span>
                    </li>
                  </ul>
                </div>
                <div className="flex flex-col justify-center sm:border-l sm:border-slate-800 sm:pl-8">
                  <div className="text-center">
                    <div className="text-4xl sm:text-5xl font-bold text-amber-400 tracking-tight">
                      $29K
                    </div>
                    <p className="mt-2 text-slate-400 text-sm">
                      per employee, per year
                    </p>
                    <p className="mt-1 text-slate-500 text-xs">
                      spent on email — much of it wasted
                    </p>
                  </div>
                  <div className="mt-6 text-center">
                    <p className="text-slate-500 text-sm">
                      A team of 10?{" "}
                      <strong className="text-amber-400/80">
                        $290,000/year.
                      </strong>
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-800">
                <p className="text-slate-500 text-sm leading-relaxed">
                  Even saving 20% of that time — roughly 2 hours per week per
                  person — returns{" "}
                  <strong className="text-slate-300">
                    $5,200 per employee per year
                  </strong>{" "}
                  in reclaimed productivity. For a 10-person team, that&apos;s{" "}
                  <strong className="text-slate-300">$52,000</strong> back into
                  actual work.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Research-Backed Strategies */}
        <section className="px-6 py-24 sm:py-32 border-t border-slate-800/50">
          <div className="mx-auto max-w-4xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/5 mb-6">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="text-blue-400 text-sm font-medium tracking-wide uppercase">
                Solutions
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Research-backed strategies that work
            </h2>
            <p className="text-lg text-slate-400 mb-16 max-w-2xl">
              Studies and practitioner reports converge on a set of effective
              patterns for managing email without letting it manage you.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {strategies.map((strategy) => (
                <div
                  key={strategy.name}
                  className="group rounded-xl border border-slate-800 bg-slate-900/50 p-6 hover:border-blue-500/20 hover:bg-blue-500/[0.02] transition-all duration-300"
                >
                  <h3 className="text-white font-semibold mb-2">
                    {strategy.name}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-3">
                    {strategy.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {strategy.sources.map((source) => (
                      <a
                        key={source.href}
                        href={source.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500/50 hover:text-blue-400 transition-colors underline underline-offset-2"
                      >
                        {source.label}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Try This Experiment */}
        <section className="px-6 py-24 sm:py-32 border-t border-slate-800/50">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Try this for one week
            </h2>
            <p className="text-lg text-slate-400 mb-12 max-w-2xl">
              A simple 4-step experiment you can start Monday. No tools
              required — just discipline and a timer.
            </p>

            <div className="space-y-4">
              {experimentSteps.map((item) => (
                <div
                  key={item.step}
                  className="flex items-start gap-5 rounded-xl border border-slate-800 bg-slate-900/50 p-6"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-lg flex-shrink-0">
                    {item.step}
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-300 leading-relaxed">
                      {item.action}
                    </p>
                    <a
                      href={item.source.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-xs text-slate-500 hover:text-blue-400 transition-colors underline underline-offset-2"
                    >
                      {item.source.label}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA — What MyOpenBrain does */}
        <section className="relative px-6 py-24 sm:py-32 border-t border-slate-800/50 overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl" />
          </div>

          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Or let AI do the heavy lifting
            </h2>
            <p className="mt-4 text-lg text-slate-400 max-w-xl mx-auto">
              MyOpenBrain applies these strategies automatically — extracting
              action items, surfacing decisions, and turning your inbox into a
              system that works for you, not against you.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4">
              <a
                href="/auth/sign-up"
                className="inline-flex items-center px-8 py-4 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold text-lg hover:from-blue-400 hover:to-blue-500 transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
              >
                Start Your Free 14-Day Trial
              </a>
              <p className="text-sm text-slate-500">
                No credit card required. Set up in minutes.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
