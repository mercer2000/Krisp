import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { actionItems } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { chatCompletion } from "@/lib/ai/client";
import { resolvePrompt } from "@/lib/ai/resolvePrompt";
import { PROMPT_GENERATE_CARDS } from "@/lib/ai/prompts";

export interface GeneratedCard {
  actionItemId: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  dueDate: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { meetingId } = await request.json();
    if (!meetingId || typeof meetingId !== "number") {
      return NextResponse.json(
        { error: "meetingId is required and must be a number" },
        { status: 400 }
      );
    }

    // Fetch unlinked action items for this meeting
    const unlinkedItems = await db
      .select()
      .from(actionItems)
      .where(
        and(
          eq(actionItems.userId, userId),
          eq(actionItems.meetingId, meetingId),
          isNull(actionItems.cardId),
          isNull(actionItems.deletedAt)
        )
      );

    if (unlinkedItems.length === 0) {
      return NextResponse.json({
        cards: [],
        message: "No unlinked action items found",
      });
    }

    const today = new Date().toISOString().split("T")[0];
    const itemsSummary = unlinkedItems
      .map(
        (item, i) =>
          `${i + 1}. Title: "${item.title}"
   Description: ${item.description || "None"}
   Assignee: ${item.assignee || "Unassigned"}
   Priority: ${item.priority}
   Due: ${item.dueDate || "None"}`
      )
      .join("\n\n");

    const basePrompt = await resolvePrompt(PROMPT_GENERATE_CARDS, userId);
    const prompt = `${basePrompt}

Action Items:
${itemsSummary}

Today's date: ${today}`;

    const text = await chatCompletion(prompt, { maxTokens: 2000 });

    let parsed: Array<{
      index: number;
      title: string;
      description: string;
      priority: string;
      dueDate: string | null;
    }>;
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      console.error("Failed to parse AI card generation response:", text);
      return NextResponse.json(
        { error: "AI response could not be parsed" },
        { status: 500 }
      );
    }

    const validPriorities = ["low", "medium", "high", "urgent"];

    const cards: GeneratedCard[] = parsed
      .map((item) => {
        const actionItem = unlinkedItems[item.index - 1];
        if (!actionItem) return null;
        return {
          actionItemId: actionItem.id,
          title: (item.title || actionItem.title).slice(0, 255),
          description: item.description || actionItem.description || "",
          priority: validPriorities.includes(item.priority)
            ? (item.priority as GeneratedCard["priority"])
            : actionItem.priority,
          dueDate: item.dueDate || actionItem.dueDate || null,
        };
      })
      .filter((c): c is GeneratedCard => c !== null);

    return NextResponse.json({ cards });
  } catch (error) {
    console.error("Error generating cards:", error);
    return NextResponse.json(
      { error: "Failed to generate cards" },
      { status: 500 }
    );
  }
}
