import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { actionItems } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { updateActionItemSchema } from "@/lib/validators/schemas";

export async function GET(
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
    const [item] = await db
      .select()
      .from(actionItems)
      .where(and(eq(actionItems.id, id), eq(actionItems.userId, userId), isNull(actionItems.deletedAt)));

    if (!item) {
      return NextResponse.json(
        { error: "Action item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ actionItem: item });
  } catch (error) {
    console.error("Error fetching action item:", error);
    return NextResponse.json(
      { error: "Failed to fetch action item" },
      { status: 500 }
    );
  }
}

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
    const parsed = updateActionItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };

    // Auto-set completedAt when status changes to completed
    if (parsed.data.status === "completed") {
      updates.completedAt = new Date();
    } else if (parsed.data.status) {
      updates.completedAt = null;
    }

    const [item] = await db
      .update(actionItems)
      .set(updates)
      .where(and(eq(actionItems.id, id), eq(actionItems.userId, userId)))
      .returning();

    if (!item) {
      return NextResponse.json(
        { error: "Action item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ actionItem: item });
  } catch (error) {
    console.error("Error updating action item:", error);
    return NextResponse.json(
      { error: "Failed to update action item" },
      { status: 500 }
    );
  }
}

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
    const [softDeleted] = await db
      .update(actionItems)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(actionItems.id, id), eq(actionItems.userId, userId)))
      .returning({ id: actionItems.id });

    if (!softDeleted) {
      return NextResponse.json(
        { error: "Action item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Action item deleted" });
  } catch (error) {
    console.error("Error deleting action item:", error);
    return NextResponse.json(
      { error: "Failed to delete action item" },
      { status: 500 }
    );
  }
}
