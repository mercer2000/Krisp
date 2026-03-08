import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { getClassifiedItemIds } from "@/lib/smartLabels/labels";
import { z } from "zod";

const querySchema = z.object({
  itemType: z.enum(["email", "gmail_email", "card", "action_item", "meeting"]),
  itemIds: z.array(z.string().min(1)).min(1).max(200),
});

/**
 * POST /api/smart-labels/classified
 * Check which items have been classified by AI.
 * Body: { itemType: "email", itemIds: ["1", "2", "3"] }
 * Returns: { data: ["1", "3"] } — subset of IDs that have been classified
 */
export async function POST(request: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = querySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const classifiedIds = await getClassifiedItemIds(
      parsed.data.itemType,
      parsed.data.itemIds,
      userId
    );
    return NextResponse.json({ data: Array.from(classifiedIds) });
  } catch (error) {
    console.error("Error checking classification status:", error);
    return NextResponse.json(
      { error: "Failed to check classification status" },
      { status: 500 }
    );
  }
}
