import sql from "./db";
import type {
  EmailWebhookPayload,
  EmailRow,
  EmailInsert,
  EmailAttachmentMetadata,
} from "@/types/email";
import {
  encrypt,
  encryptNullable,
  decryptNullable,
  isEncrypted,
} from "@/lib/encryption";

// Raw SQL column names that are encrypted in the emails table
const ENCRYPTED_COLS = ["sender", "subject", "body_plain_text", "body_html"] as const;

/**
 * Decrypt the encrypted columns on a raw SQL row object.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function decryptRow(row: any): any {
  const result = { ...row };
  for (const col of ENCRYPTED_COLS) {
    const val = result[col];
    if (typeof val === "string" && isEncrypted(val)) {
      result[col] = decryptNullable(val);
    }
  }
  return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function decryptRows(rows: any[]): any[] {
  return rows.map(decryptRow);
}

/**
 * Update an existing email stub with full content fetched from Graph API.
 */
export async function updateEmailByMessageId(
  tenantId: string,
  messageId: string,
  data: EmailWebhookPayload
): Promise<void> {
  await sql`
    UPDATE emails
    SET
      sender            = ${encrypt(data.from)},
      recipients        = ${JSON.stringify(data.to)},
      cc                = ${JSON.stringify(data.cc ?? [])},
      bcc               = ${JSON.stringify(data.bcc ?? [])},
      subject           = ${encryptNullable(data.subject ?? null)},
      body_plain_text   = ${encryptNullable(data.bodyPlainText ?? null)},
      body_html         = ${encryptNullable(data.bodyHtml ?? null)},
      received_at       = ${new Date(data.receivedDateTime).toISOString()},
      attachments_metadata = ${JSON.stringify(data.attachments ?? [])},
      web_link          = ${data.webLink ?? null},
      raw_payload       = ${JSON.stringify(data)},
      updated_at        = NOW()
    WHERE tenant_id = ${tenantId}
      AND message_id = ${messageId}
  `;
}

/**
 * Insert a new email record into the database
 */
export async function insertEmail(
  payload: EmailWebhookPayload,
  tenantId: string,
  outlookAccountId?: string
): Promise<EmailRow> {
  const rows = await sql`
    INSERT INTO emails (
      tenant_id,
      message_id,
      sender,
      recipients,
      cc,
      bcc,
      subject,
      body_plain_text,
      body_html,
      received_at,
      attachments_metadata,
      web_link,
      raw_payload,
      outlook_account_id
    ) VALUES (
      ${tenantId},
      ${payload.messageId},
      ${encrypt(payload.from)},
      ${JSON.stringify(payload.to)},
      ${JSON.stringify(payload.cc ?? [])},
      ${JSON.stringify(payload.bcc ?? [])},
      ${encryptNullable(payload.subject ?? null)},
      ${encryptNullable(payload.bodyPlainText ?? null)},
      ${encryptNullable(payload.bodyHtml ?? null)},
      ${new Date(payload.receivedDateTime).toISOString()},
      ${JSON.stringify(payload.attachments ?? [])},
      ${payload.webLink ?? null},
      ${JSON.stringify(payload)},
      ${outlookAccountId ?? null}
    )
    RETURNING *
  `;

  return decryptRow(rows[0] as EmailRow);
}

/**
 * Update message_id and web_link after a Graph API move (which may reassign IDs).
 */
export async function updateEmailAfterMove(
  tenantId: string,
  oldMessageId: string,
  newMessageId: string,
  newWebLink?: string
): Promise<void> {
  if (oldMessageId === newMessageId) return;
  if (newWebLink) {
    await sql`
      UPDATE emails
      SET message_id = ${newMessageId},
          web_link = ${newWebLink},
          updated_at = NOW()
      WHERE tenant_id = ${tenantId} AND message_id = ${oldMessageId}
    `;
  } else {
    await sql`
      UPDATE emails
      SET message_id = ${newMessageId},
          updated_at = NOW()
      WHERE tenant_id = ${tenantId} AND message_id = ${oldMessageId}
    `;
  }
}

/**
 * Check if an email already exists (for deduplication)
 */
export async function emailExists(
  tenantId: string,
  messageId: string
): Promise<boolean> {
  const rows = await sql`
    SELECT 1 FROM emails
    WHERE tenant_id = ${tenantId} AND message_id = ${messageId}
  `;
  return rows.length > 0;
}

/**
 * Get recent emails for a tenant
 */
export async function getRecentEmails(
  tenantId: string,
  limit: number = 50
): Promise<EmailRow[]> {
  const rows = await sql`
    SELECT * FROM emails
    WHERE tenant_id = ${tenantId} AND deleted_at IS NULL
    ORDER BY received_at DESC
    LIMIT ${limit}
  `;
  return decryptRows(rows as EmailRow[]);
}

/**
 * Get a single email by ID (scoped to tenant)
 */
export async function getEmailById(
  id: number,
  tenantId: string
): Promise<EmailRow | null> {
  const rows = await sql`
    SELECT * FROM emails
    WHERE id = ${id} AND tenant_id = ${tenantId} AND deleted_at IS NULL
  `;
  if (!rows[0]) return null;
  return decryptRow(rows[0] as EmailRow);
}

/**
 * List emails for inbox view with pagination, search, and date filters.
 * Returns lightweight rows (no body content) plus total count.
 *
 * NOTE: With encrypted sender/subject columns, keyword search (q) is applied
 * application-side after decryption. Date filters remain SQL-side.
 */
export async function listEmails(
  tenantId: string,
  opts: { page: number; limit: number; q?: string; after?: string; before?: string; accountId?: string; folder?: string }
): Promise<{ rows: Array<{
  id: number;
  sender: string;
  subject: string | null;
  received_at: string;
  recipients: string[];
  attachments_metadata: EmailAttachmentMetadata[];
  preview: string | null;
  web_link: string | null;
  outlook_account_id: string | null;
  is_newsletter: boolean;
  is_spam: boolean;
  is_read: boolean;
  is_done: boolean;
  unsubscribe_link: string | null;
}>; total: number }> {
  const after = opts.after || null;
  const before = opts.before || null;
  const accountId = opts.accountId || null;
  // folder filter: "inbox" = exclude spam+done, "spam" = only spam, "done" = only done, undefined = all
  const showSpam = opts.folder === "spam" ? true : opts.folder === "inbox" ? false : null;
  const showDone = opts.folder === "done" ? true : opts.folder === "inbox" ? false : null;

  // Fetch all matching emails (date-filtered server-side)
  const allRows = await sql`
    SELECT
      id, sender, subject, received_at,
      recipients,
      attachments_metadata,
      body_plain_text,
      web_link,
      outlook_account_id,
      is_newsletter,
      is_spam,
      is_read,
      is_done,
      unsubscribe_link
    FROM emails
    WHERE tenant_id = ${tenantId}
      AND deleted_at IS NULL
      AND (${after}::timestamptz IS NULL OR received_at >= ${after}::timestamptz)
      AND (${before}::timestamptz IS NULL OR received_at <= ${before}::timestamptz)
      AND (${accountId}::uuid IS NULL OR outlook_account_id = ${accountId}::uuid)
      AND (${showSpam}::boolean IS NULL OR is_spam = ${showSpam}::boolean)
      AND (${showDone}::boolean IS NULL OR is_done = ${showDone}::boolean)
    ORDER BY received_at DESC
  `;

  // Decrypt and build result objects
  let decrypted = (allRows as Record<string, unknown>[]).map((row) => {
    const dr = decryptRow(row);
    return {
      id: dr.id as number,
      sender: dr.sender as string,
      subject: dr.subject as string | null,
      received_at: dr.received_at as string,
      recipients: dr.recipients as string[],
      attachments_metadata: dr.attachments_metadata as EmailAttachmentMetadata[],
      preview: dr.body_plain_text
        ? (dr.body_plain_text as string).slice(0, 200)
        : null,
      web_link: dr.web_link as string | null,
      outlook_account_id: dr.outlook_account_id as string | null,
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

  const total = decrypted.length;
  const offset = (opts.page - 1) * opts.limit;
  const paged = decrypted.slice(offset, offset + opts.limit);

  return { rows: paged, total };
}

/**
 * Soft-delete an email by ID (scoped to tenant). Sets deleted_at timestamp.
 * Returns the message_id so the caller can also remove it from the mailbox via Graph API.
 */
export async function deleteEmail(
  id: number,
  tenantId: string
): Promise<{ message_id: string } | null> {
  const rows = await sql`
    UPDATE emails
    SET deleted_at = NOW(), updated_at = NOW()
    WHERE id = ${id} AND tenant_id = ${tenantId}
    RETURNING message_id
  `;
  return (rows[0] as { message_id: string }) || null;
}

/**
 * Permanently delete an email (hard delete for trash purge)
 */
export async function permanentlyDeleteEmail(
  id: number,
  tenantId: string
): Promise<boolean> {
  const rows = await sql`
    DELETE FROM emails
    WHERE id = ${id} AND tenant_id = ${tenantId} AND deleted_at IS NOT NULL
    RETURNING id
  `;
  return rows.length > 0;
}

/**
 * Restore a soft-deleted email
 */
export async function restoreEmail(
  id: number,
  tenantId: string
): Promise<boolean> {
  const rows = await sql`
    UPDATE emails
    SET deleted_at = NULL, updated_at = NOW()
    WHERE id = ${id} AND tenant_id = ${tenantId} AND deleted_at IS NOT NULL
    RETURNING id
  `;
  return rows.length > 0;
}

/**
 * Mark an email as read or unread.
 */
export async function markEmailRead(
  id: number,
  tenantId: string,
  isRead: boolean
): Promise<boolean> {
  const rows = await sql`
    UPDATE emails
    SET is_read = ${isRead}, updated_at = NOW()
    WHERE id = ${id} AND tenant_id = ${tenantId} AND deleted_at IS NULL
    RETURNING id
  `;
  return rows.length > 0;
}

/**
 * Mark an email as done or not done. When marking done, also marks as read.
 */
export async function markEmailDone(
  id: number,
  tenantId: string,
  isDone: boolean
): Promise<boolean> {
  const rows = isDone
    ? await sql`
        UPDATE emails
        SET is_done = true, is_read = true, updated_at = NOW()
        WHERE id = ${id} AND tenant_id = ${tenantId} AND deleted_at IS NULL
        RETURNING id
      `
    : await sql`
        UPDATE emails
        SET is_done = false, updated_at = NOW()
        WHERE id = ${id} AND tenant_id = ${tenantId} AND deleted_at IS NULL
        RETURNING id
      `;
  return rows.length > 0;
}

/**
 * Get a single email for detail view (excludes raw_payload).
 */
export async function getEmailDetail(
  id: number,
  tenantId: string
): Promise<{
  id: number;
  tenant_id: string;
  message_id: string;
  sender: string;
  recipients: string[];
  cc: string[];
  bcc: string[];
  subject: string | null;
  body_plain_text: string | null;
  body_html: string | null;
  received_at: string;
  attachments_metadata: EmailAttachmentMetadata[];
  web_link: string | null;
  created_at: string;
  updated_at: string;
} | null> {
  const rows = await sql`
    SELECT
      id, tenant_id, message_id, sender, recipients, cc, bcc,
      subject, body_plain_text, body_html, received_at,
      attachments_metadata, web_link, created_at, updated_at
    FROM emails
    WHERE id = ${id} AND tenant_id = ${tenantId} AND deleted_at IS NULL
    LIMIT 1
  `;
  if (!rows[0]) return null;
  return decryptRow(rows[0] as {
    id: number; tenant_id: string; message_id: string; sender: string;
    recipients: string[]; cc: string[]; bcc: string[];
    subject: string | null; body_plain_text: string | null; body_html: string | null;
    received_at: string; attachments_metadata: EmailAttachmentMetadata[];
    web_link: string | null; created_at: string; updated_at: string;
  });
}
