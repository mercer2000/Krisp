import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { vipContacts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { updateVipContactSchema } from "@/lib/validators/schemas";

// PUT /api/vip-contacts/[id] — update a VIP contact
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = updateVipContactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (parsed.data.displayName !== undefined) {
      updates.displayName = parsed.data.displayName;
    }
    if (parsed.data.notifyOnNew !== undefined) {
      updates.notifyOnNew = parsed.data.notifyOnNew;
    }

    const [row] = await db
      .update(vipContacts)
      .set(updates)
      .where(and(eq(vipContacts.id, id), eq(vipContacts.tenantId, userId)))
      .returning();

    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        id: row.id,
        email: row.email,
        domain: row.domain,
        display_name: row.displayName,
        notify_on_new: row.notifyOnNew,
        created_at: row.createdAt.toISOString(),
        updated_at: row.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error updating VIP contact:", error);
    return NextResponse.json(
      { error: "Failed to update VIP contact" },
      { status: 500 }
    );
  }
}

// DELETE /api/vip-contacts/[id] — remove a VIP contact
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [row] = await db
      .delete(vipContacts)
      .where(and(eq(vipContacts.id, id), eq(vipContacts.tenantId, userId)))
      .returning();

    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting VIP contact:", error);
    return NextResponse.json(
      { error: "Failed to delete VIP contact" },
      { status: 500 }
    );
  }
}
