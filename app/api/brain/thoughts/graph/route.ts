import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";
import {
  decryptRows,
  BRAIN_THOUGHT_ENCRYPTED_FIELDS,
} from "@/lib/db/encryption-helpers";

const sql = neon(process.env.DATABASE_URL!);

/**
 * GET /api/brain/thoughts/graph
 *
 * Returns thoughts with their metadata plus pairwise similarity edges
 * for thoughts whose cosine distance is below a threshold.
 * Only thoughts that have embeddings are included.
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const threshold = Math.min(
    Math.max(parseFloat(searchParams.get("threshold") || "0.3"), 0.05),
    0.8
  );
  const limit = Math.min(
    parseInt(searchParams.get("limit") || "100", 10),
    200
  );

  // Fetch thoughts that have embeddings
  const rows = await sql`
    SELECT
      id, content, source, author, topic, sentiment, tags,
      source_url, source_domain, source_timestamp, truncated,
      created_at
    FROM brain_thoughts
    WHERE user_id = ${session.user.id}
      AND embedding IS NOT NULL
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;

  if (rows.length < 2) {
    const decrypted = decryptRows(
      rows as Record<string, unknown>[],
      BRAIN_THOUGHT_ENCRYPTED_FIELDS
    );
    return NextResponse.json({ nodes: decrypted, edges: [] });
  }

  // Get pairwise similarity edges using pgvector cosine distance operator
  // 1 - (a <=> b) gives cosine similarity; we want pairs above the threshold
  const ids = rows.map((r) => r.id as string);
  const edges = await sql`
    SELECT
      a.id AS source,
      b.id AS target,
      1 - (a.embedding <=> b.embedding) AS similarity
    FROM brain_thoughts a
    JOIN brain_thoughts b ON a.id < b.id
    WHERE a.user_id = ${session.user.id}
      AND b.user_id = ${session.user.id}
      AND a.embedding IS NOT NULL
      AND b.embedding IS NOT NULL
      AND a.id = ANY(${ids}::uuid[])
      AND b.id = ANY(${ids}::uuid[])
      AND 1 - (a.embedding <=> b.embedding) >= ${threshold}
    ORDER BY similarity DESC
    LIMIT 500
  `;

  // Camel-case the node fields for the frontend
  const nodes = rows.map((r) => ({
    id: r.id,
    content: r.content,
    source: r.source,
    author: r.author,
    topic: r.topic,
    sentiment: r.sentiment,
    tags: r.tags,
    sourceUrl: r.source_url,
    sourceDomain: r.source_domain,
    sourceTimestamp: r.source_timestamp,
    truncated: r.truncated,
    createdAt: r.created_at,
  }));

  const decrypted = decryptRows(
    nodes as Record<string, unknown>[],
    BRAIN_THOUGHT_ENCRYPTED_FIELDS
  );

  return NextResponse.json({
    nodes: decrypted,
    edges: edges.map((e) => ({
      source: e.source as string,
      target: e.target as string,
      similarity: Math.round(((e.similarity as number) + Number.EPSILON) * 1000) / 1000,
    })),
  });
}
