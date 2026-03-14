import { NextRequest, NextResponse, after } from "next/server";
import { auth } from "@/lib/auth/server";
import {
  getValidOutlookAccessToken,
  getOutlookTokensForTenant,
  getOutlookTokenById,
  updateOutlookLastSync,
} from "@/lib/outlook/oauth";
import { fetchOutlookInboxMessages } from "@/lib/outlook/messages";
import { insertEmail, emailExists } from "@/lib/email/emails";
import { classifyItem, buildEmailContent } from "@/lib/smartLabels/classify";
import { classifyItemForPages } from "@/lib/pageRules/classify";
import { autoProcessEmailActions } from "@/lib/actions/autoProcessEmailActions";
import { upsertContacts } from "@/lib/contacts/contacts";
import { logWebhook } from "@/lib/webhooks/log";

/**
 * POST /api/outlook/sync
 * Pull recent emails from the user's Outlook.com inbox using delegated auth.
 * Inserts any new messages that don't already exist.
 *
 * Body: { accountId? }
 *
 * If accountId is provided, syncs only that account.
 * If omitted, syncs all connected Outlook accounts.
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: { accountId?: string };
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    // Determine which accounts to sync
    let accounts: { id: string; outlook_email: string; last_sync_at: string | null; email_action_board_id: string | null }[];
    if (body.accountId) {
      const token = await getOutlookTokenById(body.accountId, userId);
      if (!token) {
        return NextResponse.json(
          { error: "Outlook account not found or inactive." },
          { status: 400 }
        );
      }
      accounts = [{ id: token.id, outlook_email: token.outlook_email, last_sync_at: token.last_sync_at, email_action_board_id: token.email_action_board_id }];
    } else {
      const tokens = await getOutlookTokensForTenant(userId);
      if (tokens.length === 0) {
        return NextResponse.json(
          { error: "Outlook not connected. Please connect your Outlook account first." },
          { status: 400 }
        );
      }
      accounts = tokens.map((t) => ({ id: t.id, outlook_email: t.outlook_email, last_sync_at: t.last_sync_at, email_action_board_id: t.email_action_board_id }));
    }

    let totalInserted = 0;
    let totalSkipped = 0;
    let totalMessages = 0;
    const newEmails: { id: string; sender: string; recipients: string[]; subject: string | null; bodyPlainText: string | null; receivedAt: string; accountBoardId: string | null }[] = [];
    const results: { accountId: string; email: string; total: number; inserted: number; skipped: number; error?: string }[] = [];

    for (const account of accounts) {
      try {
        const accessToken = await getValidOutlookAccessToken(account.id, userId);

        const afterDate = account.last_sync_at || undefined;
        const { messages } = await fetchOutlookInboxMessages(accessToken, {
          top: 50,
          after: afterDate || undefined,
        });

        let inserted = 0;
        let skipped = 0;

        for (const msg of messages) {
          const exists = await emailExists(userId, msg.messageId);
          if (exists) {
            skipped++;
            continue;
          }

          try {
            const row = await insertEmail(msg, userId, account.id);
            inserted++;
            newEmails.push({
              id: String(row.id),
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
              skipped++;
              continue;
            }
            console.error(`[Outlook Sync] Error inserting message ${msg.messageId}:`, err);
          }
        }

        await updateOutlookLastSync(account.id);

        totalInserted += inserted;
        totalSkipped += skipped;
        totalMessages += messages.length;
        results.push({
          accountId: account.id,
          email: account.outlook_email,
          total: messages.length,
          inserted,
          skipped,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Sync failed";
        results.push({
          accountId: account.id,
          email: account.outlook_email,
          total: 0,
          inserted: 0,
          skipped: 0,
          error: message,
        });
      }
    }

    // Auto-classify new emails and extract contacts in background
    if (newEmails.length > 0) {
      after(async () => {
        for (const email of newEmails) {
          const content = buildEmailContent(email);

          // Smart label classification
          try {
            await classifyItem("email", email.id, userId, { content });
          } catch (err) {
            console.error(`[Outlook Sync] Smart label classification failed for ${email.id}:`, err);
          }

          // Page smart rule classification
          try {
            await classifyItemForPages("email", email.id, userId, { content });
          } catch (err) {
            console.error(`[Outlook Sync] Page rule classification failed for ${email.id}:`, err);
          }

          // Auto-create Kanban tickets (per-account board)
          try {
            await autoProcessEmailActions(userId, {
              sender: email.sender,
              recipients: email.recipients,
              subject: email.subject,
              bodyPlainText: email.bodyPlainText,
              receivedAt: email.receivedAt,
            }, { boardId: email.accountBoardId, emailId: parseInt(email.id, 10) });
          } catch (err) {
            console.error(`[Outlook Sync] Auto-process actions failed for ${email.id}:`, err);
          }

          // Extract contacts from sender and recipients
          try {
            const addresses = [email.sender, ...email.recipients];
            await upsertContacts(userId, addresses);
          } catch (err) {
            console.error(`[Outlook Sync] Contact extraction failed for ${email.id}:`, err);
          }
        }
      });
    }

    logWebhook({
      source: "outlook_sync",
      tenantId: userId,
      status: "success",
      method: "POST",
      durationMs: Date.now() - startTime,
      messageCount: totalInserted,
      metadata: { totalMessages, totalSkipped, accountCount: accounts.length },
    });

    return NextResponse.json({
      message: "Sync completed",
      total: totalMessages,
      inserted: totalInserted,
      skipped: totalSkipped,
      results,
    });
  } catch (error) {
    console.error("[Outlook Sync] Error:", error);
    logWebhook({
      source: "outlook_sync",
      status: "error",
      method: "POST",
      durationMs: Date.now() - startTime,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    );
  }
}
