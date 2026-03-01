import { NextRequest, NextResponse } from "next/server";
import { insertGmailEmail } from "@/lib/gmail/emails";
import {
  pubSubPushMessageSchema,
  gmailAppsScriptPayloadSchema,
} from "@/lib/validators/schemas";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const GMAIL_WEBHOOK_SECRET = process.env.GMAIL_WEBHOOK_SECRET;

/**
 * Validates the `?token=` query parameter as a secondary auth layer.
 * For Pub/Sub push, also validates the Bearer token in Authorization header
 * against Google's token info (simplified to secret comparison here).
 */
function validateToken(request: NextRequest): boolean {
  if (!GMAIL_WEBHOOK_SECRET) {
    console.warn(
      "GMAIL_WEBHOOK_SECRET not configured - authorization disabled"
    );
    return true;
  }

  // Check query parameter token (used by both Pub/Sub and Apps Script)
  const tokenParam = request.nextUrl.searchParams.get("token");
  if (tokenParam) {
    return timingSafeEqual(tokenParam, GMAIL_WEBHOOK_SECRET);
  }

  // Check X-API-Key header (used by Apps Script)
  const apiKey = request.headers.get("x-api-key");
  if (apiKey) {
    return timingSafeEqual(apiKey, GMAIL_WEBHOOK_SECRET);
  }

  // Check Authorization header (used by Pub/Sub push)
  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;
    return timingSafeEqual(token, GMAIL_WEBHOOK_SECRET);
  }

  return false;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    // Validate auth
    if (!validateToken(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tenantId } = await params;

    // Validate UUID format
    if (!UUID_REGEX.test(tenantId)) {
      return NextResponse.json(
        { error: "Invalid tenant ID format" },
        { status: 400 }
      );
    }

    // Validate that the tenant (user) exists
    const [tenant] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, tenantId));

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    // Determine message type: Pub/Sub push or Apps Script direct payload
    const pubSubResult = pubSubPushMessageSchema.safeParse(body);

    if (pubSubResult.success) {
      return handlePubSubPush(pubSubResult.data, tenantId);
    }

    // Try Apps Script payload
    const appsScriptResult = gmailAppsScriptPayloadSchema.safeParse(body);

    if (appsScriptResult.success) {
      return handleAppsScriptPayload(appsScriptResult.data, tenantId);
    }

    // Neither format matched
    return NextResponse.json(
      {
        error: "Validation failed",
        details:
          "Payload must be a Google Pub/Sub push message or an Apps Script email payload",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error processing Gmail webhook:", error);

    // Handle unique constraint violation (race condition on duplicate)
    if (
      error instanceof Error &&
      error.message.includes("duplicate key value")
    ) {
      return NextResponse.json(
        { message: "Email already processed" },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Handle a Google Pub/Sub push notification.
 *
 * The push payload contains a base64-encoded `data` field with
 * `{ emailAddress, historyId }`. The actual email must be fetched
 * via the Gmail API using history.list + messages.get.
 *
 * Since Gmail API OAuth tokens are managed per-tenant and the actual
 * fetch requires the Gmail API client, this endpoint decodes the
 * notification and acknowledges it. Full Gmail API integration
 * requires the tenant to complete OAuth setup first.
 */
async function handlePubSubPush(
  message: { message: { data: string; messageId: string; publishTime: string }; subscription: string },
  tenantId: string
) {
  // Decode the base64 data field
  let decoded: { emailAddress?: string; historyId?: number };
  try {
    const raw = Buffer.from(message.message.data, "base64").toString("utf-8");
    decoded = JSON.parse(raw);
  } catch {
    return NextResponse.json(
      { error: "Invalid Pub/Sub message data" },
      { status: 400 }
    );
  }

  if (!decoded.emailAddress || !decoded.historyId) {
    return NextResponse.json(
      { error: "Missing emailAddress or historyId in Pub/Sub data" },
      { status: 400 }
    );
  }

  // Log the notification for now — actual Gmail API fetch requires OAuth tokens
  console.log(
    `[Gmail Pub/Sub] Tenant ${tenantId}: notification for ${decoded.emailAddress}, historyId=${decoded.historyId}`
  );

  // TODO: When Gmail OAuth is configured per-tenant:
  // 1. Get tenant's OAuth tokens from database
  // 2. Call Gmail API history.list with the historyId
  // 3. For each new message, call messages.get
  // 4. Parse and store each email via insertGmailEmail()
  // 5. Update tenant's stored historyId

  // Acknowledge the Pub/Sub push to prevent retries
  return NextResponse.json(
    {
      message: "Pub/Sub notification received",
      emailAddress: decoded.emailAddress,
      historyId: decoded.historyId,
    },
    { status: 200 }
  );
}

/**
 * Handle a direct payload from Google Apps Script.
 *
 * Apps Script sends pre-parsed email data, so we can store it immediately
 * without needing Gmail API access.
 */
async function handleAppsScriptPayload(
  payload: {
    messageId: string;
    sender: string;
    recipients: string;
    subject?: string;
    bodyPlain?: string;
    bodyHtml?: string;
    receivedAt: string;
  },
  tenantId: string
) {
  // Parse recipients string into array (comma-separated)
  const recipientsList = payload.recipients
    .split(",")
    .map((r) => r.trim())
    .filter(Boolean);

  const result = await insertGmailEmail({
    tenant_id: tenantId,
    gmail_message_id: payload.messageId,
    sender: payload.sender,
    recipients: recipientsList,
    subject: payload.subject ?? null,
    body_plain: payload.bodyPlain ?? null,
    body_html: payload.bodyHtml ?? null,
    received_at: new Date(payload.receivedAt),
    raw_payload: payload,
  });

  // null means duplicate (ON CONFLICT DO NOTHING returned no rows)
  if (!result) {
    return NextResponse.json(
      { message: "Email already processed", messageId: payload.messageId },
      { status: 200 }
    );
  }

  return NextResponse.json(
    {
      message: "Email received and stored successfully",
      id: result.id,
      gmailMessageId: result.gmail_message_id,
    },
    { status: 201 }
  );
}
