import { NextRequest, NextResponse } from "next/server";
import { getRequiredAdmin } from "@/lib/auth/getRequiredAdmin";
import { goOnline } from "@/lib/support/agent-presence";

export async function POST(_request: NextRequest) {
  try {
    const admin = await getRequiredAdmin();

    await goOnline(admin.id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error going online:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
