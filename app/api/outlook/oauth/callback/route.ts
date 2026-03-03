import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  exchangeOutlookCode,
  upsertOutlookTokens,
} from "@/lib/outlook/oauth";
import { fetchOutlookUserEmail } from "@/lib/outlook/messages";

/**
 * GET /api/outlook/oauth/callback
 * Handles the Microsoft OAuth redirect after user authorizes the app.
 * Exchanges the authorization code for tokens and stores them.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const code = request.nextUrl.searchParams.get("code");
    const error = request.nextUrl.searchParams.get("error");
    const errorDescription = request.nextUrl.searchParams.get("error_description");

    if (error) {
      console.error(`[Outlook OAuth] Auth error: ${error} - ${errorDescription}`);
      return NextResponse.redirect(
        new URL(
          `/admin/integrations?outlook_error=${encodeURIComponent(errorDescription || error)}`,
          request.url
        )
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL(
          "/admin/integrations?outlook_error=missing_code",
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
          "/admin/integrations?outlook_error=invalid_state",
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
          "/admin/integrations?outlook_error=failed_to_fetch_email",
          request.url
        )
      );
    }

    await upsertOutlookTokens({
      tenantId: userId,
      outlookEmail,
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      tokenExpiry: new Date(Date.now() + tokenResponse.expires_in * 1000),
    });

    return NextResponse.redirect(
      new URL("/admin/integrations?outlook_connected=true", request.url)
    );
  } catch (error) {
    console.error("[Outlook OAuth] Callback error:", error);
    return NextResponse.redirect(
      new URL(
        `/admin/integrations?outlook_error=${encodeURIComponent(
          error instanceof Error ? error.message : "Unknown error"
        )}`,
        request.url
      )
    );
  }
}
