import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createUserKey, getUserKeyInfo, deleteUserKey } from "@/lib/openrouter/keys";
import { encrypt } from "@/lib/encryption";

/**
 * GET /api/v1/openrouter-key
 * Get the current user's OpenRouter key status (usage, limits, etc.)
 * Does NOT return the actual key — only metadata from OpenRouter.
 */
export async function GET() {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user] = await db
      .select({ openrouterKeyHash: users.openrouterKeyHash })
      .from(users)
      .where(eq(users.id, userId));

    if (!user?.openrouterKeyHash) {
      return NextResponse.json({ provisioned: false });
    }

    const info = await getUserKeyInfo(user.openrouterKeyHash);
    if (!info) {
      return NextResponse.json({ provisioned: false });
    }

    return NextResponse.json({
      provisioned: true,
      name: info.name,
      disabled: info.disabled,
      limit: info.limit,
      limitRemaining: info.limit_remaining,
      usage: info.usage,
      createdAt: info.created_at,
    });
  } catch (error) {
    console.error("OpenRouter key status error:", error);
    return NextResponse.json(
      { error: "Failed to fetch key status" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/openrouter-key
 * Provision a new OpenRouter key for the current user.
 * If the user already has one, deletes the old key first.
 */
export async function POST() {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.OPENROUTER_PROVISIONING_KEY) {
      return NextResponse.json(
        { error: "Key provisioning is not configured" },
        { status: 503 }
      );
    }

    // If user already has a key, delete the old one first
    const [user] = await db
      .select({
        openrouterKeyHash: users.openrouterKeyHash,
        displayName: users.displayName,
      })
      .from(users)
      .where(eq(users.id, userId));

    if (user?.openrouterKeyHash) {
      try {
        await deleteUserKey(user.openrouterKeyHash);
      } catch {
        // Old key may already be deleted — continue
      }
    }

    const { key, hash } = await createUserKey(userId, user?.displayName || "User");

    await db
      .update(users)
      .set({
        openrouterApiKey: encrypt(key),
        openrouterKeyHash: hash,
      })
      .where(eq(users.id, userId));

    return NextResponse.json({ provisioned: true }, { status: 201 });
  } catch (error) {
    console.error("OpenRouter key provisioning error:", error);
    return NextResponse.json(
      { error: "Failed to provision key" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/openrouter-key
 * Delete the current user's OpenRouter key. Falls back to global key.
 */
export async function DELETE() {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user] = await db
      .select({ openrouterKeyHash: users.openrouterKeyHash })
      .from(users)
      .where(eq(users.id, userId));

    if (user?.openrouterKeyHash) {
      try {
        await deleteUserKey(user.openrouterKeyHash);
      } catch {
        // Key may already be deleted on OpenRouter — continue cleanup
      }
    }

    await db
      .update(users)
      .set({
        openrouterApiKey: null,
        openrouterKeyHash: null,
      })
      .where(eq(users.id, userId));

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("OpenRouter key deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete key" },
      { status: 500 }
    );
  }
}
