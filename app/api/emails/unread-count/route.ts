import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import neonSql from "@/lib/smartLabels/db";

export async function GET() {
  const { data: session } = await auth.getSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Run all counts in parallel using raw SQL for efficiency
  const [triageRows, smartLabelRows, labelRows, smartRuleRows] = await Promise.all([
    // Triage unread: inbox emails (not done, not spam, no labels, no smart labels)
    neonSql`
      SELECT
        (SELECT count(*)::int FROM emails
         WHERE tenant_id = ${userId} AND is_read = false AND is_done = false AND is_spam = false
           AND deleted_at IS NULL
           AND NOT EXISTS (SELECT 1 FROM email_label_assignments WHERE email_id = emails.id)
           AND NOT EXISTS (SELECT 1 FROM smart_label_items WHERE item_type = 'email' AND item_id = emails.id::text)
        ) +
        (SELECT count(*)::int FROM gmail_emails
         WHERE tenant_id = ${userId} AND is_read = false AND is_done = false AND is_spam = false
           AND NOT EXISTS (SELECT 1 FROM smart_label_items WHERE item_type = 'gmail_email' AND item_id = gmail_emails.id::text)
        ) AS count
    `,
    // Per smart label unread counts
    neonSql`
      SELECT sli.label_id AS id,
        count(*)::int AS count
      FROM smart_label_items sli
      JOIN smart_labels sl ON sl.id = sli.label_id AND sl.tenant_id = ${userId}
      LEFT JOIN emails e ON sli.item_type = 'email' AND sli.item_id = e.id::text
      LEFT JOIN gmail_emails ge ON sli.item_type = 'gmail_email' AND sli.item_id = ge.id::text
      WHERE (
        (sli.item_type = 'email' AND e.is_read = false AND e.is_done = false)
        OR (sli.item_type = 'gmail_email' AND ge.is_read = false AND ge.is_done = false)
      )
      GROUP BY sli.label_id
    `,
    // Per regular label unread counts
    neonSql`
      SELECT ela.label_id AS id,
        count(*)::int AS count
      FROM email_label_assignments ela
      JOIN emails e ON e.id = ela.email_id
      JOIN email_labels el ON el.id = ela.label_id AND el.tenant_id = ${userId}
      WHERE e.is_read = false AND e.is_done = false AND e.deleted_at IS NULL
      GROUP BY ela.label_id
    `,
    // Per smart rule page unread counts (smart rules use page_entries, not smart_label_items)
    neonSql`
      SELECT pe.page_id::text AS page_id,
        count(*)::int AS count
      FROM page_entries pe
      JOIN pages p ON p.id = pe.page_id
      JOIN workspaces w ON w.id = p.workspace_id AND w.owner_id = ${userId}
      LEFT JOIN emails e ON pe.source_type = 'email' AND pe.source_id = e.id::text
      LEFT JOIN gmail_emails ge ON pe.source_type = 'gmail_email' AND pe.source_id = ge.id::text
      WHERE p.smart_active = true AND p.smart_rule IS NOT NULL AND p.is_archived = false
        AND (
          (pe.source_type = 'email' AND e.is_read = false AND e.is_done = false AND e.deleted_at IS NULL)
          OR (pe.source_type = 'gmail_email' AND ge.is_read = false AND ge.is_done = false)
        )
      GROUP BY pe.page_id
    `,
  ]);

  const triage = (triageRows[0] as { count: number })?.count ?? 0;

  const byLabel: Record<string, number> = {};
  for (const row of smartLabelRows as { id: string; count: number }[]) {
    byLabel[row.id] = row.count;
  }
  for (const row of labelRows as { id: string; count: number }[]) {
    byLabel[row.id] = row.count;
  }
  for (const row of smartRuleRows as { page_id: string; count: number }[]) {
    byLabel[row.page_id] = row.count;
  }

  return NextResponse.json({ count: triage, byLabel });
}
