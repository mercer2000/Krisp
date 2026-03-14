import { NextResponse } from "next/server";
import { getRequiredAdmin } from "@/lib/auth/getRequiredAdmin";
import { ping, getQueueCounts } from "@/lib/support/agent-presence";

export async function POST() {
  try {
    const admin = await getRequiredAdmin();

    await ping(admin.id);
    const { pendingCount, activeCount } = await getQueueCounts();

    return NextResponse.json({ ok: true, pendingCount, activeCount });
  } catch (error) {
    console.error("Error in ping:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
