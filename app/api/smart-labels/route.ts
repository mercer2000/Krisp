import { NextRequest, NextResponse, after } from "next/server";
import { auth } from "@/lib/auth/server";
import { getSmartLabels, createSmartLabel } from "@/lib/smartLabels/labels";
import { createSmartLabelSchema } from "@/lib/validators/schemas";
import {
  provisionFolderForLabel,
  getDefaultOutlookAccountId,
} from "@/lib/smartLabels/folderSync";
import { logActivity } from "@/lib/activity/log";

/**
 * GET /api/smart-labels
 * List all smart labels for the current user.
 */
export async function GET() {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const labels = await getSmartLabels(userId);
    return NextResponse.json({ data: labels });
  } catch (error) {
    console.error("Error fetching smart labels:", error);
    return NextResponse.json(
      { error: "Failed to fetch smart labels" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/smart-labels
 * Create a new smart label. If the user has an active Outlook account,
 * provisions a matching Outlook mail folder in the background.
 */
export async function POST(request: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createSmartLabelSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const label = await createSmartLabel(
      userId,
      parsed.data.name,
      parsed.data.prompt,
      parsed.data.color || "#6366F1"
    );

    logActivity({
      userId,
      eventType: "smart_label.created",
      title: `Created smart label "${label.name}"`,
      entityType: "smart_label",
      entityId: String(label.id),
      metadata: { color: label.color },
    });

    // Provision Outlook folder in background (non-blocking)
    after(async () => {
      try {
        const outlookAccountId = await getDefaultOutlookAccountId(userId);
        if (outlookAccountId) {
          await provisionFolderForLabel(label, outlookAccountId);
        }
      } catch (err) {
        console.error(
          `[SmartLabels] Failed to provision Outlook folder for label "${label.name}":`,
          err
        );
      }
    });

    return NextResponse.json({ data: label }, { status: 201 });
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
    console.error("Error creating smart label:", error);
    return NextResponse.json(
      { error: "Failed to create smart label" },
      { status: 500 }
    );
  }
}
