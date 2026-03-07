import { NextResponse } from "next/server";
import { auth } from "@/auth";
import sql from "@/lib/email/db";
import {
  detectAndMarkNewsletters,
} from "@/lib/email/newsletterDetection";
import { getLabelsForEmails } from "@/lib/email/labels";
import {
  isEncrypted,
  decryptNullable,
} from "@/lib/encryption";

/**
 * POST /api/emails/newsletter/detect
 * Batch detect newsletters among unprocessed emails.
 * Scans emails that haven't been evaluated for newsletter status yet
 * (is_newsletter = false and no prior detection).
 */
export async function POST() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch up to 50 Outlook emails that haven't been marked as newsletter
    // We re-check all non-newsletter emails as detection improves with labels
    const rows = await sql`
      SELECT id, sender, subject, raw_payload
      FROM emails
      WHERE tenant_id = ${userId}
        AND deleted_at IS NULL
        AND is_newsletter = false
      ORDER BY received_at DESC
      LIMIT 50
    `;

    if (rows.length === 0) {
      return NextResponse.json({ marked: 0, whitelisted: 0, total: 0 });
    }

    // Decrypt sender/subject and get labels
    const emailIds = (rows as { id: number }[]).map((r) => r.id);
    const labelsMap = await getLabelsForEmails(emailIds);

    const batch = (rows as Record<string, unknown>[]).map((row) => {
      const sender = typeof row.sender === "string" && isEncrypted(row.sender)
        ? decryptNullable(row.sender) ?? ""
        : (row.sender as string);
      const subject = typeof row.subject === "string" && isEncrypted(row.subject)
        ? decryptNullable(row.subject)
        : (row.subject as string | null);

      return {
        id: row.id as number,
        sender,
        subject,
        raw_payload: row.raw_payload as Record<string, unknown> | null,
        labels: labelsMap[row.id as number] ?? [],
      };
    });

    const result = await detectAndMarkNewsletters(userId, batch);

    return NextResponse.json({
      marked: result.marked,
      whitelisted: result.whitelisted,
      total: batch.length,
    });
  } catch (error) {
    console.error("Error detecting newsletters:", error);
    return NextResponse.json(
      { error: "Failed to detect newsletters" },
      { status: 500 }
    );
  }
}
