const proofPoints = [
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
    stat: "28%",
    description:
      "of the average knowledge worker\u2019s week is consumed by email alone",
    source: "McKinsey Global Institute",
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
          d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
        />
      </svg>
    ),
    stat: "90+",
    description:
      "minutes lost daily recovering focus after email interruptions",
    source: "Journal of Applied Psychology",
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
          d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z"
        />
      </svg>
    ),
    stat: "$29K",
    description:
      "per employee per year spent on email \u2014 much of it wasted",
    source: "Based on 28% of 40h/week at $50/hr",
  },
];

export function SocialProof() {
  return (
    <section className="px-6 py-24 sm:py-32 border-t border-slate-800/50">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            The problem is bigger than you think
          </h2>
          <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
            Research shows email and meeting overhead is silently costing
            knowledge workers hours every week — and companies thousands per
            employee.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          {proofPoints.map((point) => (
            <div
              key={point.stat}
              className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 text-center"
            >
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 mb-4">
                {point.icon}
              </div>
              <div className="text-3xl sm:text-4xl font-bold text-amber-400 tracking-tight">
                {point.stat}
              </div>
              <p className="mt-2 text-slate-400 text-sm leading-relaxed">
                {point.description}
              </p>
              <p className="mt-2 text-xs text-slate-600">{point.source}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <a
            href="/research"
            className="inline-flex items-center gap-2 text-sm text-amber-400/80 hover:text-amber-300 transition-colors group"
          >
            <span>See the full research</span>
            <svg
              className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
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
          </a>
        </div>
      </div>
    </section>
  );
}
