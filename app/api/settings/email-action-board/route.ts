import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { users, boards } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET() {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user] = await db
      .select({ emailActionBoardId: users.emailActionBoardId })
      .from(users)
      .where(eq(users.id, userId));

    return NextResponse.json({
      emailActionBoardId: user?.emailActionBoardId ?? null,
    });
  } catch (error) {
    console.error("Error fetching email action board setting:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { boardId } = body as { boardId: string | null };

    // If setting a board, validate it exists and belongs to the user
    if (boardId) {
      const [board] = await db
        .select({ id: boards.id })
        .from(boards)
        .where(and(eq(boards.id, boardId), eq(boards.userId, userId)));

      if (!board) {
        return NextResponse.json(
          { error: "Board not found" },
          { status: 404 }
        );
      }
    }

    await db
      .update(users)
      .set({ emailActionBoardId: boardId ?? null, updatedAt: new Date() })
      .where(eq(users.id, userId));

    return NextResponse.json({ emailActionBoardId: boardId ?? null });
  } catch (error) {
    console.error("Error updating email action board setting:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
