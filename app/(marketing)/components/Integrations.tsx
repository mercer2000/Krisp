const integrations = [
  { name: "Gmail", category: "email" },
  { name: "Outlook", category: "email" },
  { name: "Microsoft 365", category: "email" },
  { name: "Zoom", category: "calls" },
  { name: "Microsoft Teams", category: "calls" },
  { name: "Google Meet", category: "calls" },
  { name: "Slack", category: "calls" },
  { name: "Krisp", category: "calls" },
  { name: "Telegram", category: "chat" },
];

export function Integrations() {
  return (
    <section className="px-6 py-16 border-t border-slate-800/50">
      <div className="mx-auto max-w-4xl text-center">
        <p className="text-sm font-medium text-slate-500 uppercase tracking-widest mb-3">
          Works with your existing tools
        </p>
        <p className="text-sm text-slate-600 mb-8">
          No migration required. Connect in minutes.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {integrations.map((integration) => (
            <span
              key={integration.name}
              className="inline-flex items-center px-4 py-2 rounded-lg border border-slate-800 bg-slate-900/50 text-sm font-medium text-slate-400"
            >
              {integration.name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
