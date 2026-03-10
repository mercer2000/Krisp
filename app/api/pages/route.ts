import { NextRequest, NextResponse } from "next/server";
import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { db } from "@/lib/db";
import { pages, blocks, workspaces } from "@/lib/db/schema";
import { eq, and, asc, sql } from "drizzle-orm";
import { logActivity } from "@/lib/activity/log";

// GET /api/pages?workspace_id=...  — list non-archived pages for a workspace
export async function GET(request: NextRequest) {
  try {
    const user = await getRequiredUser();

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspace_id");
    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspace_id query param is required" },
        { status: 400 },
      );
    }

    // Validate user owns the workspace
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId));
    if (!workspace || workspace.ownerId !== user.id) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const rows = await db
      .select({
        id: pages.id,
        workspaceId: pages.workspaceId,
        parentId: pages.parentId,
        title: pages.title,
        icon: pages.icon,
        coverUrl: pages.coverUrl,
        isDatabase: pages.isDatabase,
        databaseConfig: pages.databaseConfig,
        isArchived: pages.isArchived,
        createdBy: pages.createdBy,
        sortOrder: pages.sortOrder,
        pageType: pages.pageType,
        color: pages.color,
        smartRule: pages.smartRule,
        smartActive: pages.smartActive,
        smartRuleAccountId: pages.smartRuleAccountId,
        smartRuleFolderId: pages.smartRuleFolderId,
        smartRuleFolderName: pages.smartRuleFolderName,
        createdAt: pages.createdAt,
        updatedAt: pages.updatedAt,
        entryCount: sql<number>`(SELECT count(*) FROM page_entries WHERE page_id = ${pages.id})`.as("entry_count"),
      })
      .from(pages)
      .where(
        and(
          eq(pages.workspaceId, workspaceId),
          eq(pages.isArchived, false),
        ),
      )
      .orderBy(asc(pages.sortOrder));

    return NextResponse.json(rows);
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("Error listing pages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/pages — create a new page (+ default empty paragraph block)
export async function POST(request: NextRequest) {
  try {
    const user = await getRequiredUser();

    const body = await request.json();
    const {
      workspace_id,
      parent_id,
      title,
      icon,
      is_database,
      database_config,
      page_type,
      color,
      smart_rule,
      smart_active,
    } = body as {
      workspace_id?: string;
      parent_id?: string | null;
      title?: string;
      icon?: string | null;
      is_database?: boolean;
      database_config?: Record<string, unknown> | null;
      page_type?: "page" | "knowledge" | "decisions";
      color?: string | null;
      smart_rule?: string | null;
      smart_active?: boolean;
    };

    if (!workspace_id) {
      return NextResponse.json(
        { error: "workspace_id is required" },
        { status: 400 },
      );
    }

    // Validate user owns the workspace
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, workspace_id));
    if (!workspace || workspace.ownerId !== user.id) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Create the page
    const [page] = await db
      .insert(pages)
      .values({
        workspaceId: workspace_id,
        parentId: parent_id ?? null,
        title: title ?? "",
        icon: icon ?? null,
        isDatabase: is_database ?? false,
        databaseConfig: database_config ?? null,
        createdBy: user.id,
        sortOrder: 0,
        pageType: page_type ?? "page",
        color: color ?? null,
        smartRule: smart_rule ?? null,
        smartActive: smart_active ?? false,
      })
      .returning();

    // Create a default empty paragraph block
    await db.insert(blocks).values({
      pageId: page.id,
      parentBlockId: null,
      type: "paragraph",
      content: { text: "" },
      sortOrder: 0,
    });

    logActivity({
      userId: user.id,
      eventType: "page.created",
      title: `Created page "${page.title || "Untitled"}"`,
      entityType: "page",
      entityId: page.id,
      metadata: { pageType: page_type ?? "page", workspaceId: workspace_id },
    });

    return NextResponse.json(page, { status: 201 });
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("Error creating page:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
