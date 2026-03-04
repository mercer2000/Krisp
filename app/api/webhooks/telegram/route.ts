import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { telegramBotTokens, brainChatSessions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { processBrainChat } from "@/lib/brain/chat";
import { TokenLimitError } from "@/lib/ai/client";
import { sendMessage, sendTypingAction } from "@/lib/telegram/client";

// Allow up to 60 seconds for AI processing + Telegram send
export const maxDuration = 60;

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
        activeSessionId: telegramBotTokens.activeSessionId,
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
          "- _Any emails about the project deadline?_\n\n" +
          "*Commands:*\n" +
          "/new - Start a new conversation\n" +
          "/help - Show help"
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
          "/new - Start a new conversation (clears context)\n" +
          "/help - Show this help\n\n" +
          "Just type any question to search your Second Brain data. " +
          "The bot remembers your conversation context until you use /new."
      );
      return NextResponse.json({ ok: true });
    }

    // Handle /new command — start a fresh conversation
    if (messageText === "/new" || messageText.startsWith("/new ")) {
      const customTitle = messageText.slice(4).trim();
      const sessionTitle = customTitle || `Telegram Chat — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

      const [newSession] = await db
        .insert(brainChatSessions)
        .values({ userId, title: sessionTitle })
        .returning();

      await db
        .update(telegramBotTokens)
        .set({ activeSessionId: newSession.id, updatedAt: new Date() })
        .where(eq(telegramBotTokens.id, botRecord.id));

      await sendMessage(
        botToken,
        chatId,
        `New conversation started: *${sessionTitle}*\n\nAsk me anything!`
      );
      return NextResponse.json({ ok: true });
    }

    // Show typing indicator
    await sendTypingAction(botToken, chatId);

    // Get or create the active session
    let sessionId = botRecord.activeSessionId;

    if (sessionId) {
      // Verify the session still exists
      const [existing] = await db
        .select({ id: brainChatSessions.id })
        .from(brainChatSessions)
        .where(eq(brainChatSessions.id, sessionId))
        .limit(1);
      if (!existing) {
        sessionId = null;
      }
    }

    if (!sessionId) {
      // Create a default session
      const [newSession] = await db
        .insert(brainChatSessions)
        .values({ userId, title: "Telegram Chat" })
        .returning();
      sessionId = newSession.id;

      await db
        .update(telegramBotTokens)
        .set({ activeSessionId: sessionId, updatedAt: new Date() })
        .where(eq(telegramBotTokens.id, botRecord.id));
    }

    // Process through Brain AI
    try {
      const result = await processBrainChat(userId, messageText, sessionId);

      // Send the AI response back to Telegram (split if > 4096 chars)
      const sendResult = await sendLongMessage(botToken, chatId, result.answer);
      if (!sendResult) {
        console.error("Telegram send failed for chat", chatId, "- answer length:", result.answer.length);
      }
    } catch (aiError) {
      if (aiError instanceof TokenLimitError) {
        await sendMessage(
          botToken,
          chatId,
          "Sorry, the AI service credit limit has been reached. Please contact the administrator or try again later.",
          undefined
        );
      } else {
        console.error("Telegram webhook processing error:", aiError);
        await sendMessage(
          botToken,
          chatId,
          "Sorry, something went wrong processing your message. Please try again.",
          undefined
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    // Always return 200 to Telegram to prevent retries
    return NextResponse.json({ ok: true });
  }
}

/**
 * Split long messages into chunks that fit Telegram's 4096-char limit.
 * Returns true if all chunks sent successfully.
 */
async function sendLongMessage(
  botToken: string,
  chatId: string,
  text: string
): Promise<boolean> {
  const MAX_CHUNK = 4096;
  if (text.length <= MAX_CHUNK) {
    const result = await sendMessage(botToken, chatId, text);
    if (!result.ok) {
      console.error("Telegram sendMessage failed for chat", chatId);
    }
    return result.ok;
  }
  // Split on newlines when possible
  let remaining = text;
  let allOk = true;
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
    const result = await sendMessage(botToken, chatId, chunk);
    if (!result.ok) {
      console.error("Telegram sendMessage chunk failed for chat", chatId);
      allOk = false;
    }
  }
  return allOk;
}
