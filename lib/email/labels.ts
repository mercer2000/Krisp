import sql from "./db";

export interface EmailLabel {
  id: string;
  tenant_id: string;
  name: string;
  color: string;
  is_system: boolean;
  created_at: string;
}

export interface EmailLabelAssignment {
  id: string;
  email_id: number;
  label_id: string;
  confidence: number | null;
  assigned_by: string;
  created_at: string;
}

/** Default system labels with their colors */
export const SYSTEM_LABELS: { name: string; color: string }[] = [
  { name: "Action Required", color: "#EF4444" },
  { name: "FYI", color: "#3B82F6" },
  { name: "Newsletter", color: "#8B5CF6" },
  { name: "Spam", color: "#DC2626" },
  { name: "Invoice", color: "#F59E0B" },
  { name: "Meeting Request", color: "#10B981" },
  { name: "Support Ticket", color: "#F97316" },
];

/**
 * Ensure system labels exist for a tenant. Inserts only missing ones.
 */
export async function ensureSystemLabels(tenantId: string): Promise<EmailLabel[]> {
  for (const label of SYSTEM_LABELS) {
    await sql`
      INSERT INTO email_labels (tenant_id, name, color, is_system)
      VALUES (${tenantId}, ${label.name}, ${label.color}, true)
      ON CONFLICT (tenant_id, name) DO NOTHING
    `;
  }

  const rows = await sql`
    SELECT id, tenant_id, name, color, is_system, created_at
    FROM email_labels
    WHERE tenant_id = ${tenantId}
    ORDER BY is_system DESC, name ASC
  `;
  return rows as EmailLabel[];
}

/**
 * Get all labels for a tenant (system + custom).
 */
export async function getLabelsForTenant(tenantId: string): Promise<EmailLabel[]> {
  const rows = await sql`
    SELECT id, tenant_id, name, color, is_system, created_at
    FROM email_labels
    WHERE tenant_id = ${tenantId}
    ORDER BY is_system DESC, name ASC
  `;
  return rows as EmailLabel[];
}

/**
 * Create a custom label for a tenant.
 */
export async function createCustomLabel(
  tenantId: string,
  name: string,
  color: string
): Promise<EmailLabel> {
  const rows = await sql`
    INSERT INTO email_labels (tenant_id, name, color, is_system)
    VALUES (${tenantId}, ${name}, ${color}, false)
    RETURNING id, tenant_id, name, color, is_system, created_at
  `;
  return rows[0] as EmailLabel;
}

/**
 * Delete a custom label (system labels cannot be deleted).
 */
export async function deleteCustomLabel(
  tenantId: string,
  labelId: string
): Promise<boolean> {
  const rows = await sql`
    DELETE FROM email_labels
    WHERE id = ${labelId} AND tenant_id = ${tenantId} AND is_system = false
    RETURNING id
  `;
  return rows.length > 0;
}

/**
 * Assign labels to an email.
 */
export async function assignLabelsToEmail(
  emailId: number,
  labels: { labelId: string; confidence?: number; assignedBy?: string }[]
): Promise<void> {
  for (const label of labels) {
    await sql`
      INSERT INTO email_label_assignments (email_id, label_id, confidence, assigned_by)
      VALUES (${emailId}, ${label.labelId}, ${label.confidence ?? null}, ${label.assignedBy ?? "ai"})
      ON CONFLICT (email_id, label_id) DO UPDATE SET
        confidence = EXCLUDED.confidence,
        assigned_by = EXCLUDED.assigned_by
    `;
  }
}

/**
 * Remove a label from an email.
 */
export async function removeLabelFromEmail(
  emailId: number,
  labelId: string
): Promise<boolean> {
  const rows = await sql`
    DELETE FROM email_label_assignments
    WHERE email_id = ${emailId} AND label_id = ${labelId}
    RETURNING id
  `;
  return rows.length > 0;
}

/**
 * Get labels assigned to a specific email.
 */
export async function getLabelsForEmail(
  emailId: number
): Promise<(EmailLabel & { confidence: number | null; assigned_by: string })[]> {
  const rows = await sql`
    SELECT el.id, el.tenant_id, el.name, el.color, el.is_system, el.created_at,
           ela.confidence, ela.assigned_by
    FROM email_label_assignments ela
    JOIN email_labels el ON el.id = ela.label_id
    WHERE ela.email_id = ${emailId}
    ORDER BY el.is_system DESC, el.name ASC
  `;
  return rows as (EmailLabel & { confidence: number | null; assigned_by: string })[];
}

/**
 * Get labels for multiple emails (batch query for inbox list).
 */
export async function getLabelsForEmails(
  emailIds: number[]
): Promise<Record<number, { id: string; name: string; color: string; confidence: number | null }[]>> {
  if (emailIds.length === 0) return {};

  const rows = await sql`
    SELECT ela.email_id, el.id, el.name, el.color, ela.confidence
    FROM email_label_assignments ela
    JOIN email_labels el ON el.id = ela.label_id
    WHERE ela.email_id = ANY(${emailIds})
    ORDER BY el.is_system DESC, el.name ASC
  `;

  const result: Record<number, { id: string; name: string; color: string; confidence: number | null }[]> = {};
  for (const row of rows as { email_id: number; id: string; name: string; color: string; confidence: number | null }[]) {
    if (!result[row.email_id]) {
      result[row.email_id] = [];
    }
    result[row.email_id].push({
      id: row.id,
      name: row.name,
      color: row.color,
      confidence: row.confidence,
    });
  }
  return result;
}

/**
 * Check if an email has already been classified (has any AI-assigned labels).
 */
export async function isEmailClassified(emailId: number): Promise<boolean> {
  const rows = await sql`
    SELECT 1 FROM email_label_assignments
    WHERE email_id = ${emailId} AND assigned_by = 'ai'
    LIMIT 1
  `;
  return rows.length > 0;
}
