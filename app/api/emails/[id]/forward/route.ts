import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { getEmailDetail } from "@/lib/email/emails";
import { getGmailEmailById } from "@/lib/gmail/emails";
import { getActiveWatch, getValidAccessToken } from "@/lib/gmail/watch";
import { forwardGmailMessage } from "@/lib/gmail/messages";
import { resolveGraphSendContext } from "@/lib/graph/resolve";
import { forwardGraphMessage } from "@/lib/graph/messages";
import { markdownToEmailHtml } from "@/lib/email/markdownToHtml";
import { chatCompletion, TokenLimitError } from "@/lib/ai/client";
import { resolvePrompt } from "@/lib/ai/resolvePrompt";
import { PROMPT_EMAIL_FORWARD_DRAFT } from "@/lib/ai/prompts";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ForwardRequestBody {
  bodyMarkdown?: string;
  to?: string[];
  cc?: string[];
  bcc?: string[];
  /** @deprecated Use reply-draft endpoint instead. Kept for backward compat. */
  generateDraft?: boolean;
  /** @deprecated */
  recipientEmail?: string;
  /** @deprecated */
  message?: string;
}

type ForwardIntent = "delegation" | "fyi" | "escalation" | "action_request" | "approval" | "context" | "follow_up";

/**
 * POST /api/emails/[id]/forward
 *
 * Forward an email via Microsoft Graph's native forward endpoint.
 * Supports markdown body (converted to HTML) with proper threading.
 *
 * Also supports legacy format (recipientEmail + message) for backward compatibility.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body: ForwardRequestBody = await request.json();

    // Legacy: generateDraft support (redirect to reply-draft in future)
    if (body.generateDraft) {
      return handleLegacyDraftGeneration(id, userId, body);
    }

    // Resolve recipients — support both new (to[]) and legacy (recipientEmail) format
    const toRecipients = body.to?.length
      ? body.to
      : body.recipientEmail
        ? [body.recipientEmail]
        : [];

    if (!toRecipients.length || toRecipients.some((e) => !EMAIL_REGEX.test(e))) {
      return NextResponse.json(
        { error: "At least one valid recipient email is required" },
        { status: 400 }
      );
    }

    for (const list of [body.cc, body.bcc]) {
      if (list?.some((e) => !EMAIL_REGEX.test(e))) {
        return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
      }
    }

    // Fetch email — support both Outlook (numeric) and Gmail (UUID)
    if (UUID_REGEX.test(id)) {
      const gmailEmail = await getGmailEmailById(id, userId);
      if (!gmailEmail) {
        return NextResponse.json({ error: "Email not found" }, { status: 404 });
      }

      const watch = await getActiveWatch(userId);
      if (!watch) {
        return NextResponse.json(
          { error: "Gmail not connected. Please reconnect your Gmail account." },
          { status: 502 }
        );
      }

      const accessToken = await getValidAccessToken(watch);
      const markdown = body.bodyMarkdown || body.message || "";
      const fwdBodyHtml = markdown ? markdownToEmailHtml(markdown) : "";

      const sent = await forwardGmailMessage(
        accessToken,
        gmailEmail.gmail_message_id,
        watch.emailAddress,
        {
          bodyHtml: fwdBodyHtml,
          to: toRecipients,
          cc: body.cc,
          bcc: body.bcc,
          subject: gmailEmail.subject || "",
          originalBody: gmailEmail.body_html || gmailEmail.body_plain || "",
          originalSender: gmailEmail.sender,
          originalDate: gmailEmail.received_at
            ? new Date(gmailEmail.received_at).toLocaleString()
            : "",
        }
      );

      if (!sent) {
        return NextResponse.json(
          { error: "Failed to forward email. Your Gmail account may need additional permissions." },
          { status: 502 }
        );
      }

      return NextResponse.json({ message: "Email forwarded successfully", to: toRecipients });
    }

    const emailId = parseInt(id, 10);
    if (isNaN(emailId) || emailId < 1) {
      return NextResponse.json({ error: "Invalid email ID" }, { status: 400 });
    }

    const email = await getEmailDetail(emailId, userId);
    if (!email) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    const messageId = email.message_id;

    if (!messageId) {
      return NextResponse.json(
        { error: "Cannot forward: email has no Graph message ID" },
        { status: 400 }
      );
    }

    const graphResult = await resolveGraphSendContext(userId);
    if ("error" in graphResult) {
      return NextResponse.json(
        { error: graphResult.error },
        { status: graphResult.status }
      );
    }

    // Build HTML body from markdown or legacy plain text
    const markdown = body.bodyMarkdown || body.message || "";
    const bodyHtml = markdown
      ? markdownToEmailHtml(markdown)
      : "";

    const sent = await forwardGraphMessage(
      graphResult.context.mailbox,
      graphResult.context.token,
      messageId,
      {
        bodyHtml,
        to: toRecipients,
        cc: body.cc,
        bcc: body.bcc,
      }
    );

    if (!sent) {
      return NextResponse.json(
        { error: "Failed to forward email. Your email account may need additional permissions." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      message: "Email forwarded successfully",
      to: toRecipients,
    });
  } catch (error) {
    console.error("Error forwarding email:", error);
    return NextResponse.json(
      { error: "Failed to forward email" },
      { status: 500 }
    );
  }
}

/**
 * Legacy draft generation handler.
 * Kept for backward compatibility with the old forward modal.
 */
async function handleLegacyDraftGeneration(
  id: string,
  userId: string,
  body: ForwardRequestBody
) {
  const emailId = parseInt(id, 10);
  if (isNaN(emailId) || emailId < 1) {
    return NextResponse.json({ error: "Invalid email ID" }, { status: 400 });
  }

  const email = await getEmailDetail(emailId, userId);
  if (!email) {
    return NextResponse.json({ error: "Email not found" }, { status: 404 });
  }

  const bodyText = email.body_plain_text?.trim();
  if (!bodyText || bodyText.length < 10) {
    return NextResponse.json({ draft: "", intent: "fyi" as ForwardIntent });
  }

  try {
    const promptTemplate = await resolvePrompt(PROMPT_EMAIL_FORWARD_DRAFT, userId);
    const emailContext = [
      `ORIGINAL EMAIL:`,
      `From: ${email.sender}`,
      `Subject: ${email.subject || "(No subject)"}`,
      `Date: ${email.received_at}`,
      `Body: ${bodyText.slice(0, 2000)}`,
      ...(body.recipientEmail ? [``, `FORWARDING TO: ${body.recipientEmail}`] : []),
    ].join("\n");

    const fullPrompt = `${promptTemplate}\n\n${emailContext}`;
    const raw = await chatCompletion(fullPrompt, {
      maxTokens: 300,
      userId,
      triggerType: "email_forward_draft",
      promptKey: PROMPT_EMAIL_FORWARD_DRAFT,
      entityType: "email",
      entityId: id,
    });

    let draft = "";
    let intent: ForwardIntent = "fyi";
    try {
      const parsed = JSON.parse(raw);
      if (parsed.message) draft = parsed.message;
      if (parsed.intent) intent = parsed.intent as ForwardIntent;
    } catch {
      draft = raw;
    }

    return NextResponse.json({ draft, intent });
  } catch (err) {
    if (err instanceof TokenLimitError) {
      return NextResponse.json({ error: (err as Error).message }, { status: 402 });
    }
    console.error("Error generating forward draft:", err);
    return NextResponse.json({ draft: "", intent: "fyi" as ForwardIntent });
  }
}
