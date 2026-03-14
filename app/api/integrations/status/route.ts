import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import {
  gmailWatchSubscriptions,
  outlookOauthTokens,
  graphCredentials,
  googleOauthTokens,
  zoomOauthTokens,
  telegramBotTokens,
  outboundWebhooks,
  webhookSecrets,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * GET /api/integrations/status
 * Returns a status map of all integrations for the current user.
 */
export async function GET() {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [
      gmailRows,
      outlookRows,
      graphRows,
      googleCalRows,
      zoomRows,
      telegramRows,
      outboundRows,
      zapierRows,
    ] = await Promise.all([
      // Gmail: active watch subscriptions
      db
        .select({
          emailAddress: gmailWatchSubscriptions.emailAddress,
        })
        .from(gmailWatchSubscriptions)
        .where(
          and(
            eq(gmailWatchSubscriptions.tenantId, userId),
            eq(gmailWatchSubscriptions.active, true)
          )
        ),

      // Outlook OAuth tokens
      db
        .select({
          outlookEmail: outlookOauthTokens.outlookEmail,
        })
        .from(outlookOauthTokens)
        .where(eq(outlookOauthTokens.tenantId, userId)),

      // Graph credentials (Azure AD)
      db
        .select({
          label: graphCredentials.label,
        })
        .from(graphCredentials)
        .where(eq(graphCredentials.tenantId, userId)),

      // Google OAuth tokens (Google Calendar)
      db
        .select({
          googleEmail: googleOauthTokens.googleEmail,
        })
        .from(googleOauthTokens)
        .where(eq(googleOauthTokens.tenantId, userId)),

      // Zoom OAuth tokens
      db
        .select({
          id: zoomOauthTokens.id,
        })
        .from(zoomOauthTokens)
        .where(eq(zoomOauthTokens.tenantId, userId)),

      // Telegram bot tokens
      db
        .select({
          id: telegramBotTokens.id,
        })
        .from(telegramBotTokens)
        .where(eq(telegramBotTokens.userId, userId)),

      // Outbound webhooks (active only)
      db
        .select({
          id: outboundWebhooks.id,
        })
        .from(outboundWebhooks)
        .where(
          and(
            eq(outboundWebhooks.userId, userId),
            eq(outboundWebhooks.active, true)
          )
        ),

      // Zapier webhook secret
      db
        .select({
          id: webhookSecrets.id,
        })
        .from(webhookSecrets)
        .where(
          and(
            eq(webhookSecrets.userId, userId),
            eq(webhookSecrets.name, "Zapier")
          )
        ),
    ]);

    const status: Record<
      string,
      { connected: boolean; summary?: string }
    > = {
      gmail: gmailRows.length > 0
        ? {
            connected: true,
            summary:
              gmailRows.length === 1
                ? gmailRows[0].emailAddress
                : `${gmailRows.length} accounts`,
          }
        : { connected: false },

      outlook: outlookRows.length > 0
        ? {
            connected: true,
            summary:
              outlookRows.length === 1
                ? outlookRows[0].outlookEmail
                : `${outlookRows.length} accounts`,
          }
        : { connected: false },

      graph: graphRows.length > 0
        ? {
            connected: true,
            summary:
              graphRows.length === 1
                ? graphRows[0].label
                : `${graphRows.length} credentials`,
          }
        : { connected: false },

      microsoft365: { connected: false },

      "google-calendar": googleCalRows.length > 0
        ? {
            connected: true,
            summary:
              googleCalRows.length === 1
                ? googleCalRows[0].googleEmail
                : `${googleCalRows.length} accounts`,
          }
        : { connected: false },

      zoom: zoomRows.length > 0
        ? { connected: true, summary: "Connected" }
        : { connected: false },

      telegram: telegramRows.length > 0
        ? { connected: true, summary: "Bot configured" }
        : { connected: false },

      zapier: zapierRows.length > 0
        ? { connected: true, summary: "Secret active" }
        : { connected: false },

      "outbound-webhooks": outboundRows.length > 0
        ? {
            connected: true,
            summary:
              outboundRows.length === 1
                ? "1 webhook"
                : `${outboundRows.length} webhooks`,
          }
        : { connected: false },
    };

    return NextResponse.json(status);
  } catch (error) {
    console.error("Error fetching integration status:", error);
    return NextResponse.json(
      { error: "Failed to fetch integration status" },
      { status: 500 }
    );
  }
}
