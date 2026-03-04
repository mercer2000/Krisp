import { db } from "@/lib/db";
import { blocks, pages, workspaces } from "@/lib/db/schema";
import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateBlockSchema = z.object({
  content: z.record(z.string(), z.unknown()).optional(),
  type: z.string().min(1).max(50).optional(),
  sort_order: z.number().int().optional(),
  parent_block_id: z.string().uuid().nullable().optional(),
});

async function verifyBlockOwnership(blockId: string, userId: string) {
  const [block] = await db
    .select()
    .from(blocks)
    .where(eq(blocks.id, blockId));
  if (!block) return null;

  const [page] = await db
    .select()
    .from(pages)
    .where(eq(pages.id, block.pageId));
  if (!page) return null;

  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, page.workspaceId));
  if (!workspace || workspace.ownerId !== userId) return null;

  return block;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getRequiredUser();
    const { id } = await params;

    const body = await request.json();
    const parsed = updateBlockSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // Verify ownership: block -> page -> workspace -> owner
    const block = await verifyBlockOwnership(id, user.id);
    if (!block) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { content, type, sort_order, parent_block_id } = parsed.data;

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (content !== undefined) updates.content = content;
    if (type !== undefined) updates.type = type;
    if (sort_order !== undefined) updates.sortOrder = sort_order;
    if (parent_block_id !== undefined) updates.parentBlockId = parent_block_id;

    const [updated] = await db
      .update(blocks)
      .set(updates)
      .where(eq(blocks.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Response) throw error;
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getRequiredUser();
    const { id } = await params;

    // Verify ownership: block -> page -> workspace -> owner
    const block = await verifyBlockOwnership(id, user.id);
    if (!block) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Delete child blocks first (no FK cascade on parentBlockId)
    await db.delete(blocks).where(eq(blocks.parentBlockId, id));

    // Delete the block itself
    await db.delete(blocks).where(eq(blocks.id, id));

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof Response) throw error;
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
