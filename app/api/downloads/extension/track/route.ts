import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { extensionDownloads } from "@/lib/db/schema";
import { EXTENSION_CONFIG } from "@/lib/extension/config";

/**
 * POST /api/downloads/extension/track
 * Logs an extension download event for adoption analytics.
 */
export async function POST() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await db.insert(extensionDownloads).values({
      userId,
      version: EXTENSION_CONFIG.version,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to track extension download:", error);
    return NextResponse.json({ error: "Failed to track download" }, { status: 500 });
  }
}
