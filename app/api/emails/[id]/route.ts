import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getEmailDetail, deleteEmail } from "@/lib/email/emails";
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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
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
    const session = await auth();
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
