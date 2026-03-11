import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { getEmailDetail, deleteEmail, markEmailRead, markEmailDone } from "@/lib/email/emails";
import { getGmailEmailById, markGmailEmailRead, markGmailEmailDone } from "@/lib/gmail/emails";
import { getZoomMessageById } from "@/lib/zoom/messages";
import { db } from "@/lib/db";
import { graphSubscriptions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  getGraphCredentialsByIdUnsafe,
  getGraphAccessTokenFromCreds,
} from "@/lib/graph/credentials";
import {
  extractUserFromResource,
  deleteGraphMessage,
} from "@/lib/graph/messages";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // UUID IDs are Gmail emails or Zoom chat messages
    if (UUID_REGEX.test(id)) {
      // Try Gmail first
      const gmailEmail = await getGmailEmailById(id, userId);
      if (gmailEmail) {
        return NextResponse.json({
          id: gmailEmail.id,
          tenant_id: gmailEmail.tenant_id,
          message_id: gmailEmail.gmail_message_id,
          sender: gmailEmail.sender,
          recipients: Array.isArray(gmailEmail.recipients) ? gmailEmail.recipients : [],
          cc: [],
          bcc: [],
          subject: gmailEmail.subject,
          body_plain_text: gmailEmail.body_plain,
          body_html: gmailEmail.body_html,
          received_at: gmailEmail.received_at,
          attachments_metadata: Array.isArray(gmailEmail.attachments) ? gmailEmail.attachments : [],
          web_link: null,
          created_at: gmailEmail.ingested_at,
          updated_at: gmailEmail.updated_at,
          provider: "gmail",
        });
      }

      // Try Zoom
      const msg = await getZoomMessageById(id, userId);
      if (msg) {
        return NextResponse.json({
          id: msg.id,
          tenant_id: msg.tenant_id,
          message_id: msg.message_id,
          sender: msg.sender_name || msg.sender_id,
          recipients: [],
          cc: [],
          bcc: [],
          subject: msg.channel_type === "channel" ? (msg.channel_id ?? "Zoom Channel") : "Direct Message",
          body_plain_text: msg.message_content,
          body_html: null,
          received_at: msg.message_timestamp,
          attachments_metadata: [],
          web_link: null,
          created_at: msg.created_at,
          updated_at: msg.updated_at,
          provider: "zoom",
        });
      }

      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    const emailId = parseInt(id, 10);
    if (isNaN(emailId) || emailId < 1) {
      return NextResponse.json({ error: "Invalid email ID" }, { status: 400 });
    }

    const email = await getEmailDetail(emailId, userId);
    if (!email) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    return NextResponse.json(email);
  } catch (error) {
    console.error("Error fetching email:", error);
    return NextResponse.json(
      { error: "Failed to fetch email" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
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

    // Verify the email exists and belongs to the user
    const email = await getEmailDetail(emailId, userId);
    if (!email) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    // Resolve Graph credentials to delete from mailbox
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
      console.warn("[Delete] No active Graph subscription found for tenant", userId);
      return NextResponse.json(
        { error: "No active Graph subscription — cannot delete from mailbox" },
        { status: 502 }
      );
    }

    const creds = await getGraphCredentialsByIdUnsafe(subscription.credentialId);
    if (!creds) {
      console.warn("[Delete] Graph credentials not found for", subscription.credentialId);
      return NextResponse.json(
        { error: "Graph credentials not found" },
        { status: 502 }
      );
    }

    const token = await getGraphAccessTokenFromCreds(creds);
    const userMailbox = extractUserFromResource(subscription.resource);
    if (!userMailbox) {
      console.warn("[Delete] Could not extract mailbox from resource:", subscription.resource);
      return NextResponse.json(
        { error: "Could not determine mailbox from subscription" },
        { status: 502 }
      );
    }

    const graphDeleted = await deleteGraphMessage(userMailbox, email.message_id, token);
    if (!graphDeleted) {
      return NextResponse.json(
        { error: "Failed to delete email from Outlook — check app permissions (Mail.ReadWrite required)" },
        { status: 502 }
      );
    }

    // Delete from local database
    await deleteEmail(emailId, userId);

    return NextResponse.json({ message: "Email deleted" });
  } catch (error) {
    console.error("Error deleting email:", error);
    return NextResponse.json(
      { error: "Failed to delete email" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const body = await request.json();
    const { is_read, is_done } = body;

    if (typeof is_read !== "boolean" && typeof is_done !== "boolean") {
      return NextResponse.json({ error: "is_read or is_done must be a boolean" }, { status: 400 });
    }

    const result: Record<string, unknown> = {};

    // UUID IDs are Gmail emails
    if (UUID_REGEX.test(id)) {
      if (typeof is_done === "boolean") {
        const updated = await markGmailEmailDone(id, userId, is_done);
        if (!updated) return NextResponse.json({ error: "Email not found" }, { status: 404 });
        result.is_done = is_done;
        if (is_done) result.is_read = true;
      }
      if (typeof is_read === "boolean" && !result.is_read) {
        const updated = await markGmailEmailRead(id, userId, is_read);
        if (!updated) return NextResponse.json({ error: "Email not found" }, { status: 404 });
        result.is_read = is_read;
      }
      return NextResponse.json({ id, ...result });
    }

    // Numeric IDs are Outlook emails
    const emailId = parseInt(id, 10);
    if (isNaN(emailId) || emailId < 1) {
      return NextResponse.json({ error: "Invalid email ID" }, { status: 400 });
    }

    if (typeof is_done === "boolean") {
      const updated = await markEmailDone(emailId, userId, is_done);
      if (!updated) return NextResponse.json({ error: "Email not found" }, { status: 404 });
      result.is_done = is_done;
      if (is_done) result.is_read = true;
    }
    if (typeof is_read === "boolean" && !result.is_read) {
      const updated = await markEmailRead(emailId, userId, is_read);
      if (!updated) return NextResponse.json({ error: "Email not found" }, { status: 404 });
      result.is_read = is_read;
    }

    return NextResponse.json({ id: emailId, ...result });
  } catch (error) {
    console.error("Error updating email:", error);
    return NextResponse.json(
      { error: "Failed to update email" },
      { status: 500 }
    );
  }
}
