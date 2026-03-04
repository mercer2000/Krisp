import { NextRequest, NextResponse } from "next/server";
import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { db } from "@/lib/db";
import { pages, blocks, workspaces } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";

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

    return NextResponse.json({ ...page, blocks: pageBlocks });
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
    } = body as {
      title?: string;
      icon?: string | null;
      cover_url?: string | null;
      parent_id?: string | null;
      sort_order?: number;
      is_archived?: boolean;
      database_config?: Record<string, unknown> | null;
    };

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (title !== undefined) updates.title = title;
    if (icon !== undefined) updates.icon = icon;
    if (cover_url !== undefined) updates.coverUrl = cover_url;
    if (parent_id !== undefined) updates.parentId = parent_id;
    if (sort_order !== undefined) updates.sortOrder = sort_order;
    if (is_archived !== undefined) updates.isArchived = is_archived;
    if (database_config !== undefined) updates.databaseConfig = database_config;

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
