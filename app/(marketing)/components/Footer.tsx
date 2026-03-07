export function Footer() {
  return (
    <footer className="px-6 py-12 border-t border-slate-800/50">
      <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-white">MyOpenBrain</span>
        </div>
        <p className="text-sm text-slate-500">
          &copy; {new Date().getFullYear()} myopenbrain.com. All rights
          reserved.
        </p>
      </div>
    </footer>
  );
}
