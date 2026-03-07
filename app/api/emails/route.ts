import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { listEmails } from "@/lib/email/emails";
import { listGmailEmails } from "@/lib/gmail/emails";
import { listZoomMessages } from "@/lib/zoom/messages";
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

    const { page, limit, q, after, before, accountId, provider, folder } = parsed.data;

    // Determine which sources to query based on provider filter
    const fetchOutlook = !provider || provider === "outlook";
    const fetchGmail = !provider || provider === "gmail";
    const fetchZoom = !provider || provider === "zoom";

    let allItems: EmailListItem[] = [];

    // Fetch Outlook emails
    if (fetchOutlook) {
      const { rows } = await listEmails(userId, {
        page: 1,
        limit: 10000, // Fetch all for merging; we paginate after merge
        q,
        after,
        before,
        folder,
      });

      // Batch-fetch labels for Outlook emails
      const emailIds = rows.map((r) => r.id);
      const labelsMap = emailIds.length > 0 ? await getLabelsForEmails(emailIds) : {};

      const outlookItems: EmailListItem[] = rows.map((row) => ({
        id: row.id,
        sender: row.sender,
        subject: row.subject,
        received_at: row.received_at as unknown as string,
        recipients: Array.isArray(row.recipients) ? row.recipients : [],
        has_attachments: Array.isArray(row.attachments_metadata) && (row.attachments_metadata as EmailAttachmentMetadata[]).length > 0,
        preview: row.preview,
        web_link: row.web_link ?? null,
        outlook_account_id: row.outlook_account_id ?? null,
        account_id: row.outlook_account_id ?? null,
        provider: "outlook" as const,
        labels: labelsMap[row.id] ?? [],
        is_newsletter: row.is_newsletter,
        is_spam: row.is_spam,
        unsubscribe_link: row.unsubscribe_link,
      }));

      allItems.push(...outlookItems);
    }

    // Fetch Gmail emails
    if (fetchGmail) {
      const gmailRows = await listGmailEmails(userId, {
        q,
        after,
        before,
        folder,
      });

      const gmailItems: EmailListItem[] = gmailRows.map((row) => ({
        id: row.id,
        sender: row.sender,
        subject: row.subject,
        received_at: row.received_at as unknown as string,
        recipients: Array.isArray(row.recipients) ? row.recipients : [],
        has_attachments: row.has_attachments,
        preview: row.preview,
        web_link: row.web_link,
        outlook_account_id: null,
        account_id: row.gmail_account_id,
        provider: "gmail" as const,
        labels: [],
        is_newsletter: row.is_newsletter,
        is_spam: row.is_spam,
        unsubscribe_link: row.unsubscribe_link,
      }));

      allItems.push(...gmailItems);
    }

    // Fetch Zoom chat messages (skip for newsletter/spam folders)
    if (fetchZoom && folder !== "newsletter" && folder !== "spam") {
      const zoomItems = await listZoomMessages(userId, { q, after, before });
      allItems.push(...zoomItems);
    }

    // Sort merged results by received_at descending
    allItems.sort((a, b) => new Date(b.received_at).getTime() - new Date(a.received_at).getTime());

    // Paginate
    const total = allItems.length;
    const offset = (page - 1) * limit;
    const data = allItems.slice(offset, offset + limit);

    return NextResponse.json({ data, total, page, limit });
  } catch (error) {
    console.error("Error listing emails:", error);
    return NextResponse.json(
      { error: "Failed to list emails" },
      { status: 500 }
    );
  }
}
