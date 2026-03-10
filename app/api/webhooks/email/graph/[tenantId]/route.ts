import { NextRequest, NextResponse, after } from "next/server";
import { graphNotificationPayloadSchema } from "@/lib/validators/schemas";
import { db } from "@/lib/db";
import { users, graphSubscriptions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { insertEmail, emailExists, updateEmailByMessageId } from "@/lib/email/emails";
import {
  getGraphCredentialsByIdUnsafe,
  getGraphAccessTokenFromCreds,
} from "@/lib/graph/credentials";
import {
  fetchGraphMessage,
  extractUserFromResource,
} from "@/lib/graph/messages";
import { autoProcessEmailActions } from "@/lib/actions/autoProcessEmailActions";
import { dispatchWebhooks } from "@/lib/webhooks/dispatch";
import { classifyItem, buildEmailContent } from "@/lib/smartLabels/classify";
import { classifyItemForPages } from "@/lib/pageRules/classify";
import smartLabelSql from "@/lib/smartLabels/db";
import { logActivity } from "@/lib/activity/log";

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

    // Collect items that need async Graph API fetch after we respond
    const pendingFetches: {
      messageId: string;
      credentialId: string;
      resource: string;
    }[] = [];

    // Process each notification: validate, dedup, insert stub
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

      // Insert stub record immediately so we respond fast
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
          `[Graph] Error storing stub for message ${messageId}:`,
          err
        );
        continue;
      }

      console.log(
        `[Graph] Tenant ${tenantId}: stub inserted for ${notification.resource}, changeType=${notification.changeType}`
      );

      // Queue for async fetch if we have credentials
      if (subscription.credentialId) {
        pendingFetches.push({
          messageId,
          credentialId: subscription.credentialId,
          resource: subscription.resource,
        });
      }
    }

    // Schedule background fetch of full email content after responding 202
    if (pendingFetches.length > 0) {
      after(async () => {
        for (const item of pendingFetches) {
          try {
            const creds = await getGraphCredentialsByIdUnsafe(item.credentialId);
            if (!creds) {
              console.warn(`[Graph] Credential ${item.credentialId} not found for async fetch`);
              continue;
            }

            const token = await getGraphAccessTokenFromCreds(creds);
            const userMailbox = extractUserFromResource(item.resource);
            if (!userMailbox) {
              console.warn(`[Graph] Could not extract user from resource: ${item.resource}`);
              continue;
            }

            const fullEmail = await fetchGraphMessage(userMailbox, item.messageId, token);
            if (!fullEmail) {
              console.warn(`[Graph] Could not fetch full email for ${item.messageId}`);
              continue;
            }

            await updateEmailByMessageId(tenantId, item.messageId, fullEmail);
            console.log(`[Graph] Fetched full email for message ${item.messageId}`);

            // Fire outbound webhooks (non-blocking)
            dispatchWebhooks(tenantId, "email.received", item.messageId, {
              sender: fullEmail.from,
              subject: fullEmail.subject || null,
              messageId: item.messageId,
            }).catch(() => {});

            logActivity({
              userId: tenantId,
              eventType: "email.received",
              title: `Email received: "${fullEmail.subject || "(No subject)"}"`,
              description: `From ${fullEmail.from}`,
              entityType: "email",
              entityId: item.messageId,
              metadata: { sender: fullEmail.from, subject: fullEmail.subject },
            });

            // Auto-extract action items and create Kanban cards
            try {
              await autoProcessEmailActions(tenantId, {
                sender: fullEmail.from,
                recipients: fullEmail.to,
                subject: fullEmail.subject ?? null,
                bodyPlainText: fullEmail.bodyPlainText ?? null,
                receivedAt: fullEmail.receivedDateTime,
              });
            } catch (actionErr) {
              console.error(
                `[Graph] Error auto-processing actions for message ${item.messageId}:`,
                actionErr instanceof Error ? actionErr.message : actionErr
              );
            }

            // Resolve email DB row ID + build content for classifiers
            const content = buildEmailContent({
              sender: fullEmail.from,
              recipients: fullEmail.to,
              subject: fullEmail.subject ?? null,
              bodyPlainText: fullEmail.bodyPlainText ?? null,
            });
            const idRows = await smartLabelSql`
              SELECT id FROM emails
              WHERE tenant_id = ${tenantId} AND message_id = ${item.messageId}
            `;

            if (idRows[0]) {
              const emailDbId = String(idRows[0].id);

              // Smart label classification
              try {
                await classifyItem("email", emailDbId, tenantId, { content });
              } catch (classifyErr) {
                console.error(
                  `[Graph] Smart label classification failed for message ${item.messageId}:`,
                  classifyErr instanceof Error ? classifyErr.message : classifyErr
                );
              }

              // Page smart rule classification (independent of smart labels)
              try {
                await classifyItemForPages("email", emailDbId, tenantId, { content });
              } catch (pageRuleErr) {
                console.error(
                  `[Graph] Page rule classification failed for message ${item.messageId}:`,
                  pageRuleErr instanceof Error ? pageRuleErr.message : pageRuleErr
                );
              }
            } else {
              console.warn(`[Graph] Could not find email ID for message ${item.messageId} during classification`);
            }
          } catch (err) {
            console.error(
              `[Graph] Error in async fetch for message ${item.messageId}:`,
              err instanceof Error ? err.message : err
            );
          }
        }
      });
    }

    // Microsoft expects 202 Accepted — respond fast
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
