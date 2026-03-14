"use client";

import Link from "next/link";
import type { IntegrationDef } from "./integrations";
import { ICONS } from "./IntegrationCard";

export function IntegrationDetailLayout({
  integration,
  connected,
  connectionSummary,
  connectionSection,
  settingsSection,
  activitySection,
}: {
  integration: IntegrationDef;
  connected: boolean;
  connectionSummary?: string;
  connectionSection: React.ReactNode;
  settingsSection?: React.ReactNode;
  activitySection?: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/settings/integrations"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
        </svg>
        Back to Integrations
      </Link>

      {/* Header card */}
      <div className="flex items-center gap-4 rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${integration.color}15`, color: integration.color }}
        >
          {ICONS[integration.slug]}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-[var(--card-foreground)]">
            {integration.name}
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            {integration.description}
          </p>
        </div>
        {connected ? (
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Connected
          </span>
        ) : (
          <span className="rounded-full bg-[var(--secondary)] px-3 py-1.5 text-xs font-medium text-[var(--muted-foreground)]">
            Not connected
          </span>
        )}
      </div>

      {/* Connection section */}
      <DetailSection title="Connection">
        {connectionSection}
      </DetailSection>

      {/* Settings section (optional) */}
      {settingsSection && (
        <DetailSection title="Settings">
          {settingsSection}
        </DetailSection>
      )}

      {/* Activity section (optional) */}
      {activitySection && (
        <DetailSection title="Activity">
          {activitySection}
        </DetailSection>
      )}
    </div>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
        {title}
      </h2>
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
        {children}
      </div>
    </section>
  );
}
