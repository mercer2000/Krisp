import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { actionItems, webhookKeyPoints } from "@/lib/db/schema";
import { eq, desc, and, sql, isNull } from "drizzle-orm";
import { createActionItemSchema } from "@/lib/validators/schemas";
import {
  encryptFields,
  decryptFields,
  ACTION_ITEM_ENCRYPTED_FIELDS,
} from "@/lib/db/encryption-helpers";
import { logActivity } from "@/lib/activity/log";

export async function GET(request: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const meetingId = searchParams.get("meetingId");

    const conditions = [eq(actionItems.userId, userId), isNull(actionItems.deletedAt)];
    if (status) {
      conditions.push(
        eq(actionItems.status, status as "open" | "in_progress" | "completed" | "cancelled")
      );
    }
    if (meetingId) {
      conditions.push(eq(actionItems.meetingId, parseInt(meetingId, 10)));
    }

    const items = await db
      .select({
        id: actionItems.id,
        userId: actionItems.userId,
        meetingId: actionItems.meetingId,
        cardId: actionItems.cardId,
        title: actionItems.title,
        description: actionItems.description,
        assignee: actionItems.assignee,
        extractionSource: actionItems.extractionSource,
        status: actionItems.status,
        priority: actionItems.priority,
        dueDate: actionItems.dueDate,
        completedAt: actionItems.completedAt,
        reminderSentAt: actionItems.reminderSentAt,
        createdAt: actionItems.createdAt,
        updatedAt: actionItems.updatedAt,
        meetingTitle: sql<string | null>`(
          SELECT meeting_title FROM webhook_key_points
          WHERE id = ${actionItems.meetingId}
        )`.as("meeting_title"),
      })
      .from(actionItems)
      .where(and(...conditions))
      .orderBy(desc(actionItems.createdAt));

    // Decrypt action item fields and meeting title
    const decrypted = items.map((item) => {
      const dec = decryptFields(item as Record<string, unknown>, ACTION_ITEM_ENCRYPTED_FIELDS);
      // Also decrypt the meeting title sub-select
      if (typeof dec.meetingTitle === "string") {
        dec.meetingTitle = decryptFields({ meetingTitle: dec.meetingTitle } as Record<string, unknown>, ["meetingTitle"]).meetingTitle;
      }
      return dec;
    });

    return NextResponse.json({ actionItems: decrypted });
  } catch (error) {
    console.error("Error fetching action items:", error);
    return NextResponse.json(
      { error: "Failed to fetch action items" },
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

    const body = await request.json();
    const parsed = createActionItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { title, description, assignee, priority, dueDate, meetingId } =
      parsed.data;

    const [item] = await db
      .insert(actionItems)
      .values(
        encryptFields({
          userId,
          title,
          description: description ?? null,
          assignee: assignee ?? null,
          priority: priority ?? "medium",
          dueDate: dueDate ?? null,
          meetingId: meetingId ?? null,
        }, ACTION_ITEM_ENCRYPTED_FIELDS)
      )
      .returning();

    const decrypted = decryptFields(item as Record<string, unknown>, ACTION_ITEM_ENCRYPTED_FIELDS);

    logActivity({
      userId,
      eventType: "action_item.created",
      title: `Created action item: "${title}"`,
      entityType: "action_item",
      entityId: item.id,
      metadata: { priority: priority ?? "medium", assignee: assignee ?? null },
    });

    return NextResponse.json({ actionItem: decrypted }, { status: 201 });
  } catch (error) {
    console.error("Error creating action item:", error);
    return NextResponse.json(
      { error: "Failed to create action item" },
      { status: 500 }
    );
  }
}
