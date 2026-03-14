import { NextRequest, NextResponse } from "next/server";
import { getRequiredAdmin } from "@/lib/auth/getRequiredAdmin";
import { db } from "@/lib/db";
import { supportKbSources } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { toggleSourceEnabled } from "@/lib/support/kb-ingest";

const patchSchema = z.object({
  enabled: z.boolean(),
});

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ sourceId: string }> }
) {
  await getRequiredAdmin();

  const { sourceId } = await params;

  await db
    .delete(supportKbSources)
    .where(eq(supportKbSources.id, sourceId));

  return NextResponse.json({ success: true });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sourceId: string }> }
) {
  await getRequiredAdmin();

  const { sourceId } = await params;

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

  await toggleSourceEnabled(sourceId, parsed.data.enabled);

  return NextResponse.json({ success: true });
}
