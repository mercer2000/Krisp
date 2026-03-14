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
