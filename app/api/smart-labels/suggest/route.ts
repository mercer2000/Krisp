import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { chatCompletion } from "@/lib/ai/client";

/**
 * POST /api/smart-labels/suggest
 * Given email context, uses AI to suggest a smart label name and matching prompt.
 */
export async function POST(request: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { sender, subject, preview, labelName } = body as {
      sender?: string;
      subject?: string;
      preview?: string;
      labelName?: string;
    };

    if (!sender && !subject && !preview) {
      return NextResponse.json(
        { error: "At least one of sender, subject, or preview is required" },
        { status: 400 }
      );
    }

    const prompt = `You are a smart email label assistant. Based on the following email context, suggest a matching rule (prompt) for a smart label${labelName ? ` named "${labelName}"` : ""}.

The prompt should be a natural language rule that describes what kinds of emails should match this label. It should be specific enough to be useful but general enough to match similar emails.

Email context:
- Sender: ${sender || "Unknown"}
- Subject: ${subject || "None"}
- Preview: ${preview || "None"}

${labelName ? `The user wants to create a label called "${labelName}". Write a matching rule that would categorize emails like this one under that label.` : "Also suggest a short, descriptive label name (1-3 words)."}

Respond with ONLY a valid JSON object:
{
  ${labelName ? "" : '"name": "Suggested Label Name",\n  '}"prompt": "Natural language matching rule for this label"
}

Examples of good prompts:
- "Emails from newsletters and marketing subscriptions"
- "Messages from FISD that contain school-related updates"
- "Emails that require a follow-up action or response"
- "Messages about project deadlines and due dates"
- "Emails from team members requesting approvals"

Keep the prompt concise (1-2 sentences) and focused.
Respond with ONLY valid JSON, no markdown.`;

    const result = await chatCompletion(prompt, {
      maxTokens: 300,
      userId,
      triggerType: "smart_label_suggest",
    });

    // Parse the JSON response
    const cleaned = result.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const suggestion = JSON.parse(cleaned);

    return NextResponse.json({ data: suggestion });
  } catch (error) {
    console.error("Error suggesting smart label:", error);
    return NextResponse.json(
      { error: "Failed to generate suggestion" },
      { status: 500 }
    );
  }
}
