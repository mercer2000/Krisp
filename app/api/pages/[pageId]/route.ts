import { NextRequest, NextResponse } from "next/server";
import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { db } from "@/lib/db";
import { pages, blocks, workspaces, pageEntries } from "@/lib/db/schema";
import { eq, and, asc, desc, count } from "drizzle-orm";

// GET /api/pages/[pageId] — get page with its blocks
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> },
) {
  try {
    const user = await getRequiredUser();
    const { pageId } = await params;

    // Fetch the page
    const [page] = await db
      .select()
      .from(pages)
      .where(eq(pages.id, pageId));

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Validate user owns the workspace
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, page.workspaceId));
    if (!workspace || workspace.ownerId !== user.id) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Fetch blocks for the page
    const pageBlocks = await db
      .select()
      .from(blocks)
      .where(eq(blocks.pageId, pageId))
      .orderBy(asc(blocks.sortOrder));

    // For knowledge/decisions pages or pages with a smart rule, also fetch recent entries
    let entries: typeof pageEntries.$inferSelect[] = [];
    let entryCount = 0;
    if (page.pageType === "knowledge" || page.pageType === "decisions" || page.smartRule) {
      entries = await db
        .select()
        .from(pageEntries)
        .where(eq(pageEntries.pageId, pageId))
        .orderBy(desc(pageEntries.createdAt))
        .limit(50);
      const [countResult] = await db
        .select({ count: count() })
        .from(pageEntries)
        .where(eq(pageEntries.pageId, pageId));
      entryCount = countResult?.count ?? 0;
    }

    return NextResponse.json({ ...page, blocks: pageBlocks, entries, entryCount });
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("Error fetching page:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PATCH /api/pages/[pageId] — update page metadata
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> },
) {
  try {
    const user = await getRequiredUser();
    const { pageId } = await params;

    // Fetch the page to validate ownership
    const [existing] = await db
      .select()
      .from(pages)
      .where(eq(pages.id, pageId));

    if (!existing) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, existing.workspaceId));
    if (!workspace || workspace.ownerId !== user.id) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      title,
      icon,
      cover_url,
      parent_id,
      sort_order,
      is_archived,
      database_config,
      page_type,
      color,
      smart_rule,
      smart_active,
      smart_rule_account_id,
      smart_rule_folder_id,
      smart_rule_folder_name,
    } = body as {
      title?: string;
      icon?: string | null;
      cover_url?: string | null;
      parent_id?: string | null;
      sort_order?: number;
      is_archived?: boolean;
      database_config?: Record<string, unknown> | null;
      page_type?: "page" | "knowledge" | "decisions";
      color?: string | null;
      smart_rule?: string | null;
      smart_active?: boolean;
      smart_rule_account_id?: string | null;
      smart_rule_folder_id?: string | null;
      smart_rule_folder_name?: string | null;
    };

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (title !== undefined) updates.title = title;
    if (icon !== undefined) updates.icon = icon;
    if (cover_url !== undefined) updates.coverUrl = cover_url;
    if (parent_id !== undefined) updates.parentId = parent_id;
    if (sort_order !== undefined) updates.sortOrder = sort_order;
    if (is_archived !== undefined) updates.isArchived = is_archived;
    if (database_config !== undefined) updates.databaseConfig = database_config;
    if (page_type !== undefined) updates.pageType = page_type;
    if (color !== undefined) updates.color = color;
    if (smart_rule !== undefined) updates.smartRule = smart_rule;
    if (smart_active !== undefined) updates.smartActive = smart_active;
    if (smart_rule_account_id !== undefined) updates.smartRuleAccountId = smart_rule_account_id;
    if (smart_rule_folder_id !== undefined) updates.smartRuleFolderId = smart_rule_folder_id;
    if (smart_rule_folder_name !== undefined) updates.smartRuleFolderName = smart_rule_folder_name;

    const [updated] = await db
      .update(pages)
      .set(updates)
      .where(eq(pages.id, pageId))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("Error updating page:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/pages/[pageId] — hard delete page (blocks cascade via FK)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> },
) {
  try {
    const user = await getRequiredUser();
    const { pageId } = await params;

    // Fetch the page to validate ownership
    const [existing] = await db
      .select()
      .from(pages)
      .where(eq(pages.id, pageId));

    if (!existing) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, existing.workspaceId));
    if (!workspace || workspace.ownerId !== user.id) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    await db.delete(pages).where(eq(pages.id, pageId));

    return NextResponse.json({ message: "Page deleted" });
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("Error deleting page:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
