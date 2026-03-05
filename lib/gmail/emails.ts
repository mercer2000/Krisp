import sql from "./db";
import type { GmailEmailRow, GmailEmailInsert } from "@/types/gmail";
import { encrypt, encryptNullable, decryptNullable } from "@/lib/encryption";

/** Encrypted columns in gmail_emails */
const ENCRYPTED_COLS = ["sender", "subject", "body_plain", "body_html"] as const;

/** Decrypt gmail email row fields */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function decryptGmailRow(row: any): any {
  const result = { ...row };
  for (const col of ENCRYPTED_COLS) {
    if (col in result && typeof result[col] === "string") {
      result[col] = decryptNullable(result[col] as string);
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
