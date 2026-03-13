import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { db } from "@/lib/db";
import { uploads } from "@/lib/db/schema";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

export async function POST(request: NextRequest) {
  try {
    const user = await getRequiredUser();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const source = (formData.get("source") as string) || "page_block";
    const sourceId = (formData.get("sourceId") as string) || null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "File type not allowed. Accepted: PNG, JPEG, GIF, WebP, SVG." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    // Upload to Vercel Blob
    const blob = await put(
      `uploads/${user.id}/${Date.now()}-${file.name}`,
      file,
      { access: "public", contentType: file.type }
    );

    // Track in database
    const [upload] = await db
      .insert(uploads)
      .values({
        tenantId: user.id,
        filename: file.name,
        contentType: file.type,
        sizeBytes: file.size,
        blobUrl: blob.url,
        source,
        sourceId,
      })
      .returning();

    return NextResponse.json({ url: blob.url, id: upload.id });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
