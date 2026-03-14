"use client";

import { useSubscription } from "@/lib/hooks/useSubscription";
import Link from "next/link";

export function TrialBanner() {
  const { status, trialEnd, loading } = useSubscription();

  if (loading || status !== "trialing" || !trialEnd) return null;

  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(trialEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  return (
    <div className="bg-blue-600 text-white text-center text-sm py-1.5 px-4">
      Free trial — {daysLeft} {daysLeft === 1 ? "day" : "days"} remaining.{" "}
      <Link href="/settings/billing" className="underline hover:text-blue-100">
        Manage billing
      </Link>
    </div>
  );
}
