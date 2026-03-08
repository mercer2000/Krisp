import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { webhookSecrets } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

/**
 * GET /api/webhook-secret
 * Returns the user's Krisp webhook secret (masked), or null if none exists.
 */
export async function GET() {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [row] = await db
      .select()
      .from(webhookSecrets)
      .where(
        and(eq(webhookSecrets.userId, userId), eq(webhookSecrets.name, "Krisp"))
      );

    if (!row) {
      return NextResponse.json({ secret: null });
    }

    // Return masked secret (show first 8 and last 4 chars)
    const s = row.secret;
    const masked =
      s.length > 12
        ? s.slice(0, 8) + "..." + s.slice(-4)
        : s.slice(0, 4) + "...";

    return NextResponse.json({
      secret: masked,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  } catch (error) {
    console.error("Error fetching webhook secret:", error);
    return NextResponse.json(
      { error: "Failed to fetch webhook secret" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/webhook-secret
 * Saves the user-provided Krisp webhook secret. Replaces any existing one.
 */
export async function POST(request: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const secret = typeof body.secret === "string" ? body.secret.trim() : "";

    if (!secret) {
      return NextResponse.json(
        { error: "Secret is required" },
        { status: 400 }
      );
    }

    const [row] = await db
      .insert(webhookSecrets)
      .values({
        userId,
        name: "Krisp",
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
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  } catch (error) {
    console.error("Error saving webhook secret:", error);
    return NextResponse.json(
      { error: "Failed to save webhook secret" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/webhook-secret
 * Removes the user's Krisp webhook secret.
 */
export async function DELETE() {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await db
      .delete(webhookSecrets)
      .where(
        and(eq(webhookSecrets.userId, userId), eq(webhookSecrets.name, "Krisp"))
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting webhook secret:", error);
    return NextResponse.json(
      { error: "Failed to delete webhook secret" },
      { status: 500 }
    );
  }
}
