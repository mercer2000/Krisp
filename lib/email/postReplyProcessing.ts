import { getEmailDetail } from "@/lib/email/emails";
import { classifyItemForPages } from "@/lib/pageRules/classify";
import { resolveGraphSendContext } from "@/lib/graph/resolve";
import { fetchConversationThread } from "@/lib/graph/messages";
import { chatCompletion } from "@/lib/ai/client";
import { resolvePrompt } from "@/lib/ai/resolvePrompt";
import { PROMPT_THREAD_DECISION_EXTRACT } from "@/lib/ai/prompts";
import { db } from "@/lib/db";
import { pageEntries } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Process an outbound reply through the smart rule classification pipeline
 * and extract thread-level decisions for matched pages.
 *
 * Called via after() from reply/reply-all routes — never blocks the response.
 */
export async function processOutboundReply(params: {
  emailId: number;
  replyBody: string;
  userId: string;
  messageId: string;
}): Promise<void> {
  const { emailId, replyBody, userId, messageId } = params;

  // 1. Fetch original email for context
  let email;
  try {
    email = await getEmailDetail(emailId, userId);
  } catch (err) {
    console.error("[ReplyKnowledge] Failed to fetch email:", err);
    return;
  }
  if (!email) return;

  // 2. Build content string combining reply + original
  const content = [
    "REPLY:",
    replyBody,
    "",
    "ORIGINAL EMAIL:",
    `From: ${email.sender}`,
    `Subject: ${email.subject || "(No subject)"}`,
    (email.body_plain_text || "").slice(0, 2000),
  ].join("\n");

  // 3. Classify the reply through the page smart rules pipeline
  let result;
  try {
    result = await classifyItemForPages("email_reply", String(emailId), userId, { content });
  } catch (err) {
    console.error("[ReplyKnowledge] Classification failed:", err);
    return;
  }

  // 4. If classification matched pages and we have a messageId, extract thread decisions
  if (result.routed.length > 0 && messageId) {
    try {
      const graphResult = await resolveGraphSendContext(userId);
      if ("context" in graphResult) {
        const thread = await fetchConversationThread(
          graphResult.context.mailbox,
          graphResult.context.token,
          messageId
        );

        // Append user's reply as the latest message (Graph may not have indexed it yet)
        const fullThread = [
          ...thread,
          {
            from: "me",
            date: new Date().toISOString(),
            subject: email.subject || "",
            bodyPreview: replyBody.slice(0, 500),
          },
        ];

        await extractThreadDecisions({
          thread: fullThread,
          replyBody,
          matchedPages: result.routed.map((r) => ({
            pageId: r.pageId,
            pageTitle: r.pageTitle,
          })),
          emailId,
          userId,
        });
      }
    } catch (err) {
      console.error("[ReplyKnowledge] Thread decision extraction failed:", err);
    }
  }
}

/**
 * Analyze the full email thread to find decisions that emerged from
 * back-and-forth exchange, and insert them as page entries.
 */
async function extractThreadDecisions(params: {
  thread: Array<{ from: string; date: string; bodyPreview: string }>;
  replyBody: string;
  matchedPages: Array<{ pageId: string; pageTitle: string }>;
  emailId: number;
  userId: string;
}): Promise<void> {
  const { thread, replyBody, matchedPages, emailId, userId } = params;

  // Build thread summary
  const threadSummary = thread
    .map(
      (msg, i) =>
        `[${i + 1}] From: ${msg.from} | Date: ${msg.date}\n${msg.bodyPreview}`
    )
    .join("\n---\n");

  const instructions = await resolvePrompt(PROMPT_THREAD_DECISION_EXTRACT, userId);

  for (const page of matchedPages) {
    try {
      // Fetch existing entries for this email on this page to avoid duplicates
      const existingEntries = await db
        .select({ title: pageEntries.title, content: pageEntries.content })
        .from(pageEntries)
        .where(
          and(
            eq(pageEntries.pageId, page.pageId),
            eq(pageEntries.sourceId, String(emailId))
          )
        );

      const alreadyCaptured =
        existingEntries.length > 0
          ? "\n\nALREADY CAPTURED (do not duplicate):\n" +
            existingEntries.map((e) => `- ${e.title}: ${e.content.slice(0, 200)}`).join("\n")
          : "";

      const prompt = `${instructions}

Page: "${page.pageTitle}"

EMAIL THREAD:
${threadSummary}

USER'S LATEST REPLY:
${replyBody}${alreadyCaptured}`;

      const text = await chatCompletion(prompt, { maxTokens: 1000, userId });

      let entries: Array<{ entry_type: string; title: string; content: string }>;
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { entries: [] };
        entries = parsed.entries || [];
      } catch {
        console.error("[ReplyKnowledge] Failed to parse decision extraction:", text);
        continue;
      }

      // Insert new decision entries
      for (const entry of entries) {
        if (entry.entry_type !== "decision") continue;
        try {
          await db
            .insert(pageEntries)
            .values({
              pageId: page.pageId,
              entryType: "decision",
              title: (entry.title || "").slice(0, 500),
              content: entry.content || "",
              sourceType: "email_thread_decision",
              sourceId: String(emailId),
              metadata: { autoRouted: true, threadExtracted: true },
            })
            .onConflictDoNothing();
        } catch (err) {
          console.error(
            `[ReplyKnowledge] Failed to insert decision for page ${page.pageId}:`,
            err instanceof Error ? err.message : err
          );
        }
      }
    } catch (err) {
      console.error(
        `[ReplyKnowledge] Decision extraction failed for page ${page.pageId}:`,
        err instanceof Error ? err.message : err
      );
    }
  }
}
