import { NextRequest, NextResponse } from "next/server";
import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { db } from "@/lib/db";
import { pages, workspaces } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getValidOutlookAccessToken } from "@/lib/outlook/oauth";
import {
  createMailFolder,
  findMailFolderByName,
} from "@/lib/outlook/folders";

// POST /api/pages/[pageId]/sync-folder
// Provision an Outlook folder for this page's smart rule.
// Body: { accountId: string }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const user = await getRequiredUser();
    const { pageId } = await params;

    const [page] = await db
      .select()
      .from(pages)
      .where(eq(pages.id, pageId));

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, page.workspaceId));
    if (!workspace || workspace.ownerId !== user.id) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    const body = await request.json();
    const { accountId } = body as { accountId: string };

    if (!accountId) {
      return NextResponse.json(
        { error: "accountId is required" },
        { status: 400 }
      );
    }

    // Get a valid access token for this Outlook account
    let accessToken: string;
    try {
      accessToken = await getValidOutlookAccessToken(accountId, user.id);
    } catch {
      return NextResponse.json(
        { error: "Failed to authenticate with Outlook. Please reconnect your account." },
        { status: 401 }
      );
    }

    // Use the page title as the folder name
    const folderName = page.title || "Untitled";

    // Check if folder already exists, otherwise create it
    let folder = await findMailFolderByName(accessToken, folderName);
    if (!folder) {
      folder = await createMailFolder(accessToken, folderName);
    }

    // Update the page with folder info
    const [updated] = await db
      .update(pages)
      .set({
        smartRuleAccountId: accountId,
        smartRuleFolderId: folder.id,
        smartRuleFolderName: folder.displayName ?? folderName,
        updatedAt: new Date(),
      })
      .where(eq(pages.id, pageId))
      .returning();

    return NextResponse.json({
      message: "Outlook folder linked",
      folderId: folder.id,
      folderName: folder.displayName ?? folderName,
      page: updated,
    });
  } catch (error) {
    console.error("Error syncing page folder:", error);
    return NextResponse.json(
      { error: "Failed to sync folder" },
      { status: 500 }
    );
  }
}

// DELETE /api/pages/[pageId]/sync-folder
// Unlink the Outlook folder from this page (does not delete the folder).
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const user = await getRequiredUser();
    const { pageId } = await params;

    const [page] = await db
      .select()
      .from(pages)
      .where(eq(pages.id, pageId));

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, page.workspaceId));
    if (!workspace || workspace.ownerId !== user.id) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    const [updated] = await db
      .update(pages)
      .set({
        smartRuleAccountId: null,
        smartRuleFolderId: null,
        smartRuleFolderName: null,
        updatedAt: new Date(),
      })
      .where(eq(pages.id, pageId))
      .returning();

    return NextResponse.json({
      message: "Outlook folder unlinked",
      page: updated,
    });
  } catch (error) {
    console.error("Error unlinking page folder:", error);
    return NextResponse.json(
      { error: "Failed to unlink folder" },
      { status: 500 }
    );
  }
}
