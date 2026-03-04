import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { telegramBotTokens, brainChatSessions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { processBrainChat } from "@/lib/brain/chat";
import { sendMessage, sendTypingAction } from "@/lib/telegram/client";

/**
 * Telegram webhook update types (subset we care about).
 */
interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      type: "private" | "group" | "supergroup" | "channel";
    };
    date: number;
    text?: string;
  };
}

const TELEGRAM_SESSION_TITLE = "Telegram Chat";
const MAX_MESSAGE_LENGTH = 4000;

/**
 * POST /api/webhooks/telegram
 *
 * Receives incoming messages from Telegram Bot API.
 * Telegram sends a secret_token header for verification.
 */
export async function POST(request: NextRequest) {
  try {
    const body: TelegramUpdate = await request.json();

    // Only process text messages in private chats
    if (!body.message?.text || body.message.chat.type !== "private") {
      return NextResponse.json({ ok: true });
    }

    const chatId = String(body.message.chat.id);
    const messageText = body.message.text.trim().slice(0, MAX_MESSAGE_LENGTH);

    // Telegram sends X-Telegram-Bot-Api-Secret-Token header
    const secretHeader = request.headers.get(
      "x-telegram-bot-api-secret-token"
    );

    if (!secretHeader) {
      return NextResponse.json({ error: "Missing secret" }, { status: 403 });
    }

    // Look up the bot token record by webhook secret
    const [botRecord] = await db
      .select({
        id: telegramBotTokens.id,
        userId: telegramBotTokens.userId,
        botToken: telegramBotTokens.botToken,
        chatId: telegramBotTokens.chatId,
        webhookSecret: telegramBotTokens.webhookSecret,
      })
      .from(telegramBotTokens)
      .where(
        and(
          eq(telegramBotTokens.webhookSecret, secretHeader),
          eq(telegramBotTokens.active, true)
        )
      )
      .limit(1);

    if (!botRecord) {
      return NextResponse.json(
        { error: "Invalid secret" },
        { status: 403 }
      );
    }

    const userId = botRecord.userId;
    const botToken = botRecord.botToken;

    // Link chat on first message; reject messages from other Telegram users
    if (!botRecord.chatId) {
      await db
        .update(telegramBotTokens)
        .set({ chatId, updatedAt: new Date() })
        .where(eq(telegramBotTokens.id, botRecord.id));
    } else if (botRecord.chatId !== chatId) {
      await sendMessage(
        botToken,
        chatId,
        "This bot is already linked to another account.",
        undefined
      );
      return NextResponse.json({ ok: true });
    }

    // Handle /start command
    if (messageText === "/start") {
      await sendMessage(
        botToken,
        chatId,
        "Welcome to your *Second Brain* bot!\n\n" +
          "Send me any question and I'll search your meetings, emails, decisions, and action items to find the answer.\n\n" +
          "Try asking:\n" +
          "- _What were the key decisions from my last meeting?_\n" +
          "- _Summarize my open action items_\n" +
          "- _Any emails about the project deadline?_"
      );
      return NextResponse.json({ ok: true });
    }

    // Handle /help command
    if (messageText === "/help") {
      await sendMessage(
        botToken,
        chatId,
        "*Brain Bot Commands*\n\n" +
          "/start - Welcome message\n" +
          "/help - Show this help\n\n" +
          "Just type any question to search your Second Brain data."
      );
      return NextResponse.json({ ok: true });
    }

    // Show typing indicator
    await sendTypingAction(botToken, chatId);

    // Find or create a dedicated Telegram session for this user
    let sessionId: string | null = null;
    const existingSession = await db
      .select({ id: brainChatSessions.id })
      .from(brainChatSessions)
      .where(
        and(
          eq(brainChatSessions.userId, userId),
          eq(brainChatSessions.title, TELEGRAM_SESSION_TITLE)
        )
      )
      .limit(1);

    if (existingSession.length > 0) {
      sessionId = existingSession[0].id;
    }

    // Process through Brain AI
    const result = await processBrainChat(userId, messageText, sessionId);

    // Send the AI response back to Telegram (split if > 4096 chars)
    await sendLongMessage(botToken, chatId, result.answer);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    // Always return 200 to Telegram to prevent retries
    return NextResponse.json({ ok: true });
  }
}

/**
 * Split long messages into chunks that fit Telegram's 4096-char limit.
 */
async function sendLongMessage(
  botToken: string,
  chatId: string,
  text: string
): Promise<void> {
  const MAX_CHUNK = 4096;
  if (text.length <= MAX_CHUNK) {
    await sendMessage(botToken, chatId, text);
    return;
  }
  // Split on newlines when possible
  let remaining = text;
  while (remaining.length > 0) {
    let chunk: string;
    if (remaining.length <= MAX_CHUNK) {
      chunk = remaining;
      remaining = "";
    } else {
      const splitAt = remaining.lastIndexOf("\n", MAX_CHUNK);
      const cutPoint = splitAt > MAX_CHUNK / 2 ? splitAt : MAX_CHUNK;
      chunk = remaining.slice(0, cutPoint);
      remaining = remaining.slice(cutPoint).trimStart();
    }
    await sendMessage(botToken, chatId, chunk);
  }
}
