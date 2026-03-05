interface FeatureDeepDiveProps {
  headline: string;
  body: string;
  bullets: string[];
  screenshotLabel: string;
  reverse?: boolean;
}

export function FeatureDeepDive({
  headline,
  body,
  bullets,
  screenshotLabel,
  reverse = false,
}: FeatureDeepDiveProps) {
  return (
    <div
      className={`flex flex-col ${
        reverse ? "lg:flex-row-reverse" : "lg:flex-row"
      } gap-12 lg:gap-16 items-center`}
    >
      {/* Text */}
      <div className="flex-1">
        <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">
          {headline}
        </h3>
        <p className="text-slate-400 leading-relaxed mb-6">{body}</p>
        <ul className="space-y-3">
          {bullets.map((bullet) => (
            <li key={bullet} className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m4.5 12.75 6 6 9-13.5"
                />
              </svg>
              <span className="text-slate-300">{bullet}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Screenshot placeholder */}
      <div className="flex-1 w-full">
        <div className="rounded-xl border-2 border-dashed border-slate-700 bg-slate-900/30 aspect-[4/3] flex items-center justify-center">
          <span className="text-slate-600 font-medium">
            Screenshot: {screenshotLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
