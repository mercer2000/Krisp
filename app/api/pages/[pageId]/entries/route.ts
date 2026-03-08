import { NextRequest, NextResponse } from "next/server";
import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { db } from "@/lib/db";
import { pages, pageEntries, workspaces } from "@/lib/db/schema";
import { eq, and, asc, desc } from "drizzle-orm";

async function validatePageAccess(pageId: string, userId: string) {
  const [page] = await db.select().from(pages).where(eq(pages.id, pageId));
  if (!page) return null;
  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, page.workspaceId));
  if (!workspace || workspace.ownerId !== userId) return null;
  return page;
}

// GET /api/pages/[pageId]/entries — list entries for a page
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> },
) {
  try {
    const user = await getRequiredUser();
    const { pageId } = await params;

    const page = await validatePageAccess(pageId, user.id);
    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const entryType = searchParams.get("entry_type");
    const sortBy = searchParams.get("sort") || "newest";

    let query = db.select().from(pageEntries).where(eq(pageEntries.pageId, pageId));

    if (entryType) {
      query = db
        .select()
        .from(pageEntries)
        .where(
          and(
            eq(pageEntries.pageId, pageId),
            eq(pageEntries.entryType, entryType as "knowledge" | "decision" | "email_summary" | "manual"),
          ),
        );
    }

    const entries = await (sortBy === "oldest"
      ? query.orderBy(asc(pageEntries.createdAt))
      : query.orderBy(desc(pageEntries.createdAt)));

    return NextResponse.json({ entries, total: entries.length });
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("Error listing page entries:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/pages/[pageId]/entries — create a new entry
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> },
) {
  try {
    const user = await getRequiredUser();
    const { pageId } = await params;

    const page = await validatePageAccess(pageId, user.id);
    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      entry_type,
      title,
      content,
      metadata,
      source_id,
      source_type,
      confidence,
    } = body as {
      entry_type: "knowledge" | "decision" | "email_summary" | "manual";
      title?: string;
      content?: string;
      metadata?: Record<string, unknown>;
      source_id?: string;
      source_type?: string;
      confidence?: number;
    };

    if (!entry_type) {
      return NextResponse.json(
        { error: "entry_type is required" },
        { status: 400 },
      );
    }

    const [entry] = await db
      .insert(pageEntries)
      .values({
        pageId,
        entryType: entry_type,
        title: title ?? "",
        content: content ?? "",
        metadata: metadata ?? {},
        sourceId: source_id ?? null,
        sourceType: source_type ?? null,
        confidence: confidence ?? null,
        sortOrder: 0,
      })
      .returning();

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("Error creating page entry:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
