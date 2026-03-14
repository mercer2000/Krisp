# Integrations Page Redesign — Zapier-Style Card Grid

## Problem

The current integrations page is a 5,272-line monolithic component (`IntegrationsClient.tsx`) with a horizontal tab bar for 9 integrations. It's dense, technical, and hard to scan. Users can't see connection status at a glance.

## Design Decisions

- **Marketplace-style card grid** overview (like Zapier's app directory)
- **Dedicated sub-pages** per integration (`/settings/integrations/[slug]`)
- **Badge-based status** — green "Connected" badge on cards, neutral "Connect" for disconnected
- **Light category headers** — Email, Calendar, Chat, Webhooks (no filtering/tabs)
- **Consistent detail page template** — every integration follows the same 4-section layout
- **Full refactor** — break the monolith into individual components

## Overview Page

**Route:** `/settings/integrations`

Card grid grouped by category. Each card contains:
- Integration logo/icon (colored SVG)
- Integration name
- One-line description
- Status: green dot + "Connected" badge with summary (e.g., "user@gmail.com") OR neutral state
- Entire card is a link to `/settings/integrations/[slug]`

**Categories and integrations:**
- **Email** — Gmail, Outlook.com, Graph API, Microsoft 365
- **Calendar** — Google Calendar
- **Chat** — Zoom, Telegram
- **Webhooks** — Zapier, Outbound Webhooks

**Grid:** `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4`

## Detail Page Template

**Route:** `/settings/integrations/[slug]`

Four consistent sections:

1. **Header** — Back link, logo, name, description, connection status badge.

2. **Connection** — Connect/disconnect UI. Varies by auth type:
   - OAuth (Gmail, Outlook, Google Calendar, Zoom): Connect button or account info + Disconnect
   - Multi-account OAuth (Outlook, Google Calendar, Zoom): Account list with per-account disconnect + "Add Account"
   - Credential-based (Graph API): Credential form + subscription manager
   - Token-based (Telegram): Bot token input
   - Webhook-based (MS 365, Zapier): Webhook URL + secret management
   - Outbound Webhooks: Create/manage endpoints

3. **Settings** — Integration-specific config (default board selector, event checkboxes, toggles).

4. **Activity** — Last sync, "Sync Now" button, recent activity log. Sections that don't apply simply don't render.

## File Architecture

```
app/(app)/settings/integrations/
├── page.tsx                          # Card grid overview
├── [slug]/
│   └── page.tsx                      # Detail page (loads correct component)
└── _components/
    ├── IntegrationCard.tsx            # Card for the grid
    ├── IntegrationDetailLayout.tsx    # Consistent detail page shell
    ├── integrations.ts               # Registry (metadata, categories, slugs)
    ├── gmail/
    │   └── GmailIntegration.tsx
    ├── outlook/
    │   └── OutlookIntegration.tsx
    ├── graph/
    │   └── GraphIntegration.tsx
    ├── microsoft365/
    │   └── Microsoft365Integration.tsx
    ├── google-calendar/
    │   └── GoogleCalendarIntegration.tsx
    ├── zoom/
    │   └── ZoomIntegration.tsx
    ├── telegram/
    │   └── TelegramIntegration.tsx
    ├── zapier/
    │   └── ZapierIntegration.tsx
    └── outbound-webhooks/
        └── OutboundWebhooksIntegration.tsx
```

## Status API

**New endpoint:** `GET /api/integrations/status`

Returns connection status for all integrations in one call:

```json
{
  "gmail": { "connected": true, "summary": "user@gmail.com" },
  "outlook": { "connected": true, "summary": "2 accounts" },
  "graph": { "connected": false },
  "microsoft365": { "connected": false },
  "google-calendar": { "connected": true, "summary": "1 account" },
  "zoom": { "connected": false },
  "telegram": { "connected": false },
  "zapier": { "connected": true, "summary": "Secret active" },
  "outbound-webhooks": { "connected": true, "summary": "3 webhooks" }
}
```

Avoids 9 separate API calls on the overview page.

## OAuth Redirect Updates

Update OAuth callback redirects from `?gmail_connected=true#gmail` to `/settings/integrations/gmail?connected=true`.

## Deletions

- `app/(app)/admin/integrations/IntegrationsClient.tsx` — replaced by individual components
