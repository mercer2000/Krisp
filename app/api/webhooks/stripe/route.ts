import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import {
  subscriptions,
  stripeWebhookEvents,
  users,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import { getPlanByPriceId } from "@/lib/stripe-plans";
import {
  sendSubscriptionConfirmedEmail,
  sendPaymentFailedEmail,
  sendSubscriptionCanceledEmail,
  sendTrialEndingSoonEmail,
  sendInvoicePaidEmail,
} from "@/lib/billing-emails";

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Idempotency check
  const [existing] = await db
    .select()
    .from(stripeWebhookEvents)
    .where(eq(stripeWebhookEvents.stripeEventId, event.id))
    .limit(1);

  if (existing) {
    return NextResponse.json({ received: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;
      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        );
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;
      case "customer.subscription.trial_will_end":
        await handleTrialWillEnd(
          event.data.object as Stripe.Subscription
        );
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error(`Error processing ${event.type}:`, err);
    // Still return 200 to prevent Stripe retries for application errors
  }

  // Mark event as processed
  await db.insert(stripeWebhookEvents).values({
    stripeEventId: event.id,
    eventType: event.type,
  });

  return NextResponse.json({ received: true });
}

/** Get the subscription's current period end from its latest invoice or items */
async function getSubscriptionPeriodEnd(sub: Stripe.Subscription): Promise<Date> {
  // Try getting period from the subscription items
  if (sub.items.data.length > 0) {
    const item = sub.items.data[0];
    if (item && "current_period" in item) {
      const period = (item as Record<string, unknown>).current_period as { end: number } | undefined;
      if (period?.end) {
        return new Date(period.end * 1000);
      }
    }
  }

  // Fall back: retrieve the latest invoice period_end
  if (sub.latest_invoice) {
    const invoiceId = typeof sub.latest_invoice === "string"
      ? sub.latest_invoice
      : sub.latest_invoice.id;
    const invoice = await stripe.invoices.retrieve(invoiceId);
    if (invoice.period_end) {
      return new Date(invoice.period_end * 1000);
    }
  }

  // Final fallback: 30 days from now
  const fallback = new Date();
  fallback.setDate(fallback.getDate() + 30);
  return fallback;
}

/** Get subscription ID from an invoice's parent subscription_details */
function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  if (invoice.parent?.subscription_details?.subscription) {
    const sub = invoice.parent.subscription_details.subscription;
    return typeof sub === "string" ? sub : sub.id;
  }
  return null;
}

/** Look up user email by Stripe subscription ID */
async function getUserEmailBySubscriptionId(stripeSubId: string): Promise<string | null> {
  const [sub] = await db
    .select({ userId: subscriptions.userId })
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubId))
    .limit(1);

  if (!sub) return null;

  const [user] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, sub.userId))
    .limit(1);

  return user?.email ?? null;
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (!session.subscription || !session.customer) return;

  const stripeSubId = typeof session.subscription === "string"
    ? session.subscription
    : session.subscription.id;

  const subscription = await stripe.subscriptions.retrieve(stripeSubId);

  const userId = subscription.metadata.userId;
  if (!userId) {
    console.error("No userId in subscription metadata");
    return;
  }

  const customerId = typeof session.customer === "string"
    ? session.customer
    : session.customer.id;

  // Link Stripe customer ID to user
  await db
    .update(users)
    .set({ stripeCustomerId: customerId })
    .where(eq(users.id, userId));

  const periodEnd = await getSubscriptionPeriodEnd(subscription);
  const priceId = subscription.items.data[0].price.id;

  // Create or update subscription record
  const [existingSub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  const subData = {
    stripeSubscriptionId: subscription.id,
    stripePriceId: priceId,
    stripeCurrentPeriodEnd: periodEnd,
    status: "active" as const,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    updatedAt: new Date(),
  };

  if (existingSub) {
    await db
      .update(subscriptions)
      .set(subData)
      .where(eq(subscriptions.userId, userId));
  } else {
    await db.insert(subscriptions).values({
      userId,
      ...subData,
    });
  }

  // Send confirmation email
  const [user] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (user?.email) {
    const planInfo = getPlanByPriceId(priceId);
    if (planInfo) {
      await sendSubscriptionConfirmedEmail(
        user.email,
        planInfo.plan.name,
        planInfo.plan.features,
        periodEnd
      );
    }
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subId = getInvoiceSubscriptionId(invoice);
  if (!subId) return;

  const subscription = await stripe.subscriptions.retrieve(subId);
  const periodEnd = await getSubscriptionPeriodEnd(subscription);

  await db
    .update(subscriptions)
    .set({
      status: "active",
      stripePriceId: subscription.items.data[0].price.id,
      stripeCurrentPeriodEnd: periodEnd,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeSubscriptionId, subId));

  // Send receipt email
  const email = await getUserEmailBySubscriptionId(subId);
  if (email && invoice.amount_paid) {
    const periodStart = invoice.period_start
      ? new Date(invoice.period_start * 1000)
      : new Date();
    const periodEndDate = invoice.period_end
      ? new Date(invoice.period_end * 1000)
      : periodEnd;

    await sendInvoicePaidEmail(
      email,
      invoice.amount_paid,
      periodStart,
      periodEndDate,
      invoice.invoice_pdf ?? null
    );
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subId = getInvoiceSubscriptionId(invoice);
  if (!subId) return;

  await db
    .update(subscriptions)
    .set({
      status: "past_due",
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeSubscriptionId, subId));

  // Send payment failed email
  const email = await getUserEmailBySubscriptionId(subId);
  if (email) {
    await sendPaymentFailedEmail(email, invoice.amount_due ?? 0);
  }
}

async function handleSubscriptionUpdated(sub: Stripe.Subscription) {
  const statusMap: Record<string, string> = {
    active: "active",
    trialing: "trialing",
    past_due: "past_due",
    canceled: "canceled",
    unpaid: "unpaid",
    incomplete: "incomplete",
    incomplete_expired: "incomplete",
    paused: "canceled",
  };

  const periodEnd = await getSubscriptionPeriodEnd(sub);

  await db
    .update(subscriptions)
    .set({
      stripePriceId: sub.items.data[0].price.id,
      stripeCurrentPeriodEnd: periodEnd,
      status: (statusMap[sub.status] ?? "incomplete") as "active",
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeSubscriptionId, sub.id));
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  await db
    .update(subscriptions)
    .set({
      status: "canceled",
      cancelAtPeriodEnd: false,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeSubscriptionId, sub.id));

  // Send cancellation email
  const email = await getUserEmailBySubscriptionId(sub.id);
  if (email) {
    const periodEnd = await getSubscriptionPeriodEnd(sub);
    await sendSubscriptionCanceledEmail(email, periodEnd);
  }
}

async function handleTrialWillEnd(sub: Stripe.Subscription) {
  const email = await getUserEmailBySubscriptionId(sub.id);
  if (!email) return;

  const trialEnd = sub.trial_end
    ? new Date(sub.trial_end * 1000)
    : new Date();
  const daysRemaining = Math.max(
    0,
    Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  await sendTrialEndingSoonEmail(email, daysRemaining);
}
