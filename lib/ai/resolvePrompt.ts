import { db } from "@/lib/db";
import { customPrompts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { PROMPT_DEFAULTS } from "./prompts";

/**
 * Resolve the active prompt text for a given key and user.
 * Returns the user's custom prompt if one exists, otherwise the factory default.
 */
export async function resolvePrompt(
  promptKey: string,
  userId: string
): Promise<string> {
  const def = PROMPT_DEFAULTS[promptKey];
  if (!def) throw new Error(`Unknown prompt key: ${promptKey}`);

  try {
    const [row] = await db
      .select({ promptText: customPrompts.promptText })
      .from(customPrompts)
      .where(
        and(
          eq(customPrompts.userId, userId),
          eq(customPrompts.promptKey, promptKey)
        )
      )
      .limit(1);

    return row?.promptText ?? def.defaultText;
  } catch {
    // If DB query fails, fall back to default
    return def.defaultText;
  }
}
