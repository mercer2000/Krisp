import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getRecentWebhookKeyPoints } from "@/lib/krisp/webhookKeyPoints";

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const meetings = await getRecentWebhookKeyPoints(userId, 50);
    return NextResponse.json({ meetings });
  } catch (error) {
    console.error("Error fetching meetings:", error);
    return NextResponse.json(
      { error: "Failed to fetch meetings" },
      { status: 500 }
    );
  }
}
