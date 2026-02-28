import sql from "./db";
import type {
  EmailWebhookPayload,
  EmailRow,
  EmailInsert,
} from "@/types/email";

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
    WHERE tenant_id = ${tenantId}
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
    WHERE id = ${id} AND tenant_id = ${tenantId}
  `;
  return (rows[0] as EmailRow) || null;
}
