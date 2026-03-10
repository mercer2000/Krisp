import { NextRequest, NextResponse } from "next/server";
import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { db } from "@/lib/db";
import { pages, blocks, workspaces, pageEntries } from "@/lib/db/schema";
import { eq, asc, desc } from "drizzle-orm";
import { chatCompletion, TokenLimitError } from "@/lib/ai/client";

const MAX_CONTEXT_CHARS = 8000;

function blocksToText(
  pageBlocks: { type: string; content: unknown }[],
): string {
  return pageBlocks
    .map((b) => {
      const c = b.content as Record<string, unknown> | null;
      const text =
        typeof c?.text === "string" ? c.text : "";
      if (!text) return "";
      if (b.type.startsWith("heading")) return `## ${text}`;
      if (b.type === "to_do") {
        const checked = c?.checked ? "[x]" : "[ ]";
        return `${checked} ${text}`;
      }
      if (b.type === "quote") return `> ${text}`;
      if (b.type === "code") return `\`\`\`\n${text}\n\`\`\``;
      return text;
    })
    .filter(Boolean)
    .join("\n");
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> },
) {
  try {
    const user = await getRequiredUser();
    const { pageId } = await params;

    const body = await request.json();
    const question = typeof body.question === "string" ? body.question.trim() : "";
    if (!question) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    // Fetch page and validate ownership
    const [page] = await db.select().from(pages).where(eq(pages.id, pageId));
    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, page.workspaceId));
    if (!workspace || workspace.ownerId !== user.id) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Gather page content as context
    const pageBlocks = await db
      .select()
      .from(blocks)
      .where(eq(blocks.pageId, pageId))
      .orderBy(asc(blocks.sortOrder));

    const entries = await db
      .select()
      .from(pageEntries)
      .where(eq(pageEntries.pageId, pageId))
      .orderBy(desc(pageEntries.createdAt))
      .limit(30);

    // Build context string
    let context = `Page: ${page.title}\n\n`;

    const notesText = blocksToText(pageBlocks);
    if (notesText) {
      context += `--- Notes ---\n${notesText}\n\n`;
    }

    if (entries.length > 0) {
      context += `--- Entries ---\n`;
      for (const entry of entries) {
        context += `[${entry.entryType}] ${entry.title}\n${entry.content}\n\n`;
      }
    }

    // Truncate context if too long
    if (context.length > MAX_CONTEXT_CHARS) {
      context = context.slice(0, MAX_CONTEXT_CHARS) + "\n...(truncated)";
    }

    const prompt = `You are a helpful assistant for the note-taking app MyOpenBrain. The user is viewing a page and asking a question about its content. Answer based on the page content provided below. Be concise and helpful. If the answer isn't in the content, say so honestly.

--- Page Content ---
${context}
--- End Page Content ---

User question: ${question}`;

    const answer = await chatCompletion(prompt, {
      maxTokens: 1000,
      userId: user.id,
    });

    return NextResponse.json({ answer });
  } catch (error) {
    if (error instanceof TokenLimitError) {
      return NextResponse.json(
        { error: "AI credit limit reached. Please check your API key limits." },
        { status: 402 },
      );
    }
    if (error instanceof Response) throw error;
    console.error("Error in page Q&A:", error);
    return NextResponse.json(
      { error: "Failed to get an answer" },
      { status: 500 },
    );
  }
}
