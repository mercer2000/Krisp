import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { hybridSearch, getEmbeddingStatus } from "@/lib/email/embeddings";
import { getLabelsForEmails } from "@/lib/email/labels";
import { emailSearchQuerySchema } from "@/lib/validators/schemas";
import type { EmailAttachmentMetadata } from "@/types/email";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
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

    const results = await hybridSearch(userId, q, limit);

    // Batch-fetch labels for search results
    const emailIds = results.map((r) => r.id);
    const labelsMap = await getLabelsForEmails(emailIds);

    const data = results.map((row) => ({
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
      similarity: Math.round((row.similarity + Number.EPSILON) * 100) / 100,
      labels: labelsMap[row.id] ?? [],
    }));

    // Include embedding status so the UI can show a "building index" banner
    const status = await getEmbeddingStatus(userId);

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
