import { NextRequest, NextResponse } from "next/server";
import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { db } from "@/lib/db";
import { pages, workspaces } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// PATCH /api/databases/[pageId]/config - update database config
export async function PATCH(
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
        databaseConfig: pages.databaseConfig,
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
    const { properties, views } = body;

    if (!properties && !views) {
      return NextResponse.json(
        { error: "At least one of properties or views is required" },
        { status: 400 }
      );
    }

    // Merge with existing config
    const existingConfig = (page.databaseConfig as Record<string, unknown>) ?? {};
    const updatedConfig = {
      ...existingConfig,
      ...(properties !== undefined ? { properties } : {}),
      ...(views !== undefined ? { views } : {}),
    };

    const [updatedPage] = await db
      .update(pages)
      .set({ databaseConfig: updatedConfig, updatedAt: new Date() })
      .where(eq(pages.id, pageId))
      .returning();

    return NextResponse.json(updatedPage);
  } catch (error) {
    console.error("Error updating database config:", error);
    return NextResponse.json(
      { error: "Failed to update database config" },
      { status: 500 }
    );
  }
}
