import { NextRequest, NextResponse } from "next/server";
import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { db } from "@/lib/db";
import { pages, workspaces, databaseRows, blocks } from "@/lib/db/schema";
import { eq, and, asc, max } from "drizzle-orm";

// GET /api/databases/[pageId]/rows - list rows for a database page
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const user = await getRequiredUser();
    const { pageId } = await params;

    // Validate page exists, is a database, and user owns the workspace
    const [page] = await db
      .select({
        id: pages.id,
        isDatabase: pages.isDatabase,
        ownerId: workspaces.ownerId,
      })
      .from(pages)
      .innerJoin(workspaces, eq(pages.workspaceId, workspaces.id))
      .where(eq(pages.id, pageId));

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    if (page.ownerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!page.isDatabase) {
      return NextResponse.json(
        { error: "Page is not a database" },
        { status: 400 }
      );
    }

    const rows = await db
      .select()
      .from(databaseRows)
      .where(eq(databaseRows.databasePageId, pageId))
      .orderBy(asc(databaseRows.sortOrder));

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error listing database rows:", error);
    return NextResponse.json(
      { error: "Failed to list database rows" },
      { status: 500 }
    );
  }
}

// POST /api/databases/[pageId]/rows - create a new row
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const user = await getRequiredUser();
    const { pageId } = await params;

    // Validate page exists, is a database, and user owns the workspace
    const [page] = await db
      .select({
        id: pages.id,
        isDatabase: pages.isDatabase,
        workspaceId: pages.workspaceId,
        ownerId: workspaces.ownerId,
      })
      .from(pages)
      .innerJoin(workspaces, eq(pages.workspaceId, workspaces.id))
      .where(eq(pages.id, pageId));

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    if (page.ownerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!page.isDatabase) {
      return NextResponse.json(
        { error: "Page is not a database" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { properties, title } = body;

    // Determine next sort order
    const [maxResult] = await db
      .select({ maxSort: max(databaseRows.sortOrder) })
      .from(databaseRows)
      .where(eq(databaseRows.databasePageId, pageId));

    const nextSortOrder = (maxResult?.maxSort ?? 0) + 1;

    // Create a linked page for this row
    const [rowPage] = await db
      .insert(pages)
      .values({
        workspaceId: page.workspaceId,
        parentId: pageId,
        title: title || "Untitled",
        createdBy: user.id,
        sortOrder: 0,
      })
      .returning();

    // Create a default empty paragraph block on the linked page
    await db.insert(blocks).values({
      pageId: rowPage.id,
      type: "paragraph",
      content: { text: "" },
      sortOrder: 0,
    });

    // Create the database row
    const [row] = await db
      .insert(databaseRows)
      .values({
        databasePageId: pageId,
        rowPageId: rowPage.id,
        properties: properties ?? {},
        sortOrder: nextSortOrder,
      })
      .returning();

    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    console.error("Error creating database row:", error);
    return NextResponse.json(
      { error: "Failed to create database row" },
      { status: 500 }
    );
  }
}
