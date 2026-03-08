import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { hybridSearch, getEmbeddingStatus } from "@/lib/email/embeddings";
import { zoomHybridSearch, getZoomEmbeddingStatus } from "@/lib/zoom/embeddings";
import { getLabelsForEmails } from "@/lib/email/labels";
import { emailSearchQuerySchema } from "@/lib/validators/schemas";
import type { EmailAttachmentMetadata } from "@/types/email";

export async function GET(request: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = emailSearchQuerySchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { q, limit } = parsed.data;

    // Run email and Zoom searches in parallel
    const [emailResults, zoomResults, emailStatus, zoomStatus] = await Promise.all([
      hybridSearch(userId, q, limit),
      zoomHybridSearch(userId, q, limit),
      getEmbeddingStatus(userId),
      getZoomEmbeddingStatus(userId),
    ]);

    // Batch-fetch labels for email results
    const emailIds = emailResults.map((r) => r.id);
    const labelsMap = emailIds.length > 0 ? await getLabelsForEmails(emailIds) : {};

    const emailData = emailResults.map((row) => ({
      id: row.id,
      sender: row.sender,
      subject: row.subject,
      received_at: row.received_at as unknown as string,
      recipients: Array.isArray(row.recipients) ? row.recipients : [],
      has_attachments:
        Array.isArray(row.attachments_metadata) &&
        (row.attachments_metadata as EmailAttachmentMetadata[]).length > 0,
      preview: row.preview,
      web_link: row.web_link ?? null,
      outlook_account_id: null,
      account_id: null,
      provider: "outlook" as const,
      similarity: Math.round((row.similarity + Number.EPSILON) * 100) / 100,
      labels: labelsMap[row.id] ?? [],
    }));

    const zoomData = zoomResults.map((row) => ({
      ...row,
      similarity: Math.round((row.similarity + Number.EPSILON) * 100) / 100,
    }));

    // Merge and sort by similarity descending
    const data = [...emailData, ...zoomData]
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    // Combine embedding statuses
    const status = {
      total: emailStatus.total + zoomStatus.total,
      embedded: emailStatus.embedded + zoomStatus.embedded,
      pending: emailStatus.pending + zoomStatus.pending,
    };

    return NextResponse.json({
      query: q,
      data,
      embedding_status: status,
    });
  } catch (error) {
    console.error("Error searching emails:", error);
    return NextResponse.json(
      { error: "Failed to search emails" },
      { status: 500 }
    );
  }
}
