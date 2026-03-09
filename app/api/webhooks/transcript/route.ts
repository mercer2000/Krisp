import { NextRequest, NextResponse } from "next/server";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { db } from "@/lib/db";
import { transcripts, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const NEON_AUTH_BASE_URL = process.env.NEON_AUTH_BASE_URL!;

// Cache the JWKS (jose handles caching internally)
const jwks = createRemoteJWKSet(
  new URL(`${NEON_AUTH_BASE_URL}/.well-known/jwks.json`)
);

/**
 * Extracts and verifies a Bearer JWT token from the Authorization header.
 * Returns the user ID (sub claim) or null if invalid.
 */
async function verifyBearerToken(
  request: NextRequest
): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  try {
    const { payload } = await jwtVerify(token, jwks);
    return (payload.sub as string) ?? null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify JWT and extract user ID
    const userId = await verifyBearerToken(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify user exists in our database
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 401 }
      );
    }

    // Parse and validate payload
    const body = await request.json();

    if (!body.fullText && !body.segments) {
      return NextResponse.json(
        { error: "Missing required field: fullText or segments" },
        { status: 400 }
      );
    }

    // Insert transcript
    await db
      .insert(transcripts)
      .values({
        userId,
        recordingId: body.recordingId ?? null,
        application: body.application ?? null,
        startTimeUtc: body.startTimeUtc ? new Date(body.startTimeUtc) : null,
        endTimeUtc: body.endTimeUtc ? new Date(body.endTimeUtc) : null,
        duration: body.duration ?? null,
        modelName: body.modelName ?? null,
        language: body.language ?? null,
        fullText: body.fullText ?? null,
        segments: body.segments ?? null,
      });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error processing transcript webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
