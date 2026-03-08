import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { setupGmailWatch } from "@/lib/gmail/watch";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

async function exchangeGoogleCode(
  code: string,
  redirectUri: string
): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed (${res.status}): ${err}`);
  }

  return res.json();
}

async function fetchGoogleUserEmail(accessToken: string): Promise<string> {
  const res = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch user info (${res.status})`);
  }

  const data = await res.json();
  return data.email;
}

export async function GET(request: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.redirect(new URL("/auth/sign-in", request.url));
    }

    const code = request.nextUrl.searchParams.get("code");
    const error = request.nextUrl.searchParams.get("error");
    const errorDescription =
      request.nextUrl.searchParams.get("error_description");

    if (error) {
      console.error(
        `[Gmail OAuth] Auth error: ${error} - ${errorDescription}`
      );
      return NextResponse.redirect(
        new URL(
          `/admin/integrations?gmail_error=${encodeURIComponent(errorDescription || error)}`,
          request.url
        )
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL("/admin/integrations?gmail_error=missing_code", request.url)
      );
    }

    // Validate state
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
        new URL("/admin/integrations?gmail_error=invalid_state", request.url)
      );
    }

    const origin = request.nextUrl.origin;
    const redirectUri = `${origin}/api/gmail/oauth/callback`;

    // Exchange code for tokens
    const tokenResponse = await exchangeGoogleCode(code, redirectUri);

    // Fetch user's email
    let emailAddress: string;
    try {
      emailAddress = await fetchGoogleUserEmail(tokenResponse.access_token);
      if (!emailAddress || !emailAddress.includes("@")) {
        throw new Error("Invalid email returned from Google");
      }
    } catch (err) {
      console.error("[Gmail OAuth] Failed to fetch user email:", err);
      return NextResponse.redirect(
        new URL(
          "/admin/integrations?gmail_error=failed_to_fetch_email",
          request.url
        )
      );
    }

    // Get the shared Pub/Sub topic
    const topicName = process.env.GOOGLE_PUBSUB_TOPIC;
    if (!topicName) {
      console.error(
        "[Gmail OAuth] GOOGLE_PUBSUB_TOPIC env var not configured"
      );
      return NextResponse.redirect(
        new URL(
          "/admin/integrations?gmail_error=pubsub_not_configured",
          request.url
        )
      );
    }

    // Auto-setup the Gmail Watch
    await setupGmailWatch({
      tenantId: userId,
      emailAddress,
      topicName,
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      tokenExpiry: new Date(Date.now() + tokenResponse.expires_in * 1000),
    });

    return NextResponse.redirect(
      new URL("/admin/integrations?gmail_connected=true", request.url)
    );
  } catch (error) {
    console.error("[Gmail OAuth] Callback error:", error);
    return NextResponse.redirect(
      new URL(
        `/admin/integrations?gmail_error=${encodeURIComponent(
          error instanceof Error ? error.message : "Unknown error"
        )}`,
        request.url
      )
    );
  }
}
