import { NextRequest, NextResponse, after } from "next/server";
import { auth } from "@/lib/auth/server";
import {
  getSmartLabelById,
  updateSmartLabel,
  deleteSmartLabel,
} from "@/lib/smartLabels/labels";
import { updateSmartLabelSchema } from "@/lib/validators/schemas";
import {
  renameFolderForLabel,
  unlinkFolderForLabel,
} from "@/lib/smartLabels/folderSync";

/**
 * GET /api/smart-labels/:id
 * Get a single smart label.
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
    return NextResponse.json({ data: label });
  } catch (error) {
    console.error("Error fetching smart label:", error);
    return NextResponse.json(
      { error: "Failed to fetch smart label" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/smart-labels/:id
 * Update a smart label. If the name changes and the label has a synced
 * Outlook folder, renames the folder in the background.
 */
export async function PATCH(
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
    const body = await request.json();
    const parsed = updateSmartLabelSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Fetch current label to detect name change
    const currentLabel = parsed.data.name !== undefined
      ? await getSmartLabelById(id, userId)
      : null;

    const label = await updateSmartLabel(id, userId, parsed.data);
    if (!label) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Rename Outlook folder in background if label name changed
    if (
      currentLabel &&
      parsed.data.name &&
      currentLabel.name !== parsed.data.name &&
      currentLabel.graph_folder_id
    ) {
      after(async () => {
        try {
          await renameFolderForLabel(currentLabel, parsed.data.name!);
        } catch (err) {
          console.error(
            `[SmartLabels] Failed to rename Outlook folder for label "${currentLabel.name}":`,
            err
          );
        }
      });
    }

    return NextResponse.json({ data: label });
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code: string }).code === "23505"
    ) {
      return NextResponse.json(
        { error: "A smart label with this name already exists" },
        { status: 409 }
      );
    }
    console.error("Error updating smart label:", error);
    return NextResponse.json(
      { error: "Failed to update smart label" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/smart-labels/:id
 * Delete a smart label and all its associations.
 * Unlinks the Outlook folder but does NOT delete it.
 */
export async function DELETE(
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

    // Unlink the Outlook folder before deleting (leaves folder intact)
    await unlinkFolderForLabel(id, userId);

    const deleted = await deleteSmartLabel(id, userId);
    if (!deleted) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting smart label:", error);
    return NextResponse.json(
      { error: "Failed to delete smart label" },
      { status: 500 }
    );
  }
}
