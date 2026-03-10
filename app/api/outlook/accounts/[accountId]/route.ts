import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { outlookOauthTokens, boards } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * PATCH /api/outlook/accounts/[accountId]
 * Update per-account settings (e.g., emailActionBoardId).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { accountId } = await params;
    const body = await request.json();
    const { emailActionBoardId } = body as { emailActionBoardId: string | null };

    // Validate account belongs to user
    const [account] = await db
      .select({ id: outlookOauthTokens.id })
      .from(outlookOauthTokens)
      .where(
        and(
          eq(outlookOauthTokens.id, accountId),
          eq(outlookOauthTokens.tenantId, userId)
        )
      );

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Validate board if setting one
    if (emailActionBoardId) {
      const [board] = await db
        .select({ id: boards.id })
        .from(boards)
        .where(and(eq(boards.id, emailActionBoardId), eq(boards.userId, userId)));

      if (!board) {
        return NextResponse.json({ error: "Board not found" }, { status: 404 });
      }
    }

    await db
      .update(outlookOauthTokens)
      .set({
        emailActionBoardId: emailActionBoardId ?? null,
        updatedAt: new Date(),
      })
      .where(eq(outlookOauthTokens.id, accountId));

    return NextResponse.json({ emailActionBoardId: emailActionBoardId ?? null });
  } catch (error) {
    console.error("Error updating Outlook account:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
