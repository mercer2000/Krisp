import { db } from "@/lib/db";
import { boards, columns } from "@/lib/db/schema";
import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { createColumnSchema } from "@/lib/validators/schemas";
import { eq, and, max } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> },
) {
  try {
    const user = await getRequiredUser();
    const { boardId } = await params;

    const body = await request.json();
    const parsed = createColumnSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // Verify board ownership
    const [board] = await db
      .select()
      .from(boards)
      .where(and(eq(boards.id, boardId), eq(boards.userId, user.id)));

    if (!board) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Get max position of existing columns in the board
    const [result] = await db
      .select({ maxPosition: max(columns.position) })
      .from(columns)
      .where(eq(columns.boardId, boardId));

    const nextPosition = (result?.maxPosition ?? 0) + 1024;

    const [column] = await db
      .insert(columns)
      .values({
        ...parsed.data,
        boardId,
        position: nextPosition,
      })
      .returning();

    return NextResponse.json(column, { status: 201 });
  } catch (error) {
    if (error instanceof Response) throw error;
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
