import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { getSmartLabelsForItems } from "@/lib/smartLabels/labels";
import { z } from "zod";

const batchQuerySchema = z.object({
  itemType: z.enum(["email", "gmail_email", "card", "action_item", "meeting"]),
  itemIds: z.array(z.string().min(1)).min(1).max(200),
});

/**
 * POST /api/smart-labels/items
 * Batch-fetch smart labels for a list of items.
 * Body: { itemType: "email", itemIds: ["1", "2", "3"] }
 */
export async function POST(request: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = batchQuerySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const labels = await getSmartLabelsForItems(
      parsed.data.itemType,
      parsed.data.itemIds,
      userId
    );
    return NextResponse.json({ data: labels });
  } catch (error) {
    console.error("Error fetching smart labels for items:", error);
    return NextResponse.json(
      { error: "Failed to fetch smart labels" },
      { status: 500 }
    );
  }
}
