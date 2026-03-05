import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { decisions } from "@/lib/db/schema";
import { eq, desc, and, sql, isNull } from "drizzle-orm";
import { createDecisionSchema } from "@/lib/validators/schemas";
import {
  encryptFields,
  decryptFields,
  decryptRows,
  DECISION_ENCRYPTED_FIELDS,
  WEBHOOK_ENCRYPTED_FIELDS,
} from "@/lib/db/encryption-helpers";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const q = searchParams.get("q");

    // Build conditions without keyword filter (applied app-side after decryption)
    const conditions = [eq(decisions.userId, userId), isNull(decisions.deletedAt)];
    if (status) {
      conditions.push(
        eq(decisions.status, status as "active" | "reconsidered" | "archived")
      );
    }
    if (category) {
      conditions.push(
        eq(decisions.category, category as "technical" | "process" | "budget" | "strategic" | "other")
      );
    }

    const items = await db
      .select({
        id: decisions.id,
        userId: decisions.userId,
        meetingId: decisions.meetingId,
        emailId: decisions.emailId,
        statement: decisions.statement,
        context: decisions.context,
        rationale: decisions.rationale,
        participants: decisions.participants,
        category: decisions.category,
        status: decisions.status,
        priority: decisions.priority,
        extractionSource: decisions.extractionSource,
        confidence: decisions.confidence,
        annotation: decisions.annotation,
        decisionDate: decisions.decisionDate,
        createdAt: decisions.createdAt,
        updatedAt: decisions.updatedAt,
        meetingTitle: sql<string | null>`(
          SELECT meeting_title FROM webhook_key_points
          WHERE id = "decisions"."meeting_id"
        )`.as("meeting_title"),
      })
      .from(decisions)
      .where(and(...conditions))
      .orderBy(desc(decisions.createdAt));

    // Decrypt decision fields and meeting title
    let decrypted = items.map((item) => {
      const dec = decryptFields(item as Record<string, unknown>, DECISION_ENCRYPTED_FIELDS);
      // Also decrypt the meeting title sub-select
      if (typeof dec.meetingTitle === "string") {
        dec.meetingTitle = decryptFields({ meetingTitle: dec.meetingTitle } as Record<string, unknown>, ["meetingTitle"]).meetingTitle;
      }
      return dec;
    }) as typeof items;

    // Apply keyword filter application-side on decrypted statement
    if (q) {
      const lower = q.toLowerCase();
      decrypted = decrypted.filter((d) =>
        (d.statement as string).toLowerCase().includes(lower)
      );
    }

    return NextResponse.json({ decisions: decrypted });
  } catch (error) {
    console.error("Error fetching decisions:", error);
    return NextResponse.json(
      { error: "Failed to fetch decisions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createDecisionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { statement, context, rationale, participants, category, priority, meetingId, emailId, decisionDate } =
      parsed.data;

    const [item] = await db
      .insert(decisions)
      .values(
        encryptFields({
          userId,
          statement,
          context: context ?? null,
          rationale: rationale ?? null,
          participants: participants ?? [],
          category: category ?? "other",
          priority: priority ?? "medium",
          meetingId: meetingId ?? null,
          emailId: emailId ?? null,
          decisionDate: decisionDate ? new Date(decisionDate) : null,
        }, DECISION_ENCRYPTED_FIELDS)
      )
      .returning();

    const decrypted = decryptFields(item as Record<string, unknown>, DECISION_ENCRYPTED_FIELDS);
    return NextResponse.json({ decision: decrypted }, { status: 201 });
  } catch (error) {
    console.error("Error creating decision:", error);
    return NextResponse.json(
      { error: "Failed to create decision" },
      { status: 500 }
    );
  }
}
