import { db } from "@/lib/db";
import { webhookLogs } from "@/lib/db/schema";

interface LogWebhookParams {
  source: string;
  tenantId?: string;
  status: string;
  method?: string;
  durationMs?: number;
  messageCount?: number;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Logs a webhook invocation to the webhook_logs table.
 * Fire-and-forget — errors are logged but don't propagate.
 */
export async function logWebhook(params: LogWebhookParams): Promise<void> {
  try {
    await db.insert(webhookLogs).values({
      source: params.source,
      tenantId: params.tenantId ?? null,
      status: params.status,
      method: params.method ?? null,
      durationMs: params.durationMs ?? null,
      messageCount: params.messageCount ?? null,
      errorMessage: params.errorMessage ?? null,
      metadata: params.metadata ?? null,
    });
  } catch (error) {
    console.error("[webhook-log] Failed to log webhook:", error);
  }
}
