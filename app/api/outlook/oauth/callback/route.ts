import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import {
  exchangeOutlookCode,
  upsertOutlookTokens,
} from "@/lib/outlook/oauth";
import { fetchOutlookUserEmail } from "@/lib/outlook/messages";
import { createGraphSubscription } from "@/lib/graph/subscriptions";
import { randomUUID } from "crypto";

/**
 * GET /api/outlook/oauth/callback
 * Handles the Microsoft OAuth redirect after user authorizes the app.
 * Exchanges the authorization code for tokens and stores them.
 */
export async function GET(request: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.redirect(new URL("/auth/sign-in", request.url));
    }

    const code = request.nextUrl.searchParams.get("code");
    const error = request.nextUrl.searchParams.get("error");
    const errorDescription = request.nextUrl.searchParams.get("error_description");

    if (error) {
      console.error(`[Outlook OAuth] Auth error: ${error} - ${errorDescription}`);
      return NextResponse.redirect(
        new URL(
          `/settings/integrations/outlook?error=${encodeURIComponent(errorDescription || error)}`,
          request.url
        )
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL(
          "/settings/integrations/outlook?error=missing_code",
          request.url
        )
      );
    }

    // Validate state parameter: must be "{userId}:{uuid}" format
    const state = request.nextUrl.searchParams.get("state") || "";
    const [stateUserId, stateNonce] = state.split(":");
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (stateUserId !== userId || !stateNonce || !uuidRegex.test(stateNonce)) {
      return NextResponse.redirect(
        new URL(
          "/settings/integrations/outlook?error=invalid_state",
          request.url
        )
      );
    }

    const origin = request.nextUrl.origin;
    const redirectUri = `${origin}/api/outlook/oauth/callback`;

    const tokenResponse = await exchangeOutlookCode(code, redirectUri);

    // Fetch the user's email address using the new token
    let outlookEmail: string;
    try {
      outlookEmail = await fetchOutlookUserEmail(tokenResponse.access_token);
      if (!outlookEmail || !outlookEmail.includes("@")) {
        throw new Error("Invalid email returned from Microsoft Graph");
      }
    } catch (err) {
      console.error("[Outlook OAuth] Failed to fetch user email:", err);
      return NextResponse.redirect(
        new URL(
          "/settings/integrations/outlook?error=failed_to_fetch_email",
          request.url
        )
      );
    }

    const tokenRow = await upsertOutlookTokens({
      tenantId: userId,
      outlookEmail,
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      tokenExpiry: new Date(Date.now() + tokenResponse.expires_in * 1000),
    });

    // Create a Microsoft Graph push subscription for real-time email notifications
    try {
      const clientState = randomUUID();
      const notificationUrl = `${origin}/api/webhooks/email/graph/${userId}`;
      const expirationDateTime = new Date(Date.now() + 4230 * 60 * 1000); // ~3 days max

      const graphRes = await fetch(
        "https://graph.microsoft.com/v1.0/subscriptions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            changeType: "created",
            notificationUrl,
            resource: "me/mailFolders/inbox/messages",
            expirationDateTime: expirationDateTime.toISOString(),
            clientState,
          }),
        }
      );

      if (graphRes.ok) {
        const sub = await graphRes.json();
        await createGraphSubscription({
          tenantId: userId,
          outlookOauthTokenId: tokenRow.id,
          subscriptionId: sub.id,
          resource: "me/mailFolders/inbox/messages",
          changeType: "created",
          clientState,
          expirationDateTime: new Date(sub.expirationDateTime),
          notificationUrl,
        });
        console.log(`[Outlook OAuth] Graph subscription created for ${outlookEmail}`);
      } else {
        const errText = await graphRes.text().catch(() => "");
        console.error(
          `[Outlook OAuth] Failed to create Graph subscription (${graphRes.status}): ${errText}`
        );
      }
    } catch (subErr) {
      // Non-fatal: catch-up cron will handle email sync
      console.error("[Outlook OAuth] Graph subscription creation error:", subErr);
    }

    return NextResponse.redirect(
      new URL("/settings/integrations/outlook?connected=true", request.url)
    );
  } catch (error) {
    console.error("[Outlook OAuth] Callback error:", error);
    return NextResponse.redirect(
      new URL(
        `/settings/integrations/outlook?error=${encodeURIComponent(
          error instanceof Error ? error.message : "Unknown error"
        )}`,
        request.url
      )
    );
  }
}
