import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { processUnembeddedEmails, getEmbeddingStatus } from "@/lib/email/embeddings";
import { processUnembeddedZoomMessages, getZoomEmbeddingStatus } from "@/lib/zoom/embeddings";

/**
 * POST /api/emails/embed
 *
 * Triggers processing of unembedded emails. This can be called:
 * - Via a cron job (e.g. every 60 seconds)
 * - Manually from the admin panel
 * - As a one-time backfill trigger
 */
export async function POST() {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [emailProcessed, zoomProcessed, emailStatus, zoomStatus] = await Promise.all([
      processUnembeddedEmails(userId),
      processUnembeddedZoomMessages(userId),
      getEmbeddingStatus(userId),
      getZoomEmbeddingStatus(userId),
    ]);

    return NextResponse.json({
      processed: emailProcessed + zoomProcessed,
      processed_emails: emailProcessed,
      processed_zoom: zoomProcessed,
      embedding_status: {
        total: emailStatus.total + zoomStatus.total,
        embedded: emailStatus.embedded + zoomStatus.embedded,
        pending: emailStatus.pending + zoomStatus.pending,
      },
    });
  } catch (error) {
    console.error("Error processing embeddings:", error);
    return NextResponse.json(
      { error: "Failed to process embeddings" },
      { status: 500 }
    );
  }
}
