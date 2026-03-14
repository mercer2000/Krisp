export function NavHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 backdrop-blur-md bg-[#0a0e1a]/80 border-b border-slate-800/50">
      <div className="mx-auto max-w-6xl flex items-center justify-between">
        <span className="text-xl font-bold text-white">MyOpenBrain</span>
        <div className="flex items-center gap-6">
          <a href="/research" className="text-sm text-slate-400 hover:text-white transition-colors">
            Research
          </a>
          <a href="/features/desktop-recorder" className="text-sm text-slate-400 hover:text-white transition-colors">
            Desktop Recorder
          </a>
          <a href="/auth/sign-in" className="text-sm text-slate-400 hover:text-white transition-colors">
            Sign in
          </a>
          <a
            href="/auth/sign-up"
            className="inline-flex items-center px-5 py-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium hover:bg-blue-500/20 transition-all"
          >
            Start Free Trial
          </a>
        </div>
      </div>
    </header>
  );
}
