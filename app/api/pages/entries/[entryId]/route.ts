import { NextRequest, NextResponse } from "next/server";
import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { db } from "@/lib/db";
import { pageEntries, pages, workspaces } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

async function validateEntryAccess(entryId: string, userId: string) {
  const [entry] = await db
    .select()
    .from(pageEntries)
    .where(eq(pageEntries.id, entryId));
  if (!entry) return null;

  const [page] = await db.select().from(pages).where(eq(pages.id, entry.pageId));
  if (!page) return null;

  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, page.workspaceId));
  if (!workspace || workspace.ownerId !== userId) return null;

  return entry;
}

// PATCH /api/pages/entries/[entryId] — update an entry
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ entryId: string }> },
) {
  try {
    const user = await getRequiredUser();
    const { entryId } = await params;

    const entry = await validateEntryAccess(entryId, user.id);
    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    const body = await request.json();
    const { title, content, metadata } = body as {
      title?: string;
      content?: string;
      metadata?: Record<string, unknown>;
    };

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (metadata !== undefined) updates.metadata = metadata;

    const [updated] = await db
      .update(pageEntries)
      .set(updates)
      .where(eq(pageEntries.id, entryId))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("Error updating page entry:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/pages/entries/[entryId] — delete an entry
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ entryId: string }> },
) {
  try {
    const user = await getRequiredUser();
    const { entryId } = await params;

    const entry = await validateEntryAccess(entryId, user.id);
    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    await db.delete(pageEntries).where(eq(pageEntries.id, entryId));

    return NextResponse.json({ message: "Entry deleted" });
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("Error deleting page entry:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
