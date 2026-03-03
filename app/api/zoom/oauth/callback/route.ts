import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { exchangeZoomCode, upsertZoomTokens } from "@/lib/zoom/oauth";

/**
 * GET /api/zoom/oauth/callback
 * Handles the Zoom OAuth redirect after user authorizes the app.
 * Exchanges the authorization code for tokens and stores them.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      // Redirect to login if not authenticated
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const code = request.nextUrl.searchParams.get("code");
    if (!code) {
      return NextResponse.redirect(
        new URL(
          "/admin/integrations?zoom_error=missing_code",
          request.url
        )
      );
    }

    const origin = request.nextUrl.origin;
    const redirectUri = `${origin}/api/zoom/oauth/callback`;

    const tokenResponse = await exchangeZoomCode(code, redirectUri);

    // Fetch Zoom user profile to get account_id for webhook mapping
    let zoomAccountId: string | undefined;
    try {
      const userInfoRes = await fetch("https://api.zoom.us/v2/users/me", {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
      });
      if (userInfoRes.ok) {
        const userInfo = await userInfoRes.json();
        zoomAccountId = userInfo.account_id;
      }
    } catch (err) {
      console.warn("[Zoom OAuth] Failed to fetch user profile:", err);
    }

    await upsertZoomTokens({
      tenantId: userId,
      zoomAccountId,
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
