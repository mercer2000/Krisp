import pool from "./db";
import type {
  KrispWebhook,
  WebhookKeyPointsRow,
} from "@/types/webhook";

/**
 * Insert a new key points webhook into the database
 */
export async function insertWebhookKeyPoints(
  webhook: KrispWebhook
): Promise<WebhookKeyPointsRow> {
  const { id, event, data } = webhook;
  const { meeting, content, raw_meeting, raw_content } = data;

  const query = `
    INSERT INTO webhook_key_points (
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
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING *
  `;

  const values = [
    id,
    event,
    meeting.id,
    meeting.title,
    meeting.url,
    meeting.start_date ? new Date(meeting.start_date) : null,
    meeting.end_date ? new Date(meeting.end_date) : null,
    meeting.duration,
    JSON.stringify(meeting.speakers),
    JSON.stringify(meeting.participants),
    meeting.calendar_event_id,
    JSON.stringify(content),
    raw_meeting,
    raw_content,
    JSON.stringify(webhook),
  ];

  const result = await pool.query(query, values);
  return result.rows[0] as WebhookKeyPointsRow;
}

/**
 * Get a webhook key points record by webhook ID
 */
export async function getWebhookKeyPointsByWebhookId(
  webhookId: string
): Promise<WebhookKeyPointsRow | null> {
  const query = `SELECT * FROM webhook_key_points WHERE webhook_id = $1`;
  const result = await pool.query(query, [webhookId]);
  return (result.rows[0] as WebhookKeyPointsRow) || null;
}

/**
 * Get all webhook key points records for a meeting
 */
export async function getWebhookKeyPointsByMeetingId(
  meetingId: string
): Promise<WebhookKeyPointsRow[]> {
  const query = `
    SELECT * FROM webhook_key_points
    WHERE meeting_id = $1
    ORDER BY received_at DESC
  `;
  const result = await pool.query(query, [meetingId]);
  return result.rows as WebhookKeyPointsRow[];
}

/**
 * Get recent webhook key points records
 */
export async function getRecentWebhookKeyPoints(
  limit: number = 10
): Promise<WebhookKeyPointsRow[]> {
  const query = `
    SELECT * FROM webhook_key_points
    ORDER BY received_at DESC
    LIMIT $1
  `;
  const result = await pool.query(query, [limit]);
  return result.rows as WebhookKeyPointsRow[];
}

/**
 * Check if a webhook already exists (for idempotency)
 */
export async function webhookExists(webhookId: string): Promise<boolean> {
  const query = `SELECT 1 FROM webhook_key_points WHERE webhook_id = $1`;
  const result = await pool.query(query, [webhookId]);
  return result.rows.length > 0;
}

/**
 * Search meetings by text using PostgreSQL full-text search
 * Searches across meeting title, raw_content (transcript), and key points
 */
export async function searchMeetings(
  searchText: string,
  limit: number = 10
): Promise<WebhookKeyPointsRow[]> {
  // Use PostgreSQL's full-text search with tsquery
  // Search across meeting_title, raw_content, and content (key points)
  const query = `
    SELECT *,
      ts_rank(
        to_tsvector('english', COALESCE(meeting_title, '') || ' ' || COALESCE(raw_content, '') || ' ' || COALESCE(content::text, '')),
        plainto_tsquery('english', $1)
      ) as rank
    FROM webhook_key_points
    WHERE
      to_tsvector('english', COALESCE(meeting_title, '') || ' ' || COALESCE(raw_content, '') || ' ' || COALESCE(content::text, ''))
      @@ plainto_tsquery('english', $1)
    ORDER BY rank DESC, received_at DESC
    LIMIT $2
  `;
  const result = await pool.query(query, [searchText, limit]);
  return result.rows as WebhookKeyPointsRow[];
}

/**
 * Get all meetings with basic info for LLM context
 */
export async function getAllMeetingsSummary(
  limit: number = 50
): Promise<{ id: number; meeting_id: string; meeting_title: string | null; meeting_start_date: Date | null; speakers: string[]; content_preview: string }[]> {
  const query = `
    SELECT
      id,
      meeting_id,
      meeting_title,
      meeting_start_date,
      speakers,
      LEFT(raw_content, 500) as content_preview
    FROM webhook_key_points
    ORDER BY meeting_start_date DESC
    LIMIT $1
  `;
  const result = await pool.query(query, [limit]);
  return result.rows;
}

/**
 * Get full meeting details by ID
 */
export async function getMeetingById(
  id: number
): Promise<WebhookKeyPointsRow | null> {
  const query = `SELECT * FROM webhook_key_points WHERE id = $1`;
  const result = await pool.query(query, [id]);
  return (result.rows[0] as WebhookKeyPointsRow) || null;
}

/**
 * Simple keyword search (case-insensitive ILIKE)
 * Fallback when full-text search returns no results
 */
export async function searchMeetingsSimple(
  searchText: string,
  limit: number = 10
): Promise<WebhookKeyPointsRow[]> {
  const searchPattern = `%${searchText}%`;
  const query = `
    SELECT *
    FROM webhook_key_points
    WHERE
      meeting_title ILIKE $1
      OR raw_content ILIKE $1
      OR content::text ILIKE $1
    ORDER BY received_at DESC
    LIMIT $2
  `;
  const result = await pool.query(query, [searchPattern, limit]);
  return result.rows as WebhookKeyPointsRow[];
}
