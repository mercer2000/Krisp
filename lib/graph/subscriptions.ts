import { db } from "@/lib/db";
import { graphSubscriptions } from "@/lib/db/schema";
import { eq, and, lt } from "drizzle-orm";

export interface GraphSubscriptionInsert {
  tenantId: string;
  subscriptionId: string;
  resource: string;
  changeType: string;
  clientState: string;
  expirationDateTime: Date;
  notificationUrl: string;
}

/**
 * Store a new Graph subscription record.
 */
export async function createGraphSubscription(data: GraphSubscriptionInsert) {
  const [result] = await db
    .insert(graphSubscriptions)
    .values({
      tenantId: data.tenantId,
      subscriptionId: data.subscriptionId,
      resource: data.resource,
      changeType: data.changeType,
      clientState: data.clientState,
      expirationDateTime: data.expirationDateTime,
      notificationUrl: data.notificationUrl,
    })
    .returning();

  return result;
}

/**
 * Get all active subscriptions for a tenant.
 */
export async function getActiveSubscriptions(tenantId: string) {
  return db
    .select()
    .from(graphSubscriptions)
    .where(
      and(
        eq(graphSubscriptions.tenantId, tenantId),
        eq(graphSubscriptions.active, true)
      )
    );
}

/**
 * Get subscriptions expiring before a given date (for renewal).
 */
export async function getExpiringSubscriptions(beforeDate: Date) {
  return db
    .select()
    .from(graphSubscriptions)
    .where(
      and(
        eq(graphSubscriptions.active, true),
        lt(graphSubscriptions.expirationDateTime, beforeDate)
      )
    );
}

/**
 * Update a subscription's expiration date (after renewal).
 */
export async function renewSubscription(
  subscriptionId: string,
  newExpiration: Date
) {
  const [result] = await db
    .update(graphSubscriptions)
    .set({
      expirationDateTime: newExpiration,
      updatedAt: new Date(),
    })
    .where(eq(graphSubscriptions.subscriptionId, subscriptionId))
    .returning();

  return result;
}

/**
 * Deactivate a subscription (e.g., when it's deleted or expired).
 */
export async function deactivateSubscription(subscriptionId: string) {
  const [result] = await db
    .update(graphSubscriptions)
    .set({
      active: false,
      updatedAt: new Date(),
    })
    .where(eq(graphSubscriptions.subscriptionId, subscriptionId))
    .returning();

  return result;
}
