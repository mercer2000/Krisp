import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import sql from "@/lib/email/db";

/**
 * PATCH /api/emails/spam/:id
 * Mark or unmark an email as spam.
 * Body: { isSpam: boolean }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const emailId = parseInt(id, 10);
    if (isNaN(emailId)) {
      return NextResponse.json({ error: "Invalid email ID" }, { status: 400 });
    }

    const body = await request.json();
    const { isSpam } = body as { isSpam: boolean };

    if (typeof isSpam !== "boolean") {
      return NextResponse.json(
        { error: "isSpam must be a boolean" },
        { status: 400 }
      );
    }

    const rows = await sql`
      UPDATE emails
      SET is_spam = ${isSpam}, updated_at = NOW()
      WHERE id = ${emailId} AND tenant_id = ${userId}
      RETURNING id, is_spam
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    return NextResponse.json({ data: rows[0] });
  } catch (error) {
    console.error("Error updating spam status:", error);
    return NextResponse.json(
      { error: "Failed to update spam status" },
      { status: 500 }
    );
  }
}
