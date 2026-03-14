# Integrations Page Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the monolithic 5,272-line IntegrationsClient with a Zapier-style card grid overview + dedicated detail pages per integration.

**Architecture:** Card grid at `/settings/integrations` shows all 9 integrations grouped by category (Email, Calendar, Chat, Webhooks). Clicking a card navigates to `/settings/integrations/[slug]` with a consistent 4-section detail page (Header, Connection, Settings, Activity). A single `GET /api/integrations/status` endpoint provides connection status for all integrations.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, CSS variables theming, Drizzle ORM

---

### Task 1: Create the integration registry

**Files:**
- Create: `app/(app)/settings/integrations/_components/integrations.ts`

**Step 1: Create the registry file**

This file defines all integration metadata, categories, and slugs. It's the single source of truth for the card grid and detail pages.

```tsx
// app/(app)/settings/integrations/_components/integrations.ts

export type IntegrationSlug =
  | "gmail"
  | "outlook"
  | "graph"
  | "microsoft365"
  | "google-calendar"
  | "zoom"
  | "telegram"
  | "zapier"
  | "outbound-webhooks";

export type IntegrationCategory = "email" | "calendar" | "chat" | "webhooks";

export interface IntegrationDef {
  slug: IntegrationSlug;
  name: string;
  description: string;
  category: IntegrationCategory;
  color: string;
  // icon is rendered by IntegrationCard using the slug — keeps this file serializable
}

export const CATEGORIES: { id: IntegrationCategory; label: string }[] = [
  { id: "email", label: "Email" },
  { id: "calendar", label: "Calendar" },
  { id: "chat", label: "Chat" },
  { id: "webhooks", label: "Webhooks" },
];

export const INTEGRATIONS: IntegrationDef[] = [
  {
    slug: "gmail",
    name: "Gmail",
    description: "Push notifications for new emails",
    category: "email",
    color: "#EA4335",
  },
  {
    slug: "outlook",
    name: "Outlook.com",
    description: "Email and calendar sync via OAuth",
    category: "email",
    color: "#0078D4",
  },
  {
    slug: "graph",
    name: "Graph API",
    description: "Azure AD credentials for Exchange/Outlook",
    category: "email",
    color: "#0078D4",
  },
  {
    slug: "microsoft365",
    name: "Microsoft 365",
    description: "Power Automate webhook setup",
    category: "email",
    color: "#0078D4",
  },
  {
    slug: "google-calendar",
    name: "Google Calendar",
    description: "Read-only calendar event sync",
    category: "calendar",
    color: "#4285F4",
  },
  {
    slug: "zoom",
    name: "Zoom Chat",
    description: "Team Chat message sync",
    category: "chat",
    color: "#2D8CFF",
  },
  {
    slug: "telegram",
    name: "Telegram",
    description: "Chat bot for Brain AI",
    category: "chat",
    color: "#0088CC",
  },
  {
    slug: "zapier",
    name: "Zapier",
    description: "Generic webhook ingest with signing",
    category: "webhooks",
    color: "#FF4A00",
  },
  {
    slug: "outbound-webhooks",
    name: "Outbound Webhooks",
    description: "Push events to external services",
    category: "webhooks",
    color: "#10B981",
  },
];

export function getIntegration(slug: string): IntegrationDef | undefined {
  return INTEGRATIONS.find((i) => i.slug === slug);
}
```

**Step 2: Commit**

```bash
git add app/(app)/settings/integrations/_components/integrations.ts
git commit -m "feat(integrations): add integration registry"
```

---

### Task 2: Create the IntegrationCard component

**Files:**
- Create: `app/(app)/settings/integrations/_components/IntegrationCard.tsx`

**Step 1: Create the card component**

The card uses the same icon SVGs from the existing TABS array in `IntegrationsClient.tsx` (lines 55-165). Copy each SVG into an `ICONS` map keyed by slug.

```tsx
// app/(app)/settings/integrations/_components/IntegrationCard.tsx
"use client";

import Link from "next/link";
import type { IntegrationDef } from "./integrations";

// Connection status passed from overview page
export interface IntegrationStatus {
  connected: boolean;
  summary?: string; // e.g. "user@gmail.com", "2 accounts"
}

// Copy the SVG icons from IntegrationsClient.tsx TABS array (lines 55-165).
// Key each by IntegrationSlug. Use size={24} instead of 16 for the card.
// Example for gmail:
//   gmail: <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
//            <path d="M20 18h-2V9.25L12 13 ..." />
//          </svg>
// Do this for all 9 integrations, keeping the exact same SVG paths.

export function IntegrationCard({
  integration,
  status,
}: {
  integration: IntegrationDef;
  status?: IntegrationStatus;
}) {
  return (
    <Link
      href={`/settings/integrations/${integration.slug}`}
      className="group flex flex-col gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm transition-all hover:shadow-md hover:border-[var(--primary)]/30"
    >
      {/* Icon + Status row */}
      <div className="flex items-start justify-between">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${integration.color}15`, color: integration.color }}
        >
          {/* Render icon by slug from ICONS map */}
        </div>
        {status?.connected && (
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            Connected
          </span>
        )}
      </div>

      {/* Name + Description */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--card-foreground)]">
          {integration.name}
        </h3>
        <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
          {integration.description}
        </p>
      </div>

      {/* Connected summary or Connect prompt */}
      <div className="mt-auto text-xs text-[var(--muted-foreground)]">
        {status?.connected ? (
          <span>{status.summary}</span>
        ) : (
          <span className="text-[var(--primary)] group-hover:underline">
            Connect →
          </span>
        )}
      </div>
    </Link>
  );
}
```

**Step 2: Commit**

```bash
git add app/(app)/settings/integrations/_components/IntegrationCard.tsx
git commit -m "feat(integrations): add IntegrationCard component"
```

---

### Task 3: Create the status API endpoint

**Files:**
- Create: `app/api/integrations/status/route.ts`
- Reference: `lib/db/schema.ts` for table names, `lib/db/authDb.ts` for `getAuthDb()`

**Step 1: Create the endpoint**

This queries all integration tables in parallel and returns a status map. Use `getAuthDb()` for RLS-scoped queries.

```ts
// app/api/integrations/status/route.ts
import { NextResponse } from "next/server";
import { getAuthDb } from "@/lib/db/authDb";
import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import {
  gmailWatchSubscriptions,
  outlookOauthTokens,
  graphCredentials,
  googleCalendarAccounts,
  zoomOauthTokens,
  telegramBotTokens,
  outboundWebhooks,
} from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";

export async function GET() {
  const user = await getRequiredUser();
  const db = await getAuthDb();
  const tenantId = user.id;

  // Query all integration tables in parallel
  const [gmail, outlook, graph, googleCal, zoom, telegram, zapierSecret, outbound] =
    await Promise.all([
      db.select().from(gmailWatchSubscriptions).where(eq(gmailWatchSubscriptions.tenantId, tenantId)).limit(1),
      db.select().from(outlookOauthTokens).where(eq(outlookOauthTokens.tenantId, tenantId)),
      db.select().from(graphCredentials).where(eq(graphCredentials.tenantId, tenantId)),
      db.select().from(googleCalendarAccounts).where(eq(googleCalendarAccounts.tenantId, tenantId)),
      db.select().from(zoomOauthTokens).where(eq(zoomOauthTokens.tenantId, tenantId)),
      db.select().from(telegramBotTokens).where(eq(telegramBotTokens.tenantId, tenantId)).limit(1),
      // Zapier: check if webhook secret exists — look at how ZapierSection checks this
      // May need to query a different table or use fetch to /api/integrations/zapier/secret
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || ""}/api/integrations/zapier/secret`, {
        headers: { cookie: "" }, // Will need auth forwarding
      }).then(() => ({ connected: false })).catch(() => ({ connected: false })),
      db.select().from(outboundWebhooks).where(eq(outboundWebhooks.tenantId, tenantId)),
    ]);

  // NOTE: The exact table names and column names need to be verified against lib/db/schema.ts.
  // The Zapier secret check may need a different approach — check how ZapierSection currently
  // fetches its state and replicate that logic here.

  const status: Record<string, { connected: boolean; summary?: string }> = {
    gmail: {
      connected: gmail.length > 0 && gmail[0].active,
      summary: gmail[0]?.emailAddress,
    },
    outlook: {
      connected: outlook.length > 0,
      summary: outlook.length > 0 ? `${outlook.length} account${outlook.length > 1 ? "s" : ""}` : undefined,
    },
    graph: {
      connected: graph.length > 0,
      summary: graph.length > 0 ? `${graph.length} credential${graph.length > 1 ? "s" : ""}` : undefined,
    },
    microsoft365: { connected: false }, // Webhook-based, no persistent connection state
    "google-calendar": {
      connected: googleCal.length > 0,
      summary: googleCal.length > 0 ? `${googleCal.length} account${googleCal.length > 1 ? "s" : ""}` : undefined,
    },
    zoom: {
      connected: zoom.length > 0,
      summary: zoom.length > 0 ? `${zoom.length} account${zoom.length > 1 ? "s" : ""}` : undefined,
    },
    telegram: {
      connected: telegram.length > 0,
      summary: telegram[0] ? "Bot connected" : undefined,
    },
    zapier: { connected: false }, // Will be refined after checking schema
    "outbound-webhooks": {
      connected: outbound.length > 0,
      summary: outbound.length > 0 ? `${outbound.length} webhook${outbound.length > 1 ? "s" : ""}` : undefined,
    },
  };

  return NextResponse.json(status);
}
```

**Important:** Before implementing, check `lib/db/schema.ts` for exact table names — the names above (e.g., `googleCalendarAccounts`, `zoomOauthTokens`, `telegramBotTokens`) need verification. Also check how Microsoft 365 and Zapier track connection state.

**Step 2: Commit**

```bash
git add app/api/integrations/status/route.ts
git commit -m "feat(integrations): add status API endpoint"
```

---

### Task 4: Create the overview page (card grid)

**Files:**
- Modify: `app/(app)/settings/integrations/page.tsx`

**Step 1: Replace the current page**

The current page is a simple wrapper that loads `IntegrationsClient`. Replace with the card grid.

```tsx
// app/(app)/settings/integrations/page.tsx
import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { IntegrationsOverview } from "./_components/IntegrationsOverview";

export default async function SettingsIntegrationsPage() {
  const user = await getRequiredUser();
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="mb-1 text-2xl font-bold text-[var(--foreground)]">
        Integrations
      </h1>
      <p className="mb-8 text-sm text-[var(--muted-foreground)]">
        Connect external services to ingest data automatically
      </p>
      <IntegrationsOverview tenantId={user.id} />
    </div>
  );
}
```

**Step 2: Create IntegrationsOverview client component**

**Files:**
- Create: `app/(app)/settings/integrations/_components/IntegrationsOverview.tsx`

```tsx
// app/(app)/settings/integrations/_components/IntegrationsOverview.tsx
"use client";

import { useState, useEffect } from "react";
import { CATEGORIES, INTEGRATIONS } from "./integrations";
import { IntegrationCard, type IntegrationStatus } from "./IntegrationCard";

export function IntegrationsOverview({ tenantId }: { tenantId: string }) {
  const [statuses, setStatuses] = useState<Record<string, IntegrationStatus>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/integrations/status")
      .then((r) => r.json())
      .then((data) => setStatuses(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--muted)] border-t-[var(--primary)]" />
        </div>
      )}
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add app/(app)/settings/integrations/page.tsx app/(app)/settings/integrations/_components/IntegrationsOverview.tsx
git commit -m "feat(integrations): add card grid overview page"
```

---

### Task 5: Create IntegrationDetailLayout

**Files:**
- Create: `app/(app)/settings/integrations/_components/IntegrationDetailLayout.tsx`

**Step 1: Create the detail layout shell**

This is the consistent template used by all detail pages. It renders the header with back link, logo, status badge, and provides slots for Connection, Settings, and Activity sections.

```tsx
// app/(app)/settings/integrations/_components/IntegrationDetailLayout.tsx
"use client";

import Link from "next/link";
import type { IntegrationDef } from "./integrations";

// Reuse the ICONS map from IntegrationCard (or extract to shared icons file)

interface Section {
  title: string;
  content: React.ReactNode;
}

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
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Back link */}
      <Link
        href="/settings/integrations"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
      >
        {/* left arrow SVG */}
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
          {/* Icon by slug */}
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-[var(--card-foreground)]">
            {integration.name}
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            {integration.description}
          </p>
        </div>
        {connected ? (
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
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
```

**Step 2: Commit**

```bash
git add app/(app)/settings/integrations/_components/IntegrationDetailLayout.tsx
git commit -m "feat(integrations): add detail page layout template"
```

---

### Task 6: Create shared helper components

**Files:**
- Create: `app/(app)/settings/integrations/_components/shared.tsx`

**Step 1: Extract CopyButton, CodeBlock, and shared constants**

Copy from `IntegrationsClient.tsx` lines 5-52 (CopyButton, CodeBlock, FIELD_MAPPING, CRISP_EVENTS).

```tsx
// app/(app)/settings/integrations/_components/shared.tsx
"use client";

import { useState } from "react";

// Exact copy from IntegrationsClient.tsx lines 5-22
export function CopyButton({ text }: { text: string }) {
  // ... exact code from lines 5-22
}

// Exact copy from IntegrationsClient.tsx lines 24-35
export function CodeBlock({ children }: { children: string }) {
  // ... exact code from lines 24-35
}

// Exact copy from IntegrationsClient.tsx lines 37-47
export const FIELD_MAPPING = [ /* ... */ ];

// Exact copy from IntegrationsClient.tsx lines 49-52
export const CRISP_EVENTS = [ /* ... */ ];
```

**Step 2: Commit**

```bash
git add app/(app)/settings/integrations/_components/shared.tsx
git commit -m "feat(integrations): extract shared helper components"
```

---

### Task 7: Extract GmailIntegration component

**Files:**
- Create: `app/(app)/settings/integrations/_components/gmail/GmailIntegration.tsx`
- Reference: `IntegrationsClient.tsx` lines 888-1124 (GmailWatchManager) and lines 2924-2957 (Gmail tab inline content), and lines 1366-1456 (DefaultBoardSelector)

**Step 1: Create the component**

Extract GmailWatchManager (lines 888-1124) and the Gmail tab content (lines 2924-2957). The component should use `IntegrationDetailLayout` and provide content for Connection, Settings (DefaultBoardSelector), and Activity sections.

Also extract DefaultBoardSelector (lines 1366-1456) to `_components/shared.tsx` or its own file since it's used by multiple integrations.

```tsx
// app/(app)/settings/integrations/_components/gmail/GmailIntegration.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { IntegrationDetailLayout } from "../IntegrationDetailLayout";
import { getIntegration } from "../integrations";
// Import DefaultBoardSelector from shared location

export function GmailIntegration({ tenantId }: { tenantId: string }) {
  const integration = getIntegration("gmail")!;

  // Extract state and logic from GmailWatchManager (lines 888-1124)
  // Connection status, watch renewal, connect/disconnect

  // Determine connected state from fetched data

  return (
    <IntegrationDetailLayout
      integration={integration}
      connected={/* derived from watch status */}
      connectionSummary={/* email address */}
      connectionSection={/* Connect button or connected info + Disconnect */}
      settingsSection={/* DefaultBoardSelector */}
      activitySection={/* Watch status, last sync, Sync Now button */}
    />
  );
}
```

**Step 2: Commit**

```bash
git add app/(app)/settings/integrations/_components/gmail/GmailIntegration.tsx
git commit -m "feat(integrations): extract Gmail integration component"
```

---

### Task 8: Extract remaining integration components

Repeat Task 7's pattern for each integration. Extract from `IntegrationsClient.tsx`:

**Files to create (one at a time, commit each):**

**8a: Outlook** — `_components/outlook/OutlookIntegration.tsx`
- Source: lines 3401-3522 (Outlook tab) + relevant state from IntegrationsClient
- Multi-account OAuth with per-account sync and disconnect

**8b: Graph API** — `_components/graph/GraphIntegration.tsx`
- Source: lines 2446-2923 (Graph tab) + GraphCredentialsManager (336-604) + GraphSubscriptionManager (606-887)
- Credential form + subscription management

**8c: Microsoft 365** — `_components/microsoft365/Microsoft365Integration.tsx`
- Source: lines 2137-2445 (MS365 tab) + WebhookSecretManager (169-314)
- Webhook URL + setup guide with code blocks

**8d: Google Calendar** — `_components/google-calendar/GoogleCalendarIntegration.tsx`
- Source: lines 2958-3062 (GoogleCalendar tab) + GoogleCalendarIntegrationManager (1468-1714)
- Multi-account OAuth + calendar sync

**8e: Zoom** — `_components/zoom/ZoomIntegration.tsx`
- Source: lines 3063-3400 (Zoom tab) + ZoomIntegrationManager (1125-1365)
- Multi-account OAuth + chat sync

**8f: Telegram** — `_components/telegram/TelegramIntegration.tsx`
- Source: lines 3869-4203 (TelegramSection — already a standalone component)
- Bot token input + webhook status

**8g: Zapier** — `_components/zapier/ZapierIntegration.tsx`
- Source: lines 4639-5272 (ZapierSection — already standalone)
- Secret management + webhook URL + ingest logs

**8h: Outbound Webhooks** — `_components/outbound-webhooks/OutboundWebhooksIntegration.tsx`
- Source: lines 4204-4638 (OutboundWebhooksSection — already standalone)
- Create/edit/delete/toggle webhooks

**8i: Krisp Meetings** — `_components/krisp/KrispIntegration.tsx`
- Source: lines 3523-3854 (Crisp tab)
- Webhook URL + event selection + setup guide

**For each sub-task:**
1. Create the component file, extracting the relevant code
2. Wrap content in `IntegrationDetailLayout` with appropriate sections
3. Move any inline state/effects from IntegrationsClient into the new component
4. Commit

```bash
# Example commit for each:
git commit -m "feat(integrations): extract Outlook integration component"
```

---

### Task 9: Create the detail page route

**Files:**
- Create: `app/(app)/settings/integrations/[slug]/page.tsx`

**Step 1: Create the dynamic route page**

```tsx
// app/(app)/settings/integrations/[slug]/page.tsx
import { notFound } from "next/navigation";
import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { getIntegration } from "../_components/integrations";
import { GmailIntegration } from "../_components/gmail/GmailIntegration";
import { OutlookIntegration } from "../_components/outlook/OutlookIntegration";
import { GraphIntegration } from "../_components/graph/GraphIntegration";
import { Microsoft365Integration } from "../_components/microsoft365/Microsoft365Integration";
import { GoogleCalendarIntegration } from "../_components/google-calendar/GoogleCalendarIntegration";
import { ZoomIntegration } from "../_components/zoom/ZoomIntegration";
import { TelegramIntegration } from "../_components/telegram/TelegramIntegration";
import { ZapierIntegration } from "../_components/zapier/ZapierIntegration";
import { OutboundWebhooksIntegration } from "../_components/outbound-webhooks/OutboundWebhooksIntegration";
import { KrispIntegration } from "../_components/krisp/KrispIntegration";

const COMPONENTS: Record<string, React.ComponentType<{ tenantId: string }>> = {
  gmail: GmailIntegration,
  outlook: OutlookIntegration,
  graph: GraphIntegration,
  microsoft365: Microsoft365Integration,
  "google-calendar": GoogleCalendarIntegration,
  zoom: ZoomIntegration,
  telegram: TelegramIntegration,
  zapier: ZapierIntegration,
  "outbound-webhooks": OutboundWebhooksIntegration,
  krisp: KrispIntegration,
};

export default async function IntegrationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const integration = getIntegration(slug);
  if (!integration) notFound();

  const user = await getRequiredUser();
  const Component = COMPONENTS[slug];
  if (!Component) notFound();

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Component tenantId={user.id} />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add app/(app)/settings/integrations/[slug]/page.tsx
git commit -m "feat(integrations): add dynamic detail page route"
```

---

### Task 10: Update OAuth callback redirects

**Files to modify:**
- `app/api/gmail/oauth/callback/route.ts` — change redirect from `?gmail_connected=true` to `/settings/integrations/gmail?connected=true`
- `app/api/outlook/oauth/callback/route.ts` — similar change for Outlook
- `app/api/google/oauth/callback/route.ts` — similar for Google Calendar
- `app/api/zoom/oauth/callback/route.ts` — similar for Zoom

**Step 1: Find and update each callback**

Search for redirect URLs that point to `/admin/integrations` or `/settings/integrations` with query params like `?gmail_connected=true`. Update to the new pattern:

```
Old: /admin/integrations?gmail_connected=true
New: /settings/integrations/gmail?connected=true

Old: /settings/integrations?outlook_connected=true
New: /settings/integrations/outlook?connected=true
```

Each integration component should check for `?connected=true` or `?error=...` in URL params on mount and show a success/error toast.

**Step 2: Commit**

```bash
git add app/api/gmail/oauth/callback/ app/api/outlook/oauth/callback/ app/api/google/oauth/callback/ app/api/zoom/oauth/callback/
git commit -m "fix(integrations): update OAuth redirects for new detail pages"
```

---

### Task 11: Update admin integrations route

**Files to modify:**
- `app/(app)/admin/integrations/` — either redirect to `/settings/integrations` or update to use new components
- `components/ui/SideNav.tsx` — update admin nav link if needed

**Step 1: Check if admin route should redirect**

The admin route at `/admin/integrations` currently uses the same `IntegrationsClient`. Options:
- Redirect `/admin/integrations` to `/settings/integrations`
- Or keep both routes pointing to the same new components

Check what role-based differences exist. If admin and settings show the same UI, just redirect.

**Step 2: Commit**

```bash
git commit -m "fix(integrations): redirect admin integrations to settings"
```

---

### Task 12: Clean up old monolith

**Files:**
- Delete: `app/(app)/admin/integrations/IntegrationsClient.tsx` (after confirming no other imports)

**Step 1: Search for remaining imports**

```bash
grep -r "IntegrationsClient" --include="*.tsx" --include="*.ts" app/
```

Remove or update any remaining references.

**Step 2: Delete the monolith**

```bash
rm app/(app)/admin/integrations/IntegrationsClient.tsx
```

**Step 3: Commit**

```bash
git add -A
git commit -m "refactor(integrations): remove monolithic IntegrationsClient"
```

---

### Task 13: Visual QA and smoke test

**Step 1: Start dev server**

```bash
npm run dev
```

**Step 2: Test overview page**

- Navigate to `/settings/integrations`
- Verify all 9 cards render in correct categories
- Verify connected integrations show green badge
- Verify clicking a card navigates to detail page

**Step 3: Test each detail page**

For each of the 10 slugs (`gmail`, `outlook`, `graph`, `microsoft365`, `google-calendar`, `zoom`, `telegram`, `zapier`, `outbound-webhooks`, `krisp`):
- Navigate to `/settings/integrations/[slug]`
- Verify header renders with correct name, icon, and status
- Verify Connection section renders correctly
- Verify Settings section renders (if applicable)
- Verify Activity section renders (if applicable)
- Verify back link returns to overview

**Step 4: Test OAuth flows**

- Test Gmail connect → verify redirect to `/settings/integrations/gmail?connected=true`
- Test Outlook connect → verify redirect
- Verify disconnect flows work

**Step 5: Test invalid slug**

- Navigate to `/settings/integrations/nonexistent`
- Verify 404 page renders

**Step 6: Commit any fixes**

```bash
git commit -m "fix(integrations): visual QA fixes"
```
