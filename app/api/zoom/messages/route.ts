import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { getRecentZoomMessages } from "@/lib/zoom/messages";

/**
 * GET /api/zoom/messages
 * Get recent Zoom chat messages for the authenticated user.
 *
 * Query params:
 * - limit: number (default 50, max 200)
 */
export async function GET(request: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limitParam = request.nextUrl.searchParams.get("limit");
    const limit = Math.min(
      Math.max(parseInt(limitParam || "50", 10) || 50, 1),
      200
    );

    const messages = await getRecentZoomMessages(userId, limit);

    return NextResponse.json({
      messages,
      count: messages.length,
    });
  } catch (error) {
    console.error("Error fetching Zoom messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch Zoom messages" },
      { status: 500 }
    );
  }
}
