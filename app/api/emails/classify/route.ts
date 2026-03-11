import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { classifyEmail } from "@/lib/email/classifyEmail";
import { getEmailById } from "@/lib/email/emails";
import { classifyItem, buildEmailContent } from "@/lib/smartLabels/classify";
import { classifyItemForPages } from "@/lib/pageRules/classify";
import { detectAndMarkSpam } from "@/lib/email/spamDetection";
import { getLabelsForEmails } from "@/lib/email/labels";
import { isEncrypted, decryptNullable } from "@/lib/encryption";
import sql from "@/lib/email/db";

/**
 * POST /api/emails/classify
 * Unified classification: AI labels, smart labels, newsletter detection, and spam detection.
 *
 * Body variants:
 *   { emailId: number }           — classify a single email
 *   { emailIds: number[] }        — classify specific emails (all on current page)
 *   {}                            — classify up to 10 unclassified emails (legacy)
 */
export async function POST(request: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
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

      // Run smart label + page rule classification
      const content = buildEmailContent({
        sender: email.sender,
        subject: email.subject,
        bodyPlainText: email.body_plain_text,
        recipients: Array.isArray(email.recipients) ? email.recipients : [],
      });

      try {
        await classifyItem("email", String(emailId), userId, { content });
      } catch (err) {
        console.error(`Smart label classification failed for email ${emailId}:`, err);
      }

      try {
        await classifyItemForPages("email", String(emailId), userId, { content });
      } catch (err) {
        console.error(`Page rule classification failed for email ${emailId}:`, err);
      }

      return NextResponse.json(result);
    }

    // Determine which emails to classify — fetch extra columns for detection
    let rows: {
      id: number;
      sender: string;
      subject: string | null;
      body_plain_text: string | null;
      body_html: string | null;
      raw_payload: Record<string, unknown> | null;
      recipients: string[];
    }[];

    if (emailIds && Array.isArray(emailIds) && emailIds.length > 0) {
      // Classify specific emails (from current page)
      rows = await sql`
        SELECT e.id, e.sender, e.subject, e.body_plain_text, e.body_html, e.raw_payload, e.recipients
        FROM emails e
        WHERE e.tenant_id = ${userId}
          AND e.deleted_at IS NULL
          AND e.id = ANY(${emailIds})
        ORDER BY e.received_at DESC
      ` as typeof rows;
    } else {
      // Legacy: classify up to 10 unclassified emails
      rows = await sql`
        SELECT e.id, e.sender, e.subject, e.body_plain_text, e.body_html, e.raw_payload, e.recipients
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

    // Step 1: AI classification + smart labels
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

      // Decrypt fields before building content for classifiers
      const decSender = typeof row.sender === "string" && isEncrypted(row.sender)
        ? decryptNullable(row.sender) ?? "" : (row.sender as string);
      const decSubject = typeof row.subject === "string" && isEncrypted(row.subject)
        ? decryptNullable(row.subject) : (row.subject as string | null);
      const decBody = typeof row.body_plain_text === "string" && isEncrypted(row.body_plain_text)
        ? decryptNullable(row.body_plain_text) : (row.body_plain_text as string | null);

      // Run smart label + page rule classification for each email
      const content = buildEmailContent({
        sender: decSender,
        subject: decSubject,
        bodyPlainText: decBody,
        recipients: Array.isArray(row.recipients) ? row.recipients : [],
      });

      try {
        await classifyItem("email", String(row.id), userId, { content });
      } catch (err) {
        console.error(`Smart label classification failed for email ${row.id}:`, err);
      }

      try {
        await classifyItemForPages("email", String(row.id), userId, { content });
      } catch (err) {
        console.error(`Page rule classification failed for email ${row.id}:`, err);
      }
    }

    // Step 2: Spam detection (uses AI labels assigned above)
    let spamMarked = 0;

    if (processedIds.length > 0) {
      const labelsMap = await getLabelsForEmails(processedIds);

      const spamBatch: {
        id: number;
        sender: string;
        subject: string | null;
        body_plain_text?: string | null;
        body_html?: string | null;
        raw_payload?: Record<string, unknown> | null;
        labels?: { name: string; confidence: number | null }[];
      }[] = [];

      for (const row of rows) {
        const sender = typeof row.sender === "string" && isEncrypted(row.sender)
          ? decryptNullable(row.sender) ?? ""
          : (row.sender as string);
        const subject = typeof row.subject === "string" && isEncrypted(row.subject)
          ? decryptNullable(row.subject)
          : (row.subject as string | null);
        const bodyPlain = typeof row.body_plain_text === "string" && isEncrypted(row.body_plain_text)
          ? decryptNullable(row.body_plain_text)
          : (row.body_plain_text as string | null);
        const bodyHtml = typeof row.body_html === "string" && isEncrypted(row.body_html)
          ? decryptNullable(row.body_html)
          : (row.body_html as string | null);
        const labels = labelsMap[row.id] ?? [];

        spamBatch.push({
          id: row.id,
          sender,
          subject,
          body_plain_text: bodyPlain,
          body_html: bodyHtml,
          raw_payload: row.raw_payload,
          labels,
        });
      }

      try {
        const spamResult = await detectAndMarkSpam(userId, spamBatch);
        spamMarked = spamResult.marked;
      } catch (err) {
        console.error("Spam detection failed during classify:", err);
      }
    }

    return NextResponse.json({
      classified: results.filter((r) => r.labels.length > 0).length,
      total: results.length,
      processedIds,
      results,
      spamMarked,
    });
  } catch (error) {
    console.error("Error classifying emails:", error);
    return NextResponse.json(
      { error: "Failed to classify emails" },
      { status: 500 }
    );
  }
}
