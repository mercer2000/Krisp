import { NextResponse } from "next/server";
import { PLANS, PLAN_ORDER } from "@/lib/stripe-plans";

export async function GET() {
  const plans = PLAN_ORDER.map((key) => {
    const plan = PLANS[key];
    return {
      key,
      name: plan.name,
      description: plan.description,
      monthlyPrice: plan.monthlyPrice,
      monthlyPriceId: plan.monthlyPriceId || null,
      featureMatrix: plan.featureMatrix,
      highlighted: plan.highlighted ?? false,
    };
  });

  return NextResponse.json({ plans });
}
