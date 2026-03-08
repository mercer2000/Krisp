import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { users, subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getPlanByPriceId } from "@/lib/stripe-plans";

export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check admin role
  const [adminUser] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (adminUser?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch all subscriptions with user info
  // Since RLS is on, we use the regular db (not auth db) for admin queries
  // Admin role check is done above; the query uses a join
  const allSubs = await db
    .select({
      id: subscriptions.id,
      userId: subscriptions.userId,
      stripeSubscriptionId: subscriptions.stripeSubscriptionId,
      stripePriceId: subscriptions.stripePriceId,
      status: subscriptions.status,
      stripeCurrentPeriodEnd: subscriptions.stripeCurrentPeriodEnd,
      cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
      userName: users.displayName,
      userEmail: users.email,
    })
    .from(subscriptions)
    .innerJoin(users, eq(subscriptions.userId, users.id));

  const rows = allSubs.map((sub) => {
    const planInfo = getPlanByPriceId(sub.stripePriceId);
    return {
      id: sub.id,
      userId: sub.userId,
      userName: sub.userName,
      userEmail: sub.userEmail,
      stripeSubscriptionId: sub.stripeSubscriptionId,
      planName: planInfo?.plan.name ?? "Unknown",
      status: sub.status,
      monthlyAmount: planInfo?.plan.monthlyPrice ?? 0,
      currentPeriodEnd: sub.stripeCurrentPeriodEnd.toISOString(),
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    };
  });

  // Calculate metrics
  const activeRows = rows.filter((r) => r.status === "active" || r.status === "trialing");
  const metrics = {
    totalMrr: activeRows.reduce((sum, r) => sum + r.monthlyAmount, 0),
    activeCount: activeRows.length,
    pastDueCount: rows.filter((r) => r.status === "past_due").length,
    canceledCount: rows.filter((r) => r.status === "canceled").length,
  };

  return NextResponse.json({ subscriptions: rows, metrics });
}
