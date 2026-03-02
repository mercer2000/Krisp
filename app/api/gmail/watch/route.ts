import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  setupGmailWatch,
  getActiveWatch,
  renewGmailWatch,
  stopGmailWatch,
  deactivateWatch,
  getValidAccessTokenForTenant,
} from "@/lib/gmail/watch";

/**
 * GET /api/gmail/watch
 * Returns the current Gmail watch status for the authenticated user.
 */
export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const watch = await getActiveWatch(userId);

    if (!watch) {
      return NextResponse.json({ active: false, watch: null });
    }

    return NextResponse.json({
      active: true,
      watch: {
        id: watch.id,
        emailAddress: watch.emailAddress,
        historyId: watch.historyId,
        expiration: watch.expiration,
        topicName: watch.topicName,
        createdAt: watch.createdAt,
        updatedAt: watch.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching Gmail watch status:", error);
    return NextResponse.json(
      { error: "Failed to fetch watch status" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/gmail/watch
 * Set up a new Gmail watch subscription for the authenticated user.
 *
 * Body: {
 *   emailAddress: string,
 *   topicName: string,
 *   accessToken: string,
 *   refreshToken: string,
 *   tokenExpiry: string (ISO 8601)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const { emailAddress, topicName, accessToken, refreshToken, tokenExpiry } =
      body;

    if (!emailAddress || !topicName || !accessToken || !refreshToken) {
      return NextResponse.json(
        {
          error:
            "emailAddress, topicName, accessToken, and refreshToken are required",
        },
        { status: 400 }
      );
    }

    const { subscription, watchResponse } = await setupGmailWatch({
      tenantId: userId,
      emailAddress,
      topicName,
      accessToken,
      refreshToken,
      tokenExpiry: tokenExpiry ? new Date(tokenExpiry) : new Date(Date.now() + 3600 * 1000),
    });

    return NextResponse.json({
      message: "Gmail watch created successfully",
      watch: {
        id: subscription.id,
        emailAddress: subscription.emailAddress,
        historyId: watchResponse.historyId,
        expiration: new Date(
          parseInt(watchResponse.expiration, 10)
        ).toISOString(),
        topicName: subscription.topicName,
      },
    });
  } catch (error) {
    console.error("Error setting up Gmail watch:", error);
    return NextResponse.json(
      {
        error: "Failed to set up Gmail watch",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/gmail/watch
 * Renew the existing Gmail watch subscription for the authenticated user.
 */
export async function PUT() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const watch = await getActiveWatch(userId);
    if (!watch) {
      return NextResponse.json(
        { error: "No active Gmail watch found" },
        { status: 404 }
      );
    }

    const watchResponse = await renewGmailWatch(watch.id);

    return NextResponse.json({
      message: "Gmail watch renewed successfully",
      expiration: new Date(
        parseInt(watchResponse.expiration, 10)
      ).toISOString(),
      historyId: watchResponse.historyId,
    });
  } catch (error) {
    console.error("Error renewing Gmail watch:", error);
    return NextResponse.json(
      {
        error: "Failed to renew Gmail watch",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/gmail/watch
 * Stop and deactivate the Gmail watch for the authenticated user.
 */
export async function DELETE() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const watch = await getActiveWatch(userId);
    if (!watch) {
      return NextResponse.json(
        { error: "No active Gmail watch found" },
        { status: 404 }
      );
    }

    // Stop the watch on Google's side
    try {
      const accessToken = await getValidAccessTokenForTenant(userId);
      await stopGmailWatch(accessToken);
    } catch (err) {
      console.warn(
        "[Gmail Watch] Failed to stop watch on Google side (may already be expired):",
        err
      );
    }

    // Deactivate locally
    await deactivateWatch(watch.id);

    return NextResponse.json({
      message: "Gmail watch stopped and deactivated",
    });
  } catch (error) {
    console.error("Error stopping Gmail watch:", error);
    return NextResponse.json(
      {
        error: "Failed to stop Gmail watch",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
