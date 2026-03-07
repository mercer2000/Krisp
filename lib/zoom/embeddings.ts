import OpenAI from "openai";
import sql from "./db";
import { decryptNullable, isEncrypted } from "@/lib/encryption";
import type { EmailListItem } from "@/types/email";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";
const BATCH_SIZE = Number(process.env.EMBEDDING_BATCH_SIZE) || 100;

const ENCRYPTED_COLS = ["message_content", "sender_name"] as const;

function decryptRow<T extends Record<string, unknown>>(row: T): T {
  const result = { ...row };
  for (const col of ENCRYPTED_COLS) {
    const val = result[col];
    if (typeof val === "string" && isEncrypted(val)) {
      (result as Record<string, unknown>)[col] = decryptNullable(val);
    }
  }
  return result;
}

/**
 * Prepare Zoom message text for embedding.
 */
function prepareMessageText(msg: {
  sender_name: string | null;
  message_content: string | null;
  channel_type: string;
}): string {
  const parts: string[] = [];
  if (msg.sender_name) parts.push(`From: ${msg.sender_name}`);
  parts.push(`Type: ${msg.channel_type === "dm" ? "Direct Message" : "Channel"}`);
  if (msg.message_content) {
    const cleaned = msg.message_content
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]{2,}/g, " ")
      .trim();
    parts.push(cleaned.slice(0, 6000));
  }
  return parts.join("\n");
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });
  return response.data[0].embedding;
}

async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
  });
  return response.data
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}

/**
 * Process unembedded Zoom chat messages for a tenant.
 */
export async function processUnembeddedZoomMessages(tenantId: string): Promise<number> {
  const rows = await sql`
    SELECT id, sender_name, message_content, channel_type
    FROM zoom_chat_messages
    WHERE tenant_id = ${tenantId}
      AND embedding IS NULL
      AND is_deleted = false
    ORDER BY message_timestamp DESC
    LIMIT ${BATCH_SIZE}
  `;

  if (rows.length === 0) return 0;

  const texts = rows.map((row) => {
    const dr = decryptRow(row as Record<string, unknown>);
    return prepareMessageText({
      sender_name: dr.sender_name as string | null,
      message_content: dr.message_content as string | null,
      channel_type: dr.channel_type as string,
    });
  });

  const embeddings = await generateEmbeddingsBatch(texts);

  for (let i = 0; i < rows.length; i++) {
    const embeddingStr = `[${embeddings[i].join(",")}]`;
    await sql`
      UPDATE zoom_chat_messages
      SET embedding = ${embeddingStr}::vector,
          embedding_generated_at = NOW()
      WHERE id = ${rows[i].id}
    `;
  }

  return rows.length;
}

/**
 * Get embedding status for Zoom messages.
 */
export async function getZoomEmbeddingStatus(tenantId: string): Promise<{
  total: number;
  embedded: number;
  pending: number;
}> {
  const result = await sql`
    SELECT
      COUNT(*)::int AS total,
      COUNT(embedding)::int AS embedded
    FROM zoom_chat_messages
    WHERE tenant_id = ${tenantId} AND is_deleted = false
  `;
  const { total, embedded } = result[0] as { total: number; embedded: number };
  return { total, embedded, pending: total - embedded };
}

/**
 * Vector similarity search on Zoom chat messages.
 */
export async function zoomVectorSearch(
  tenantId: string,
  queryEmbedding: number[],
  limit: number
): Promise<EmailListItem[]> {
  const embeddingStr = `[${queryEmbedding.join(",")}]`;
  const rows = await sql`
    SELECT
      id, sender_id, sender_name, channel_id, channel_type,
      message_content, message_timestamp,
      1 - (embedding <=> ${embeddingStr}::vector) AS similarity
    FROM zoom_chat_messages
    WHERE
      tenant_id = ${tenantId}
      AND embedding IS NOT NULL
      AND is_deleted = false
    ORDER BY embedding <=> ${embeddingStr}::vector
    LIMIT ${limit}
  `;

  return (rows as Record<string, unknown>[]).map((row) => {
    const dr = decryptRow(row);
    const content = dr.message_content as string | null;
    return {
      id: dr.id as string,
      sender: (dr.sender_name as string | null) || (dr.sender_id as string),
      subject: (dr.channel_type as string) === "channel" ? (dr.channel_id as string ?? "Zoom Channel") : "Direct Message",
      received_at: dr.message_timestamp as string,
      recipients: [],
      has_attachments: false,
      preview: content ? content.slice(0, 200) : null,
      web_link: null,
      outlook_account_id: null,
      account_id: null,
      provider: "zoom" as const,
      labels: [],
      is_newsletter: false,
      similarity: dr.similarity as number,
    };
  });
}

/**
 * Hybrid search for Zoom messages: vector + keyword, merged.
 */
export async function zoomHybridSearch(
  tenantId: string,
  query: string,
  limit: number
): Promise<(EmailListItem & { similarity: number })[]> {
  const queryEmbedding = await generateEmbedding(query);

  const [vectorResults, keywordResults] = await Promise.all([
    zoomVectorSearch(tenantId, queryEmbedding, limit),
    zoomKeywordSearch(tenantId, query, limit),
  ]);

  // Merge and deduplicate
  const resultMap = new Map<string, EmailListItem & { similarity: number }>();

  for (const r of vectorResults) {
    resultMap.set(r.id as string, { ...r, similarity: (r as unknown as { similarity: number }).similarity });
  }

  for (let i = 0; i < keywordResults.length; i++) {
    const r = keywordResults[i];
    const id = r.id as string;
    if (resultMap.has(id)) {
      const existing = resultMap.get(id)!;
      existing.similarity = Math.min(existing.similarity * 1.2, 1.0);
    } else {
      resultMap.set(id, { ...r, similarity: Math.max(0.5 - i * 0.01, 0.01) });
    }
  }

  return Array.from(resultMap.values())
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

/**
 * Keyword search on Zoom messages (decrypt and filter in-app).
 */
async function zoomKeywordSearch(
  tenantId: string,
  query: string,
  limit: number
): Promise<EmailListItem[]> {
  const rows = await sql`
    SELECT id, sender_id, sender_name, channel_id, channel_type,
           message_content, message_timestamp
    FROM zoom_chat_messages
    WHERE tenant_id = ${tenantId} AND is_deleted = false
    ORDER BY message_timestamp DESC
    LIMIT 200
  `;

  const lower = query.toLowerCase();
  const results: EmailListItem[] = [];

  for (const raw of rows as Record<string, unknown>[]) {
    const dr = decryptRow(raw);
    const senderName = ((dr.sender_name as string | null) || "").toLowerCase();
    const content = ((dr.message_content as string | null) || "").toLowerCase();

    if (senderName.includes(lower) || content.includes(lower)) {
      results.push({
        id: dr.id as string,
        sender: (dr.sender_name as string | null) || (dr.sender_id as string),
        subject: (dr.channel_type as string) === "channel" ? (dr.channel_id as string ?? "Zoom Channel") : "Direct Message",
        received_at: dr.message_timestamp as string,
        recipients: [],
        has_attachments: false,
        preview: dr.message_content ? (dr.message_content as string).slice(0, 200) : null,
        web_link: null,
        outlook_account_id: null,
        account_id: null,
        provider: "zoom" as const,
        labels: [],
        is_newsletter: false,
      });
      if (results.length >= limit) break;
    }
  }

  return results;
}
