import { chatCompletion } from "@/lib/ai/client";
import { resolvePrompt } from "@/lib/ai/resolvePrompt";
import { PROMPT_SMART_LABEL_CLASSIFY } from "@/lib/ai/prompts";
import {
  getActiveSmartLabels,
  assignSmartLabel,
  isItemSmartClassified,
} from "./labels";
import { triggerDraftGeneration } from "./draftGeneration";
import { moveEmailAfterClassification } from "./folderSync";
import sql from "./db";
import { decryptNullable, isEncrypted } from "@/lib/encryption";
import type { SmartLabel } from "@/types/smartLabel";
import { logActivity } from "@/lib/activity/log";

/** Max body characters sent to the AI to control token usage. */
const MAX_BODY_CHARS = 3000;

/** Maximum labels evaluated per classification pass. */
const MAX_LABELS_PER_PASS = 20;

interface ClassificationMatch {
  label: string;
  confidence: number;
}

interface ClassificationResult {
  matches: ClassificationMatch[];
}

/** Decrypt a value if it's encrypted, otherwise return as-is. */
function maybeDecrypt(val: string | null | undefined): string | null {
  if (!val) return null;
  if (isEncrypted(val)) return decryptNullable(val);
  return val;
}

/**
 * Build a text summary from pre-fetched email data (avoids DB round-trip).
 */
export function buildEmailContent(data: {
  sender: string;
  recipients?: string[];
  subject?: string | null;
  bodyPlainText?: string | null;
}): string {
  return [
    `From: ${data.sender}`,
    `To: ${(data.recipients ?? []).join(", ")}`,
    `Subject: ${data.subject || "(No subject)"}`,
    `Body:\n${(data.bodyPlainText || "").slice(0, MAX_BODY_CHARS)}`,
  ].join("\n");
}

/**
 * Fetch item content from the database based on type and ID.
 */
export async function fetchItemContent(
  itemType: string,
  itemId: string,
  tenantId: string
): Promise<string | null> {
  switch (itemType) {
    case "email": {
      const rows = await sql`
        SELECT sender, subject, body_plain_text, recipients
        FROM emails
        WHERE id = ${parseInt(itemId, 10)} AND tenant_id = ${tenantId} AND deleted_at IS NULL
      `;
      if (rows.length === 0) return null;
      const e = rows[0] as { sender: string; subject: string | null; body_plain_text: string | null; recipients: string[] };
      return [
        `From: ${maybeDecrypt(e.sender) || ""}`,
        `To: ${Array.isArray(e.recipients) ? e.recipients.join(", ") : ""}`,
        `Subject: ${maybeDecrypt(e.subject) || "(No subject)"}`,
        `Body:\n${(maybeDecrypt(e.body_plain_text) || "").slice(0, MAX_BODY_CHARS)}`,
      ].join("\n");
    }
    case "gmail_email": {
      const rows = await sql`
        SELECT sender, subject, body_plain, recipients
        FROM gmail_emails
        WHERE id = ${parseInt(itemId, 10)} AND tenant_id = ${tenantId}
      `;
      if (rows.length === 0) return null;
      const e = rows[0] as { sender: string; subject: string | null; body_plain: string | null; recipients: string[] };
      return [
        `From: ${maybeDecrypt(e.sender) || ""}`,
        `To: ${Array.isArray(e.recipients) ? e.recipients.join(", ") : ""}`,
        `Subject: ${maybeDecrypt(e.subject) || "(No subject)"}`,
        `Body:\n${(maybeDecrypt(e.body_plain) || "").slice(0, MAX_BODY_CHARS)}`,
      ].join("\n");
    }
    case "card": {
      const rows = await sql`
        SELECT c.title, c.description, c.priority, c.due_date
        FROM cards c
        JOIN columns col ON c.column_id = col.id
        JOIN boards b ON col.board_id = b.id
        WHERE c.id = ${itemId} AND b.user_id = ${tenantId}
      `;
      if (rows.length === 0) return null;
      const c = rows[0] as { title: string; description: string | null; priority: string | null; due_date: string | null };
      return [
        `Title: ${c.title}`,
        c.description ? `Description: ${c.description.slice(0, MAX_BODY_CHARS)}` : "",
        c.priority ? `Priority: ${c.priority}` : "",
        c.due_date ? `Due: ${c.due_date}` : "",
      ].filter(Boolean).join("\n");
    }
    case "action_item": {
      const rows = await sql`
        SELECT title, description, assignee, priority, status, due_date
        FROM action_items
        WHERE id = ${parseInt(itemId, 10)} AND tenant_id = ${tenantId}
      `;
      if (rows.length === 0) return null;
      const a = rows[0] as { title: string; description: string | null; assignee: string | null; priority: string | null; status: string | null; due_date: string | null };
      return [
        `Title: ${a.title}`,
        a.description ? `Description: ${a.description.slice(0, MAX_BODY_CHARS)}` : "",
        a.assignee ? `Assignee: ${a.assignee}` : "",
        a.priority ? `Priority: ${a.priority}` : "",
        a.status ? `Status: ${a.status}` : "",
        a.due_date ? `Due: ${a.due_date}` : "",
      ].filter(Boolean).join("\n");
    }
    case "meeting": {
      const rows = await sql`
        SELECT m.title, m.start_time, m.participants,
               array_agg(wkp.key_point) as key_points
        FROM webhook_key_points wkp
        JOIN meetings m ON m.id = wkp.meeting_id
        WHERE m.id = ${parseInt(itemId, 10)} AND m.tenant_id = ${tenantId}
        GROUP BY m.id
      `;
      if (rows.length === 0) return null;
      const m = rows[0] as { title: string; start_time: string; participants: string[] | null; key_points: string[] };
      return [
        `Meeting: ${m.title}`,
        `Date: ${m.start_time}`,
        m.participants ? `Participants: ${(Array.isArray(m.participants) ? m.participants : []).join(", ")}` : "",
        `Key Points:\n${(m.key_points || []).slice(0, 20).join("\n")}`,
      ].filter(Boolean).join("\n");
    }
    default:
      return null;
  }
}

/**
 * Classify a single item against all active smart labels.
 * Idempotent: skips if already classified by AI.
 *
 * @param options.force     Re-classify even if already classified
 * @param options.content   Pre-fetched plaintext content (skips DB fetch)
 */
export async function classifyItem(
  itemType: string,
  itemId: string,
  tenantId: string,
  options?: { force?: boolean; content?: string }
): Promise<{ matches: string[]; skipped: boolean }> {
  // Idempotency check (unless forced)
  if (!options?.force && await isItemSmartClassified(itemType, itemId)) {
    return { matches: [], skipped: true };
  }

  const labels = await getActiveSmartLabels(tenantId);
  if (labels.length === 0) {
    return { matches: [], skipped: false };
  }

  const content = options?.content || await fetchItemContent(itemType, itemId, tenantId);
  if (!content) {
    return { matches: [], skipped: false };
  }

  // Limit labels per pass
  const labelsToEvaluate = labels.slice(0, MAX_LABELS_PER_PASS);

  const instructions = await resolvePrompt(PROMPT_SMART_LABEL_CLASSIFY, tenantId);

  const labelDescriptions = labelsToEvaluate
    .map((l) => `- "${l.name}": ${l.prompt}`)
    .join("\n");

  const prompt = `${instructions}

Labels to evaluate:
${labelDescriptions}

Item (${itemType}):
${content}`;

  const text = await chatCompletion(prompt, {
    maxTokens: 500,
    userId: tenantId,
    triggerType: "smart_label_classify",
    promptKey: PROMPT_SMART_LABEL_CLASSIFY,
    entityType: itemType,
    entityId: itemId,
  });

  let result: ClassificationResult;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    result = jsonMatch ? JSON.parse(jsonMatch[0]) : { matches: [] };
  } catch {
    console.error("Failed to parse smart label classification:", text);
    return { matches: [], skipped: false };
  }

  if (!result.matches || result.matches.length === 0) {
    return { matches: [], skipped: false };
  }

  // Map label names to IDs and assign
  const labelMap = new Map<string, SmartLabel>(
    labelsToEvaluate.map((l) => [l.name, l])
  );

  const matched: string[] = [];
  for (const match of result.matches) {
    const label = labelMap.get(match.label);
    if (label && match.confidence >= 70) {
      await assignSmartLabel(
        label.id,
        itemType,
        itemId,
        match.confidence,
        "ai"
      );
      matched.push(match.label);
    }
  }

  // Log activity for smart label matches
  if (matched.length > 0) {
    logActivity({
      userId: tenantId,
      eventType: "smart_label.triggered",
      title: `Smart label matched: ${matched.join(", ")}`,
      description: `Applied to ${itemType} #${itemId}`,
      entityType: itemType,
      entityId: itemId,
      metadata: { labels: matched, itemType },
    });
  }

  // Trigger auto-draft generation for email types (non-blocking)
  if (matched.length > 0 && (itemType === "email" || itemType === "gmail_email")) {
    triggerDraftGeneration(itemId, itemType, tenantId, matched);
  }

  // Move email to first matching label's Outlook folder (non-blocking)
  if (matched.length > 0 && itemType === "email") {
    moveEmailAfterClassification(itemId, tenantId, matched).catch((err) => {
      console.error(
        `[SmartLabels] Folder move failed for email ${itemId}:`,
        err instanceof Error ? err.message : err
      );
    });
  }

  return { matches: matched, skipped: false };
}

/**
 * Classify a batch of unclassified items.
 */
export async function classifyBatch(
  itemType: string,
  tenantId: string,
  limit: number = 10
): Promise<{ classified: number; skipped: number; errors: number }> {
  // Get unclassified item IDs
  let itemIds: string[] = [];

  switch (itemType) {
    case "email": {
      const rows = await sql`
        SELECT e.id::text as item_id
        FROM emails e
        WHERE e.tenant_id = ${tenantId}
          AND e.deleted_at IS NULL
          AND NOT EXISTS (
            SELECT 1 FROM smart_label_items sli
            WHERE sli.item_type = 'email' AND sli.item_id = e.id::text AND sli.assigned_by = 'ai'
          )
        ORDER BY e.received_at DESC
        LIMIT ${limit}
      `;
      itemIds = (rows as { item_id: string }[]).map((r) => r.item_id);
      break;
    }
    case "gmail_email": {
      const rows = await sql`
        SELECT g.id::text as item_id
        FROM gmail_emails g
        WHERE g.tenant_id = ${tenantId}
          AND NOT EXISTS (
            SELECT 1 FROM smart_label_items sli
            WHERE sli.item_type = 'gmail_email' AND sli.item_id = g.id::text AND sli.assigned_by = 'ai'
          )
        ORDER BY g.received_at DESC
        LIMIT ${limit}
      `;
      itemIds = (rows as { item_id: string }[]).map((r) => r.item_id);
      break;
    }
    case "card": {
      const rows = await sql`
        SELECT c.id::text as item_id
        FROM cards c
        JOIN columns col ON c.column_id = col.id
        JOIN boards b ON col.board_id = b.id
        WHERE b.user_id = ${tenantId}
          AND c.archived = false
          AND NOT EXISTS (
            SELECT 1 FROM smart_label_items sli
            WHERE sli.item_type = 'card' AND sli.item_id = c.id::text AND sli.assigned_by = 'ai'
          )
        ORDER BY c.created_at DESC
        LIMIT ${limit}
      `;
      itemIds = (rows as { item_id: string }[]).map((r) => r.item_id);
      break;
    }
    case "action_item": {
      const rows = await sql`
        SELECT ai.id::text as item_id
        FROM action_items ai
        WHERE ai.tenant_id = ${tenantId}
          AND NOT EXISTS (
            SELECT 1 FROM smart_label_items sli
            WHERE sli.item_type = 'action_item' AND sli.item_id = ai.id::text AND sli.assigned_by = 'ai'
          )
        ORDER BY ai.created_at DESC
        LIMIT ${limit}
      `;
      itemIds = (rows as { item_id: string }[]).map((r) => r.item_id);
      break;
    }
    default:
      return { classified: 0, skipped: 0, errors: 0 };
  }

  let classified = 0;
  let skipped = 0;
  let errors = 0;

  for (const itemId of itemIds) {
    try {
      const result = await classifyItem(itemType, itemId, tenantId);
      if (result.skipped) {
        skipped++;
      } else if (result.matches.length > 0) {
        classified++;
      }
    } catch (err) {
      console.error(`Smart label classification failed for ${itemType}:${itemId}:`, err);
      errors++;
    }
  }

  return { classified, skipped, errors };
}
