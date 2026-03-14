import { db } from "@/lib/db";
import { supportAgentPresence } from "@/lib/db/schema";
import { eq, and, gt, lt, ne, asc, sql } from "drizzle-orm";

const STALE_TIMEOUT_MS = 90_000; // 90 seconds

/**
 * Go online — upsert presence row for the agent.
 */
export async function goOnline(userId: string): Promise<void> {
  await db
    .insert(supportAgentPresence)
    .values({
      userId,
      status: "online",
      lastPing: new Date(),
    })
    .onConflictDoUpdate({
      target: supportAgentPresence.userId,
      set: {
        status: "online",
        lastPing: new Date(),
      },
    });
}

/**
 * Go offline — set status to 'offline'.
 */
export async function goOffline(userId: string): Promise<void> {
  await db
    .update(supportAgentPresence)
    .set({ status: "offline" })
    .where(eq(supportAgentPresence.userId, userId));
}

/**
 * Heartbeat ping — update last_ping and cleanup stale agents.
 */
export async function ping(userId: string): Promise<void> {
  // Update this agent's last ping
  await db
    .update(supportAgentPresence)
    .set({ lastPing: new Date() })
    .where(eq(supportAgentPresence.userId, userId));

  // Cleanup stale agents (last_ping older than 90s)
  await cleanupStaleAgents();
}

/**
 * Mark agents as offline if their last ping is older than the stale timeout.
 */
async function cleanupStaleAgents(): Promise<void> {
  const staleThreshold = new Date(Date.now() - STALE_TIMEOUT_MS);
  await db
    .update(supportAgentPresence)
    .set({ status: "offline" })
    .where(
      and(
        ne(supportAgentPresence.status, "offline"),
        lt(supportAgentPresence.lastPing, staleThreshold)
      )
    );
}

/**
 * Check if any agents are currently online (pinged within 90s).
 */
export async function isAnyAgentOnline(): Promise<boolean> {
  const staleThreshold = new Date(Date.now() - STALE_TIMEOUT_MS);
  const rows = await db
    .select({ id: supportAgentPresence.id })
    .from(supportAgentPresence)
    .where(
      and(
        ne(supportAgentPresence.status, "offline"),
        gt(supportAgentPresence.lastPing, staleThreshold)
      )
    )
    .limit(1);

  return rows.length > 0;
}

/**
 * Get all online agents sorted by active_count (lowest first for load balancing).
 */
export async function getAvailableAgents() {
  const staleThreshold = new Date(Date.now() - STALE_TIMEOUT_MS);
  return db
    .select()
    .from(supportAgentPresence)
    .where(
      and(
        eq(supportAgentPresence.status, "online"),
        gt(supportAgentPresence.lastPing, staleThreshold)
      )
    )
    .orderBy(asc(supportAgentPresence.activeCount));
}

/**
 * Increment active conversation count for an agent.
 */
export async function incrementActiveCount(userId: string): Promise<void> {
  await db
    .update(supportAgentPresence)
    .set({
      activeCount: sql`${supportAgentPresence.activeCount} + 1`,
    })
    .where(eq(supportAgentPresence.userId, userId));
}

/**
 * Decrement active conversation count for an agent.
 */
export async function decrementActiveCount(userId: string): Promise<void> {
  await db
    .update(supportAgentPresence)
    .set({
      activeCount: sql`GREATEST(${supportAgentPresence.activeCount} - 1, 0)`,
    })
    .where(eq(supportAgentPresence.userId, userId));
}

/**
 * Get pending and active session counts (for ping response).
 */
export async function getQueueCounts(): Promise<{
  pendingCount: number;
  activeCount: number;
}> {
  const { supportChatSessions } = await import("@/lib/db/schema");

  const pendingRows = await db
    .select({ count: sql<number>`count(*)` })
    .from(supportChatSessions)
    .where(eq(supportChatSessions.status, "pending_agent"));

  const activeRows = await db
    .select({ count: sql<number>`count(*)` })
    .from(supportChatSessions)
    .where(eq(supportChatSessions.status, "agent_active"));

  return {
    pendingCount: Number(pendingRows[0]?.count ?? 0),
    activeCount: Number(activeRows[0]?.count ?? 0),
  };
}
