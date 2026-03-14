import { NextRequest, NextResponse } from "next/server";
import { getRequiredAdmin } from "@/lib/auth/getRequiredAdmin";
import { db } from "@/lib/db";
import { supportKbChunks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { generateEmbedding } from "@/lib/support/kb-ingest";

const patchSchema = z.object({
  content: z.string().min(1).optional(),
  enabled: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sourceId: string; chunkId: string }> }
) {
  await getRequiredAdmin();

  const { sourceId, chunkId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = {};

  if (parsed.data.content !== undefined) {
    updates.content = parsed.data.content;
    // Re-generate embedding for the updated content
    const embedding = await generateEmbedding(parsed.data.content);
    updates.embedding = embedding;
  }

  if (parsed.data.enabled !== undefined) {
    updates.enabled = parsed.data.enabled;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  await db
    .update(supportKbChunks)
    .set(updates)
    .where(
      and(
        eq(supportKbChunks.id, chunkId),
        eq(supportKbChunks.sourceId, sourceId)
      )
    );

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ sourceId: string; chunkId: string }> }
) {
  await getRequiredAdmin();

  const { sourceId, chunkId } = await params;

  await db
    .delete(supportKbChunks)
    .where(
      and(
        eq(supportKbChunks.id, chunkId),
        eq(supportKbChunks.sourceId, sourceId)
      )
    );

  return NextResponse.json({ success: true });
}
