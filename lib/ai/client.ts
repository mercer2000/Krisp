import OpenAI from "openai";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { decrypt, isEncrypted } from "@/lib/encryption";
import { logAiCall } from "./logAiCall";

export const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

export const DEFAULT_MODEL =
  process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash-lite";

/** Thrown when OpenRouter returns a 402 (token/credit limit exceeded). */
export class TokenLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TokenLimitError";
  }
}

/**
 * Get the OpenRouter API key for a specific user.
 * Falls back to the global OPENROUTER_API_KEY if the user has no provisioned key.
 */
export async function getUserApiKey(userId: string): Promise<string> {
  try {
    const [user] = await db
      .select({ openrouterApiKey: users.openrouterApiKey })
      .from(users)
      .where(eq(users.id, userId));

    if (user?.openrouterApiKey) {
      const key = isEncrypted(user.openrouterApiKey)
        ? decrypt(user.openrouterApiKey)
        : user.openrouterApiKey;
      return key;
    }
  } catch (err) {
    console.error("Failed to fetch user API key, falling back to global:", err);
  }

  return process.env.OPENROUTER_API_KEY || "";
}

/**
 * Get an OpenAI client configured with a specific API key.
 */
function getClientForKey(apiKey: string): OpenAI {
  if (apiKey === process.env.OPENROUTER_API_KEY) {
    return openrouter;
  }
  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
  });
}

export async function chatCompletion(
  prompt: string,
  options?: {
    maxTokens?: number;
    model?: string;
    userId?: string;
    triggerType?: string;
    promptKey?: string;
    entityType?: string;
    entityId?: string;
  }
): Promise<string> {
  const startTime = Date.now();
  try {
    const apiKey = options?.userId
      ? await getUserApiKey(options.userId)
      : process.env.OPENROUTER_API_KEY || "";

    const client = getClientForKey(apiKey);
    const model = options?.model ?? DEFAULT_MODEL;

    const response = await client.chat.completions.create({
      model,
      max_tokens: options?.maxTokens ?? 2000,
      messages: [{ role: "user", content: prompt }],
    });
    const result = response.choices[0]?.message?.content?.trim() ?? "";

    // Log AI call (fire-and-forget)
    if (options?.userId && options?.triggerType) {
      logAiCall({
        userId: options.userId,
        triggerType: options.triggerType,
        promptKey: options.promptKey,
        model,
        prompt,
        response: result,
        entityType: options.entityType,
        entityId: options.entityId,
        durationMs: Date.now() - startTime,
      });
    }

    return result;
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
