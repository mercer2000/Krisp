import { db } from "@/lib/db";
import { outboundWebhooks, outboundWebhookDeliveries } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createHmac } from "crypto";

export type WebhookEventType =
  | "card.created"
  | "meeting.ingested"
  | "email.received"
  | "thought.captured";

interface WebhookPayload {
  event: WebhookEventType;
  timestamp: string;
  data: {
    entityId: string | number;
    [key: string]: unknown;
  };
}

/**
 * Fire outbound webhooks for a given user and event type.
 * Runs in the background — does not throw on delivery failures.
 */
export async function dispatchWebhooks(
  userId: string,
  event: WebhookEventType,
  entityId: string | number,
  snapshot: Record<string, unknown>
): Promise<void> {
  try {
    // Fetch all active webhooks for this user that subscribe to this event
    const hooks = await db
      .select()
      .from(outboundWebhooks)
      .where(
        and(
          eq(outboundWebhooks.userId, userId),
          eq(outboundWebhooks.active, true)
        )
      );

    // Filter to hooks that include this event type
    const matching = hooks.filter((h) => {
      const events = h.events as string[];
      return Array.isArray(events) && events.includes(event);
    });

    if (matching.length === 0) return;

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data: {
        entityId,
        ...snapshot,
      },
    };

    const body = JSON.stringify(payload);

    // Fire all webhooks concurrently
    await Promise.allSettled(
      matching.map((hook) => deliverWebhook(hook, body))
    );
  } catch (error) {
    console.error(`[outbound-webhooks] dispatch error for ${event}:`, error);
  }
}

async function deliverWebhook(
  hook: typeof outboundWebhooks.$inferSelect,
  body: string
): Promise<void> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "Krisp-Webhooks/1.0",
  };

  // Sign the payload with HMAC-SHA256 if the hook has a secret
  if (hook.secret) {
    const signature = createHmac("sha256", hook.secret)
      .update(body)
      .digest("hex");
    headers["X-Webhook-Signature"] = `sha256=${signature}`;
  }

  let statusCode: number | null = null;
  let success = false;
  let errorMessage: string | null = null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(hook.url, {
      method: "POST",
      headers,
      body,
      signal: controller.signal,
    });

    clearTimeout(timeout);
    statusCode = response.status;
    success = response.ok;

    if (!response.ok) {
      errorMessage = `HTTP ${response.status}`;
    }
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "Unknown delivery error";
  }

  // Log the delivery attempt
  try {
    await db.insert(outboundWebhookDeliveries).values({
      webhookId: hook.id,
      eventType: (JSON.parse(body) as WebhookPayload).event,
      payload: JSON.parse(body),
      statusCode,
      success,
      errorMessage,
    });
  } catch (logError) {
    console.error("[outbound-webhooks] failed to log delivery:", logError);
  }
}
