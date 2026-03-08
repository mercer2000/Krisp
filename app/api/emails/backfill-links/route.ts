import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { graphSubscriptions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import sql from "@/lib/email/db";
import {
  getGraphCredentialsByIdUnsafe,
  getGraphAccessTokenFromCreds,
} from "@/lib/graph/credentials";
import { extractUserFromResource } from "@/lib/graph/messages";

/**
 * POST /api/emails/backfill-links
 *
 * Re-fetches webLink from Microsoft Graph for emails that have NULL web_link.
 * Uses the tenant's active Graph subscription to determine credentials and mailbox.
 */
export async function POST() {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find an active Graph subscription for this tenant
    const [subscription] = await db
      .select()
      .from(graphSubscriptions)
      .where(
        and(
          eq(graphSubscriptions.tenantId, userId),
          eq(graphSubscriptions.active, true)
        )
      );

    if (!subscription || !subscription.credentialId) {
      return NextResponse.json(
        { error: "No active Graph subscription found" },
        { status: 404 }
      );
    }

    const creds = await getGraphCredentialsByIdUnsafe(subscription.credentialId);
    if (!creds) {
      return NextResponse.json(
        { error: "Graph credentials not found" },
        { status: 404 }
      );
    }

    const token = await getGraphAccessTokenFromCreds(creds);
    const userMailbox = extractUserFromResource(subscription.resource);
    if (!userMailbox) {
      return NextResponse.json(
        { error: "Could not determine mailbox from subscription" },
        { status: 500 }
      );
    }

    // Find emails with NULL web_link
    const emails = await sql`
      SELECT id, message_id
      FROM emails
      WHERE tenant_id = ${userId} AND web_link IS NULL
      LIMIT 100
    `;

    let updated = 0;
    for (const email of emails) {
      try {
        const url = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(userMailbox)}/messages/${encodeURIComponent(email.message_id)}?$select=webLink`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) continue;

        const msg = await res.json();
        if (msg.webLink) {
          await sql`
            UPDATE emails SET web_link = ${msg.webLink}, updated_at = NOW()
            WHERE id = ${email.id}
          `;
          updated++;
        }
      } catch {
        // Skip individual failures
      }
    }

    return NextResponse.json({
      message: `Backfilled ${updated} of ${emails.length} emails`,
      total: emails.length,
      updated,
    });
  } catch (error) {
    console.error("Error backfilling web links:", error);
    return NextResponse.json(
      { error: "Failed to backfill web links" },
      { status: 500 }
    );
  }
}
