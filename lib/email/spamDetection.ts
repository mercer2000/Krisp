import sql from "./db";

/**
 * Spam detection and unsubscribe link extraction.
 * Uses a combination of header analysis, sender patterns, subject patterns,
 * body content analysis, and AI classification to detect spam messages.
 * Also extracts unsubscribe links from email headers and body content.
 */

/** Common spam sender patterns */
const SPAM_SENDER_PATTERNS = [
  /noreply@/i,
  /no-reply@/i,
  /promotions@/i,
  /marketing@/i,
  /offer@/i,
  /deals@/i,
  /promo@/i,
  /sale@/i,
  /info@.*\.xyz$/i,
  /info@.*\.top$/i,
  /info@.*\.click$/i,
  /info@.*\.buzz$/i,
];

/** Common spam subject patterns */
const SPAM_SUBJECT_PATTERNS = [
  /\bfree\b.*\b(gift|trial|offer|money)\b/i,
  /\bact now\b/i,
  /\blimited time\b/i,
  /\bno obligation\b/i,
  /\bcongratulations\b.*\bwon\b/i,
  /\byou('ve| have) been selected\b/i,
  /\bclaim your\b/i,
  /\bunsubscribe\b/i,
  /\bopt.out\b/i,
  /\bdiscount\b.*\b\d+%/i,
  /\bspecial offer\b/i,
  /\bexclusive deal\b/i,
];

/** Body content spam signals */
const SPAM_BODY_PATTERNS = [
  /unsubscribe/i,
  /opt.out/i,
  /email preferences/i,
  /manage your subscription/i,
  /stop receiving/i,
  /remove yourself/i,
  /click here to unsubscribe/i,
];

/**
 * Extract unsubscribe link from email headers and body.
 * Checks List-Unsubscribe header first (RFC 2369), then falls back to body parsing.
 */
export function extractUnsubscribeLink(email: {
  rawPayload?: Record<string, unknown> | null;
  bodyHtml?: string | null;
  bodyPlainText?: string | null;
}): string | null {
  // 1. Check List-Unsubscribe header (most reliable)
  if (email.rawPayload) {
    const payload = email.rawPayload;

    // Microsoft Graph API: internetMessageHeaders
    const headers = payload.internetMessageHeaders as
      | { name: string; value: string }[]
      | undefined;
    if (headers && Array.isArray(headers)) {
      const listUnsubscribe = headers.find(
        (h) => h.name?.toLowerCase() === "list-unsubscribe"
      );
      if (listUnsubscribe?.value) {
        const link = parseUnsubscribeHeaderValue(listUnsubscribe.value);
        if (link) return link;
      }
    }

    // Gmail: check for headers in raw payload
    const gmailHeaders = (payload as Record<string, unknown>).headers as
      | { name: string; value: string }[]
      | undefined;
    if (gmailHeaders && Array.isArray(gmailHeaders) && !headers) {
      const listUnsubscribe = gmailHeaders.find(
        (h) => h.name?.toLowerCase() === "list-unsubscribe"
      );
      if (listUnsubscribe?.value) {
        const link = parseUnsubscribeHeaderValue(listUnsubscribe.value);
        if (link) return link;
      }
    }
  }

  // 2. Look for unsubscribe links in HTML body
  if (email.bodyHtml) {
    const link = extractUnsubscribeLinkFromHtml(email.bodyHtml);
    if (link) return link;
  }

  // 3. Look for unsubscribe links in plain text body
  if (email.bodyPlainText) {
    const link = extractUnsubscribeLinkFromText(email.bodyPlainText);
    if (link) return link;
  }

  return null;
}

/**
 * Parse the List-Unsubscribe header value.
 * Format: <https://example.com/unsub>, <mailto:unsub@example.com>
 * Prefer HTTPS links over mailto links.
 */
function parseUnsubscribeHeaderValue(value: string): string | null {
  const parts = value.split(",").map((p) => p.trim());

  // Prefer https links
  for (const part of parts) {
    const match = part.match(/<(https?:\/\/[^>]+)>/);
    if (match) return match[1];
  }

  // Fall back to mailto
  for (const part of parts) {
    const match = part.match(/<(mailto:[^>]+)>/);
    if (match) return match[1];
  }

  return null;
}

/**
 * Extract unsubscribe link from HTML body by looking for links with
 * unsubscribe-related text or href patterns.
 */
function extractUnsubscribeLinkFromHtml(html: string): string | null {
  // Match anchor tags with unsubscribe-related text or href
  const anchorRegex = /<a\s[^>]*href=["']([^"']+)["'][^>]*>([^<]*(?:unsubscribe|opt[- ]?out|manage\s+(?:your\s+)?(?:subscription|preferences)|stop\s+receiving)[^<]*)<\/a>/gi;
  let match;
  while ((match = anchorRegex.exec(html)) !== null) {
    const href = match[1];
    if (href && href.startsWith("http")) return href;
  }

  // Also check href values containing "unsubscribe"
  const hrefRegex = /<a\s[^>]*href=["'](https?:\/\/[^"']*(?:unsubscribe|unsub|opt[_-]?out|remove)[^"']*)["']/gi;
  while ((match = hrefRegex.exec(html)) !== null) {
    if (match[1]) return match[1];
  }

  return null;
}

/**
 * Extract unsubscribe link from plain text body.
 */
function extractUnsubscribeLinkFromText(text: string): string | null {
  // Find URLs near unsubscribe-related words
  const lines = text.split("\n");
  for (const line of lines) {
    if (/unsubscribe|opt.out|manage.+subscription/i.test(line)) {
      const urlMatch = line.match(/(https?:\/\/\S+)/);
      if (urlMatch) return urlMatch[1];
    }
  }
  return null;
}

/**
 * Detect if an email is spam based on heuristics.
 * Returns a confidence score 0-100 and extracted unsubscribe link.
 */
export function detectSpam(email: {
  sender: string;
  subject: string | null;
  bodyPlainText?: string | null;
  bodyHtml?: string | null;
  rawPayload?: Record<string, unknown> | null;
  labels?: { name: string; confidence: number | null }[];
}): { isSpam: boolean; confidence: number; signals: string[]; unsubscribeLink: string | null } {
  const signals: string[] = [];
  let score = 0;

  // 1. Check for List-Unsubscribe header (indicates bulk/marketing mail)
  if (email.rawPayload) {
    const payload = email.rawPayload;

    const headers = payload.internetMessageHeaders as
      | { name: string; value: string }[]
      | undefined;
    if (headers && Array.isArray(headers)) {
      const hasPrecedenceBulk = headers.some(
        (h) =>
          h.name?.toLowerCase() === "precedence" &&
          h.value?.toLowerCase() === "bulk"
      );
      if (hasPrecedenceBulk) {
        score += 15;
        signals.push("Precedence: bulk header");
      }

      // X-Mailer or other bulk mail headers
      const hasXMailer = headers.some(
        (h) =>
          h.name?.toLowerCase() === "x-mailer" ||
          h.name?.toLowerCase() === "x-campaign"
      );
      if (hasXMailer) {
        score += 10;
        signals.push("Bulk mailer header present");
      }
    }
  }

  // 2. Check sender patterns
  const senderLower = email.sender.toLowerCase();
  for (const pattern of SPAM_SENDER_PATTERNS) {
    if (pattern.test(senderLower)) {
      score += 15;
      signals.push(`Sender matches spam pattern: ${pattern.source}`);
      break;
    }
  }

  // 3. Check subject patterns
  if (email.subject) {
    for (const pattern of SPAM_SUBJECT_PATTERNS) {
      if (pattern.test(email.subject)) {
        score += 20;
        signals.push(`Subject matches spam pattern: ${pattern.source}`);
        break;
      }
    }
  }

  // 4. Check body for spam signals (unsubscribe prompts etc.)
  const bodyText = email.bodyPlainText || "";
  let bodySignalCount = 0;
  for (const pattern of SPAM_BODY_PATTERNS) {
    if (pattern.test(bodyText)) {
      bodySignalCount++;
    }
  }
  if (bodySignalCount >= 2) {
    score += 15;
    signals.push(`Body contains ${bodySignalCount} spam signals`);
  }

  // 5. Check if AI classified as "Spam"
  // If a Spam label is already assigned, skip marking as spam to avoid
  // double-flagging — the label itself is sufficient.
  if (email.labels) {
    const spamLabel = email.labels.find((l) => l.name === "Spam");
    if (spamLabel) {
      return {
        isSpam: false,
        confidence: 0,
        signals: ["Skipped: Spam label already assigned"],
        unsubscribeLink: extractUnsubscribeLink({
          rawPayload: email.rawPayload,
          bodyHtml: email.bodyHtml,
          bodyPlainText: email.bodyPlainText,
        }),
      };
    }
  }

  // Extract unsubscribe link
  const unsubscribeLink = extractUnsubscribeLink({
    rawPayload: email.rawPayload,
    bodyHtml: email.bodyHtml,
    bodyPlainText: email.bodyPlainText,
  });

  if (unsubscribeLink) {
    score += 10;
    signals.push("Unsubscribe link found");
  }

  const confidence = Math.min(score, 100);

  return {
    isSpam: confidence >= 50,
    confidence,
    signals,
    unsubscribeLink,
  };
}

/**
 * Mark an email as spam in the database, with optional unsubscribe link.
 */
export async function markEmailAsSpam(
  emailId: number,
  isSpam: boolean,
  unsubscribeLink: string | null = null
): Promise<void> {
  await sql`
    UPDATE emails
    SET is_spam = ${isSpam},
        unsubscribe_link = ${unsubscribeLink},
        updated_at = NOW()
    WHERE id = ${emailId}
  `;
}

/**
 * Mark a Gmail email as spam in the database, with optional unsubscribe link.
 */
export async function markGmailEmailAsSpam(
  emailId: string,
  isSpam: boolean,
  unsubscribeLink: string | null = null
): Promise<void> {
  await sql`
    UPDATE gmail_emails
    SET is_spam = ${isSpam},
        unsubscribe_link = ${unsubscribeLink},
        updated_at = NOW()
    WHERE id = ${emailId}
  `;
}

/**
 * Batch detect and mark spam for Outlook emails.
 */
export async function detectAndMarkSpam(
  tenantId: string,
  emailBatch: {
    id: number;
    sender: string;
    subject: string | null;
    body_plain_text?: string | null;
    body_html?: string | null;
    raw_payload?: Record<string, unknown> | null;
    labels?: { name: string; confidence: number | null }[];
  }[]
): Promise<{ marked: number; total: number }> {
  let marked = 0;

  for (const email of emailBatch) {
    const result = detectSpam({
      sender: email.sender,
      subject: email.subject,
      bodyPlainText: email.body_plain_text,
      bodyHtml: email.body_html,
      rawPayload: email.raw_payload,
      labels: email.labels,
    });

    if (result.isSpam) {
      await markEmailAsSpam(email.id, true, result.unsubscribeLink);
      marked++;
    }
  }

  return { marked, total: emailBatch.length };
}
