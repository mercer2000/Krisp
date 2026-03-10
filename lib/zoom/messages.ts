import sql from "./db";
import type { ZoomChatMessageRow, ZoomChatMessageInsert } from "@/types/zoom";
import type { EmailListItem } from "@/types/email";
import { encrypt, encryptNullable, decryptNullable } from "@/lib/encryption";

/** Encrypted columns in zoom_chat_messages */
const ENCRYPTED_COLS = ["message_content", "sender_name"] as const;

/** Decrypt zoom message row fields */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function decryptZoomRow(row: any): any {
  const result = { ...row };
  for (const col of ENCRYPTED_COLS) {
    if (col in result && typeof result[col] === "string") {
      result[col] = decryptNullable(result[col] as string);
    }
  }
  return result;
}

/** Decrypt an array of zoom rows */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function decryptZoomRows(rows: any[]): any[] {
  return rows.map((r) => decryptZoomRow(r));
}

/**
 * Insert a new Zoom chat message. Uses INSERT ... ON CONFLICT DO NOTHING
 * for idempotent deduplication on (tenant_id, message_id).
 */
export async function insertZoomChatMessage(
  data: ZoomChatMessageInsert
): Promise<ZoomChatMessageRow | null> {
  const rows = await sql`
    INSERT INTO zoom_chat_messages (
      tenant_id,
      zoom_user_id,
      message_id,
      channel_id,
      channel_type,
      sender_id,
      sender_name,
      message_content,
      message_timestamp,
      raw_payload
    ) VALUES (
      ${data.tenant_id},
      ${data.zoom_user_id},
      ${data.message_id},
      ${data.channel_id ?? null},
      ${data.channel_type},
      ${data.sender_id},
      ${encryptNullable(data.sender_name ?? null)},
      ${encryptNullable(data.message_content ?? null)},
      ${data.message_timestamp.toISOString()},
      ${data.raw_payload ? JSON.stringify(data.raw_payload) : null}
    )
    ON CONFLICT (tenant_id, message_id) DO NOTHING
    RETURNING *
  `;

  if (!rows[0]) return null;
  return decryptZoomRow(rows[0]) as ZoomChatMessageRow;
}

/**
 * Mark a Zoom chat message as edited and update its content.
 */
export async function updateZoomChatMessage(
  tenantId: string,
  messageId: string,
  newContent: string
): Promise<ZoomChatMessageRow | null> {
  const rows = await sql`
    UPDATE zoom_chat_messages
    SET message_content = ${encrypt(newContent)},
        is_edited = true,
        updated_at = NOW()
    WHERE tenant_id = ${tenantId} AND message_id = ${messageId}
    RETURNING *
  `;
  if (!rows[0]) return null;
  return decryptZoomRow(rows[0]) as ZoomChatMessageRow;
}

/**
 * Soft-delete a Zoom chat message.
 */
export async function softDeleteZoomChatMessage(
  tenantId: string,
  messageId: string
): Promise<ZoomChatMessageRow | null> {
  const rows = await sql`
    UPDATE zoom_chat_messages
    SET is_deleted = true,
        message_content = null,
        updated_at = NOW()
    WHERE tenant_id = ${tenantId} AND message_id = ${messageId}
    RETURNING *
  `;
  return (rows[0] as ZoomChatMessageRow) || null;
}

/**
 * Get recent Zoom chat messages for a tenant.
 */
export async function getRecentZoomMessages(
  tenantId: string,
  limit: number = 50
): Promise<ZoomChatMessageRow[]> {
  const rows = await sql`
    SELECT * FROM zoom_chat_messages
    WHERE tenant_id = ${tenantId} AND is_deleted = false
    ORDER BY message_timestamp DESC
    LIMIT ${limit}
  `;
  return decryptZoomRows(rows) as ZoomChatMessageRow[];
}

/**
 * Get a single Zoom chat message by ID (scoped to tenant).
 */
export async function getZoomMessageById(
  id: string,
  tenantId: string
): Promise<ZoomChatMessageRow | null> {
  const rows = await sql`
    SELECT * FROM zoom_chat_messages
    WHERE id = ${id} AND tenant_id = ${tenantId}
  `;
  if (!rows[0]) return null;
  return decryptZoomRow(rows[0]) as ZoomChatMessageRow;
}

/**
 * Check if a Zoom chat message already exists (for deduplication checks).
 */
export async function zoomMessageExists(
  tenantId: string,
  messageId: string
): Promise<boolean> {
  const rows = await sql`
    SELECT 1 FROM zoom_chat_messages
    WHERE tenant_id = ${tenantId} AND message_id = ${messageId}
  `;
  return rows.length > 0;
}

/**
 * List Zoom chat messages for the inbox, shaped as EmailListItem[].
 */
export async function listZoomMessages(
  tenantId: string,
  opts: { q?: string; after?: string; before?: string; accountId?: string }
): Promise<EmailListItem[]> {
  // Build query with conditional filters
  // neon() tagged template doesn't support dynamic WHERE clauses,
  // so we use the function-call form: sql.query(queryString, params)
  const conditions = ["tenant_id = $1", "is_deleted = false"];
  const params: (string | Date)[] = [tenantId];
  let paramIndex = 2;

  if (opts.accountId) {
    conditions.push(`zoom_account_id = $${paramIndex}`);
    params.push(opts.accountId);
    paramIndex++;
  }
  if (opts.after) {
    conditions.push(`message_timestamp >= $${paramIndex}`);
    params.push(opts.after);
    paramIndex++;
  }
  if (opts.before) {
    conditions.push(`message_timestamp <= $${paramIndex}`);
    params.push(opts.before);
    paramIndex++;
  }

  const query = `
    SELECT id, sender_id, sender_name, channel_id, channel_type,
           message_content, message_timestamp, zoom_account_id
    FROM zoom_chat_messages
    WHERE ${conditions.join(" AND ")}
    ORDER BY message_timestamp DESC
    LIMIT 10000
  `;

  const rows = await sql.query(query, params);
  const decrypted = decryptZoomRows(rows);

  let items: EmailListItem[] = decrypted.map((row) => ({
    id: row.id,
    sender: row.sender_name || row.sender_id,
    subject: row.channel_type === "channel" ? (row.channel_id ?? "Zoom Channel") : "Direct Message",
    received_at: row.message_timestamp,
    recipients: [],
    has_attachments: false,
    preview: row.message_content ? row.message_content.slice(0, 200) : null,
    web_link: null,
    outlook_account_id: null,
    account_id: row.zoom_account_id ?? null,
    provider: "zoom" as const,
    labels: [],
    is_newsletter: false,
    is_read: true,
  }));

  // Client-side keyword filter on decrypted content
  if (opts.q) {
    const lower = opts.q.toLowerCase();
    items = items.filter(
      (item) =>
        (item.preview && item.preview.toLowerCase().includes(lower)) ||
        item.sender.toLowerCase().includes(lower) ||
        (item.subject && item.subject.toLowerCase().includes(lower))
    );
  }

  return items;
}
