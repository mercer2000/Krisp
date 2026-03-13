import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { inboxSections } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await db
      .select()
      .from(inboxSections)
      .where(eq(inboxSections.tenantId, userId))
      .orderBy(asc(inboxSections.position));

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("Error fetching inbox sections:", error);
    return NextResponse.json(
      { error: "Failed to fetch inbox sections" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, filterCriteria, color, position } = body;

    if (!name || !filterCriteria) {
      return NextResponse.json(
        { error: "Name and filterCriteria are required" },
        { status: 400 }
      );
    }

    const [row] = await db
      .insert(inboxSections)
      .values({
        tenantId: userId,
        name: name.trim(),
        filterCriteria,
        color: color || "#6366F1",
        position: position ?? 0,
      })
      .returning();

    return NextResponse.json({ data: row }, { status: 201 });
  } catch (error) {
    console.error("Error creating inbox section:", error);
    return NextResponse.json(
      { error: "Failed to create inbox section" },
      { status: 500 }
    );
  }
}
