import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { outboundWebhooks, outboundWebhookDeliveries } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { updateOutboundWebhookSchema } from "@/lib/validators/schemas";

/**
 * GET /api/outbound-webhooks/[id]
 * Get a single outbound webhook with recent delivery history.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [webhook] = await db
      .select()
      .from(outboundWebhooks)
      .where(
        and(eq(outboundWebhooks.id, id), eq(outboundWebhooks.userId, userId))
      );

    if (!webhook) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Fetch recent deliveries
    const deliveries = await db
      .select({
        id: outboundWebhookDeliveries.id,
        eventType: outboundWebhookDeliveries.eventType,
        statusCode: outboundWebhookDeliveries.statusCode,
        success: outboundWebhookDeliveries.success,
        errorMessage: outboundWebhookDeliveries.errorMessage,
        sentAt: outboundWebhookDeliveries.sentAt,
      })
      .from(outboundWebhookDeliveries)
      .where(eq(outboundWebhookDeliveries.webhookId, id))
      .orderBy(desc(outboundWebhookDeliveries.sentAt))
      .limit(20);

    // Mask the secret
    const { secret: _secret, ...rest } = webhook;

    return NextResponse.json({
      webhook: {
        ...rest,
        hasSecret: !!_secret,
      },
      deliveries,
    });
  } catch (error) {
    console.error("Error fetching outbound webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/outbound-webhooks/[id]
 * Update an outbound webhook.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = updateOutboundWebhookSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Verify ownership
    const [existing] = await db
      .select({ id: outboundWebhooks.id })
      .from(outboundWebhooks)
      .where(
        and(eq(outboundWebhooks.id, id), eq(outboundWebhooks.userId, userId))
      );

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
    if (parsed.data.url !== undefined) updateData.url = parsed.data.url;
    if (parsed.data.secret !== undefined) updateData.secret = parsed.data.secret;
    if (parsed.data.events !== undefined) updateData.events = parsed.data.events;
    if (parsed.data.active !== undefined) updateData.active = parsed.data.active;

    const [updated] = await db
      .update(outboundWebhooks)
      .set(updateData)
      .where(eq(outboundWebhooks.id, id))
      .returning({
        id: outboundWebhooks.id,
        name: outboundWebhooks.name,
        url: outboundWebhooks.url,
        events: outboundWebhooks.events,
        active: outboundWebhooks.active,
        updatedAt: outboundWebhooks.updatedAt,
      });

    return NextResponse.json({ webhook: updated });
  } catch (error) {
    console.error("Error updating outbound webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/outbound-webhooks/[id]
 * Delete an outbound webhook and its delivery history.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const [existing] = await db
      .select({ id: outboundWebhooks.id })
      .from(outboundWebhooks)
      .where(
        and(eq(outboundWebhooks.id, id), eq(outboundWebhooks.userId, userId))
      );

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await db
      .delete(outboundWebhooks)
      .where(eq(outboundWebhooks.id, id));

    return NextResponse.json({ message: "Webhook deleted" });
  } catch (error) {
    console.error("Error deleting outbound webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
