import { NextRequest, NextResponse } from "next/server";
import {
  insertWebhookKeyPoints,
  webhookExists,
} from "@/lib/krisp/webhookKeyPoints";
import type { KrispWebhook, WebhookEventType } from "@/types/webhook";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const SUPPORTED_EVENTS: WebhookEventType[] = [
  "key_points_generated",
  "transcript_created",
];

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

/**
 * Validates the authorization header against the configured webhook secret.
 * Supports both "Bearer <token>" and raw token formats.
 */
function validateAuthorization(request: NextRequest): boolean {
  if (!WEBHOOK_SECRET) {
    console.warn("WEBHOOK_SECRET not configured - authorization disabled");
    return true;
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return false;
  }

  // Support both "Bearer <token>" and raw token formats
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;

  // Use timing-safe comparison to prevent timing attacks
  if (token.length !== WEBHOOK_SECRET.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ WEBHOOK_SECRET.charCodeAt(i);
  }
  return result === 0;
}

export async function POST(request: NextRequest) {
  try {
    // Validate authorization header
    if (!validateAuthorization(request)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Extract user_id from query parameter
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json(
        { error: "Missing required query parameter: user_id" },
        { status: 400 }
      );
    }

    // Validate that the user exists
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return NextResponse.json(
        { error: "Invalid user_id: user not found" },
        { status: 404 }
      );
    }

    const payload = (await request.json()) as KrispWebhook;

    // Validate required fields
    if (!payload.id || !payload.event || !payload.data) {
      return NextResponse.json(
        { error: "Invalid webhook payload: missing required fields" },
        { status: 400 }
      );
    }

    // Check if this is a supported event type
    if (!SUPPORTED_EVENTS.includes(payload.event as WebhookEventType)) {
      return NextResponse.json(
        { error: `Unsupported event type: ${payload.event}` },
        { status: 400 }
      );
    }

    // Validate meeting data
    if (!payload.data.meeting || !payload.data.meeting.id) {
      return NextResponse.json(
        { error: "Invalid webhook payload: missing meeting data" },
        { status: 400 }
      );
    }

    // Check for duplicate webhook (idempotency)
    const exists = await webhookExists(payload.id);
    if (exists) {
      return NextResponse.json(
        { message: "Webhook already processed", webhook_id: payload.id },
        { status: 200 }
      );
    }

    // Insert the webhook data with user association
    const result = await insertWebhookKeyPoints(payload, userId);

    return NextResponse.json(
      {
        message: "Webhook received and stored successfully",
        id: result.id,
        webhook_id: result.webhook_id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error processing webhook:", error);

    // Handle unique constraint violation (duplicate webhook_id)
    if (
      error instanceof Error &&
      error.message.includes("duplicate key value")
    ) {
      return NextResponse.json(
        { message: "Webhook already processed" },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint to retrieve stored webhooks
export async function GET(request: NextRequest) {
  try {
    // Validate authorization header
    if (!validateAuthorization(request)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    const meetingId = searchParams.get("meeting_id");
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    if (!userId) {
      return NextResponse.json(
        { error: "Missing required query parameter: user_id" },
        { status: 400 }
      );
    }

    const {
      getWebhookKeyPointsByMeetingId,
      getRecentWebhookKeyPoints,
    } = await import("@/lib/krisp/webhookKeyPoints");

    let results;
    if (meetingId) {
      results = await getWebhookKeyPointsByMeetingId(meetingId, userId);
    } else {
      results = await getRecentWebhookKeyPoints(userId, limit);
    }

    return NextResponse.json({ data: results }, { status: 200 });
  } catch (error) {
    console.error("Error fetching webhooks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
