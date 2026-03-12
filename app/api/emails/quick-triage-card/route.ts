import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { users, boards, columns, cards, cardTags, actionItems } from "@/lib/db/schema";
import { eq, and, asc, max } from "drizzle-orm";
import { chatCompletion } from "@/lib/ai/client";
import {
  encryptFields,
  ACTION_ITEM_ENCRYPTED_FIELDS,
  CARD_ENCRYPTED_FIELDS,
} from "@/lib/db/encryption-helpers";

/**
 * POST /api/emails/quick-triage-card
 *
 * Fast endpoint for swipe-left triage: takes email subject + preview,
 * uses AI to extract a concise action item, and creates a Kanban card.
 * Designed for speed — accepts client-side data to avoid extra DB lookups.
 */
export async function POST(request: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { sender, subject, preview, emailId } = body as {
      sender?: string;
      subject?: string;
      preview?: string;
      emailId?: string | number;
    };

    if (!subject && !preview) {
      return NextResponse.json(
        { error: "Subject or preview required" },
        { status: 400 }
      );
    }

    // Look up user's board preference
    const [user] = await db
      .select({ emailActionBoardId: users.emailActionBoardId, defaultBoardId: users.defaultBoardId })
      .from(users)
      .where(eq(users.id, userId));

    const boardId = user?.emailActionBoardId ?? user?.defaultBoardId;
    if (!boardId) {
      return NextResponse.json(
        { error: "No board configured. Set a default board in Settings." },
        { status: 400 }
      );
    }

    // Verify board + find target column
    const [board] = await db
      .select({ id: boards.id })
      .from(boards)
      .where(and(eq(boards.id, boardId), eq(boards.userId, userId)));

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    const allCols = await db
      .select({ id: columns.id, title: columns.title })
      .from(columns)
      .where(eq(columns.boardId, boardId))
      .orderBy(asc(columns.position));

    if (allCols.length === 0) {
      return NextResponse.json({ error: "Board has no columns" }, { status: 400 });
    }

    // Prefer "To-Do" or "Draft" column, fall back to first
    const targetCol =
      allCols.find((c) => c.title.toLowerCase() === "to-do") ??
      allCols.find((c) => c.title.toLowerCase() === "todo") ??
      allCols.find((c) => c.title.toLowerCase() === "draft") ??
      allCols[0];

    // Fast AI extraction — concise prompt for speed
    const prompt = `Extract a single concise action item from this email. Respond with ONLY a JSON object: {"title":"...", "priority":"low|medium|high|urgent"}

The title should be a clear, actionable task (max 80 chars). If no clear action exists, summarize what needs attention.

From: ${sender || "Unknown"}
Subject: ${subject || "(No subject)"}
Preview: ${(preview || "").slice(0, 500)}`;

    let cardTitle = subject || "Email action item";
    let priority: "low" | "medium" | "high" | "urgent" = "medium";

    try {
      const aiText = await chatCompletion(prompt, {
        maxTokens: 150,
        userId,
      });
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.title && typeof parsed.title === "string") {
          cardTitle = parsed.title.slice(0, 255);
        }
        if (["low", "medium", "high", "urgent"].includes(parsed.priority)) {
          priority = parsed.priority;
        }
      }
    } catch {
      // AI failed — use subject as fallback title
    }

    // Create action item
    const [item] = await db
      .insert(actionItems)
      .values(
        encryptFields(
          {
            userId,
            title: cardTitle,
            description: preview?.slice(0, 500) ?? null,
            assignee: null,
            extractionSource: "email",
            priority,
            dueDate: null,
          },
          ACTION_ITEM_ENCRYPTED_FIELDS
        )
      )
      .returning();

    // Get next position
    const [posResult] = await db
      .select({ maxPosition: max(cards.position) })
      .from(cards)
      .where(eq(cards.columnId, targetCol.id));

    const nextPosition = (posResult?.maxPosition ?? 0) + 1024;

    // Create card
    const [card] = await db
      .insert(cards)
      .values(
        encryptFields(
          {
            columnId: targetCol.id,
            title: cardTitle.slice(0, 255),
            description: preview?.slice(0, 500) ?? null,
            position: nextPosition,
            priority,
          },
          CARD_ENCRYPTED_FIELDS
        )
      )
      .returning();

    // Tag and link
    await Promise.all([
      db.insert(cardTags).values({
        cardId: card.id,
        label: "Email",
        color: "#3B82F6",
      }),
      db
        .update(actionItems)
        .set({ cardId: card.id, updatedAt: new Date() })
        .where(eq(actionItems.id, item.id)),
    ]);

    return NextResponse.json(
      {
        cardId: card.id,
        title: cardTitle,
        column: targetCol.title,
        priority,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating quick triage card:", error);
    return NextResponse.json(
      { error: "Failed to create card" },
      { status: 500 }
    );
  }
}
