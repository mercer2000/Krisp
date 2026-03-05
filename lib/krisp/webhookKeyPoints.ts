import sql from "./db";
import type {
  KrispWebhook,
  WebhookKeyPointsRow,
} from "@/types/webhook";
import {
  encryptNullable,
  decryptNullable,
  isEncrypted,
} from "@/lib/encryption";

// Raw SQL column names that are encrypted
const ENCRYPTED_COLS = ["meeting_title", "raw_meeting", "raw_content"] as const;

/**
 * Decrypt the encrypted columns on a raw SQL row object.
 * Handles both already-encrypted and plaintext (pre-migration) values.
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
 * Insert a new key points webhook into the database
 */
export async function insertWebhookKeyPoints(
  webhook: KrispWebhook,
  userId: string
): Promise<WebhookKeyPointsRow> {
  const { id, event, data } = webhook;
  const { meeting, content, raw_meeting, raw_content } = data;

  // Encrypt sensitive text fields before storing
  const encMeetingTitle = encryptNullable(meeting.title);
  const encRawMeeting = encryptNullable(raw_meeting);
  const encRawContent = encryptNullable(raw_content);

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
      ${encMeetingTitle},
      ${meeting.url},
      ${meeting.start_date ? new Date(meeting.start_date).toISOString() : null},
      ${meeting.end_date ? new Date(meeting.end_date).toISOString() : null},
      ${meeting.duration},
      ${JSON.stringify(meeting.speakers)},
      ${JSON.stringify(meeting.participants)},
      ${meeting.calendar_event_id},
      ${JSON.stringify(content)},
      ${encRawMeeting},
      ${encRawContent},
      ${JSON.stringify(webhook)}
    )
    RETURNING *
  `;

  return decryptRow(rows[0] as WebhookKeyPointsRow);
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
  if (!rows[0]) return null;
  return decryptRow(rows[0] as WebhookKeyPointsRow);
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
  return decryptRows(rows as WebhookKeyPointsRow[]);
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
  return decryptRows(rows as WebhookKeyPointsRow[]);
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
 * Search meetings by text.
 *
 * NOTE: With encrypted columns, PostgreSQL full-text search (tsvector) cannot
 * operate on ciphertext. Instead we fetch recent meetings, decrypt, and filter
 * application-side. For large datasets, vector/embedding search should be used.
 */
export async function searchMeetings(
  searchText: string,
  userId: string,
  limit: number = 10
): Promise<WebhookKeyPointsRow[]> {
  // Fetch a broader set of meetings and filter in-app after decryption
  const rows = await sql`
    SELECT *
    FROM webhook_key_points
    WHERE user_id = ${userId} AND deleted_at IS NULL
    ORDER BY received_at DESC
    LIMIT 200
  `;

  const decrypted = decryptRows(rows as WebhookKeyPointsRow[]);
  const lower = searchText.toLowerCase();

  const matched = decrypted.filter((row) => {
    const title = (row.meeting_title as string | null)?.toLowerCase() || "";
    const content = (row.raw_content as string | null)?.toLowerCase() || "";
    const keyPoints = typeof row.content === "string"
      ? row.content.toLowerCase()
      : JSON.stringify(row.content || "").toLowerCase();
    return title.includes(lower) || content.includes(lower) || keyPoints.includes(lower);
  });

  return matched.slice(0, limit);
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
      raw_content
    FROM webhook_key_points
    WHERE user_id = ${userId} AND deleted_at IS NULL
    ORDER BY meeting_start_date DESC
    LIMIT ${limit}
  `;

  return (rows as Record<string, unknown>[]).map((row) => {
    const decryptedTitle = typeof row.meeting_title === "string" && isEncrypted(row.meeting_title)
      ? decryptNullable(row.meeting_title)
      : row.meeting_title as string | null;
    const decryptedContent = typeof row.raw_content === "string" && isEncrypted(row.raw_content)
      ? decryptNullable(row.raw_content)
      : row.raw_content as string | null;

    return {
      id: row.id as number,
      meeting_id: row.meeting_id as string,
      meeting_title: decryptedTitle,
      meeting_start_date: row.meeting_start_date as Date | null,
      speakers: row.speakers as string[],
      content_preview: (decryptedContent || "").slice(0, 500),
    };
  });
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
  if (!rows[0]) return null;
  return decryptRow(rows[0] as WebhookKeyPointsRow);
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
 * Simple keyword search (application-side filtering after decryption).
 * Replaces the previous ILIKE approach since encrypted columns cannot
 * be searched with SQL pattern matching.
 */
export async function searchMeetingsSimple(
  searchText: string,
  userId: string,
  limit: number = 10
): Promise<WebhookKeyPointsRow[]> {
  // Fetch all non-deleted meetings for this user
  const rows = await sql`
    SELECT *
    FROM webhook_key_points
    WHERE user_id = ${userId} AND deleted_at IS NULL
    ORDER BY received_at DESC
    LIMIT 200
  `;

  const decrypted = decryptRows(rows as WebhookKeyPointsRow[]);
  const lower = searchText.toLowerCase();

  const matched = decrypted.filter((row) => {
    const title = (row.meeting_title as string | null)?.toLowerCase() || "";
    const content = (row.raw_content as string | null)?.toLowerCase() || "";
    const keyPoints = typeof row.content === "string"
      ? row.content.toLowerCase()
      : JSON.stringify(row.content || "").toLowerCase();
    return title.includes(lower) || content.includes(lower) || keyPoints.includes(lower);
  });

  return matched.slice(0, limit);
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
 *
 * NOTE: The keyword filter is applied application-side after decryption
 * since encrypted text columns can't use ILIKE in SQL.
 */
export async function getFilteredMeetings(
  userId: string,
  filters: MeetingFilters,
  limit: number = 100
): Promise<{ meetings: WebhookKeyPointsRow[]; total: number }> {
  const dateFrom = filters.dateFrom || null;
  const dateTo = filters.dateTo || null;
  const durationMin = filters.durationMin ?? null;
  const durationMax = filters.durationMax ?? null;
  const hasTranscript = filters.hasTranscript ?? null;
  const hasActionItems = filters.hasActionItems ?? null;
  const participantsJson = filters.participants && filters.participants.length > 0
    ? JSON.stringify(filters.participants)
    : null;
  const actionItemStatus = filters.actionItemStatus || null;

  // Fetch with all SQL-compatible filters (exclude keyword which needs decryption)
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

  let decrypted = decryptRows(rows as WebhookKeyPointsRow[]);

  // Apply keyword filter application-side on decrypted text
  if (filters.keyword) {
    const lower = filters.keyword.toLowerCase();
    decrypted = decrypted.filter((row) => {
      const title = (row.meeting_title as string | null)?.toLowerCase() || "";
      const content = (row.raw_content as string | null)?.toLowerCase() || "";
      const keyPoints = typeof row.content === "string"
        ? row.content.toLowerCase()
        : JSON.stringify(row.content || "").toLowerCase();
      return title.includes(lower) || content.includes(lower) || keyPoints.includes(lower);
    });
  }

  // Recalculate total after keyword filter
  const total = filters.keyword
    ? decrypted.length
    : (rows.length > 0 ? Number((rows[0] as Record<string, unknown>).total_count) : 0);

  return {
    meetings: decrypted,
    total,
  };
}

/**
 * Get all unique participants/speakers across all meetings for a user.
 * Used to populate the participant filter dropdown.
 * Note: speakers are stored in JSONB (not encrypted), so SQL query is unchanged.
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
