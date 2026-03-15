import { chatCompletion } from "@/lib/ai/client";
import { resolvePrompt } from "@/lib/ai/resolvePrompt";
import { PROMPT_SMART_LABEL_DRAFT_REPLY } from "@/lib/ai/prompts";
import { decryptNullable, isEncrypted } from "@/lib/encryption";
import {
  getContextEntries,
  addContextEntry,
  buildContextBlock,
  buildKanbanBlock,
} from "./contextWindow";
import { getActiveSmartLabels } from "./labels";
import sql from "./db";
import type { SmartLabel, EmailDraft } from "@/types/smartLabel";

/** No-reply patterns to skip draft generation. */
const NO_REPLY_PATTERNS = [
  /no-?reply/i,
  /noreply/i,
  /do-?not-?reply/i,
  /donotreply/i,
  /mailer-?daemon/i,
  /postmaster/i,
  /bounce/i,
];

/** Headers that indicate mailing list / bulk mail. */
const BULK_HEADERS = ["list-unsubscribe", "precedence"];
const BULK_PRECEDENCE_VALUES = ["bulk", "list", "junk"];

function maybeDecrypt(val: string | null | undefined): string | null {
  if (!val) return null;
  if (isEncrypted(val)) return decryptNullable(val);
  return val;
}

/**
 * Check if an email is replyable (not no-reply, not bulk/list).
 */
function isReplyable(sender: string, headers?: Record<string, string>): boolean {
  if (NO_REPLY_PATTERNS.some((p) => p.test(sender))) return false;
  if (headers) {
    if (headers["list-unsubscribe"]) return false;
    const precedence = headers["precedence"]?.toLowerCase();
    if (precedence && BULK_PRECEDENCE_VALUES.includes(precedence)) return false;
  }
  return true;
}

/**
 * Get drafts for a list of email IDs.
 */
export async function getDraftsForEmails(
  tenantId: string,
  emailIds: string[],
  emailType: string
): Promise<Record<string, EmailDraft>> {
  if (emailIds.length === 0) return {};

  const rows = await sql`
    SELECT id, tenant_id, email_id, email_type, label_id, draft_body,
           status, discarded_at, sent_at, created_at, updated_at
    FROM email_drafts
    WHERE tenant_id = ${tenantId}
      AND email_type = ${emailType}
      AND email_id = ANY(${emailIds})
      AND status = 'pending_review'
    ORDER BY created_at DESC
  `;

  const result: Record<string, EmailDraft> = {};
  for (const row of rows as EmailDraft[]) {
    // Keep only the latest draft per email
    if (!result[row.email_id]) {
      result[row.email_id] = row;
    }
  }
  return result;
}

/**
 * Get a single draft by ID.
 */
export async function getDraftById(
  draftId: string,
  tenantId: string
): Promise<EmailDraft | null> {
  const rows = await sql`
    SELECT id, tenant_id, email_id, email_type, label_id, draft_body,
           status, discarded_at, sent_at, created_at, updated_at
    FROM email_drafts
    WHERE id = ${draftId} AND tenant_id = ${tenantId}
  `;
  return (rows[0] as EmailDraft) ?? null;
}

/**
 * Update draft status.
 */
export async function updateDraftStatus(
  draftId: string,
  tenantId: string,
  status: "sent" | "discarded"
): Promise<EmailDraft | null> {
  const extra = status === "sent" ? ", sent_at = now()" : ", discarded_at = now()";
  const query = `
    UPDATE email_drafts
    SET status = $1, updated_at = now()${extra}
    WHERE id = $2 AND tenant_id = $3
    RETURNING id, tenant_id, email_id, email_type, label_id, draft_body,
              status, discarded_at, sent_at, created_at, updated_at
  `;
  const rows = await sql.query(query, [status, draftId, tenantId]);
  return (rows[0] as EmailDraft) ?? null;
}

/**
 * Fetch email details for draft generation.
 */
async function fetchEmailForDraft(
  emailId: string,
  emailType: string,
  tenantId: string
): Promise<{
  sender: string;
  subject: string | null;
  body: string | null;
  receivedAt: string;
} | null> {
  if (emailType === "email") {
    const rows = await sql`
      SELECT sender, subject, body_plain_text, received_at
      FROM emails
      WHERE id = ${parseInt(emailId, 10)} AND tenant_id = ${tenantId} AND deleted_at IS NULL
    `;
    if (rows.length === 0) return null;
    const e = rows[0] as { sender: string; subject: string | null; body_plain_text: string | null; received_at: string };
    return {
      sender: maybeDecrypt(e.sender) || "",
      subject: maybeDecrypt(e.subject),
      body: maybeDecrypt(e.body_plain_text),
      receivedAt: e.received_at,
    };
  }

  if (emailType === "gmail_email") {
    const rows = await sql`
      SELECT sender, subject, body_plain, received_at
      FROM gmail_emails
      WHERE id = ${emailId} AND tenant_id = ${tenantId}
    `;
    if (rows.length === 0) return null;
    const e = rows[0] as { sender: string; subject: string | null; body_plain: string | null; received_at: string };
    return {
      sender: maybeDecrypt(e.sender) || "",
      subject: maybeDecrypt(e.subject),
      body: maybeDecrypt(e.body_plain),
      receivedAt: e.received_at,
    };
  }

  return null;
}

/**
 * Generate a draft reply for an email classified under a label with auto-draft enabled.
 * Runs asynchronously — should be called without awaiting in the classification pipeline.
 */
export async function generateDraftReply(
  emailId: string,
  emailType: string,
  tenantId: string,
  label: SmartLabel
): Promise<EmailDraft | null> {
  try {
    // Fetch email content
    const email = await fetchEmailForDraft(emailId, emailType, tenantId);
    if (!email) return null;

    // Check if replyable
    if (!isReplyable(email.sender)) return null;

    // Check if a pending_review draft already exists for this email
    const existing = await sql`
      SELECT id FROM email_drafts
      WHERE email_id = ${emailId} AND email_type = ${emailType}
        AND tenant_id = ${tenantId} AND status = 'pending_review'
      LIMIT 1
    `;
    if (existing.length > 0) return null;

    // Add to context window (non-blocking entry)
    await addContextEntry(
      label.id,
      {
        emailId,
        emailType,
        sender: email.sender,
        subject: email.subject,
        receivedAt: email.receivedAt,
        bodyExcerpt: email.body?.slice(0, 1200) || null,
      },
      label.context_window_max
    );

    // Build Layer 1: Label context
    const entries = await getContextEntries(label.id);
    const contextBlock = buildContextBlock(entries);
    const kanbanBlock = await buildKanbanBlock(label.name, tenantId);

    // Build Layer 2: Current email
    const currentEmail = [
      `From: ${email.sender}`,
      `Subject: ${email.subject || "(No subject)"}`,
      `Body:\n${(email.body || "").slice(0, 3000)}`,
    ].join("\n");

    // Resolve system prompt
    const systemPrompt = await resolvePrompt(PROMPT_SMART_LABEL_DRAFT_REPLY, tenantId);

    // Assemble full prompt
    const parts: string[] = [systemPrompt, ""];

    if (contextBlock) {
      parts.push(
        "=== LABEL CONTEXT: Recent emails in this category and how they were handled ===",
        contextBlock,
        ""
      );
    }

    if (kanbanBlock) {
      parts.push(
        "=== RELATED WORK ITEMS ===",
        kanbanBlock,
        ""
      );
    }

    parts.push(
      "=== CURRENT EMAIL (reply to this) ===",
      currentEmail
    );

    const prompt = parts.join("\n");
    const draftBody = await chatCompletion(prompt, {
      maxTokens: 800,
      userId: tenantId,
      triggerType: "smart_label_draft",
      promptKey: PROMPT_SMART_LABEL_DRAFT_REPLY,
      entityType: emailType,
      entityId: emailId,
    });

    if (!draftBody.trim()) return null;

    // Store draft
    const rows = await sql`
      INSERT INTO email_drafts
        (tenant_id, email_id, email_type, label_id, draft_body)
      VALUES
        (${tenantId}, ${emailId}, ${emailType}, ${label.id}, ${draftBody.trim()})
      RETURNING id, tenant_id, email_id, email_type, label_id, draft_body,
                status, discarded_at, sent_at, created_at, updated_at
    `;

    return (rows[0] as EmailDraft) ?? null;
  } catch (err) {
    // Silently log — never surface AI errors to the user inline
    console.error(`Draft generation failed for ${emailType}:${emailId}:`, err);
    return null;
  }
}

/**
 * After classification, trigger draft generation for all matching labels that have auto-draft enabled.
 * Uses the highest-priority (first) matching label only if multiple match.
 */
export async function triggerDraftGeneration(
  emailId: string,
  emailType: string,
  tenantId: string,
  matchedLabelNames: string[]
): Promise<void> {
  if (matchedLabelNames.length === 0) return;

  try {
    const labels = await getActiveSmartLabels(tenantId);
    const draftLabels = labels.filter(
      (l) => l.auto_draft_enabled && matchedLabelNames.includes(l.name)
    );

    if (draftLabels.length === 0) return;

    // Use highest-priority (first) matching label to avoid duplicate drafts
    const label = draftLabels[0];
    // Fire and forget — non-blocking
    generateDraftReply(emailId, emailType, tenantId, label).catch((err) => {
      console.error("Background draft generation error:", err);
    });
  } catch (err) {
    console.error("triggerDraftGeneration error:", err);
  }
}
