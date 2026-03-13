const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";

/**
 * Build an RFC 2822 email message and base64url-encode it for the Gmail API.
 */
function buildRawEmail(options: {
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  bodyHtml: string;
  inReplyTo?: string;
  references?: string;
  threadId?: string;
}): string {
  const lines: string[] = [];
  lines.push(`From: ${options.from}`);
  lines.push(`To: ${options.to.join(", ")}`);
  if (options.cc?.length) lines.push(`Cc: ${options.cc.join(", ")}`);
  if (options.bcc?.length) lines.push(`Bcc: ${options.bcc.join(", ")}`);
  lines.push(`Subject: ${options.subject}`);
  if (options.inReplyTo) lines.push(`In-Reply-To: ${options.inReplyTo}`);
  if (options.references) lines.push(`References: ${options.references}`);
  lines.push("MIME-Version: 1.0");
  lines.push('Content-Type: text/html; charset="UTF-8"');
  lines.push("");
  lines.push(options.bodyHtml);

  const raw = lines.join("\r\n");
  // base64url encode
  return Buffer.from(raw)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Fetch the Message-ID header and References for threading.
 */
async function fetchMessageHeaders(
  accessToken: string,
  gmailMessageId: string
): Promise<{ messageIdHeader: string | null; references: string | null; subject: string | null }> {
  try {
    const res = await fetch(
      `${GMAIL_API_BASE}/messages/${gmailMessageId}?format=metadata&metadataHeaders=Message-ID&metadataHeaders=References&metadataHeaders=Subject`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!res.ok) return { messageIdHeader: null, references: null, subject: null };
    const data = await res.json();
    const headers: Array<{ name: string; value: string }> = data.payload?.headers || [];
    const messageIdHeader = headers.find((h) => h.name.toLowerCase() === "message-id")?.value || null;
    const references = headers.find((h) => h.name.toLowerCase() === "references")?.value || null;
    const subject = headers.find((h) => h.name.toLowerCase() === "subject")?.value || null;
    return { messageIdHeader, references, subject };
  } catch {
    return { messageIdHeader: null, references: null, subject: null };
  }
}

/**
 * Reply to a Gmail message. Sends a new message in the same thread
 * with proper In-Reply-To and References headers for threading.
 */
export async function replyGmailMessage(
  accessToken: string,
  gmailMessageId: string,
  threadId: string,
  senderEmail: string,
  options: {
    bodyHtml: string;
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
  }
): Promise<boolean> {
  const headers = await fetchMessageHeaders(accessToken, gmailMessageId);

  const replySubject = options.subject.startsWith("Re:") ? options.subject : `Re: ${options.subject}`;
  const refs = [headers.references, headers.messageIdHeader].filter(Boolean).join(" ");

  const raw = buildRawEmail({
    from: senderEmail,
    to: options.to,
    cc: options.cc,
    bcc: options.bcc,
    subject: replySubject,
    bodyHtml: options.bodyHtml,
    inReplyTo: headers.messageIdHeader || undefined,
    references: refs || undefined,
    threadId,
  });

  try {
    const res = await fetch(`${GMAIL_API_BASE}/messages/send`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw, threadId }),
    });

    if (res.ok) return true;

    const body = await res.text().catch(() => "");
    console.warn(`[Gmail] Failed to send reply for ${gmailMessageId}: ${res.status}`, body);
    return false;
  } catch (err) {
    console.warn(`[Gmail] Error replying to ${gmailMessageId}:`, err);
    return false;
  }
}

/**
 * Reply-all to a Gmail message. Same as reply but includes all original recipients.
 */
export async function replyAllGmailMessage(
  accessToken: string,
  gmailMessageId: string,
  threadId: string,
  senderEmail: string,
  options: {
    bodyHtml: string;
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
  }
): Promise<boolean> {
  // replyAll is the same send mechanism, just with more recipients (caller provides full lists)
  return replyGmailMessage(accessToken, gmailMessageId, threadId, senderEmail, options);
}

/**
 * Forward a Gmail message. Sends a new message with "Fwd:" prefix
 * and the original body included.
 */
export async function forwardGmailMessage(
  accessToken: string,
  gmailMessageId: string,
  senderEmail: string,
  options: {
    bodyHtml: string;
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    originalBody: string;
    originalSender: string;
    originalDate: string;
  }
): Promise<boolean> {
  const fwdSubject = options.subject.startsWith("Fwd:") ? options.subject : `Fwd: ${options.subject}`;

  // Build forwarded body with original message quoted below
  const forwardedHtml = [
    options.bodyHtml,
    '<br><br><hr style="border:none;border-top:1px solid #ccc">',
    "<p><strong>---------- Forwarded message ----------</strong></p>",
    `<p><strong>From:</strong> ${options.originalSender}<br>`,
    `<strong>Date:</strong> ${options.originalDate}<br>`,
    `<strong>Subject:</strong> ${options.subject}</p>`,
    "<br>",
    options.originalBody,
  ].join("\n");

  const raw = buildRawEmail({
    from: senderEmail,
    to: options.to,
    cc: options.cc,
    bcc: options.bcc,
    subject: fwdSubject,
    bodyHtml: forwardedHtml,
  });

  try {
    const res = await fetch(`${GMAIL_API_BASE}/messages/send`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw }),
    });

    if (res.ok) return true;

    const body = await res.text().catch(() => "");
    console.warn(`[Gmail] Failed to forward ${gmailMessageId}: ${res.status}`, body);
    return false;
  } catch (err) {
    console.warn(`[Gmail] Error forwarding ${gmailMessageId}:`, err);
    return false;
  }
}

/**
 * Fetch the conversation thread for a Gmail message using its threadId.
 * Returns messages in chronological order with sender, date, subject, and preview.
 */
export async function fetchGmailThread(
  accessToken: string,
  threadId: string
): Promise<
  {
    from: string;
    date: string;
    subject: string;
    bodyPreview: string;
  }[]
> {
  try {
    const res = await fetch(
      `${GMAIL_API_BASE}/threads/${threadId}?format=metadata&metadataHeaders=From&metadataHeaders=Date&metadataHeaders=Subject`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!res.ok) return [];

    const data = await res.json();
    const messages: Array<{
      id: string;
      internalDate: string;
      payload: { headers: Array<{ name: string; value: string }> };
      snippet: string;
    }> = data.messages || [];

    // Sort by internalDate ascending (chronological)
    messages.sort((a, b) => parseInt(a.internalDate) - parseInt(b.internalDate));

    return messages.map((m) => {
      const headers = m.payload?.headers || [];
      const getHeader = (name: string) =>
        headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

      return {
        from: getHeader("From"),
        date: getHeader("Date") || new Date(parseInt(m.internalDate)).toISOString(),
        subject: getHeader("Subject"),
        bodyPreview: m.snippet || "",
      };
    });
  } catch (err) {
    console.warn(`[Gmail] Error fetching thread ${threadId}:`, err);
    return [];
  }
}
