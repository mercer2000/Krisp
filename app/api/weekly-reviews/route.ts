import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { weeklyReviews } from "@/lib/db/schema";
import { eq, and, desc, isNull, lt, inArray } from "drizzle-orm";
import { generateWeeklyReview, getPreviousWeekRange } from "@/lib/weekly-review/generate";
import { sendWeeklyReviewEmail } from "@/lib/weekly-review/email";
import {
  decryptFields,
  decryptRows,
  encryptFields,
  WEEKLY_REVIEW_ENCRYPTED_FIELDS,
} from "@/lib/db/encryption-helpers";

export async function GET(request: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Auto-fix stuck "generating" reviews older than 5 minutes
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    const stuckReviews = await db
      .select({ id: weeklyReviews.id })
      .from(weeklyReviews)
      .where(
        and(
          eq(weeklyReviews.userId, userId),
          eq(weeklyReviews.status, "generating"),
          lt(weeklyReviews.createdAt, fiveMinAgo)
        )
      );

    if (stuckReviews.length > 0) {
      await db
        .update(weeklyReviews)
        .set(
          encryptFields(
            {
              status: "failed",
              synthesisReport: "Generation timed out. Please try generating again.",
              updatedAt: new Date(),
            },
            WEEKLY_REVIEW_ENCRYPTED_FIELDS
          )
        )
        .where(
          inArray(
            weeklyReviews.id,
            stuckReviews.map((r) => r.id)
          )
        );
    }

    const items = await db
      .select()
      .from(weeklyReviews)
      .where(and(eq(weeklyReviews.userId, userId), isNull(weeklyReviews.deletedAt)))
      .orderBy(desc(weeklyReviews.weekStart));

    const decrypted = decryptRows(items as Record<string, unknown>[], WEEKLY_REVIEW_ENCRYPTED_FIELDS);
    return NextResponse.json({ reviews: decrypted });
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
    const { data: session } = await auth.getSession();
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

    const decryptedReview = review ? decryptFields(review as Record<string, unknown>, WEEKLY_REVIEW_ENCRYPTED_FIELDS) : review;
    return NextResponse.json({ review: decryptedReview }, { status: 201 });
  } catch (error) {
    console.error("Error generating weekly review:", error);
    return NextResponse.json(
      { error: "Failed to generate weekly review" },
      { status: 500 }
    );
  }
}
