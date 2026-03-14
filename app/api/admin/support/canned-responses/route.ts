import { NextRequest, NextResponse } from "next/server";
import { getRequiredAdmin } from "@/lib/auth/getRequiredAdmin";
import { db } from "@/lib/db";
import { supportCannedResponses } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { z } from "zod";

export async function GET() {
  try {
    await getRequiredAdmin();

    const responses = await db
      .select()
      .from(supportCannedResponses)
      .orderBy(
        asc(supportCannedResponses.sortOrder),
        asc(supportCannedResponses.createdAt)
      );

    return NextResponse.json({ responses });
  } catch (error) {
    console.error("Failed to fetch canned responses:", error);
    return NextResponse.json(
      { error: "Failed to fetch canned responses" },
      { status: 500 }
    );
  }
}

const postSchema = z.object({
  title: z.string().min(1).max(100),
  content: z.string().min(1),
  category: z.string().max(50).optional(),
  shortcut: z.string().max(20).optional(),
});

export async function POST(request: NextRequest) {
  try {
    await getRequiredAdmin();
    const body = await request.json();
    const parsed = postSchema.parse(body);

    const [response] = await db
      .insert(supportCannedResponses)
      .values(parsed)
      .returning();

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Failed to create canned response:", error);
    return NextResponse.json(
      { error: "Failed to create canned response" },
      { status: 500 }
    );
  }
}
