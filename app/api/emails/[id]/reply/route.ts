import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { getEmailDetail } from "@/lib/email/emails";
import { resolveGraphSendContext } from "@/lib/graph/resolve";
import { replyGraphMessage } from "@/lib/graph/messages";
import { markdownToEmailHtml } from "@/lib/email/markdownToHtml";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ReplyRequest {
  bodyMarkdown: string;
  to?: string[];
  cc?: string[];
  bcc?: string[];
}

/**
 * POST /api/emails/[id]/reply
 *
 * Send a reply to an Outlook email via Microsoft Graph.
 * Converts markdown body to email-safe HTML.
 * Uses Graph's native reply endpoint for proper threading.
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
    const emailId = parseInt(id, 10);
    if (isNaN(emailId) || emailId < 1) {
      return NextResponse.json({ error: "Invalid email ID" }, { status: 400 });
    }

    const body: ReplyRequest = await request.json();
    if (!body.bodyMarkdown?.trim()) {
      return NextResponse.json({ error: "Reply body is required" }, { status: 400 });
    }

    // Validate email addresses if provided
    for (const list of [body.to, body.cc, body.bcc]) {
      if (list?.some((e) => !EMAIL_REGEX.test(e))) {
        return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
      }
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

    const bodyHtml = markdownToEmailHtml(body.bodyMarkdown);
    const sent = await replyGraphMessage(
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

    return NextResponse.json({ message: "Reply sent" });
  } catch (error) {
    console.error("Error sending reply:", error);
    return NextResponse.json({ error: "Failed to send reply" }, { status: 500 });
  }
}
