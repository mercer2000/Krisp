import { NextRequest, NextResponse } from "next/server";
import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { db } from "@/lib/db";
import { pages, blocks, workspaces } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";

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
      .select()
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
    } = body as {
      workspace_id?: string;
      parent_id?: string | null;
      title?: string;
      icon?: string | null;
      is_database?: boolean;
      database_config?: Record<string, unknown> | null;
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
