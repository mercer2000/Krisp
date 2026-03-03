import sql from "./db";
import type { ZoomChatMessageRow, ZoomChatMessageInsert } from "@/types/zoom";

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
      ${data.sender_name ?? null},
      ${data.message_content ?? null},
      ${data.message_timestamp.toISOString()},
      ${data.raw_payload ? JSON.stringify(data.raw_payload) : null}
    )
    ON CONFLICT (tenant_id, message_id) DO NOTHING
    RETURNING *
  `;

  return (rows[0] as ZoomChatMessageRow) || null;
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
    SET message_content = ${newContent},
        is_edited = true,
        updated_at = NOW()
    WHERE tenant_id = ${tenantId} AND message_id = ${messageId}
    RETURNING *
  `;
  return (rows[0] as ZoomChatMessageRow) || null;
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
  return rows as ZoomChatMessageRow[];
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
  return (rows[0] as ZoomChatMessageRow) || null;
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
