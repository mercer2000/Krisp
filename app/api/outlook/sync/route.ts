import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getValidOutlookAccessToken,
  getOutlookTokenForTenant,
  updateOutlookLastSync,
} from "@/lib/outlook/oauth";
import { fetchOutlookInboxMessages } from "@/lib/outlook/messages";
import { insertEmail, emailExists } from "@/lib/email/emails";

/**
 * POST /api/outlook/sync
 * Pull recent emails from the user's Outlook.com inbox using delegated auth.
 * Inserts any new messages that don't already exist.
 */
export async function POST() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = await getOutlookTokenForTenant(userId);
    if (!token) {
      return NextResponse.json(
        { error: "Outlook not connected. Please connect your Outlook account first." },
        { status: 400 }
      );
    }

    const accessToken = await getValidOutlookAccessToken(userId);

    // Fetch most recent messages; use lastSyncAt as the "after" filter if available
    const afterDate = token.last_sync_at || undefined;
    const { messages } = await fetchOutlookInboxMessages(accessToken, {
      top: 50,
      after: afterDate || undefined,
    });

    let inserted = 0;
    let skipped = 0;

    for (const msg of messages) {
      const exists = await emailExists(userId, msg.messageId);
      if (exists) {
        skipped++;
        continue;
      }

      try {
        await insertEmail(msg, userId);
        inserted++;
      } catch (err) {
        if (
          err instanceof Error &&
          err.message.includes("duplicate key value")
        ) {
          skipped++;
          continue;
        }
        console.error(`[Outlook Sync] Error inserting message ${msg.messageId}:`, err);
      }
    }

    await updateOutlookLastSync(userId);

    return NextResponse.json({
      message: "Sync completed",
      total: messages.length,
      inserted,
      skipped,
    });
  } catch (error) {
    console.error("[Outlook Sync] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    );
  }
}
