import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { classifyEmail } from "@/lib/email/classifyEmail";
import { getEmailById } from "@/lib/email/emails";
import { classifyItem } from "@/lib/smartLabels/classify";
import sql from "@/lib/email/db";

/**
 * POST /api/emails/classify
 * Classify emails with both traditional labels and smart labels.
 *
 * Body variants:
 *   { emailId: number }           — classify a single email
 *   { emailIds: number[] }        — classify specific emails (all on current page)
 *   {}                            — classify up to 10 unclassified emails (legacy)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { emailId, emailIds } = body as { emailId?: number; emailIds?: number[] };

    if (emailId) {
      // Classify a single email
      const email = await getEmailById(emailId, userId);
      if (!email) {
        return NextResponse.json({ error: "Email not found" }, { status: 404 });
      }

      const result = await classifyEmail(emailId, userId, {
        sender: email.sender,
        subject: email.subject,
        bodyPlainText: email.body_plain_text,
        recipients: Array.isArray(email.recipients) ? email.recipients : [],
      });

      // Also run smart label classification
      try {
        await classifyItem("email", String(emailId), userId);
      } catch (err) {
        console.error(`Smart label classification failed for email ${emailId}:`, err);
      }

      return NextResponse.json(result);
    }

    // Determine which emails to classify
    let rows: { id: number; sender: string; subject: string | null; body_plain_text: string | null; recipients: string[] }[];

    if (emailIds && Array.isArray(emailIds) && emailIds.length > 0) {
      // Classify specific emails (from current page)
      rows = await sql`
        SELECT e.id, e.sender, e.subject, e.body_plain_text, e.recipients
        FROM emails e
        WHERE e.tenant_id = ${userId}
          AND e.deleted_at IS NULL
          AND e.id = ANY(${emailIds})
        ORDER BY e.received_at DESC
      ` as typeof rows;
    } else {
      // Legacy: classify up to 10 unclassified emails
      rows = await sql`
        SELECT e.id, e.sender, e.subject, e.body_plain_text, e.recipients
        FROM emails e
        WHERE e.tenant_id = ${userId}
          AND e.deleted_at IS NULL
          AND NOT EXISTS (
            SELECT 1 FROM email_label_assignments ela
            WHERE ela.email_id = e.id AND ela.assigned_by = 'ai'
          )
        ORDER BY e.received_at DESC
        LIMIT 10
      ` as typeof rows;
    }

    const results = [];
    const processedIds: number[] = [];

    for (const row of rows) {
      try {
        const result = await classifyEmail(row.id, userId, {
          sender: row.sender,
          subject: row.subject,
          bodyPlainText: row.body_plain_text,
          recipients: Array.isArray(row.recipients) ? row.recipients : [],
        });
        results.push({ emailId: row.id, ...result });
        processedIds.push(row.id);
      } catch (err) {
        console.error(`Failed to classify email ${row.id}:`, err);
        results.push({ emailId: row.id, labels: [], skipped: false, error: true });
        processedIds.push(row.id);
      }

      // Also run smart label classification for each email
      try {
        await classifyItem("email", String(row.id), userId);
      } catch (err) {
        console.error(`Smart label classification failed for email ${row.id}:`, err);
      }
    }

    return NextResponse.json({
      classified: results.filter((r) => r.labels.length > 0).length,
      total: results.length,
      processedIds,
      results,
    });
  } catch (error) {
    console.error("Error classifying emails:", error);
    return NextResponse.json(
      { error: "Failed to classify emails" },
      { status: 500 }
    );
  }
}
