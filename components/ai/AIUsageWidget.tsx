"use client";

import { useState, useEffect, useCallback } from "react";

interface KeyData {
  label: string;
  usage: number;
  usage_daily: number;
  usage_weekly: number;
  usage_monthly: number;
  limit: number | null;
  limit_remaining: number | null;
  is_free_tier: boolean;
}

function formatCredits(value: number): string {
  if (value >= 1) return `$${value.toFixed(2)}`;
  if (value >= 0.01) return `$${value.toFixed(3)}`;
  if (value === 0) return "$0.00";
  return `$${value.toFixed(4)}`;
}

export function AIUsageWidget() {
  const [data, setData] = useState<KeyData | null>(null);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const fetchUsage = useCallback(async () => {
    try {
      const res = await fetch("/api/ai-usage");
      if (!res.ok) {
        setError(true);
        return;
      }
      const json = await res.json();
      setData(json.data);
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    fetchUsage();
    // Refresh every 5 minutes
    const interval = setInterval(fetchUsage, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchUsage]);

  if (error || !data) {
    return null;
  }

  const hasLimit = data.limit !== null && data.limit > 0;
  const usagePercent = hasLimit
    ? Math.min(100, (data.usage / data.limit!) * 100)
    : null;

  return (
    <div className="relative">
      <button
        onClick={() => setExpanded((p) => !p)}
        className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
        title="AI Usage"
      >
        <AIChipIcon size={14} />
        <span>
          {hasLimit
            ? `${formatCredits(data.usage)} / ${formatCredits(data.limit!)}`
            : formatCredits(data.usage)}
        </span>
        {hasLimit && usagePercent !== null && (
          <div className="h-1.5 w-12 rounded-full bg-[var(--border)] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                usagePercent > 90
                  ? "bg-[var(--destructive)]"
                  : usagePercent > 70
                    ? "bg-amber-500"
                    : "bg-[var(--primary)]"
              }`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
        )}
      </button>

      {expanded && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setExpanded(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-1 w-64 rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 shadow-lg">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--foreground)]">
                OpenRouter Usage
              </span>
              {data.label && (
                <span className="truncate max-w-[120px] text-[10px] text-[var(--muted-foreground)]">
                  {data.label}
                </span>
              )}
            </div>

            {hasLimit && (
              <div className="mb-3">
                <div className="mb-1 flex justify-between text-[10px] text-[var(--muted-foreground)]">
                  <span>Limit</span>
                  <span>
                    {formatCredits(data.usage)} / {formatCredits(data.limit!)}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-[var(--border)] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      usagePercent! > 90
                        ? "bg-[var(--destructive)]"
                        : usagePercent! > 70
                          ? "bg-amber-500"
                          : "bg-[var(--primary)]"
                    }`}
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
                {data.limit_remaining !== null && (
                  <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">
                    {formatCredits(data.limit_remaining)} remaining
                  </p>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <UsageRow label="Today" value={data.usage_daily} />
              <UsageRow label="This week" value={data.usage_weekly} />
              <UsageRow label="This month" value={data.usage_monthly} />
              <UsageRow label="All time" value={data.usage} />
            </div>

            {data.is_free_tier && (
              <p className="mt-2 text-[10px] text-[var(--muted-foreground)]">
                Free tier — no credits purchased
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function UsageRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-[var(--muted-foreground)]">{label}</span>
      <span className="font-medium text-[var(--foreground)]">
        {formatCredits(value)}
      </span>
    </div>
  );
}

function AIChipIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="5" y="5" width="14" height="14" rx="2" />
      <path d="M9 2v3" />
      <path d="M15 2v3" />
      <path d="M9 19v3" />
      <path d="M15 19v3" />
      <path d="M2 9h3" />
      <path d="M2 15h3" />
      <path d="M19 9h3" />
      <path d="M19 15h3" />
    </svg>
  );
}
