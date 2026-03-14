const stats = [
  {
    value: "3+",
    unit: "hours",
    label: "saved per week on email and meeting overhead",
  },
  {
    value: "100%",
    unit: "",
    label: "of your calls recorded and transcribed automatically",
  },
  {
    value: "0",
    unit: "effort",
    label: "required \u2014 install once, it runs in the background",
  },
];

export function ValueStats() {
  return (
    <section className="px-6 py-16 sm:py-20 border-y border-slate-800/50">
      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="relative rounded-xl border border-blue-500/15 bg-blue-500/[0.03] p-8 text-center"
            >
              <div className="text-4xl sm:text-5xl font-bold text-blue-400 tracking-tight">
                {stat.value}
                {stat.unit && (
                  <span className="text-2xl sm:text-3xl text-blue-400/70 ml-1">
                    {stat.unit}
                  </span>
                )}
              </div>
              <p className="mt-3 text-slate-400 leading-relaxed text-sm">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
