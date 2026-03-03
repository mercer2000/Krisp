import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { deleteCustomLabel } from "@/lib/email/labels";

/**
 * DELETE /api/emails/labels/:id
 * Delete a custom label (system labels cannot be deleted).
 */
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
    const deleted = await deleteCustomLabel(userId, id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Label not found or is a system label" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting label:", error);
    return NextResponse.json(
      { error: "Failed to delete label" },
      { status: 500 }
    );
  }
}
