import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { processUnembeddedZoomMessages, getZoomEmbeddingStatus } from "@/lib/zoom/embeddings";

/**
 * POST /api/zoom/embed
 *
 * Triggers embedding generation for unembedded Zoom chat messages.
 */
export async function POST() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const processed = await processUnembeddedZoomMessages(userId);
    const status = await getZoomEmbeddingStatus(userId);

    return NextResponse.json({
      processed,
      embedding_status: status,
    });
  } catch (error) {
    console.error("Error processing Zoom embeddings:", error);
    return NextResponse.json(
      { error: "Failed to process Zoom embeddings" },
      { status: 500 }
    );
  }
}
