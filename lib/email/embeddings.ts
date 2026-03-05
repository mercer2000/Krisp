import OpenAI from "openai";
import sql from "./db";
import { decryptNullable, isEncrypted } from "@/lib/encryption";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";
const BATCH_SIZE = Number(process.env.EMBEDDING_BATCH_SIZE) || 100;

// Columns that need decryption when read from the emails table
const ENCRYPTED_COLS = ["sender", "subject", "body_plain_text"] as const;

/**
 * Decrypt encrypted columns on a row read from the emails table.
 */
function decryptEmailRow<T extends Record<string, unknown>>(row: T): T {
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
 * Prepare email text for embedding by concatenating subject, sender, and body.
 * Truncates to ~6000 chars to stay within the 8192 token limit.
 */
function prepareEmailText(email: {
  subject: string | null;
  sender: string;
  body_plain_text: string | null;
}): string {
  const parts: string[] = [];
  if (email.subject) parts.push(`Subject: ${email.subject}`);
  parts.push(`From: ${email.sender}`);
  if (email.body_plain_text) {
    const cleaned = email.body_plain_text
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]{2,}/g, " ")
      .trim();
    parts.push(cleaned.slice(0, 6000));
  }
  return parts.join("\n");
}

/**
 * Generate embeddings for a single text string.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });
  return response.data[0].embedding;
}

/**
 * Generate embeddings for multiple texts in a single batch call.
 */
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
 * Process unembedded emails: fetch emails with NULL embedding, decrypt,
 * generate embeddings via OpenAI from plaintext, and store them back.
 *
 * Pipeline order: read ciphertext → decrypt → generate embedding → store embedding.
 * The encrypted text columns stay encrypted; only the embedding column is updated.
 */
export async function processUnembeddedEmails(tenantId: string): Promise<number> {
  const rows = await sql`
    SELECT id, subject, sender, body_plain_text
    FROM emails
    WHERE tenant_id = ${tenantId}
      AND embedding IS NULL
    ORDER BY received_at DESC
    LIMIT ${BATCH_SIZE}
  `;

  if (rows.length === 0) return 0;

  // Decrypt before preparing text for embedding generation
  const texts = rows.map((row) => {
    const decrypted = decryptEmailRow(row as Record<string, unknown>);
    return prepareEmailText({
      subject: decrypted.subject as string | null,
      sender: decrypted.sender as string,
      body_plain_text: decrypted.body_plain_text as string | null,
    });
  });

  const embeddings = await generateEmbeddingsBatch(texts);

  // Update each email with its embedding
  for (let i = 0; i < rows.length; i++) {
    const embeddingStr = `[${embeddings[i].join(",")}]`;
    await sql`
      UPDATE emails
      SET embedding = ${embeddingStr}::vector,
          embedding_generated_at = NOW()
      WHERE id = ${rows[i].id}
    `;
  }

  return rows.length;
}

/**
 * Get embedding status for a tenant: how many emails have embeddings vs total.
 */
export async function getEmbeddingStatus(tenantId: string): Promise<{
  total: number;
  embedded: number;
  pending: number;
}> {
  const result = await sql`
    SELECT
      COUNT(*)::int AS total,
      COUNT(embedding)::int AS embedded
    FROM emails
    WHERE tenant_id = ${tenantId}
  `;
  const { total, embedded } = result[0] as { total: number; embedded: number };
  return { total, embedded, pending: total - embedded };
}

/**
 * Perform vector similarity search on emails.
 * Decrypts sender/subject/preview before returning.
 */
export async function vectorSearch(
  tenantId: string,
  queryEmbedding: number[],
  limit: number
): Promise<
  Array<{
    id: number;
    sender: string;
    subject: string | null;
    received_at: string;
    recipients: string[];
    attachments_metadata: unknown[];
    preview: string | null;
    web_link: string | null;
    similarity: number;
  }>
> {
  const embeddingStr = `[${queryEmbedding.join(",")}]`;
  const rows = await sql`
    SELECT
      id, sender, subject, received_at, recipients,
      attachments_metadata,
      body_plain_text,
      web_link,
      1 - (embedding <=> ${embeddingStr}::vector) AS similarity
    FROM emails
    WHERE
      tenant_id = ${tenantId}
      AND embedding IS NOT NULL
    ORDER BY embedding <=> ${embeddingStr}::vector
    LIMIT ${limit}
  `;

  return (rows as Record<string, unknown>[]).map((row) => {
    const dr = decryptEmailRow(row);
    return {
      id: dr.id as number,
      sender: dr.sender as string,
      subject: dr.subject as string | null,
      received_at: dr.received_at as string,
      recipients: dr.recipients as string[],
      attachments_metadata: dr.attachments_metadata as unknown[],
      preview: dr.body_plain_text
        ? (dr.body_plain_text as string).slice(0, 200)
        : null,
      web_link: dr.web_link as string | null,
      similarity: dr.similarity as number,
    };
  });
}

/**
 * Perform keyword search on emails (application-side filtering).
 *
 * NOTE: With encrypted columns, ILIKE cannot match on ciphertext.
 * We fetch recent emails, decrypt, and filter in-app.
 */
export async function keywordSearch(
  tenantId: string,
  query: string,
  limit: number
): Promise<
  Array<{
    id: number;
    sender: string;
    subject: string | null;
    received_at: string;
    recipients: string[];
    attachments_metadata: unknown[];
    preview: string | null;
    web_link: string | null;
  }>
> {
  const rows = await sql`
    SELECT
      id, sender, subject, received_at, recipients,
      attachments_metadata,
      body_plain_text,
      web_link
    FROM emails
    WHERE
      tenant_id = ${tenantId}
      AND deleted_at IS NULL
    ORDER BY received_at DESC
    LIMIT 200
  `;

  const lower = query.toLowerCase();
  const results: Array<{
    id: number;
    sender: string;
    subject: string | null;
    received_at: string;
    recipients: string[];
    attachments_metadata: unknown[];
    preview: string | null;
    web_link: string | null;
  }> = [];

  for (const row of rows as Record<string, unknown>[]) {
    const dr = decryptEmailRow(row);
    const sender = (dr.sender as string).toLowerCase();
    const subject = (dr.subject as string | null)?.toLowerCase() || "";

    if (sender.includes(lower) || subject.includes(lower)) {
      results.push({
        id: dr.id as number,
        sender: dr.sender as string,
        subject: dr.subject as string | null,
        received_at: dr.received_at as string,
        recipients: dr.recipients as string[],
        attachments_metadata: dr.attachments_metadata as unknown[],
        preview: dr.body_plain_text
          ? (dr.body_plain_text as string).slice(0, 200)
          : null,
        web_link: dr.web_link as string | null,
      });
      if (results.length >= limit) break;
    }
  }

  return results;
}

/**
 * Hybrid search: run vector + keyword in parallel, merge and deduplicate.
 * Items appearing in both result sets get a 1.2x similarity boost.
 */
export async function hybridSearch(
  tenantId: string,
  query: string,
  limit: number
): Promise<
  Array<{
    id: number;
    sender: string;
    subject: string | null;
    received_at: string;
    recipients: string[];
    attachments_metadata: unknown[];
    preview: string | null;
    web_link: string | null;
    similarity: number;
  }>
> {
  // Generate embedding for the query
  const queryEmbedding = await generateEmbedding(query);

  const [vectorResults, keywordResults] = await Promise.all([
    vectorSearch(tenantId, queryEmbedding, limit),
    keywordSearch(tenantId, query, limit),
  ]);

  // Build a map of results by id
  const resultMap = new Map<
    number,
    {
      id: number;
      sender: string;
      subject: string | null;
      received_at: string;
      recipients: string[];
      attachments_metadata: unknown[];
      preview: string | null;
      web_link: string | null;
      similarity: number;
      inBoth: boolean;
    }
  >();

  // Add vector results first (they have similarity scores)
  for (const r of vectorResults) {
    resultMap.set(r.id, { ...r, inBoth: false });
  }

  // Add keyword results, marking overlap
  for (let i = 0; i < keywordResults.length; i++) {
    const r = keywordResults[i];
    if (resultMap.has(r.id)) {
      // Item in both sets — boost similarity
      const existing = resultMap.get(r.id)!;
      existing.similarity = Math.min(existing.similarity * 1.2, 1.0);
      existing.inBoth = true;
    } else {
      // Keyword-only result: assign a base similarity from position
      resultMap.set(r.id, {
        ...r,
        similarity: Math.max(0.5 - i * 0.01, 0.01),
        inBoth: false,
      });
    }
  }

  // Sort by similarity descending, take top N
  return Array.from(resultMap.values())
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)
    .map(({ inBoth: _, ...rest }) => rest);
}
