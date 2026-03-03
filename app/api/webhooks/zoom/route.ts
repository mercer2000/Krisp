import { NextRequest, NextResponse } from "next/server";
import { zoomChatWebhookPayloadSchema } from "@/lib/validators/schemas";
import {
  insertZoomChatMessage,
  updateZoomChatMessage,
  softDeleteZoomChatMessage,
} from "@/lib/zoom/messages";
import { getTenantByZoomAccountId } from "@/lib/zoom/oauth";
import crypto from "crypto";

const ZOOM_WEBHOOK_SECRET_TOKEN = process.env.ZOOM_WEBHOOK_SECRET_TOKEN;

/**
 * Validate Zoom webhook request signature.
 * Zoom sends a signature in the x-zm-signature header using HMAC SHA-256.
 */
function validateZoomSignature(
  request: NextRequest,
  body: string
): boolean {
  if (!ZOOM_WEBHOOK_SECRET_TOKEN) {
    console.warn(
      "[Zoom Webhook] ZOOM_WEBHOOK_SECRET_TOKEN not configured — signature validation disabled"
    );
    return true;
  }

  const timestamp = request.headers.get("x-zm-request-timestamp");
  const signature = request.headers.get("x-zm-signature");

  if (!timestamp || !signature) {
    return false;
  }

  // Reject requests older than 5 minutes to prevent replay attacks
  const requestTime = parseInt(timestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  if (isNaN(requestTime) || Math.abs(now - requestTime) > 300) {
    console.warn("[Zoom Webhook] Request timestamp too old or invalid");
    return false;
  }

  const message = `v0:${timestamp}:${body}`;
  const hash = crypto
    .createHmac("sha256", ZOOM_WEBHOOK_SECRET_TOKEN)
    .update(message)
    .digest("hex");
  const expectedSignature = `v0=${hash}`;

  // Timing-safe comparison
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

/**
 * POST /api/webhooks/zoom
 * Handles incoming Zoom webhook events:
 * - endpoint.url_validation: Responds to Zoom's URL validation challenge
 * - chat_message.sent: New chat message
 * - chat_message.updated: Edited chat message
 * - chat_message.deleted: Deleted chat message
 */
export async function POST(request: NextRequest) {
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  // Handle URL validation challenge (Zoom sends this when setting up webhooks)
  if (body.event === "endpoint.url_validation") {
    const plainToken = body.payload &&
      typeof body.payload === "object" &&
      "plainToken" in body.payload
      ? (body.payload as { plainToken: string }).plainToken
      : null;

    if (!plainToken) {
      return NextResponse.json(
        { error: "Missing plainToken in validation payload" },
        { status: 400 }
      );
    }

    if (!ZOOM_WEBHOOK_SECRET_TOKEN) {
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    const hashForValidation = crypto
      .createHmac("sha256", ZOOM_WEBHOOK_SECRET_TOKEN)
      .update(plainToken)
      .digest("hex");

    return NextResponse.json({
      plainToken,
      encryptedToken: hashForValidation,
    });
  }

  // Validate signature for non-validation events
  if (!validateZoomSignature(request, rawBody)) {
    console.warn("[Zoom Webhook] Signature verification failed");
    return NextResponse.json(
      { error: "Signature verification failed" },
      { status: 403 }
    );
  }

  // Parse the webhook payload
  const parseResult = zoomChatWebhookPayloadSchema.safeParse(body);
  if (!parseResult.success) {
    console.warn(
      "[Zoom Webhook] Payload validation failed:",
      parseResult.error.issues
    );
    return NextResponse.json(
      { error: "Invalid webhook payload", details: parseResult.error.issues },
      { status: 400 }
    );
  }

  const { event, payload } = parseResult.data;
  const { account_id, object } = payload;

  // Look up tenant by Zoom account ID
  const tenantId = await getTenantByZoomAccountId(account_id);
  if (!tenantId) {
    console.warn(
      `[Zoom Webhook] No tenant found for Zoom account ${account_id}`
    );
    // Return 200 to prevent Zoom retries — the account isn't registered
    return NextResponse.json({
      message: "Account not registered",
    });
  }

  try {
    switch (event) {
      case "chat_message.sent": {
        // Determine channel type: if channel_id is present → channel, else DM
        const channelType = object.channel_id ? "channel" : "dm";

        const result = await insertZoomChatMessage({
          tenant_id: tenantId,
          zoom_user_id: object.operator_id,
          message_id: object.id,
          channel_id: object.channel_id ?? null,
          channel_type: channelType,
          sender_id: object.operator_id,
          sender_name: object.operator,
          message_content: object.message ?? null,
          message_timestamp: new Date(object.date_time),
          raw_payload: body as object,
        });

        if (!result) {
          return NextResponse.json({
            message: "Message already processed",
            messageId: object.id,
          });
        }

        console.log(
          `[Zoom Webhook] Stored chat message ${object.id} for tenant ${tenantId}`
        );

        return NextResponse.json(
          {
            message: "Chat message received and stored",
            id: result.id,
            messageId: result.message_id,
          },
          { status: 201 }
        );
      }

      case "chat_message.updated": {
        const updated = await updateZoomChatMessage(
          tenantId,
          object.id,
          object.message ?? ""
        );

        if (!updated) {
          console.warn(
            `[Zoom Webhook] Message ${object.id} not found for update`
          );
        }

        return NextResponse.json({
          message: "Message update processed",
          messageId: object.id,
        });
      }

      case "chat_message.deleted": {
        const deleted = await softDeleteZoomChatMessage(
          tenantId,
          object.id
        );

        if (!deleted) {
          console.warn(
            `[Zoom Webhook] Message ${object.id} not found for deletion`
          );
        }

        return NextResponse.json({
          message: "Message deletion processed",
          messageId: object.id,
        });
      }

      default:
        console.log(
          `[Zoom Webhook] Unhandled event type: ${event}`
        );
        return NextResponse.json({
          message: `Event type ${event} not handled`,
        });
    }
  } catch (error) {
    console.error("[Zoom Webhook] Error processing event:", error);

    // Handle duplicate key violations gracefully
    if (
      error instanceof Error &&
      error.message.includes("duplicate key value")
    ) {
      return NextResponse.json({
        message: "Message already processed",
      });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
