"use client";

import { useState, useEffect } from "react";
import { CATEGORIES, INTEGRATIONS } from "./integrations";
import { IntegrationCard, type IntegrationStatus } from "./IntegrationCard";

export function IntegrationsOverview() {
  const [statuses, setStatuses] = useState<Record<string, IntegrationStatus>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/integrations/status")
      .then((r) => r.json())
      .then((data) => setStatuses(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        {CATEGORIES.map((cat) => {
          const items = INTEGRATIONS.filter((i) => i.category === cat.id);
          if (items.length === 0) return null;
          return (
            <section key={cat.id}>
              <p className="mb-3 px-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                {cat.label}
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {items.map((_, idx) => (
                  <div
                    key={idx}
                    className="animate-pulse rounded-lg border border-[var(--border)] bg-[var(--card)] p-4"
                  >
                    <div className="mb-3 h-10 w-10 rounded-lg bg-[var(--muted)]" />
                    <div className="mb-2 h-4 w-3/4 rounded bg-[var(--muted)]" />
                    <div className="mb-4 h-3 w-full rounded bg-[var(--muted)]" />
                    <div className="h-3 w-16 rounded bg-[var(--muted)]" />
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {CATEGORIES.map((cat) => {
        const items = INTEGRATIONS.filter((i) => i.category === cat.id);
        if (items.length === 0) return null;
        return (
          <section key={cat.id}>
            <p className="mb-3 px-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              {cat.label}
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((integration) => (
                <IntegrationCard
                  key={integration.slug}
                  integration={integration}
                  status={statuses[integration.slug]}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
