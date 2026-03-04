import { NextRequest, NextResponse, after } from "next/server";
import { insertEmail, emailExists } from "@/lib/email/emails";
import { emailWebhookPayloadSchema } from "@/lib/validators/schemas";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { autoProcessEmailActions } from "@/lib/actions/autoProcessEmailActions";

const EMAIL_WEBHOOK_SECRET = process.env.EMAIL_WEBHOOK_SECRET;

/**
 * Validates the X-API-Key header against the configured secret.
 * Uses timing-safe comparison to prevent timing attacks.
 */
function validateApiKey(request: NextRequest): boolean {
  if (!EMAIL_WEBHOOK_SECRET) {
    console.warn("EMAIL_WEBHOOK_SECRET not configured - authorization disabled");
    return true;
  }

  const apiKey = request.headers.get("x-api-key");
  if (!apiKey) {
    return false;
  }

  if (apiKey.length !== EMAIL_WEBHOOK_SECRET.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < apiKey.length; i++) {
    result |= apiKey.charCodeAt(i) ^ EMAIL_WEBHOOK_SECRET.charCodeAt(i);
  }
  return result === 0;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    // Validate API key
    if (!validateApiKey(request)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { tenantId } = await params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tenantId)) {
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
      return NextResponse.json(
        { error: "Tenant not found" },
        { status: 404 }
      );
    }

    // Parse and validate payload
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    const parsed = emailWebhookPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const payload = parsed.data;

    // Check for duplicate (idempotency via tenant_id + message_id)
    const exists = await emailExists(tenantId, payload.messageId);
    if (exists) {
      return NextResponse.json(
        { message: "Email already processed", messageId: payload.messageId },
        { status: 200 }
      );
    }

    // Insert the email
    const result = await insertEmail(payload, tenantId);

    // Auto-extract action items and create Kanban cards in background
    after(async () => {
      try {
        await autoProcessEmailActions(tenantId, {
          sender: payload.from,
          recipients: payload.to,
          subject: payload.subject ?? null,
          bodyPlainText: payload.bodyPlainText ?? null,
          receivedAt: payload.receivedDateTime,
        });
      } catch (err) {
        console.error(
          `[M365] Error auto-processing actions for message ${payload.messageId}:`,
          err instanceof Error ? err.message : err
        );
      }
    });

    return NextResponse.json(
      {
        message: "Email received and stored successfully",
        id: result.id,
        messageId: result.message_id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error processing email webhook:", error);

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
