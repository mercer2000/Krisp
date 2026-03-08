import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getPlanByPriceId, resolvePlanKey } from "@/lib/stripe-plans";

export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, session.user.id))
    .limit(1);

  if (!sub) {
    return NextResponse.json({ subscription: null });
  }

  const planInfo = getPlanByPriceId(sub.stripePriceId);
  const planKey = resolvePlanKey(sub.stripePriceId);

  return NextResponse.json({
    subscription: {
      planName: planInfo?.plan.name ?? "Unknown",
      planKey,
      status: sub.status,
      stripePriceId: sub.stripePriceId,
      currentPeriodEnd: sub.stripeCurrentPeriodEnd.toISOString(),
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      monthlyAmount: planInfo?.plan.monthlyPrice ?? 0,
    },
  });
}
