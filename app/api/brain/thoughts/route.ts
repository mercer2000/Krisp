import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { brainThoughts } from "@/lib/db/schema";
import { and, eq, desc, sql } from "drizzle-orm";
import {
  decryptRows,
  BRAIN_THOUGHT_ENCRYPTED_FIELDS,
} from "@/lib/db/encryption-helpers";

export async function GET(request: NextRequest) {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
  const offset = parseInt(searchParams.get("offset") || "0", 10);
  const source = searchParams.get("source"); // e.g. "web_clip", "zapier"

  const where = source
    ? and(
        eq(brainThoughts.userId, session.user.id),
        eq(brainThoughts.source, source)
      )
    : eq(brainThoughts.userId, session.user.id);

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: brainThoughts.id,
        content: brainThoughts.content,
        source: brainThoughts.source,
        author: brainThoughts.author,
        topic: brainThoughts.topic,
        sentiment: brainThoughts.sentiment,
        tags: brainThoughts.tags,
        sourceUrl: brainThoughts.sourceUrl,
        sourceDomain: brainThoughts.sourceDomain,
        sourceTimestamp: brainThoughts.sourceTimestamp,
        truncated: brainThoughts.truncated,
        createdAt: brainThoughts.createdAt,
      })
      .from(brainThoughts)
      .where(where)
      .orderBy(desc(brainThoughts.createdAt))
      .limit(limit)
      .offset(offset),

    db
      .select({ count: sql<number>`count(*)` })
      .from(brainThoughts)
      .where(where),
  ]);

  const decrypted = decryptRows(
    rows as Record<string, unknown>[],
    BRAIN_THOUGHT_ENCRYPTED_FIELDS
  );

  return NextResponse.json({
    thoughts: decrypted,
    total: Number(countResult[0]?.count ?? 0),
    limit,
    offset,
  });
}
