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
          See how MyOpenBrain keeps you in control of every meeting, decision, and task.
        </p>
        <div className="mt-10">
          <a
            href="mailto:hello@myopenbrain.com?subject=Demo Request"
            className="inline-flex items-center px-8 py-4 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold text-lg hover:from-blue-400 hover:to-blue-500 transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
          >
            Book a Demo
          </a>
        </div>
      </div>
    </section>
  );
}
