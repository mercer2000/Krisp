import { NextRequest, NextResponse } from "next/server";
import { getRequiredAdmin } from "@/lib/auth/getRequiredAdmin";
import { db } from "@/lib/db";
import { supportCannedResponses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const patchSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  content: z.string().min(1).optional(),
  category: z.string().max(50).optional(),
  shortcut: z.string().max(20).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getRequiredAdmin();
    const { id } = await params;
    const body = await request.json();
    const parsed = patchSchema.parse(body);

    const [response] = await db
      .update(supportCannedResponses)
      .set({ ...parsed, updatedAt: new Date() })
      .where(eq(supportCannedResponses.id, id))
      .returning();

    if (!response) {
      return NextResponse.json(
        { error: "Canned response not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Failed to update canned response:", error);
    return NextResponse.json(
      { error: "Failed to update canned response" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getRequiredAdmin();
    const { id } = await params;

    await db
      .delete(supportCannedResponses)
      .where(eq(supportCannedResponses.id, id));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete canned response:", error);
    return NextResponse.json(
      { error: "Failed to delete canned response" },
      { status: 500 }
    );
  }
}
