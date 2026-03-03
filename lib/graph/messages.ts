import type { EmailWebhookPayload } from "@/types/email";

/**
 * Extract the user email/ID from a Graph resource path.
 * e.g. "users/user@domain.com/mailFolders/inbox/messages/AAMk..."
 *    → "user@domain.com"
 */
export function extractUserFromResource(resource: string): string | null {
  const parts = resource.split("/");
  const usersIdx = parts.indexOf("users");
  if (usersIdx === -1 || usersIdx + 1 >= parts.length) return null;
  return parts[usersIdx + 1];
}

/**
 * Delete a message from the mailbox via Microsoft Graph API.
 * Returns true on success (204 No Content), false otherwise.
 */
export async function deleteGraphMessage(
  userMailbox: string,
  messageId: string,
  accessToken: string
): Promise<boolean> {
  const url = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(userMailbox)}/messages/${encodeURIComponent(messageId)}`;

  try {
    const res = await fetch(url, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (res.status === 204 || res.status === 200) return true;

    const body = await res.text().catch(() => "");
    console.warn(
      `[Graph] Failed to delete message ${messageId}: ${res.status}`,
      body
    );
    return false;
  } catch (err) {
    console.warn(`[Graph] Error deleting message ${messageId}:`, err);
    return false;
  }
}

/**
 * Fetch a single message from the Microsoft Graph API and return it
 * in EmailWebhookPayload format.
 */
export async function fetchGraphMessage(
  userMailbox: string,
  messageId: string,
  accessToken: string
): Promise<EmailWebhookPayload | null> {
  const select = [
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

  const url = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(userMailbox)}/messages/${encodeURIComponent(messageId)}?$select=${select}`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      console.warn(
        `[Graph] Failed to fetch message ${messageId}: ${res.status}`
      );
      return null;
    }

    const msg = await res.json();

    console.log(
      `[Graph] Message ${messageId} webLink value:`,
      JSON.stringify(msg.webLink),
      `| keys:`,
      Object.keys(msg).filter((k) => k.toLowerCase().includes("link") || k.toLowerCase().includes("web"))
    );

    const extractEmail = (r: { emailAddress?: { address?: string } }) =>
      r?.emailAddress?.address || "";

    return {
      messageId,
      from: msg.from?.emailAddress?.address || "",
      to: (msg.toRecipients || []).map(extractEmail).filter(Boolean),
      cc: (msg.ccRecipients || []).map(extractEmail).filter(Boolean),
      bcc: (msg.bccRecipients || []).map(extractEmail).filter(Boolean),
      subject: msg.subject || "",
      bodyPlainText: msg.bodyPreview || "",
      bodyHtml:
        msg.body?.contentType === "html" ? msg.body.content || "" : "",
      receivedDateTime: msg.receivedDateTime || new Date().toISOString(),
      webLink: msg.webLink || undefined,
    };
  } catch (err) {
    console.warn(`[Graph] Error fetching message ${messageId}:`, err);
    return null;
  }
}
