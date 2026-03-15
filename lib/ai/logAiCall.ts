import { db } from "@/lib/db";
import { aiLogs } from "@/lib/db/schema";
import { encrypt } from "@/lib/encryption";

interface LogAiCallParams {
  userId: string;
  triggerType: string;
  promptKey?: string;
  model: string;
  prompt: string;
  response: string;
  entityType?: string;
  entityId?: string;
  durationMs?: number;
}

/**
 * Log an AI call to the database with encrypted prompt/response.
 * Fire-and-forget — errors are logged but don't propagate.
 */
export async function logAiCall(params: LogAiCallParams): Promise<void> {
  try {
    const encryptedPrompt = encrypt(params.prompt);
    const encryptedResponse = encrypt(params.response);
    const tokenEstimate = Math.ceil(
      (params.prompt.length + params.response.length) / 4
    );

    await db.insert(aiLogs).values({
      userId: params.userId,
      triggerType: params.triggerType,
      promptKey: params.promptKey ?? null,
      model: params.model,
      prompt: encryptedPrompt,
      response: encryptedResponse,
      entityType: params.entityType ?? null,
      entityId: params.entityId ?? null,
      durationMs: params.durationMs ?? null,
      tokenEstimate,
    });
  } catch (error) {
    console.error("[ai-log] Failed to log AI call:", error);
  }
}
