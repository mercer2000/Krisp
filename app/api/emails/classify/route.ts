import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { classifyEmail } from "@/lib/email/classifyEmail";
import { getEmailById } from "@/lib/email/emails";
import sql from "@/lib/email/db";

/**
 * POST /api/emails/classify
 * Classify a single email or batch of unclassified emails.
 * Body: { emailId?: number } — if omitted, classifies up to 10 unclassified emails.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { emailId } = body as { emailId?: number };

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

      return NextResponse.json(result);
    }

    // Batch classify: get up to 10 unclassified emails
    const rows = await sql`
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
    `;

    const results = [];
    for (const row of rows as { id: number; sender: string; subject: string | null; body_plain_text: string | null; recipients: string[] }[]) {
      try {
        const result = await classifyEmail(row.id, userId, {
          sender: row.sender,
          subject: row.subject,
          bodyPlainText: row.body_plain_text,
          recipients: Array.isArray(row.recipients) ? row.recipients : [],
        });
        results.push({ emailId: row.id, ...result });
      } catch (err) {
        console.error(`Failed to classify email ${row.id}:`, err);
        results.push({ emailId: row.id, labels: [], skipped: false, error: true });
      }
    }

    return NextResponse.json({
      classified: results.filter((r) => r.labels.length > 0).length,
      total: results.length,
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
