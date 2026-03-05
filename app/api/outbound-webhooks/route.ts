import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { outboundWebhooks } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { createOutboundWebhookSchema } from "@/lib/validators/schemas";

/**
 * GET /api/outbound-webhooks
 * List all outbound webhooks for the authenticated user.
 */
export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hooks = await db
      .select({
        id: outboundWebhooks.id,
        name: outboundWebhooks.name,
        url: outboundWebhooks.url,
        events: outboundWebhooks.events,
        active: outboundWebhooks.active,
        createdAt: outboundWebhooks.createdAt,
        updatedAt: outboundWebhooks.updatedAt,
      })
      .from(outboundWebhooks)
      .where(eq(outboundWebhooks.userId, userId))
      .orderBy(desc(outboundWebhooks.createdAt));

    return NextResponse.json({ webhooks: hooks });
  } catch (error) {
    console.error("Error fetching outbound webhooks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/outbound-webhooks
 * Create a new outbound webhook.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createOutboundWebhookSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const [webhook] = await db
      .insert(outboundWebhooks)
      .values({
        userId,
        name: parsed.data.name,
        url: parsed.data.url,
        secret: parsed.data.secret || null,
        events: parsed.data.events,
        active: parsed.data.active ?? true,
      })
      .returning({
        id: outboundWebhooks.id,
        name: outboundWebhooks.name,
        url: outboundWebhooks.url,
        events: outboundWebhooks.events,
        active: outboundWebhooks.active,
        createdAt: outboundWebhooks.createdAt,
      });

    return NextResponse.json({ webhook }, { status: 201 });
  } catch (error) {
    console.error("Error creating outbound webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
