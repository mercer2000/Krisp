import { NextRequest, NextResponse, after } from "next/server";
import { insertGmailEmail } from "@/lib/gmail/emails";
import { processGmailNotification } from "@/lib/gmail/watch";
import {
  pubSubPushMessageSchema,
  gmailAppsScriptPayloadSchema,
} from "@/lib/validators/schemas";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { autoProcessEmailActions } from "@/lib/actions/autoProcessEmailActions";
import { dispatchWebhooks } from "@/lib/webhooks/dispatch";
import { classifyItem, buildEmailContent } from "@/lib/smartLabels/classify";
import { classifyItemForPages } from "@/lib/pageRules/classify";

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
 * `{ emailAddress, historyId }`. The actual email is fetched
 * via the Gmail API using history.list + messages.get when the
 * tenant has an active watch subscription with OAuth tokens.
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

  console.log(
    `[Gmail Pub/Sub] Tenant ${tenantId}: notification for ${decoded.emailAddress}, historyId=${decoded.historyId}`
  );

  // Attempt to fetch and store emails via Gmail API
  try {
    const result = await processGmailNotification(
      tenantId,
      decoded.historyId
    );

    if (result.emails && result.emails.length > 0) {
      let stored = 0;
      const storedEmails: (typeof result.emails[0] & { _dbId: string })[] = [];
      for (const emailData of result.emails) {
        try {
          const row = await insertGmailEmail(emailData);
          if (row) {
            stored++;
            storedEmails.push({ ...emailData, _dbId: String(row.id) });
          }
        } catch (err) {
          // Skip duplicates silently
          if (
            err instanceof Error &&
            err.message.includes("duplicate key value")
          ) {
            continue;
          }
          console.error(
            `[Gmail Pub/Sub] Failed to store email ${emailData.gmail_message_id}:`,
            err
          );
        }
      }

      // Fire outbound webhooks for each stored email (non-blocking)
      for (const emailData of storedEmails) {
        dispatchWebhooks(tenantId, "email.received", emailData.gmail_message_id, {
          sender: emailData.sender,
          subject: emailData.subject || null,
          messageId: emailData.gmail_message_id,
        }).catch(() => {});
      }

      // Auto-extract action items + smart label classification in background
      if (storedEmails.length > 0) {
        after(async () => {
          for (const emailData of storedEmails) {
            const recipients = Array.isArray(emailData.recipients)
              ? emailData.recipients.map(String)
              : [];

            // Auto-process action items
            try {
              await autoProcessEmailActions(tenantId, {
                sender: emailData.sender,
                recipients,
                subject: emailData.subject ?? null,
                bodyPlainText: emailData.body_plain ?? null,
                receivedAt:
                  emailData.received_at instanceof Date
                    ? emailData.received_at.toISOString()
                    : String(emailData.received_at),
              });
            } catch (actionErr) {
              console.error(
                `[Gmail Pub/Sub] Error auto-processing actions for ${emailData.gmail_message_id}:`,
                actionErr instanceof Error ? actionErr.message : actionErr
              );
            }

            // Smart label classification
            const content = buildEmailContent({
              sender: emailData.sender,
              recipients,
              subject: emailData.subject ?? null,
              bodyPlainText: emailData.body_plain ?? null,
            });

            try {
              await classifyItem("gmail_email", emailData._dbId, tenantId, { content });
            } catch (classifyErr) {
              console.error(
                `[Gmail Pub/Sub] Smart label classification failed for ${emailData.gmail_message_id}:`,
                classifyErr instanceof Error ? classifyErr.message : classifyErr
              );
            }

            // Page smart rule classification (independent of smart labels)
            try {
              await classifyItemForPages("gmail_email", emailData._dbId, tenantId, { content });
            } catch (pageRuleErr) {
              console.error(
                `[Gmail Pub/Sub] Page rule classification failed for ${emailData.gmail_message_id}:`,
                pageRuleErr instanceof Error ? pageRuleErr.message : pageRuleErr
              );
            }
          }
        });
      }

      return NextResponse.json(
        {
          message: "Emails fetched and stored",
          emailAddress: decoded.emailAddress,
          processed: result.processed,
          stored,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        message: "Notification processed, no new emails",
        emailAddress: decoded.emailAddress,
        historyId: decoded.historyId,
      },
      { status: 200 }
    );
  } catch (err) {
    // If no active watch subscription, acknowledge anyway to prevent
    // Pub/Sub retries — the tenant needs to set up OAuth first
    console.warn(
      `[Gmail Pub/Sub] Could not process notification for tenant ${tenantId}:`,
      err instanceof Error ? err.message : err
    );

    return NextResponse.json(
      {
        message: "Notification acknowledged (watch not configured)",
        emailAddress: decoded.emailAddress,
        historyId: decoded.historyId,
      },
      { status: 200 }
    );
  }
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

  // Fire outbound webhooks (non-blocking)
  dispatchWebhooks(tenantId, "email.received", result.id, {
    sender: payload.sender,
    subject: payload.subject || null,
    messageId: payload.messageId,
  }).catch(() => {});

  // Auto-extract action items + smart label classification in background
  after(async () => {
    try {
      await autoProcessEmailActions(tenantId, {
        sender: payload.sender,
        recipients: recipientsList,
        subject: payload.subject ?? null,
        bodyPlainText: payload.bodyPlain ?? null,
        receivedAt: payload.receivedAt,
      });
    } catch (err) {
      console.error(
        `[Gmail Apps Script] Error auto-processing actions for ${payload.messageId}:`,
        err instanceof Error ? err.message : err
      );
    }

    // Smart label classification
    const content = buildEmailContent({
      sender: payload.sender,
      recipients: recipientsList,
      subject: payload.subject ?? null,
      bodyPlainText: payload.bodyPlain ?? null,
    });

    try {
      await classifyItem("gmail_email", String(result.id), tenantId, { content });
    } catch (err) {
      console.error(
        `[Gmail Apps Script] Smart label classification failed for ${payload.messageId}:`,
        err instanceof Error ? err.message : err
      );
    }

    // Page smart rule classification (independent of smart labels)
    try {
      await classifyItemForPages("gmail_email", String(result.id), tenantId, { content });
    } catch (pageRuleErr) {
      console.error(
        `[Gmail Apps Script] Page rule classification failed for ${payload.messageId}:`,
        pageRuleErr instanceof Error ? pageRuleErr.message : pageRuleErr
      );
    }
  });

  return NextResponse.json(
    {
      message: "Email received and stored successfully",
      id: result.id,
      gmailMessageId: result.gmail_message_id,
    },
    { status: 201 }
  );
}
