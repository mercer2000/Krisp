import { db } from "@/lib/db";
import { activityEvents } from "@/lib/db/schema";

type ActivityEventType = typeof activityEvents.$inferInsert.eventType;

interface LogActivityParams {
  userId: string;
  eventType: ActivityEventType;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  entityType?: string;
  entityId?: string;
}

/**
 * Logs an activity event to the activity feed.
 * Fire-and-forget — errors are logged but don't propagate.
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    await db.insert(activityEvents).values({
      userId: params.userId,
      eventType: params.eventType,
      title: params.title,
      description: params.description ?? null,
      metadata: params.metadata ?? null,
      entityType: params.entityType ?? null,
      entityId: params.entityId ?? null,
    });
  } catch (error) {
    console.error("[activity-feed] Failed to log activity:", error);
  }
}
