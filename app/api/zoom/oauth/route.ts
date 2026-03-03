import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getZoomTokenForTenant,
  deactivateZoomToken,
} from "@/lib/zoom/oauth";

/**
 * GET /api/zoom/oauth
 * Returns the current Zoom OAuth connection status for the authenticated user.
 */
export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = await getZoomTokenForTenant(userId);

    if (!token) {
      return NextResponse.json({ connected: false });
    }

    const isExpired = new Date(token.token_expiry) < new Date();

    return NextResponse.json({
      connected: true,
      zoomAccountId: token.zoom_account_id,
      tokenExpiry: token.token_expiry,
      isExpired,
      createdAt: token.created_at,
      updatedAt: token.updated_at,
    });
  } catch (error) {
    console.error("Error fetching Zoom OAuth status:", error);
    return NextResponse.json(
      { error: "Failed to fetch Zoom connection status" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/zoom/oauth
 * Disconnect the Zoom integration for the authenticated user.
 */
export async function DELETE() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await deactivateZoomToken(userId);

    return NextResponse.json({
      message: "Zoom integration disconnected",
    });
  } catch (error) {
    console.error("Error disconnecting Zoom:", error);
    return NextResponse.json(
      { error: "Failed to disconnect Zoom" },
      { status: 500 }
    );
  }
}
