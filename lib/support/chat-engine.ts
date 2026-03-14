import OpenAI from "openai";
import { neon } from "@neondatabase/serverless";
import { db } from "@/lib/db";
import {
  supportWidgetConfig,
  supportKbChunks,
  supportChatSessions,
  supportChatMessages,
} from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

// ── Types ────────────────────────────────────────────

export interface WidgetConfig {
  agentName: string;
  agentRole: string;
  avatarUrl: string;
  welcomeMessage: string;
  starterButtons: Array<{ label: string; message: string }>;
  primaryColor: string;
  iconStyle: "modern" | "classic";
  bubbleSize: "small" | "medium" | "large";
  position: "bottom-right" | "bottom-left";
  zIndex: number;
}

const DEFAULT_WIDGET_CONFIG: WidgetConfig = {
  agentName: "Brain",
  agentRole: "AI Support Specialist",
  avatarUrl: "",
  welcomeMessage:
    "Hi! I'm Brain, your MyOpenBrain support assistant. How can I help you today?",
  starterButtons: [
    { label: "What is MyOpenBrain?", message: "What is MyOpenBrain?" },
    { label: "Pricing plans", message: "What pricing plans are available?" },
    { label: "How do I get started?", message: "How do I get started with MyOpenBrain?" },
  ],
  primaryColor: "#6366f1",
  iconStyle: "modern",
  bubbleSize: "medium",
  position: "bottom-right",
  zIndex: 9999,
};

const SIMILARITY_THRESHOLD = 0.3;

// ── Clients ──────────────────────────────────────────

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

// ── getWidgetConfig ──────────────────────────────────

/**
 * Get the single-row widget config. Creates a default row if none exists.
 */
export async function getWidgetConfig(): Promise<WidgetConfig> {
  const rows = await db.select().from(supportWidgetConfig).limit(1);

  if (rows.length > 0) {
    return (rows[0].config as WidgetConfig) ?? DEFAULT_WIDGET_CONFIG;
  }

  // No config row exists — create a default one
  const [inserted] = await db
    .insert(supportWidgetConfig)
    .values({
      config: DEFAULT_WIDGET_CONFIG,
    })
    .returning();

  return (inserted.config as WidgetConfig) ?? DEFAULT_WIDGET_CONFIG;
}

// ── getMasterPrompt ──────────────────────────────────

/**
 * Get the master prompt from the widget config row.
 */
export async function getMasterPrompt(): Promise<string> {
  const rows = await db
    .select({ masterPrompt: supportWidgetConfig.masterPrompt })
    .from(supportWidgetConfig)
    .limit(1);

  if (rows.length > 0) {
    return rows[0].masterPrompt;
  }

  // Ensure a default row exists and return its master prompt
  const [inserted] = await db
    .insert(supportWidgetConfig)
    .values({
      config: DEFAULT_WIDGET_CONFIG,
    })
    .returning({ masterPrompt: supportWidgetConfig.masterPrompt });

  return inserted.masterPrompt;
}

// ── createSession ────────────────────────────────────

/**
 * Create a support chat session and return the session ID.
 */
export async function createSession(
  metadata?: { pageUrl?: string; userAgent?: string; referrer?: string }
): Promise<string> {
  // Get the widget config ID to link the session
  const configRows = await db
    .select({ id: supportWidgetConfig.id })
    .from(supportWidgetConfig)
    .limit(1);

  const widgetConfigId = configRows.length > 0 ? configRows[0].id : null;

  const [session] = await db
    .insert(supportChatSessions)
    .values({
      widgetConfigId,
      metadata: metadata ?? null,
    })
    .returning({ id: supportChatSessions.id });

  return session.id;
}

// ── handleSupportMessage ─────────────────────────────

/**
 * Main RAG flow: embed the user message, retrieve relevant KB chunks,
 * construct a prompt with context, call Claude, and persist everything.
 */
export async function handleSupportMessage(
  sessionId: string,
  userMessage: string
): Promise<{ response: string; sessionId: string }> {
  // a. Validate session exists and check status
  const sessionRows = await db
    .select({
      id: supportChatSessions.id,
      status: supportChatSessions.status,
    })
    .from(supportChatSessions)
    .where(eq(supportChatSessions.id, sessionId))
    .limit(1);

  if (sessionRows.length === 0) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  // If session is in agent_active state, save user message only (no RAG/AI)
  if (sessionRows[0].status === "agent_active") {
    await db.insert(supportChatMessages).values({
      sessionId,
      role: "user",
      content: userMessage,
    });
    await db
      .update(supportChatSessions)
      .set({ updatedAt: new Date() })
      .where(eq(supportChatSessions.id, sessionId));
    return { response: "", sessionId };
  }

  // b. Save user message
  await db.insert(supportChatMessages).values({
    sessionId,
    role: "user",
    content: userMessage,
  });

  // c. Generate embedding for the user message
  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: userMessage,
  });

  const embedding = embeddingResponse.data[0].embedding;
  const embeddingStr = `[${embedding.join(",")}]`;

  // d. Run pgvector cosine similarity search (top K=5)
  const sql = neon(process.env.DATABASE_URL!);

  const chunks = await sql`
    SELECT id, content, source_url, source_label,
      1 - (embedding <=> ${embeddingStr}::vector) as similarity
    FROM support_kb_chunks
    WHERE enabled = true
      AND embedding IS NOT NULL
    ORDER BY embedding <=> ${embeddingStr}::vector
    LIMIT 5
  `;

  // Filter chunks above similarity threshold
  const relevantChunks = chunks.filter(
    (chunk) => Number(chunk.similarity) >= SIMILARITY_THRESHOLD
  );

  // e. Get master prompt
  const masterPrompt = await getMasterPrompt();

  // f. Construct the user content with context blocks
  let userContent: string;

  if (relevantChunks.length > 0) {
    const contextBlocks = relevantChunks
      .map((chunk, i) => {
        const source = chunk.source_label || chunk.source_url || "Knowledge Base";
        return `[${i + 1}] (Source: ${source}, Similarity: ${Number(chunk.similarity).toFixed(3)})\n${chunk.content}`;
      })
      .join("\n\n");

    userContent = `Context from knowledge base:\n${contextBlocks}\n\nUser question: ${userMessage}`;
  } else {
    userContent = userMessage;
  }

  // g. Call Claude via OpenRouter
  let responseText: string;

  try {
    const completion = await openrouter.chat.completions.create({
      model: "anthropic/claude-sonnet-4",
      max_tokens: 1500,
      messages: [
        { role: "system", content: masterPrompt },
        { role: "user", content: userContent },
      ],
    });

    responseText =
      completion.choices[0]?.message?.content?.trim() ??
      "I'm sorry, I wasn't able to generate a response. Please try again.";
  } catch (error) {
    console.error("Support chat Claude API error:", error);
    responseText =
      "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment.";
  }

  // h. Save assistant response
  await db.insert(supportChatMessages).values({
    sessionId,
    role: "assistant",
    content: responseText,
  });

  // i. Update session timestamp
  await db
    .update(supportChatSessions)
    .set({ updatedAt: new Date() })
    .where(eq(supportChatSessions.id, sessionId));

  return { response: responseText, sessionId };
}

// ── getSessionMessages ───────────────────────────────

/**
 * Get all messages for a session, ordered chronologically.
 */
export async function getSessionMessages(
  sessionId: string
): Promise<Array<{ id: string; role: string; content: string; createdAt: Date }>> {
  const messages = await db
    .select({
      id: supportChatMessages.id,
      role: supportChatMessages.role,
      content: supportChatMessages.content,
      createdAt: supportChatMessages.createdAt,
    })
    .from(supportChatMessages)
    .where(eq(supportChatMessages.sessionId, sessionId))
    .orderBy(asc(supportChatMessages.createdAt));

  return messages;
}
