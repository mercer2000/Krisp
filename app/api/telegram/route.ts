import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { telegramBotTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  validateBotToken,
  setWebhook,
  deleteWebhook,
  getWebhookInfo,
} from "@/lib/telegram/client";
import crypto from "crypto";

/**
 * GET /api/telegram
 * Get the current Telegram bot configuration for the authenticated user.
 */
export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [record] = await db
      .select({
        id: telegramBotTokens.id,
        botToken: telegramBotTokens.botToken,
        botUsername: telegramBotTokens.botUsername,
        chatId: telegramBotTokens.chatId,
        active: telegramBotTokens.active,
        createdAt: telegramBotTokens.createdAt,
      })
      .from(telegramBotTokens)
      .where(eq(telegramBotTokens.userId, userId))
      .limit(1);

    if (!record) {
      return NextResponse.json({ connected: false });
    }

    // Fetch webhook info from Telegram for debugging
    const webhookInfo = await getWebhookInfo(record.botToken);

    return NextResponse.json({
      connected: true,
      botUsername: record.botUsername,
      chatId: record.chatId,
      active: record.active,
      createdAt: record.createdAt,
      webhook: webhookInfo
        ? {
            url: webhookInfo.url,
            pendingUpdates: webhookInfo.pending_update_count,
            lastError: webhookInfo.last_error_message,
            lastErrorDate: webhookInfo.last_error_date
              ? new Date(webhookInfo.last_error_date * 1000).toISOString()
              : null,
          }
        : null,
    });
  } catch (error) {
    console.error("Telegram status error:", error);
    return NextResponse.json(
      { error: "Failed to fetch status" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/telegram
 * Connect a Telegram bot to the user's account.
 * Body: { botToken: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { botToken } = body;

    if (!botToken || typeof botToken !== "string" || !botToken.trim()) {
      return NextResponse.json(
        { error: "Bot token is required" },
        { status: 400 }
      );
    }

    const trimmedToken = botToken.trim();

    // Validate the token with Telegram
    const validation = await validateBotToken(trimmedToken);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || "Invalid bot token" },
        { status: 400 }
      );
    }

    // Generate a webhook secret for this bot
    const webhookSecret = crypto.randomBytes(32).toString("hex");

    // Build the webhook URL
    const baseUrl =
      process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL;
    if (!baseUrl) {
      return NextResponse.json(
        { error: "Server URL not configured (NEXTAUTH_URL)" },
        { status: 500 }
      );
    }
    const webhookUrl = `${baseUrl.replace(/\/+$/, "")}/api/webhooks/telegram`;

    // Register webhook with Telegram
    const webhookResult = await setWebhook(
      trimmedToken,
      webhookUrl,
      webhookSecret
    );
    if (!webhookResult.ok) {
      return NextResponse.json(
        {
          error:
            webhookResult.error ||
            "Failed to register webhook with Telegram",
        },
        { status: 500 }
      );
    }

    // Check if user already has a bot configured
    const [existing] = await db
      .select({ id: telegramBotTokens.id })
      .from(telegramBotTokens)
      .where(eq(telegramBotTokens.userId, userId))
      .limit(1);

    if (existing) {
      // Update existing record
      await db
        .update(telegramBotTokens)
        .set({
          botToken: trimmedToken,
          botUsername: validation.username || null,
          webhookSecret,
          active: true,
          chatId: null, // Reset chat ID, will be set on first message
          activeSessionId: null, // Reset session, will be created on first message
          updatedAt: new Date(),
        })
        .where(eq(telegramBotTokens.id, existing.id));
    } else {
      // Create new record
      await db.insert(telegramBotTokens).values({
        userId,
        botToken: trimmedToken,
        botUsername: validation.username || null,
        webhookSecret,
        active: true,
      });
    }

    return NextResponse.json({
      success: true,
      botUsername: validation.username,
    });
  } catch (error) {
    console.error("Telegram setup error:", error);
    return NextResponse.json(
      { error: "Failed to set up Telegram bot" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/telegram
 * Disconnect the Telegram bot from the user's account.
 */
export async function DELETE() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [record] = await db
      .select({
        id: telegramBotTokens.id,
        botToken: telegramBotTokens.botToken,
      })
      .from(telegramBotTokens)
      .where(eq(telegramBotTokens.userId, userId))
      .limit(1);

    if (!record) {
      return NextResponse.json({ error: "No bot configured" }, { status: 404 });
    }

    // Remove webhook from Telegram
    await deleteWebhook(record.botToken);

    // Delete from database
    await db
      .delete(telegramBotTokens)
      .where(eq(telegramBotTokens.id, record.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Telegram disconnect error:", error);
    return NextResponse.json(
      { error: "Failed to disconnect Telegram bot" },
      { status: 500 }
    );
  }
}
