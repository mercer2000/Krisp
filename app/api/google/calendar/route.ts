import { auth } from "@/lib/auth/server";
import { NextRequest, NextResponse } from "next/server";
import {
  getValidGoogleAccessToken,
  getGoogleTokensForTenant,
  getGoogleTokenById,
} from "@/lib/google/oauth";
import { syncGoogleCalendarEvents } from "@/lib/google/calendar";

/**
 * POST /api/google/calendar
 * Trigger a calendar sync using the user's Google OAuth connection.
 *
 * Body: { accountId?, daysBack?, daysForward? }
 *
 * If accountId is provided, syncs only that account.
 * If omitted, syncs all connected Google accounts.
 */
export async function POST(request: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: { accountId?: string; daysBack?: number; daysForward?: number };
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const daysBack = Math.min(body.daysBack ?? 7, 90);
    const daysForward = Math.min(body.daysForward ?? 30, 180);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + daysForward);
    endDate.setHours(23, 59, 59, 999);

    // Determine which accounts to sync
    let accounts: { id: string; google_email: string }[];
    if (body.accountId) {
      const token = await getGoogleTokenById(body.accountId, userId);
      if (!token) {
        return NextResponse.json(
          { error: "Google account not found or inactive." },
          { status: 400 }
        );
      }
      accounts = [{ id: token.id, google_email: token.google_email }];
    } else {
      const tokens = await getGoogleTokensForTenant(userId);
      if (tokens.length === 0) {
        return NextResponse.json(
          {
            error:
              "No active Google connections. Please connect a Google account first.",
          },
          { status: 400 }
        );
      }
      accounts = tokens.map((t) => ({
        id: t.id,
        google_email: t.google_email,
      }));
    }

    let totalSynced = 0;
    let totalErrors = 0;
    const results: {
      accountId: string;
      email: string;
      synced: number;
      errors: number;
      error?: string;
    }[] = [];

    for (const account of accounts) {
      try {
        const accessToken = await getValidGoogleAccessToken(
          account.id,
          userId
        );
        const result = await syncGoogleCalendarEvents(
          userId,
          account.id,
          accessToken,
          startDate,
          endDate
        );
        totalSynced += result.synced;
        totalErrors += result.errors;
        results.push({
          accountId: account.id,
          email: account.google_email,
          synced: result.synced,
          errors: result.errors,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to sync";
        results.push({
          accountId: account.id,
          email: account.google_email,
          synced: 0,
          errors: 0,
          error: message,
        });
        totalErrors++;
      }
    }

    return NextResponse.json({
      message: "Google Calendar sync complete",
      synced: totalSynced,
      errors: totalErrors,
      results,
      range: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error syncing Google Calendar:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/google/calendar
 * Get the Google Calendar sync status for all connected accounts.
 */
export async function GET() {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tokens = await getGoogleTokensForTenant(userId);

    if (tokens.length === 0) {
      return NextResponse.json({ connected: false, accounts: [] });
    }

    return NextResponse.json({
      connected: true,
      accounts: tokens.map((t) => ({
        id: t.id,
        googleEmail: t.google_email,
        lastSyncAt: t.last_sync_at,
      })),
    });
  } catch (error) {
    console.error("Error fetching Google Calendar status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
