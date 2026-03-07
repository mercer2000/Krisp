import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { thoughtReminders, brainThoughts } from "@/lib/db/schema";
import { and, eq, desc } from "drizzle-orm";

/**
 * GET /api/brain/thoughts/[thoughtId]/reminders
 * List reminders for a specific thought.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ thoughtId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { thoughtId } = await params;

  const reminders = await db
    .select()
    .from(thoughtReminders)
    .where(
      and(
        eq(thoughtReminders.thoughtId, thoughtId),
        eq(thoughtReminders.userId, session.user.id)
      )
    )
    .orderBy(desc(thoughtReminders.scheduledAt));

  return NextResponse.json({ reminders });
}

/**
 * POST /api/brain/thoughts/[thoughtId]/reminders
 * Create a reminder for a thought.
 * Body: { scheduledAt: string (ISO), mode?: "one_time" | "spaced_repetition", note?: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ thoughtId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { thoughtId } = await params;

  // Verify the thought belongs to this user
  const [thought] = await db
    .select({ id: brainThoughts.id })
    .from(brainThoughts)
    .where(
      and(
        eq(brainThoughts.id, thoughtId),
        eq(brainThoughts.userId, session.user.id)
      )
    );

  if (!thought) {
    return NextResponse.json({ error: "Thought not found" }, { status: 404 });
  }

  const body = await request.json();
  const { scheduledAt, mode, note } = body;

  if (!scheduledAt) {
    return NextResponse.json(
      { error: "scheduledAt is required" },
      { status: 400 }
    );
  }

  const scheduledDate = new Date(scheduledAt);
  if (isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
    return NextResponse.json(
      { error: "scheduledAt must be a valid future date" },
      { status: 400 }
    );
  }

  const validModes = ["one_time", "spaced_repetition"] as const;
  const reminderMode = validModes.includes(mode) ? mode : "one_time";

  const [reminder] = await db
    .insert(thoughtReminders)
    .values({
      thoughtId,
      userId: session.user.id,
      scheduledAt: scheduledDate,
      mode: reminderMode,
      note: note || null,
    })
    .returning();

  return NextResponse.json({ reminder }, { status: 201 });
}
