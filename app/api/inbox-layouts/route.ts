import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { inboxLayouts } from "@/lib/db/schema";
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
      .from(inboxLayouts)
      .where(eq(inboxLayouts.tenantId, userId))
      .orderBy(asc(inboxLayouts.createdAt));

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("Error fetching inbox layouts:", error);
    return NextResponse.json(
      { error: "Failed to fetch inbox layouts" },
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
    const { name, leftSectionId, rightSectionId, isDefault } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    // If setting as default, unset any existing default
    if (isDefault) {
      await db
        .update(inboxLayouts)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(eq(inboxLayouts.tenantId, userId));
    }

    const [row] = await db
      .insert(inboxLayouts)
      .values({
        tenantId: userId,
        name: name.trim(),
        leftSectionId: leftSectionId || null,
        rightSectionId: rightSectionId || null,
        isDefault: isDefault ?? false,
      })
      .returning();

    return NextResponse.json({ data: row }, { status: 201 });
  } catch (error) {
    console.error("Error creating inbox layout:", error);
    return NextResponse.json(
      { error: "Failed to create inbox layout" },
      { status: 500 }
    );
  }
}
