import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import {
  getLabelsForEmail,
  assignLabelsToEmail,
  removeLabelFromEmail,
} from "@/lib/email/labels";
import { getEmailById } from "@/lib/email/emails";
import { z } from "zod";

const assignLabelSchema = z.object({
  labelId: z.string().uuid(),
});

/**
 * GET /api/emails/:id/labels
 * Get labels assigned to an email.
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
    const emailId = parseInt(id, 10);
    if (isNaN(emailId)) {
      return NextResponse.json({ error: "Invalid email ID" }, { status: 400 });
    }

    // Verify email belongs to user
    const email = await getEmailById(emailId, userId);
    if (!email) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    const labels = await getLabelsForEmail(emailId);
    return NextResponse.json({ data: labels });
  } catch (error) {
    console.error("Error fetching email labels:", error);
    return NextResponse.json(
      { error: "Failed to fetch labels" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/emails/:id/labels
 * Manually assign a label to an email.
 */
export async function POST(
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
    const emailId = parseInt(id, 10);
    if (isNaN(emailId)) {
      return NextResponse.json({ error: "Invalid email ID" }, { status: 400 });
    }

    const email = await getEmailById(emailId, userId);
    if (!email) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = assignLabelSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await assignLabelsToEmail(emailId, [
      { labelId: parsed.data.labelId, assignedBy: "manual" },
    ]);

    const labels = await getLabelsForEmail(emailId);
    return NextResponse.json({ data: labels });
  } catch (error) {
    console.error("Error assigning label:", error);
    return NextResponse.json(
      { error: "Failed to assign label" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/emails/:id/labels
 * Remove a label from an email.
 * Query param: labelId
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
    const emailId = parseInt(id, 10);
    if (isNaN(emailId)) {
      return NextResponse.json({ error: "Invalid email ID" }, { status: 400 });
    }

    const email = await getEmailById(emailId, userId);
    if (!email) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    const labelId = request.nextUrl.searchParams.get("labelId");
    if (!labelId) {
      return NextResponse.json({ error: "labelId is required" }, { status: 400 });
    }

    await removeLabelFromEmail(emailId, labelId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing label:", error);
    return NextResponse.json(
      { error: "Failed to remove label" },
      { status: 500 }
    );
  }
}
