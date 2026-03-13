import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { getEmailDetail, deleteEmail, markEmailRead, markEmailDone } from "@/lib/email/emails";
import { getGmailEmailById, markGmailEmailRead, markGmailEmailDone, deleteGmailEmail } from "@/lib/gmail/emails";
import { getActiveWatch, getValidAccessToken } from "@/lib/gmail/watch";
import { getZoomMessageById } from "@/lib/zoom/messages";
import { db } from "@/lib/db";
import { graphSubscriptions, graphCredentials, calendarSyncState } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import {
  getGraphCredentialsByIdUnsafe,
  getGraphAccessTokenFromCreds,
} from "@/lib/graph/credentials";
import {
  extractUserFromResource,
  deleteGraphMessage,
  deleteGraphMessageMe,
} from "@/lib/graph/messages";
import {
  getOutlookTokensForTenant,
  getValidOutlookAccessToken,
} from "@/lib/outlook/oauth";

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

    // UUID IDs are Gmail emails
    if (UUID_REGEX.test(id)) {
      const gmailEmail = await getGmailEmailById(id, userId);
      if (!gmailEmail) {
        return NextResponse.json({ error: "Email not found" }, { status: 404 });
      }

      // Trash the message in Gmail via the API
      const watch = await getActiveWatch(userId);
      if (watch) {
        try {
          const accessToken = await getValidAccessToken(watch);
          const trashRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${gmailEmail.gmail_message_id}/trash`,
            { method: "POST", headers: { Authorization: `Bearer ${accessToken}` } }
          );
          if (!trashRes.ok) {
            const err = await trashRes.text();
            console.warn("[Delete Gmail] Trash API failed:", err);
            return NextResponse.json(
              { error: "Failed to trash email in Gmail — check app permissions" },
              { status: 502 }
            );
          }
        } catch (err) {
          console.warn("[Delete Gmail] Token/API error:", err);
          return NextResponse.json(
            { error: "Failed to trash email in Gmail" },
            { status: 502 }
          );
        }
      }

      // Delete from local database
      await deleteGmailEmail(id, userId);
      return NextResponse.json({ message: "Email deleted" });
    }

    const emailId = parseInt(id, 10);
    if (isNaN(emailId) || emailId < 1) {
      return NextResponse.json({ error: "Invalid email ID" }, { status: 400 });
    }

    // Verify the email exists and belongs to the user
    const email = await getEmailDetail(emailId, userId);
    if (!email) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    // Resolve an access token and mailbox to delete via Microsoft Graph.
    // Two auth paths: Outlook OAuth (personal) or Graph credentials (enterprise).
    let token: string | null = null;
    let userMailbox: string | null = null;

    // 1. Try Outlook OAuth (personal Microsoft accounts)
    const outlookAccounts = await getOutlookTokensForTenant(userId);
    if (outlookAccounts.length > 0) {
      const account = outlookAccounts[0];
      try {
        token = await getValidOutlookAccessToken(account.id, userId);
        userMailbox = account.outlook_email;
      } catch (err) {
        console.warn("[Delete] Outlook OAuth token refresh failed:", err);
      }
    }

    // 2. Fall back to Graph credentials (enterprise Azure AD)
    if (!token) {
      let credentialId: string | null = null;

      // Try active subscription first
      const [activeSub] = await db
        .select()
        .from(graphSubscriptions)
        .where(
          and(
            eq(graphSubscriptions.tenantId, userId),
            eq(graphSubscriptions.active, true)
          )
        );

      if (activeSub?.credentialId) {
        credentialId = activeSub.credentialId;
        userMailbox = extractUserFromResource(activeSub.resource);
      }

      // Fall back to any subscription
      if (!credentialId) {
        const [anySub] = await db
          .select()
          .from(graphSubscriptions)
          .where(eq(graphSubscriptions.tenantId, userId))
          .orderBy(desc(graphSubscriptions.createdAt))
          .limit(1);

        if (anySub?.credentialId) {
          credentialId = anySub.credentialId;
          userMailbox = extractUserFromResource(anySub.resource);
        }
      }

      // Fall back to direct credential lookup
      if (!credentialId) {
        const [cred] = await db
          .select({ id: graphCredentials.id })
          .from(graphCredentials)
          .where(eq(graphCredentials.tenantId, userId))
          .orderBy(desc(graphCredentials.createdAt))
          .limit(1);

        if (cred) credentialId = cred.id;
      }

      if (credentialId) {
        const creds = await getGraphCredentialsByIdUnsafe(credentialId);
        if (creds) {
          token = await getGraphAccessTokenFromCreds(creds);

          // Resolve mailbox if not found from subscription
          if (!userMailbox) {
            const [syncState] = await db
              .select({ mailbox: calendarSyncState.mailbox })
              .from(calendarSyncState)
              .where(eq(calendarSyncState.tenantId, userId))
              .limit(1);

            if (syncState?.mailbox) {
              userMailbox = syncState.mailbox;
            }
          }
        }
      }
    }

    // Last resort for mailbox: use email recipients
    if (token && !userMailbox && email.recipients?.length) {
      userMailbox = email.recipients[0];
    }

    if (!token || !userMailbox) {
      console.warn("[Delete] No credentials or mailbox found for tenant", userId);
      return NextResponse.json(
        { error: "No Outlook credentials found — cannot delete from mailbox" },
        { status: 502 }
      );
    }

    // Outlook OAuth uses delegated /me/ endpoint; Graph credentials use /users/{mailbox}/
    const isDelegated = outlookAccounts.length > 0;
    const graphDeleted = isDelegated
      ? await deleteGraphMessageMe(email.message_id, token)
      : await deleteGraphMessage(userMailbox, email.message_id, token);
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
