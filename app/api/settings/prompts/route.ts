import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { customPrompts, customPromptHistory } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { PROMPT_DEFAULTS } from "@/lib/ai/prompts";

/**
 * GET /api/settings/prompts
 * Returns all prompt definitions with current active values.
 */
export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all user customizations
    const userPrompts = await db
      .select()
      .from(customPrompts)
      .where(eq(customPrompts.userId, userId));

    const customMap = new Map(
      userPrompts.map((p) => [p.promptKey, p])
    );

    // Build the response merging defaults with user overrides
    const prompts = Object.values(PROMPT_DEFAULTS).map((def) => {
      const custom = customMap.get(def.key);
      return {
        key: def.key,
        name: def.name,
        description: def.description,
        category: def.category,
        defaultText: def.defaultText,
        activeText: custom?.promptText ?? def.defaultText,
        isCustom: !!custom,
        version: custom?.version ?? 0,
        updatedAt: custom?.updatedAt?.toISOString() ?? null,
      };
    });

    return NextResponse.json({ prompts });
  } catch (error) {
    console.error("Error fetching prompts:", error);
    return NextResponse.json(
      { error: "Failed to fetch prompts" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/settings/prompts
 * Save a custom prompt. Body: { key, text }
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { key, text } = await request.json();

    if (!key || typeof key !== "string" || !PROMPT_DEFAULTS[key]) {
      return NextResponse.json(
        { error: "Invalid prompt key" },
        { status: 400 }
      );
    }

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Prompt text cannot be empty" },
        { status: 400 }
      );
    }

    const trimmed = text.trim();
    const now = new Date();

    // Check if a custom prompt already exists
    const [existing] = await db
      .select()
      .from(customPrompts)
      .where(
        and(
          eq(customPrompts.userId, userId),
          eq(customPrompts.promptKey, key)
        )
      )
      .limit(1);

    let newVersion: number;

    if (existing) {
      newVersion = existing.version + 1;

      // Save current version to history before overwriting
      await db.insert(customPromptHistory).values({
        userId,
        promptKey: key,
        promptText: existing.promptText,
        version: existing.version,
        createdAt: existing.updatedAt,
      });

      // Update the active prompt
      await db
        .update(customPrompts)
        .set({
          promptText: trimmed,
          version: newVersion,
          updatedAt: now,
        })
        .where(
          and(
            eq(customPrompts.userId, userId),
            eq(customPrompts.promptKey, key)
          )
        );
    } else {
      newVersion = 1;

      // Insert new custom prompt
      await db.insert(customPrompts).values({
        userId,
        promptKey: key,
        promptText: trimmed,
        version: 1,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Prune history to keep only last 5 versions
    const history = await db
      .select({ id: customPromptHistory.id })
      .from(customPromptHistory)
      .where(
        and(
          eq(customPromptHistory.userId, userId),
          eq(customPromptHistory.promptKey, key)
        )
      )
      .orderBy(desc(customPromptHistory.version));

    if (history.length > 5) {
      const idsToDelete = history.slice(5).map((h) => h.id);
      for (const id of idsToDelete) {
        await db
          .delete(customPromptHistory)
          .where(eq(customPromptHistory.id, id));
      }
    }

    return NextResponse.json({
      key,
      version: newVersion,
      updatedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("Error saving prompt:", error);
    return NextResponse.json(
      { error: "Failed to save prompt" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/settings/prompts
 * Reset a prompt to default. Body: { key }
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { key } = await request.json();

    if (!key || typeof key !== "string" || !PROMPT_DEFAULTS[key]) {
      return NextResponse.json(
        { error: "Invalid prompt key" },
        { status: 400 }
      );
    }

    // Delete the custom prompt (this resets to factory default)
    await db
      .delete(customPrompts)
      .where(
        and(
          eq(customPrompts.userId, userId),
          eq(customPrompts.promptKey, key)
        )
      );

    // Also clear history for this prompt
    await db
      .delete(customPromptHistory)
      .where(
        and(
          eq(customPromptHistory.userId, userId),
          eq(customPromptHistory.promptKey, key)
        )
      );

    return NextResponse.json({ key, reset: true });
  } catch (error) {
    console.error("Error resetting prompt:", error);
    return NextResponse.json(
      { error: "Failed to reset prompt" },
      { status: 500 }
    );
  }
}
