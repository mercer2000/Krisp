import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { classifyItem, classifyBatch } from "@/lib/smartLabels/classify";
import {
  classifySmartLabelsSchema,
  batchClassifySmartLabelsSchema,
} from "@/lib/validators/schemas";

/**
 * POST /api/smart-labels/classify
 * Classify a single item or batch of items against all active smart labels.
 *
 * Body (single):  { itemType: "email", itemId: "123" }
 * Body (batch):   { itemType: "email", limit: 10 }
 */
export async function POST(request: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));

    // Single item classification
    if (body.itemId) {
      const parsed = classifySmartLabelsSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid input", details: parsed.error.flatten() },
          { status: 400 }
        );
      }

      const result = await classifyItem(
        parsed.data.itemType,
        parsed.data.itemId,
        userId,
        { force: !!body.force }
      );
      return NextResponse.json(result);
    }

    // Batch classification
    const parsed = batchClassifySmartLabelsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await classifyBatch(
      parsed.data.itemType,
      userId,
      parsed.data.limit
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error classifying with smart labels:", error);
    return NextResponse.json(
      { error: "Failed to classify items" },
      { status: 500 }
    );
  }
}
