import OpenAI from "openai";
import sql from "./db";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";
const BATCH_SIZE = Number(process.env.EMBEDDING_BATCH_SIZE) || 100;

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
 * Process unembedded emails: fetch emails with NULL embedding, generate
 * embeddings via OpenAI, and store them back in the database.
 *
 * Returns the number of emails processed.
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

  const texts = rows.map((row) =>
    prepareEmailText({
      subject: row.subject as string | null,
      sender: row.sender as string,
      body_plain_text: row.body_plain_text as string | null,
    })
  );

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
      LEFT(body_plain_text, 200) AS preview,
      web_link,
      1 - (embedding <=> ${embeddingStr}::vector) AS similarity
    FROM emails
    WHERE
      tenant_id = ${tenantId}
      AND embedding IS NOT NULL
    ORDER BY embedding <=> ${embeddingStr}::vector
    LIMIT ${limit}
  `;
  return rows as Array<{
    id: number;
    sender: string;
    subject: string | null;
    received_at: string;
    recipients: string[];
    attachments_metadata: unknown[];
    preview: string | null;
    web_link: string | null;
    similarity: number;
  }>;
}

/**
 * Perform keyword search on emails (existing ILIKE approach).
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
      LEFT(body_plain_text, 200) AS preview,
      web_link
    FROM emails
    WHERE
      tenant_id = ${tenantId}
      AND (sender ILIKE '%' || ${query} || '%' OR subject ILIKE '%' || ${query} || '%')
    ORDER BY received_at DESC
    LIMIT ${limit}
  `;
  return rows as Array<{
    id: number;
    sender: string;
    subject: string | null;
    received_at: string;
    recipients: string[];
    attachments_metadata: unknown[];
    preview: string | null;
    web_link: string | null;
  }>;
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
