import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { users, webhookSecrets, brainThoughts, workspaces, pages, blocks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { timingSafeEqual } from "crypto";
import { generateEmbedding } from "@/lib/email/embeddings";
import { chatCompletion } from "@/lib/ai/client";
import { resolvePrompt } from "@/lib/ai/resolvePrompt";
import { PROMPT_WEB_CLIP_META } from "@/lib/ai/prompts";
import {
  encryptFields,
  BRAIN_THOUGHT_ENCRYPTED_FIELDS,
} from "@/lib/db/encryption-helpers";

// ── CORS Headers ────────────────────────────────────

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

function jsonResponse(data: unknown, status: number) {
  return NextResponse.json(data, { status, headers: corsHeaders });
}

// ── Zod Schema ──────────────────────────────────────

const blockSchema = z.object({
  type: z.enum([
    "paragraph",
    "heading_1",
    "heading_2",
    "heading_3",
    "bulleted_list",
    "numbered_list",
    "quote",
    "code",
    "divider",
    "callout",
    "image",
    "bookmark",
  ]),
  content: z.record(z.string(), z.unknown()),
});

const clipPayloadSchema = z.object({
  title: z.string().min(1).max(500),
  url: z.string().url().max(2048),
  domain: z.string().max(255),
  plain_text: z.string().min(1),
  blocks: z.array(blockSchema).max(80).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  clipped_at: z.string().datetime().optional(),
});

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

async function authenticateApiKey(
  request: NextRequest
): Promise<string | null> {
  const token = extractToken(request);
  if (!token) return null;

  // Look up all webhook secrets and compare
  const secrets = await db
    .select({
      userId: webhookSecrets.userId,
      secret: webhookSecrets.secret,
    })
    .from(webhookSecrets)
    .where(eq(webhookSecrets.name, "Zapier"));

  for (const row of secrets) {
    if (safeCompare(token, row.secret)) {
      return row.userId;
    }
  }
  return null;
}

// ── Rate Limiting ───────────────────────────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;

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

const MAX_EMBEDDING_CHARS = 12_000;

async function extractMetadata(text: string, userId: string): Promise<{
  topic: string | null;
  sentiment: string | null;
  urgency: string | null;
}> {
  try {
    const basePrompt = await resolvePrompt(PROMPT_WEB_CLIP_META, userId);
    const prompt = `${basePrompt}

Content:
${text.slice(0, 2000)}`;

    const raw = await chatCompletion(prompt, { maxTokens: 100 });
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

// ── Main Route Handler ──────────────────────────────

export async function POST(request: NextRequest) {
  // Authenticate via API key
  const userId = await authenticateApiKey(request);
  if (!userId) {
    return jsonResponse(
      { error: "Unauthorized: invalid or missing API key" },
      401
    );
  }

  // Validate user exists
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, userId));

  if (!user) {
    return jsonResponse({ error: "User not found" }, 404);
  }

  // Rate limit
  if (!checkRateLimit(userId)) {
    return jsonResponse(
      { error: "Rate limit exceeded. Max 20 clips per minute." },
      429
    );
  }

  // Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const parsed = clipPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse(
      { error: "Validation failed", details: parsed.error.flatten() },
      400
    );
  }

  const payload = parsed.data;

  // Check for duplicate URL
  const [existing] = await db
    .select({ id: brainThoughts.id })
    .from(brainThoughts)
    .where(
      and(
        eq(brainThoughts.userId, userId),
        eq(brainThoughts.sourceUrl, payload.url)
      )
    );

  try {
    // Truncate for embedding
    const fullText = payload.plain_text;
    const truncated = fullText.length > MAX_EMBEDDING_CHARS;
    const embeddingText = truncated
      ? fullText.slice(0, MAX_EMBEDDING_CHARS)
      : fullText;

    // Compose the content for storage: title + URL + text
    const contentForStorage = `${payload.title}\n\nSource: ${payload.url}\n\n${fullText}`;

    // Generate embedding and extract metadata concurrently
    const [embedding, metadata] = await Promise.all([
      generateEmbedding(embeddingText),
      extractMetadata(fullText, userId),
    ]);

    const tags = [...(payload.tags ?? [])];
    if (!tags.includes("web-clip")) tags.push("web-clip");

    const [thought] = await db
      .insert(brainThoughts)
      .values(
        encryptFields(
          {
            userId,
            content: contentForStorage,
            source: "web_clip",
            author: payload.domain,
            topic: metadata.topic,
            sentiment: metadata.sentiment,
            urgency: metadata.urgency,
            tags,
            embedding,
            sourceUrl: payload.url,
            sourceDomain: payload.domain,
            sourceTimestamp: payload.clipped_at
              ? new Date(payload.clipped_at)
              : new Date(),
            truncated,
          },
          BRAIN_THOUGHT_ENCRYPTED_FIELDS
        )
      )
      .returning({ id: brainThoughts.id });

    // ── Create a workspace page for the clip ─────────
    let pageUrl: string | null = null;
    try {
      // Find or create the user's workspace
      let [workspace] = await db
        .select({ id: workspaces.id })
        .from(workspaces)
        .where(eq(workspaces.ownerId, userId))
        .limit(1);

      if (!workspace) {
        [workspace] = await db
          .insert(workspaces)
          .values({ name: "My Workspace", ownerId: userId })
          .returning({ id: workspaces.id });
      }

      // Create the page (sortOrder 0 — matches how new pages are created in the app)
      const [page] = await db
        .insert(pages)
        .values({
          workspaceId: workspace.id,
          title: payload.title,
          icon: "🌐",
          createdBy: userId,
          sortOrder: 0,
        })
        .returning({ id: pages.id });

      // Build blocks: bookmark for source URL, then structured content
      const blockValues: {
        pageId: string;
        parentBlockId: null;
        type: string;
        content: Record<string, unknown>;
        sortOrder: number;
      }[] = [];

      // First block: bookmark with source URL
      blockValues.push({
        pageId: page.id,
        parentBlockId: null,
        type: "bookmark",
        content: {
          url: payload.url,
          title: payload.domain,
          description: `Clipped from ${payload.domain}`,
        },
        sortOrder: 0,
      });

      // Use structured blocks from the extension if available
      if (payload.blocks && payload.blocks.length > 0) {
        for (const block of payload.blocks) {
          blockValues.push({
            pageId: page.id,
            parentBlockId: null,
            type: block.type,
            content: block.content as Record<string, unknown>,
            sortOrder: blockValues.length,
          });
        }
      } else {
        // Fallback: split plain text into paragraphs
        const paragraphs = fullText
          .split(/\n{2,}/)
          .map((p: string) => p.trim())
          .filter(Boolean)
          .slice(0, 50);

        paragraphs.forEach((text: string) => {
          blockValues.push({
            pageId: page.id,
            parentBlockId: null,
            type: "paragraph",
            content: { text },
            sortOrder: blockValues.length,
          });
        });
      }

      if (blockValues.length > 0) {
        await db.insert(blocks).values(blockValues);
      }

      pageUrl = `/workspace/${workspace.id}/${page.id}`;
    } catch (pageError) {
      // Non-fatal: brain thought was saved, page creation is a bonus
      console.error("Failed to create workspace page for clip:", pageError);
    }

    return jsonResponse(
      {
        message: "Clip saved successfully",
        thought_id: thought.id,
        duplicate: !!existing,
        truncated,
        page_url: pageUrl,
      },
      201
    );
  } catch (error) {
    console.error("Web clip ingestion error:", error);
    return jsonResponse({ error: "Failed to save clip" }, 500);
  }
}
