import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { inboxLayouts } from "@/lib/db/schema";
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
    const { name, leftSectionId, rightSectionId, isDefault } = body;

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updates.name = name.trim();
    if (leftSectionId !== undefined) updates.leftSectionId = leftSectionId || null;
    if (rightSectionId !== undefined) updates.rightSectionId = rightSectionId || null;

    // If setting as default, unset any existing default
    if (isDefault) {
      await db
        .update(inboxLayouts)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(eq(inboxLayouts.tenantId, userId));
      updates.isDefault = true;
    } else if (isDefault === false) {
      updates.isDefault = false;
    }

    const [row] = await db
      .update(inboxLayouts)
      .set(updates)
      .where(
        and(eq(inboxLayouts.id, id), eq(inboxLayouts.tenantId, userId))
      )
      .returning();

    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ data: row });
  } catch (error) {
    console.error("Error updating inbox layout:", error);
    return NextResponse.json(
      { error: "Failed to update inbox layout" },
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
      .delete(inboxLayouts)
      .where(
        and(eq(inboxLayouts.id, id), eq(inboxLayouts.tenantId, userId))
      )
      .returning();

    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting inbox layout:", error);
    return NextResponse.json(
      { error: "Failed to delete inbox layout" },
      { status: 500 }
    );
  }
}
