import { NextResponse } from "next/server";
import { auth } from "@/auth";
import sql from "@/lib/email/db";
import { detectAndMarkSpam } from "@/lib/email/spamDetection";
import { getLabelsForEmails } from "@/lib/email/labels";
import { isEncrypted, decryptNullable } from "@/lib/encryption";

/**
 * POST /api/emails/spam/detect
 * Batch detect spam among unprocessed emails.
 * Scans emails that haven't been marked as spam yet.
 */
export async function POST() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch up to 50 Outlook emails that haven't been marked as spam
    const rows = await sql`
      SELECT id, sender, subject, body_plain_text, body_html, raw_payload
      FROM emails
      WHERE tenant_id = ${userId}
        AND deleted_at IS NULL
        AND is_spam = false
      ORDER BY received_at DESC
      LIMIT 50
    `;

    if (rows.length === 0) {
      return NextResponse.json({ marked: 0, total: 0 });
    }

    // Decrypt sender/subject/body and get labels
    const emailIds = (rows as { id: number }[]).map((r) => r.id);
    const labelsMap = await getLabelsForEmails(emailIds);

    const batch = (rows as Record<string, unknown>[]).map((row) => {
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

      return {
        id: row.id as number,
        sender,
        subject,
        body_plain_text: bodyPlain,
        body_html: bodyHtml,
        raw_payload: row.raw_payload as Record<string, unknown> | null,
        labels: labelsMap[row.id as number] ?? [],
      };
    });

    const result = await detectAndMarkSpam(userId, batch);

    return NextResponse.json({
      marked: result.marked,
      total: result.total,
    });
  } catch (error) {
    console.error("Error detecting spam:", error);
    return NextResponse.json(
      { error: "Failed to detect spam" },
      { status: 500 }
    );
  }
}
