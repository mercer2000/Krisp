import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { listEmails } from "@/lib/email/emails";
import { getLabelsForEmails } from "@/lib/email/labels";
import { emailListQuerySchema } from "@/lib/validators/schemas";
import type { EmailListItem, EmailAttachmentMetadata } from "@/types/email";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = emailListQuerySchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { page, limit, q, after, before } = parsed.data;
    const { rows, total } = await listEmails(userId, { page, limit, q, after, before });

    // Batch-fetch labels for all emails in this page
    const emailIds = rows.map((r) => r.id);
    const labelsMap = await getLabelsForEmails(emailIds);

    const data: EmailListItem[] = rows.map((row) => ({
      id: row.id,
      sender: row.sender,
      subject: row.subject,
      received_at: row.received_at as unknown as string,
      recipients: Array.isArray(row.recipients) ? row.recipients : [],
      has_attachments: Array.isArray(row.attachments_metadata) && (row.attachments_metadata as EmailAttachmentMetadata[]).length > 0,
      preview: row.preview,
      web_link: row.web_link ?? null,
      labels: labelsMap[row.id] ?? [],
    }));

    return NextResponse.json({ data, total, page, limit });
  } catch (error) {
    console.error("Error listing emails:", error);
    return NextResponse.json(
      { error: "Failed to list emails" },
      { status: 500 }
    );
  }
}
