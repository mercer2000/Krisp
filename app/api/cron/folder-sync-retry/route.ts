import { NextRequest, NextResponse } from "next/server";
import { processRetryQueue } from "@/lib/smartLabels/folderSync";

// Cron endpoint to process the folder move retry queue.
// Protected by CRON_SECRET header.
// Schedule: Every 5 minutes.
// Vercel Cron config: path "/api/cron/folder-sync-retry", schedule "*/5 * * * *"
export async function GET(request: NextRequest) {
  const cronSecret = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    cronSecret !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processRetryQueue(20);
    return NextResponse.json({
      message: `Processed ${result.processed} queued folder moves`,
      ...result,
    });
  } catch (error) {
    console.error("Cron folder-sync-retry error:", error);
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}
