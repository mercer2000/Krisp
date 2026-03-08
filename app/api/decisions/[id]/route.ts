import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { decisions } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { updateDecisionSchema } from "@/lib/validators/schemas";

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
    const [item] = await db
      .select()
      .from(decisions)
      .where(
        and(
          eq(decisions.id, id),
          eq(decisions.userId, userId),
          isNull(decisions.deletedAt)
        )
      );

    if (!item) {
      return NextResponse.json(
        { error: "Decision not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ decision: item });
  } catch (error) {
    console.error("Error fetching decision:", error);
    return NextResponse.json(
      { error: "Failed to fetch decision" },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    const body = await request.json();
    const parsed = updateDecisionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {
      ...parsed.data,
      updatedAt: new Date(),
    };

    if (parsed.data.decisionDate) {
      updates.decisionDate = new Date(parsed.data.decisionDate);
    } else if (parsed.data.decisionDate === null) {
      updates.decisionDate = null;
    }

    const [item] = await db
      .update(decisions)
      .set(updates)
      .where(and(eq(decisions.id, id), eq(decisions.userId, userId)))
      .returning();

    if (!item) {
      return NextResponse.json(
        { error: "Decision not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ decision: item });
  } catch (error) {
    console.error("Error updating decision:", error);
    return NextResponse.json(
      { error: "Failed to update decision" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    const [softDeleted] = await db
      .update(decisions)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(decisions.id, id), eq(decisions.userId, userId)))
      .returning({ id: decisions.id });

    if (!softDeleted) {
      return NextResponse.json(
        { error: "Decision not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Decision deleted" });
  } catch (error) {
    console.error("Error deleting decision:", error);
    return NextResponse.json(
      { error: "Failed to delete decision" },
      { status: 500 }
    );
  }
}
