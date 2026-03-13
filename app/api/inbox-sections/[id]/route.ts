import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { inboxSections } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, filterCriteria, color, position } = body;

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updates.name = name.trim();
    if (filterCriteria !== undefined) updates.filterCriteria = filterCriteria;
    if (color !== undefined) updates.color = color;
    if (position !== undefined) updates.position = position;

    const [row] = await db
      .update(inboxSections)
      .set(updates)
      .where(
        and(eq(inboxSections.id, id), eq(inboxSections.tenantId, userId))
      )
      .returning();

    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ data: row });
  } catch (error) {
    console.error("Error updating inbox section:", error);
    return NextResponse.json(
      { error: "Failed to update inbox section" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [row] = await db
      .delete(inboxSections)
      .where(
        and(eq(inboxSections.id, id), eq(inboxSections.tenantId, userId))
      )
      .returning();

    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting inbox section:", error);
    return NextResponse.json(
      { error: "Failed to delete inbox section" },
      { status: 500 }
    );
  }
}
