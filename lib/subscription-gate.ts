import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { getUserPlanInfo } from "@/lib/access";
import { getFeaturesForPlan, getRequiredPlanForFeature, PLANS, type PlanKey } from "@/lib/stripe-plans";

/**
 * API route feature gate — returns a 403 response if the user's plan
 * doesn't include the required feature.
 *
 * Usage in a route handler:
 *   const gate = await requireFeature("brain_chat");
 *   if (gate) return gate; // 403 response
 */
export async function requireFeature(
  feature: string
): Promise<NextResponse | null> {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const planInfo = await getUserPlanInfo(session.user.id);
  const features = getFeaturesForPlan(planInfo.planKey);

  if (!features.includes(feature)) {
    const requiredPlan = getRequiredPlanForFeature(feature);
    return NextResponse.json(
      {
        error: "Feature not available on your current plan",
        requiredPlan,
        requiredPlanName: PLANS[requiredPlan].name,
        currentPlan: planInfo.planKey,
        currentPlanName: planInfo.plan.name,
      },
      { status: 403 }
    );
  }

  return null;
}

/**
 * API route plan gate — returns a 403 response if the user's plan
 * is below the minimum required tier.
 */
export async function requirePlan(
  minimumPlan: PlanKey
): Promise<NextResponse | null> {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const planInfo = await getUserPlanInfo(session.user.id);
  const planOrder: PlanKey[] = ["free", "standard", "pro"];
  const currentIndex = planOrder.indexOf(planInfo.planKey);
  const requiredIndex = planOrder.indexOf(minimumPlan);

  if (currentIndex < requiredIndex) {
    return NextResponse.json(
      {
        error: "Upgrade required",
        requiredPlan: minimumPlan,
        requiredPlanName: PLANS[minimumPlan].name,
        currentPlan: planInfo.planKey,
        currentPlanName: planInfo.plan.name,
      },
      { status: 403 }
    );
  }

  return null;
}
