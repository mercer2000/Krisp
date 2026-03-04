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

/**
 * Filter parameters for meeting list queries
 */
export interface MeetingFilters {
  dateFrom?: string;
  dateTo?: string;
  durationMin?: number;
  durationMax?: number;
  participants?: string[];
  hasActionItems?: boolean;
  actionItemStatus?: string;
  hasTranscript?: boolean;
  keyword?: string;
}

/**
 * Get filtered meetings with total count for pagination/display.
 * All filters are combined with AND logic, applied server-side.
 */
export async function getFilteredMeetings(
  userId: string,
  filters: MeetingFilters,
  limit: number = 100
): Promise<{ meetings: WebhookKeyPointsRow[]; total: number }> {
  // Use a single SQL query with IS NULL checks so all params are always provided
  // and unused filters are short-circuited by the database.
  const dateFrom = filters.dateFrom || null;
  const dateTo = filters.dateTo || null;
  const durationMin = filters.durationMin ?? null;
  const durationMax = filters.durationMax ?? null;
  const hasTranscript = filters.hasTranscript ?? null;
  const hasActionItems = filters.hasActionItems ?? null;
  const keyword = filters.keyword ? `%${filters.keyword}%` : null;
  const participantsJson = filters.participants && filters.participants.length > 0
    ? JSON.stringify(filters.participants)
    : null;
  const actionItemStatus = filters.actionItemStatus || null;

  const rows = await sql`
    SELECT w.*, COUNT(*) OVER() AS total_count
    FROM webhook_key_points w
    WHERE w.user_id = ${userId}
      AND w.deleted_at IS NULL
      AND (${dateFrom}::timestamptz IS NULL OR w.meeting_start_date >= ${dateFrom}::timestamptz)
      AND (${dateTo}::timestamptz IS NULL OR w.meeting_start_date <= (${dateTo}::date + interval '1 day'))
      AND (${durationMin}::int IS NULL OR w.meeting_duration >= ${durationMin})
      AND (${durationMax}::int IS NULL OR w.meeting_duration <= ${durationMax})
      AND (${hasTranscript}::boolean IS NULL OR
        (${hasTranscript}::boolean = true AND w.raw_content IS NOT NULL AND w.raw_content != '') OR
        (${hasTranscript}::boolean = false AND (w.raw_content IS NULL OR w.raw_content = ''))
      )
      AND (${keyword}::text IS NULL OR (
        w.meeting_title ILIKE ${keyword}
        OR w.content::text ILIKE ${keyword}
        OR w.raw_content ILIKE ${keyword}
      ))
      AND (${participantsJson}::jsonb IS NULL OR (
        EXISTS (
          SELECT 1 FROM jsonb_array_elements(w.speakers) AS s
          WHERE LOWER(
            COALESCE(s->>'first_name', '') || ' ' || COALESCE(s->>'last_name', '')
          ) ILIKE ANY(
            SELECT '%' || LOWER(p) || '%' FROM jsonb_array_elements_text(${participantsJson}::jsonb) AS p
          )
          OR LOWER(s::text) ILIKE ANY(
            SELECT '%' || LOWER(p) || '%' FROM jsonb_array_elements_text(${participantsJson}::jsonb) AS p
          )
        )
      ))
      AND (${hasActionItems}::boolean IS NULL OR
        (${hasActionItems}::boolean = true AND EXISTS (
          SELECT 1 FROM action_items ai WHERE ai.meeting_id = w.id AND ai.deleted_at IS NULL
        )) OR
        (${hasActionItems}::boolean = false AND NOT EXISTS (
          SELECT 1 FROM action_items ai WHERE ai.meeting_id = w.id AND ai.deleted_at IS NULL
        ))
      )
      AND (${actionItemStatus}::text IS NULL OR EXISTS (
        SELECT 1 FROM action_items ai
        WHERE ai.meeting_id = w.id AND ai.deleted_at IS NULL AND ai.status = ${actionItemStatus}
      ))
    ORDER BY w.meeting_start_date DESC NULLS LAST, w.received_at DESC
    LIMIT ${limit}
  `;

  const total = rows.length > 0 ? Number((rows[0] as Record<string, unknown>).total_count) : 0;
  return {
    meetings: rows as WebhookKeyPointsRow[],
    total,
  };
}

/**
 * Get all unique participants/speakers across all meetings for a user.
 * Used to populate the participant filter dropdown.
 */
export async function getAllParticipants(
  userId: string
): Promise<string[]> {
  const rows = await sql`
    SELECT DISTINCT
      TRIM(COALESCE(s->>'first_name', '') || ' ' || COALESCE(s->>'last_name', '')) AS name
    FROM webhook_key_points w,
      jsonb_array_elements(w.speakers) AS s
    WHERE w.user_id = ${userId}
      AND w.deleted_at IS NULL
      AND jsonb_typeof(w.speakers) = 'array'
      AND TRIM(COALESCE(s->>'first_name', '') || ' ' || COALESCE(s->>'last_name', '')) != ''
    ORDER BY name
  `;
  return rows.map((r: Record<string, unknown>) => (r as { name: string }).name);
}
