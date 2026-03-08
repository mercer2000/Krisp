import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { removeFromWhitelist } from "@/lib/email/newsletterDetection";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const deleted = await removeFromWhitelist(userId, id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Whitelist entry not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing from whitelist:", error);
    return NextResponse.json(
      { error: "Failed to remove from whitelist" },
      { status: 500 }
    );
  }
}
