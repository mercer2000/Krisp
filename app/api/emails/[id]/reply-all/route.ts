import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { auth } from "@/lib/auth/server";
import { getEmailDetail } from "@/lib/email/emails";
import { getGmailEmailById } from "@/lib/gmail/emails";
import { getActiveWatch, getValidAccessToken } from "@/lib/gmail/watch";
import { replyAllGmailMessage } from "@/lib/gmail/messages";
import { resolveGraphSendContext } from "@/lib/graph/resolve";
import { replyAllGraphMessage } from "@/lib/graph/messages";
import { markdownToEmailHtml } from "@/lib/email/markdownToHtml";
import { processOutboundReply } from "@/lib/email/postReplyProcessing";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ReplyAllRequest {
  bodyMarkdown: string;
  to?: string[];
  cc?: string[];
  bcc?: string[];
}

/**
 * POST /api/emails/[id]/reply-all
 *
 * Send a reply-all to an email via Microsoft Graph (Outlook) or Gmail API.
 * Converts markdown body to email-safe HTML.
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
    const body: ReplyAllRequest = await request.json();
    if (!body.bodyMarkdown?.trim()) {
      return NextResponse.json({ error: "Reply body is required" }, { status: 400 });
    }

    for (const list of [body.to, body.cc, body.bcc]) {
      if (list?.some((e) => !EMAIL_REGEX.test(e))) {
        return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
      }
    }

    const bodyHtml = markdownToEmailHtml(body.bodyMarkdown);

    // Gmail emails (UUID IDs)
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
      // For reply-all: To = sender, CC = all other recipients (minus sender and self)
      const recipients = Array.isArray(gmailEmail.recipients) ? gmailEmail.recipients : [];
      const allTo = body.to?.length ? body.to : [gmailEmail.sender];
      const allCc = body.cc?.length
        ? body.cc
        : (recipients as string[]).filter(
            (e: string) => e !== gmailEmail.sender && e !== watch.emailAddress
          );

      const sent = await replyAllGmailMessage(
        accessToken,
        gmailEmail.gmail_message_id,
        gmailEmail.thread_id || gmailEmail.gmail_message_id,
        watch.emailAddress,
        {
          bodyHtml,
          to: allTo,
          cc: allCc,
          bcc: body.bcc,
          subject: gmailEmail.subject || "",
        }
      );

      if (!sent) {
        return NextResponse.json(
          { error: "Failed to send reply. Your Gmail account may need additional permissions." },
          { status: 502 }
        );
      }

      return NextResponse.json({ message: "Reply sent to all" });
    }

    // Outlook emails (numeric IDs)
    const emailId = parseInt(id, 10);
    if (isNaN(emailId) || emailId < 1) {
      return NextResponse.json({ error: "Invalid email ID" }, { status: 400 });
    }

    const email = await getEmailDetail(emailId, userId);
    if (!email) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    if (!email.message_id) {
      return NextResponse.json(
        { error: "Cannot reply: email has no Graph message ID" },
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

    const sent = await replyAllGraphMessage(
      graphResult.context.mailbox,
      graphResult.context.token,
      email.message_id,
      {
        bodyHtml,
        to: body.to,
        cc: body.cc,
        bcc: body.bcc,
      }
    );

    if (!sent) {
      return NextResponse.json(
        { error: "Failed to send reply. Your email account may need additional permissions." },
        { status: 502 }
      );
    }

    after(async () => {
      try {
        await processOutboundReply({
          emailId,
          replyBody: body.bodyMarkdown,
          userId,
          messageId: email.message_id,
        });
      } catch (err) {
        console.error("[ReplyKnowledge] Error processing outbound reply:", err);
      }
    });

    return NextResponse.json({ message: "Reply sent to all" });
  } catch (error) {
    console.error("Error sending reply-all:", error);
    return NextResponse.json({ error: "Failed to send reply" }, { status: 500 });
  }
}
