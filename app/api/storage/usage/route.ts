import { NextResponse } from "next/server";
import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { db } from "@/lib/db";
import { uploads } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getRequiredUser();

    const [result] = await db
      .select({
        totalBytes: sql<number>`coalesce(sum(${uploads.sizeBytes}), 0)`,
        fileCount: sql<number>`count(*)`,
      })
      .from(uploads)
      .where(eq(uploads.tenantId, user.id));

    return NextResponse.json({
      totalBytes: Number(result.totalBytes),
      fileCount: Number(result.fileCount),
      totalMB:
        Math.round((Number(result.totalBytes) / 1024 / 1024) * 100) / 100,
    });
  } catch (error) {
    console.error("Storage usage error:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage" },
      { status: 500 }
    );
  }
}
