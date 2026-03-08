import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { getMeetingAnalytics } from "@/lib/krisp/analytics";

export async function GET() {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const analytics = await getMeetingAnalytics(userId, 50);
    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
