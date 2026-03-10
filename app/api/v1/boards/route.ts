import { db } from "@/lib/db";
import { boards } from "@/lib/db/schema";
import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { createBoardSchema } from "@/lib/validators/schemas";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { logActivity } from "@/lib/activity/log";

export async function GET() {
  try {
    const user = await getRequiredUser();

    const userBoards = await db
      .select()
      .from(boards)
      .where(eq(boards.userId, user.id))
      .orderBy(desc(boards.updatedAt));

    return NextResponse.json(userBoards);
  } catch (error) {
    if (error instanceof Response) throw error;
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getRequiredUser();

    const body = await request.json();
    const parsed = createBoardSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const [board] = await db
      .insert(boards)
      .values({
        ...parsed.data,
        userId: user.id,
      })
      .returning();

    logActivity({
      userId: user.id,
      eventType: "board.created",
      title: `Created board "${board.title}"`,
      entityType: "board",
      entityId: board.id,
    });

    return NextResponse.json(board, { status: 201 });
  } catch (error) {
    if (error instanceof Response) throw error;
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
