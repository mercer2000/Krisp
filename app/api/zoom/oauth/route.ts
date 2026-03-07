import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  buildZoomAuthUrl,
  getZoomTokensForTenant,
  deactivateZoomToken,
} from "@/lib/zoom/oauth";
import { randomUUID } from "crypto";

/**
 * GET /api/zoom/oauth
 * Returns the current Zoom OAuth connection status (all accounts),
 * or initiates the OAuth flow if ?action=connect is provided.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const action = request.nextUrl.searchParams.get("action");

    if (action === "connect") {
      const origin = request.nextUrl.origin;
      const redirectUri = `${origin}/api/zoom/oauth/callback`;
      const state = `${userId}:${randomUUID()}`;
      const authUrl = buildZoomAuthUrl(redirectUri, state);
      return NextResponse.redirect(authUrl);
    }

    const tokens = await getZoomTokensForTenant(userId);

    if (tokens.length === 0) {
      return NextResponse.json({ connected: false, accounts: [] });
    }

    const accounts = tokens.map((token) => ({
      id: token.id,
      zoomEmail: token.zoom_email,
      zoomUserId: token.zoom_user_id,
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
    console.error("Error in Zoom OAuth route:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/zoom/oauth
 * Disconnect a specific Zoom account. Requires ?accountId=<uuid>.
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
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

    await deactivateZoomToken(accountId, userId);

    return NextResponse.json({
      message: "Zoom account disconnected",
    });
  } catch (error) {
    console.error("Error disconnecting Zoom:", error);
    return NextResponse.json(
      { error: "Failed to disconnect Zoom" },
      { status: 500 }
    );
  }
}
