import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { getSmartLabelById } from "@/lib/smartLabels/labels";
import {
  provisionFolderForLabel,
  getDefaultOutlookAccountId,
} from "@/lib/smartLabels/folderSync";

/**
 * POST /api/smart-labels/:id/sync-folder
 * Manually trigger folder provisioning for a smart label.
 * Useful when a user connects Outlook after already having labels,
 * or to retry a failed provisioning.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const label = await getSmartLabelById(id, userId);
    if (!label) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const outlookAccountId = await getDefaultOutlookAccountId(userId);
    if (!outlookAccountId) {
      return NextResponse.json(
        { error: "No active Outlook account. Please connect your Microsoft account first." },
        { status: 400 }
      );
    }

    const result = await provisionFolderForLabel(label, outlookAccountId);

    if (result.status === "synced") {
      return NextResponse.json({
        message: "Outlook folder provisioned successfully",
        graphFolderId: result.graphFolderId,
      });
    }

    return NextResponse.json(
      { error: "Failed to provision Outlook folder. Check your Microsoft account connection." },
      { status: 502 }
    );
  } catch (error) {
    console.error("Error syncing folder:", error);
    return NextResponse.json(
      { error: "Failed to sync folder" },
      { status: 500 }
    );
  }
}
