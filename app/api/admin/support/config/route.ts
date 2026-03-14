import { NextRequest, NextResponse } from "next/server";
import { getRequiredAdmin } from "@/lib/auth/getRequiredAdmin";
import { db } from "@/lib/db";
import { supportWidgetConfig } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const putSchema = z.object({
  config: z.record(z.string(), z.unknown()).optional(),
  masterPrompt: z.string().optional(),
});

export async function GET() {
  await getRequiredAdmin();

  const rows = await db.select().from(supportWidgetConfig).limit(1);

  if (rows.length === 0) {
    // Create default config if none exists
    const [created] = await db
      .insert(supportWidgetConfig)
      .values({})
      .returning();
    return NextResponse.json(created);
  }

  return NextResponse.json(rows[0]);
}

export async function PUT(request: NextRequest) {
  await getRequiredAdmin();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = putSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { config, masterPrompt } = parsed.data;

  // Get or create the config row
  const existing = await db.select().from(supportWidgetConfig).limit(1);

  if (existing.length === 0) {
    await db.insert(supportWidgetConfig).values({
      ...(config !== undefined ? { config } : {}),
      ...(masterPrompt !== undefined ? { masterPrompt } : {}),
    });
  } else {
    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    if (config !== undefined) updates.config = config;
    if (masterPrompt !== undefined) updates.masterPrompt = masterPrompt;

    await db
      .update(supportWidgetConfig)
      .set(updates)
      .where(eq(supportWidgetConfig.id, existing[0].id));
  }

  return NextResponse.json({ success: true });
}
