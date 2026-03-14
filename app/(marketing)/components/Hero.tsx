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
          Every call. Every email. Every chat.
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-cyan-300 bg-clip-text text-transparent">
            Searchable knowledge.
          </span>
        </h1>
        <p className="mt-8 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          6 tools in one. Meeting recorder, email manager, AI search, decision
          tracker, task board, and weekly briefings — all for less than what
          others charge for just one.
        </p>
        <p className="mt-3 text-sm font-medium text-blue-400/80">
          Save 3+ hours per week on email and meeting overhead
        </p>
        <div className="mt-10 flex flex-col items-center gap-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/auth/sign-up"
              className="inline-flex items-center px-8 py-4 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold text-lg hover:from-blue-400 hover:to-blue-500 transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
            >
              Start Your Free 14-Day Trial
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center px-8 py-4 rounded-lg border border-slate-700 text-slate-300 font-semibold text-lg hover:border-slate-500 hover:text-white transition-all"
            >
              See How It Works
            </a>
          </div>
          <p className="text-sm text-slate-500">
            No credit card required &middot; Full access for 14 days &middot; Set up in 5 minutes
          </p>
          <div className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
            </span>
            <span className="text-xs font-medium text-amber-400">
              Founder&apos;s Pricing — lock in your rate for life
            </span>
          </div>
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
