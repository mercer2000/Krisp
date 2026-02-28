import { db } from "@/lib/db";
import { boards, columns } from "@/lib/db/schema";
import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { eq, and, inArray, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const reorderSchema = z.object({
  columnIds: z.array(z.string()),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> },
) {
  try {
    const user = await getRequiredUser();
    const { boardId } = await params;

    const body = await request.json();
    const parsed = reorderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { columnIds } = parsed.data;

    // Verify board ownership
    const [board] = await db
      .select()
      .from(boards)
      .where(and(eq(boards.id, boardId), eq(boards.userId, user.id)));

    if (!board) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Verify all columns belong to this board
    const boardColumns = await db
      .select({ id: columns.id })
      .from(columns)
      .where(
        and(eq(columns.boardId, boardId), inArray(columns.id, columnIds)),
      );

    if (boardColumns.length !== columnIds.length) {
      return NextResponse.json(
        { error: "One or more columns do not belong to this board" },
        { status: 400 },
      );
    }

    // Update positions: index * 1024
    await db.transaction(async (tx) => {
      for (let i = 0; i < columnIds.length; i++) {
        await tx
          .update(columns)
          .set({ position: i * 1024 })
          .where(eq(columns.id, columnIds[i]));
      }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof Response) throw error;
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
