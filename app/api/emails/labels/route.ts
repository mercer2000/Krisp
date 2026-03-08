import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import {
  ensureSystemLabels,
  getLabelsForTenant,
  createCustomLabel,
} from "@/lib/email/labels";
import { z } from "zod";

const createLabelSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

/**
 * GET /api/emails/labels
 * List all labels for the current tenant. Creates system labels if missing.
 */
export async function GET() {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure system labels exist, then return all
    const labels = await ensureSystemLabels(userId);
    return NextResponse.json({ data: labels });
  } catch (error) {
    console.error("Error fetching labels:", error);
    return NextResponse.json(
      { error: "Failed to fetch labels" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/emails/labels
 * Create a custom label.
 */
export async function POST(request: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createLabelSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const label = await createCustomLabel(userId, parsed.data.name, parsed.data.color);
    return NextResponse.json({ data: label }, { status: 201 });
  } catch (error: unknown) {
    // Handle unique constraint violation
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "23505") {
      return NextResponse.json(
        { error: "A label with this name already exists" },
        { status: 409 }
      );
    }
    console.error("Error creating label:", error);
    return NextResponse.json(
      { error: "Failed to create label" },
      { status: 500 }
    );
  }
}
