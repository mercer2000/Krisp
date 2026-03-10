import { NextRequest, NextResponse } from "next/server";
import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { chatCompletion, TokenLimitError } from "@/lib/ai/client";

// POST /api/pages/generate-smart-rule
// Takes a user description and generates a clarified smart rule prompt
export async function POST(request: NextRequest) {
  try {
    const user = await getRequiredUser();
    const { description } = (await request.json()) as { description?: string };

    if (!description || description.trim().length === 0) {
      return NextResponse.json(
        { error: "description is required" },
        { status: 400 },
      );
    }

    const prompt = `You are helping a user set up a smart rule for a page in their knowledge management app. Smart rules automatically classify and collect emails, meeting transcripts, and other content onto the page.

The user described what this page is about:
"${description.trim()}"

Based on their description, write a clear, specific smart rule prompt that an AI classifier can use to determine whether a piece of content (email, meeting transcript, decision, etc.) belongs on this page.

The rule should:
- Be specific enough to avoid false positives
- Be broad enough to catch relevant content
- Use clear, actionable language
- Be written as an instruction to a classifier (e.g., "Match emails and meetings about...")

Return ONLY the smart rule text, nothing else. No quotes, no explanation, no preamble.`;

    const smartRule = await chatCompletion(prompt, {
      maxTokens: 300,
      userId: user.id,
    });

    return NextResponse.json({ smartRule });
  } catch (error) {
    if (error instanceof TokenLimitError) {
      return NextResponse.json({ error: error.message }, { status: 402 });
    }
    if (error instanceof Response) throw error;
    console.error("Error generating smart rule:", error);
    return NextResponse.json(
      { error: "Failed to generate smart rule" },
      { status: 500 },
    );
  }
}
