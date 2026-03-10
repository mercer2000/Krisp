import { chatCompletion } from "@/lib/ai/client";
import { resolvePrompt } from "@/lib/ai/resolvePrompt";
import {
  PROMPT_PAGE_RULE_CLASSIFY,
  PROMPT_PAGE_ENTRY_EXTRACT,
} from "@/lib/ai/prompts";
import { fetchItemContent } from "@/lib/smartLabels/classify";
import { assignSmartLabel } from "@/lib/smartLabels/labels";
import sql from "@/lib/smartLabels/db";
import { db } from "@/lib/db";
import { pageEntries } from "@/lib/db/schema";
import { logActivity } from "@/lib/activity/log";
import { getValidOutlookAccessToken } from "@/lib/outlook/oauth";
import { moveMessageToFolder } from "@/lib/outlook/folders";

interface PageWithSmartRule {
  id: string;
  title: string;
  smartRule: string;
  smartRuleFolderId: string | null;
  smartRuleAccountId: string | null;
}

interface ClassifyMatch {
  pageId: string;
  confidence: number;
}

interface ExtractedEntry {
  entry_type: "email_summary" | "knowledge" | "decision";
  title: string;
  content: string;
}

interface RouteResult {
  pageId: string;
  pageTitle: string;
  entriesCreated: number;
}

const VALID_ENTRY_TYPES = new Set<ExtractedEntry["entry_type"]>(["email_summary", "knowledge", "decision"]);
const EMAIL_ITEM_TYPES = new Set(["email", "gmail_email"]);

/**
 * Find or create a smart label matching the page title, then assign it to the item.
 */
async function labelItemWithPageName(
  pageTitle: string,
  itemType: string,
  itemId: string,
  userId: string,
  confidence: number
): Promise<void> {
  // Find existing smart label with matching name (case-insensitive)
  const existing = await sql`
    SELECT id FROM smart_labels
    WHERE tenant_id = ${userId} AND LOWER(name) = LOWER(${pageTitle})
    LIMIT 1
  `;

  let labelId: string;
  if (existing.length > 0) {
    labelId = existing[0].id as string;
  } else {
    // Auto-create a smart label for this page
    const created = await sql`
      INSERT INTO smart_labels (tenant_id, name, prompt, color, active)
      VALUES (${userId}, ${pageTitle}, ${`Auto-created from page smart rule: ${pageTitle}`}, '#8B5CF6', true)
      RETURNING id
    `;
    labelId = created[0].id as string;
  }

  await assignSmartLabel(labelId, itemType, itemId, confidence, "ai");
}

/**
 * Fetch all active pages with smart rules for a given user (by tenant/user ID).
 * Uses unauthenticated sql connection (same pattern as smart label webhook context).
 */
async function getActivePagesWithSmartRules(
  userId: string
): Promise<PageWithSmartRule[]> {
  const rows = await sql`
    SELECT p.id, p.title, p.smart_rule, p.smart_rule_folder_id, p.smart_rule_account_id
    FROM pages p
    JOIN workspaces w ON p.workspace_id = w.id
    WHERE w.owner_id = ${userId}
      AND p.smart_active = true
      AND p.smart_rule IS NOT NULL
      AND p.is_archived = false
  `;

  return (rows as Array<{
    id: string;
    title: string;
    smart_rule: string;
    smart_rule_folder_id: string | null;
    smart_rule_account_id: string | null;
  }>).map((r) => ({
    id: r.id,
    title: r.title,
    smartRule: r.smart_rule,
    smartRuleFolderId: r.smart_rule_folder_id,
    smartRuleAccountId: r.smart_rule_account_id,
  }));
}

/**
 * Extract content entries and insert them into page_entries for a single matched page.
 * Accepts pre-resolved instructions to avoid redundant DB lookups.
 */
async function extractAndCreateEntries(
  page: PageWithSmartRule,
  itemType: string,
  itemId: string,
  content: string,
  userId: string,
  extractInstructions: string
): Promise<number> {
  const prompt = `${extractInstructions}

Page: "${page.title}"
Page smart rule: ${page.smartRule}

Item (${itemType}):
${content}`;

  const text = await chatCompletion(prompt, { maxTokens: 1000, userId });

  let entries: ExtractedEntry[];
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { entries: [] };
    entries = parsed.entries || [];
  } catch {
    console.error("[PageRules] Failed to parse entry extraction:", text);
    return 0;
  }

  if (entries.length === 0) return 0;

  let created = 0;
  for (const entry of entries) {
    try {
      const entryType = VALID_ENTRY_TYPES.has(entry.entry_type)
        ? entry.entry_type
        : EMAIL_ITEM_TYPES.has(itemType) ? "email_summary" : "knowledge";

      const inserted = await db
        .insert(pageEntries)
        .values({
          pageId: page.id,
          entryType,
          title: (entry.title || "").slice(0, 500),
          content: entry.content || "",
          sourceType: itemType,
          sourceId: itemId,
          metadata: { autoRouted: true, confidence: null },
        })
        .onConflictDoNothing()
        .returning({ id: pageEntries.id });

      if (inserted.length > 0) {
        created++;

        logActivity({
          userId,
          eventType: "page.entry_auto_added",
          title: `Auto-added to "${page.title}": ${(entry.title || "").slice(0, 100)}`,
          description: `${entryType} entry from ${itemType} #${itemId}`,
          entityType: "page",
          entityId: page.id,
          metadata: { pageId: page.id, entryType, itemType, itemId },
        });
      }
    } catch (err) {
      console.error(
        `[PageRules] Failed to insert entry for page ${page.id}:`,
        err instanceof Error ? err.message : err
      );
    }
  }

  return created;
}

/**
 * Move an Outlook email to the page's linked folder.
 */
async function moveEmailToPageFolder(
  page: PageWithSmartRule,
  itemId: string,
  userId: string
): Promise<void> {
  if (!page.smartRuleFolderId || !page.smartRuleAccountId) return;

  try {
    const accessToken = await getValidOutlookAccessToken(
      page.smartRuleAccountId,
      userId
    );

    // Get the Graph message ID from the email record
    const rows = await sql`
      SELECT message_id FROM emails
      WHERE id = ${parseInt(itemId, 10)} AND tenant_id = ${userId}
    `;
    if (rows.length === 0 || !rows[0].message_id) return;

    await moveMessageToFolder(
      accessToken,
      rows[0].message_id as string,
      page.smartRuleFolderId
    );

    console.log(
      `[PageRules] Moved email ${itemId} to folder "${page.smartRuleFolderId}" for page "${page.title}"`
    );
  } catch (err) {
    console.error(
      `[PageRules] Folder move failed for email ${itemId} → page "${page.title}":`,
      err instanceof Error ? err.message : err
    );
  }
}

/**
 * Classify an item against all active page smart rules for a user.
 * For each matched page, extracts content entries and inserts into page_entries.
 *
 * @param itemType  "email" | "gmail_email" | "meeting" etc.
 * @param itemId    Database row ID of the item
 * @param userId    User/tenant ID (owner of pages)
 * @param options.content  Pre-built content string (avoids DB fetch)
 */
export async function classifyItemForPages(
  itemType: string,
  itemId: string,
  userId: string,
  options?: { content?: string }
): Promise<{ routed: RouteResult[] }> {
  const pages = await getActivePagesWithSmartRules(userId);
  if (pages.length === 0) {
    return { routed: [] };
  }

  const content =
    options?.content || (await fetchItemContent(itemType, itemId, userId));
  if (!content) {
    return { routed: [] };
  }

  // Resolve both prompts upfront (avoids N redundant DB queries in the loop)
  const [classifyInstructions, extractInstructions] = await Promise.all([
    resolvePrompt(PROMPT_PAGE_RULE_CLASSIFY, userId),
    resolvePrompt(PROMPT_PAGE_ENTRY_EXTRACT, userId),
  ]);

  const pageDescriptions = pages
    .map((p) => `- "${p.title}" (id: ${p.id}): ${p.smartRule}`)
    .join("\n");

  const prompt = `${classifyInstructions}

Pages to evaluate:
${pageDescriptions}

Item (${itemType}):
${content}`;

  const text = await chatCompletion(prompt, { maxTokens: 500, userId });

  let matches: ClassifyMatch[];
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { matches: [] };
    matches = (parsed.matches || []).filter(
      (m: ClassifyMatch) => m.confidence >= 70
    );
  } catch {
    console.error("[PageRules] Failed to parse classification:", text);
    return { routed: [] };
  }

  if (matches.length === 0) {
    return { routed: [] };
  }

  // Map page IDs to page objects
  const pageMap = new Map(pages.map((p) => [p.id, p]));

  // Run extraction for all matched pages concurrently
  const validMatches = matches
    .map((m) => ({ match: m, page: pageMap.get(m.pageId) }))
    .filter((m): m is { match: ClassifyMatch; page: PageWithSmartRule } => !!m.page);

  const results = await Promise.allSettled(
    validMatches.map(({ page }) =>
      extractAndCreateEntries(page, itemType, itemId, content, userId, extractInstructions)
    )
  );

  const routed: RouteResult[] = [];
  for (let i = 0; i < validMatches.length; i++) {
    const { match, page } = validMatches[i];
    const result = results[i];
    routed.push({
      pageId: page.id,
      pageTitle: page.title,
      entriesCreated: result.status === "fulfilled" ? result.value : 0,
    });

    // Tag the item with a smart label matching the page name
    try {
      await labelItemWithPageName(page.title, itemType, itemId, userId, match.confidence);
    } catch (err) {
      console.error(
        `[PageRules] Failed to label item ${itemId} with "${page.title}":`,
        err instanceof Error ? err.message : err
      );
    }
  }

  // Move email to first matched page's Outlook folder (only once, non-blocking)
  if (itemType === "email") {
    const folderPage = validMatches.find(({ page }) => page.smartRuleFolderId)?.page;
    if (folderPage) {
      moveEmailToPageFolder(folderPage, itemId, userId).catch((err) => {
        console.error(
          `[PageRules] Folder move failed for email ${itemId}:`,
          err instanceof Error ? err.message : err
        );
      });
    }
  }

  return { routed };
}
