import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { getEmailDetail } from "@/lib/email/emails";
import { getGmailEmailById } from "@/lib/gmail/emails";
import { getActiveWatch, getValidAccessToken } from "@/lib/gmail/watch";
import { fetchGmailThread } from "@/lib/gmail/messages";
import { resolveGraphSendContext } from "@/lib/graph/resolve";
import { fetchConversationThread } from "@/lib/graph/messages";
import { chatCompletion, TokenLimitError } from "@/lib/ai/client";
import { resolvePrompt } from "@/lib/ai/resolvePrompt";
import { PROMPT_EMAIL_REPLY_DRAFT, PROMPT_EMAIL_FORWARD_DRAFT } from "@/lib/ai/prompts";
import { db } from "@/lib/db";
import { cards, columns, boards, pages, pageEntries, workspaces } from "@/lib/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface ReplyDraftRequest {
  action: "reply" | "reply_all" | "forward";
  contextLevel: "email_only" | "full_thread" | "thread_and_app";
}

/**
 * Fetch accumulated knowledge and decision entries from pages
 * that this email has been routed to via smart rules.
 */
async function fetchPageKnowledge(emailId: string, userId: string) {
  // Step 1: Find which pages this email was routed to
  const matchedEntries = await db
    .select({ pageId: pageEntries.pageId })
    .from(pageEntries)
    .innerJoin(pages, eq(pageEntries.pageId, pages.id))
    .innerJoin(workspaces, eq(pages.workspaceId, workspaces.id))
    .where(
      and(
        eq(pageEntries.sourceId, emailId),
        inArray(pageEntries.sourceType, ["email", "email_reply", "email_thread_decision"]),
        eq(workspaces.ownerId, userId),
        eq(pages.isArchived, false)
      )
    );

  const pageIds = [...new Set(matchedEntries.map((e) => e.pageId))];
  if (pageIds.length === 0) return [];

  // Step 2: Fetch ALL knowledge + decision entries from those pages
  const entries = await db
    .select({
      pageId: pageEntries.pageId,
      pageName: pages.title,
      entryType: pageEntries.entryType,
      title: pageEntries.title,
      content: pageEntries.content,
    })
    .from(pageEntries)
    .innerJoin(pages, eq(pageEntries.pageId, pages.id))
    .where(
      and(
        inArray(pageEntries.pageId, pageIds),
        inArray(pageEntries.entryType, ["knowledge", "decision"])
      )
    )
    .orderBy(desc(pageEntries.createdAt))
    .limit(10);

  // Group by page, decisions first
  const grouped = new Map<string, { pageName: string; entries: typeof entries }>();
  for (const entry of entries) {
    const existing = grouped.get(entry.pageId);
    if (existing) {
      existing.entries.push(entry);
    } else {
      grouped.set(entry.pageId, { pageName: entry.pageName, entries: [entry] });
    }
  }

  return Array.from(grouped.values()).map((g) => ({
    pageName: g.pageName,
    entries: g.entries.sort((a, b) =>
      a.entryType === "decision" && b.entryType !== "decision" ? -1 : 0
    ),
  }));
}

/**
 * POST /api/emails/[id]/reply-draft
 *
 * Generate an AI draft for reply, reply-all, or forward.
 * Context level controls how much data the AI receives.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body: ReplyDraftRequest = await request.json();
    const { action = "reply", contextLevel = "email_only" } = body;

    // Resolve email data — works for both Gmail (UUID) and Outlook (numeric)
    let emailData: { sender: string; recipients: string[]; cc: string[]; subject: string; bodyText: string; receivedAt: string; messageId: string | null; threadId: string | null; isGmail: boolean };

    if (UUID_REGEX.test(id)) {
      const gmailEmail = await getGmailEmailById(id, userId);
      if (!gmailEmail) {
        return NextResponse.json({ error: "Email not found" }, { status: 404 });
      }
      const recipients = Array.isArray(gmailEmail.recipients) ? gmailEmail.recipients : [];
      emailData = {
        sender: gmailEmail.sender,
        recipients: recipients as string[],
        cc: [],
        subject: gmailEmail.subject || "",
        bodyText: (gmailEmail.body_plain || "").trim(),
        receivedAt: gmailEmail.received_at ? String(gmailEmail.received_at) : "",
        messageId: gmailEmail.gmail_message_id,
        threadId: gmailEmail.thread_id,
        isGmail: true,
      };
    } else {
      const emailId = parseInt(id, 10);
      if (isNaN(emailId) || emailId < 1) {
        return NextResponse.json({ error: "Invalid email ID" }, { status: 400 });
      }
      const email = await getEmailDetail(emailId, userId);
      if (!email) {
        return NextResponse.json({ error: "Email not found" }, { status: 404 });
      }
      emailData = {
        sender: email.sender,
        recipients: email.recipients,
        cc: email.cc,
        subject: email.subject || "",
        bodyText: (email.body_plain_text || "").trim(),
        receivedAt: email.received_at,
        messageId: email.message_id,
        threadId: null,
        isGmail: false,
      };
    }

    // Skip generation for empty emails
    if (!emailData.bodyText || emailData.bodyText.length < 10) {
      return NextResponse.json({
        draft: "",
        intent: action === "forward" ? "fyi" : "acknowledgment",
      });
    }

    // Select the right prompt based on action
    const promptKey = action === "forward" ? PROMPT_EMAIL_FORWARD_DRAFT : PROMPT_EMAIL_REPLY_DRAFT;
    const promptTemplate = await resolvePrompt(promptKey, userId);

    // Build context based on level
    const contextParts: string[] = [];

    if (contextLevel === "full_thread" || contextLevel === "thread_and_app") {
      if (emailData.isGmail && emailData.threadId) {
        // Fetch thread from Gmail API
        try {
          const watch = await getActiveWatch(userId);
          if (watch) {
            const accessToken = await getValidAccessToken(watch);
            const thread = await fetchGmailThread(accessToken, emailData.threadId);
            if (thread.length > 1) {
              contextParts.push("CONVERSATION THREAD (oldest first):");
              for (const msg of thread) {
                const date = msg.date
                  ? new Date(msg.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  : "";
                contextParts.push("---");
                contextParts.push(`From: ${msg.from} | Date: ${date}`);
                contextParts.push(msg.bodyPreview.slice(0, 500));
              }
              contextParts.push("---");
              contextParts.push("");
            }
          }
        } catch {
          // Non-critical — continue without thread
        }
      } else if (!emailData.isGmail) {
        // Fetch thread from Graph API
        const graphResult = await resolveGraphSendContext(userId);
        if ("context" in graphResult && emailData.messageId) {
          const thread = await fetchConversationThread(
            graphResult.context.mailbox,
            graphResult.context.token,
            emailData.messageId
          );
          if (thread.length > 1) {
            contextParts.push("CONVERSATION THREAD (oldest first):");
            for (const msg of thread) {
              const date = msg.date
                ? new Date(msg.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                : "";
              contextParts.push("---");
              contextParts.push(`From: ${msg.from} | Date: ${date}`);
              contextParts.push(msg.bodyPreview.slice(0, 500));
            }
            contextParts.push("---");
            contextParts.push("");
          }
        }
      }
    }

    if (contextLevel === "thread_and_app") {
      // Fetch related Kanban cards (matching sender email or subject keywords)
      try {
        const senderEmail = emailData.sender;
        const recentCards = await db
          .select({
            title: cards.title,
            priority: cards.priority,
            dueDate: cards.dueDate,
            columnName: columns.title,
          })
          .from(cards)
          .innerJoin(columns, eq(cards.columnId, columns.id))
          .innerJoin(boards, eq(columns.boardId, boards.id))
          .where(
            and(
              eq(boards.userId, userId),
              eq(cards.archived, false)
            )
          )
          .orderBy(desc(cards.updatedAt))
          .limit(10);

        // Filter cards that mention the sender or subject keywords
        const subjectWords = (emailData.subject)
          .toLowerCase()
          .split(/\s+/)
          .filter((w) => w.length > 3);
        const relevantCards = recentCards.filter((c) => {
          const titleLower = c.title.toLowerCase();
          return (
            titleLower.includes(senderEmail.split("@")[0].toLowerCase()) ||
            subjectWords.some((w) => titleLower.includes(w))
          );
        });

        if (relevantCards.length > 0) {
          contextParts.push("RELATED WORK ITEMS:");
          for (const card of relevantCards.slice(0, 5)) {
            const parts = [`[Card] "${card.title}"`];
            if (card.priority) parts.push(`(${card.priority} priority`);
            if (card.dueDate) parts.push(`due ${new Date(card.dueDate).toLocaleDateString()}`);
            if (card.columnName) parts.push(`column: ${card.columnName})`);
            else if (card.priority) parts.push(")");
            contextParts.push(`- ${parts.join(" ")}`);
          }
          contextParts.push("");
        }
      } catch {
        // Non-critical — continue without app context
      }

      // Fetch page knowledge for matched pages
      try {
        const pageKnowledge = await fetchPageKnowledge(id, userId);
        if (pageKnowledge.length > 0) {
          contextParts.push("PAGE KNOWLEDGE (from your organized pages):");
          let charBudget = 3000;
          for (const page of pageKnowledge) {
            if (charBudget <= 0) break;
            contextParts.push(`\n[Page: "${page.pageName}"]`);
            for (const entry of page.entries) {
              const line = `- [${entry.entryType}] ${entry.title}: ${entry.content.slice(0, 300)}`;
              if (line.length > charBudget) break;
              contextParts.push(line);
              charBudget -= line.length;
            }
          }
          contextParts.push("");
        }
      } catch {
        // Non-critical — continue without page knowledge
      }
    }

    // Always include the current email
    contextParts.push("CURRENT EMAIL:");
    contextParts.push(`From: ${emailData.sender}`);
    contextParts.push(`To: ${emailData.recipients.join(", ")}`);
    if (emailData.cc.length) contextParts.push(`CC: ${emailData.cc.join(", ")}`);
    contextParts.push(`Subject: ${emailData.subject || "(No subject)"}`);
    contextParts.push(`Date: ${emailData.receivedAt}`);
    contextParts.push(`Body: ${emailData.bodyText.slice(0, 2000)}`);

    if (action === "forward") {
      contextParts.push("");
      contextParts.push("ACTION: Forwarding this email to a new recipient.");
    } else if (action === "reply_all") {
      contextParts.push("");
      contextParts.push("ACTION: Replying to all recipients of this email.");
    } else {
      contextParts.push("");
      contextParts.push("ACTION: Replying to the sender of this email.");
    }

    const fullPrompt = `${promptTemplate}\n\n${contextParts.join("\n")}`;
    const raw = await chatCompletion(fullPrompt, {
      maxTokens: action === "forward" ? 300 : 500,
      userId,
      triggerType: "email_reply_draft",
      promptKey: promptKey,
      entityType: "email",
      entityId: id,
    });

    // Parse JSON response
    let draft = "";
    let intent = action === "forward" ? "fyi" : "acknowledgment";
    try {
      const parsed = JSON.parse(raw);
      if (parsed.draft ?? parsed.message) draft = parsed.draft ?? parsed.message;
      if (parsed.intent) intent = parsed.intent;
    } catch {
      draft = raw;
    }

    return NextResponse.json({ draft, intent });
  } catch (err) {
    if (err instanceof TokenLimitError) {
      return NextResponse.json({ error: err.message }, { status: 402 });
    }
    console.error("Error generating reply draft:", err);
    return NextResponse.json({ draft: "", intent: "acknowledgment" });
  }
}
