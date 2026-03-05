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

        {/* Brain visualization */}
        <div className="mt-4">
          <img
            src="/images/landing-brain.png"
            alt="AI brain connecting meetings, emails, decisions, and tasks into one intelligent system"
            className="w-full rounded-xl"
          />
        </div>
      </div>
    </section>
  );
}
