import { db } from "@/lib/db";
import { subscriptions, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  hasFeatureAccess,
  resolvePlanKey,
  PLANS,
  type PlanKey,
  type PlanConfig,
} from "./stripe-plans";

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "incomplete";

const GRACE_PERIOD_DAYS = 3;

export interface UserSubscription {
  stripeSubscriptionId: string;
  stripePriceId: string;
  stripeCurrentPeriodEnd: Date;
  status: SubscriptionStatus;
  cancelAtPeriodEnd: boolean;
}

export interface UserPlanInfo {
  planKey: PlanKey;
  plan: PlanConfig;
  subscription: UserSubscription | null;
  isActive: boolean;
}

export function hasActiveAccess(subscription: UserSubscription | null): boolean {
  if (!subscription) return false;

  if (["active", "trialing"].includes(subscription.status)) {
    return new Date(subscription.stripeCurrentPeriodEnd) > new Date();
  }

  if (subscription.status === "past_due") {
    const gracePeriodEnd = new Date(subscription.stripeCurrentPeriodEnd);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + GRACE_PERIOD_DAYS);
    return new Date() < gracePeriodEnd;
  }

  return false;
}

export function hasAccess(
  subscription: UserSubscription | null,
  feature: string
): boolean {
  // Free-tier features are always accessible
  if (!subscription) {
    return hasFeatureAccess("", feature);
  }
  if (!hasActiveAccess(subscription)) {
    // Downgraded to free-tier features
    return hasFeatureAccess("", feature);
  }
  return hasFeatureAccess(subscription.stripePriceId, feature);
}

export async function getUserSubscription(
  userId: string
): Promise<UserSubscription | null> {
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  if (!sub) return null;

  return {
    stripeSubscriptionId: sub.stripeSubscriptionId,
    stripePriceId: sub.stripePriceId,
    stripeCurrentPeriodEnd: sub.stripeCurrentPeriodEnd,
    status: sub.status as SubscriptionStatus,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
  };
}

export async function getUserPlanInfo(userId: string): Promise<UserPlanInfo> {
  const subscription = await getUserSubscription(userId);
  const isActive = hasActiveAccess(subscription);
  const planKey = isActive
    ? resolvePlanKey(subscription?.stripePriceId ?? null)
    : "free";

  return {
    planKey,
    plan: PLANS[planKey],
    subscription,
    isActive: planKey !== "free" ? isActive : true,
  };
}

export async function getUserStripeCustomerId(
  userId: string
): Promise<string | null> {
  const [user] = await db
    .select({ stripeCustomerId: users.stripeCustomerId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user?.stripeCustomerId ?? null;
}
