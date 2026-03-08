"use server";

import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";

export async function createCheckoutSession(priceId: string) {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Get user info
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    redirect("/login");
  }

  // Create or retrieve the Stripe customer
  let stripeCustomerId = user.stripeCustomerId;
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.displayName,
      metadata: { userId: user.id },
    });
    stripeCustomerId = customer.id;
    await db
      .update(users)
      .set({ stripeCustomerId })
      .where(eq(users.id, userId));
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/cancel`,
    subscription_data: {
      metadata: { userId: user.id },
    },
  });

  if (checkoutSession.url) {
    redirect(checkoutSession.url);
  }
}
