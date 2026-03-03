import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  buildOutlookAuthUrl,
  getOutlookTokenForTenant,
  deactivateOutlookToken,
} from "@/lib/outlook/oauth";
import { randomUUID } from "crypto";

/**
 * GET /api/outlook/oauth
 * Returns the current Outlook OAuth connection status, or initiates the OAuth
 * flow if ?action=connect is provided.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const action = request.nextUrl.searchParams.get("action");

    // If action=connect, redirect to Microsoft OAuth
    if (action === "connect") {
      const origin = request.nextUrl.origin;
      const redirectUri = `${origin}/api/outlook/oauth/callback`;
      const state = `${userId}:${randomUUID()}`;
      const authUrl = buildOutlookAuthUrl(redirectUri, state);
      return NextResponse.redirect(authUrl);
    }

    // Otherwise, return connection status
    const token = await getOutlookTokenForTenant(userId);

    if (!token) {
      return NextResponse.json({ connected: false });
    }

    const isExpired = new Date(token.token_expiry) < new Date();

    return NextResponse.json({
      connected: true,
      outlookEmail: token.outlook_email,
      tokenExpiry: token.token_expiry,
      isExpired,
      lastSyncAt: token.last_sync_at,
      createdAt: token.created_at,
      updatedAt: token.updated_at,
    });
  } catch (error) {
    console.error("Error in Outlook OAuth route:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/outlook/oauth
 * Disconnect the Outlook integration for the authenticated user.
 */
export async function DELETE() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await deactivateOutlookToken(userId);

    return NextResponse.json({
      message: "Outlook integration disconnected",
    });
  } catch (error) {
    console.error("Error disconnecting Outlook:", error);
    return NextResponse.json(
      { error: "Failed to disconnect Outlook" },
      { status: 500 }
    );
  }
}
