import sql from "./db";
import type { SmartLabelContextEntry } from "@/types/smartLabel";

/** Approximate token count — ~4 chars per token. */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/** Max body excerpt length (~300 tokens). */
const MAX_EXCERPT_CHARS = 1200;

/** Hard cap for the entire context block injected into the prompt. */
const CONTEXT_TOKEN_CAP = 1500;

/** Separate cap for the Kanban card block. */
const KANBAN_TOKEN_CAP = 400;

/**
 * Get context entries for a label, ordered newest-first.
 */
export async function getContextEntries(
  labelId: string
): Promise<SmartLabelContextEntry[]> {
  const rows = await sql`
    SELECT id, label_id, email_id, email_type, sender, subject,
           received_at, body_excerpt, user_replied, reply_excerpt, created_at
    FROM smart_label_context_entries
    WHERE label_id = ${labelId}
    ORDER BY created_at DESC
  `;
  return rows as SmartLabelContextEntry[];
}

/**
 * Add an email to a label's context window and evict old entries if over the max.
 */
export async function addContextEntry(
  labelId: string,
  entry: {
    emailId: string;
    emailType: string;
    sender: string;
    subject: string | null;
    receivedAt: string;
    bodyExcerpt: string | null;
    userReplied?: boolean;
    replyExcerpt?: string | null;
  },
  maxEntries: number = 7
): Promise<void> {
  const bodyExcerpt = entry.bodyExcerpt
    ? entry.bodyExcerpt.slice(0, MAX_EXCERPT_CHARS)
    : null;

  await sql`
    INSERT INTO smart_label_context_entries
      (label_id, email_id, email_type, sender, subject, received_at, body_excerpt, user_replied, reply_excerpt)
    VALUES
      (${labelId}, ${entry.emailId}, ${entry.emailType}, ${entry.sender},
       ${entry.subject}, ${entry.receivedAt}, ${bodyExcerpt},
       ${entry.userReplied ?? false}, ${entry.replyExcerpt ?? null})
  `;

  // Evict oldest entries beyond the window max
  await sql`
    DELETE FROM smart_label_context_entries
    WHERE id IN (
      SELECT id FROM smart_label_context_entries
      WHERE label_id = ${labelId}
      ORDER BY created_at DESC
      OFFSET ${maxEntries}
    )
  `;
}

/**
 * Update a context entry with the user's reply excerpt (after sending a reply).
 */
export async function updateContextEntryReply(
  labelId: string,
  emailId: string,
  emailType: string,
  replyExcerpt: string
): Promise<void> {
  await sql`
    UPDATE smart_label_context_entries
    SET user_replied = true, reply_excerpt = ${replyExcerpt.slice(0, MAX_EXCERPT_CHARS)}
    WHERE label_id = ${labelId} AND email_id = ${emailId} AND email_type = ${emailType}
  `;
}

/**
 * Delete a specific context entry.
 */
export async function deleteContextEntry(entryId: string): Promise<boolean> {
  const rows = await sql`
    DELETE FROM smart_label_context_entries
    WHERE id = ${entryId}
    RETURNING id
  `;
  return rows.length > 0;
}

/**
 * Build the token-budgeted context block for prompt injection.
 * Never truncates reply_excerpt (highest signal).
 * Proportionally truncates body_excerpt if total exceeds CONTEXT_TOKEN_CAP.
 */
export function buildContextBlock(
  entries: SmartLabelContextEntry[]
): string {
  if (entries.length === 0) return "";

  // Build raw entries
  const parts: { text: string; bodyStart: number; bodyEnd: number }[] = [];

  for (const e of entries) {
    const lines: string[] = [
      `- From: ${e.sender}`,
      `  Subject: ${e.subject || "(No subject)"}`,
      `  Date: ${new Date(e.received_at).toLocaleDateString()}`,
    ];
    const bodyStartIdx = lines.join("\n").length;
    if (e.body_excerpt) {
      lines.push(`  Body excerpt: ${e.body_excerpt}`);
    }
    const bodyEndIdx = lines.join("\n").length;
    if (e.user_replied && e.reply_excerpt) {
      lines.push(`  User's reply: ${e.reply_excerpt}`);
    } else if (!e.user_replied) {
      lines.push(`  (No reply sent)`);
    }
    parts.push({
      text: lines.join("\n"),
      bodyStart: bodyStartIdx,
      bodyEnd: bodyEndIdx,
    });
  }

  let combined = parts.map((p) => p.text).join("\n\n");
  let totalTokens = estimateTokens(combined);

  // If over budget, proportionally truncate body excerpts
  if (totalTokens > CONTEXT_TOKEN_CAP) {
    const ratio = CONTEXT_TOKEN_CAP / totalTokens;
    const truncated: string[] = [];

    for (const e of entries) {
      const lines: string[] = [
        `- From: ${e.sender}`,
        `  Subject: ${e.subject || "(No subject)"}`,
        `  Date: ${new Date(e.received_at).toLocaleDateString()}`,
      ];
      if (e.body_excerpt) {
        const maxBodyChars = Math.floor(e.body_excerpt.length * ratio);
        lines.push(
          `  Body excerpt: ${e.body_excerpt.slice(0, Math.max(maxBodyChars, 50))}...`
        );
      }
      // Never truncate reply excerpts
      if (e.user_replied && e.reply_excerpt) {
        lines.push(`  User's reply: ${e.reply_excerpt}`);
      } else if (!e.user_replied) {
        lines.push(`  (No reply sent)`);
      }
      truncated.push(lines.join("\n"));
    }
    combined = truncated.join("\n\n");
  }

  return combined;
}

/**
 * Build a Kanban card context block for a label.
 * Queries cards that share the label's tag and are active (non-archived).
 * Prioritizes overdue / in-progress cards.
 */
export async function buildKanbanBlock(
  labelName: string,
  tenantId: string
): Promise<string> {
  const rows = await sql`
    SELECT c.title, col.title as column_title, c.priority, c.due_date,
           LEFT(c.description, 200) as description_excerpt
    FROM cards c
    JOIN columns col ON c.column_id = col.id
    JOIN boards b ON col.board_id = b.id
    LEFT JOIN card_tags ct ON ct.card_id = c.id
    WHERE b.user_id = ${tenantId}
      AND c.archived = false
      AND c.deleted_at IS NULL
      AND (
        ct.label ILIKE ${labelName}
        OR c.title ILIKE ${"%" + labelName + "%"}
      )
    ORDER BY
      CASE WHEN c.due_date IS NOT NULL AND c.due_date < now() THEN 0 ELSE 1 END,
      CASE WHEN col.title ILIKE '%progress%' THEN 0
           WHEN col.title ILIKE '%doing%' THEN 0
           WHEN col.title ILIKE '%backlog%' THEN 2
           WHEN col.title ILIKE '%done%' THEN 3
           ELSE 1 END,
      c.due_date ASC NULLS LAST
    LIMIT 5
  `;

  if (rows.length === 0) return "";

  const lines: string[] = [];
  for (const r of rows as {
    title: string;
    column_title: string;
    priority: string | null;
    due_date: string | null;
    description_excerpt: string | null;
  }[]) {
    const parts = [
      `- "${r.title}" [${r.column_title}]`,
      r.priority ? `Priority: ${r.priority}` : null,
      r.due_date ? `Due: ${new Date(r.due_date).toLocaleDateString()}` : null,
      r.description_excerpt ? r.description_excerpt.trim() : null,
    ];
    lines.push(parts.filter(Boolean).join(" | "));
  }

  let block = lines.join("\n");
  // Enforce Kanban token budget
  if (estimateTokens(block) > KANBAN_TOKEN_CAP) {
    const maxChars = KANBAN_TOKEN_CAP * 4;
    block = block.slice(0, maxChars) + "...";
  }

  return block;
}
