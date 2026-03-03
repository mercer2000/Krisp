import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getEmailDetail } from "@/lib/email/emails";
import { db } from "@/lib/db";
import { actionItems, boards, columns, cards, cardTags } from "@/lib/db/schema";
import { eq, and, asc, max } from "drizzle-orm";
import { z } from "zod";

const createFromEmailSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  assignee: z.string().max(255).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  dueDate: z.string().optional(),
  boardId: z.string().uuid().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const emailId = parseInt(id, 10);
    if (isNaN(emailId) || emailId < 1) {
      return NextResponse.json({ error: "Invalid email ID" }, { status: 400 });
    }

    // Verify email belongs to user
    const email = await getEmailDetail(emailId, userId);
    if (!email) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = createFromEmailSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { title, description, assignee, priority, dueDate, boardId } = parsed.data;

    // Create the action item
    const [item] = await db
      .insert(actionItems)
      .values({
        userId,
        title,
        description: description ?? null,
        assignee: assignee ?? null,
        extractionSource: "email",
        priority: priority ?? "medium",
        dueDate: dueDate ?? null,
      })
      .returning();

    let cardCreated = false;

    // Optionally create a Kanban card
    if (boardId) {
      const [board] = await db
        .select({ id: boards.id })
        .from(boards)
        .where(and(eq(boards.id, boardId), eq(boards.userId, userId)));

      if (board) {
        const [firstCol] = await db
          .select({ id: columns.id })
          .from(columns)
          .where(eq(columns.boardId, boardId))
          .orderBy(asc(columns.position))
          .limit(1);

        if (firstCol) {
          const [posResult] = await db
            .select({ maxPosition: max(cards.position) })
            .from(cards)
            .where(eq(cards.columnId, firstCol.id));

          const nextPosition = (posResult?.maxPosition ?? 0) + 1024;

          const [card] = await db
            .insert(cards)
            .values({
              columnId: firstCol.id,
              title: title.slice(0, 255),
              description: description ?? null,
              position: nextPosition,
              priority: priority ?? "medium",
              dueDate: dueDate ?? null,
            })
            .returning();

          // Add "Email" tag for traceability
          await db.insert(cardTags).values({
            cardId: card.id,
            label: "Email",
            color: "#3B82F6",
          });

          // Link card to action item
          await db
            .update(actionItems)
            .set({ cardId: card.id, updatedAt: new Date() })
            .where(eq(actionItems.id, item.id));

          cardCreated = true;
        }
      }
    }

    return NextResponse.json({ actionItem: item, cardCreated }, { status: 201 });
  } catch (error) {
    console.error("Error creating action item from email:", error);
    return NextResponse.json(
      { error: "Failed to create action item" },
      { status: 500 }
    );
  }
}
