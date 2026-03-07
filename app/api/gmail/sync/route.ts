import { NextRequest, NextResponse, after } from "next/server";
import { auth } from "@/auth";
import {
  getActiveWatch,
  getValidAccessToken,
  fetchGmailMessage,
  extractBodies,
  extractAttachments,
  getHeader,
} from "@/lib/gmail/watch";
import { insertGmailEmail, gmailEmailExists } from "@/lib/gmail/emails";
import { classifyItem, buildEmailContent } from "@/lib/smartLabels/classify";
import { upsertContacts } from "@/lib/contacts/contacts";

const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";

/**
 * POST /api/gmail/sync
 * Pull recent emails from the user's Gmail inbox using the Gmail API.
 * Inserts any new messages that don't already exist in the database.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const watch = await getActiveWatch(userId);
    if (!watch) {
      return NextResponse.json(
        { error: "Gmail not connected. Please connect your Gmail account first." },
        { status: 400 }
      );
    }

    let body: { maxResults?: number } = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const maxResults = Math.min(body.maxResults ?? 50, 100);
    const accessToken = await getValidAccessToken(watch);

    // List recent messages from inbox
    const listUrl = new URL(`${GMAIL_API_BASE}/messages`);
    listUrl.searchParams.set("maxResults", String(maxResults));
    listUrl.searchParams.set("labelIds", "INBOX");

    const listRes = await fetch(listUrl.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!listRes.ok) {
      const err = await listRes.text();
      return NextResponse.json(
        { error: `Gmail API error: ${err}` },
        { status: listRes.status }
      );
    }

    const listData = await listRes.json();
    const messageStubs: Array<{ id: string; threadId: string }> =
      listData.messages ?? [];

    if (messageStubs.length === 0) {
      return NextResponse.json({
        message: "No messages found",
        total: 0,
        inserted: 0,
        skipped: 0,
      });
    }

    let inserted = 0;
    let skipped = 0;
    const newEmails: { id: string; sender: string; recipients: string[]; subject: string | null; bodyPlainText: string | null }[] = [];

    for (const stub of messageStubs) {
      // Check if already exists
      const exists = await gmailEmailExists(userId, stub.id);
      if (exists) {
        skipped++;
        continue;
      }

      try {
        const message = await fetchGmailMessage(accessToken, stub.id);
        const { bodyPlain, bodyHtml } = extractBodies(message);
        const attachments = extractAttachments(message);

        const parseRecipients = (header: string | undefined) =>
          header
            ? header
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : [];

        const recipients = {
          to: parseRecipients(getHeader(message, "To")),
          cc: parseRecipients(getHeader(message, "Cc")),
          bcc: parseRecipients(getHeader(message, "Bcc")),
        };

        const sender = getHeader(message, "From") ?? "(unknown)";
        const subject = getHeader(message, "Subject") ?? null;

        const row = await insertGmailEmail({
          tenant_id: userId,
          gmail_message_id: message.id,
          thread_id: message.threadId,
          sender,
          recipients,
          subject,
          body_plain: bodyPlain,
          body_html: bodyHtml,
          received_at: new Date(parseInt(message.internalDate, 10)),
          attachments,
          labels: message.labelIds ?? [],
          raw_payload: null,
        });

        if (row) {
          inserted++;
          newEmails.push({
            id: String(row.id),
            sender,
            recipients: [...(recipients.to || []), ...(recipients.cc || [])],
            subject,
            bodyPlainText: bodyPlain ?? null,
          });
        }
      } catch (err) {
        console.error(`[Gmail Sync] Failed to fetch/insert message ${stub.id}:`, err);
      }
    }

    // Auto-classify new emails and extract contacts in background
    if (newEmails.length > 0) {
      after(async () => {
        for (const email of newEmails) {
          try {
            const content = buildEmailContent(email);
            await classifyItem("gmail_email", email.id, userId, { content });
          } catch (err) {
            console.error(`[Gmail Sync] Smart label classification failed for ${email.id}:`, err);
          }

          // Extract contacts from sender and recipients
          try {
            const addresses = [email.sender, ...email.recipients];
            await upsertContacts(userId, addresses);
          } catch (err) {
            console.error(`[Gmail Sync] Contact extraction failed for ${email.id}:`, err);
          }
        }
      });
    }

    return NextResponse.json({
      message: "Gmail sync completed",
      total: messageStubs.length,
      inserted,
      skipped,
    });
  } catch (error) {
    console.error("[Gmail Sync] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    );
  }
}
