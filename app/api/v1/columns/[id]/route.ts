import { db } from "@/lib/db";
import { boards, columns } from "@/lib/db/schema";
import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { updateColumnSchema } from "@/lib/validators/schemas";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getRequiredUser();
    const { id } = await params;

    const body = await request.json();
    const parsed = updateColumnSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // Verify column ownership via board
    const [col] = await db
      .select({ id: columns.id })
      .from(columns)
      .innerJoin(boards, eq(columns.boardId, boards.id))
      .where(and(eq(columns.id, id), eq(boards.userId, user.id)));

    if (!col) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const [updated] = await db
      .update(columns)
      .set(parsed.data)
      .where(eq(columns.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Response) throw error;
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getRequiredUser();
    const { id } = await params;

    // Verify column ownership via board
    const [col] = await db
      .select({ id: columns.id })
      .from(columns)
      .innerJoin(boards, eq(columns.boardId, boards.id))
      .where(and(eq(columns.id, id), eq(boards.userId, user.id)));

    if (!col) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await db.delete(columns).where(eq(columns.id, id));

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof Response) throw error;
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
