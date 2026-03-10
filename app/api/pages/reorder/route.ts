import { db } from "@/lib/db";
import { pages, workspaces } from "@/lib/db/schema";
import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const reorderPagesSchema = z.object({
  workspace_id: z.string().uuid(),
  pages: z.array(
    z.object({
      id: z.string().uuid(),
      sort_order: z.number().int(),
      parent_id: z.string().uuid().nullable().optional(),
    }),
  ),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getRequiredUser();

    const body = await request.json();
    const parsed = reorderPagesSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { workspace_id, pages: pageUpdates } = parsed.data;

    // Validate user owns the workspace
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, workspace_id));
    if (!workspace || workspace.ownerId !== user.id) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    await db.transaction(async (tx) => {
      for (const page of pageUpdates) {
        await tx
          .update(pages)
          .set({
            sortOrder: page.sort_order,
            ...(page.parent_id !== undefined ? { parentId: page.parent_id } : {}),
            updatedAt: new Date(),
          })
          .where(eq(pages.id, page.id));
      }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof Response) throw error;
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
