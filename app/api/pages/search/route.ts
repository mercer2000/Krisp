import { NextRequest, NextResponse } from "next/server";
import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { db } from "@/lib/db";
import { pages, workspaces } from "@/lib/db/schema";
import { eq, and, asc, ilike } from "drizzle-orm";

// GET /api/pages/search?q=...&workspace_id=...  — search pages by title
export async function GET(request: NextRequest) {
  try {
    const user = await getRequiredUser();

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");
    const workspaceId = searchParams.get("workspace_id");

    if (!q) {
      return NextResponse.json(
        { error: "q query param is required" },
        { status: 400 },
      );
    }
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
          ilike(pages.title, `%${q}%`),
        ),
      )
      .orderBy(asc(pages.sortOrder))
      .limit(20);

    return NextResponse.json(rows);
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("Error searching pages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
