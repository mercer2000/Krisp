import type { Metadata } from "next";
import { NavHeader } from "../../components/NavHeader";
import { Footer } from "../../components/Footer";

export const metadata: Metadata = {
  title:
    "Desktop Recorder — Every Call Becomes Searchable Knowledge | MyOpenBrain",
  description:
    "MyOpenBrain's desktop recorder silently captures and transcribes every call on your Windows PC. Decisions, action items, and key points flow into a searchable knowledge graph.",
};

const problems = [
  {
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        />
      </svg>
    ),
    title: "The meeting ends. The memory fades.",
    body: "You had 4 calls today. By tomorrow, you'll remember fragments. By next week, almost nothing.",
  },
  {
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
        />
      </svg>
    ),
    title: "Notes can\u2019t keep up with conversation.",
    body: "You\u2019re either participating or transcribing. You can\u2019t do both well.",
  },
  {
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
        />
      </svg>
    ),
    title: "Searching for \u2018that thing someone said\u2019 is hopeless.",
    body: "It\u2019s somewhere in a call last week. Or was it an email? Good luck finding it.",
  },
];

const steps = [
  {
    number: "1",
    title: "Install on your Windows PC",
    body: "A lightweight app that runs in the background. No configuration needed.",
  },
  {
    number: "2",
    title: "It records every call automatically",
    body: "Zoom, Teams, Meet, Slack, any audio call. No bots join your meeting \u2014 it captures locally.",
  },
  {
    number: "3",
    title: "AI extracts what matters",
    body: "Key points, decisions, and action items are pulled from the transcript and added to your knowledge graph. Search across all your calls, emails, and tasks in one place.",
  },
];

const features = [
  {
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Zm3.75 11.625a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
        />
      </svg>
    ),
    title: "Searchable transcripts",
    body: "Full transcripts from every call, searchable by keyword or natural language query.",
  },
  {
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
        />
      </svg>
    ),
    title: "Auto-extracted decisions",
    body: "Decisions are identified with context, participants, and rationale \u2014 no manual tagging.",
  },
  {
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z"
        />
      </svg>
    ),
    title: "Action items on your board",
    body: "Tasks mentioned in calls flow directly to your Kanban board with due dates.",
  },
  {
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
        />
      </svg>
    ),
    title: "Cross-source AI queries",
    body: "Ask questions across all your meetings, emails, and tasks. \u2018What did we decide about the launch date?\u2019 gets a sourced answer.",
  },
];

const platforms = [
  "Zoom",
  "Microsoft Teams",
  "Google Meet",
  "Slack Huddles",
  "In-person calls",
];

export default function DesktopRecorderPage() {
  return (
    <>
      <NavHeader />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden px-6 pt-32 pb-16 sm:pt-40 sm:pb-24">
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-600/8 via-transparent to-transparent" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-gradient-to-r from-cyan-500/15 via-teal-500/10 to-emerald-500/8 rounded-full blur-3xl" />
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
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/5">
                <div className="w-2 h-2 rounded-full bg-cyan-400" />
                <span className="text-cyan-400 text-sm font-medium tracking-wide uppercase">
                  Desktop Recorder
                </span>
              </div>
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white leading-[1.1] text-center">
              Every call becomes
              <br />
              <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
                searchable knowledge
              </span>
            </h1>
            <p className="mt-8 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed text-center">
              MyOpenBrain silently records and transcribes every call on your
              Windows PC — then extracts decisions, action items, and key points
              into a knowledge graph you can search across everything.
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

        {/* The Problem */}
        <section className="px-6 py-20 sm:py-28 border-y border-slate-800/50">
          <div className="mx-auto max-w-6xl">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {problems.map((problem) => (
                <div
                  key={problem.title}
                  className="rounded-xl border border-slate-800 bg-slate-900/50 p-8"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-cyan-500/10 text-cyan-400 mb-5">
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

        {/* How It Works */}
        <section className="px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 text-center">
              How it works
            </h2>
            <p className="text-lg text-slate-400 mb-16 max-w-xl mx-auto text-center">
              Three steps. No configuration. No bots.
            </p>

            <div className="space-y-6">
              {steps.map((step) => (
                <div
                  key={step.number}
                  className="flex items-start gap-6 rounded-xl border border-slate-800 bg-slate-900/50 p-8"
                >
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold text-xl flex-shrink-0">
                    {step.number}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {step.title}
                    </h3>
                    <p className="text-slate-400 leading-relaxed">
                      {step.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What You Get */}
        <section className="px-6 py-24 sm:py-32 border-t border-slate-800/50">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 text-center">
              What you get
            </h2>
            <p className="text-lg text-slate-400 mb-16 max-w-xl mx-auto text-center">
              Every call automatically feeds your knowledge graph with
              structured, searchable data.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="group rounded-xl border border-slate-800 bg-slate-900/50 p-6 hover:border-cyan-500/20 hover:bg-cyan-500/[0.02] transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-cyan-400 group-hover:text-cyan-300 transition-colors">
                      {feature.icon}
                    </div>
                    <h3 className="text-white font-semibold">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {feature.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* No Bots, No Friction */}
        <section className="px-6 py-24 sm:py-32 border-t border-slate-800/50">
          <div className="mx-auto max-w-4xl">
            <div className="relative rounded-xl border border-cyan-500/20 bg-cyan-500/[0.03] p-8 sm:p-12 overflow-hidden">
              <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                  No bots. No awkward &lsquo;Recorder has joined.&rsquo;
                  <br />
                  No permissions to manage.
                </h2>
                <p className="text-slate-400 leading-relaxed max-w-2xl mb-8">
                  Unlike meeting bot services, MyOpenBrain records directly on
                  your desktop. Your colleagues never know — and you never have
                  to ask permission to record your own machine&apos;s audio. It
                  works with every platform.
                </p>
                <div className="flex flex-wrap gap-2">
                  {platforms.map((platform) => (
                    <span
                      key={platform}
                      className="inline-flex items-center px-3 py-1.5 rounded-lg border border-cyan-500/15 bg-cyan-500/5 text-cyan-300 text-sm"
                    >
                      {platform}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Research Tie-In */}
        <section className="px-6 py-12 border-t border-slate-800/50">
          <div className="mx-auto max-w-4xl">
            <a
              href="/research"
              className="group flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 p-6 hover:border-amber-500/20 transition-colors duration-300"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex-shrink-0">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
                    />
                  </svg>
                </div>
                <p className="text-slate-400 text-sm sm:text-base">
                  Research shows knowledge workers lose{" "}
                  <strong className="text-amber-400">28%</strong> of their week
                  to email and meeting overhead.
                </p>
              </div>
              <div className="text-slate-500 group-hover:text-amber-400 transition-colors flex-shrink-0 ml-4">
                <svg
                  className="w-5 h-5 group-hover:translate-x-0.5 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                  />
                </svg>
              </div>
            </a>
          </div>
        </section>

        {/* CTA */}
        <section className="relative px-6 py-24 sm:py-32 border-t border-slate-800/50 overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl" />
          </div>

          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Stop losing what was said
            </h2>
            <p className="mt-4 text-lg text-slate-400 max-w-xl mx-auto">
              Install once. Every call after that becomes part of your searchable
              knowledge.
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
