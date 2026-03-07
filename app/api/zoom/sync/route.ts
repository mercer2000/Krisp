import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getValidZoomAccessToken,
  getZoomTokensForTenant,
  getZoomTokenById,
  updateZoomLastSync,
} from "@/lib/zoom/oauth";
import { fetchZoomChannels, fetchZoomChannelMessages, fetchZoomContacts, fetchZoomDirectMessages } from "@/lib/zoom/chat";
import { insertZoomChatMessage, zoomMessageExists } from "@/lib/zoom/messages";

/**
 * POST /api/zoom/sync
 * Sync recent Zoom Team Chat messages for the authenticated user.
 *
 * Body: { accountId? }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: { accountId?: string };
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    let accounts: { id: string; zoom_email: string; zoom_user_id: string | null; last_sync_at: string | null }[];
    if (body.accountId) {
      const token = await getZoomTokenById(body.accountId, userId);
      if (!token) {
        return NextResponse.json(
          { error: "Zoom account not found or inactive." },
          { status: 400 }
        );
      }
      accounts = [{ id: token.id, zoom_email: token.zoom_email, zoom_user_id: token.zoom_user_id, last_sync_at: token.last_sync_at }];
    } else {
      const tokens = await getZoomTokensForTenant(userId);
      if (tokens.length === 0) {
        return NextResponse.json(
          { error: "Zoom not connected. Please connect your Zoom account first." },
          { status: 400 }
        );
      }
      accounts = tokens.map((t) => ({ id: t.id, zoom_email: t.zoom_email, zoom_user_id: t.zoom_user_id, last_sync_at: t.last_sync_at }));
    }

    let totalInserted = 0;
    let totalSkipped = 0;
    let totalMessages = 0;
    const results: { accountId: string; email: string; total: number; inserted: number; skipped: number; error?: string }[] = [];

    for (const account of accounts) {
      try {
        const accessToken = await getValidZoomAccessToken(account.id, userId);

        // Determine date range: from last_sync_at or last 7 days
        const fromDate = account.last_sync_at
          ? new Date(account.last_sync_at).toISOString().split("T")[0]
          : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        const toDate = new Date().toISOString().split("T")[0];

        console.log(`[Zoom Sync] Syncing account ${account.zoom_email}, date range: ${fromDate} to ${toDate}`);

        // Fetch all channels
        const channelsResponse = await fetchZoomChannels(accessToken);
        const channels = channelsResponse.channels || [];
        console.log(`[Zoom Sync] Found ${channels.length} channels:`, channels.map(c => ({ id: c.id, name: c.name, type: c.type })));

        let inserted = 0;
        let skipped = 0;
        let messageCount = 0;

        for (const channel of channels) {
          try {
            const messagesResponse = await fetchZoomChannelMessages(
              accessToken,
              channel.id,
              { from: fromDate, to: toDate }
            );

            const messages = messagesResponse.messages || [];
            console.log(`[Zoom Sync] Channel "${channel.name}" (${channel.id}): ${messages.length} messages`);
            messageCount += messages.length;

            for (const msg of messages) {
              const exists = await zoomMessageExists(userId, msg.id);
              if (exists) {
                skipped++;
                continue;
              }

              const result = await insertZoomChatMessage({
                tenant_id: userId,
                zoom_user_id: account.zoom_user_id || "",
                message_id: msg.id,
                channel_id: channel.id,
                channel_type: "channel",
                sender_id: msg.sender,
                sender_name: msg.sender_display_name || null,
                message_content: msg.message,
                message_timestamp: new Date(msg.date_time),
                raw_payload: msg as unknown as object,
              });

              if (result) {
                inserted++;
              } else {
                skipped++;
              }
            }
          } catch (channelErr) {
            console.error(`[Zoom Sync] Error fetching messages for channel ${channel.id}:`, channelErr);
          }
        }

        // Sync DMs from contacts
        try {
          const contactsResponse = await fetchZoomContacts(accessToken);
          const contacts = contactsResponse.contacts || [];
          console.log(`[Zoom Sync] Found ${contacts.length} contacts for DM sync:`, contacts.map(c => ({ id: c.id, email: c.email })));

          for (const contact of contacts) {
            try {
              const dmResponse = await fetchZoomDirectMessages(
                accessToken,
                contact.id,
                { from: fromDate, to: toDate }
              );

              const dmMessages = dmResponse.messages || [];
              messageCount += dmMessages.length;

              for (const msg of dmMessages) {
                const exists = await zoomMessageExists(userId, msg.id);
                if (exists) {
                  skipped++;
                  continue;
                }

                const result = await insertZoomChatMessage({
                  tenant_id: userId,
                  zoom_user_id: account.zoom_user_id || "",
                  message_id: msg.id,
                  channel_id: contact.id,
                  channel_type: "dm",
                  sender_id: msg.sender,
                  sender_name: msg.sender_display_name || contact.first_name || null,
                  message_content: msg.message,
                  message_timestamp: new Date(msg.date_time),
                  raw_payload: msg as unknown as object,
                });

                if (result) {
                  inserted++;
                } else {
                  skipped++;
                }
              }
            } catch (dmErr) {
              console.error(`[Zoom Sync] Error fetching DMs for contact ${contact.id}:`, dmErr);
            }
          }
        } catch (contactsErr) {
          console.error("[Zoom Sync] Error fetching contacts for DM sync:", contactsErr);
        }

        await updateZoomLastSync(account.id);

        totalInserted += inserted;
        totalSkipped += skipped;
        totalMessages += messageCount;
        results.push({
          accountId: account.id,
          email: account.zoom_email,
          total: messageCount,
          inserted,
          skipped,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Sync failed";
        results.push({
          accountId: account.id,
          email: account.zoom_email,
          total: 0,
          inserted: 0,
          skipped: 0,
          error: message,
        });
      }
    }

    return NextResponse.json({
      message: "Sync completed",
      total: totalMessages,
      inserted: totalInserted,
      skipped: totalSkipped,
      results,
    });
  } catch (error) {
    console.error("[Zoom Sync] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    );
  }
}
