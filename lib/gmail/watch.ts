import { db } from "@/lib/db";
import { gmailWatchSubscriptions } from "@/lib/db/schema";
import { eq, and, lt } from "drizzle-orm";

// ── Types ────────────────────────────────────────────

export interface GmailWatchInsert {
  tenantId: string;
  emailAddress: string;
  topicName: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiry: Date;
}

export interface GmailWatchResponse {
  historyId: string;
  expiration: string; // milliseconds since epoch as string
}

export interface GmailHistoryMessage {
  id: string;
  threadId: string;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  internalDate: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
    mimeType: string;
    body?: { size: number; data?: string };
    parts?: Array<{
      mimeType: string;
      filename?: string;
      body: { size: number; data?: string; attachmentId?: string };
      parts?: Array<{
        mimeType: string;
        body: { size: number; data?: string };
      }>;
    }>;
  };
}

// ── Token Management ─────────────────────────────────

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

/**
 * Refresh an expired Google OAuth access token using the refresh token.
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<{ accessToken: string; expiresAt: Date }> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be configured"
    );
  }

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token refresh failed (${res.status}): ${err}`);
  }

  const data = await res.json();
  return {
    accessToken: data.access_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}

/**
 * Get a valid access token for a watch subscription, refreshing if needed.
 */
export async function getValidAccessToken(
  subscription: typeof gmailWatchSubscriptions.$inferSelect
): Promise<string> {
  const now = new Date();
  const bufferMs = 5 * 60 * 1000; // 5 minute buffer

  if (
    subscription.accessToken &&
    subscription.tokenExpiry &&
    subscription.tokenExpiry.getTime() > now.getTime() + bufferMs
  ) {
    return subscription.accessToken;
  }

  if (!subscription.refreshToken) {
    throw new Error(
      `No refresh token for watch subscription ${subscription.id}`
    );
  }

  const { accessToken, expiresAt } = await refreshAccessToken(
    subscription.refreshToken
  );

  // Update stored tokens
  await db
    .update(gmailWatchSubscriptions)
    .set({
      accessToken,
      tokenExpiry: expiresAt,
      updatedAt: new Date(),
    })
    .where(eq(gmailWatchSubscriptions.id, subscription.id));

  return accessToken;
}

/**
 * Get a valid access token for a tenant by looking up their active watch.
 */
export async function getValidAccessTokenForTenant(
  tenantId: string
): Promise<string> {
  const subscription = await getActiveWatch(tenantId);
  if (!subscription) {
    throw new Error(`No active watch subscription for tenant ${tenantId}`);
  }
  return getValidAccessToken(subscription);
}

// ── Gmail Watch API ──────────────────────────────────

const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";

/**
 * Call Gmail Watch API to start monitoring an inbox.
 * Returns the initial historyId and watch expiration.
 */
export async function createGmailWatch(
  accessToken: string,
  topicName: string
): Promise<GmailWatchResponse> {
  const res = await fetch(`${GMAIL_API_BASE}/watch`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      topicName,
      labelIds: ["INBOX"],
      labelFilterBehavior: "INCLUDE",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gmail watch creation failed (${res.status}): ${err}`);
  }

  return res.json();
}

/**
 * Stop an existing Gmail watch.
 */
export async function stopGmailWatch(accessToken: string): Promise<void> {
  const res = await fetch(`${GMAIL_API_BASE}/stop`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  // 204 is success, but Google may also return 200 or even 404 if already stopped
  if (!res.ok && res.status !== 404) {
    const err = await res.text();
    throw new Error(`Gmail watch stop failed (${res.status}): ${err}`);
  }
}

// ── Gmail History & Message Fetch ────────────────────

/**
 * Fetch new message IDs since a given historyId using history.list.
 */
export async function fetchHistorySince(
  accessToken: string,
  startHistoryId: string
): Promise<{ messageIds: string[]; latestHistoryId: string }> {
  const messageIds: string[] = [];
  let pageToken: string | undefined;
  let latestHistoryId = startHistoryId;

  do {
    const url = new URL(`${GMAIL_API_BASE}/history`);
    url.searchParams.set("startHistoryId", startHistoryId);
    url.searchParams.set("historyTypes", "messageAdded");
    url.searchParams.set("labelId", "INBOX");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      // 404 means the historyId is too old (> 7 days) — caller should re-watch
      if (res.status === 404) {
        return { messageIds: [], latestHistoryId: startHistoryId };
      }
      const err = await res.text();
      throw new Error(`Gmail history.list failed (${res.status}): ${err}`);
    }

    const data = await res.json();
    latestHistoryId = data.historyId || latestHistoryId;

    if (data.history) {
      for (const entry of data.history) {
        if (entry.messagesAdded) {
          for (const added of entry.messagesAdded) {
            messageIds.push(added.message.id);
          }
        }
      }
    }

    pageToken = data.nextPageToken;
  } while (pageToken);

  return { messageIds: [...new Set(messageIds)], latestHistoryId };
}

/**
 * Fetch a single Gmail message by ID with full payload.
 */
export async function fetchGmailMessage(
  accessToken: string,
  messageId: string
): Promise<GmailMessage> {
  const res = await fetch(
    `${GMAIL_API_BASE}/messages/${messageId}?format=full`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(
      `Gmail messages.get failed for ${messageId} (${res.status}): ${err}`
    );
  }

  return res.json();
}

/**
 * Extract header value from a Gmail message payload.
 */
export function getHeader(
  message: GmailMessage,
  name: string
): string | undefined {
  return message.payload.headers.find(
    (h) => h.name.toLowerCase() === name.toLowerCase()
  )?.value;
}

/**
 * Decode base64url-encoded body data from Gmail API.
 */
export function decodeBase64Url(data: string): string {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64").toString("utf-8");
}

/**
 * Extract plain text and HTML bodies from a Gmail message.
 */
export function extractBodies(message: GmailMessage): {
  bodyPlain: string | null;
  bodyHtml: string | null;
} {
  let bodyPlain: string | null = null;
  let bodyHtml: string | null = null;

  const parts = message.payload.parts;

  if (parts) {
    for (const part of parts) {
      if (part.mimeType === "text/plain" && part.body.data) {
        bodyPlain = decodeBase64Url(part.body.data);
      } else if (part.mimeType === "text/html" && part.body.data) {
        bodyHtml = decodeBase64Url(part.body.data);
      } else if (
        part.mimeType === "multipart/alternative" &&
        part.parts
      ) {
        for (const subpart of part.parts) {
          if (subpart.mimeType === "text/plain" && subpart.body.data) {
            bodyPlain = decodeBase64Url(subpart.body.data);
          } else if (subpart.mimeType === "text/html" && subpart.body.data) {
            bodyHtml = decodeBase64Url(subpart.body.data);
          }
        }
      }
    }
  } else if (message.payload.body?.data) {
    // Simple message (no parts)
    if (message.payload.mimeType === "text/plain") {
      bodyPlain = decodeBase64Url(message.payload.body.data);
    } else if (message.payload.mimeType === "text/html") {
      bodyHtml = decodeBase64Url(message.payload.body.data);
    }
  }

  return { bodyPlain, bodyHtml };
}

/**
 * Extract attachment metadata from a Gmail message.
 */
export function extractAttachments(
  message: GmailMessage
): Array<{ name: string; mimeType: string; size: number; attachmentId: string }> {
  const attachments: Array<{
    name: string;
    mimeType: string;
    size: number;
    attachmentId: string;
  }> = [];

  if (!message.payload.parts) return attachments;

  for (const part of message.payload.parts) {
    if (part.filename && part.body.attachmentId) {
      attachments.push({
        name: part.filename,
        mimeType: part.mimeType,
        size: part.body.size,
        attachmentId: part.body.attachmentId,
      });
    }
  }

  return attachments;
}

// ── Database Operations ──────────────────────────────

/**
 * Create or update a Gmail watch subscription record.
 */
export async function upsertGmailWatch(data: GmailWatchInsert & {
  historyId?: string;
  expiration?: Date;
}) {
  const existing = await db
    .select()
    .from(gmailWatchSubscriptions)
    .where(
      and(
        eq(gmailWatchSubscriptions.tenantId, data.tenantId),
        eq(gmailWatchSubscriptions.emailAddress, data.emailAddress)
      )
    );

  if (existing.length > 0) {
    const [result] = await db
      .update(gmailWatchSubscriptions)
      .set({
        topicName: data.topicName,
        historyId: data.historyId ?? existing[0].historyId,
        expiration: data.expiration ?? existing[0].expiration,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        tokenExpiry: data.tokenExpiry,
        active: true,
        updatedAt: new Date(),
      })
      .where(eq(gmailWatchSubscriptions.id, existing[0].id))
      .returning();
    return result;
  }

  const [result] = await db
    .insert(gmailWatchSubscriptions)
    .values({
      tenantId: data.tenantId,
      emailAddress: data.emailAddress,
      topicName: data.topicName,
      historyId: data.historyId ?? null,
      expiration: data.expiration ?? null,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      tokenExpiry: data.tokenExpiry,
    })
    .returning();

  return result;
}

/**
 * Get the active watch subscription for a tenant.
 */
export async function getActiveWatch(tenantId: string) {
  const results = await db
    .select()
    .from(gmailWatchSubscriptions)
    .where(
      and(
        eq(gmailWatchSubscriptions.tenantId, tenantId),
        eq(gmailWatchSubscriptions.active, true)
      )
    );
  return results[0] ?? null;
}

/**
 * Update the historyId for a watch subscription after processing.
 */
export async function updateWatchHistoryId(
  subscriptionId: string,
  historyId: string
) {
  await db
    .update(gmailWatchSubscriptions)
    .set({
      historyId,
      updatedAt: new Date(),
    })
    .where(eq(gmailWatchSubscriptions.id, subscriptionId));
}

/**
 * Deactivate a watch subscription.
 */
export async function deactivateWatch(subscriptionId: string) {
  await db
    .update(gmailWatchSubscriptions)
    .set({
      active: false,
      updatedAt: new Date(),
    })
    .where(eq(gmailWatchSubscriptions.id, subscriptionId));
}

/**
 * Get watches expiring before a given date (for renewal cron).
 */
export async function getExpiringWatches(beforeDate: Date) {
  return db
    .select()
    .from(gmailWatchSubscriptions)
    .where(
      and(
        eq(gmailWatchSubscriptions.active, true),
        lt(gmailWatchSubscriptions.expiration, beforeDate)
      )
    );
}

/**
 * Set up a Gmail watch for a tenant: calls the Watch API, stores the
 * subscription record, and returns the watch response.
 */
export async function setupGmailWatch(data: GmailWatchInsert) {
  // Call Gmail Watch API
  const watchResponse = await createGmailWatch(
    data.accessToken,
    data.topicName
  );

  // Store the subscription
  const subscription = await upsertGmailWatch({
    ...data,
    historyId: watchResponse.historyId,
    expiration: new Date(parseInt(watchResponse.expiration, 10)),
  });

  return { subscription, watchResponse };
}

/**
 * Renew an existing Gmail watch subscription.
 */
export async function renewGmailWatch(subscriptionId: string) {
  const [subscription] = await db
    .select()
    .from(gmailWatchSubscriptions)
    .where(eq(gmailWatchSubscriptions.id, subscriptionId));

  if (!subscription) {
    throw new Error(`Watch subscription ${subscriptionId} not found`);
  }

  const accessToken = await getValidAccessToken(subscription);

  const watchResponse = await createGmailWatch(
    accessToken,
    subscription.topicName
  );

  await db
    .update(gmailWatchSubscriptions)
    .set({
      historyId: watchResponse.historyId,
      expiration: new Date(parseInt(watchResponse.expiration, 10)),
      updatedAt: new Date(),
    })
    .where(eq(gmailWatchSubscriptions.id, subscriptionId));

  return watchResponse;
}

/**
 * Process a Pub/Sub notification: fetch new emails since the stored
 * historyId, parse them, and return data ready for insertion.
 */
export async function processGmailNotification(
  tenantId: string,
  notifiedHistoryId: number
) {
  const subscription = await getActiveWatch(tenantId);
  if (!subscription) {
    console.warn(
      `[Gmail Watch] No active watch for tenant ${tenantId}`
    );
    return { processed: 0 };
  }

  const startHistoryId =
    subscription.historyId || String(notifiedHistoryId);
  const accessToken = await getValidAccessToken(subscription);

  // Fetch new messages since last processed historyId
  const { messageIds, latestHistoryId } = await fetchHistorySince(
    accessToken,
    startHistoryId
  );

  if (messageIds.length === 0) {
    // Update historyId even if no new messages
    await updateWatchHistoryId(subscription.id, latestHistoryId);
    return { processed: 0 };
  }

  // Fetch each message and prepare for insertion
  const emails = [];
  for (const msgId of messageIds) {
    try {
      const message = await fetchGmailMessage(accessToken, msgId);
      const { bodyPlain, bodyHtml } = extractBodies(message);
      const attachments = extractAttachments(message);

      emails.push({
        tenant_id: tenantId,
        gmail_message_id: message.id,
        thread_id: message.threadId,
        sender: getHeader(message, "From") ?? "(unknown)",
        recipients: parseRecipients(message),
        subject: getHeader(message, "Subject") ?? null,
        body_plain: bodyPlain,
        body_html: bodyHtml,
        received_at: new Date(parseInt(message.internalDate, 10)),
        attachments,
        labels: message.labelIds ?? [],
        raw_payload: null, // Don't store full payload to save space
      });
    } catch (err) {
      console.error(
        `[Gmail Watch] Failed to fetch message ${msgId}:`,
        err
      );
    }
  }

  // Update the historyId to the latest
  await updateWatchHistoryId(subscription.id, latestHistoryId);

  return { processed: emails.length, emails };
}

/**
 * Parse recipients from To, Cc, Bcc headers into a structured array.
 */
function parseRecipients(message: GmailMessage) {
  const to = getHeader(message, "To") ?? "";
  const cc = getHeader(message, "Cc") ?? "";
  const bcc = getHeader(message, "Bcc") ?? "";

  const parse = (header: string) =>
    header
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  return {
    to: parse(to),
    cc: parse(cc),
    bcc: parse(bcc),
  };
}
