import sql from "./db";
import type { SmartLabel, SmartLabelChip } from "@/types/smartLabel";

/**
 * Get all smart labels for a tenant.
 */
export async function getSmartLabels(tenantId: string): Promise<SmartLabel[]> {
  const rows = await sql`
    SELECT id, tenant_id, name, prompt, color, active,
           auto_draft_enabled, context_window_max,
           created_at, updated_at
    FROM smart_labels
    WHERE tenant_id = ${tenantId}
    ORDER BY created_at ASC
  `;
  return rows as SmartLabel[];
}

/**
 * Get active smart labels for classification.
 */
export async function getActiveSmartLabels(tenantId: string): Promise<SmartLabel[]> {
  const rows = await sql`
    SELECT id, tenant_id, name, prompt, color, active,
           auto_draft_enabled, context_window_max,
           created_at, updated_at
    FROM smart_labels
    WHERE tenant_id = ${tenantId} AND active = true
    ORDER BY created_at ASC
  `;
  return rows as SmartLabel[];
}

/**
 * Get a single smart label by ID.
 */
export async function getSmartLabelById(
  labelId: string,
  tenantId: string
): Promise<SmartLabel | null> {
  const rows = await sql`
    SELECT id, tenant_id, name, prompt, color, active,
           auto_draft_enabled, context_window_max,
           created_at, updated_at
    FROM smart_labels
    WHERE id = ${labelId} AND tenant_id = ${tenantId}
  `;
  return (rows[0] as SmartLabel) ?? null;
}

/**
 * Create a new smart label.
 */
export async function createSmartLabel(
  tenantId: string,
  name: string,
  prompt: string,
  color: string = "#6366F1"
): Promise<SmartLabel> {
  const rows = await sql`
    INSERT INTO smart_labels (tenant_id, name, prompt, color)
    VALUES (${tenantId}, ${name}, ${prompt}, ${color})
    RETURNING id, tenant_id, name, prompt, color, active, created_at, updated_at
  `;
  return rows[0] as SmartLabel;
}

/**
 * Update a smart label.
 */
export async function updateSmartLabel(
  labelId: string,
  tenantId: string,
  updates: { name?: string; prompt?: string; color?: string; active?: boolean; autoDraftEnabled?: boolean; contextWindowMax?: number }
): Promise<SmartLabel | null> {
  const setClauses: string[] = [];
  const values: unknown[] = [];

  if (updates.name !== undefined) {
    setClauses.push(`name = $${values.length + 1}`);
    values.push(updates.name);
  }
  if (updates.prompt !== undefined) {
    setClauses.push(`prompt = $${values.length + 1}`);
    values.push(updates.prompt);
  }
  if (updates.color !== undefined) {
    setClauses.push(`color = $${values.length + 1}`);
    values.push(updates.color);
  }
  if (updates.active !== undefined) {
    setClauses.push(`active = $${values.length + 1}`);
    values.push(updates.active);
  }
  if (updates.autoDraftEnabled !== undefined) {
    setClauses.push(`auto_draft_enabled = $${values.length + 1}`);
    values.push(updates.autoDraftEnabled);
  }
  if (updates.contextWindowMax !== undefined) {
    setClauses.push(`context_window_max = $${values.length + 1}`);
    values.push(updates.contextWindowMax);
  }

  if (setClauses.length === 0) return getSmartLabelById(labelId, tenantId);

  setClauses.push(`updated_at = now()`);

  const query = `
    UPDATE smart_labels
    SET ${setClauses.join(", ")}
    WHERE id = $${values.length + 1} AND tenant_id = $${values.length + 2}
    RETURNING id, tenant_id, name, prompt, color, active,
              auto_draft_enabled, context_window_max,
              created_at, updated_at
  `;
  values.push(labelId, tenantId);

  const rows = await sql.query(query, values);
  return (rows[0] as SmartLabel) ?? null;
}

/**
 * Delete a smart label (cascades to smart_label_items).
 */
export async function deleteSmartLabel(
  labelId: string,
  tenantId: string
): Promise<boolean> {
  const rows = await sql`
    DELETE FROM smart_labels
    WHERE id = ${labelId} AND tenant_id = ${tenantId}
    RETURNING id
  `;
  return rows.length > 0;
}

/**
 * Assign a smart label to an item.
 */
export async function assignSmartLabel(
  labelId: string,
  itemType: string,
  itemId: string,
  confidence: number | null = null,
  assignedBy: string = "ai"
): Promise<void> {
  await sql`
    INSERT INTO smart_label_items (label_id, item_type, item_id, confidence, assigned_by)
    VALUES (${labelId}, ${itemType}, ${itemId}, ${confidence}, ${assignedBy})
    ON CONFLICT (label_id, item_type, item_id) DO UPDATE SET
      confidence = EXCLUDED.confidence,
      assigned_by = EXCLUDED.assigned_by
  `;
}

/**
 * Remove a smart label from an item.
 */
export async function removeSmartLabel(
  labelId: string,
  itemType: string,
  itemId: string
): Promise<boolean> {
  const rows = await sql`
    DELETE FROM smart_label_items
    WHERE label_id = ${labelId} AND item_type = ${itemType} AND item_id = ${itemId}
    RETURNING id
  `;
  return rows.length > 0;
}

/**
 * Get smart labels assigned to a specific item.
 */
export async function getSmartLabelsForItem(
  itemType: string,
  itemId: string,
  tenantId: string
): Promise<SmartLabelChip[]> {
  const rows = await sql`
    SELECT sl.id, sl.name, sl.color, sli.confidence, sli.assigned_by
    FROM smart_label_items sli
    JOIN smart_labels sl ON sl.id = sli.label_id
    WHERE sli.item_type = ${itemType}
      AND sli.item_id = ${itemId}
      AND sl.tenant_id = ${tenantId}
    ORDER BY sl.name ASC
  `;
  return rows as SmartLabelChip[];
}

/**
 * Batch-get smart labels for multiple items of the same type.
 */
export async function getSmartLabelsForItems(
  itemType: string,
  itemIds: string[],
  tenantId: string
): Promise<Record<string, SmartLabelChip[]>> {
  if (itemIds.length === 0) return {};

  const rows = await sql`
    SELECT sli.item_id, sl.id, sl.name, sl.color, sli.confidence, sli.assigned_by
    FROM smart_label_items sli
    JOIN smart_labels sl ON sl.id = sli.label_id
    WHERE sli.item_type = ${itemType}
      AND sli.item_id = ANY(${itemIds})
      AND sl.tenant_id = ${tenantId}
    ORDER BY sl.name ASC
  `;

  const result: Record<string, SmartLabelChip[]> = {};
  for (const row of rows as (SmartLabelChip & { item_id: string })[]) {
    if (!result[row.item_id]) {
      result[row.item_id] = [];
    }
    result[row.item_id].push({
      id: row.id,
      name: row.name,
      color: row.color,
      confidence: row.confidence,
      assigned_by: row.assigned_by,
    });
  }
  return result;
}

/**
 * Check if an item has already been classified by smart labels.
 */
export async function isItemSmartClassified(
  itemType: string,
  itemId: string
): Promise<boolean> {
  const rows = await sql`
    SELECT 1 FROM smart_label_items
    WHERE item_type = ${itemType} AND item_id = ${itemId} AND assigned_by = 'ai'
    LIMIT 1
  `;
  return rows.length > 0;
}

/**
 * Batch-check which item IDs have been classified by AI.
 * Checks both smart_label_items (smart labels) and email_label_assignments (traditional labels).
 * Returns the subset of itemIds that have been processed by AI classification.
 */
export async function getClassifiedItemIds(
  itemType: string,
  itemIds: string[],
  tenantId: string
): Promise<Set<string>> {
  if (itemIds.length === 0) return new Set();

  // Check smart labels
  const smartRows = await sql`
    SELECT DISTINCT sli.item_id
    FROM smart_label_items sli
    JOIN smart_labels sl ON sl.id = sli.label_id
    WHERE sli.item_type = ${itemType}
      AND sli.item_id = ANY(${itemIds})
      AND sli.assigned_by = 'ai'
      AND sl.tenant_id = ${tenantId}
  `;

  const ids = new Set((smartRows as { item_id: string }[]).map((r) => r.item_id));

  // Also check traditional email labels (only for email types)
  if (itemType === "email" || itemType === "gmail_email") {
    const intIds = itemIds.map((id) => parseInt(id, 10)).filter((n) => !isNaN(n));
    if (intIds.length > 0) {
      const labelRows = await sql`
        SELECT DISTINCT ela.email_id::text as item_id
        FROM email_label_assignments ela
        WHERE ela.email_id = ANY(${intIds})
          AND ela.assigned_by = 'ai'
      `;
      for (const row of labelRows as { item_id: string }[]) {
        ids.add(row.item_id);
      }
    }
  }

  return ids;
}

/**
 * Get all items for a specific smart label (for "show all items with this label").
 */
export async function getItemsForSmartLabel(
  labelId: string,
  tenantId: string
): Promise<{ item_type: string; item_id: string; confidence: number | null; assigned_by: string }[]> {
  const rows = await sql`
    SELECT sli.item_type, sli.item_id, sli.confidence, sli.assigned_by
    FROM smart_label_items sli
    JOIN smart_labels sl ON sl.id = sli.label_id
    WHERE sli.label_id = ${labelId} AND sl.tenant_id = ${tenantId}
    ORDER BY sli.created_at DESC
  `;
  return rows as { item_type: string; item_id: string; confidence: number | null; assigned_by: string }[];
}
