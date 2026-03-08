"use server";

import { stripe } from "@/lib/stripe";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { users, adminActionLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

async function requireAdmin() {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const [user] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (user?.role !== "admin") throw new Error("Forbidden");
  return session.user.id;
}

async function logAdminAction(
  adminUserId: string,
  action: string,
  details: Record<string, unknown>
) {
  await db.insert(adminActionLogs).values({
    adminUserId,
    action,
    details,
  });
}

export async function adminCancelSubscription(
  subscriptionId: string,
  immediate: boolean,
  reason: string
) {
  const adminId = await requireAdmin();

  if (immediate) {
    await stripe.subscriptions.cancel(subscriptionId);
  } else {
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
      metadata: { cancelReason: reason },
    });
  }

  await logAdminAction(adminId, "cancel_subscription", {
    subscriptionId,
    immediate,
    reason,
  });

  return { success: true };
}

export async function adminChangePlan(
  subscriptionId: string,
  newPriceId: string,
  prorate: boolean
) {
  const adminId = await requireAdmin();

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        price: newPriceId,
      },
    ],
    proration_behavior: prorate ? "create_prorations" : "none",
  });

  await logAdminAction(adminId, "change_plan", {
    subscriptionId,
    newPriceId,
    prorate,
  });

  return { success: true };
}

export async function adminIssueRefund(
  invoiceId: string,
  amount?: number
) {
  const adminId = await requireAdmin();

  // In Stripe SDK v20+, use the Invoice Payments API to find the payment intent
  const payments = await stripe.invoicePayments.list({
    invoice: invoiceId,
    limit: 1,
  });

  const payment = payments.data[0];
  if (!payment) {
    return { error: "No payment found for this invoice" };
  }

  // The payment object contains the payment reference
  const paymentIntentId =
    payment.payment && typeof payment.payment === "object" && "payment_intent" in payment.payment
      ? (payment.payment as { payment_intent: string }).payment_intent
      : null;

  if (!paymentIntentId) {
    return { error: "No payment intent found for this invoice payment" };
  }

  await stripe.refunds.create({
    payment_intent: paymentIntentId,
    ...(amount ? { amount } : {}),
  });

  await logAdminAction(adminId, "issue_refund", { invoiceId, amount });

  return { success: true };
}
