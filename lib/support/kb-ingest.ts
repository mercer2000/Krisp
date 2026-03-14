import { db } from "@/lib/db";
import { supportKbSources, supportKbChunks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_BATCH_SIZE = 20;
const TARGET_TOKENS = 512;

// ---------------------------------------------------------------------------
// Text chunking
// ---------------------------------------------------------------------------

/**
 * Split text into chunks of approximately `targetTokens` tokens using sentence
 * boundaries.  Tokens are approximated as chars / 4.
 */
export function splitIntoChunks(
  text: string,
  targetTokens: number = TARGET_TOKENS
): string[] {
  const targetChars = targetTokens * 4;

  // Split on sentence-ending punctuation followed by whitespace
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length === 0) return [];

  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    // If a single sentence exceeds the target, push whatever we have and then
    // hard-split the long sentence.
    if (sentence.length > targetChars) {
      if (current) {
        chunks.push(current.trim());
        current = "";
      }
      // Hard-split on word boundaries
      let remaining = sentence;
      while (remaining.length > targetChars) {
        let splitIdx = remaining.lastIndexOf(" ", targetChars);
        if (splitIdx <= 0) splitIdx = targetChars;
        chunks.push(remaining.slice(0, splitIdx).trim());
        remaining = remaining.slice(splitIdx).trim();
      }
      if (remaining) current = remaining;
      continue;
    }

    if ((current + " " + sentence).trim().length > targetChars && current) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current = current ? current + " " + sentence : sentence;
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks;
}

// ---------------------------------------------------------------------------
// Embeddings
// ---------------------------------------------------------------------------

/**
 * Generate a single 1536-dimension embedding using OpenAI text-embedding-3-small.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });
  return response.data[0].embedding;
}

/**
 * Generate embeddings for multiple texts, processing in batches of
 * EMBEDDING_BATCH_SIZE to stay within API rate limits.
 */
export async function generateEmbeddings(
  texts: string[]
): Promise<number[][]> {
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += EMBEDDING_BATCH_SIZE) {
    const batch = texts.slice(i, i + EMBEDDING_BATCH_SIZE);
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: batch,
    });
    const sorted = response.data
      .sort((a, b) => a.index - b.index)
      .map((d) => d.embedding);
    allEmbeddings.push(...sorted);
  }

  return allEmbeddings;
}

// ---------------------------------------------------------------------------
// HTML helpers
// ---------------------------------------------------------------------------

/**
 * Strip HTML boilerplate (scripts, styles, nav, header, footer) and remaining
 * tags, returning plain text content.
 */
function stripHtml(html: string): string {
  let text = html;

  // Remove script, style, nav, footer, header blocks (with content)
  text = text.replace(
    /<(script|style|nav|footer|header|aside|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi,
    " "
  );

  // Remove all remaining HTML tags
  text = text.replace(/<[^>]+>/g, " ");

  // Decode common HTML entities
  text = text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");

  // Collapse whitespace
  text = text.replace(/\s+/g, " ").trim();

  return text;
}

/**
 * Extract internal links from HTML content that share the same origin as the
 * given base URL.
 */
function extractInternalLinks(html: string, baseUrl: string): string[] {
  const parsed = new URL(baseUrl);
  const origin = parsed.origin;
  const links = new Set<string>();

  const hrefRegex = /href=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;

  while ((match = hrefRegex.exec(html)) !== null) {
    let href = match[1];

    // Skip anchors, javascript, mailto, tel
    if (
      href.startsWith("#") ||
      href.startsWith("javascript:") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:")
    ) {
      continue;
    }

    try {
      // Resolve relative URLs
      const resolved = new URL(href, baseUrl);

      // Only include same-origin links
      if (resolved.origin === origin) {
        // Normalize: remove hash, keep pathname + search
        resolved.hash = "";
        links.add(resolved.href);
      }
    } catch {
      // Invalid URL — skip
    }
  }

  return Array.from(links);
}

// ---------------------------------------------------------------------------
// Core ingestion helper
// ---------------------------------------------------------------------------

/**
 * Shared logic: chunk text, generate embeddings, and insert into DB.
 * Returns the number of chunks created.
 */
async function processAndStoreChunks(
  sourceId: string,
  text: string,
  sourceType: "url" | "pdf" | "text" | "csv" | "sitemap",
  sourceUrl: string | null,
  sourceLabel: string | null
): Promise<number> {
  const chunks = splitIntoChunks(text);
  if (chunks.length === 0) return 0;

  const embeddings = await generateEmbeddings(chunks);

  // Insert chunks in batches to avoid overly large inserts
  const INSERT_BATCH = 50;
  for (let i = 0; i < chunks.length; i += INSERT_BATCH) {
    const batch = chunks.slice(i, i + INSERT_BATCH);
    const batchEmbeddings = embeddings.slice(i, i + INSERT_BATCH);

    await db.insert(supportKbChunks).values(
      batch.map((content, idx) => ({
        sourceId,
        sourceUrl,
        sourceType,
        sourceLabel,
        content,
        embedding: batchEmbeddings[idx],
      }))
    );
  }

  return chunks.length;
}

// ---------------------------------------------------------------------------
// 1. ingestUrl
// ---------------------------------------------------------------------------

/**
 * Fetch a URL, strip HTML boilerplate, extract text, chunk it, embed it, and
 * store in the knowledge base.  Returns the source ID.
 */
export async function ingestUrl(
  url: string,
  label?: string
): Promise<string> {
  const [source] = await db
    .insert(supportKbSources)
    .values({
      sourceType: "url",
      sourceUrl: url,
      sourceLabel: label ?? null,
      status: "processing",
    })
    .returning({ id: supportKbSources.id });

  const sourceId = source.id;

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "MyOpenBrain-KBBot/1.0" },
    });

    if (!response.ok) {
      throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const text = stripHtml(html);

    if (!text || text.length < 20) {
      throw new Error("Extracted text is too short or empty");
    }

    const chunkCount = await processAndStoreChunks(
      sourceId,
      text,
      "url",
      url,
      label ?? null
    );

    await db
      .update(supportKbSources)
      .set({
        status: "complete",
        chunkCount,
        updatedAt: new Date(),
      })
      .where(eq(supportKbSources.id, sourceId));

    return sourceId;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db
      .update(supportKbSources)
      .set({
        status: "failed",
        errorMessage: message,
        updatedAt: new Date(),
      })
      .where(eq(supportKbSources.id, sourceId));
    return sourceId;
  }
}

// ---------------------------------------------------------------------------
// 2. ingestMultiPageCrawl
// ---------------------------------------------------------------------------

/**
 * Crawl from a root URL, discover internal links, and ingest all discovered
 * pages up to `maxDepth` levels deep.  Returns the source ID.
 */
export async function ingestMultiPageCrawl(
  rootUrl: string,
  maxDepth: number = 2,
  label?: string
): Promise<string> {
  const [source] = await db
    .insert(supportKbSources)
    .values({
      sourceType: "url",
      sourceUrl: rootUrl,
      sourceLabel: label ?? `Crawl: ${rootUrl}`,
      status: "processing",
      metadata: { crawl: true, maxDepth },
    })
    .returning({ id: supportKbSources.id });

  const sourceId = source.id;

  try {
    const visited = new Set<string>();
    const queue: Array<{ url: string; depth: number }> = [
      { url: rootUrl, depth: 0 },
    ];
    let totalChunks = 0;

    while (queue.length > 0) {
      const item = queue.shift()!;

      // Normalize URL for dedup
      const normalized = item.url.replace(/\/$/, "");
      if (visited.has(normalized)) continue;
      visited.add(normalized);

      try {
        const response = await fetch(item.url, {
          headers: { "User-Agent": "MyOpenBrain-KBBot/1.0" },
        });

        if (!response.ok) continue;

        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("text/html")) continue;

        const html = await response.text();
        const text = stripHtml(html);

        if (text && text.length >= 20) {
          const chunkCount = await processAndStoreChunks(
            sourceId,
            text,
            "url",
            item.url,
            label ?? null
          );
          totalChunks += chunkCount;
        }

        // Discover links if we haven't exceeded depth
        if (item.depth < maxDepth) {
          const links = extractInternalLinks(html, item.url);
          for (const link of links) {
            const normalizedLink = link.replace(/\/$/, "");
            if (!visited.has(normalizedLink)) {
              queue.push({ url: link, depth: item.depth + 1 });
            }
          }
        }
      } catch {
        // Skip individual page errors and continue crawling
      }
    }

    await db
      .update(supportKbSources)
      .set({
        status: "complete",
        chunkCount: totalChunks,
        metadata: { crawl: true, maxDepth, pagesVisited: visited.size },
        updatedAt: new Date(),
      })
      .where(eq(supportKbSources.id, sourceId));

    return sourceId;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db
      .update(supportKbSources)
      .set({
        status: "failed",
        errorMessage: message,
        updatedAt: new Date(),
      })
      .where(eq(supportKbSources.id, sourceId));
    return sourceId;
  }
}

// ---------------------------------------------------------------------------
// 3. ingestPdfText
// ---------------------------------------------------------------------------

/**
 * Ingest pre-extracted PDF text content.  The API route is responsible for
 * converting the PDF buffer to text; this function handles chunking, embedding,
 * and storage.  Returns the source ID.
 */
export async function ingestPdfText(
  text: string,
  filename: string
): Promise<string> {
  const [source] = await db
    .insert(supportKbSources)
    .values({
      sourceType: "pdf",
      sourceLabel: filename,
      status: "processing",
    })
    .returning({ id: supportKbSources.id });

  const sourceId = source.id;

  try {
    if (!text || text.trim().length < 20) {
      throw new Error("PDF text content is too short or empty");
    }

    const chunkCount = await processAndStoreChunks(
      sourceId,
      text,
      "pdf",
      null,
      filename
    );

    await db
      .update(supportKbSources)
      .set({
        status: "complete",
        chunkCount,
        updatedAt: new Date(),
      })
      .where(eq(supportKbSources.id, sourceId));

    return sourceId;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db
      .update(supportKbSources)
      .set({
        status: "failed",
        errorMessage: message,
        updatedAt: new Date(),
      })
      .where(eq(supportKbSources.id, sourceId));
    return sourceId;
  }
}

// ---------------------------------------------------------------------------
// 4. ingestText
// ---------------------------------------------------------------------------

/**
 * Ingest raw text content directly.  Returns the source ID.
 */
export async function ingestText(
  text: string,
  label?: string
): Promise<string> {
  const [source] = await db
    .insert(supportKbSources)
    .values({
      sourceType: "text",
      sourceLabel: label ?? "Manual text entry",
      status: "processing",
    })
    .returning({ id: supportKbSources.id });

  const sourceId = source.id;

  try {
    if (!text || text.trim().length < 10) {
      throw new Error("Text content is too short or empty");
    }

    const chunkCount = await processAndStoreChunks(
      sourceId,
      text,
      "text",
      null,
      label ?? null
    );

    await db
      .update(supportKbSources)
      .set({
        status: "complete",
        chunkCount,
        updatedAt: new Date(),
      })
      .where(eq(supportKbSources.id, sourceId));

    return sourceId;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db
      .update(supportKbSources)
      .set({
        status: "failed",
        errorMessage: message,
        updatedAt: new Date(),
      })
      .where(eq(supportKbSources.id, sourceId));
    return sourceId;
  }
}

// ---------------------------------------------------------------------------
// 5. ingestCsv
// ---------------------------------------------------------------------------

/**
 * Parse CSV content (one URL per row), crawl each URL, and ingest all content.
 * Returns the source ID.
 */
export async function ingestCsv(
  csvContent: string,
  label?: string
): Promise<string> {
  const [source] = await db
    .insert(supportKbSources)
    .values({
      sourceType: "csv",
      sourceLabel: label ?? "CSV URL list",
      status: "processing",
    })
    .returning({ id: supportKbSources.id });

  const sourceId = source.id;

  try {
    // Parse CSV: split into lines, trim, filter empty lines and headers
    const urls = csvContent
      .split(/[\r\n]+/)
      .map((line) => line.trim())
      .filter((line) => line && line.startsWith("http"));

    if (urls.length === 0) {
      throw new Error("No valid URLs found in CSV content");
    }

    let totalChunks = 0;
    const errors: string[] = [];

    for (const url of urls) {
      try {
        const response = await fetch(url, {
          headers: { "User-Agent": "MyOpenBrain-KBBot/1.0" },
        });

        if (!response.ok) {
          errors.push(`${url}: ${response.status} ${response.statusText}`);
          continue;
        }

        const html = await response.text();
        const text = stripHtml(html);

        if (text && text.length >= 20) {
          const chunkCount = await processAndStoreChunks(
            sourceId,
            text,
            "csv",
            url,
            label ?? null
          );
          totalChunks += chunkCount;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${url}: ${msg}`);
      }
    }

    await db
      .update(supportKbSources)
      .set({
        status: "complete",
        chunkCount: totalChunks,
        metadata: {
          urlCount: urls.length,
          errorCount: errors.length,
          errors: errors.length > 0 ? errors.slice(0, 20) : undefined,
        },
        updatedAt: new Date(),
      })
      .where(eq(supportKbSources.id, sourceId));

    return sourceId;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db
      .update(supportKbSources)
      .set({
        status: "failed",
        errorMessage: message,
        updatedAt: new Date(),
      })
      .where(eq(supportKbSources.id, sourceId));
    return sourceId;
  }
}

// ---------------------------------------------------------------------------
// 6. ingestSitemap
// ---------------------------------------------------------------------------

/**
 * Parse an XML sitemap, extract `<loc>` entries, crawl each URL, and ingest
 * all content.  Returns the source ID.
 */
export async function ingestSitemap(
  sitemapContent: string,
  label?: string
): Promise<string> {
  const [source] = await db
    .insert(supportKbSources)
    .values({
      sourceType: "sitemap",
      sourceLabel: label ?? "XML Sitemap",
      status: "processing",
    })
    .returning({ id: supportKbSources.id });

  const sourceId = source.id;

  try {
    // Extract <loc> entries from the XML
    const locRegex = /<loc>\s*(.*?)\s*<\/loc>/gi;
    const urls: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = locRegex.exec(sitemapContent)) !== null) {
      const url = match[1].trim();
      if (url && url.startsWith("http")) {
        urls.push(url);
      }
    }

    if (urls.length === 0) {
      throw new Error("No <loc> entries found in sitemap content");
    }

    let totalChunks = 0;
    const errors: string[] = [];

    for (const url of urls) {
      try {
        const response = await fetch(url, {
          headers: { "User-Agent": "MyOpenBrain-KBBot/1.0" },
        });

        if (!response.ok) {
          errors.push(`${url}: ${response.status} ${response.statusText}`);
          continue;
        }

        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("text/html")) continue;

        const html = await response.text();
        const text = stripHtml(html);

        if (text && text.length >= 20) {
          const chunkCount = await processAndStoreChunks(
            sourceId,
            text,
            "sitemap",
            url,
            label ?? null
          );
          totalChunks += chunkCount;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${url}: ${msg}`);
      }
    }

    await db
      .update(supportKbSources)
      .set({
        status: "complete",
        chunkCount: totalChunks,
        metadata: {
          urlCount: urls.length,
          errorCount: errors.length,
          errors: errors.length > 0 ? errors.slice(0, 20) : undefined,
        },
        updatedAt: new Date(),
      })
      .where(eq(supportKbSources.id, sourceId));

    return sourceId;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db
      .update(supportKbSources)
      .set({
        status: "failed",
        errorMessage: message,
        updatedAt: new Date(),
      })
      .where(eq(supportKbSources.id, sourceId));
    return sourceId;
  }
}

// ---------------------------------------------------------------------------
// Toggle source enabled
// ---------------------------------------------------------------------------

/**
 * Toggle the `enabled` flag on a source and all of its chunks.
 */
export async function toggleSourceEnabled(
  sourceId: string,
  enabled: boolean
): Promise<void> {
  await db
    .update(supportKbSources)
    .set({ enabled, updatedAt: new Date() })
    .where(eq(supportKbSources.id, sourceId));

  await db
    .update(supportKbChunks)
    .set({ enabled })
    .where(eq(supportKbChunks.sourceId, sourceId));
}
