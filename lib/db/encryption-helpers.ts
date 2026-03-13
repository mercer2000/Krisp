/**
 * Drizzle ORM encryption helpers.
 *
 * Provides `encryptFields` and `decryptFields` that work on plain objects,
 * encrypting/decrypting only the specified keys. Callers wrap their
 * insert values and query results with these helpers so encryption
 * is invisible to route handlers and components.
 */

import {
  encrypt,
  decrypt,
  encryptNullable,
  decryptNullable,
  isEncrypted,
} from "@/lib/encryption";

// ── Per-table field lists ────────────────────────────────────────

/** webhook_key_points columns that store sensitive plaintext */
export const WEBHOOK_ENCRYPTED_FIELDS = [
  "meetingTitle",
  "rawMeeting",
  "rawContent",
] as const;

/** emails columns that store sensitive plaintext */
export const EMAIL_ENCRYPTED_FIELDS = [
  "sender",
  "subject",
  "bodyPlainText",
  "bodyHtml",
] as const;

/** gmail_emails columns that store sensitive plaintext */
export const GMAIL_EMAIL_ENCRYPTED_FIELDS = [
  "sender",
  "subject",
  "bodyPlain",
  "bodyHtml",
] as const;

/** decisions columns that store sensitive plaintext */
export const DECISION_ENCRYPTED_FIELDS = [
  "statement",
  "context",
  "rationale",
  "annotation",
] as const;

/** action_items columns that store sensitive plaintext */
export const ACTION_ITEM_ENCRYPTED_FIELDS = [
  "title",
  "description",
  "assignee",
] as const;

/** cards columns that store sensitive plaintext */
export const CARD_ENCRYPTED_FIELDS = ["title", "description"] as const;

/** brain_chat_messages columns that store sensitive plaintext */
export const BRAIN_CHAT_MESSAGE_ENCRYPTED_FIELDS = ["content"] as const;

/** brain_chat_sessions columns that store sensitive plaintext */
export const BRAIN_CHAT_SESSION_ENCRYPTED_FIELDS = ["title"] as const;

/** calendar_events columns that store sensitive plaintext */
export const CALENDAR_EVENT_ENCRYPTED_FIELDS = [
  "subject",
  "bodyPreview",
  "bodyHtml",
  "location",
] as const;

/** zoom_chat_messages columns that store sensitive plaintext */
export const ZOOM_CHAT_ENCRYPTED_FIELDS = [
  "messageContent",
  "senderName",
] as const;

/** weekly_reviews columns that store sensitive plaintext */
export const WEEKLY_REVIEW_ENCRYPTED_FIELDS = ["synthesisReport"] as const;

/** brain_thoughts columns that store sensitive plaintext */
export const BRAIN_THOUGHT_ENCRYPTED_FIELDS = ["content"] as const;

/** daily_briefings columns that store sensitive plaintext */
export const DAILY_BRIEFING_ENCRYPTED_FIELDS = ["briefingHtml"] as const;

/** weekly_plans columns that store sensitive plaintext */
export const WEEKLY_PLAN_ENCRYPTED_FIELDS = [
  "aiAssessment",
  "userReflection",
] as const;

/** daily_themes columns that store sensitive plaintext */
export const DAILY_THEME_ENCRYPTED_FIELDS = ["aiRationale"] as const;

/** email_contacts columns that store sensitive plaintext (email stored plaintext for dedup) */
export const EMAIL_CONTACT_ENCRYPTED_FIELDS = ["displayName"] as const;

// ── Generic helpers ──────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObject = Record<string, any>;

/**
 * Encrypt specified fields on an object before inserting/updating.
 * - Non-null string fields are encrypted.
 * - null values stay null.
 * - Fields not in the list are passed through unchanged.
 * - Already-encrypted values (with `enc:v1:` prefix) are skipped.
 */
export function encryptFields<T extends AnyObject>(
  obj: T,
  fields: readonly string[]
): T {
  const result = { ...obj };
  for (const field of fields) {
    if (field in result) {
      const value = result[field];
      if (typeof value === "string" && !isEncrypted(value)) {
        (result as AnyObject)[field] = encrypt(value);
      }
      // null stays null, non-string values pass through
    }
  }
  return result;
}

/**
 * Decrypt specified fields on an object after reading from the database.
 * - Encrypted strings (with `enc:v1:` prefix) are decrypted.
 * - null values stay null.
 * - Plaintext values (not yet migrated) pass through unchanged.
 */
export function decryptFields<T extends AnyObject>(
  obj: T,
  fields: readonly string[]
): T {
  const result = { ...obj };
  for (const field of fields) {
    if (field in result) {
      const value = result[field];
      if (typeof value === "string" && isEncrypted(value)) {
        (result as AnyObject)[field] = decrypt(value);
      }
      // null, non-string, or non-encrypted strings pass through
    }
  }
  return result;
}

/**
 * Decrypt an array of rows.
 */
export function decryptRows<T extends AnyObject>(
  rows: T[],
  fields: readonly string[]
): T[] {
  return rows.map((row) => decryptFields(row, fields));
}

// ── Raw SQL helpers (for neon tagged templates) ──────────────────

/**
 * Encrypt a value for insertion via raw SQL.
 * Handles null gracefully.
 */
export { encrypt, decrypt, encryptNullable, decryptNullable, isEncrypted };
