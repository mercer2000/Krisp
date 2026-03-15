import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { chatCompletion } from "@/lib/ai/client";

/**
 * POST /api/settings/prompts/enhance
 * Takes a system prompt and uses AI to improve its clarity, specificity,
 * and effectiveness while preserving intent.
 */
export async function POST(request: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { text, name, description } = body as {
      text?: string;
      name?: string;
      description?: string;
    };

    if (!text?.trim()) {
      return NextResponse.json(
        { error: "text is required" },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an expert prompt engineer. The user has a system prompt used to instruct an AI assistant, and they want you to improve it.

The prompt is named "${name || "Unknown"}"${description ? ` and is described as: "${description}"` : ""}.

Your job is to enhance the prompt to be:
- Clearer and more specific in its instructions
- Better structured with logical flow
- More robust against edge cases
- Concise — remove redundancy without losing meaning
- Effective at eliciting the desired AI behavior

Preserve the original intent and all key instructions. Do not add features or behaviors the original prompt doesn't cover. Do not wrap in markdown or code fences.

Here is the current prompt to enhance:

---
${text}
---

Respond with ONLY the improved prompt text. No explanation, no preamble, no wrapping.`;

    const result = await chatCompletion(systemPrompt, {
      maxTokens: 4000,
      userId,
      triggerType: "prompt_enhance",
    });

    return NextResponse.json({ text: result.trim() });
  } catch (error) {
    console.error("Error enhancing prompt:", error);
    return NextResponse.json(
      { error: "Failed to enhance prompt" },
      { status: 500 }
    );
  }
}
