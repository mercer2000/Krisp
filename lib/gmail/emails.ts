import sql from "./db";
import type { GmailEmailRow, GmailEmailInsert } from "@/types/gmail";
import { encrypt, encryptNullable, decryptNullable, isEncrypted } from "@/lib/encryption";

/** Encrypted columns in gmail_emails */
const ENCRYPTED_COLS = ["sender", "subject", "body_plain", "body_html"] as const;

/** Decrypt gmail email row fields */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function decryptGmailRow(row: any): any {
  const result = { ...row };
  for (const col of ENCRYPTED_COLS) {
    const val = result[col];
    if (typeof val === "string" && isEncrypted(val)) {
      result[col] = decryptNullable(val);
    }
  }
  return result;
}

/** Decrypt an array of gmail rows */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function decryptGmailRows(rows: any[]): any[] {
  return rows.map((r) => decryptGmailRow(r));
}

const MAX_BODY_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Truncate a string to maxLen, returning the truncated string.
 */
function truncateBody(body: string | null | undefined, maxLen: number): string | null {
  if (!body) return null;
  if (body.length <= maxLen) return body;
  return body.slice(0, maxLen);
}

/**
 * Insert a new Gmail email record. Uses INSERT ... ON CONFLICT DO NOTHING
 * for idempotent deduplication on (tenant_id, gmail_message_id).
 */
export async function insertGmailEmail(
  data: GmailEmailInsert
): Promise<GmailEmailRow | null> {
  const bodyPlain = truncateBody(data.body_plain, MAX_BODY_SIZE);
  const bodyHtml = truncateBody(data.body_html, MAX_BODY_SIZE);

  const rows = await sql`
    INSERT INTO gmail_emails (
      tenant_id,
      gmail_message_id,
      thread_id,
      sender,
      recipients,
      subject,
      body_plain,
      body_html,
      received_at,
      attachments,
      labels,
      raw_payload
    ) VALUES (
      ${data.tenant_id},
      ${data.gmail_message_id},
      ${data.thread_id ?? null},
      ${encrypt(data.sender)},
      ${JSON.stringify(data.recipients ?? [])},
      ${encryptNullable(data.subject ?? null)},
      ${encryptNullable(bodyPlain)},
      ${encryptNullable(bodyHtml)},
      ${data.received_at.toISOString()},
      ${JSON.stringify(data.attachments ?? [])},
      ${JSON.stringify(data.labels ?? [])},
      ${data.raw_payload ? JSON.stringify(data.raw_payload) : null}
    )
    ON CONFLICT (tenant_id, gmail_message_id) DO NOTHING
    RETURNING *
  `;

  // null means the row already existed (duplicate)
  if (!rows[0]) return null;
  return decryptGmailRow(rows[0]) as GmailEmailRow;
}

/**
 * Check if a Gmail email already exists (for deduplication checks).
 */
export async function gmailEmailExists(
  tenantId: string,
  gmailMessageId: string
): Promise<boolean> {
  const rows = await sql`
    SELECT 1 FROM gmail_emails
    WHERE tenant_id = ${tenantId} AND gmail_message_id = ${gmailMessageId}
  `;
  return rows.length > 0;
}

/**
 * Get recent Gmail emails for a tenant.
 */
export async function getRecentGmailEmails(
  tenantId: string,
  limit: number = 50
): Promise<GmailEmailRow[]> {
  const rows = await sql`
    SELECT * FROM gmail_emails
    WHERE tenant_id = ${tenantId}
    ORDER BY received_at DESC
    LIMIT ${limit}
  `;
  return decryptGmailRows(rows) as GmailEmailRow[];
}

/**
 * Get a single Gmail email by ID (scoped to tenant).
 */
export async function getGmailEmailById(
  id: string,
  tenantId: string
): Promise<GmailEmailRow | null> {
  const rows = await sql`
    SELECT * FROM gmail_emails
    WHERE id = ${id} AND tenant_id = ${tenantId}
  `;
  if (!rows[0]) return null;
  return decryptGmailRow(rows[0]) as GmailEmailRow;
}

/**
 * Mark a Gmail email as read or unread.
 */
export async function markGmailEmailRead(
  id: string,
  tenantId: string,
  isRead: boolean
): Promise<boolean> {
  const rows = await sql`
    UPDATE gmail_emails
    SET is_read = ${isRead}, updated_at = NOW()
    WHERE id = ${id} AND tenant_id = ${tenantId}
    RETURNING id
  `;
  return rows.length > 0;
}

/**
 * Mark a Gmail email as done or not done. When marking done, also marks as read.
 */
export async function markGmailEmailDone(
  id: string,
  tenantId: string,
  isDone: boolean
): Promise<boolean> {
  const rows = isDone
    ? await sql`
        UPDATE gmail_emails
        SET is_done = true, is_read = true, updated_at = NOW()
        WHERE id = ${id} AND tenant_id = ${tenantId}
        RETURNING id
      `
    : await sql`
        UPDATE gmail_emails
        SET is_done = false, updated_at = NOW()
        WHERE id = ${id} AND tenant_id = ${tenantId}
        RETURNING id
      `;
  return rows.length > 0;
}

/**
 * Delete a Gmail email from the local database.
 * Returns the gmail_message_id so the caller can also trash it via the Gmail API.
 */
export async function deleteGmailEmail(
  id: string,
  tenantId: string
): Promise<{ gmail_message_id: string } | null> {
  const rows = await sql`
    DELETE FROM gmail_emails
    WHERE id = ${id} AND tenant_id = ${tenantId}
    RETURNING gmail_message_id
  `;
  if (!rows[0]) return null;
  return { gmail_message_id: rows[0].gmail_message_id as string };
}

/**
 * List Gmail emails for the unified inbox view with pagination, search, and date filters.
 * Returns the same shape as the Outlook listEmails function for easy merging.
 */
export async function listGmailEmails(
  tenantId: string,
  opts: { q?: string; after?: string; before?: string; gmailAccountId?: string; folder?: string }
): Promise<Array<{
  id: string;
  sender: string;
  subject: string | null;
  received_at: string;
  recipients: string[];
  has_attachments: boolean;
  preview: string | null;
  web_link: string | null;
  gmail_account_id: string | null;
  is_newsletter: boolean;
  is_spam: boolean;
  is_read: boolean;
  is_done: boolean;
  unsubscribe_link: string | null;
}>> {
  const after = opts.after || null;
  const before = opts.before || null;
  const showSpam = opts.folder === "spam" ? true : opts.folder === "inbox" ? false : null;
  const showDone = opts.folder === "done" ? true : opts.folder === "inbox" ? false : null;
  const excludeLabeled = opts.folder === "inbox";

  const allRows = await sql`
    SELECT
      id, sender, subject, received_at,
      recipients, attachments, body_plain,
      tenant_id, is_newsletter, is_spam, is_read, is_done, unsubscribe_link
    FROM gmail_emails
    WHERE tenant_id = ${tenantId}
      AND (${after}::timestamptz IS NULL OR received_at >= ${after}::timestamptz)
      AND (${before}::timestamptz IS NULL OR received_at <= ${before}::timestamptz)
      AND (${showSpam}::boolean IS NULL OR is_spam = ${showSpam}::boolean)
      AND (${showDone}::boolean IS NULL OR is_done = ${showDone}::boolean)
      AND (NOT ${excludeLabeled}::boolean OR NOT EXISTS (
        SELECT 1 FROM smart_label_items WHERE item_type = 'gmail_email' AND item_id = gmail_emails.id::text
      ))
    ORDER BY received_at DESC
  `;

  let decrypted = (allRows as Record<string, unknown>[]).map((row) => {
    const dr = decryptGmailRow(row);
    const attachments = dr.attachments;
    const hasAttachments = Array.isArray(attachments) && attachments.length > 0;
    return {
      id: dr.id as string,
      sender: dr.sender as string,
      subject: dr.subject as string | null,
      received_at: dr.received_at as string,
      recipients: Array.isArray(dr.recipients) ? dr.recipients : [],
      has_attachments: hasAttachments,
      preview: dr.body_plain
        ? (dr.body_plain as string).slice(0, 600)
        : null,
      web_link: null as string | null,
      gmail_account_id: opts.gmailAccountId ?? null,
      is_newsletter: dr.is_newsletter as boolean,
      is_spam: dr.is_spam as boolean,
      is_read: dr.is_read as boolean,
      is_done: dr.is_done as boolean,
      unsubscribe_link: dr.unsubscribe_link as string | null,
    };
  });

  // Apply keyword filter on decrypted sender/subject
  if (opts.q) {
    const lower = opts.q.toLowerCase();
    decrypted = decrypted.filter(
      (r) =>
        r.sender.toLowerCase().includes(lower) ||
        (r.subject?.toLowerCase().includes(lower) ?? false)
    );
  }

  return decrypted;
}
