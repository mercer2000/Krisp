import { NextRequest, NextResponse } from "next/server";
import { graphNotificationPayloadSchema } from "@/lib/validators/schemas";
import { db } from "@/lib/db";
import { users, graphSubscriptions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { insertEmail, emailExists } from "@/lib/email/emails";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET handler for Microsoft Graph subscription validation.
 *
 * When a subscription is created, Microsoft sends a GET request with a
 * `validationToken` query parameter. The endpoint must respond with the
 * token value as text/plain within 10 seconds.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const validationToken = request.nextUrl.searchParams.get("validationToken");

  if (!validationToken) {
    return NextResponse.json(
      { error: "Missing validationToken" },
      { status: 400 }
    );
  }

  const { tenantId } = await params;

  if (!UUID_REGEX.test(tenantId)) {
    return NextResponse.json(
      { error: "Invalid tenant ID format" },
      { status: 400 }
    );
  }

  // Validate that the tenant exists
  const [tenant] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, tenantId));

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  // Echo back the validation token as text/plain (required by Microsoft Graph)
  return new NextResponse(validationToken, {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}

/**
 * POST handler for Microsoft Graph change notifications.
 *
 * When a subscribed resource changes, Microsoft sends a POST with a
 * JSON body containing an array of notification objects. Each notification
 * includes the subscriptionId and clientState for verification.
 *
 * Important: Microsoft expects a 202 response within 3 seconds.
 * Heavy processing should be done asynchronously.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params;

    if (!UUID_REGEX.test(tenantId)) {
      return NextResponse.json(
        { error: "Invalid tenant ID format" },
        { status: 400 }
      );
    }

    // Microsoft Graph sends validation via POST with validationToken in query string.
    // Must respond with 200 and the token as text/plain.
    const validationToken =
      request.nextUrl.searchParams.get("validationToken");
    if (validationToken) {
      return new NextResponse(validationToken, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    // Parse the notification payload
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    const parsed = graphNotificationPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const notifications = parsed.data.value;

    // Process each notification
    for (const notification of notifications) {
      // Validate clientState against stored subscription
      const [subscription] = await db
        .select()
        .from(graphSubscriptions)
        .where(
          and(
            eq(graphSubscriptions.subscriptionId, notification.subscriptionId),
            eq(graphSubscriptions.tenantId, tenantId),
            eq(graphSubscriptions.active, true)
          )
        );

      if (!subscription) {
        console.warn(
          `[Graph] Unknown subscription ${notification.subscriptionId} for tenant ${tenantId}`
        );
        continue;
      }

      if (
        notification.clientState &&
        notification.clientState !== subscription.clientState
      ) {
        console.warn(
          `[Graph] clientState mismatch for subscription ${notification.subscriptionId}`
        );
        continue;
      }

      // Extract resource data — for mail messages, the resource path
      // looks like "me/mailFolders/inbox/messages/{id}" or "users/{id}/messages/{id}"
      const messageId =
        notification.resourceData?.id || extractMessageId(notification.resource);

      if (!messageId) {
        console.warn(
          `[Graph] Could not extract message ID from notification: ${notification.resource}`
        );
        continue;
      }

      // Check for duplicate
      const exists = await emailExists(tenantId, messageId);
      if (exists) {
        continue;
      }

      // Store a stub record — full email content requires a follow-up
      // Graph API call with the tenant's OAuth token to fetch the message.
      // For now, store what we know from the notification.
      try {
        await insertEmail(
          {
            messageId,
            from: "(pending Graph API fetch)",
            to: [],
            receivedDateTime: new Date().toISOString(),
          },
          tenantId
        );
      } catch (err) {
        if (
          err instanceof Error &&
          err.message.includes("duplicate key value")
        ) {
          continue;
        }
        console.error(
          `[Graph] Error storing notification for message ${messageId}:`,
          err
        );
      }

      console.log(
        `[Graph] Tenant ${tenantId}: change notification for ${notification.resource}, changeType=${notification.changeType}`
      );
    }

    // Microsoft expects 202 Accepted
    return NextResponse.json(
      { message: "Notifications processed" },
      { status: 202 }
    );
  } catch (error) {
    console.error("Error processing Graph webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Extract a message ID from a Graph resource path.
 * e.g. "me/messages/AAMkAGI2..." -> "AAMkAGI2..."
 *      "users/xxx/mailFolders/inbox/messages/AAMkAGI2..." -> "AAMkAGI2..."
 */
function extractMessageId(resource: string): string | null {
  const parts = resource.split("/");
  const messagesIdx = parts.lastIndexOf("messages");
  if (messagesIdx !== -1 && messagesIdx + 1 < parts.length) {
    return parts[messagesIdx + 1];
  }
  return null;
}
