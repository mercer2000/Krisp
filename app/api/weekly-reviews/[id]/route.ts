import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { weeklyReviews } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { sendWeeklyReviewEmail } from "@/lib/weekly-review/email";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const [review] = await db
      .select()
      .from(weeklyReviews)
      .where(and(eq(weeklyReviews.id, id), eq(weeklyReviews.userId, userId)));

    if (!review) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ review });
  } catch (error) {
    console.error("Error fetching weekly review:", error);
    return NextResponse.json(
      { error: "Failed to fetch weekly review" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const [review] = await db
      .update(weeklyReviews)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(weeklyReviews.id, id), eq(weeklyReviews.userId, userId)))
      .returning({ id: weeklyReviews.id });

    if (!review) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting weekly review:", error);
    return NextResponse.json(
      { error: "Failed to delete weekly review" },
      { status: 500 }
    );
  }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const [review] = await db
      .select()
      .from(weeklyReviews)
      .where(and(eq(weeklyReviews.id, id), eq(weeklyReviews.userId, userId)));

    if (!review) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await sendWeeklyReviewEmail(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending weekly review email:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
