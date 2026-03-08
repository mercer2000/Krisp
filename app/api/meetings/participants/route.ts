import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { getAllParticipants } from "@/lib/krisp/webhookKeyPoints";

export async function GET() {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const participants = await getAllParticipants(userId);
    return NextResponse.json({ participants });
  } catch (error) {
    console.error("Error fetching participants:", error);
    return NextResponse.json(
      { error: "Failed to fetch participants" },
      { status: 500 }
    );
  }
}
