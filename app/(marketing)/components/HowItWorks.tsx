const steps = [
  {
    number: "01",
    title: "Connect your tools",
    description:
      "Link your calendar, email, and Krisp in minutes. We integrate with Microsoft 365, Gmail, Zoom, and more.",
  },
  {
    number: "02",
    title: "AI captures everything",
    description:
      "Meetings are transcribed, emails are classified, decisions are extracted — automatically, in the background.",
  },
  {
    number: "03",
    title: "Ask, review, decide",
    description:
      "Search across everything with AI. Get weekly briefings. Track decisions and action items in one place.",
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
