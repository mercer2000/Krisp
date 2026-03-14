# Outlook Push Subscriptions Design

**Date:** 2026-03-14
**Status:** Draft
**Scope:** Automatic real-time email delivery for personal Outlook accounts via Microsoft Graph push subscriptions

## Problem

Outlook email integration is currently pull-only. Users must manually click "Sync" to fetch new messages. This doesn't scale — at 1,000 users, polling every 5 minutes would require 1,000+ API calls per cycle, exceeding Vercel function timeouts and approaching Microsoft Graph rate limits.

## Solution

Extend the existing `graphSubscriptions` infrastructure to support personal Outlook OAuth (delegated) tokens. Auto-create a Microsoft Graph push subscription when a user connects their Outlook account. Microsoft pushes notifications to the existing webhook endpoint when new emails arrive. Add renewal and catch-up crons for reliability.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Link subscription to Outlook account | `outlookOauthTokenId` FK column | Explicit, reliable at scale vs. parsing resource strings |
| Subscription creation timing | In OAuth callback (synchronous) | 2-3s delay imperceptible during redirect; integration fully active on settings page |
| Renewal frequency | Every hour | Trivial query cost; tight window minimizes chance of expiry gaps |
| Renewal failure handling | Deactivate immediately + banner | Simple; no retry complexity. User sees clear reconnection prompt |
| Catch-up safety net | Hourly cron for stale accounts | Handles dropped notifications; only processes accounts with no recent webhook activity |

## Design

### 1. Schema Change

Add one nullable column to the existing `graphSubscriptions` table:

```sql
ALTER TABLE graph_subscriptions
  ADD COLUMN outlook_oauth_token_id UUID
    REFERENCES outlook_oauth_tokens(id) ON DELETE SET NULL;

CREATE INDEX idx_graph_subscriptions_outlook_token
  ON graph_subscriptions(outlook_oauth_token_id);
```

A subscription row has **either** `credential_id` (app-only Graph credentials) **or** `outlook_oauth_token_id` (personal delegated OAuth) — never both. The webhook handler uses whichever is present to determine how to fetch the full email.

### 2. Subscription Creation in OAuth Callback

After the OAuth callback stores tokens (`app/api/outlook/oauth/callback/route.ts`, line 80-86), it will:

1. Get the user's access token from the just-stored token response
2. Generate a `clientState` (random UUID for webhook verification)
3. Build the resource path: `users/${outlookEmail}/mailFolders/inbox/messages`
4. Build the notification URL: `${origin}/api/webhooks/email/graph/${userId}`
5. POST to `https://graph.microsoft.com/v1.0/subscriptions` with:
   - `changeType: "created"`
   - `resource`: the path above
   - `expirationDateTime`: now + 4230 minutes (~3 days)
   - `notificationUrl`: the webhook URL
   - `clientState`: the generated UUID
6. Store the subscription in `graphSubscriptions` with `outlookOauthTokenId` set and `credentialId` null
7. If subscription creation fails, log the error but still redirect to settings with `?connected=true` — the account is connected, push just isn't active yet. The catch-up cron will handle email sync in the meantime.

This reuses the existing `/api/webhooks/email/graph/[tenantId]` GET handler for Microsoft's validation handshake — no new endpoint needed.

### 3. Webhook Handler Modification

The existing POST handler at `app/api/webhooks/email/graph/[tenantId]/route.ts` fetches full email content in its `after()` block using app-only credentials. The change adds one branch:

**When building `pendingFetches` (line 220-226):**
- Currently: only queues fetch if `subscription.credentialId` is present
- New: also queues fetch if `subscription.outlookOauthTokenId` is present, passing the token ID instead

**In the `after()` async block:**
- If `credentialId` is present: existing path — use `getGraphCredentialsByIdUnsafe()` + `getGraphAccessTokenFromCreds()` (app-only token)
- If `outlookOauthTokenId` is present: new path — use `getValidOutlookAccessToken(outlookOauthTokenId, tenantId)` (delegated token), then call `fetchGraphMessage()` with `me` as the user (since delegated tokens use `/me/` not `/users/{email}/`)

Everything downstream stays the same — `updateEmailByMessageId`, `dispatchWebhooks`, `autoProcessEmailActions`, `classifyItem`, `classifyItemForPages` all work identically regardless of how the email was fetched.

The stub insertion (lines 190-213) is unchanged — it doesn't depend on credential type.

### 4. Subscription Renewal Cron

New route at `app/api/cron/graph-subscription-renewal/route.ts`:

1. **Auth**: validate `CRON_SECRET` header (same pattern as existing crons)
2. **Query**: `getExpiringSubscriptions(now + 2 hours)` — finds all active subscriptions expiring within the next 2 hours
3. **For each subscription**:
   - Determine token source: `credentialId` → app-only token, `outlookOauthTokenId` → delegated token
   - Call `PATCH https://graph.microsoft.com/v1.0/subscriptions/${subscriptionId}` with new `expirationDateTime` (now + 4230 minutes)
   - On success: call `renewSubscription(subscriptionId, newExpiration)` to update the DB
   - On failure (token revoked, 404, etc.): deactivate the subscription via `deactivateSubscription()`, and if it was an Outlook OAuth subscription, deactivate the `outlook_oauth_tokens` row (set `active = false`)
4. **Return**: summary of renewed/failed counts

**Schedule**: every hour via Vercel Cron.

### 5. Catch-up Safety Net Cron

New route at `app/api/cron/outlook-catch-up/route.ts`:

1. **Auth**: validate `CRON_SECRET` header
2. **Query**: find all active `outlook_oauth_tokens` rows where `last_sync_at` is either null or older than 1 hour ago
3. **For each stale account**:
   - Get a valid access token via `getValidOutlookAccessToken()`
   - Call `fetchOutlookInboxMessages()` with `after: last_sync_at` to pull only messages since last sync
   - Insert new emails, skip duplicates (same dedup logic as existing sync route)
   - Update `last_sync_at`
   - Run classification and action processing in background via `after()`
4. **Return**: summary of accounts checked and emails inserted

**Schedule**: every hour via Vercel Cron.

This is the existing `POST /api/outlook/sync` logic extracted into a cron-friendly form that iterates over all users' stale accounts. It only does work for accounts that haven't received a webhook notification recently, so at scale with healthy push subscriptions, this cron processes very few accounts.

### 6. Reconnection Banner

When a subscription renewal fails and the Outlook account is deactivated:

1. **API**: `GET /api/integrations/status` (already exists) — return a flag when any Outlook account has `active = false` with a previously-set `refresh_token`
2. **Banner**: persistent warning bar in `AppShell.tsx`, styled like `TrialBanner.tsx`. Text: "Your Outlook connection needs to be reconnected. [Reconnect →]" linking to `/settings/integrations`
3. **No dismiss**: banner stays visible until the user reconnects, since emails aren't flowing without it

## Files Changed

| File | Change |
|------|--------|
| `lib/db/schema.ts` | Add `outlookOauthTokenId` column to `graphSubscriptions` |
| `drizzle/migrations/0054_outlook-push-subscriptions.sql` | Migration for the new column, index, FK |
| `lib/graph/subscriptions.ts` | Update `GraphSubscriptionInsert` type to include optional `outlookOauthTokenId` |
| `app/api/outlook/oauth/callback/route.ts` | Create Graph subscription after storing tokens |
| `app/api/webhooks/email/graph/[tenantId]/route.ts` | Add delegated-token branch in `after()` block |
| `app/api/cron/graph-subscription-renewal/route.ts` | New — hourly renewal cron |
| `app/api/cron/outlook-catch-up/route.ts` | New — hourly catch-up sync for stale accounts |
| `app/api/integrations/status/route.ts` | Return deactivated Outlook account flag |
| `components/ui/AppShell.tsx` | Render reconnection banner when flag is set |

## Not Changed

- Gmail watch system
- Graph credentials system (app-only auth)
- Microsoft 365 webhook handler
- Existing Outlook manual sync endpoint
- Email insertion/classification pipeline
