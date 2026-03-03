import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { decisions } from "@/lib/db/schema";
import { eq, desc, and, sql, isNull, ilike } from "drizzle-orm";
import { createDecisionSchema } from "@/lib/validators/schemas";

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
    if (q) {
      conditions.push(ilike(decisions.statement, `%${q}%`));
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

    return NextResponse.json({ decisions: items });
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
      .values({
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
      })
      .returning();

    return NextResponse.json({ decision: item }, { status: 201 });
  } catch (error) {
    console.error("Error creating decision:", error);
    return NextResponse.json(
      { error: "Failed to create decision" },
      { status: 500 }
    );
  }
}
