import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  telegramBotTokens,
  brainChatSessions,
  brainChatMessages,
  webhookKeyPoints,
  emails,
  decisions,
  actionItems,
} from "@/lib/db/schema";
import { eq, and, desc, isNull } from "drizzle-orm";
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
          "/new — Start a new conversation\n" +
          "/summary — Summarize this conversation\n" +
          "/search — Search your data\n" +
          "/meetings /emails /tasks /decisions — Quick lookups\n" +
          "/help — Show all commands"
      );
      return NextResponse.json({ ok: true });
    }

    // Handle /help command
    if (messageText === "/help") {
      await sendMessage(
        botToken,
        chatId,
        "*Brain Bot Commands*\n\n" +
          "/new — Start a new conversation\n" +
          "/clear — Same as /new (clears context)\n" +
          "/summary — Summarize this conversation\n" +
          "/search _query_ — Search across all your data\n" +
          "/meetings — List recent meetings\n" +
          "/emails — List recent emails\n" +
          "/tasks — List action items\n" +
          "/decisions — List recent decisions\n" +
          "/help — Show this help\n\n" +
          "Or just type any question to chat with your Second Brain."
      );
      return NextResponse.json({ ok: true });
    }

    // Handle /clear command — alias for /new
    if (messageText === "/clear") {
      const sessionTitle = `Telegram Chat — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

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
        `Context cleared. New conversation started: *${sessionTitle}*`
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

    // Handle /summary command — summarize current conversation
    if (messageText === "/summary") {
      const sessionId = botRecord.activeSessionId;
      if (!sessionId) {
        await sendMessage(botToken, chatId, "No active conversation to summarize. Start chatting first!");
        return NextResponse.json({ ok: true });
      }

      const messages = await db
        .select({ role: brainChatMessages.role, content: brainChatMessages.content })
        .from(brainChatMessages)
        .where(eq(brainChatMessages.sessionId, sessionId))
        .orderBy(brainChatMessages.createdAt);

      if (messages.length === 0) {
        await sendMessage(botToken, chatId, "This conversation is empty. Start chatting first!");
        return NextResponse.json({ ok: true });
      }

      // Send as a Brain AI query so it uses context
      await sendTypingAction(botToken, chatId);
      try {
        const result = await processBrainChat(userId, "Summarize our conversation so far in a few bullet points.", sessionId);
        await sendLongMessage(botToken, chatId, result.answer);
      } catch (err) {
        console.error("Telegram /summary error:", err);
        await sendMessage(botToken, chatId, "Sorry, couldn't generate a summary right now.", undefined);
      }
      return NextResponse.json({ ok: true });
    }

    // Handle /search command — search across all brain data
    if (messageText === "/search" || messageText.startsWith("/search ")) {
      const query = messageText.slice(7).trim();
      if (!query) {
        await sendMessage(botToken, chatId, "Usage: /search _your query_\n\nExample: /search project deadline");
        return NextResponse.json({ ok: true });
      }

      await sendTypingAction(botToken, chatId);
      // Get or create session for search context
      let sessionId = botRecord.activeSessionId;
      if (!sessionId) {
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

      try {
        const result = await processBrainChat(
          userId,
          `Search my data for: "${query}". List all relevant meetings, emails, decisions, and action items that match. Be specific with dates and details.`,
          sessionId
        );
        await sendLongMessage(botToken, chatId, result.answer);
      } catch (err) {
        console.error("Telegram /search error:", err);
        await sendMessage(botToken, chatId, "Sorry, search failed. Please try again.", undefined);
      }
      return NextResponse.json({ ok: true });
    }

    // Handle /meetings command — list recent meetings
    if (messageText === "/meetings") {
      const meetings = await db
        .select({
          meetingTitle: webhookKeyPoints.meetingTitle,
          meetingStartDate: webhookKeyPoints.meetingStartDate,
          speakers: webhookKeyPoints.speakers,
        })
        .from(webhookKeyPoints)
        .where(and(eq(webhookKeyPoints.userId, userId), isNull(webhookKeyPoints.deletedAt)))
        .orderBy(desc(webhookKeyPoints.meetingStartDate))
        .limit(10);

      if (meetings.length === 0) {
        await sendMessage(botToken, chatId, "No meetings recorded yet.");
        return NextResponse.json({ ok: true });
      }

      const lines = meetings.map((m, i) => {
        const date = m.meetingStartDate
          ? new Date(m.meetingStartDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
          : "Unknown date";
        const speakers = Array.isArray(m.speakers)
          ? (m.speakers as Array<{ first_name?: string; last_name?: string }>)
              .map((s) => `${s.first_name || ""} ${s.last_name || ""}`.trim())
              .filter(Boolean)
              .join(", ")
          : "";
        return `${i + 1}. *${m.meetingTitle || "Untitled"}* — ${date}${speakers ? `\n    _${speakers}_` : ""}`;
      });

      await sendLongMessage(botToken, chatId, `*Recent Meetings (${meetings.length})*\n\n${lines.join("\n\n")}`);
      return NextResponse.json({ ok: true });
    }

    // Handle /emails command — list recent emails
    if (messageText === "/emails") {
      const userEmails = await db
        .select({
          subject: emails.subject,
          sender: emails.sender,
          receivedAt: emails.receivedAt,
        })
        .from(emails)
        .where(and(eq(emails.tenantId, userId), isNull(emails.deletedAt)))
        .orderBy(desc(emails.receivedAt))
        .limit(10);

      if (userEmails.length === 0) {
        await sendMessage(botToken, chatId, "No emails recorded yet.");
        return NextResponse.json({ ok: true });
      }

      const lines = userEmails.map((e, i) => {
        const date = e.receivedAt
          ? new Date(e.receivedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
          : "Unknown date";
        return `${i + 1}. *${e.subject || "(no subject)"}*\n    From: ${e.sender || "Unknown"} — ${date}`;
      });

      await sendLongMessage(botToken, chatId, `*Recent Emails (${userEmails.length})*\n\n${lines.join("\n\n")}`);
      return NextResponse.json({ ok: true });
    }

    // Handle /tasks command — list action items
    if (messageText === "/tasks") {
      const userTasks = await db
        .select({
          title: actionItems.title,
          status: actionItems.status,
          priority: actionItems.priority,
          assignee: actionItems.assignee,
          dueDate: actionItems.dueDate,
        })
        .from(actionItems)
        .where(and(eq(actionItems.userId, userId), isNull(actionItems.deletedAt)))
        .orderBy(desc(actionItems.createdAt))
        .limit(15);

      if (userTasks.length === 0) {
        await sendMessage(botToken, chatId, "No action items recorded yet.");
        return NextResponse.json({ ok: true });
      }

      const statusIcon = (s: string | null) => {
        if (s === "completed" || s === "done") return "\u2705";
        if (s === "in_progress" || s === "in-progress") return "\ud83d\udfe1";
        return "\u26aa";
      };

      const lines = userTasks.map((t, i) => {
        const due = t.dueDate ? ` — due ${t.dueDate}` : "";
        const assignee = t.assignee ? ` _(${t.assignee})_` : "";
        const priority = t.priority && t.priority !== "medium" ? ` [${t.priority}]` : "";
        return `${statusIcon(t.status)} *${t.title || "Untitled"}*${priority}${assignee}${due}`;
      });

      await sendLongMessage(botToken, chatId, `*Action Items (${userTasks.length})*\n\n${lines.join("\n")}`);
      return NextResponse.json({ ok: true });
    }

    // Handle /decisions command — list recent decisions
    if (messageText === "/decisions") {
      const userDecisions = await db
        .select({
          statement: decisions.statement,
          status: decisions.status,
          category: decisions.category,
          createdAt: decisions.createdAt,
        })
        .from(decisions)
        .where(and(eq(decisions.userId, userId), isNull(decisions.deletedAt)))
        .orderBy(desc(decisions.createdAt))
        .limit(10);

      if (userDecisions.length === 0) {
        await sendMessage(botToken, chatId, "No decisions recorded yet.");
        return NextResponse.json({ ok: true });
      }

      const lines = userDecisions.map((d, i) => {
        const date = d.createdAt
          ? new Date(d.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
          : "";
        const cat = d.category ? ` [${d.category}]` : "";
        const status = d.status && d.status !== "active" ? ` _(${d.status})_` : "";
        return `${i + 1}. *${d.statement || "Untitled"}*${cat}${status}${date ? ` — ${date}` : ""}`;
      });

      await sendLongMessage(botToken, chatId, `*Recent Decisions (${userDecisions.length})*\n\n${lines.join("\n\n")}`);
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
