import { NextRequest, NextResponse } from "next/server";
import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { db } from "@/lib/db";
import { pages, workspaces, databaseRows } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// PATCH /api/databases/[pageId]/rows/[rowId] - update row properties
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string; rowId: string }> }
) {
  try {
    const user = await getRequiredUser();
    const { pageId, rowId } = await params;

    // Validate page exists and user owns the workspace
    const [page] = await db
      .select({
        id: pages.id,
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

    const body = await request.json();
    const { properties } = body;

    if (!properties || typeof properties !== "object") {
      return NextResponse.json(
        { error: "Properties object is required" },
        { status: 400 }
      );
    }

    const [updatedRow] = await db
      .update(databaseRows)
      .set({ properties, updatedAt: new Date() })
      .where(
        and(
          eq(databaseRows.id, rowId),
          eq(databaseRows.databasePageId, pageId)
        )
      )
      .returning();

    if (!updatedRow) {
      return NextResponse.json({ error: "Row not found" }, { status: 404 });
    }

    return NextResponse.json(updatedRow);
  } catch (error) {
    console.error("Error updating database row:", error);
    return NextResponse.json(
      { error: "Failed to update database row" },
      { status: 500 }
    );
  }
}

// DELETE /api/databases/[pageId]/rows/[rowId] - delete row and linked page
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ pageId: string; rowId: string }> }
) {
  try {
    const user = await getRequiredUser();
    const { pageId, rowId } = await params;

    // Validate page exists and user owns the workspace
    const [page] = await db
      .select({
        id: pages.id,
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

    // Fetch the row to get rowPageId before deleting
    const [row] = await db
      .select()
      .from(databaseRows)
      .where(
        and(
          eq(databaseRows.id, rowId),
          eq(databaseRows.databasePageId, pageId)
        )
      );

    if (!row) {
      return NextResponse.json({ error: "Row not found" }, { status: 404 });
    }

    // Delete the linked page if it exists (blocks cascade via FK)
    if (row.rowPageId) {
      await db.delete(pages).where(eq(pages.id, row.rowPageId));
    }

    // Delete the row
    await db.delete(databaseRows).where(eq(databaseRows.id, rowId));

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting database row:", error);
    return NextResponse.json(
      { error: "Failed to delete database row" },
      { status: 500 }
    );
  }
}
