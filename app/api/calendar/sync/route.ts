import { auth } from "@/lib/auth/server";
import { NextRequest, NextResponse } from "next/server";
import {
  getGraphCredentialsById,
  getGraphAccessTokenFromCreds,
  getAllGraphCredentials,
} from "@/lib/graph/credentials";
import { syncCalendarEvents, getSyncState } from "@/lib/graph/calendar";

/**
 * POST /api/calendar/sync
 * Trigger a calendar sync from Microsoft Graph API.
 *
 * Body: { credentialId, mailbox, daysBack?, daysForward? }
 */
export async function POST(request: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: {
      credentialId?: string;
      mailbox?: string;
      daysBack?: number;
      daysForward?: number;
    };
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const credentialId = body.credentialId?.trim();
    if (!credentialId) {
      return NextResponse.json(
        { error: "credentialId is required" },
        { status: 400 }
      );
    }

    const mailbox = body.mailbox?.trim();
    if (!mailbox) {
      return NextResponse.json(
        { error: "mailbox is required" },
        { status: 400 }
      );
    }

    const creds = await getGraphCredentialsById(credentialId, userId);
    if (!creds) {
      return NextResponse.json(
        { error: "Credential not found" },
        { status: 404 }
      );
    }

    let accessToken: string;
    try {
      accessToken = await getGraphAccessTokenFromCreds(creds);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to obtain access token";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    // Default: sync 7 days back and 30 days forward
    const daysBack = Math.min(body.daysBack ?? 7, 90);
    const daysForward = Math.min(body.daysForward ?? 30, 180);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + daysForward);
    endDate.setHours(23, 59, 59, 999);

    const result = await syncCalendarEvents(
      userId,
      credentialId,
      mailbox,
      accessToken,
      startDate,
      endDate
    );

    return NextResponse.json({
      message: "Calendar sync complete",
      synced: result.synced,
      errors: result.errors,
      range: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error syncing calendar:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/calendar/sync
 * Get the current sync state for the user.
 */
export async function GET() {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [syncStates, credentials] = await Promise.all([
      getSyncState(userId),
      getAllGraphCredentials(userId),
    ]);

    return NextResponse.json({ syncStates, credentials });
  } catch (error) {
    console.error("Error fetching sync state:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
