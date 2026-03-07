import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { brainThoughts } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import {
  decryptFields,
  BRAIN_THOUGHT_ENCRYPTED_FIELDS,
} from "@/lib/db/encryption-helpers";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ thoughtId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { thoughtId } = await params;

  const [thought] = await db
    .select({
      id: brainThoughts.id,
      content: brainThoughts.content,
      source: brainThoughts.source,
      author: brainThoughts.author,
      topic: brainThoughts.topic,
      sentiment: brainThoughts.sentiment,
      urgency: brainThoughts.urgency,
      tags: brainThoughts.tags,
      sourceUrl: brainThoughts.sourceUrl,
      sourceDomain: brainThoughts.sourceDomain,
      sourceTimestamp: brainThoughts.sourceTimestamp,
      truncated: brainThoughts.truncated,
      createdAt: brainThoughts.createdAt,
    })
    .from(brainThoughts)
    .where(
      and(
        eq(brainThoughts.id, thoughtId),
        eq(brainThoughts.userId, session.user.id)
      )
    );

  if (!thought) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const decrypted = decryptFields(
    thought as Record<string, unknown>,
    BRAIN_THOUGHT_ENCRYPTED_FIELDS
  );

  return NextResponse.json({ thought: decrypted });
}
