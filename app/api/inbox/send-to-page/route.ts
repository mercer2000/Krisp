import { NextRequest, NextResponse } from "next/server";
import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { db } from "@/lib/db";
import { pages, pageEntries, workspaces, cards, columns, boards } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
// Lazy-load to avoid jsdom ESM issues at build time
let _DOMPurify: typeof import("isomorphic-dompurify").default | null = null;
async function getDOMPurify() {
  if (!_DOMPurify) {
    const mod = await import("isomorphic-dompurify");
    _DOMPurify = mod.default;
  }
  return _DOMPurify;
}

// POST /api/inbox/send-to-page — forward email content to a page entry or kanban card
export async function POST(request: NextRequest) {
  try {
    const user = await getRequiredUser();
    const body = await request.json();
    const {
      destination_type,
      destination_id,
      emails,
      selected_text,
      create_new_page,
      new_page_title,
      workspace_id,
    } = body as {
      destination_type: "page" | "card";
      destination_id?: string;
      emails: Array<{
        id: string | number;
        sender: string;
        subject: string | null;
        received_at: string;
        body_plain?: string | null;
        body_html?: string | null;
        preview?: string | null;
      }>;
      selected_text?: string;
      create_new_page?: boolean;
      new_page_title?: string;
      workspace_id?: string;
    };

    if (!emails || emails.length === 0) {
      return NextResponse.json(
        { error: "At least one email is required" },
        { status: 400 },
      );
    }

    // ── Create new page if requested ──
    let targetPageId = destination_id;
    let targetPageTitle = "";

    if (create_new_page && workspace_id) {
      // Validate workspace ownership
      const [workspace] = await db
        .select()
        .from(workspaces)
        .where(eq(workspaces.id, workspace_id));
      if (!workspace || workspace.ownerId !== user.id) {
        return NextResponse.json(
          { error: "Workspace not found" },
          { status: 404 },
        );
      }

      const title =
        new_page_title ||
        (emails.length === 1
          ? emails[0].subject || "Forwarded Email"
          : `${emails.length} Forwarded Emails`);

      const [newPage] = await db
        .insert(pages)
        .values({
          workspaceId: workspace_id,
          title,
          createdBy: user.id,
          pageType: "knowledge",
          sortOrder: 0,
        })
        .returning();

      targetPageId = newPage.id;
      targetPageTitle = title;
    }

    // ── Send to Page (page entry) ──
    if (destination_type === "page") {
      if (!targetPageId) {
        return NextResponse.json(
          { error: "destination_id or create_new_page is required" },
          { status: 400 },
        );
      }

      // Validate page ownership
      const [page] = await db
        .select()
        .from(pages)
        .where(eq(pages.id, targetPageId));
      if (!page) {
        return NextResponse.json(
          { error: "Page not found or has been deleted" },
          { status: 404 },
        );
      }
      const [workspace] = await db
        .select()
        .from(workspaces)
        .where(eq(workspaces.id, page.workspaceId));
      if (!workspace || workspace.ownerId !== user.id) {
        return NextResponse.json(
          { error: "Page not found" },
          { status: 404 },
        );
      }

      targetPageTitle = page.title;

      // Create page entries for each email
      const createdEntries = [];
      for (const email of emails) {
        const content = selected_text
          ? await sanitize(selected_text)
          : await buildEmailContent(email);
        const title = selected_text
          ? `Excerpt from: ${email.subject || "(No subject)"}`
          : email.subject || "(No subject)";

        const [entry] = await db
          .insert(pageEntries)
          .values({
            pageId: targetPageId,
            entryType: "email_summary",
            title,
            content,
            metadata: {
              sender: email.sender,
              received_at: email.received_at,
              subject: email.subject,
              email_id: String(email.id),
              is_excerpt: !!selected_text,
            },
            sourceId: String(email.id),
            sourceType: "email",
            sortOrder: 0,
          })
          .returning();

        createdEntries.push(entry);
      }

      return NextResponse.json(
        {
          success: true,
          destination_type: "page",
          destination_id: targetPageId,
          destination_title: targetPageTitle,
          entries_created: createdEntries.length,
        },
        { status: 201 },
      );
    }

    // ── Send to Kanban Card ──
    if (destination_type === "card") {
      if (!targetPageId) {
        // destination_id is actually card_id here
        return NextResponse.json(
          { error: "destination_id (card ID) is required" },
          { status: 400 },
        );
      }

      // Verify card ownership
      const [card] = await db
        .select({
          id: cards.id,
          title: cards.title,
          description: cards.description,
        })
        .from(cards)
        .innerJoin(columns, eq(cards.columnId, columns.id))
        .innerJoin(boards, eq(columns.boardId, boards.id))
        .where(and(eq(cards.id, targetPageId), eq(boards.userId, user.id)));

      if (!card) {
        return NextResponse.json(
          { error: "Card not found or has been deleted" },
          { status: 404 },
        );
      }

      // Append email content to card description
      const emailParts = [];
      for (const email of emails) {
        const content = selected_text
          ? await sanitize(selected_text)
          : await buildEmailContent(email);
        const citation = `From: ${email.sender} | ${new Date(email.received_at).toLocaleDateString()}`;
        emailParts.push(`\n\n---\n**${email.subject || "(No subject)"}**\n_${citation}_\n\n${content}`);
      }
      const emailContent = emailParts.join("");

      const updatedDescription = (card.description || "") + emailContent;

      await db
        .update(cards)
        .set({ description: updatedDescription, updatedAt: new Date() })
        .where(eq(cards.id, targetPageId));

      return NextResponse.json(
        {
          success: true,
          destination_type: "card",
          destination_id: targetPageId,
          destination_title: card.title,
        },
        { status: 201 },
      );
    }

    return NextResponse.json(
      { error: "Invalid destination_type" },
      { status: 400 },
    );
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("Error forwarding to page:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

async function sanitize(html: string): Promise<string> {
  const DOMPurify = await getDOMPurify();
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "em", "b", "i", "u", "a", "ul", "ol", "li",
      "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "pre", "code",
    ],
    ALLOWED_ATTR: ["href", "target", "rel"],
  });
}

async function buildEmailContent(email: {
  sender: string;
  subject: string | null;
  received_at: string;
  body_plain?: string | null;
  body_html?: string | null;
  preview?: string | null;
}): Promise<string> {
  const body = email.body_plain || email.preview || "";
  // Truncate very long email bodies to first 5000 chars
  const truncated =
    body.length > 5000 ? body.slice(0, 5000) + "\n\n[...truncated]" : body;
  return sanitize(truncated);
}
