import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { getSmartLabelById } from "@/lib/smartLabels/labels";
import {
  getContextEntries,
  deleteContextEntry,
} from "@/lib/smartLabels/contextWindow";

/**
 * GET /api/smart-labels/:id/context
 * Get context window entries for a smart label (for memory UI).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const label = await getSmartLabelById(id, userId);
    if (!label) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const entries = await getContextEntries(id);
    return NextResponse.json({ data: entries });
  } catch (error) {
    console.error("Error fetching context entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch context entries" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/smart-labels/:id/context
 * Delete a specific context entry.
 * Query param: ?entryId=<uuid>
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const label = await getSmartLabelById(id, userId);
    if (!label) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const entryId = request.nextUrl.searchParams.get("entryId");
    if (!entryId) {
      return NextResponse.json({ error: "entryId is required" }, { status: 400 });
    }

    const deleted = await deleteContextEntry(entryId);
    if (!deleted) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting context entry:", error);
    return NextResponse.json(
      { error: "Failed to delete context entry" },
      { status: 500 }
    );
  }
}
