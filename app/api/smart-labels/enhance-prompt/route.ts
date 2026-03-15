import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { chatCompletion } from "@/lib/ai/client";

/**
 * POST /api/smart-labels/enhance-prompt
 * Takes a user-written matching prompt and uses AI to make it more
 * specific, comprehensive, and effective for classification.
 */
export async function POST(request: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { prompt: userPrompt, labelName } = body as {
      prompt?: string;
      labelName?: string;
    };

    if (!userPrompt?.trim()) {
      return NextResponse.json(
        { error: "prompt is required" },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an expert at writing matching rules for an AI email classification system. The user has written a draft matching prompt and wants you to improve it.

Your job is to make the prompt more specific, comprehensive, and effective while preserving the user's intent. You should:
- Add clarity about what types of emails should match
- Include relevant keywords, sender patterns, or subject patterns if implied
- Make it robust against edge cases (e.g. variations in phrasing)
- Keep it concise — 1-3 sentences max
- Keep the natural language style (no code or regex)

${labelName ? `The label is named "${labelName}".` : ""}

The user's current prompt:
"${userPrompt}"

Respond with ONLY a valid JSON object:
{ "prompt": "Your improved matching prompt here" }

Do not include markdown formatting, code fences, or any text outside the JSON.`;

    const result = await chatCompletion(systemPrompt, {
      maxTokens: 300,
      userId,
      triggerType: "prompt_enhance",
    });

    const cleaned = result
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json({ data: parsed });
  } catch (error) {
    console.error("Error enhancing prompt:", error);
    return NextResponse.json(
      { error: "Failed to enhance prompt" },
      { status: 500 }
    );
  }
}
