import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import {
  getDraftById,
  updateDraftStatus,
  generateDraftReply,
} from "@/lib/smartLabels/draftGeneration";
import { getSmartLabelById } from "@/lib/smartLabels/labels";
import { updateContextEntryReply } from "@/lib/smartLabels/contextWindow";

/**
 * GET /api/smart-labels/drafts/:draftId
 * Get a single draft by ID.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { draftId } = await params;
    const draft = await getDraftById(draftId, userId);
    if (!draft) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ data: draft });
  } catch (error) {
    console.error("Error fetching draft:", error);
    return NextResponse.json(
      { error: "Failed to fetch draft" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/smart-labels/drafts/:draftId
 * Update draft: send, discard, or regenerate.
 * Body: { action: "send" | "discard" | "regenerate", draftBody?: string }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ draftId: string }> }
) {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { draftId } = await params;
    const body = await request.json();
    const { action, draftBody } = body;

    if (!["send", "discard", "regenerate"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'send', 'discard', or 'regenerate'" },
        { status: 400 }
      );
    }

    const draft = await getDraftById(draftId, userId);
    if (!draft) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (action === "send") {
      // Mark as sent (actual email sending via Graph/Gmail API would go here)
      const updated = await updateDraftStatus(draftId, userId, "sent");

      // Update context window with the reply excerpt
      if (draft.label_id && draftBody) {
        await updateContextEntryReply(
          draft.label_id,
          draft.email_id,
          draft.email_type,
          draftBody.slice(0, 1200)
        );
      }

      return NextResponse.json({ data: updated });
    }

    if (action === "discard") {
      const updated = await updateDraftStatus(draftId, userId, "discarded");
      return NextResponse.json({ data: updated });
    }

    if (action === "regenerate") {
      // Discard current draft
      await updateDraftStatus(draftId, userId, "discarded");

      // Generate a new draft using current context window state
      if (!draft.label_id) {
        return NextResponse.json(
          { error: "Cannot regenerate: label no longer exists" },
          { status: 400 }
        );
      }

      const label = await getSmartLabelById(draft.label_id, userId);
      if (!label) {
        return NextResponse.json(
          { error: "Cannot regenerate: label not found" },
          { status: 400 }
        );
      }

      const newDraft = await generateDraftReply(
        draft.email_id,
        draft.email_type,
        userId,
        label
      );

      if (!newDraft) {
        return NextResponse.json(
          { error: "Failed to regenerate draft" },
          { status: 500 }
        );
      }

      return NextResponse.json({ data: newDraft });
    }
  } catch (error) {
    console.error("Error updating draft:", error);
    return NextResponse.json(
      { error: "Failed to update draft" },
      { status: 500 }
    );
  }
}
