# Admin Email Log — Design Spec

**Date:** 2026-03-14
**Status:** Draft
**Author:** Claude + User

## Purpose

Build an admin support page at `/admin/emails` that gives the MyOpenBrain support team full visibility into transactional emails sent via Resend. Supports both **troubleshooting** (tracking down individual delivery issues) and **monitoring** (overall email health metrics).

## Requirements

- View all sent emails in a paginated, filterable list
- Search by customer email or name
- Filter by email type, delivery status, and time range
- See delivery health metrics (sent count, delivery rate, bounces, open rate, complaints)
- View full email detail: metadata, delivery event timeline, and rendered HTML preview
- Resend bounced/failed emails with one click
- Receive real-time delivery events from Resend via webhooks
- Admin-only access (existing `getRequiredAdmin()` pattern)

## Architecture

### Data Model

Two new tables in `lib/db/schema.ts`:

#### `emailLogs`

One row per sent email.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | `gen_random_uuid()` |
| userId | uuid (FK → users, nullable) | Recipient's user ID. Nullable for cases where user ID is unavailable (e.g., password reset by email lookup) |
| recipientEmail | text | Actual email address |
| fromEmail | text | Sender address used (e.g., `MyOpenBrain <noreply@myopenbrain.com>`) |
| type | text | e.g. `billing.subscription_confirmed`, `daily_briefing`, `password_reset` |
| subject | text | Email subject line |
| htmlBody | text | Full rendered HTML. Note: some emails (daily briefings, weekly reviews) produce large HTML. No TTL cleanup for now; revisit if table grows beyond 10GB |
| resendId | text | Resend's email ID for API lookups |
| status | text | Latest status: `sent`, `delivered`, `bounced`, `opened`, `complained` (denormalized from events) |
| originalEmailLogId | uuid (FK → emailLogs, nullable) | Set when this is a resend of a previous email |
| createdAt | timestamp | When we sent it |
| updatedAt | timestamp | Updated when status changes via webhook events |

Indexes: `recipientEmail`, `type`, `status`, `resendId` (regular index, not unique — avoids conflicts with best-effort logging edge cases), `createdAt`, composite `(userId, createdAt)`.

#### `emailEvents`

One row per Resend webhook event.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | `gen_random_uuid()` |
| emailLogId | uuid (FK → emailLogs) | Parent email, cascade on delete |
| eventType | text | `email.sent`, `email.delivered`, `email.bounced`, `email.opened`, `email.clicked`, `email.complained` |
| metadata | jsonb | Raw webhook payload (bounce reason, click URL, etc.) |
| occurredAt | timestamp | When Resend says the event happened |
| createdAt | timestamp | When we received the webhook |

Index: `emailLogId`, `eventType`.

#### Access Control

No RLS policies on these tables — matching the existing pattern for `webhookLogs` and `adminActionLogs`. Admin access enforced server-side via `getRequiredAdmin()` and API-level role checks.

### Email Logging Utility

**File:** `lib/email/log.ts`

**`logAndSend(params)`** — wraps `resend.emails.send()`:
- Accepts: `{ from, to, subject, html, userId?, type }` — includes `from` to handle divergent sender addresses across the codebase
- Sends email via Resend using the shared `getResend()` instance from `lib/email/resend.ts`
- Captures returned `resendId`
- Inserts row into `emailLogs` with status `sent`, storing the `from` address in `fromEmail`
- Returns the Resend response
- If logging fails, email still sends — logging is best-effort

**Integration with existing Resend patterns:** `lib/billing-emails.ts` currently maintains its own private Resend instance and `sendEmail()` helper. As part of this work, refactor `lib/billing-emails.ts` to import from `lib/email/resend.ts` (shared `getResend()`) and replace its `sendEmail()` calls with `logAndSend()`. This consolidates Resend initialization to a single module.

All 14 existing email senders updated to use `logAndSend`:

| Function | Type String |
|----------|------------|
| `sendSubscriptionConfirmedEmail` | `billing.subscription_confirmed` |
| `sendPlanDowngradedEmail` | `billing.plan_downgraded` |
| `sendPaymentFailedEmail` | `billing.payment_failed` |
| `sendSubscriptionCanceledEmail` | `billing.subscription_canceled` |
| `sendTrialEndingSoonEmail` | `billing.trial_ending_soon` |
| `sendPlanChangedEmail` | `billing.plan_changed` |
| `sendInvoicePaidEmail` | `billing.invoice_paid` |
| `sendDailyBriefingEmail` | `daily_briefing` |
| `sendWeeklyReviewEmail` | `weekly_review` |
| `sendAssessmentEmail` | `weekly_plan.assessment` |
| `sendReminderEmail` | `reminder` |
| `sendPasswordResetEmail` | `password_reset` |
| Deletion confirmation (inline in `app/api/account/delete-data/route.ts`) | `account.deletion` — extract inline `resend.emails.send()` call into `logAndSend()` call |
| Action item reminder (inline) | `action_item.reminder` |

### Resend Webhook Endpoint

**File:** `app/api/webhooks/resend/route.ts`

- **Method:** POST
- **Auth:** Resend webhook signature verification via Svix headers (`svix-id`, `svix-timestamp`, `svix-signature`)
- **Env var:** `RESEND_WEBHOOK_SECRET` — the webhook signing secret from Resend dashboard
- **Flow:**
  1. Verify signature
  2. Parse event payload — extract `type` and `data.email_id`
  3. Look up `emailLogs` row by `resendId = data.email_id`
  4. Insert row into `emailEvents`
  5. Update `emailLogs.status` to latest state based on event priority: `complained > bounced > opened > delivered > sent`. `email.clicked` events are stored in `emailEvents` but do not update the status field (clicks are informational, not a delivery state)
  6. Return 200
- **Edge cases:**
  - Unknown `resendId` (email sent before logging was added): skip, return 200
  - Duplicate events: insert anyway (idempotent, events are append-only)

### Admin API Endpoint

**File:** `app/api/admin/emails/route.ts`

- **Method:** GET
- **Auth:** Session + admin role check
- **Query params:**
  - `search` — filters by recipientEmail ILIKE or user name ILIKE
  - `type` — exact match on email type
  - `status` — exact match on status
  - `range` — `24h`, `7d`, `30d` (filters by createdAt)
  - `page` — pagination (50 per page)
- **Response:** `{ emails: EmailLog[], total: number, metrics: { sent: number, delivered: number, bounced: number, opened: number, complained: number } }`
- **Joins:** emailLogs LEFT JOIN users (for name), includes aggregated metrics for the filtered time range

### Admin UI

**Files:**
```
app/(app)/admin/emails/
  page.tsx              — server component, getRequiredAdmin(), fetch initial data
  EmailsClient.tsx      — client component with all UI state
  actions.ts            — server actions (resendEmail)
```

#### Main View

- **Metric cards row** (5 cards): Sent (24h), Delivery Rate %, Bounced count, Open Rate %, Complaints count
- **Filter bar:** Search input (email/name), type dropdown, status dropdown, time range toggle (24h/7d/30d)
- **Email table:** Columns — Time (relative), Recipient (email + name), Type (color badge), Subject (truncated), Status (color badge), Actions (View button, Resend button for bounced/failed)
- **Pagination:** Bottom bar with page count and prev/next

#### Detail Drawer

Opens from the right when "View" is clicked (same pattern as `components/board/CardDetailDrawer.tsx`):

- **Header:** Subject line, relative time, recipient. Close button + Resend button (if bounced/failed)
- **Metadata grid:** Recipient, Type badge, Resend ID (monospace), Current Status badge
- **Delivery Timeline:** Vertical timeline of all `emailEvents` for this email. Each node shows event type, timestamp, and inline details (e.g., bounce reason with red left border)
- **Email Preview:** Rendered HTML body in a white container (sandboxed via srcdoc iframe to prevent style bleed)

#### Resend Action

- Button visible only on bounced/failed/complained emails
- Calls server action `resendEmail(emailLogId)`
- Server action:
  1. Reads original email from `emailLogs` (htmlBody, recipientEmail, subject, userId, type)
  2. Calls `logAndSend()` with same params + `originalEmailLogId` reference
  3. Logs to `adminActionLogs` (action: `resend_email`, details: `{ originalEmailLogId, newEmailLogId }`)
  4. Returns success/error
- Creates a brand new `emailLogs` row (not an update)
- Confirmation dialog before sending

### Navigation

Add "Emails" entry to `ADMIN_ITEMS` in `components/ui/SideNav.tsx`, between Subscriptions and Webhooks. Route: `/admin/emails`.

## Styling

Follows existing admin page conventions:
- CSS variables: `--card`, `--border`, `--muted`, `--foreground`, `--muted-foreground`, `--primary`
- Custom HTML tables (no component library)
- Status badges: colored pill spans (`rounded-full text-xs font-medium`)
- Type badges: color-coded by category (blue for briefing, red for billing, green for review, purple for reminder, gray for system)
- Responsive: stacks on mobile

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `RESEND_WEBHOOK_SECRET` | Webhook signing secret from Resend dashboard |
| `RESEND_API_KEY` | Already exists — used by `getResend()` |
| `RESEND_EMAIL` | Already exists — sender address |

## Setup Steps (Post-Deploy)

1. In Resend dashboard, create a webhook pointing to `https://myopenbrain.com/api/webhooks/resend`
2. Subscribe to events: `email.sent`, `email.delivered`, `email.bounced`, `email.opened`, `email.clicked`, `email.complained`
3. Copy the signing secret to `RESEND_WEBHOOK_SECRET` env var

## Out of Scope

- Email analytics/charts (could add later)
- Batch resend (one at a time only)
- Email template editor
- Backfilling historical emails sent before logging was added
