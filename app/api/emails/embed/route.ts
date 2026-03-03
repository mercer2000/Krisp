import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { processUnembeddedEmails, getEmbeddingStatus } from "@/lib/email/embeddings";

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
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const processed = await processUnembeddedEmails(userId);
    const status = await getEmbeddingStatus(userId);

    return NextResponse.json({
      processed,
      embedding_status: status,
    });
  } catch (error) {
    console.error("Error processing embeddings:", error);
    return NextResponse.json(
      { error: "Failed to process embeddings" },
      { status: 500 }
    );
  }
}
