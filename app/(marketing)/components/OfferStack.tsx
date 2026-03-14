const offerItems = [
  {
    name: "Silent Meeting Recorder",
    description: "Captures every call across Zoom, Teams, Meet, Slack",
    value: "$20/mo",
    comparison: "Competitors charge $15–20/mo for this alone",
  },
  {
    name: "AI Email Manager",
    description: "Auto-categorizes, extracts action items, natural language search",
    value: "$25/mo",
    comparison: "SaneBox charges $12–36/mo for less",
  },
  {
    name: "Brain Chat",
    description: "Ask questions across ALL your meetings, emails, and decisions",
    value: "$30/mo",
    comparison: "No competitor offers this",
  },
  {
    name: "Decision Register",
    description: "Never lose a decision — auto-extracted with context and rationale",
    value: "$15/mo",
    comparison: "Usually buried in enterprise tools",
  },
  {
    name: "Kanban Task Board",
    description: "Action items flow automatically from calls and emails",
    value: "$10/mo",
    comparison: "Built-in, no extra app needed",
  },
  {
    name: "Weekly AI Briefings",
    description: "Synthesized intelligence delivered to your inbox",
    value: "$15/mo",
    comparison: "No competitor offers cross-source synthesis",
  },
];

function CheckIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-emerald-400 flex-shrink-0"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function OfferStack() {
  return (
    <section className="px-6 py-24 sm:py-32 border-t border-slate-800/50">
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            6 tools. One price.
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Less than competitors charge for one.
            </span>
          </h2>
          <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
            Other tools do one thing well. MyOpenBrain replaces six of them —
            and connects everything together.
          </p>
        </div>

        <div className="space-y-3">
          {offerItems.map((item) => (
            <div
              key={item.name}
              className="flex items-start gap-4 rounded-xl border border-slate-800 bg-slate-900/50 p-5 sm:p-6"
            >
              <CheckIcon />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-4 flex-wrap">
                  <h3 className="text-base font-semibold text-white">
                    {item.name}
                  </h3>
                  <span className="text-sm font-medium text-slate-500 line-through">
                    {item.value}
                  </span>
                </div>
                <p className="text-sm text-slate-400 mt-1">{item.description}</p>
                <p className="text-xs text-blue-400/70 mt-1">{item.comparison}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Total value vs actual price */}
        <div className="mt-8 rounded-xl border-2 border-blue-500/30 bg-blue-500/[0.04] p-6 sm:p-8 text-center">
          <div className="flex items-center justify-center gap-8 flex-wrap">
            <div>
              <p className="text-sm text-slate-400 uppercase tracking-wide mb-1">
                Total value
              </p>
              <p className="text-3xl font-bold text-slate-500 line-through">
                $115/mo
              </p>
            </div>
            <div>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-blue-400"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-blue-400 uppercase tracking-wide mb-1">
                You pay
              </p>
              <p className="text-4xl font-bold text-white">
                $39<span className="text-lg text-slate-400">/mo</span>
              </p>
              <p className="text-sm text-slate-500 mt-1">
                or $29/mo billed annually
              </p>
            </div>
          </div>
          <div className="mt-6">
            <a
              href="/auth/sign-up"
              className="inline-flex items-center px-8 py-4 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold text-lg hover:from-blue-400 hover:to-blue-500 transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
            >
              Start Your Free 14-Day Trial
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
