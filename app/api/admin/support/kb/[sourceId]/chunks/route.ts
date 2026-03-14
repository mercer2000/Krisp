import { NextRequest, NextResponse } from "next/server";
import { getRequiredAdmin } from "@/lib/auth/getRequiredAdmin";
import { db } from "@/lib/db";
import { supportKbChunks } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sourceId: string }> }
) {
  await getRequiredAdmin();

  const { sourceId } = await params;

  const chunks = await db
    .select({
      id: supportKbChunks.id,
      content: supportKbChunks.content,
      enabled: supportKbChunks.enabled,
      createdAt: supportKbChunks.createdAt,
    })
    .from(supportKbChunks)
    .where(eq(supportKbChunks.sourceId, sourceId))
    .orderBy(asc(supportKbChunks.createdAt));

  return NextResponse.json({ chunks });
}
