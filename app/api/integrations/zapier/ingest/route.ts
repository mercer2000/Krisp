import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  users,
  webhookSecrets,
  brainThoughts,
  zapierIngestLogs,
  cards,
  cardTags,
  columns,
  boards,
} from "@/lib/db/schema";
import { eq, and, max, asc } from "drizzle-orm";
import { timingSafeEqual } from "crypto";
import { generateEmbedding } from "@/lib/email/embeddings";
import { chatCompletion } from "@/lib/ai/client";
import { resolvePrompt } from "@/lib/ai/resolvePrompt";
import { PROMPT_ZAPIER_INGEST_META } from "@/lib/ai/prompts";
import {
  encryptFields,
  BRAIN_THOUGHT_ENCRYPTED_FIELDS,
  CARD_ENCRYPTED_FIELDS,
} from "@/lib/db/encryption-helpers";

// ── Zod Schema ──────────────────────────────────────

const ingestPayloadSchema = z.object({
  message: z.string().min(1, "message is required and cannot be empty"),
  source: z.string().max(255).default("zapier"),
  author: z.string().max(255).optional(),
  timestamp: z.string().datetime().optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  routing_target: z.enum(["brain", "kanban", "both"]).default("brain"),
  // Kanban-specific fields
  title: z.string().max(255).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  target_column: z.string().max(255).optional(),
  target_board: z.string().max(255).optional(),
  // Idempotency
  idempotency_key: z.string().max(255).optional(),
});

type IngestPayload = z.infer<typeof ingestPayloadSchema>;

// ── Auth Helpers ────────────────────────────────────

function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return null;
  return authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
}

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

async function validateZapierAuth(
  request: NextRequest,
  userId: string
): Promise<boolean> {
  const token = extractToken(request);
  if (!token) return false;

  const [row] = await db
    .select({ secret: webhookSecrets.secret })
    .from(webhookSecrets)
    .where(
      and(
        eq(webhookSecrets.userId, userId),
        eq(webhookSecrets.name, "Zapier")
      )
    );

  if (!row) return false;
  return safeCompare(token, row.secret);
}

// ── Rate Limiting (simple in-memory) ────────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 30; // 30 requests per minute per user

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) return false;

  entry.count++;
  return true;
}

// ── Metadata Extraction ─────────────────────────────

const MAX_EMBEDDING_CHARS = 6000;

async function extractMetadata(text: string, userId: string): Promise<{
  topic: string | null;
  sentiment: string | null;
  urgency: string | null;
}> {
  try {
    const basePrompt = await resolvePrompt(PROMPT_ZAPIER_INGEST_META, userId);
    const prompt = `${basePrompt}

Message:
${text.slice(0, 2000)}`;

    const raw = await chatCompletion(prompt, { maxTokens: 100, userId });
    const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      topic: typeof parsed.topic === "string" ? parsed.topic.slice(0, 255) : null,
      sentiment: typeof parsed.sentiment === "string" ? parsed.sentiment.slice(0, 50) : null,
      urgency: typeof parsed.urgency === "string" ? parsed.urgency.slice(0, 50) : null,
    };
  } catch {
    return { topic: null, sentiment: null, urgency: null };
  }
}

// ── Brain Pipeline ──────────────────────────────────

async function routeToBrain(
  userId: string,
  payload: IngestPayload
): Promise<{ thoughtId: string }> {
  const text = payload.message;
  const truncated = text.length > MAX_EMBEDDING_CHARS;
  const embeddingText = truncated ? text.slice(0, MAX_EMBEDDING_CHARS) : text;

  // Generate embedding and extract metadata concurrently
  const [embedding, metadata] = await Promise.all([
    generateEmbedding(embeddingText),
    extractMetadata(text, userId),
  ]);

  const [thought] = await db
    .insert(brainThoughts)
    .values(
      encryptFields(
        {
          userId,
          content: text,
          source: payload.source,
          author: payload.author ?? null,
          topic: metadata.topic,
          sentiment: metadata.sentiment,
          urgency: metadata.urgency,
          tags: payload.tags ?? [],
          embedding,
          sourceTimestamp: payload.timestamp
            ? new Date(payload.timestamp)
            : null,
          truncated,
        },
        BRAIN_THOUGHT_ENCRYPTED_FIELDS
      )
    )
    .returning({ id: brainThoughts.id });

  return { thoughtId: thought.id };
}

// ── Kanban Pipeline ─────────────────────────────────

async function routeToKanban(
  userId: string,
  payload: IngestPayload
): Promise<{ cardId: string }> {
  // Derive card title
  const cardTitle =
    payload.title ||
    (payload.message.length > 100
      ? payload.message.slice(0, 97) + "..."
      : payload.message);

  // Resolve board
  const [user] = await db
    .select({
      defaultBoardId: users.defaultBoardId,
    })
    .from(users)
    .where(eq(users.id, userId));

  let targetBoardId: string | null = null;

  if (payload.target_board) {
    // Find board by name
    const userBoards = await db
      .select({ id: boards.id, title: boards.title })
      .from(boards)
      .where(eq(boards.userId, userId));

    const lower = payload.target_board.toLowerCase();
    const match = userBoards.find(
      (b) =>
        b.title.toLowerCase() === lower ||
        b.title.toLowerCase().includes(lower)
    );
    if (match) targetBoardId = match.id;
  }

  if (!targetBoardId) {
    targetBoardId = user?.defaultBoardId ?? null;
  }

  if (!targetBoardId) {
    // Fallback to first board
    const [firstBoard] = await db
      .select({ id: boards.id })
      .from(boards)
      .where(eq(boards.userId, userId))
      .limit(1);

    if (!firstBoard) {
      throw new Error("No Kanban boards found. Create a board first.");
    }
    targetBoardId = firstBoard.id;
  }

  // Resolve column
  const boardColumns = await db
    .select({ id: columns.id, title: columns.title, position: columns.position })
    .from(columns)
    .where(eq(columns.boardId, targetBoardId))
    .orderBy(asc(columns.position));

  if (boardColumns.length === 0) {
    throw new Error("Target board has no columns. Add columns first.");
  }

  let targetColumn = boardColumns[0]; // default to first column
  if (payload.target_column) {
    const lower = payload.target_column.toLowerCase();
    const match = boardColumns.find(
      (c) =>
        c.title.toLowerCase() === lower ||
        c.title.toLowerCase().includes(lower)
    );
    if (match) targetColumn = match;
  }

  // Calculate position
  const [posResult] = await db
    .select({ maxPosition: max(cards.position) })
    .from(cards)
    .where(eq(cards.columnId, targetColumn.id));
  const nextPosition = (posResult?.maxPosition ?? 0) + 1024;

  // Insert card
  const [newCard] = await db
    .insert(cards)
    .values(
      encryptFields(
        {
          columnId: targetColumn.id,
          title: cardTitle,
          description: payload.message,
          position: nextPosition,
          priority: payload.priority ?? "medium",
        },
        CARD_ENCRYPTED_FIELDS
      )
    )
    .returning({ id: cards.id });

  // Add tags
  const tagLabels = [...(payload.tags ?? [])];
  if (!tagLabels.includes("zapier")) tagLabels.push("zapier");

  const tagColors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];
  await db.insert(cardTags).values(
    tagLabels.map((label, i) => ({
      cardId: newCard.id,
      label,
      color: tagColors[i % tagColors.length],
    }))
  );

  return { cardId: newCard.id };
}

// ── Main Route Handler ──────────────────────────────

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");

  if (!userId) {
    return NextResponse.json(
      { error: "Missing required query parameter: user_id" },
      { status: 400 }
    );
  }

  // Validate user exists
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, userId));

  if (!user) {
    return NextResponse.json(
      { error: "Invalid user_id: user not found" },
      { status: 404 }
    );
  }

  // Auth
  if (!(await validateZapierAuth(request, userId))) {
    return NextResponse.json(
      { error: "Unauthorized: invalid or missing webhook secret" },
      { status: 401 }
    );
  }

  // Rate limit
  if (!checkRateLimit(userId)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Max 30 requests per minute." },
      { status: 429 }
    );
  }

  // Parse and validate payload
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = ingestPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const payload = parsed.data;

  // Idempotency check
  if (payload.idempotency_key) {
    const [existing] = await db
      .select({ id: zapierIngestLogs.id, status: zapierIngestLogs.status })
      .from(zapierIngestLogs)
      .where(
        and(
          eq(zapierIngestLogs.userId, userId),
          eq(zapierIngestLogs.idempotencyKey, payload.idempotency_key)
        )
      );

    if (existing) {
      return NextResponse.json(
        {
          message: "Already processed",
          idempotency_key: payload.idempotency_key,
          status: existing.status,
        },
        { status: 200 }
      );
    }
  }

  // Route the payload
  try {
    let thoughtId: string | null = null;
    let cardId: string | null = null;

    if (payload.routing_target === "brain" || payload.routing_target === "both") {
      const result = await routeToBrain(userId, payload);
      thoughtId = result.thoughtId;
    }

    if (payload.routing_target === "kanban" || payload.routing_target === "both") {
      const result = await routeToKanban(userId, payload);
      cardId = result.cardId;
    }

    // Log success
    await db.insert(zapierIngestLogs).values({
      userId,
      source: payload.source,
      routingTarget: payload.routing_target,
      status: "success",
      idempotencyKey: payload.idempotency_key ?? null,
      thoughtId,
      cardId,
    });

    return NextResponse.json(
      {
        message: "Ingested successfully",
        routing_target: payload.routing_target,
        thought_id: thoughtId,
        card_id: cardId,
      },
      { status: 201 }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";

    // Log failure
    await db
      .insert(zapierIngestLogs)
      .values({
        userId,
        source: payload.source,
        routingTarget: payload.routing_target,
        status: "failed",
        idempotencyKey: payload.idempotency_key ?? null,
        errorMessage,
      })
      .catch((logErr) =>
        console.error("Failed to log ingest error:", logErr)
      );

    console.error("Zapier ingest error:", error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
