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
  webhookKeyPoints,
} from "@/lib/db/schema";
import { eq, and, desc, isNull } from "drizzle-orm";

export const dynamic = "force-dynamic";

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

/** Run a query, returning [] if the table doesn't exist or the query fails */
async function safeQuery<T>(fn: () => Promise<T[]>): Promise<T[]> {
  try {
    return await fn();
  } catch {
    return [];
  }
}

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
      outlookReconnectRows,
      graphRows,
      googleCalRows,
      zoomRows,
      telegramRows,
      outboundRows,
      zapierRows,
      krispRows,
    ] = await Promise.all([
      // Gmail: active watch subscriptions
      safeQuery(() =>
        db
          .select({ emailAddress: gmailWatchSubscriptions.emailAddress })
          .from(gmailWatchSubscriptions)
          .where(
            and(
              eq(gmailWatchSubscriptions.tenantId, userId),
              eq(gmailWatchSubscriptions.active, true)
            )
          )
      ),

      // Outlook OAuth tokens (active only)
      safeQuery(() =>
        db
          .select({ outlookEmail: outlookOauthTokens.outlookEmail })
          .from(outlookOauthTokens)
          .where(
            and(
              eq(outlookOauthTokens.tenantId, userId),
              eq(outlookOauthTokens.active, true)
            )
          )
      ),

      // Outlook accounts needing reconnection (deactivated but have refresh token)
      safeQuery(() =>
        db
          .select({ id: outlookOauthTokens.id })
          .from(outlookOauthTokens)
          .where(
            and(
              eq(outlookOauthTokens.tenantId, userId),
              eq(outlookOauthTokens.active, false)
            )
          )
      ),

      // Graph credentials (Azure AD)
      safeQuery(() =>
        db
          .select({ label: graphCredentials.label })
          .from(graphCredentials)
          .where(eq(graphCredentials.tenantId, userId))
      ),

      // Google OAuth tokens (Google Calendar)
      safeQuery(() =>
        db
          .select({ googleEmail: googleOauthTokens.googleEmail })
          .from(googleOauthTokens)
          .where(eq(googleOauthTokens.tenantId, userId))
      ),

      // Zoom OAuth tokens
      safeQuery(() =>
        db
          .select({ id: zoomOauthTokens.id })
          .from(zoomOauthTokens)
          .where(eq(zoomOauthTokens.tenantId, userId))
      ),

      // Telegram bot tokens
      safeQuery(() =>
        db
          .select({ id: telegramBotTokens.id })
          .from(telegramBotTokens)
          .where(eq(telegramBotTokens.userId, userId))
      ),

      // Outbound webhooks (active only)
      safeQuery(() =>
        db
          .select({ id: outboundWebhooks.id })
          .from(outboundWebhooks)
          .where(
            and(
              eq(outboundWebhooks.userId, userId),
              eq(outboundWebhooks.active, true)
            )
          )
      ),

      // Zapier webhook secret
      safeQuery(() =>
        db
          .select({ id: webhookSecrets.id })
          .from(webhookSecrets)
          .where(
            and(
              eq(webhookSecrets.userId, userId),
              eq(webhookSecrets.name, "Zapier")
            )
          )
      ),

      // Krisp: most recent webhook received
      safeQuery(() =>
        db
          .select({ receivedAt: webhookKeyPoints.receivedAt })
          .from(webhookKeyPoints)
          .where(
            and(
              eq(webhookKeyPoints.userId, userId),
              isNull(webhookKeyPoints.deletedAt)
            )
          )
          .orderBy(desc(webhookKeyPoints.receivedAt))
          .limit(1)
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

      krisp: krispRows.length > 0 && krispRows[0].receivedAt
        ? {
            connected: true,
            summary: `Last webhook ${formatTimeAgo(krispRows[0].receivedAt)}`,
          }
        : { connected: false },
    };

    return NextResponse.json({
      ...status,
      outlookNeedsReconnection: outlookReconnectRows.length > 0,
    });
  } catch (error) {
    console.error("Error fetching integration status:", error);
    return NextResponse.json(
      { error: "Failed to fetch integration status" },
      { status: 500 }
    );
  }
}
