import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getEmailDetail } from "@/lib/email/emails";
import { getGmailEmailById } from "@/lib/gmail/emails";
import { db } from "@/lib/db";
import { graphSubscriptions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  getGraphCredentialsByIdUnsafe,
  getGraphAccessTokenFromCreds,
} from "@/lib/graph/credentials";
import {
  extractUserFromResource,
  sendGraphMail,
} from "@/lib/graph/messages";
import { chatCompletion, TokenLimitError } from "@/lib/ai/client";
import { resolvePrompt } from "@/lib/ai/resolvePrompt";
import { PROMPT_EMAIL_FORWARD_DRAFT } from "@/lib/ai/prompts";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ForwardRequestBody {
  recipientEmail?: string;
  message?: string;
  generateDraft?: boolean;
}

type ForwardIntent = "delegation" | "fyi" | "escalation" | "action_request" | "approval" | "context" | "follow_up";

/**
 * POST /api/emails/[id]/forward
 *
 * Forwards an email to an external recipient. Supports:
 * - Sending with a user-written message
 * - Auto-generating a forwarding message via AI
 * - Sending the original email content below the forwarding message
 *
 * Body:
 * - recipientEmail: string (required)
 * - message: string (optional - user-written forwarding message)
 * - generateDraft: boolean (optional - if true, returns AI draft without sending)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body: ForwardRequestBody = await request.json();

    // Validate recipient email (required for sending, optional for draft generation)
    if (!body.generateDraft) {
      if (!body.recipientEmail || !EMAIL_REGEX.test(body.recipientEmail)) {
        return NextResponse.json(
          { error: "A valid recipient email address is required" },
          { status: 400 }
        );
      }
    }

    // Fetch the email (handle both Outlook numeric IDs and Gmail UUIDs)
    let emailData: {
      sender: string;
      subject: string | null;
      body_plain_text: string | null;
      body_html: string | null;
      received_at: string;
      recipients: string[];
      provider: "outlook" | "gmail";
    };

    if (UUID_REGEX.test(id)) {
      // Gmail email
      const gmailEmail = await getGmailEmailById(id, userId);
      if (!gmailEmail) {
        return NextResponse.json({ error: "Email not found" }, { status: 404 });
      }
      emailData = {
        sender: gmailEmail.sender,
        subject: gmailEmail.subject,
        body_plain_text: gmailEmail.body_plain,
        body_html: gmailEmail.body_html,
        received_at: typeof gmailEmail.received_at === "string" ? gmailEmail.received_at : new Date(gmailEmail.received_at).toISOString(),
        recipients: Array.isArray(gmailEmail.recipients) ? gmailEmail.recipients : [],
        provider: "gmail",
      };
    } else {
      const emailId = parseInt(id, 10);
      if (isNaN(emailId) || emailId < 1) {
        return NextResponse.json({ error: "Invalid email ID" }, { status: 400 });
      }
      const email = await getEmailDetail(emailId, userId);
      if (!email) {
        return NextResponse.json({ error: "Email not found" }, { status: 404 });
      }
      emailData = {
        sender: email.sender,
        subject: email.subject,
        body_plain_text: email.body_plain_text,
        body_html: email.body_html,
        received_at: email.received_at,
        recipients: email.recipients,
        provider: "outlook",
      };
    }

    // If generateDraft is true, generate an AI draft and return it
    if (body.generateDraft) {
      // Skip generation if body is empty (attachment-only emails or empty emails)
      const bodyText = emailData.body_plain_text?.trim();
      if (!bodyText || bodyText.length < 10) {
        return NextResponse.json({ draft: "", intent: "fyi" as ForwardIntent });
      }

      try {
        const promptTemplate = await resolvePrompt(PROMPT_EMAIL_FORWARD_DRAFT, userId);

        const emailContext = [
          `ORIGINAL EMAIL:`,
          `From: ${emailData.sender}`,
          `Subject: ${emailData.subject || "(No subject)"}`,
          `Date: ${emailData.received_at}`,
          `Body: ${bodyText.slice(0, 2000)}`,
          ...(body.recipientEmail ? [``, `FORWARDING TO: ${body.recipientEmail}`] : []),
        ].join("\n");

        const fullPrompt = `${promptTemplate}\n\n${emailContext}`;
        const raw = await chatCompletion(fullPrompt, { maxTokens: 300, userId });

        // Parse structured JSON response from AI
        let draft = "";
        let intent: ForwardIntent = "fyi";
        try {
          const parsed = JSON.parse(raw);
          if (parsed.message) draft = parsed.message;
          if (parsed.intent) intent = parsed.intent as ForwardIntent;
        } catch {
          // Fallback: treat entire response as the draft message
          draft = raw;
        }

        return NextResponse.json({ draft, intent });
      } catch (err) {
        if (err instanceof TokenLimitError) {
          return NextResponse.json(
            { error: err.message },
            { status: 402 }
          );
        }
        console.error("Error generating forward draft:", err);
        // Fail silently for auto-generation — return empty draft
        return NextResponse.json({ draft: "", intent: "fyi" as ForwardIntent });
      }
    }

    // Build the forwarded email HTML
    const forwardSubject = `Fwd: ${emailData.subject || "(No subject)"}`;
    const forwardingMessage = body.message || "";
    const originalDate = new Date(emailData.received_at).toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const forwardHtml = buildForwardHtml({
      forwardingMessage,
      originalSender: emailData.sender,
      originalTo: emailData.recipients.join(", "),
      originalDate,
      originalSubject: emailData.subject || "(No subject)",
      originalBody: emailData.body_html || escapeHtml(emailData.body_plain_text || ""),
    });

    // Send via Graph API (works for both Outlook and Gmail-sourced emails)
    const [subscription] = await db
      .select()
      .from(graphSubscriptions)
      .where(
        and(
          eq(graphSubscriptions.tenantId, userId),
          eq(graphSubscriptions.active, true)
        )
      );

    if (!subscription?.credentialId) {
      return NextResponse.json(
        { error: "No active email integration found. Please connect an email account to send messages." },
        { status: 502 }
      );
    }

    const creds = await getGraphCredentialsByIdUnsafe(subscription.credentialId);
    if (!creds) {
      return NextResponse.json(
        { error: "Email integration credentials are missing. Please reconnect your email account." },
        { status: 502 }
      );
    }

    const token = await getGraphAccessTokenFromCreds(creds);
    const userMailbox = extractUserFromResource(subscription.resource);
    if (!userMailbox) {
      return NextResponse.json(
        { error: "Unable to determine sending mailbox. Please reconnect your email account." },
        { status: 502 }
      );
    }

    const sent = await sendGraphMail(userMailbox, token, {
      to: [body.recipientEmail!],
      subject: forwardSubject,
      bodyHtml: forwardHtml,
    });

    if (!sent) {
      return NextResponse.json(
        { error: "Failed to send the forwarded email. Your email account may need additional permissions." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      message: "Email forwarded successfully",
      to: body.recipientEmail,
    });
  } catch (error) {
    console.error("Error forwarding email:", error);
    return NextResponse.json(
      { error: "Failed to forward email" },
      { status: 500 }
    );
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/\n/g, "<br>");
}

function buildForwardHtml(opts: {
  forwardingMessage: string;
  originalSender: string;
  originalTo: string;
  originalDate: string;
  originalSubject: string;
  originalBody: string;
}): string {
  const messageSection = opts.forwardingMessage
    ? `<div style="margin-bottom: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.6; color: #1a1a1a;">${escapeHtml(opts.forwardingMessage)}</div>`
    : "";

  return `${messageSection}
<div style="border-top: 1px solid #ccc; padding-top: 12px; margin-top: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; color: #555;">
  <p style="margin: 0 0 8px 0; font-weight: 600; color: #333;">---------- Forwarded message ----------</p>
  <p style="margin: 2px 0;"><strong>From:</strong> ${escapeHtml(opts.originalSender)}</p>
  <p style="margin: 2px 0;"><strong>Date:</strong> ${escapeHtml(opts.originalDate)}</p>
  <p style="margin: 2px 0;"><strong>Subject:</strong> ${escapeHtml(opts.originalSubject)}</p>
  <p style="margin: 2px 0;"><strong>To:</strong> ${escapeHtml(opts.originalTo)}</p>
</div>
<div style="margin-top: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.6; color: #1a1a1a;">
  ${opts.originalBody}
</div>`;
}
