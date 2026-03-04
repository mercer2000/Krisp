import OpenAI from "openai";

export const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

export const DEFAULT_MODEL =
  process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001";

/** Thrown when OpenRouter returns a 402 (token/credit limit exceeded). */
export class TokenLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TokenLimitError";
  }
}

export async function chatCompletion(
  prompt: string,
  options?: { maxTokens?: number; model?: string }
): Promise<string> {
  try {
    const response = await openrouter.chat.completions.create({
      model: options?.model ?? DEFAULT_MODEL,
      max_tokens: options?.maxTokens ?? 2000,
      messages: [{ role: "user", content: prompt }],
    });
    return response.choices[0]?.message?.content?.trim() ?? "";
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "status" in err &&
      (err as { status: number }).status === 402
    ) {
      throw new TokenLimitError(
        "AI credit limit reached. Please check your OpenRouter API key limits at https://openrouter.ai/settings/keys"
      );
    }
    throw err;
  }
}
