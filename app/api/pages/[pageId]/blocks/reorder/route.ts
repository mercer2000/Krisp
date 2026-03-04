import { db } from "@/lib/db";
import { blocks, pages, workspaces } from "@/lib/db/schema";
import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const reorderBlockSchema = z.object({
  blocks: z.array(
    z.object({
      id: z.string().uuid(),
      sort_order: z.number().int(),
      parent_block_id: z.string().uuid().nullable().optional(),
    }),
  ),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> },
) {
  try {
    const user = await getRequiredUser();
    const { pageId } = await params;

    const body = await request.json();
    const parsed = reorderBlockSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // Validate user owns the page's workspace
    const [page] = await db.select().from(pages).where(eq(pages.id, pageId));
    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, page.workspaceId));
    if (!workspace || workspace.ownerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { blocks: blockUpdates } = parsed.data;

    await db.transaction(async (tx) => {
      for (const block of blockUpdates) {
        await tx
          .update(blocks)
          .set({
            sortOrder: block.sort_order,
            parentBlockId: block.parent_block_id ?? null,
            updatedAt: new Date(),
          })
          .where(eq(blocks.id, block.id));
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
