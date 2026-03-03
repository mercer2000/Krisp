import sql from "./db";
import type {
  EmailWebhookPayload,
  EmailRow,
  EmailInsert,
  EmailAttachmentMetadata,
} from "@/types/email";

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
      sender            = ${data.from},
      recipients        = ${JSON.stringify(data.to)},
      cc                = ${JSON.stringify(data.cc ?? [])},
      bcc               = ${JSON.stringify(data.bcc ?? [])},
      subject           = ${data.subject ?? null},
      body_plain_text   = ${data.bodyPlainText ?? null},
      body_html         = ${data.bodyHtml ?? null},
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
  tenantId: string
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
      raw_payload
    ) VALUES (
      ${tenantId},
      ${payload.messageId},
      ${payload.from},
      ${JSON.stringify(payload.to)},
      ${JSON.stringify(payload.cc ?? [])},
      ${JSON.stringify(payload.bcc ?? [])},
      ${payload.subject ?? null},
      ${payload.bodyPlainText ?? null},
      ${payload.bodyHtml ?? null},
      ${new Date(payload.receivedDateTime).toISOString()},
      ${JSON.stringify(payload.attachments ?? [])},
      ${payload.webLink ?? null},
      ${JSON.stringify(payload)}
    )
    RETURNING *
  `;

  return rows[0] as EmailRow;
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
  return rows as EmailRow[];
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
  return (rows[0] as EmailRow) || null;
}

/**
 * List emails for inbox view with pagination, search, and date filters.
 * Returns lightweight rows (no body content) plus total count.
 */
export async function listEmails(
  tenantId: string,
  opts: { page: number; limit: number; q?: string; after?: string; before?: string }
): Promise<{ rows: Array<{
  id: number;
  sender: string;
  subject: string | null;
  received_at: string;
  recipients: string[];
  attachments_metadata: EmailAttachmentMetadata[];
  preview: string | null;
  web_link: string | null;
}>; total: number }> {
  const offset = (opts.page - 1) * opts.limit;
  const q = opts.q || null;
  const after = opts.after || null;
  const before = opts.before || null;

  const countRows = await sql`
    SELECT COUNT(*)::int AS total
    FROM emails
    WHERE tenant_id = ${tenantId}
      AND deleted_at IS NULL
      AND (${q}::text IS NULL OR sender ILIKE '%' || ${q} || '%' OR subject ILIKE '%' || ${q} || '%')
      AND (${after}::timestamptz IS NULL OR received_at >= ${after}::timestamptz)
      AND (${before}::timestamptz IS NULL OR received_at <= ${before}::timestamptz)
  `;

  const rows = await sql`
    SELECT
      id, sender, subject, received_at,
      recipients,
      attachments_metadata,
      LEFT(body_plain_text, 200) AS preview,
      web_link
    FROM emails
    WHERE tenant_id = ${tenantId}
      AND deleted_at IS NULL
      AND (${q}::text IS NULL OR sender ILIKE '%' || ${q} || '%' OR subject ILIKE '%' || ${q} || '%')
      AND (${after}::timestamptz IS NULL OR received_at >= ${after}::timestamptz)
      AND (${before}::timestamptz IS NULL OR received_at <= ${before}::timestamptz)
    ORDER BY received_at DESC
    LIMIT ${opts.limit} OFFSET ${offset}
  `;

  return {
    rows: rows as Array<{
      id: number;
      sender: string;
      subject: string | null;
      received_at: string;
      recipients: string[];
      attachments_metadata: EmailAttachmentMetadata[];
      preview: string | null;
      web_link: string | null;
    }>,
    total: (countRows[0] as { total: number }).total,
  };
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
  return (rows[0] as typeof rows[0] & {
    id: number; tenant_id: string; message_id: string; sender: string;
    recipients: string[]; cc: string[]; bcc: string[];
    subject: string | null; body_plain_text: string | null; body_html: string | null;
    received_at: string; attachments_metadata: EmailAttachmentMetadata[];
    web_link: string | null; created_at: string; updated_at: string;
  }) || null;
}
