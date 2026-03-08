import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user] = await db
      .select({ defaultBoardId: users.defaultBoardId })
      .from(users)
      .where(eq(users.id, userId));

    return NextResponse.json({ defaultBoardId: user?.defaultBoardId ?? null });
  } catch (error) {
    console.error("Error fetching default board:", error);
    return NextResponse.json(
      { error: "Failed to fetch default board" },
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

    const { boardId } = await request.json();

    await db
      .update(users)
      .set({ defaultBoardId: boardId || null, updatedAt: new Date() })
      .where(eq(users.id, userId));

    return NextResponse.json({ defaultBoardId: boardId || null });
  } catch (error) {
    console.error("Error updating default board:", error);
    return NextResponse.json(
      { error: "Failed to update default board" },
      { status: 500 }
    );
  }
}
