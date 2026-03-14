import { NextResponse } from "next/server";
import { getWidgetConfig } from "@/lib/support/chat-engine";

/**
 * GET /api/support-chat/widget-config
 * Returns configuration for the support chat widget. No auth required (public endpoint).
 */
export async function GET() {
  try {
    const config = await getWidgetConfig();

    return NextResponse.json(config);
  } catch (error) {
    console.error("Error fetching widget config:", error);
    return NextResponse.json(
      { error: "Failed to fetch widget config" },
      { status: 500 }
    );
  }
}
