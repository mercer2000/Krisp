import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import {
  exchangeGoogleCode,
  upsertGoogleTokens,
  fetchGoogleUserEmail,
} from "@/lib/google/oauth";

/**
 * GET /api/google/oauth/callback
 * Handles the Google OAuth redirect after user authorizes the app.
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

    if (error) {
      console.error(`[Google OAuth] Auth error: ${error}`);
      return NextResponse.redirect(
        new URL(
          `/settings/integrations/google-calendar?error=${encodeURIComponent(error)}`,
          request.url
        )
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL(
          "/settings/integrations/google-calendar?error=missing_code",
          request.url
        )
      );
    }

    // Validate state parameter: must be "{userId}:{uuid}" format
    const state = request.nextUrl.searchParams.get("state") || "";
    const [stateUserId, stateNonce] = state.split(":");
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (
      stateUserId !== userId ||
      !stateNonce ||
      !uuidRegex.test(stateNonce)
    ) {
      return NextResponse.redirect(
        new URL(
          "/settings/integrations/google-calendar?error=invalid_state",
          request.url
        )
      );
    }

    const origin = request.nextUrl.origin;
    const redirectUri = `${origin}/api/google/oauth/callback`;

    const tokenResponse = await exchangeGoogleCode(code, redirectUri);

    // Fetch the user's email address using the new token
    let googleEmail: string;
    try {
      googleEmail = await fetchGoogleUserEmail(tokenResponse.access_token);
      if (!googleEmail || !googleEmail.includes("@")) {
        throw new Error("Invalid email returned from Google");
      }
    } catch (err) {
      console.error("[Google OAuth] Failed to fetch user email:", err);
      return NextResponse.redirect(
        new URL(
          "/settings/integrations/google-calendar?error=failed_to_fetch_email",
          request.url
        )
      );
    }

    await upsertGoogleTokens({
      tenantId: userId,
      googleEmail,
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token || "",
      tokenExpiry: new Date(Date.now() + tokenResponse.expires_in * 1000),
    });

    return NextResponse.redirect(
      new URL("/settings/integrations/google-calendar?connected=true", request.url)
    );
  } catch (error) {
    console.error("[Google OAuth] Callback error:", error);
    return NextResponse.redirect(
      new URL(
        `/settings/integrations/google-calendar?error=${encodeURIComponent(
          error instanceof Error ? error.message : "Unknown error"
        )}`,
        request.url
      )
    );
  }
}
