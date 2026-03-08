import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { thoughtReminders, brainThoughts } from "@/lib/db/schema";
import { and, eq, desc } from "drizzle-orm";
import {
  decryptFields,
  BRAIN_THOUGHT_ENCRYPTED_FIELDS,
} from "@/lib/db/encryption-helpers";

/**
 * GET /api/brain/reminders
 * List all reminders for the authenticated user (with thought content).
 */
export async function GET(request: NextRequest) {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status"); // "pending" | "sent" | "cancelled"

  const conditions = [eq(thoughtReminders.userId, session.user.id)];
  if (status && ["pending", "sent", "cancelled"].includes(status)) {
    conditions.push(
      eq(thoughtReminders.status, status as "pending" | "sent" | "cancelled")
    );
  }

  const rows = await db
    .select({
      id: thoughtReminders.id,
      thoughtId: thoughtReminders.thoughtId,
      scheduledAt: thoughtReminders.scheduledAt,
      mode: thoughtReminders.mode,
      status: thoughtReminders.status,
      repetitionNumber: thoughtReminders.repetitionNumber,
      sentAt: thoughtReminders.sentAt,
      note: thoughtReminders.note,
      createdAt: thoughtReminders.createdAt,
      thoughtContent: brainThoughts.content,
      thoughtSource: brainThoughts.source,
      thoughtTopic: brainThoughts.topic,
    })
    .from(thoughtReminders)
    .innerJoin(brainThoughts, eq(thoughtReminders.thoughtId, brainThoughts.id))
    .where(and(...conditions))
    .orderBy(desc(thoughtReminders.scheduledAt));

  // Decrypt thought content
  const decrypted = rows.map((row) => {
    const decThought = decryptFields(
      { content: row.thoughtContent } as Record<string, unknown>,
      BRAIN_THOUGHT_ENCRYPTED_FIELDS
    );
    return {
      ...row,
      thoughtContent: decThought.content as string,
    };
  });

  return NextResponse.json({ reminders: decrypted });
}

/**
 * PATCH /api/brain/reminders
 * Update a reminder (cancel, reschedule).
 * Body: { id: string, status?: string, scheduledAt?: string }
 */
export async function PATCH(request: NextRequest) {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, status, scheduledAt } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  // Verify ownership
  const [existing] = await db
    .select({ id: thoughtReminders.id })
    .from(thoughtReminders)
    .where(
      and(
        eq(thoughtReminders.id, id),
        eq(thoughtReminders.userId, session.user.id)
      )
    );

  if (!existing) {
    return NextResponse.json(
      { error: "Reminder not found" },
      { status: 404 }
    );
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (status === "cancelled") {
    updates.status = "cancelled";
  }

  if (scheduledAt) {
    const newDate = new Date(scheduledAt);
    if (isNaN(newDate.getTime()) || newDate <= new Date()) {
      return NextResponse.json(
        { error: "scheduledAt must be a valid future date" },
        { status: 400 }
      );
    }
    updates.scheduledAt = newDate;
    updates.status = "pending";
  }

  const [updated] = await db
    .update(thoughtReminders)
    .set(updates)
    .where(eq(thoughtReminders.id, id))
    .returning();

  return NextResponse.json({ reminder: updated });
}

/**
 * DELETE /api/brain/reminders
 * Delete a reminder.
 * Body: { id: string }
 */
export async function DELETE(request: NextRequest) {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const deleted = await db
    .delete(thoughtReminders)
    .where(
      and(
        eq(thoughtReminders.id, id),
        eq(thoughtReminders.userId, session.user.id)
      )
    )
    .returning();

  if (deleted.length === 0) {
    return NextResponse.json(
      { error: "Reminder not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
