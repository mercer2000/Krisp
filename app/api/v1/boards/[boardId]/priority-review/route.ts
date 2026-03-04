import { db } from "@/lib/db";
import {
  boards,
  columns,
  cards,
} from "@/lib/db/schema";
import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { chatCompletion } from "@/lib/ai/client";
import { eq, and, isNull, asc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/krisp/db";

interface PrioritySuggestion {
  cardId: string;
  cardTitle: string;
  currentPriority: string;
  suggestedPriority: string;
  suggestedDueDate: string | null;
  reason: string;
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> },
) {
  try {
    const user = await getRequiredUser();
    const { boardId } = await params;

    // Verify board ownership
    const [board] = await db
      .select({ id: boards.id, title: boards.title })
      .from(boards)
      .where(and(eq(boards.id, boardId), eq(boards.userId, user.id)));

    if (!board) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Get all open (non-archived, non-deleted) cards with their columns and tags
    const boardColumns = await db.query.columns.findMany({
      where: eq(columns.boardId, boardId),
      orderBy: [asc(columns.position)],
      with: {
        cards: {
          where: and(isNull(cards.deletedAt), eq(cards.archived, false)),
          with: { tags: true },
        },
      },
    });

    const allCards = boardColumns.flatMap((col) =>
      col.cards.map((card) => ({
        ...card,
        columnTitle: col.title,
      })),
    );

    if (allCards.length === 0) {
      return NextResponse.json({ suggestions: [] });
    }

    // Get recent meetings (last 2 weeks)
    let recentMeetings: { meeting_title: string | null; content: unknown; meeting_start_date: string | null }[] = [];
    try {
      recentMeetings = await sql`
        SELECT meeting_title, content, meeting_start_date
        FROM webhook_key_points
        WHERE user_id = ${user.id}
          AND deleted_at IS NULL
          AND meeting_start_date > NOW() - INTERVAL '14 days'
        ORDER BY meeting_start_date DESC
        LIMIT 10
      ` as typeof recentMeetings;
    } catch {
      // meetings table might not exist for all users
    }

    // Get recent emails (last 2 weeks)
    let recentEmails: { subject: string | null; sender: string | null; received_at: string | null; body_plain_text: string | null }[] = [];
    try {
      recentEmails = await sql`
        SELECT subject, sender, received_at, LEFT(body_plain_text, 500) as body_plain_text
        FROM emails
        WHERE tenant_id = ${user.id}
          AND deleted_at IS NULL
          AND received_at > NOW() - INTERVAL '14 days'
        ORDER BY received_at DESC
        LIMIT 15
      ` as typeof recentEmails;
    } catch {
      // emails table might not have data
    }

    // Get recent action items
    let recentActionItems: { title: string; priority: string; due_date: string | null; status: string }[] = [];
    try {
      recentActionItems = await sql`
        SELECT title, priority, due_date, status
        FROM action_items
        WHERE user_id = ${user.id}
          AND deleted_at IS NULL
          AND status != 'completed'
        ORDER BY created_at DESC
        LIMIT 20
      ` as typeof recentActionItems;
    } catch {
      // action_items might not exist
    }

    // Build context
    const today = new Date().toISOString().split("T")[0];

    const cardsContext = allCards
      .map(
        (c) =>
          `- [${c.id}] "${c.title}" | Column: ${c.columnTitle} | Priority: ${c.priority} | Due: ${c.dueDate || "none"} | Tags: ${c.tags?.map((t) => t.label).join(", ") || "none"}`,
      )
      .join("\n");

    const meetingsContext =
      recentMeetings.length > 0
        ? recentMeetings
            .map((m) => {
              const points = Array.isArray(m.content)
                ? m.content
                    .filter(
                      (c): c is { description: string } =>
                        typeof c === "object" && c !== null && "description" in c,
                    )
                    .map((c) => c.description)
                    .slice(0, 5)
                    .join("; ")
                : "";
              return `- "${m.meeting_title || "Untitled"}" (${m.meeting_start_date ? new Date(m.meeting_start_date).toLocaleDateString() : "?"}): ${points}`;
            })
            .join("\n")
        : "No recent meetings.";

    const emailsContext =
      recentEmails.length > 0
        ? recentEmails
            .map(
              (e) =>
                `- "${e.subject || "(no subject)"}" from ${e.sender || "unknown"} (${e.received_at ? new Date(e.received_at).toLocaleDateString() : "?"})`,
            )
            .join("\n")
        : "No recent emails.";

    const actionItemsContext =
      recentActionItems.length > 0
        ? recentActionItems
            .map(
              (a) =>
                `- "${a.title}" | Priority: ${a.priority} | Due: ${a.due_date || "none"} | Status: ${a.status}`,
            )
            .join("\n")
        : "No open action items.";

    const prompt = `You are a project management assistant. Analyze the Kanban board cards alongside recent meetings, emails, and action items to suggest priority changes and due dates.

Today's date: ${today}
Board: "${board.title}"

## Current Cards:
${cardsContext}

## Recent Meeting Key Points (last 2 weeks):
${meetingsContext}

## Recent Emails (last 2 weeks):
${emailsContext}

## Open Action Items:
${actionItemsContext}

## Instructions:
- Review each card and determine if its priority should change based on meeting discussions, email urgency, action item overlap, or approaching deadlines.
- Suggest due dates for cards that don't have one, based on context from meetings/emails.
- Only suggest changes where there is a clear reason. Do NOT suggest changes for every card.
- Priority levels are: "low", "medium", "high", "urgent".
- Provide a concise, specific reason for each suggestion referencing the context (e.g. "Discussed as urgent in 'Sprint Planning' meeting on 2/28").

Return a JSON array of suggestions. Each object:
{
  "cardId": "<card id>",
  "cardTitle": "<card title>",
  "currentPriority": "<current priority>",
  "suggestedPriority": "<suggested priority>",
  "suggestedDueDate": "<YYYY-MM-DD or null>",
  "reason": "<concise explanation>"
}

If no changes are warranted, return an empty array [].
Respond with ONLY valid JSON, no other text.`;

    const text = await chatCompletion(prompt, { maxTokens: 2000 });

    let suggestions: PrioritySuggestion[];
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      suggestions = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      console.error("Failed to parse priority review response:", text);
      return NextResponse.json({ suggestions: [] });
    }

    // Validate cardIds exist in the board
    const validCardIds = new Set(allCards.map((c) => c.id));
    suggestions = suggestions.filter((s) => validCardIds.has(s.cardId));

    return NextResponse.json({ suggestions });
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("Priority review error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
