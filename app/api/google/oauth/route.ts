import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import {
  buildGoogleAuthUrl,
  getGoogleTokensForTenant,
  deactivateGoogleToken,
} from "@/lib/google/oauth";
import { randomUUID } from "crypto";

/**
 * GET /api/google/oauth
 * Returns the current Google OAuth connection status (all accounts),
 * or initiates the OAuth flow if ?action=connect is provided.
 */
export async function GET(request: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const action = request.nextUrl.searchParams.get("action");

    // If action=connect, redirect to Google OAuth
    if (action === "connect") {
      const origin = request.nextUrl.origin;
      const redirectUri = `${origin}/api/google/oauth/callback`;
      const state = `${userId}:${randomUUID()}`;
      const authUrl = buildGoogleAuthUrl(redirectUri, state);
      return NextResponse.redirect(authUrl);
    }

    // Otherwise, return connection status for all accounts
    const tokens = await getGoogleTokensForTenant(userId);

    if (tokens.length === 0) {
      return NextResponse.json({ connected: false, accounts: [] });
    }

    const accounts = tokens.map((token) => ({
      id: token.id,
      googleEmail: token.google_email,
      tokenExpiry: token.token_expiry,
      isExpired: new Date(token.token_expiry) < new Date(),
      lastSyncAt: token.last_sync_at,
      createdAt: token.created_at,
      updatedAt: token.updated_at,
    }));

    return NextResponse.json({
      connected: true,
      accounts,
    });
  } catch (error) {
    console.error("Error in Google OAuth route:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/google/oauth
 * Disconnect a specific Google account. Requires ?accountId=<uuid>.
 */
export async function DELETE(request: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accountId = request.nextUrl.searchParams.get("accountId");
    if (!accountId) {
      return NextResponse.json(
        { error: "accountId query parameter is required" },
        { status: 400 }
      );
    }

    await deactivateGoogleToken(accountId, userId);

    return NextResponse.json({
      message: "Google account disconnected",
    });
  } catch (error) {
    console.error("Error disconnecting Google:", error);
    return NextResponse.json(
      { error: "Failed to disconnect Google" },
      { status: 500 }
    );
  }
}
