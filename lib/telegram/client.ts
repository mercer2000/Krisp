/**
 * Telegram Bot API client helpers.
 * Uses the standard Bot API: https://core.telegram.org/bots/api
 */

const TELEGRAM_API = "https://api.telegram.org";

interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
}

interface TelegramGetMeResponse {
  ok: boolean;
  result: TelegramUser;
}

interface TelegramSetWebhookResponse {
  ok: boolean;
  result: boolean;
  description?: string;
}

interface TelegramSendMessageResponse {
  ok: boolean;
  result: { message_id: number };
}

/**
 * Validate a bot token by calling getMe.
 */
export async function validateBotToken(
  botToken: string
): Promise<{ valid: boolean; username?: string; error?: string }> {
  try {
    const res = await fetch(`${TELEGRAM_API}/bot${botToken}/getMe`);
    const data: TelegramGetMeResponse = await res.json();
    if (data.ok) {
      return { valid: true, username: data.result.username };
    }
    return { valid: false, error: "Invalid bot token" };
  } catch {
    return { valid: false, error: "Failed to connect to Telegram API" };
  }
}

/**
 * Register our webhook URL with Telegram for a given bot.
 */
export async function setWebhook(
  botToken: string,
  webhookUrl: string,
  secret: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${TELEGRAM_API}/bot${botToken}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: webhookUrl,
        secret_token: secret,
        allowed_updates: ["message"],
      }),
    });
    const data: TelegramSetWebhookResponse = await res.json();
    if (data.ok) {
      return { ok: true };
    }
    return { ok: false, error: data.description || "Failed to set webhook" };
  } catch {
    return { ok: false, error: "Failed to connect to Telegram API" };
  }
}

/**
 * Remove the webhook for a given bot.
 */
export async function deleteWebhook(
  botToken: string
): Promise<{ ok: boolean }> {
  try {
    const res = await fetch(
      `${TELEGRAM_API}/bot${botToken}/deleteWebhook`,
      { method: "POST" }
    );
    const data = await res.json();
    return { ok: data.ok };
  } catch {
    return { ok: false };
  }
}

/**
 * Send a text message to a Telegram chat.
 * Supports markdown formatting.
 */
export async function sendMessage(
  botToken: string,
  chatId: string | number,
  text: string,
  parseMode: "Markdown" | "HTML" | undefined = "Markdown"
): Promise<{ ok: boolean; messageId?: number }> {
  try {
    // Telegram Markdown has issues with certain characters, send as plain if too complex
    const res = await fetch(
      `${TELEGRAM_API}/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: parseMode,
        }),
      }
    );
    const data: TelegramSendMessageResponse = await res.json();
    if (data.ok) {
      return { ok: true, messageId: data.result.message_id };
    }
    // Retry without parse_mode if markdown fails
    if (parseMode) {
      return sendMessage(botToken, chatId, text, undefined);
    }
    return { ok: false };
  } catch {
    return { ok: false };
  }
}

/**
 * Send a "typing" action to indicate the bot is working.
 */
export async function sendTypingAction(
  botToken: string,
  chatId: string | number
): Promise<void> {
  try {
    await fetch(`${TELEGRAM_API}/bot${botToken}/sendChatAction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        action: "typing",
      }),
    });
  } catch {
    // Non-critical, ignore errors
  }
}
