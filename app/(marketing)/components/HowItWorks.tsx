const steps = [
  {
    number: "01",
    title: "Install the app, connect your email",
    description:
      "Install the desktop recorder on your Windows PC and connect your Gmail or Outlook. Takes under 5 minutes.",
  },
  {
    number: "02",
    title: "Everything is captured automatically",
    description:
      "Every call is recorded and transcribed. Every email is classified and indexed. Decisions and action items are extracted \u2014 all in the background, zero effort.",
  },
  {
    number: "03",
    title: "Search, ask, and stay on top",
    description:
      "Search across all your calls, emails, and tasks with AI. Get weekly briefings. Track decisions and action items on your board.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="px-6 py-24 sm:py-32 border-t border-slate-800/50">
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Up and running in minutes
          </h2>
        </div>
        <div className="space-y-12">
          {steps.map((step) => (
            <div key={step.number} className="flex gap-8 items-start">
              <div className="flex-shrink-0 w-16 h-16 rounded-full border border-slate-700 flex items-center justify-center">
                <span className="text-xl font-bold text-blue-400">
                  {step.number}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-slate-400 leading-relaxed max-w-lg">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
