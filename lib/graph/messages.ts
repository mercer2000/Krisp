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
 * Delete a message using the delegated /me/ endpoint (for Outlook OAuth tokens).
 * Returns true on success (204 No Content), false otherwise.
 */
export async function deleteGraphMessageMe(
  messageId: string,
  accessToken: string
): Promise<boolean> {
  const url = `https://graph.microsoft.com/v1.0/me/messages/${encodeURIComponent(messageId)}`;

  try {
    const res = await fetch(url, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (res.status === 204 || res.status === 200) return true;

    const body = await res.text().catch(() => "");
    console.warn(
      `[Graph] Failed to delete message (me) ${messageId}: ${res.status}`,
      body
    );
    return false;
  } catch (err) {
    console.warn(`[Graph] Error deleting message (me) ${messageId}:`, err);
    return false;
  }
}

/**
 * Send a new email via Microsoft Graph API.
 * Used for forwarding emails to external recipients.
 * Requires Mail.Send permission.
 */
export async function sendGraphMail(
  userMailbox: string,
  accessToken: string,
  options: {
    to: string[];
    subject: string;
    bodyHtml: string;
  }
): Promise<boolean> {
  const url = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(userMailbox)}/sendMail`;

  const payload = {
    message: {
      subject: options.subject,
      body: {
        contentType: "HTML",
        content: options.bodyHtml,
      },
      toRecipients: options.to.map((email) => ({
        emailAddress: { address: email },
      })),
    },
    saveToSentItems: true,
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (res.status === 202 || res.status === 200) return true;

    const body = await res.text().catch(() => "");
    console.warn(
      `[Graph] Failed to send mail from ${userMailbox}: ${res.status}`,
      body
    );
    return false;
  } catch (err) {
    console.warn(`[Graph] Error sending mail from ${userMailbox}:`, err);
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

/**
 * Fetch a single message using the delegated /me/ endpoint (for Outlook OAuth tokens).
 * Same as fetchGraphMessage but uses /me/ instead of /users/{mailbox}/.
 */
export async function fetchGraphMessageMe(
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

  const url = `https://graph.microsoft.com/v1.0/me/messages/${encodeURIComponent(messageId)}?$select=${select}`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      console.warn(
        `[Graph] Failed to fetch message (me) ${messageId}: ${res.status}`
      );
      return null;
    }

    const msg = await res.json();

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
    console.warn(`[Graph] Error fetching message (me) ${messageId}:`, err);
    return null;
  }
}

/**
 * Reply to a message via Microsoft Graph API.
 * Uses the native reply endpoint which preserves email threading.
 * The `message.body` replaces the default reply body; Graph still quotes the original.
 */
export async function replyGraphMessage(
  userMailbox: string,
  accessToken: string,
  messageId: string,
  options: {
    bodyHtml: string;
    to?: string[];
    cc?: string[];
    bcc?: string[];
  }
): Promise<boolean> {
  const url = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(userMailbox)}/messages/${encodeURIComponent(messageId)}/reply`;

  const message: Record<string, unknown> = {
    body: { contentType: "HTML", content: options.bodyHtml },
  };
  if (options.to?.length) {
    message.toRecipients = options.to.map((e) => ({ emailAddress: { address: e } }));
  }
  if (options.cc?.length) {
    message.ccRecipients = options.cc.map((e) => ({ emailAddress: { address: e } }));
  }
  if (options.bcc?.length) {
    message.bccRecipients = options.bcc.map((e) => ({ emailAddress: { address: e } }));
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    if (res.status === 202 || res.status === 200) return true;

    const body = await res.text().catch(() => "");
    console.warn(`[Graph] Failed to reply to ${messageId}: ${res.status}`, body);
    return false;
  } catch (err) {
    console.warn(`[Graph] Error replying to ${messageId}:`, err);
    return false;
  }
}

/**
 * Reply-all to a message via Microsoft Graph API.
 * Preserves all original recipients; optional overrides for to/cc/bcc.
 */
export async function replyAllGraphMessage(
  userMailbox: string,
  accessToken: string,
  messageId: string,
  options: {
    bodyHtml: string;
    to?: string[];
    cc?: string[];
    bcc?: string[];
  }
): Promise<boolean> {
  const url = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(userMailbox)}/messages/${encodeURIComponent(messageId)}/replyAll`;

  const message: Record<string, unknown> = {
    body: { contentType: "HTML", content: options.bodyHtml },
  };
  if (options.to?.length) {
    message.toRecipients = options.to.map((e) => ({ emailAddress: { address: e } }));
  }
  if (options.cc?.length) {
    message.ccRecipients = options.cc.map((e) => ({ emailAddress: { address: e } }));
  }
  if (options.bcc?.length) {
    message.bccRecipients = options.bcc.map((e) => ({ emailAddress: { address: e } }));
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    if (res.status === 202 || res.status === 200) return true;

    const body = await res.text().catch(() => "");
    console.warn(`[Graph] Failed to replyAll to ${messageId}: ${res.status}`, body);
    return false;
  } catch (err) {
    console.warn(`[Graph] Error replying all to ${messageId}:`, err);
    return false;
  }
}

/**
 * Forward a message via Microsoft Graph API with HTML body.
 * Uses createForward → patch draft → send pattern to support HTML
 * while preserving email threading.
 */
export async function forwardGraphMessage(
  userMailbox: string,
  accessToken: string,
  messageId: string,
  options: {
    bodyHtml: string;
    to: string[];
    cc?: string[];
    bcc?: string[];
  }
): Promise<boolean> {
  const baseUrl = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(userMailbox)}`;
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  try {
    // Step 1: Create forward draft
    const createRes = await fetch(
      `${baseUrl}/messages/${encodeURIComponent(messageId)}/createForward`,
      { method: "POST", headers }
    );

    if (!createRes.ok) {
      const body = await createRes.text().catch(() => "");
      console.warn(`[Graph] Failed to createForward for ${messageId}: ${createRes.status}`, body);
      return false;
    }

    const draft = await createRes.json();
    const draftId = draft.id;

    // Step 2: Update draft with HTML body and recipients
    const patchPayload: Record<string, unknown> = {
      body: { contentType: "HTML", content: options.bodyHtml },
      toRecipients: options.to.map((e) => ({ emailAddress: { address: e } })),
    };
    if (options.cc?.length) {
      patchPayload.ccRecipients = options.cc.map((e) => ({ emailAddress: { address: e } }));
    }
    if (options.bcc?.length) {
      patchPayload.bccRecipients = options.bcc.map((e) => ({ emailAddress: { address: e } }));
    }

    const patchRes = await fetch(
      `${baseUrl}/messages/${encodeURIComponent(draftId)}`,
      { method: "PATCH", headers, body: JSON.stringify(patchPayload) }
    );

    if (!patchRes.ok) {
      const body = await patchRes.text().catch(() => "");
      console.warn(`[Graph] Failed to patch forward draft ${draftId}: ${patchRes.status}`, body);
      return false;
    }

    // Step 3: Send the draft
    const sendRes = await fetch(
      `${baseUrl}/messages/${encodeURIComponent(draftId)}/send`,
      { method: "POST", headers }
    );

    if (sendRes.status === 202 || sendRes.status === 200) return true;

    const body = await sendRes.text().catch(() => "");
    console.warn(`[Graph] Failed to send forward draft ${draftId}: ${sendRes.status}`, body);
    return false;
  } catch (err) {
    console.warn(`[Graph] Error forwarding message ${messageId}:`, err);
    return false;
  }
}

/**
 * Fetch the conversation thread for a message.
 * First fetches the message's conversationId, then retrieves all messages
 * in that conversation ordered chronologically.
 */
export async function fetchConversationThread(
  userMailbox: string,
  accessToken: string,
  messageId: string
): Promise<
  {
    from: string;
    date: string;
    subject: string;
    bodyPreview: string;
  }[]
> {
  const baseUrl = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(userMailbox)}`;
  const headers = { Authorization: `Bearer ${accessToken}` };

  try {
    // Step 1: Get conversationId from the message
    const msgRes = await fetch(
      `${baseUrl}/messages/${encodeURIComponent(messageId)}?$select=conversationId`,
      { headers }
    );
    if (!msgRes.ok) return [];

    const msg = await msgRes.json();
    const conversationId = msg.conversationId;
    if (!conversationId) return [];

    // Step 2: Fetch all messages in this conversation
    const threadRes = await fetch(
      `${baseUrl}/messages?$filter=conversationId eq '${conversationId}'&$select=from,receivedDateTime,subject,bodyPreview&$orderby=receivedDateTime asc&$top=25`,
      { headers }
    );
    if (!threadRes.ok) return [];

    const threadData = await threadRes.json();
    return (threadData.value || []).map(
      (m: {
        from?: { emailAddress?: { address?: string } };
        receivedDateTime?: string;
        subject?: string;
        bodyPreview?: string;
      }) => ({
        from: m.from?.emailAddress?.address || "unknown",
        date: m.receivedDateTime || "",
        subject: m.subject || "",
        bodyPreview: m.bodyPreview || "",
      })
    );
  } catch (err) {
    console.warn(`[Graph] Error fetching conversation thread:`, err);
    return [];
  }
}
