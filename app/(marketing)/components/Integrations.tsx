const integrations = [
  "Microsoft 365",
  "Gmail",
  "Zoom",
  "Krisp",
  "Telegram",
  "Outlook",
];

export function Integrations() {
  return (
    <section className="px-6 py-16 border-t border-slate-800/50">
      <div className="mx-auto max-w-4xl text-center">
        <p className="text-sm font-medium text-slate-500 uppercase tracking-widest mb-8">
          Integrates with your stack
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
          {integrations.map((name) => (
            <span
              key={name}
              className="text-lg font-medium text-slate-600"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
