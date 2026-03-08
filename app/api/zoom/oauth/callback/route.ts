import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { exchangeZoomCode, upsertZoomTokens } from "@/lib/zoom/oauth";
import { fetchZoomUserProfile } from "@/lib/zoom/chat";

/**
 * GET /api/zoom/oauth/callback
 * Handles the Zoom OAuth redirect after user authorizes the app.
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
      console.error(`[Zoom OAuth] Auth error: ${error}`);
      return NextResponse.redirect(
        new URL(
          `/admin/integrations?zoom_error=${encodeURIComponent(error)}`,
          request.url
        )
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL(
          "/admin/integrations?zoom_error=missing_code",
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
          "/admin/integrations?zoom_error=invalid_state",
          request.url
        )
      );
    }

    const origin = request.nextUrl.origin;
    const redirectUri = `${origin}/api/zoom/oauth/callback`;

    const tokenResponse = await exchangeZoomCode(code, redirectUri);

    // Fetch the user's Zoom profile for email and user ID
    let zoomEmail: string;
    let zoomUserId: string;
    try {
      const profile = await fetchZoomUserProfile(tokenResponse.access_token);
      zoomEmail = profile.email;
      zoomUserId = profile.id;
      if (!zoomEmail || !zoomEmail.includes("@")) {
        throw new Error("Invalid email returned from Zoom API");
      }
    } catch (err) {
      console.error("[Zoom OAuth] Failed to fetch user profile:", err);
      return NextResponse.redirect(
        new URL(
          "/admin/integrations?zoom_error=failed_to_fetch_profile",
          request.url
        )
      );
    }

    await upsertZoomTokens({
      tenantId: userId,
      zoomEmail,
      zoomUserId,
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      tokenExpiry: new Date(Date.now() + tokenResponse.expires_in * 1000),
    });

    return NextResponse.redirect(
      new URL("/admin/integrations?zoom_connected=true", request.url)
    );
  } catch (error) {
    console.error("[Zoom OAuth] Callback error:", error);
    return NextResponse.redirect(
      new URL(
        `/admin/integrations?zoom_error=${encodeURIComponent(
          error instanceof Error ? error.message : "Unknown error"
        )}`,
        request.url
      )
    );
  }
}
