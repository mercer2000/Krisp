import Link from "next/link";
import type { ReactNode } from "react";
import type { IntegrationDef, IntegrationSlug } from "./integrations";

export interface IntegrationStatus {
  connected: boolean;
  summary?: string;
}

export const ICONS: Record<IntegrationSlug, ReactNode> = {
  microsoft365: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.5 3v8.5H3V3h8.5zm0 18H3v-8.5h8.5V21zm1-18H21v8.5h-8.5V3zm0 18v-8.5H21V21h-8.5z" />
    </svg>
  ),
  graph: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M21.17 3.25q.33 0 .59.25.24.25.24.58 0 .34-.24.59l-7.83 7.83L15 15.58l-1.41-1.41 1.07-1.08-7.83-7.83a.81.81 0 0 1-.25-.59q0-.33.25-.58.26-.25.59-.25.33 0 .58.25l7 7 7-7q.25-.25.58-.25zM3.83 19q0-.41.29-.71.3-.29.71-.29h14.34q.41 0 .71.29.29.3.29.71 0 .41-.29.71-.3.29-.71.29H4.83q-.41 0-.71-.29Q3.83 19.41 3.83 19z" />
    </svg>
  ),
  gmail: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 18h-2V9.25L12 13 6 9.25V18H4V6h1.2l6.8 4.25L18.8 6H20m0-2H4c-1.11 0-2 .89-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2z" />
    </svg>
  ),
  "google-calendar": (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.5 3h-3V1.5h-1.5V3h-6V1.5H7.5V3h-3C3.67 3 3 3.67 3 4.5v15c0 .83.67 1.5 1.5 1.5h15c.83 0 1.5-.67 1.5-1.5v-15c0-.83-.67-1.5-1.5-1.5zm0 16.5h-15V8h15v11.5zM7.5 10h3v3h-3v-3zm4.5 0h3v3h-3v-3zm4.5 0h3v3h-3v-3z" />
    </svg>
  ),
  zoom: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M4 3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h8l4 4v-4h4a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H4z" />
    </svg>
  ),
  outlook: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
    </svg>
  ),
  krisp: (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 18.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13Z" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  ),
  telegram: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  ),
  "outbound-webhooks": (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 2 11 13" />
      <path d="m22 2-7 20-4-9-9-4 20-7z" />
    </svg>
  ),
  zapier: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M15.637 8.363l-3.26 3.26a2.862 2.862 0 01-.06 1.158 2.862 2.862 0 01-1.158.06l-3.26 3.26a.5.5 0 00.707.707l3.26-3.26a2.862 2.862 0 01.06-1.158 2.862 2.862 0 011.158-.06l3.26-3.26a.5.5 0 00-.707-.707zM12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8z" />
    </svg>
  ),
};

export function IntegrationCard({
  integration,
  status,
}: {
  integration: IntegrationDef;
  status?: IntegrationStatus;
}) {
  const connected = status?.connected ?? false;

  return (
    <Link
      href={`/settings/integrations/${integration.slug}`}
      className="block rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm transition-colors hover:border-[var(--primary)] hover:shadow-md"
    >
      {/* Top row: icon + connected badge */}
      <div className="flex items-start justify-between">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{
            backgroundColor: `${integration.color}15`,
            color: integration.color,
          }}
        >
          {ICONS[integration.slug]}
        </div>

        {connected && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Connected
          </span>
        )}
      </div>

      {/* Name + description */}
      <div className="mt-3">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">
          {integration.name}
        </h3>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          {integration.description}
        </p>
      </div>

      {/* Bottom row: summary or connect prompt */}
      <div className="mt-3 text-xs">
        {connected && status?.summary ? (
          <span className="text-[var(--muted-foreground)]">
            {status.summary}
          </span>
        ) : !connected ? (
          <span className="font-medium text-[var(--primary)] group-hover:underline">
            Connect &rarr;
          </span>
        ) : null}
      </div>
    </Link>
  );
}
