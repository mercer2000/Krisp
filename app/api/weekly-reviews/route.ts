import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { weeklyReviews } from "@/lib/db/schema";
import { eq, and, desc, isNull } from "drizzle-orm";
import { generateWeeklyReview, getPreviousWeekRange } from "@/lib/weekly-review/generate";
import { sendWeeklyReviewEmail } from "@/lib/weekly-review/email";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const items = await db
      .select()
      .from(weeklyReviews)
      .where(and(eq(weeklyReviews.userId, userId), isNull(weeklyReviews.deletedAt)))
      .orderBy(desc(weeklyReviews.weekStart));

    return NextResponse.json({ reviews: items });
  } catch (error) {
    console.error("Error fetching weekly reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch weekly reviews" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const sendEmail = body.sendEmail === true;

    // Determine week range
    let weekRange;
    if (body.weekStart && body.weekEnd) {
      weekRange = {
        start: new Date(body.weekStart + "T00:00:00"),
        end: new Date(body.weekEnd + "T23:59:59.999"),
      };
    } else {
      weekRange = getPreviousWeekRange();
    }

    const reviewId = await generateWeeklyReview(userId, weekRange);

    if (sendEmail) {
      try {
        await sendWeeklyReviewEmail(reviewId);
      } catch (emailErr) {
        console.error("Failed to send weekly review email:", emailErr);
        // Don't fail the whole request if email fails
      }
    }

    // Fetch the completed review
    const [review] = await db
      .select()
      .from(weeklyReviews)
      .where(eq(weeklyReviews.id, reviewId));

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error("Error generating weekly review:", error);
    return NextResponse.json(
      { error: "Failed to generate weekly review" },
      { status: 500 }
    );
  }
}
