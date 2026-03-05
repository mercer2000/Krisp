import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { readFile } from "fs/promises";
import { join } from "path";
import { EXTENSION_CONFIG } from "@/lib/extension/config";

/**
 * GET /api/downloads/extension
 * Serves the extension ZIP file. Protected by auth — only logged-in users can download.
 */
export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const zipPath = join(process.cwd(), "public", "downloads", EXTENSION_CONFIG.fileName);

    let fileBuffer: Buffer;
    try {
      fileBuffer = await readFile(zipPath);
    } catch {
      return NextResponse.json(
        { error: "Extension file not found. Please contact support." },
        { status: 404 }
      );
    }

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${EXTENSION_CONFIG.fileName}"`,
        "Content-Length": String(fileBuffer.length),
      },
    });
  } catch (error) {
    console.error("Failed to serve extension download:", error);
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
