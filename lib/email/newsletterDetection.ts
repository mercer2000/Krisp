import sql from "./db";

/**
 * Signals that indicate an email is a newsletter/marketing email.
 * Uses a combination of header analysis and sender pattern matching.
 */

/** Common newsletter/marketing sender patterns */
const NEWSLETTER_SENDER_PATTERNS = [
  /noreply@/i,
  /no-reply@/i,
  /newsletter@/i,
  /news@/i,
  /marketing@/i,
  /promotions@/i,
  /updates@/i,
  /digest@/i,
  /weekly@/i,
  /daily@/i,
  /bulletin@/i,
  /mailer@/i,
  /notifications@/i,
  /campaigns@/i,
  /announce@/i,
];

/** Common newsletter subject patterns */
const NEWSLETTER_SUBJECT_PATTERNS = [
  /newsletter/i,
  /weekly digest/i,
  /daily digest/i,
  /weekly roundup/i,
  /weekly update/i,
  /monthly update/i,
  /unsubscribe/i,
  /your .+ digest/i,
  /this week in/i,
  /top stories/i,
];

/**
 * Detect if an email is a newsletter based on heuristics.
 * Returns a confidence score 0-100.
 *
 * Checks:
 * 1. List-Unsubscribe header presence (strong signal from raw payload)
 * 2. Sender address patterns
 * 3. Subject line patterns
 * 4. Existing "Newsletter" label assignment
 */
export function detectNewsletter(email: {
  sender: string;
  subject: string | null;
  rawPayload?: Record<string, unknown> | null;
  labels?: { name: string; confidence: number | null }[];
}): { isNewsletter: boolean; confidence: number; signals: string[] } {
  const signals: string[] = [];
  let score = 0;

  // 1. Check raw payload for List-Unsubscribe header (strongest signal)
  if (email.rawPayload) {
    const payload = email.rawPayload;

    // Microsoft Graph API: internetMessageHeaders
    const headers = payload.internetMessageHeaders as
      | { name: string; value: string }[]
      | undefined;
    if (headers && Array.isArray(headers)) {
      const hasListUnsubscribe = headers.some(
        (h) => h.name?.toLowerCase() === "list-unsubscribe"
      );
      if (hasListUnsubscribe) {
        score += 50;
        signals.push("List-Unsubscribe header present");
      }
      const hasPrecedenceBulk = headers.some(
        (h) =>
          h.name?.toLowerCase() === "precedence" &&
          h.value?.toLowerCase() === "bulk"
      );
      if (hasPrecedenceBulk) {
        score += 20;
        signals.push("Precedence: bulk header");
      }
    }

    // Gmail: check for List-Unsubscribe in headers array from raw payload
    const gmailHeaders = (payload as Record<string, unknown>).headers as
      | { name: string; value: string }[]
      | undefined;
    if (gmailHeaders && Array.isArray(gmailHeaders) && !headers) {
      const hasListUnsubscribe = gmailHeaders.some(
        (h) => h.name?.toLowerCase() === "list-unsubscribe"
      );
      if (hasListUnsubscribe) {
        score += 50;
        signals.push("List-Unsubscribe header present");
      }
    }
  }

  // 2. Check sender patterns
  const senderLower = email.sender.toLowerCase();
  for (const pattern of NEWSLETTER_SENDER_PATTERNS) {
    if (pattern.test(senderLower)) {
      score += 15;
      signals.push(`Sender matches pattern: ${pattern.source}`);
      break; // Only count once
    }
  }

  // 3. Check subject patterns
  if (email.subject) {
    for (const pattern of NEWSLETTER_SUBJECT_PATTERNS) {
      if (pattern.test(email.subject)) {
        score += 15;
        signals.push(`Subject matches pattern: ${pattern.source}`);
        break; // Only count once
      }
    }
  }

  // 4. Check if already classified as "Newsletter" by AI
  if (email.labels) {
    const newsletterLabel = email.labels.find(
      (l) => l.name === "Newsletter"
    );
    if (newsletterLabel) {
      score += 40;
      signals.push(
        `AI classified as Newsletter (${newsletterLabel.confidence}% confidence)`
      );
    }
  }

  // Cap at 100
  const confidence = Math.min(score, 100);

  return {
    isNewsletter: confidence >= 50,
    confidence,
    signals,
  };
}

/**
 * Mark an email as newsletter in the database.
 */
export async function markEmailAsNewsletter(
  emailId: number,
  isNewsletter: boolean
): Promise<void> {
  await sql`
    UPDATE emails
    SET is_newsletter = ${isNewsletter}, updated_at = NOW()
    WHERE id = ${emailId}
  `;
}

/**
 * Mark a Gmail email as newsletter in the database.
 */
export async function markGmailEmailAsNewsletter(
  emailId: string,
  isNewsletter: boolean
): Promise<void> {
  await sql`
    UPDATE gmail_emails
    SET is_newsletter = ${isNewsletter}, updated_at = NOW()
    WHERE id = ${emailId}
  `;
}

/**
 * Check if a sender is whitelisted (should NOT be treated as newsletter).
 */
export async function isSenderWhitelisted(
  tenantId: string,
  senderEmail: string
): Promise<boolean> {
  // Normalize: extract email from "Name <email>" format
  const normalized = extractEmailAddress(senderEmail);
  const rows = await sql`
    SELECT 1 FROM newsletter_whitelist
    WHERE tenant_id = ${tenantId} AND sender_email = ${normalized}
    LIMIT 1
  `;
  return rows.length > 0;
}

/**
 * Add a sender to the whitelist.
 */
export async function addToWhitelist(
  tenantId: string,
  senderEmail: string
): Promise<{ id: string; sender_email: string }> {
  const normalized = extractEmailAddress(senderEmail);
  const rows = await sql`
    INSERT INTO newsletter_whitelist (tenant_id, sender_email)
    VALUES (${tenantId}, ${normalized})
    ON CONFLICT (tenant_id, sender_email) DO NOTHING
    RETURNING id, sender_email
  `;
  if (rows.length === 0) {
    // Already exists
    const existing = await sql`
      SELECT id, sender_email FROM newsletter_whitelist
      WHERE tenant_id = ${tenantId} AND sender_email = ${normalized}
    `;
    return existing[0] as { id: string; sender_email: string };
  }
  return rows[0] as { id: string; sender_email: string };
}

/**
 * Remove a sender from the whitelist.
 */
export async function removeFromWhitelist(
  tenantId: string,
  whitelistId: string
): Promise<boolean> {
  const rows = await sql`
    DELETE FROM newsletter_whitelist
    WHERE id = ${whitelistId} AND tenant_id = ${tenantId}
    RETURNING id
  `;
  return rows.length > 0;
}

/**
 * Get all whitelisted senders for a tenant.
 */
export async function getWhitelist(
  tenantId: string
): Promise<{ id: string; sender_email: string; created_at: string }[]> {
  const rows = await sql`
    SELECT id, sender_email, created_at
    FROM newsletter_whitelist
    WHERE tenant_id = ${tenantId}
    ORDER BY sender_email ASC
  `;
  return rows as { id: string; sender_email: string; created_at: string }[];
}

/**
 * Extract bare email address from a "Name <email>" format string.
 */
function extractEmailAddress(sender: string): string {
  const match = sender.match(/<([^>]+)>/);
  return (match ? match[1] : sender).toLowerCase().trim();
}

/**
 * Batch detect and mark newsletters for unprocessed Outlook emails.
 * Checks sender whitelist before marking.
 */
export async function detectAndMarkNewsletters(
  tenantId: string,
  emailBatch: {
    id: number;
    sender: string;
    subject: string | null;
    raw_payload?: Record<string, unknown> | null;
    labels?: { name: string; confidence: number | null }[];
  }[]
): Promise<{ marked: number; whitelisted: number }> {
  let marked = 0;
  let whitelisted = 0;

  for (const email of emailBatch) {
    // Check whitelist first
    if (await isSenderWhitelisted(tenantId, email.sender)) {
      whitelisted++;
      // Ensure not marked as newsletter if whitelisted
      await markEmailAsNewsletter(email.id, false);
      continue;
    }

    const result = detectNewsletter({
      sender: email.sender,
      subject: email.subject,
      rawPayload: email.raw_payload,
      labels: email.labels,
    });

    if (result.isNewsletter) {
      await markEmailAsNewsletter(email.id, true);
      marked++;
    }
  }

  return { marked, whitelisted };
}
