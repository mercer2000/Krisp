import type { EmailWebhookPayload } from "@/types/email";

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

/**
 * Fetch messages from the authenticated user's Outlook inbox using delegated permissions.
 * Uses /me/mailFolders/inbox/messages (delegated auth, not app-only).
 */
export async function fetchOutlookInboxMessages(
  accessToken: string,
  opts: { top?: number; skip?: number; after?: string } = {}
): Promise<{ messages: EmailWebhookPayload[]; nextLink: string | null }> {
  const top = opts.top ?? 25;
  const skip = opts.skip ?? 0;

  const select = [
    "id",
    "from",
    "toRecipients",
    "ccRecipients",
    "bccRecipients",
    "subject",
    "bodyPreview",
    "body",
    "receivedDateTime",
    "hasAttachments",
    "webLink",
  ].join(",");

  const params = new URLSearchParams({
    $select: select,
    $top: String(top),
    $skip: String(skip),
    $orderby: "receivedDateTime desc",
  });

  if (opts.after) {
    // Validate ISO date format to prevent query injection
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    if (isoDateRegex.test(opts.after)) {
      params.set("$filter", `receivedDateTime ge ${opts.after}`);
    }
  }

  const url = `${GRAPH_BASE}/me/mailFolders/inbox/messages?${params.toString()}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Graph API fetch failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  const messages: EmailWebhookPayload[] = (data.value || []).map(mapGraphMessage);
  const nextLink = data["@odata.nextLink"] || null;

  return { messages, nextLink };
}

/**
 * Fetch the authenticated user's email address from /me.
 */
export async function fetchOutlookUserEmail(accessToken: string): Promise<string> {
  const res = await fetch(`${GRAPH_BASE}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch user profile: ${res.status}`);
  }

  const data = await res.json();
  return data.mail || data.userPrincipalName || "";
}

/**
 * Map a Graph API message object to our EmailWebhookPayload format.
 */
function mapGraphMessage(msg: Record<string, unknown>): EmailWebhookPayload {
  const extractEmail = (r: { emailAddress?: { address?: string } }) =>
    r?.emailAddress?.address || "";

  const from = msg.from as { emailAddress?: { address?: string } } | undefined;
  const toRecipients = (msg.toRecipients || []) as { emailAddress?: { address?: string } }[];
  const ccRecipients = (msg.ccRecipients || []) as { emailAddress?: { address?: string } }[];
  const bccRecipients = (msg.bccRecipients || []) as { emailAddress?: { address?: string } }[];
  const body = msg.body as { contentType?: string; content?: string } | undefined;

  return {
    messageId: msg.id as string,
    from: from?.emailAddress?.address || "",
    to: toRecipients.map(extractEmail).filter(Boolean),
    cc: ccRecipients.map(extractEmail).filter(Boolean),
    bcc: bccRecipients.map(extractEmail).filter(Boolean),
    subject: (msg.subject as string) || "",
    bodyPlainText: (msg.bodyPreview as string) || "",
    bodyHtml: body?.contentType === "html" ? body.content || "" : "",
    receivedDateTime: (msg.receivedDateTime as string) || new Date().toISOString(),
    webLink: (msg.webLink as string) || undefined,
  };
}
