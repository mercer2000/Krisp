# Admin Email Log Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an admin support page at `/admin/emails` with email logging, Resend webhook integration, and full support tooling (search, filter, detail view, resend action).

**Architecture:** Two new DB tables (`emailLogs`, `emailEvents`) store send records and delivery events. A `logAndSend()` wrapper replaces all direct `resend.emails.send()` calls. A Resend webhook endpoint receives delivery events. An admin page provides metrics, filterable list, detail drawer with event timeline and HTML preview.

**Tech Stack:** Next.js 16, React 19, Drizzle ORM, Neon PostgreSQL, Resend v4, Svix (webhook verification), Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-03-14-admin-email-log-design.md`

---

## File Structure

**New files:**
- `lib/email/log.ts` — `logAndSend()` utility wrapping Resend sends with DB logging
- `app/api/webhooks/resend/route.ts` — Resend webhook endpoint (Svix signature verification)
- `app/api/admin/emails/route.ts` — Admin API for paginated, filterable email logs
- `app/api/admin/emails/[id]/route.ts` — Admin API for email detail + events
- `app/(app)/admin/emails/page.tsx` — Server component (admin auth gate)
- `app/(app)/admin/emails/EmailsClient.tsx` — Client component (full admin UI)
- `app/(app)/admin/emails/actions.ts` — Server actions (resend email)
- `drizzle/migrations/0055_email-logs.sql` — Migration for new tables

**Modified files:**
- `lib/db/schema.ts` — Add `emailLogs` and `emailEvents` table definitions
- `lib/billing-emails.ts` — Refactor to use shared `getResend()` and `logAndSend()`
- `lib/daily-briefing/email.ts` — Replace `resend.emails.send()` with `logAndSend()`
- `lib/weekly-review/email.ts` — Replace `resend.emails.send()` with `logAndSend()`
- `lib/weekly-plan/email.ts` — Replace `resend.emails.send()` with `logAndSend()`
- `lib/reminders/email.ts` — Replace `resend.emails.send()` with `logAndSend()`
- `lib/email/password-reset.ts` — Replace `resend.emails.send()` with `logAndSend()`
- `app/api/action-items/remind/route.ts` — Replace inline `resend.emails.send()` with `logAndSend()`
- `app/api/account/delete-data/route.ts` — Replace inline `resend.emails.send()` with `logAndSend()`
- `components/ui/SideNav.tsx` — Add "Emails" to ADMIN_ITEMS array

---

## Chunk 1: Data Model & Logging Utility

### Task 1: Add `emailLogs` and `emailEvents` tables to schema

**Files:**
- Modify: `lib/db/schema.ts`

- [ ] **Step 1: Add emailLogs table definition**

Add at the very end of `lib/db/schema.ts` (after the `webhookLogs` table, which ends around line 2641):

```typescript
export const emailLogs = pgTable(
  "email_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    recipientEmail: text("recipient_email").notNull(),
    fromEmail: text("from_email").notNull(),
    type: varchar("type", { length: 100 }).notNull(),
    subject: text("subject").notNull(),
    htmlBody: text("html_body").notNull(),
    resendId: text("resend_id"),
    status: varchar("status", { length: 20 }).notNull().default("sent"),
    originalEmailLogId: uuid("original_email_log_id").references(
      (): AnyPgColumn => emailLogs.id,
      { onDelete: "set null" }
    ),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_email_logs_recipient").on(table.recipientEmail),
    index("idx_email_logs_type").on(table.type),
    index("idx_email_logs_status").on(table.status),
    index("idx_email_logs_resend_id").on(table.resendId),
    index("idx_email_logs_created").on(table.createdAt),
    index("idx_email_logs_user_created").on(table.userId, table.createdAt),
  ]
);

export const emailEvents = pgTable(
  "email_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    emailLogId: uuid("email_log_id")
      .notNull()
      .references(() => emailLogs.id, { onDelete: "cascade" }),
    eventType: varchar("event_type", { length: 50 }).notNull(),
    metadata: jsonb("metadata"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_email_events_log").on(table.emailLogId),
    index("idx_email_events_type").on(table.eventType),
  ]
);
```

- [ ] **Step 2: Verify schema compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to emailLogs or emailEvents

- [ ] **Step 3: Commit**

```bash
git add lib/db/schema.ts
git commit -m "feat(schema): add emailLogs and emailEvents tables"
```

---

### Task 2: Create migration SQL

**Files:**
- Create: `drizzle/migrations/0055_email-logs.sql`

- [ ] **Step 1: Write the migration file**

```sql
CREATE TABLE IF NOT EXISTS "email_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "recipient_email" text NOT NULL,
  "from_email" text NOT NULL,
  "type" varchar(100) NOT NULL,
  "subject" text NOT NULL,
  "html_body" text NOT NULL,
  "resend_id" text,
  "status" varchar(20) NOT NULL DEFAULT 'sent',
  "original_email_log_id" uuid REFERENCES "email_logs"("id") ON DELETE SET NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "email_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email_log_id" uuid NOT NULL REFERENCES "email_logs"("id") ON DELETE CASCADE,
  "event_type" varchar(50) NOT NULL,
  "metadata" jsonb,
  "occurred_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_email_logs_recipient" ON "email_logs" ("recipient_email");
CREATE INDEX IF NOT EXISTS "idx_email_logs_type" ON "email_logs" ("type");
CREATE INDEX IF NOT EXISTS "idx_email_logs_status" ON "email_logs" ("status");
CREATE INDEX IF NOT EXISTS "idx_email_logs_resend_id" ON "email_logs" ("resend_id");
CREATE INDEX IF NOT EXISTS "idx_email_logs_created" ON "email_logs" ("created_at");
CREATE INDEX IF NOT EXISTS "idx_email_logs_user_created" ON "email_logs" ("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_email_events_log" ON "email_events" ("email_log_id");
CREATE INDEX IF NOT EXISTS "idx_email_events_type" ON "email_events" ("event_type");
```

- [ ] **Step 2: Run migration against the database**

Run: `DATABASE_URL="$DATABASE_URL" npx drizzle-kit migrate`
Expected: Migration `0055_email-logs.sql` applied successfully. Do NOT use `drizzle-kit push` as it derives DDL from the schema and may conflict with the manual migration file.

- [ ] **Step 3: Commit**

```bash
git add drizzle/migrations/0055_email-logs.sql
git commit -m "feat(db): add email_logs and email_events migration"
```

---

### Task 3: Create `logAndSend()` utility

**Files:**
- Create: `lib/email/log.ts`

- [ ] **Step 1: Create the logging utility**

```typescript
import { db } from "@/lib/db";
import { emailLogs } from "@/lib/db/schema";
import { getResend, getSenderEmail } from "./resend";

interface LogAndSendParams {
  from?: string;
  to: string;
  subject: string;
  html: string;
  userId?: string | null;
  type: string;
  originalEmailLogId?: string;
}

export async function logAndSend(params: LogAndSendParams) {
  const resend = getResend();
  const from = params.from ?? getSenderEmail();

  // Send the email first — delivery is never blocked by logging
  const result = await resend.emails.send({
    from,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });

  // Best-effort logging
  try {
    await db.insert(emailLogs).values({
      userId: params.userId ?? null,
      recipientEmail: params.to,
      fromEmail: from,
      type: params.type,
      subject: params.subject,
      htmlBody: params.html,
      resendId: result.data?.id ?? null,
      status: "sent",
      originalEmailLogId: params.originalEmailLogId ?? null,
    });
  } catch (error) {
    console.error("[email-log] Failed to log email:", error);
  }

  return result;
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add lib/email/log.ts
git commit -m "feat(email): add logAndSend utility for email logging"
```

---

### Task 4: Refactor `billing-emails.ts` to use shared Resend and `logAndSend()`

**Files:**
- Modify: `lib/billing-emails.ts`

- [ ] **Step 1: Replace private Resend instance with shared imports**

Remove the private `Resend` import, `resend` Proxy, and `sendEmail()` helper. Replace with imports from the shared modules:

```typescript
import { logAndSend } from "@/lib/email/log";
```

Keep the `FROM` constant:
```typescript
const FROM = "MyOpenBrain <noreply@myopenbrain.com>";
```

- [ ] **Step 2: Update all 7 send functions**

Replace every `sendEmail({ from: FROM, to, subject, html })` call with:

```typescript
await logAndSend({
  from: FROM,
  to,
  subject,
  html,
  type: "billing.subscription_confirmed", // appropriate type per function
});
```

The type strings for each function:
- `sendSubscriptionConfirmedEmail` → `"billing.subscription_confirmed"`
- `sendPlanDowngradedEmail` → `"billing.plan_downgraded"`
- `sendPaymentFailedEmail` → `"billing.payment_failed"`
- `sendSubscriptionCanceledEmail` → `"billing.subscription_canceled"`
- `sendTrialEndingSoonEmail` → `"billing.trial_ending_soon"`
- `sendPlanChangedEmail` → `"billing.plan_changed"`
- `sendInvoicePaidEmail` → `"billing.invoice_paid"`

**Important:** Wrap each `logAndSend()` call in try/catch to preserve the existing error-swallowing behavior of `sendEmail()`. Without this, Resend API failures will propagate up and crash the Stripe webhook handler.

```typescript
try {
  await logAndSend({ from: FROM, to, subject, html, type: "billing.subscription_confirmed" });
} catch (err) {
  console.error("[billing-emails] Failed to send email:", err);
}
```

Note: These billing functions don't have userId available in their current signatures. Pass `userId: undefined` (it's optional/nullable). If user context is available at the call site, a follow-up can thread it through.

- [ ] **Step 3: Handle the missing RESEND_API_KEY guard**

The old code silently skipped when `RESEND_API_KEY` was missing. `logAndSend()` uses `getResend()` which throws. Add a guard at the top of each function:

```typescript
if (!process.env.RESEND_API_KEY) {
  console.log("[billing-emails] RESEND_API_KEY not set, skipping email");
  return;
}
```

- [ ] **Step 4: Verify it compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add lib/billing-emails.ts
git commit -m "refactor(billing-emails): use shared logAndSend for email logging"
```

---

### Task 5: Update remaining email senders to use `logAndSend()`

**Files:**
- Modify: `lib/daily-briefing/email.ts`
- Modify: `lib/weekly-review/email.ts`
- Modify: `lib/weekly-plan/email.ts`
- Modify: `lib/reminders/email.ts`
- Modify: `lib/email/password-reset.ts`
- Modify: `app/api/action-items/remind/route.ts`
- Modify: `app/api/account/delete-data/route.ts`

- [ ] **Step 1: Update `lib/daily-briefing/email.ts`**

Replace:
```typescript
const resend = getResend();
await resend.emails.send({ from: getSenderEmail(), to: user.email, subject: "...", html });
```
With:
```typescript
import { logAndSend } from "@/lib/email/log";
// ...
await logAndSend({
  to: user.email,
  subject: subjectLine,
  html,
  userId: briefing.userId,
  type: "daily_briefing",
});
```

Remove unused `getResend`/`getSenderEmail` imports if no longer needed.

- [ ] **Step 2: Update `lib/weekly-review/email.ts`**

Same pattern. Replace `resend.emails.send()` with:
```typescript
await logAndSend({
  to: user.email,
  subject: subjectLine,
  html,
  userId: review.userId,
  type: "weekly_review",
});
```

- [ ] **Step 3: Update `lib/weekly-plan/email.ts`**

Replace `resend.emails.send()` with:
```typescript
await logAndSend({
  to: user.email,
  subject: subjectLine,
  html,
  userId,
  type: "weekly_plan.assessment",
});
```

- [ ] **Step 4: Update `lib/reminders/email.ts`**

Replace `resend.emails.send()` with:
```typescript
await logAndSend({
  to: params.userEmail,
  subject: `Reminder: ${title}`,
  html,
  type: "reminder",
});
```

Note: `sendReminderEmail` doesn't receive a userId — leave it as undefined.

- [ ] **Step 5: Update `lib/email/password-reset.ts`**

Replace:
```typescript
const { error } = await resend.emails.send({
  from: `Life Kanban <${senderEmail}>`,
  to,
  subject: "Reset your password",
  html: buildResetEmailHtml(resetUrl),
});
```
With:
```typescript
import { logAndSend } from "@/lib/email/log";
// ...
const senderEmail = getSenderEmail();
const result = await logAndSend({
  from: `Life Kanban <${senderEmail}>`,
  to,
  subject: "Reset your password",
  html: buildResetEmailHtml(resetUrl),
  type: "password_reset",
});
if (result.error) return { success: false, error: "Failed to send reset email..." };
return { success: true };
```

- [ ] **Step 6: Update `app/api/action-items/remind/route.ts`**

Find the inline `resend.emails.send()` call and replace with:
```typescript
import { logAndSend } from "@/lib/email/log";
// ...
await logAndSend({
  to: user.email,
  subject: `Action Items Reminder: ${dueItems.length} item${dueItems.length > 1 ? "s" : ""} need attention`,
  html: emailHtml,
  userId: session.user.id,
  type: "action_item.reminder",
});
```

- [ ] **Step 7: Update `app/api/account/delete-data/route.ts`**

Find the inline `resend.emails.send()` call and replace with:
```typescript
import { logAndSend } from "@/lib/email/log";
// ...
await logAndSend({
  to: user.email,
  subject: "Your MyOpenBrain data has been deleted",
  html: deletionHtml,
  userId: session.user.id,
  type: "account.deletion",
});
```

- [ ] **Step 8: Verify everything compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 9: Commit**

```bash
git add lib/daily-briefing/email.ts lib/weekly-review/email.ts lib/weekly-plan/email.ts lib/reminders/email.ts lib/email/password-reset.ts app/api/action-items/remind/route.ts app/api/account/delete-data/route.ts
git commit -m "refactor(email): migrate all email senders to logAndSend"
```

---

## Chunk 2: Resend Webhook Endpoint

### Task 6: Install svix package

**Files:** None (package.json updated by npm)

- [ ] **Step 1: Install svix**

Run: `npm install svix`
Expected: Package added successfully

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add svix for Resend webhook verification"
```

---

### Task 7: Create Resend webhook endpoint

**Files:**
- Create: `app/api/webhooks/resend/route.ts`

- [ ] **Step 1: Create the webhook route**

```typescript
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { db } from "@/lib/db";
import { emailLogs, emailEvents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const STATUS_PRIORITY: Record<string, number> = {
  sent: 1,
  delivered: 2,
  opened: 3,
  bounced: 4,
  complained: 5,
};

function eventTypeToStatus(eventType: string): string | null {
  const map: Record<string, string> = {
    "email.sent": "sent",
    "email.delivered": "delivered",
    "email.opened": "opened",
    "email.bounced": "bounced",
    "email.complained": "complained",
  };
  return map[eventType] ?? null;
}

export async function POST(req: Request) {
  const body = await req.text();
  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[resend-webhook] RESEND_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  let payload: { type: string; data: { email_id?: string; created_at?: string; [key: string]: unknown } };
  try {
    const wh = new Webhook(secret);
    payload = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as typeof payload;
  } catch (err) {
    console.error("[resend-webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const resendId = payload.data.email_id;
  if (!resendId) {
    return NextResponse.json({ received: true });
  }

  // Look up the email log
  const [log] = await db
    .select({ id: emailLogs.id, status: emailLogs.status })
    .from(emailLogs)
    .where(eq(emailLogs.resendId, resendId))
    .limit(1);

  if (!log) {
    // Email sent before logging was added — skip
    return NextResponse.json({ received: true });
  }

  // Insert event
  await db.insert(emailEvents).values({
    emailLogId: log.id,
    eventType: payload.type,
    metadata: payload.data,
    occurredAt: payload.data.created_at
      ? new Date(payload.data.created_at)
      : new Date(),
  });

  // Update denormalized status if higher priority
  const newStatus = eventTypeToStatus(payload.type);
  if (newStatus) {
    const currentPriority = STATUS_PRIORITY[log.status] ?? 0;
    const newPriority = STATUS_PRIORITY[newStatus] ?? 0;
    if (newPriority > currentPriority) {
      await db
        .update(emailLogs)
        .set({ status: newStatus, updatedAt: new Date() })
        .where(eq(emailLogs.id, log.id));
    }
  }

  return NextResponse.json({ received: true });
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add app/api/webhooks/resend/route.ts
git commit -m "feat(webhooks): add Resend webhook endpoint for delivery events"
```

---

## Chunk 3: Admin API & Server Actions

### Task 8: Create admin emails API route

**Files:**
- Create: `app/api/admin/emails/route.ts`

- [ ] **Step 1: Create the API route**

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailLogs, emailEvents, users } from "@/lib/db/schema";
import { eq, ilike, and, gte, or, sql, desc, count } from "drizzle-orm";
import { auth } from "@/lib/auth/server";

export async function GET(req: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [adminUser] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (adminUser?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const search = url.searchParams.get("search") ?? "";
  const type = url.searchParams.get("type") ?? "";
  const status = url.searchParams.get("status") ?? "";
  const range = url.searchParams.get("range") ?? "24h";
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const pageSize = 50;

  // Time range filter
  const now = new Date();
  const rangeMs: Record<string, number> = {
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
  };
  const since = new Date(now.getTime() - (rangeMs[range] ?? rangeMs["24h"]));

  // Build conditions
  const conditions = [gte(emailLogs.createdAt, since)];
  if (search) {
    conditions.push(
      or(
        ilike(emailLogs.recipientEmail, `%${search}%`),
        ilike(users.displayName, `%${search}%`)
      )!
    );
  }
  if (type) {
    // Type dropdown passes prefix values like "billing" — use LIKE for dotted types
    conditions.push(type.includes(".") ? eq(emailLogs.type, type) : ilike(emailLogs.type, `${type}%`));
  }
  if (status) conditions.push(eq(emailLogs.status, status));

  const whereClause = and(...conditions);

  // Get total count
  const [{ total }] = await db
    .select({ total: count() })
    .from(emailLogs)
    .leftJoin(users, eq(emailLogs.userId, users.id))
    .where(whereClause);

  // Get paginated emails
  const emails = await db
    .select({
      id: emailLogs.id,
      userId: emailLogs.userId,
      recipientEmail: emailLogs.recipientEmail,
      fromEmail: emailLogs.fromEmail,
      type: emailLogs.type,
      subject: emailLogs.subject,
      resendId: emailLogs.resendId,
      status: emailLogs.status,
      originalEmailLogId: emailLogs.originalEmailLogId,
      createdAt: emailLogs.createdAt,
      updatedAt: emailLogs.updatedAt,
      userName: users.displayName,
    })
    .from(emailLogs)
    .leftJoin(users, eq(emailLogs.userId, users.id))
    .where(whereClause)
    .orderBy(desc(emailLogs.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  // Metrics for the time range (unfiltered by search/type/status)
  const metricsCondition = gte(emailLogs.createdAt, since);
  const [metrics] = await db
    .select({
      total: count(),
      delivered: sql<number>`count(*) filter (where ${emailLogs.status} = 'delivered')`,
      bounced: sql<number>`count(*) filter (where ${emailLogs.status} = 'bounced')`,
      opened: sql<number>`count(*) filter (where ${emailLogs.status} = 'opened')`,
      complained: sql<number>`count(*) filter (where ${emailLogs.status} = 'complained')`,
    })
    .from(emailLogs)
    .where(metricsCondition);

  return NextResponse.json({ emails, total, metrics });
}
```

- [ ] **Step 2: Create the email detail endpoint**

Add to the same file, or create `app/api/admin/emails/[id]/route.ts`:

```typescript
// app/api/admin/emails/[id]/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailLogs, emailEvents, users } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { auth } from "@/lib/auth/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [adminUser] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (adminUser?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const [email] = await db
    .select({
      id: emailLogs.id,
      userId: emailLogs.userId,
      recipientEmail: emailLogs.recipientEmail,
      fromEmail: emailLogs.fromEmail,
      type: emailLogs.type,
      subject: emailLogs.subject,
      htmlBody: emailLogs.htmlBody,
      resendId: emailLogs.resendId,
      status: emailLogs.status,
      originalEmailLogId: emailLogs.originalEmailLogId,
      createdAt: emailLogs.createdAt,
      updatedAt: emailLogs.updatedAt,
      userName: users.displayName,
    })
    .from(emailLogs)
    .leftJoin(users, eq(emailLogs.userId, users.id))
    .where(eq(emailLogs.id, id))
    .limit(1);

  if (!email) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const events = await db
    .select()
    .from(emailEvents)
    .where(eq(emailEvents.emailLogId, id))
    .orderBy(asc(emailEvents.occurredAt));

  return NextResponse.json({ email, events });
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add app/api/admin/emails/route.ts app/api/admin/emails/\[id\]/route.ts
git commit -m "feat(api): add admin email logs API with filtering and detail"
```

---

### Task 9: Create server actions for resend

**Files:**
- Create: `app/(app)/admin/emails/actions.ts`

- [ ] **Step 1: Create the server actions file**

```typescript
"use server";

import { db } from "@/lib/db";
import { emailLogs, adminActionLogs, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { logAndSend } from "@/lib/email/log";

async function requireAdmin() {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const [user] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (user?.role !== "admin") throw new Error("Forbidden");
  return session.user.id;
}

export async function resendEmail(emailLogId: string) {
  const adminUserId = await requireAdmin();

  const [original] = await db
    .select({
      recipientEmail: emailLogs.recipientEmail,
      fromEmail: emailLogs.fromEmail,
      subject: emailLogs.subject,
      htmlBody: emailLogs.htmlBody,
      userId: emailLogs.userId,
      type: emailLogs.type,
    })
    .from(emailLogs)
    .where(eq(emailLogs.id, emailLogId))
    .limit(1);

  if (!original) return { error: "Email not found" };

  try {
    await logAndSend({
      from: original.fromEmail,
      to: original.recipientEmail,
      subject: original.subject,
      html: original.htmlBody,
      userId: original.userId,
      type: original.type,
      originalEmailLogId: emailLogId,
    });

    await db.insert(adminActionLogs).values({
      adminUserId,
      action: "resend_email",
      details: { originalEmailLogId: emailLogId },
    });

    return { success: true };
  } catch (err) {
    console.error("[admin] Failed to resend email:", err);
    return { error: "Failed to resend email" };
  }
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/admin/emails/actions.ts"
git commit -m "feat(admin): add resendEmail server action"
```

---

## Chunk 4: Admin UI

### Task 10: Create admin emails server page

**Files:**
- Create: `app/(app)/admin/emails/page.tsx`

- [ ] **Step 1: Create the server component**

```typescript
import { getRequiredAdmin } from "@/lib/auth/getRequiredAdmin";
import { EmailsClient } from "./EmailsClient";

export default async function AdminEmailsPage() {
  const admin = await getRequiredAdmin();
  return <EmailsClient adminId={admin.id} />;
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(app)/admin/emails/page.tsx"
git commit -m "feat(admin): add emails page server component"
```

---

### Task 11: Create `EmailsClient.tsx`

**Files:**
- Create: `app/(app)/admin/emails/EmailsClient.tsx`

This is the largest file. It contains: metric cards, filters, email table, detail drawer, and resend confirmation.

- [ ] **Step 1: Create the client component**

```tsx
"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { resendEmail } from "./actions";

/* ---------- Types ---------- */

interface EmailRow {
  id: string;
  userId: string | null;
  recipientEmail: string;
  fromEmail: string;
  type: string;
  subject: string;
  resendId: string | null;
  status: string;
  originalEmailLogId: string | null;
  createdAt: string;
  updatedAt: string;
  userName: string | null;
}

interface EmailDetail extends EmailRow {
  htmlBody: string;
}

interface EmailEvent {
  id: string;
  emailLogId: string;
  eventType: string;
  metadata: Record<string, unknown> | null;
  occurredAt: string;
  createdAt: string;
}

interface Metrics {
  total: number;
  delivered: number;
  bounced: number;
  opened: number;
  complained: number;
}

/* ---------- Helpers ---------- */

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  sent: { bg: "bg-blue-500/20", text: "text-blue-400" },
  delivered: { bg: "bg-green-500/20", text: "text-green-400" },
  opened: { bg: "bg-green-500/20", text: "text-green-300" },
  bounced: { bg: "bg-yellow-500/20", text: "text-yellow-400" },
  complained: { bg: "bg-red-500/20", text: "text-red-400" },
};

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  billing: { bg: "bg-red-500/15", text: "text-red-400" },
  daily_briefing: { bg: "bg-blue-500/15", text: "text-blue-400" },
  weekly_review: { bg: "bg-green-500/15", text: "text-green-400" },
  weekly_plan: { bg: "bg-teal-500/15", text: "text-teal-400" },
  reminder: { bg: "bg-purple-500/15", text: "text-purple-400" },
  password_reset: { bg: "bg-gray-500/15", text: "text-gray-400" },
  account: { bg: "bg-gray-500/15", text: "text-gray-400" },
  action_item: { bg: "bg-orange-500/15", text: "text-orange-400" },
};

function getTypeColor(type: string) {
  const prefix = type.split(".")[0];
  return TYPE_COLORS[prefix] ?? TYPE_COLORS[type] ?? { bg: "bg-gray-500/15", text: "text-gray-400" };
}

function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const RESENDABLE_STATUSES = ["bounced", "complained"];

const EMAIL_TYPES = [
  { value: "", label: "All types" },
  { value: "billing", label: "Billing" },
  { value: "daily_briefing", label: "Daily Briefing" },
  { value: "weekly_review", label: "Weekly Review" },
  { value: "weekly_plan", label: "Weekly Plan" },
  { value: "reminder", label: "Reminder" },
  { value: "password_reset", label: "Password Reset" },
  { value: "account", label: "Account" },
  { value: "action_item", label: "Action Item" },
];

/* ---------- Component ---------- */

export function EmailsClient({ adminId }: { adminId: string }) {
  const [emails, setEmails] = useState<EmailRow[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({ total: 0, delivered: 0, bounced: 0, opened: 0, complained: 0 });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [range, setRange] = useState("24h");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<{ email: EmailDetail; events: EmailEvent[] } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [confirmResend, setConfirmResend] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  const pageSize = 50;

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchEmails = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ range, page: String(page) });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (typeFilter) params.set("type", typeFilter);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/emails?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setEmails(data.emails);
      setTotal(data.total);
      setMetrics(data.metrics);
    } catch (err) {
      console.error("Failed to fetch emails:", err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, typeFilter, statusFilter, range, page]);

  useEffect(() => { fetchEmails(); }, [fetchEmails]);

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/emails/${id}`);
      if (!res.ok) throw new Error("Failed to fetch detail");
      const data = await res.json();
      setDetail(data);
    } catch (err) {
      console.error("Failed to fetch email detail:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleResend = (emailLogId: string) => {
    startTransition(async () => {
      const result = await resendEmail(emailLogId);
      if (result.error) {
        setFeedback(`Error: ${result.error}`);
      } else {
        setFeedback("Email resent successfully");
        fetchEmails();
      }
      setConfirmResend(null);
      setTimeout(() => setFeedback(null), 3000);
    });
  };

  const totalPages = Math.ceil(total / pageSize);
  const deliveryRate = metrics.total > 0 ? ((metrics.delivered / metrics.total) * 100).toFixed(1) : "0";
  const openRate = metrics.total > 0 ? ((metrics.opened / metrics.total) * 100).toFixed(1) : "0";

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Email Logs</h1>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <MetricCard label={`Sent (${range})`} value={String(metrics.total)} />
          <MetricCard label="Delivered" value={`${deliveryRate}%`} color="text-green-400" />
          <MetricCard label="Bounced" value={String(metrics.bounced)} color="text-red-400" />
          <MetricCard label="Opened" value={`${openRate}%`} color="text-blue-400" />
          <MetricCard label="Complaints" value={String(metrics.complained)} color="text-yellow-400" />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <input
            type="text"
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm"
          >
            {EMAIL_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm"
          >
            <option value="">All statuses</option>
            <option value="sent">Sent</option>
            <option value="delivered">Delivered</option>
            <option value="bounced">Bounced</option>
            <option value="opened">Opened</option>
            <option value="complained">Complained</option>
          </select>
          <div className="flex rounded-lg border border-[var(--border)] overflow-hidden">
            {["24h", "7d", "30d"].map((r) => (
              <button
                key={r}
                onClick={() => { setRange(r); setPage(1); }}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  range === r
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                    : "bg-[var(--card)] text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
                <th className="text-left px-4 py-3 text-[var(--muted-foreground)] font-medium">Time</th>
                <th className="text-left px-4 py-3 text-[var(--muted-foreground)] font-medium">Recipient</th>
                <th className="text-left px-4 py-3 text-[var(--muted-foreground)] font-medium">Type</th>
                <th className="text-left px-4 py-3 text-[var(--muted-foreground)] font-medium">Subject</th>
                <th className="text-left px-4 py-3 text-[var(--muted-foreground)] font-medium">Status</th>
                <th className="text-right px-4 py-3 text-[var(--muted-foreground)] font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-[var(--border)]">
                    <td colSpan={6} className="px-4 py-3">
                      <div className="h-5 rounded bg-[var(--muted)] animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : emails.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[var(--muted-foreground)]">
                    No emails found
                  </td>
                </tr>
              ) : (
                emails.map((email) => {
                  const sc = STATUS_COLORS[email.status] ?? STATUS_COLORS.sent;
                  const tc = getTypeColor(email.type);
                  return (
                    <tr
                      key={email.id}
                      className="border-t border-[var(--border)] hover:bg-[var(--accent)] transition-colors cursor-pointer"
                      onClick={() => openDetail(email.id)}
                    >
                      <td className="px-4 py-3 text-[var(--muted-foreground)] whitespace-nowrap">
                        {relativeTime(email.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-[var(--foreground)]">{email.recipientEmail}</div>
                        {email.userName && (
                          <div className="text-xs text-[var(--muted-foreground)]">{email.userName}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tc.bg} ${tc.text}`}>
                          {email.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--foreground)] max-w-[250px] truncate">
                        {email.subject}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${sc.bg} ${sc.text}`}>
                          {email.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => openDetail(email.id)}
                          className="px-2 py-1 text-xs rounded border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--accent)] transition-colors"
                        >
                          View
                        </button>
                        {RESENDABLE_STATUSES.includes(email.status) && (
                          <button
                            onClick={() => setConfirmResend(email.id)}
                            className="ml-2 px-2 py-1 text-xs rounded border border-red-400/30 text-red-400 hover:bg-red-400/10 transition-colors"
                          >
                            Resend
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center px-4 py-3 border-t border-[var(--border)]">
              <span className="text-xs text-[var(--muted-foreground)]">
                Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-xs rounded border border-[var(--border)] text-[var(--muted-foreground)] disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 text-xs rounded border border-[var(--border)] text-[var(--muted-foreground)] disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Drawer */}
      {(detail || detailLoading) && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDetail(null)} />
          <div className="relative w-full max-w-xl bg-[var(--card)] border-l border-[var(--border)] overflow-y-auto animate-slide-in-right">
            {detailLoading && !detail ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-8 rounded bg-[var(--muted)] animate-pulse" />
                ))}
              </div>
            ) : detail ? (
              <>
                {/* Drawer Header */}
                <div className="flex justify-between items-start p-4 border-b border-[var(--border)]">
                  <div>
                    <h2 className="text-lg font-semibold">{detail.email.subject}</h2>
                    <p className="text-sm text-[var(--muted-foreground)] mt-1">
                      Sent {relativeTime(detail.email.createdAt)} to {detail.email.recipientEmail}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {RESENDABLE_STATUSES.includes(detail.email.status) && (
                      <button
                        onClick={() => setConfirmResend(detail.email.id)}
                        className="px-3 py-1.5 text-xs rounded-lg border border-red-400/30 text-red-400 hover:bg-red-400/10 transition-colors"
                      >
                        Resend Email
                      </button>
                    )}
                    <button
                      onClick={() => setDetail(null)}
                      className="px-2 py-1.5 text-lg rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--accent)] transition-colors leading-none"
                    >
                      ×
                    </button>
                  </div>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 border-b border-[var(--border)]">
                  <div className="p-4 border-r border-b border-[var(--border)]">
                    <div className="text-xs text-[var(--muted-foreground)] uppercase">Recipient</div>
                    <div className="mt-1">{detail.email.userName ? `${detail.email.userName} <${detail.email.recipientEmail}>` : detail.email.recipientEmail}</div>
                  </div>
                  <div className="p-4 border-b border-[var(--border)]">
                    <div className="text-xs text-[var(--muted-foreground)] uppercase">Type</div>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(detail.email.type).bg} ${getTypeColor(detail.email.type).text}`}>
                        {detail.email.type}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 border-r border-[var(--border)]">
                    <div className="text-xs text-[var(--muted-foreground)] uppercase">Resend ID</div>
                    <div className="mt-1 font-mono text-xs text-blue-400">{detail.email.resendId ?? "—"}</div>
                  </div>
                  <div className="p-4">
                    <div className="text-xs text-[var(--muted-foreground)] uppercase">Status</div>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${(STATUS_COLORS[detail.email.status] ?? STATUS_COLORS.sent).bg} ${(STATUS_COLORS[detail.email.status] ?? STATUS_COLORS.sent).text}`}>
                        {detail.email.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Event Timeline */}
                <div className="p-4 border-b border-[var(--border)]">
                  <h3 className="text-xs text-[var(--muted-foreground)] uppercase font-semibold mb-3">Delivery Timeline</h3>
                  {detail.events.length === 0 ? (
                    <p className="text-sm text-[var(--muted-foreground)]">No delivery events received yet</p>
                  ) : (
                    <div className="space-y-0 pl-2">
                      {detail.events.map((event, idx) => {
                        const isLast = idx === detail.events.length - 1;
                        const isBounce = event.eventType.includes("bounced");
                        const isComplaint = event.eventType.includes("complained");
                        const dotColor = isBounce || isComplaint ? "bg-red-400" : "bg-green-400";
                        const bounceReason = isBounce && event.metadata
                          ? (event.metadata as Record<string, unknown>).bounce_type ||
                            (event.metadata as Record<string, unknown>).message ||
                            JSON.stringify(event.metadata)
                          : null;
                        return (
                          <div key={event.id} className="flex gap-3 relative pb-4">
                            <div className="relative z-10 flex flex-col items-center">
                              <div className={`w-2.5 h-2.5 rounded-full ${dotColor} mt-1.5`} />
                              {!isLast && (
                                <div className="w-0.5 flex-1 bg-[var(--border)] mt-1" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="text-sm">{event.eventType}</div>
                              <div className="text-xs text-[var(--muted-foreground)]">
                                {new Date(event.occurredAt).toLocaleString()}
                              </div>
                              {bounceReason && (
                                <div className="mt-1 text-xs text-red-400 bg-red-400/10 px-2 py-1 rounded border-l-2 border-red-400">
                                  {String(bounceReason)}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* HTML Preview */}
                <div className="p-4">
                  <h3 className="text-xs text-[var(--muted-foreground)] uppercase font-semibold mb-3">Email Preview</h3>
                  <div className="rounded-lg border border-[var(--border)] overflow-hidden bg-white">
                    <iframe
                      srcDoc={detail.email.htmlBody}
                      sandbox=""
                      className="w-full min-h-[300px] border-0"
                      title="Email preview"
                    />
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Resend Confirmation Modal */}
      {confirmResend && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmResend(null)} />
          <div className="relative bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Resend Email?</h3>
            <p className="text-sm text-[var(--muted-foreground)] mb-4">
              This will send a new copy of this email to the original recipient.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmResend(null)}
                className="px-3 py-2 text-sm rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--accent)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleResend(confirmResend)}
                disabled={isPending}
                className="px-3 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isPending ? "Sending..." : "Resend"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {feedback && (
        <div className="fixed top-4 right-4 z-[70] px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm shadow-lg">
          {feedback}
        </div>
      )}
    </div>
  );
}

/* ---------- Sub-components ---------- */

function MetricCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
      <div className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${color ?? "text-[var(--foreground)]"}`}>{value}</div>
    </div>
  );
}
```

- [ ] **Step 2: Add slide-in animation to globals.css**

Check if `animate-slide-in-right` already exists in `app/globals.css`. If not, add:

```css
@keyframes slide-in-right {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
.animate-slide-in-right {
  animation: slide-in-right 0.2s ease-out;
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add "app/(app)/admin/emails/EmailsClient.tsx" app/globals.css
git commit -m "feat(admin): add EmailsClient with metrics, filters, table, drawer"
```

---

### Task 12: Add "Emails" to SideNav

**Files:**
- Modify: `components/ui/SideNav.tsx`

- [ ] **Step 1: Add Emails to ADMIN_ITEMS**

Find the `ADMIN_ITEMS` array and add the Emails entry between Subscriptions and Webhooks:

```typescript
const ADMIN_ITEMS = [
  { href: "/admin/subscriptions", label: "Subscriptions", icon: SubscriptionsIcon },
  { href: "/admin/emails", label: "Emails", icon: EmailsIcon },
  { href: "/admin/webhooks", label: "Webhooks", icon: ActivityFeedIcon },
  { href: "/admin/support", label: "Support Chat", icon: SupportChatIcon },
];
```

- [ ] **Step 2: Add an EmailsIcon**

Add a simple email SVG icon function near the other icon functions in SideNav.tsx:

```typescript
function EmailsIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add components/ui/SideNav.tsx
git commit -m "feat(nav): add Emails link to admin menu"
```

---

## Chunk 5: Verification & Cleanup

### Task 13: End-to-end verification

- [ ] **Step 1: Run type check**

Run: `npx tsc --noEmit --pretty`
Expected: No errors

- [ ] **Step 2: Run the dev server**

Run: `npm run dev`
Navigate to `http://localhost:3000/admin/emails`
Expected: Page loads with empty state ("No emails found"), metric cards show zeros, filters work

- [ ] **Step 3: Test the webhook endpoint locally**

Use curl to send a test webhook (without signature verification for local testing — the endpoint will reject with 400, which confirms it's running):

```bash
curl -X POST http://localhost:3000/api/webhooks/resend \
  -H "Content-Type: application/json" \
  -d '{"type":"email.delivered","data":{"email_id":"test"}}'
```
Expected: 400 response (missing svix headers) — confirms the endpoint is reachable

- [ ] **Step 4: Final commit with any fixes**

If any compilation or runtime issues were found, fix and commit:
```bash
git add -A
git commit -m "fix: address issues found during verification"
```
