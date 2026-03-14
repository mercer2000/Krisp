# Outlook Push Subscriptions Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace manual Outlook email sync with automatic real-time delivery via Microsoft Graph push subscriptions.

**Architecture:** Extend the existing `graphSubscriptions` table with a nullable `outlookOauthTokenId` FK column. Auto-create a Graph subscription during OAuth callback. Modify the existing webhook handler to support delegated tokens via a new `/me/` fetch path. Add hourly crons for subscription renewal and catch-up sync.

**Tech Stack:** Next.js 16, Drizzle ORM, Microsoft Graph API v1.0, Vercel Cron, Neon PostgreSQL

**Spec:** `docs/superpowers/specs/2026-03-14-outlook-push-subscriptions-design.md`

---

## Chunk 1: Schema & Data Layer

### Task 1: Add `outlookOauthTokenId` column to schema

**Files:**
- Modify: `lib/db/schema.ts:544-581` (graphSubscriptions table definition)

- [ ] **Step 1: Add the column to the Drizzle schema**

In `lib/db/schema.ts`, inside the `graphSubscriptions` table definition, add after the `credentialId` column (line 551-553):

```typescript
outlookOauthTokenId: uuid("outlook_oauth_token_id").references(
  () => outlookOauthTokens.id,
  { onDelete: "set null" }
),
```

And in the indexes array, add:

```typescript
index("idx_graph_subscriptions_outlook_token").on(table.outlookOauthTokenId),
```

- [ ] **Step 2: Verify the schema compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to `graphSubscriptions`

- [ ] **Step 3: Commit**

```bash
git add lib/db/schema.ts
git commit -m "schema: add outlookOauthTokenId column to graphSubscriptions"
```

### Task 2: Create the SQL migration

**Files:**
- Create: `drizzle/migrations/0055_outlook-push-subscriptions.sql`

- [ ] **Step 1: Write the migration SQL**

```sql
ALTER TABLE graph_subscriptions
  ADD COLUMN outlook_oauth_token_id UUID
    REFERENCES outlook_oauth_tokens(id) ON DELETE SET NULL;

CREATE INDEX idx_graph_subscriptions_outlook_token
  ON graph_subscriptions(outlook_oauth_token_id);
```

- [ ] **Step 2: Run the migration**

Run: `DATABASE_URL="$DATABASE_URL" npx drizzle-kit push`
Expected: Migration applies successfully

- [ ] **Step 3: Commit**

```bash
git add drizzle/migrations/0055_outlook-push-subscriptions.sql
git commit -m "migration: add outlook_oauth_token_id to graph_subscriptions"
```

### Task 3: Update `GraphSubscriptionInsert` type and `createGraphSubscription`

**Files:**
- Modify: `lib/graph/subscriptions.ts:5-35`

- [ ] **Step 1: Make `credentialId` optional and add `outlookOauthTokenId`**

Update the `GraphSubscriptionInsert` interface:

```typescript
export interface GraphSubscriptionInsert {
  tenantId: string;
  credentialId?: string | null;
  outlookOauthTokenId?: string | null;
  subscriptionId: string;
  resource: string;
  changeType: string;
  clientState: string;
  expirationDateTime: Date;
  notificationUrl: string;
}
```

- [ ] **Step 2: Update `createGraphSubscription` to pass the new field**

In the `.values()` call, add:

```typescript
outlookOauthTokenId: data.outlookOauthTokenId ?? null,
```

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add lib/graph/subscriptions.ts
git commit -m "feat: make credentialId optional, add outlookOauthTokenId to GraphSubscriptionInsert"
```

### Task 4: Add `fetchGraphMessageMe` function

**Files:**
- Modify: `lib/graph/messages.ts` (add after `fetchGraphMessage` at ~line 195)

- [ ] **Step 1: Add the function**

Following the existing `deleteGraphMessageMe` pattern (line 50-74), add after `fetchGraphMessage`:

```typescript
/**
 * Fetch a single message using the delegated /me/ endpoint (for Outlook OAuth tokens).
 * Same as fetchGraphMessage but uses /me/ instead of /users/{mailbox}/.
 */
export async function fetchGraphMessageMe(
  messageId: string,
  accessToken: string
): Promise<EmailWebhookPayload | null> {
  const select = [
    "from",
    "toRecipients",
    "ccRecipients",
    "bccRecipients",
    "subject",
    "bodyPreview",
    "body",
    "receivedDateTime",
    "hasAttachments",
    "webLink",
  ].join(",");

  const url = `https://graph.microsoft.com/v1.0/me/messages/${encodeURIComponent(messageId)}?$select=${select}`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      console.warn(
        `[Graph] Failed to fetch message (me) ${messageId}: ${res.status}`
      );
      return null;
    }

    const msg = await res.json();

    const extractEmail = (r: { emailAddress?: { address?: string } }) =>
      r?.emailAddress?.address || "";

    return {
      messageId,
      from: msg.from?.emailAddress?.address || "",
      to: (msg.toRecipients || []).map(extractEmail).filter(Boolean),
      cc: (msg.ccRecipients || []).map(extractEmail).filter(Boolean),
      bcc: (msg.bccRecipients || []).map(extractEmail).filter(Boolean),
      subject: msg.subject || "",
      bodyPlainText: msg.bodyPreview || "",
      bodyHtml:
        msg.body?.contentType === "html" ? msg.body.content || "" : "",
      receivedDateTime: msg.receivedDateTime || new Date().toISOString(),
      webLink: msg.webLink || undefined,
    };
  } catch (err) {
    console.warn(`[Graph] Error fetching message (me) ${messageId}:`, err);
    return null;
  }
}
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add lib/graph/messages.ts
git commit -m "feat: add fetchGraphMessageMe for delegated /me/ token path"
```

---

## Chunk 2: OAuth Callback Subscription Creation

### Task 5: Create Graph subscription in OAuth callback

**Files:**
- Modify: `app/api/outlook/oauth/callback/route.ts:80-89`

- [ ] **Step 1: Import dependencies**

Add to the top of the file:

```typescript
import { createGraphSubscription } from "@/lib/graph/subscriptions";
import { randomUUID } from "crypto";
```

- [ ] **Step 2: Capture the token row ID and create subscription**

Replace lines 80-89 (the `upsertOutlookTokens` call through the redirect) with:

```typescript
    const tokenRow = await upsertOutlookTokens({
      tenantId: userId,
      outlookEmail,
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      tokenExpiry: new Date(Date.now() + tokenResponse.expires_in * 1000),
    });

    // Create a Microsoft Graph push subscription for real-time email notifications
    try {
      const clientState = randomUUID();
      const notificationUrl = `${origin}/api/webhooks/email/graph/${userId}`;
      const expirationDateTime = new Date(Date.now() + 4230 * 60 * 1000); // ~3 days max

      const graphRes = await fetch(
        "https://graph.microsoft.com/v1.0/subscriptions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            changeType: "created",
            notificationUrl,
            resource: "me/mailFolders/inbox/messages",
            expirationDateTime: expirationDateTime.toISOString(),
            clientState,
          }),
        }
      );

      if (graphRes.ok) {
        const sub = await graphRes.json();
        await createGraphSubscription({
          tenantId: userId,
          outlookOauthTokenId: tokenRow.id,
          subscriptionId: sub.id,
          resource: "me/mailFolders/inbox/messages",
          changeType: "created",
          clientState,
          expirationDateTime: new Date(sub.expirationDateTime),
          notificationUrl,
        });
        console.log(`[Outlook OAuth] Graph subscription created for ${outlookEmail}`);
      } else {
        const errText = await graphRes.text().catch(() => "");
        console.error(
          `[Outlook OAuth] Failed to create Graph subscription (${graphRes.status}): ${errText}`
        );
      }
    } catch (subErr) {
      // Non-fatal: catch-up cron will handle email sync
      console.error("[Outlook OAuth] Graph subscription creation error:", subErr);
    }

    return NextResponse.redirect(
      new URL("/settings/integrations/outlook?connected=true", request.url)
    );
```

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add app/api/outlook/oauth/callback/route.ts
git commit -m "feat: auto-create Graph push subscription on Outlook OAuth callback"
```

---

## Chunk 3: Webhook Handler Modification

### Task 6: Add delegated-token branch to webhook handler

**Files:**
- Modify: `app/api/webhooks/email/graph/[tenantId]/route.ts:134-336`

- [ ] **Step 1: Add import for Outlook token and fetchGraphMessageMe**

Add to the imports at the top of the file:

```typescript
import { getValidOutlookAccessToken, updateOutlookLastSync } from "@/lib/outlook/oauth";
import { fetchGraphMessageMe } from "@/lib/graph/messages";
```

- [ ] **Step 2: Expand the `pendingFetches` type**

Replace the `pendingFetches` declaration (line ~135-139) with:

```typescript
    const pendingFetches: {
      messageId: string;
      resource: string;
      credentialId?: string;
      outlookOauthTokenId?: string;
    }[] = [];
```

- [ ] **Step 3: Update the fetch queue logic**

Replace the block at lines ~220-226 (where `pendingFetches` is populated) with:

```typescript
      // Queue for async fetch if we have credentials
      if (subscription.credentialId) {
        pendingFetches.push({
          messageId,
          credentialId: subscription.credentialId,
          resource: subscription.resource,
        });
      } else if (subscription.outlookOauthTokenId) {
        pendingFetches.push({
          messageId,
          outlookOauthTokenId: subscription.outlookOauthTokenId,
          resource: subscription.resource,
        });
      }
```

- [ ] **Step 4: Add the delegated-token branch in the `after()` block**

Inside the `after()` callback, the current `for (const item of pendingFetches)` loop fetches emails using app-only credentials. Wrap the existing fetch logic in an `if (item.credentialId)` block and add an `else if (item.outlookOauthTokenId)` block:

After the existing `if` block for `item.credentialId` (which ends around line ~298), add:

```typescript
          } else if (item.outlookOauthTokenId) {
            // Delegated token path — personal Outlook OAuth
            let token: string;
            try {
              token = await getValidOutlookAccessToken(
                item.outlookOauthTokenId,
                tenantId
              );
            } catch (tokenErr) {
              console.warn(
                `[Graph] Outlook token ${item.outlookOauthTokenId} invalid for async fetch:`,
                tokenErr instanceof Error ? tokenErr.message : tokenErr
              );
              continue;
            }

            const fullEmail = await fetchGraphMessageMe(item.messageId, token);
            if (!fullEmail) {
              console.warn(`[Graph] Could not fetch full email (me) for ${item.messageId}`);
              continue;
            }

            await updateEmailByMessageId(tenantId, item.messageId, fullEmail);
            console.log(`[Graph] Fetched full email (me) for message ${item.messageId}`);

            // Update last_sync_at so the catch-up cron knows this account is active
            await updateOutlookLastSync(item.outlookOauthTokenId);

            // Fire outbound webhooks (non-blocking)
            dispatchWebhooks(tenantId, "email.received", item.messageId, {
              sender: fullEmail.from,
              subject: fullEmail.subject || null,
              messageId: item.messageId,
            }).catch(() => {});

            logActivity({
              userId: tenantId,
              eventType: "email.received",
              title: `Email received: "${fullEmail.subject || "(No subject)"}"`,
              description: `From ${fullEmail.from}`,
              entityType: "email",
              entityId: item.messageId,
              metadata: { sender: fullEmail.from, subject: fullEmail.subject },
            });

            // Auto-extract action items and create Kanban cards
            let cardIds: string[] = [];
            try {
              const emailDbId = await getEmailIdByMessageId(tenantId, item.messageId);
              const actionResult = await autoProcessEmailActions(tenantId, {
                sender: fullEmail.from,
                recipients: fullEmail.to,
                subject: fullEmail.subject ?? null,
                bodyPlainText: fullEmail.bodyPlainText ?? null,
                receivedAt: fullEmail.receivedDateTime,
              }, { emailId: emailDbId ?? undefined });
              cardIds = actionResult.cardIds;
            } catch (actionErr) {
              console.error(
                `[Graph] Error auto-processing actions for message ${item.messageId}:`,
                actionErr instanceof Error ? actionErr.message : actionErr
              );
            }

            // Classify email
            const content = buildEmailContent({
              sender: fullEmail.from,
              recipients: fullEmail.to,
              subject: fullEmail.subject ?? null,
              bodyPlainText: fullEmail.bodyPlainText ?? null,
            });
            const idRows = await smartLabelSql`
              SELECT id FROM emails
              WHERE tenant_id = ${tenantId} AND message_id = ${item.messageId}
            `;

            if (idRows[0]) {
              const emailDbId = String(idRows[0].id);

              try {
                await classifyItem("email", emailDbId, tenantId, { content });
              } catch (classifyErr) {
                console.error(
                  `[Graph] Smart label classification failed for message ${item.messageId}:`,
                  classifyErr instanceof Error ? classifyErr.message : classifyErr
                );
              }

              try {
                await classifyItemForPages("email", emailDbId, tenantId, { content, cardIds });
              } catch (pageRuleErr) {
                console.error(
                  `[Graph] Page rule classification failed for message ${item.messageId}:`,
                  pageRuleErr instanceof Error ? pageRuleErr.message : pageRuleErr
                );
              }
            }
```

Note: The `try/catch` wrapping and `continue` pattern matches the existing credentialId path. The downstream processing (webhooks, activity logging, actions, classification) is identical — just the token acquisition and fetch call differ.

- [ ] **Step 5: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add app/api/webhooks/email/graph/[tenantId]/route.ts
git commit -m "feat: add delegated-token branch in Graph webhook handler for Outlook OAuth"
```

---

## Chunk 4: Subscription Renewal Cron

### Task 7: Create the subscription renewal cron

**Files:**
- Create: `app/api/cron/graph-subscription-renewal/route.ts`

- [ ] **Step 1: Write the cron handler**

```typescript
import { NextRequest, NextResponse } from "next/server";
import {
  getExpiringSubscriptions,
  renewSubscription,
  deactivateSubscription,
} from "@/lib/graph/subscriptions";
import {
  getGraphCredentialsByIdUnsafe,
  getGraphAccessTokenFromCreds,
} from "@/lib/graph/credentials";
import {
  getValidOutlookAccessToken,
  deactivateOutlookToken,
} from "@/lib/outlook/oauth";

/**
 * GET /api/cron/graph-subscription-renewal
 * Renew Graph subscriptions expiring within 2 hours.
 * Schedule: every hour (0 * * * *)
 */
export async function GET(request: NextRequest) {
  const cronSecret = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    cronSecret !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const expiring = await getExpiringSubscriptions(twoHoursFromNow);

  let renewed = 0;
  let failed = 0;

  for (const sub of expiring) {
    try {
      // Get the appropriate access token
      let accessToken: string;

      if (sub.credentialId) {
        const creds = await getGraphCredentialsByIdUnsafe(sub.credentialId);
        if (!creds) {
          console.warn(`[Renewal] Credential ${sub.credentialId} not found, deactivating subscription`);
          await deactivateSubscription(sub.subscriptionId);
          failed++;
          continue;
        }
        accessToken = await getGraphAccessTokenFromCreds(creds);
      } else if (sub.outlookOauthTokenId) {
        accessToken = await getValidOutlookAccessToken(
          sub.outlookOauthTokenId,
          sub.tenantId
        );
      } else {
        console.warn(`[Renewal] Subscription ${sub.subscriptionId} has no credential or token, deactivating`);
        await deactivateSubscription(sub.subscriptionId);
        failed++;
        continue;
      }

      // Renew the subscription via Graph API
      const newExpiration = new Date(Date.now() + 4230 * 60 * 1000);
      const res = await fetch(
        `https://graph.microsoft.com/v1.0/subscriptions/${sub.subscriptionId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            expirationDateTime: newExpiration.toISOString(),
          }),
        }
      );

      if (res.ok) {
        await renewSubscription(sub.subscriptionId, newExpiration);
        renewed++;
      } else {
        const errText = await res.text().catch(() => "");
        console.error(
          `[Renewal] Failed to renew ${sub.subscriptionId} (${res.status}): ${errText}`
        );
        await deactivateSubscription(sub.subscriptionId);

        // If this was an Outlook OAuth subscription, deactivate the token
        if (sub.outlookOauthTokenId) {
          await deactivateOutlookToken(sub.outlookOauthTokenId, sub.tenantId);
        }

        failed++;
      }
    } catch (err) {
      console.error(
        `[Renewal] Error processing subscription ${sub.subscriptionId}:`,
        err instanceof Error ? err.message : err
      );
      await deactivateSubscription(sub.subscriptionId);

      if (sub.outlookOauthTokenId) {
        try {
          await deactivateOutlookToken(sub.outlookOauthTokenId, sub.tenantId);
        } catch {
          // Non-fatal
        }
      }

      failed++;
    }
  }

  return NextResponse.json({
    message: "Subscription renewal complete",
    total: expiring.length,
    renewed,
    failed,
  });
}
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add app/api/cron/graph-subscription-renewal/route.ts
git commit -m "feat: add hourly Graph subscription renewal cron"
```

---

## Chunk 5: Catch-up Cron

### Task 8: Create the catch-up sync cron

**Files:**
- Create: `app/api/cron/outlook-catch-up/route.ts`

- [ ] **Step 1: Write the cron handler**

```typescript
import { NextRequest, NextResponse, after } from "next/server";
import sql from "@/lib/outlook/db";
import {
  getValidOutlookAccessToken,
} from "@/lib/outlook/oauth";
import { fetchOutlookInboxMessages } from "@/lib/outlook/messages";
import { insertEmail, emailExists } from "@/lib/email/emails";
import { classifyItem, buildEmailContent } from "@/lib/smartLabels/classify";
import { classifyItemForPages } from "@/lib/pageRules/classify";
import { autoProcessEmailActions } from "@/lib/actions/autoProcessEmailActions";
import { upsertContacts } from "@/lib/contacts/contacts";

interface StaleAccount {
  id: string;
  tenant_id: string;
  outlook_email: string;
  last_sync_at: string | null;
  email_action_board_id: string | null;
}

/**
 * GET /api/cron/outlook-catch-up
 * Sync emails for Outlook accounts that haven't received a webhook
 * notification in the last hour.
 * Schedule: every hour at :30 (30 * * * *)
 */
export async function GET(request: NextRequest) {
  const cronSecret = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    cronSecret !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find active Outlook accounts with no sync in the last hour
  const staleAccounts = await sql`
    SELECT id, tenant_id, outlook_email, last_sync_at, email_action_board_id
    FROM outlook_oauth_tokens
    WHERE active = true
      AND (last_sync_at IS NULL OR last_sync_at < NOW() - INTERVAL '1 hour')
  ` as StaleAccount[];

  let accountsChecked = 0;
  let totalInserted = 0;
  const newEmails: {
    id: string;
    tenantId: string;
    sender: string;
    recipients: string[];
    subject: string | null;
    bodyPlainText: string | null;
    receivedAt: string;
    accountBoardId: string | null;
  }[] = [];

  for (const account of staleAccounts) {
    try {
      const accessToken = await getValidOutlookAccessToken(
        account.id,
        account.tenant_id
      );

      const { messages } = await fetchOutlookInboxMessages(accessToken, {
        top: 50,
        after: account.last_sync_at || undefined,
      });

      for (const msg of messages) {
        const exists = await emailExists(account.tenant_id, msg.messageId);
        if (exists) continue;

        try {
          const row = await insertEmail(msg, account.tenant_id, account.id);
          totalInserted++;
          newEmails.push({
            id: String(row.id),
            tenantId: account.tenant_id,
            sender: msg.from,
            recipients: msg.to,
            subject: msg.subject ?? null,
            bodyPlainText: msg.bodyPlainText ?? null,
            receivedAt: msg.receivedDateTime ?? new Date().toISOString(),
            accountBoardId: account.email_action_board_id,
          });
        } catch (err) {
          if (
            err instanceof Error &&
            err.message.includes("duplicate key value")
          ) {
            continue;
          }
          console.error(
            `[Outlook Catch-up] Error inserting message ${msg.messageId}:`,
            err
          );
        }
      }

      // Update last_sync_at
      await sql`
        UPDATE outlook_oauth_tokens
        SET last_sync_at = NOW(), updated_at = NOW()
        WHERE id = ${account.id} AND active = true
      `;

      accountsChecked++;
    } catch (err) {
      console.error(
        `[Outlook Catch-up] Error syncing account ${account.id}:`,
        err instanceof Error ? err.message : err
      );
    }
  }

  // Classify new emails in background
  if (newEmails.length > 0) {
    after(async () => {
      for (const email of newEmails) {
        const content = buildEmailContent(email);

        try {
          await classifyItem("email", email.id, email.tenantId, { content });
        } catch (err) {
          console.error(`[Outlook Catch-up] Classification failed for ${email.id}:`, err);
        }

        try {
          await classifyItemForPages("email", email.id, email.tenantId, { content });
        } catch (err) {
          console.error(`[Outlook Catch-up] Page rule failed for ${email.id}:`, err);
        }

        try {
          await autoProcessEmailActions(email.tenantId, {
            sender: email.sender,
            recipients: email.recipients,
            subject: email.subject,
            bodyPlainText: email.bodyPlainText,
            receivedAt: email.receivedAt,
          }, { boardId: email.accountBoardId, emailId: parseInt(email.id, 10) });
        } catch (err) {
          console.error(`[Outlook Catch-up] Auto-process failed for ${email.id}:`, err);
        }

        try {
          const addresses = [email.sender, ...email.recipients];
          await upsertContacts(email.tenantId, addresses);
        } catch (err) {
          console.error(`[Outlook Catch-up] Contact extraction failed for ${email.id}:`, err);
        }
      }
    });
  }

  return NextResponse.json({
    message: "Outlook catch-up sync complete",
    staleAccounts: staleAccounts.length,
    accountsChecked,
    emailsInserted: totalInserted,
  });
}
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add app/api/cron/outlook-catch-up/route.ts
git commit -m "feat: add hourly Outlook catch-up sync cron for stale accounts"
```

---

## Chunk 6: Reconnection Banner & Disconnection Cleanup

### Task 9: Add `outlookNeedsReconnection` flag to integrations status

**Files:**
- Modify: `app/api/integrations/status/route.ts:76-82,158-234`

- [ ] **Step 1: Fix the Outlook query to filter by active and add reconnection detection**

Replace the Outlook query (lines 77-82) with two queries — one for active accounts, one for reconnection detection:

```typescript
      // Outlook OAuth tokens (active only)
      safeQuery(() =>
        db
          .select({ outlookEmail: outlookOauthTokens.outlookEmail })
          .from(outlookOauthTokens)
          .where(
            and(
              eq(outlookOauthTokens.tenantId, userId),
              eq(outlookOauthTokens.active, true)
            )
          )
      ),

      // Outlook accounts needing reconnection (deactivated but have refresh token)
      safeQuery(() =>
        db
          .select({ id: outlookOauthTokens.id })
          .from(outlookOauthTokens)
          .where(
            and(
              eq(outlookOauthTokens.tenantId, userId),
              eq(outlookOauthTokens.active, false)
            )
          )
      ),
```

Update the destructuring to include the new query result (must list all 10 variables explicitly — do NOT use `...rest` as it would break all downstream references):

```typescript
    const [
      gmailRows,
      outlookRows,
      outlookReconnectRows,
      graphRows,
      googleCalRows,
      zoomRows,
      telegramRows,
      outboundRows,
      zapierRows,
      krispRows,
    ] = await Promise.all([...]);
```

- [ ] **Step 2: Add the flag to the response**

After building the `status` object (line ~232), before returning, add:

```typescript
    return NextResponse.json({
      ...status,
      outlookNeedsReconnection: outlookReconnectRows.length > 0,
    });
```

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add app/api/integrations/status/route.ts
git commit -m "feat: add outlookNeedsReconnection flag to integrations status"
```

### Task 10: Add reconnection banner to AppShell

**Files:**
- Create: `components/ui/OutlookReconnectBanner.tsx`
- Modify: `components/ui/AppShell.tsx:12,95`

- [ ] **Step 1: Create the banner component**

```typescript
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function OutlookReconnectBanner() {
  const [needsReconnection, setNeedsReconnection] = useState(false);

  useEffect(() => {
    fetch("/api/integrations/status")
      .then((res) => res.json())
      .then((data) => {
        if (data.outlookNeedsReconnection) {
          setNeedsReconnection(true);
        }
      })
      .catch(() => {});
  }, []);

  if (!needsReconnection) return null;

  return (
    <div className="bg-amber-600 text-white text-center text-sm py-1.5 px-4">
      Your Outlook connection needs to be reconnected.{" "}
      <Link
        href="/settings/integrations"
        className="underline hover:text-amber-100"
      >
        Reconnect →
      </Link>
    </div>
  );
}
```

- [ ] **Step 2: Add the banner to AppShell**

In `components/ui/AppShell.tsx`, add the import:

```typescript
import { OutlookReconnectBanner } from "./OutlookReconnectBanner";
```

Add the banner right after `<TrialBanner />` (line 95):

```typescript
      <TrialBanner />
      <OutlookReconnectBanner />
```

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add components/ui/OutlookReconnectBanner.tsx components/ui/AppShell.tsx
git commit -m "feat: add Outlook reconnection banner in AppShell"
```

### Task 11: Add disconnection cleanup for Graph subscriptions

**Files:**
- Modify: `app/api/outlook/oauth/route.ts:69-97` (DELETE handler)

- [ ] **Step 1: Add imports**

Add to the top of the file:

```typescript
import { getActiveSubscriptions, deactivateSubscription } from "@/lib/graph/subscriptions";
import { getValidOutlookAccessToken } from "@/lib/outlook/oauth";
```

Note: `getValidOutlookAccessToken` is already importable from `@/lib/outlook/oauth`; add `getActiveSubscriptions` and `deactivateSubscription` from `@/lib/graph/subscriptions`.

- [ ] **Step 2: Add subscription cleanup before deactivating the token**

In the DELETE handler, before `await deactivateOutlookToken(accountId, userId);` (line 85), add:

```typescript
    // Clean up any Graph subscriptions linked to this Outlook account
    try {
      const subs = await getActiveSubscriptions(userId);
      const outlookSubs = subs.filter(
        (s) => s.outlookOauthTokenId === accountId
      );
      for (const sub of outlookSubs) {
        // Try to delete from Microsoft Graph (non-blocking on failure)
        try {
          const token = await getValidOutlookAccessToken(accountId, userId);
          await fetch(
            `https://graph.microsoft.com/v1.0/subscriptions/${sub.subscriptionId}`,
            {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            }
          );
        } catch {
          // Token may already be invalid — that's fine
        }
        await deactivateSubscription(sub.subscriptionId);
      }
    } catch (err) {
      console.warn("[Outlook OAuth] Error cleaning up subscriptions:", err);
    }

    await deactivateOutlookToken(accountId, userId);
```

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add app/api/outlook/oauth/route.ts
git commit -m "feat: clean up Graph subscriptions on Outlook disconnect"
```

---

## Chunk 7: Cron Configuration & Final Verification

### Task 12: Configure Vercel Cron schedules

**Files:**
- Note: Crons are configured via the Vercel dashboard (no `vercel.json` exists in this repo)

- [ ] **Step 1: Document cron schedules for deployment**

Add a comment at the top of each new cron route file noting the expected schedule. This is already done in the route files above. The schedules to add in the Vercel dashboard are:

- `/api/cron/graph-subscription-renewal` — `0 * * * *` (every hour at :00)
- `/api/cron/outlook-catch-up` — `30 * * * *` (every hour at :30)

Both require the `CRON_SECRET` environment variable to be set in Vercel.

- [ ] **Step 2: Commit** (no file changes needed — this is a deployment configuration step)

### Task 13: End-to-end verification

- [ ] **Step 1: Full TypeScript check**

Run: `npx tsc --noEmit --pretty`
Expected: No errors

- [ ] **Step 2: Verify the dev server starts**

Run: `npx next build 2>&1 | tail -20`
Expected: Build succeeds

- [ ] **Step 3: Commit any remaining fixes**

If any compilation issues found, fix and commit.

- [ ] **Step 4: Update the Outlook integration "How It Works" note**

In `app/(app)/settings/integrations/_components/outlook/OutlookIntegration.tsx`, the settings section (line ~436-440) has a note saying "Pull-based sync: Unlike the Graph API integration which uses push notifications, this integration requires manual or scheduled syncs". Replace with:

```typescript
            <span className="font-medium">Push + pull sync:</span> New emails are
            delivered automatically via Microsoft Graph push notifications. A background
            sync also runs hourly as a safety net. You can still use the &quot;Sync Emails
            Now&quot; button for an immediate pull.
```

- [ ] **Step 5: Final commit**

```bash
git add app/(app)/settings/integrations/_components/outlook/OutlookIntegration.tsx
git commit -m "docs: update Outlook integration description to reflect push notifications"
```
