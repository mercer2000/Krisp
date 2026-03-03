import sql from "./db";
import type {
  KrispWebhook,
  WebhookKeyPointsRow,
} from "@/types/webhook";

/**
 * Insert a new key points webhook into the database
 */
export async function insertWebhookKeyPoints(
  webhook: KrispWebhook,
  userId: string
): Promise<WebhookKeyPointsRow> {
  const { id, event, data } = webhook;
  const { meeting, content, raw_meeting, raw_content } = data;

  const rows = await sql`
    INSERT INTO webhook_key_points (
      user_id,
      webhook_id,
      event_type,
      meeting_id,
      meeting_title,
      meeting_url,
      meeting_start_date,
      meeting_end_date,
      meeting_duration,
      speakers,
      participants,
      calendar_event_id,
      content,
      raw_meeting,
      raw_content,
      full_payload
    ) VALUES (
      ${userId},
      ${id},
      ${event},
      ${meeting.id},
      ${meeting.title},
      ${meeting.url},
      ${meeting.start_date ? new Date(meeting.start_date).toISOString() : null},
      ${meeting.end_date ? new Date(meeting.end_date).toISOString() : null},
      ${meeting.duration},
      ${JSON.stringify(meeting.speakers)},
      ${JSON.stringify(meeting.participants)},
      ${meeting.calendar_event_id},
      ${JSON.stringify(content)},
      ${raw_meeting},
      ${raw_content},
      ${JSON.stringify(webhook)}
    )
    RETURNING *
  `;

  return rows[0] as WebhookKeyPointsRow;
}

/**
 * Get a webhook key points record by webhook ID
 */
export async function getWebhookKeyPointsByWebhookId(
  webhookId: string
): Promise<WebhookKeyPointsRow | null> {
  const rows = await sql`
    SELECT * FROM webhook_key_points WHERE webhook_id = ${webhookId}
  `;
  return (rows[0] as WebhookKeyPointsRow) || null;
}

/**
 * Get all webhook key points records for a meeting
 */
export async function getWebhookKeyPointsByMeetingId(
  meetingId: string,
  userId: string
): Promise<WebhookKeyPointsRow[]> {
  const rows = await sql`
    SELECT * FROM webhook_key_points
    WHERE meeting_id = ${meetingId} AND user_id = ${userId} AND deleted_at IS NULL
    ORDER BY received_at DESC
  `;
  return rows as WebhookKeyPointsRow[];
}

/**
 * Get recent webhook key points records for a user
 */
export async function getRecentWebhookKeyPoints(
  userId: string,
  limit: number = 10
): Promise<WebhookKeyPointsRow[]> {
  const rows = await sql`
    SELECT * FROM webhook_key_points
    WHERE user_id = ${userId} AND deleted_at IS NULL
    ORDER BY received_at DESC
    LIMIT ${limit}
  `;
  return rows as WebhookKeyPointsRow[];
}

/**
 * Check if a webhook already exists (for idempotency)
 */
export async function webhookExists(webhookId: string): Promise<boolean> {
  const rows = await sql`
    SELECT 1 FROM webhook_key_points WHERE webhook_id = ${webhookId}
  `;
  return rows.length > 0;
}

/**
 * Search meetings by text using PostgreSQL full-text search
 * Searches across meeting title, raw_content (transcript), and key points
 */
export async function searchMeetings(
  searchText: string,
  userId: string,
  limit: number = 10
): Promise<WebhookKeyPointsRow[]> {
  const rows = await sql`
    SELECT *,
      ts_rank(
        to_tsvector('english', COALESCE(meeting_title, '') || ' ' || COALESCE(raw_content, '') || ' ' || COALESCE(content::text, '')),
        plainto_tsquery('english', ${searchText})
      ) as rank
    FROM webhook_key_points
    WHERE
      user_id = ${userId}
      AND deleted_at IS NULL
      AND to_tsvector('english', COALESCE(meeting_title, '') || ' ' || COALESCE(raw_content, '') || ' ' || COALESCE(content::text, ''))
      @@ plainto_tsquery('english', ${searchText})
    ORDER BY rank DESC, received_at DESC
    LIMIT ${limit}
  `;
  return rows as WebhookKeyPointsRow[];
}

/**
 * Get all meetings with basic info for LLM context
 */
export async function getAllMeetingsSummary(
  userId: string,
  limit: number = 50
): Promise<{ id: number; meeting_id: string; meeting_title: string | null; meeting_start_date: Date | null; speakers: string[]; content_preview: string }[]> {
  const rows = await sql`
    SELECT
      id,
      meeting_id,
      meeting_title,
      meeting_start_date,
      speakers,
      LEFT(raw_content, 500) as content_preview
    FROM webhook_key_points
    WHERE user_id = ${userId} AND deleted_at IS NULL
    ORDER BY meeting_start_date DESC
    LIMIT ${limit}
  `;
  return rows as { id: number; meeting_id: string; meeting_title: string | null; meeting_start_date: Date | null; speakers: string[]; content_preview: string }[];
}

/**
 * Get full meeting details by ID (scoped to user)
 */
export async function getMeetingById(
  id: number,
  userId: string
): Promise<WebhookKeyPointsRow | null> {
  const rows = await sql`
    SELECT * FROM webhook_key_points WHERE id = ${id} AND user_id = ${userId} AND deleted_at IS NULL
  `;
  return (rows[0] as WebhookKeyPointsRow) || null;
}

/**
 * Soft-delete a meeting by ID (scoped to user)
 */
export async function softDeleteMeeting(
  id: number,
  userId: string
): Promise<boolean> {
  const rows = await sql`
    UPDATE webhook_key_points
    SET deleted_at = NOW(), updated_at = NOW()
    WHERE id = ${id} AND user_id = ${userId} AND deleted_at IS NULL
    RETURNING id
  `;
  return rows.length > 0;
}

/**
 * Restore a soft-deleted meeting
 */
export async function restoreMeeting(
  id: number,
  userId: string
): Promise<boolean> {
  const rows = await sql`
    UPDATE webhook_key_points
    SET deleted_at = NULL, updated_at = NOW()
    WHERE id = ${id} AND user_id = ${userId} AND deleted_at IS NOT NULL
    RETURNING id
  `;
  return rows.length > 0;
}

/**
 * Permanently delete a meeting (hard delete for trash purge)
 */
export async function permanentlyDeleteMeeting(
  id: number,
  userId: string
): Promise<boolean> {
  const rows = await sql`
    DELETE FROM webhook_key_points
    WHERE id = ${id} AND user_id = ${userId} AND deleted_at IS NOT NULL
    RETURNING id
  `;
  return rows.length > 0;
}

/**
 * Simple keyword search (case-insensitive ILIKE)
 * Fallback when full-text search returns no results
 */
export async function searchMeetingsSimple(
  searchText: string,
  userId: string,
  limit: number = 10
): Promise<WebhookKeyPointsRow[]> {
  const searchPattern = `%${searchText}%`;
  const rows = await sql`
    SELECT *
    FROM webhook_key_points
    WHERE
      user_id = ${userId}
      AND deleted_at IS NULL
      AND (
        meeting_title ILIKE ${searchPattern}
        OR raw_content ILIKE ${searchPattern}
        OR content::text ILIKE ${searchPattern}
      )
    ORDER BY received_at DESC
    LIMIT ${limit}
  `;
  return rows as WebhookKeyPointsRow[];
}
