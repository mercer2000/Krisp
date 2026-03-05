import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { webhookSecrets } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { randomBytes } from "crypto";

/**
 * GET /api/integrations/zapier/secret
 * Returns the user's Zapier webhook secret (masked), or null if none exists.
 */
export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [row] = await db
      .select()
      .from(webhookSecrets)
      .where(
        and(
          eq(webhookSecrets.userId, userId),
          eq(webhookSecrets.name, "Zapier")
        )
      );

    if (!row) {
      return NextResponse.json({ secret: null, webhookUrl: buildWebhookUrl(userId) });
    }

    const s = row.secret;
    const masked =
      s.length > 12
        ? s.slice(0, 8) + "..." + s.slice(-4)
        : s.slice(0, 4) + "...";

    return NextResponse.json({
      secret: masked,
      webhookUrl: buildWebhookUrl(userId),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  } catch (error) {
    console.error("Error fetching Zapier secret:", error);
    return NextResponse.json(
      { error: "Failed to fetch Zapier webhook secret" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/integrations/zapier/secret
 * Generate a new Zapier webhook secret. Replaces any existing one.
 */
export async function POST() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const secret = `zk_${randomBytes(32).toString("hex")}`;

    const [row] = await db
      .insert(webhookSecrets)
      .values({
        userId,
        name: "Zapier",
        secret,
      })
      .onConflictDoUpdate({
        target: [webhookSecrets.userId, webhookSecrets.name],
        set: {
          secret,
          updatedAt: sql`NOW()`,
        },
      })
      .returning();

    return NextResponse.json({
      secret,
      webhookUrl: buildWebhookUrl(userId),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  } catch (error) {
    console.error("Error generating Zapier secret:", error);
    return NextResponse.json(
      { error: "Failed to generate Zapier webhook secret" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/integrations/zapier/secret
 * Removes the user's Zapier webhook secret.
 */
export async function DELETE() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await db
      .delete(webhookSecrets)
      .where(
        and(
          eq(webhookSecrets.userId, userId),
          eq(webhookSecrets.name, "Zapier")
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting Zapier secret:", error);
    return NextResponse.json(
      { error: "Failed to delete Zapier webhook secret" },
      { status: 500 }
    );
  }
}

function buildWebhookUrl(userId: string): string {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "";
  return `${baseUrl}/api/integrations/zapier/ingest?user_id=${userId}`;
}
