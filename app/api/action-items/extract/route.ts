import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { actionItems } from "@/lib/db/schema";
import { getMeetingById } from "@/lib/krisp/webhookKeyPoints";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

interface ExtractedActionItem {
  title: string;
  description: string;
  assignee: string | null;
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

    const meeting = await getMeetingById(meetingId, userId);
    if (!meeting) {
      return NextResponse.json(
        { error: "Meeting not found" },
        { status: 404 }
      );
    }

    // Build context from meeting data
    const speakerNames = (meeting.speakers as { first_name?: string; last_name?: string; index: number }[])
      .map((s) => [s.first_name, s.last_name].filter(Boolean).join(" ") || `Speaker ${s.index}`)
      .filter(Boolean);

    const contentArr = Array.isArray(meeting.content) ? meeting.content : [];
    const keyPoints = contentArr
      .filter((c) => typeof c === "object" && c !== null && "description" in c)
      .map((c) => (c as { description: string }).description);

    const transcript = meeting.raw_content || "";
    const today = new Date().toISOString().split("T")[0];

    const prompt = `Analyze this meeting and extract specific, actionable tasks that were discussed or assigned.

Meeting: "${meeting.meeting_title || "Untitled"}"
Date: ${meeting.meeting_start_date ? new Date(meeting.meeting_start_date).toLocaleDateString() : "Unknown"}
Participants: ${speakerNames.join(", ") || "Unknown"}

Key Points:
${keyPoints.map((kp: string, i: number) => `${i + 1}. ${kp}`).join("\n")}

Transcript (excerpt):
${transcript.slice(0, 8000)}

Today's date: ${today}

Extract action items as a JSON array. For each item include:
- "title": concise task title (max 100 chars)
- "description": detailed description of what needs to be done
- "assignee": name of the person responsible (from participants list, or null if unclear)
- "priority": "low", "medium", "high", or "urgent" based on context
- "dueDate": suggested due date as YYYY-MM-DD string (infer from context, or set 1 week from today if no deadline mentioned), or null

Only include clear, specific action items. Do not include vague discussion points.
Respond with ONLY a valid JSON array, no other text.`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Parse JSON from response (handle potential markdown wrapping)
    let extracted: ExtractedActionItem[];
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      extracted = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      console.error("Failed to parse AI response:", text);
      return NextResponse.json(
        { error: "Failed to parse AI-extracted action items" },
        { status: 500 }
      );
    }

    // Insert all extracted items
    const insertedItems = [];
    for (const item of extracted) {
      const [inserted] = await db
        .insert(actionItems)
        .values({
          userId,
          meetingId,
          title: item.title.slice(0, 500),
          description: item.description || null,
          assignee: item.assignee || null,
          priority: item.priority || "medium",
          dueDate: item.dueDate || null,
        })
        .returning();
      insertedItems.push(inserted);
    }

    return NextResponse.json({
      message: `Extracted ${insertedItems.length} action items`,
      actionItems: insertedItems,
    });
  } catch (error) {
    console.error("Error extracting action items:", error);
    return NextResponse.json(
      { error: "Failed to extract action items" },
      { status: 500 }
    );
  }
}
