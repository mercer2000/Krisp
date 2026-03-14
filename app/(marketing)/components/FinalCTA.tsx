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
          6 tools in one — meeting recorder, email manager, AI search, decision
          tracker, task board, and weekly briefings.
        </p>

        {/* Guarantee */}
        <div className="mt-10 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-6 text-left max-w-lg mx-auto">
          <div className="flex items-start gap-3">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-emerald-400 flex-shrink-0 mt-0.5"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            <div>
              <h3 className="text-base font-semibold text-emerald-400 mb-1">
                The &ldquo;3 Hours Back&rdquo; Guarantee
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Try MyOpenBrain for 14 days with full access. If you don&apos;t
                save at least 3 hours in your first week, cancel instantly — no
                questions asked. We&apos;re confident because our average user saves
                3+ hours per week on email and meeting overhead.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-4">
          <a
            href="/auth/sign-up"
            className="inline-flex items-center px-8 py-4 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold text-lg hover:from-blue-400 hover:to-blue-500 transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
          >
            Start Your Free 14-Day Trial
          </a>
          <p className="text-sm text-slate-500">
            No credit card required &middot; Cancel anytime
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
            </span>
            <span className="text-xs font-medium text-amber-400">
              Founder&apos;s Pricing — lock in your rate for life before prices increase
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
