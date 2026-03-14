import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import {
  buildOutlookAuthUrl,
  getOutlookTokensForTenant,
  deactivateOutlookToken,
  getValidOutlookAccessToken,
} from "@/lib/outlook/oauth";
import { getActiveSubscriptions, deactivateSubscription } from "@/lib/graph/subscriptions";
import { randomUUID } from "crypto";

/**
 * GET /api/outlook/oauth
 * Returns the current Outlook OAuth connection status (all accounts),
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

    // If action=connect, redirect to Microsoft OAuth
    if (action === "connect") {
      const origin = request.nextUrl.origin;
      const redirectUri = `${origin}/api/outlook/oauth/callback`;
      const state = `${userId}:${randomUUID()}`;
      const authUrl = buildOutlookAuthUrl(redirectUri, state);
      return NextResponse.redirect(authUrl);
    }

    // Otherwise, return connection status for all accounts
    const tokens = await getOutlookTokensForTenant(userId);

    if (tokens.length === 0) {
      return NextResponse.json({ connected: false, accounts: [] });
    }

    const accounts = tokens.map((token) => ({
      id: token.id,
      outlookEmail: token.outlook_email,
      tokenExpiry: token.token_expiry,
      isExpired: new Date(token.token_expiry) < new Date(),
      lastSyncAt: token.last_sync_at,
      emailActionBoardId: token.email_action_board_id ?? null,
      createdAt: token.created_at,
      updatedAt: token.updated_at,
    }));

    return NextResponse.json({
      connected: true,
      accounts,
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
 * Disconnect a specific Outlook account. Requires ?accountId=<uuid>.
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

    // Clean up any Graph subscriptions linked to this Outlook account
    try {
      const subs = await getActiveSubscriptions(userId);
      const outlookSubs = subs.filter(
        (s) => s.outlookOauthTokenId === accountId
      );
      for (const sub of outlookSubs) {
        try {
          const token = await getValidOutlookAccessToken(accountId, userId);
          await fetch(
            `https://graph.microsoft.com/v1.0/subscriptions/${sub.subscriptionId}`,
            {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            }
          );
        } catch {
          // Token may already be invalid — that's fine
        }
        await deactivateSubscription(sub.subscriptionId);
      }
    } catch (err) {
      console.warn("[Outlook OAuth] Error cleaning up subscriptions:", err);
    }

    await deactivateOutlookToken(accountId, userId);

    return NextResponse.json({
      message: "Outlook account disconnected",
    });
  } catch (error) {
    console.error("Error disconnecting Outlook:", error);
    return NextResponse.json(
      { error: "Failed to disconnect Outlook" },
      { status: 500 }
    );
  }
}
