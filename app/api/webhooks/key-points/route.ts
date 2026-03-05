import { NextRequest, NextResponse } from "next/server";
import {
  insertWebhookKeyPoints,
  webhookExists,
} from "@/lib/krisp/webhookKeyPoints";
import type { KrispWebhook, WebhookEventType } from "@/types/webhook";
import { db } from "@/lib/db";
import { users, webhookSecrets } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { timingSafeEqual } from "crypto";
import { extractActionItemsForMeeting } from "@/lib/actions/extractActionItems";
import { dispatchWebhooks } from "@/lib/webhooks/dispatch";

const SUPPORTED_EVENTS: WebhookEventType[] = [
  "key_points_generated",
  "transcript_created",
];

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

/**
 * Extracts the token from the Authorization header.
 * Supports both "Bearer <token>" and raw token formats.
 */
function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return null;
  return authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
}

/**
 * Timing-safe string comparison using Node.js crypto.
 */
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * Validates the authorization token against the user's stored secret,
 * falling back to the global WEBHOOK_SECRET env var.
 */
async function validateAuthorization(
  request: NextRequest,
  userId: string
): Promise<boolean> {
  const token = extractToken(request);

  // Check per-user secret from database
  const [row] = await db
    .select({ secret: webhookSecrets.secret })
    .from(webhookSecrets)
    .where(
      and(eq(webhookSecrets.userId, userId), eq(webhookSecrets.name, "Krisp"))
    );

  if (row) {
    // User has a configured secret — token is required
    if (!token) return false;
    return safeCompare(token, row.secret);
  }

  // Fall back to global WEBHOOK_SECRET env var
  if (!WEBHOOK_SECRET) {
    console.warn("No per-user or global WEBHOOK_SECRET configured - authorization disabled");
    return true;
  }

  if (!token) return false;
  return safeCompare(token, WEBHOOK_SECRET);
}

export async function POST(request: NextRequest) {
  try {
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

    // Validate authorization against user's secret (or global fallback)
    if (!(await validateAuthorization(request, userId))) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
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

    // Fire outbound webhooks (non-blocking)
    dispatchWebhooks(userId, "meeting.ingested", result.id, {
      meetingTitle: payload.data?.meeting?.title || null,
      meetingId: payload.data?.meeting?.id || null,
      webhookId: payload.id,
      eventType: payload.event,
    }).catch(() => {});

    // Auto-extract action items in the background (non-blocking)
    // Uses the user's default board for Kanban card creation
    const [userRow] = await db
      .select({ defaultBoardId: users.defaultBoardId })
      .from(users)
      .where(eq(users.id, userId));

    if (!userRow?.defaultBoardId) {
      console.warn(
        `User ${userId} has no default board configured — action items will be saved without Kanban cards`
      );
    }

    extractActionItemsForMeeting(
      result.id,
      userId,
      userRow?.defaultBoardId || undefined,
      "auto_webhook"
    ).catch((err) =>
      console.error(
        `Auto-extraction failed for meeting ${result.id}:`,
        err
      )
    );

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

    // Validate authorization against user's secret (or global fallback)
    if (!(await validateAuthorization(request, userId))) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
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
