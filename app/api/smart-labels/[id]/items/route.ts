import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getSmartLabelById,
  getItemsForSmartLabel,
  assignSmartLabel,
  removeSmartLabel,
} from "@/lib/smartLabels/labels";
import { z } from "zod";

const addItemSchema = z.object({
  itemType: z.enum(["email", "gmail_email", "card", "action_item", "meeting"]),
  itemId: z.string().min(1),
});

/**
 * GET /api/smart-labels/:id/items
 * Get all items tagged with this smart label.
 */
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
    const label = await getSmartLabelById(id, userId);
    if (!label) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const items = await getItemsForSmartLabel(id, userId);
    return NextResponse.json({ data: items });
  } catch (error) {
    console.error("Error fetching smart label items:", error);
    return NextResponse.json(
      { error: "Failed to fetch items" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/smart-labels/:id/items
 * Manually assign this smart label to an item.
 */
export async function POST(
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
    const label = await getSmartLabelById(id, userId);
    if (!label) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = addItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await assignSmartLabel(id, parsed.data.itemType, parsed.data.itemId, null, "manual");
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Error assigning smart label:", error);
    return NextResponse.json(
      { error: "Failed to assign label" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/smart-labels/:id/items
 * Remove this smart label from an item.
 * Query params: itemType, itemId
 */
export async function DELETE(
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
    const label = await getSmartLabelById(id, userId);
    if (!label) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const itemType = request.nextUrl.searchParams.get("itemType");
    const itemId = request.nextUrl.searchParams.get("itemId");
    if (!itemType || !itemId) {
      return NextResponse.json(
        { error: "itemType and itemId are required" },
        { status: 400 }
      );
    }

    await removeSmartLabel(id, itemType, itemId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing smart label:", error);
    return NextResponse.json(
      { error: "Failed to remove label" },
      { status: 500 }
    );
  }
}
