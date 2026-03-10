# Email Reply, Reply All & Forward Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Reply, Reply All, and Forward with manual + AI modes to the email detail page for Outlook users, using Microsoft Graph native threading endpoints.

**Architecture:** Inline compose pane below email body with split buttons in header. Graph's native reply/replyAll/forward endpoints preserve email threading. AI draft generation with 3 context levels (email only, full thread, thread + app data). Markdown compose with preview, tag/chip inputs for recipients.

**Tech Stack:** Next.js API routes, Microsoft Graph API v1.0, react-markdown + remark-gfm (client preview), marked (server HTML conversion), existing AI client (OpenRouter)

---

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install packages**

Run:
```bash
npm install react-markdown remark-gfm marked @types/marked
```

**Step 2: Verify installation**

Run: `cat package.json | grep -E "react-markdown|remark-gfm|marked"`

Expected: All three packages listed in dependencies.

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add react-markdown, remark-gfm, marked for compose pane"
```

---

### Task 2: Graph Library — Reply, ReplyAll, Forward, Thread Functions

**Files:**
- Modify: `lib/graph/messages.ts` (after line 165)

**Step 1: Add `replyGraphMessage` function**

Append to `lib/graph/messages.ts`:

```typescript
/**
 * Reply to a message via Microsoft Graph API.
 * Uses the native reply endpoint which preserves email threading.
 * The `message.body` replaces the default reply body; Graph still quotes the original.
 */
export async function replyGraphMessage(
  userMailbox: string,
  accessToken: string,
  messageId: string,
  options: {
    bodyHtml: string;
    to?: string[];
    cc?: string[];
    bcc?: string[];
  }
): Promise<boolean> {
  const url = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(userMailbox)}/messages/${encodeURIComponent(messageId)}/reply`;

  const message: Record<string, unknown> = {
    body: { contentType: "HTML", content: options.bodyHtml },
  };
  if (options.to?.length) {
    message.toRecipients = options.to.map((e) => ({ emailAddress: { address: e } }));
  }
  if (options.cc?.length) {
    message.ccRecipients = options.cc.map((e) => ({ emailAddress: { address: e } }));
  }
  if (options.bcc?.length) {
    message.bccRecipients = options.bcc.map((e) => ({ emailAddress: { address: e } }));
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    if (res.status === 202 || res.status === 200) return true;

    const body = await res.text().catch(() => "");
    console.warn(`[Graph] Failed to reply to ${messageId}: ${res.status}`, body);
    return false;
  } catch (err) {
    console.warn(`[Graph] Error replying to ${messageId}:`, err);
    return false;
  }
}
```

**Step 2: Add `replyAllGraphMessage` function**

Append to `lib/graph/messages.ts`:

```typescript
/**
 * Reply-all to a message via Microsoft Graph API.
 * Preserves all original recipients; optional overrides for to/cc/bcc.
 */
export async function replyAllGraphMessage(
  userMailbox: string,
  accessToken: string,
  messageId: string,
  options: {
    bodyHtml: string;
    to?: string[];
    cc?: string[];
    bcc?: string[];
  }
): Promise<boolean> {
  const url = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(userMailbox)}/messages/${encodeURIComponent(messageId)}/replyAll`;

  const message: Record<string, unknown> = {
    body: { contentType: "HTML", content: options.bodyHtml },
  };
  if (options.to?.length) {
    message.toRecipients = options.to.map((e) => ({ emailAddress: { address: e } }));
  }
  if (options.cc?.length) {
    message.ccRecipients = options.cc.map((e) => ({ emailAddress: { address: e } }));
  }
  if (options.bcc?.length) {
    message.bccRecipients = options.bcc.map((e) => ({ emailAddress: { address: e } }));
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    if (res.status === 202 || res.status === 200) return true;

    const body = await res.text().catch(() => "");
    console.warn(`[Graph] Failed to replyAll to ${messageId}: ${res.status}`, body);
    return false;
  } catch (err) {
    console.warn(`[Graph] Error replying all to ${messageId}:`, err);
    return false;
  }
}
```

**Step 3: Add `forwardGraphMessage` function**

This uses a 3-step approach (createForward → patch body → send) to support HTML content in the forward preamble while preserving threading.

Append to `lib/graph/messages.ts`:

```typescript
/**
 * Forward a message via Microsoft Graph API with HTML body.
 * Uses createForward → patch draft → send pattern to support HTML
 * while preserving email threading.
 */
export async function forwardGraphMessage(
  userMailbox: string,
  accessToken: string,
  messageId: string,
  options: {
    bodyHtml: string;
    to: string[];
    cc?: string[];
    bcc?: string[];
  }
): Promise<boolean> {
  const baseUrl = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(userMailbox)}`;
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  try {
    // Step 1: Create forward draft
    const createRes = await fetch(
      `${baseUrl}/messages/${encodeURIComponent(messageId)}/createForward`,
      { method: "POST", headers }
    );

    if (!createRes.ok) {
      const body = await createRes.text().catch(() => "");
      console.warn(`[Graph] Failed to createForward for ${messageId}: ${createRes.status}`, body);
      return false;
    }

    const draft = await createRes.json();
    const draftId = draft.id;

    // Step 2: Update draft with HTML body and recipients
    const patchPayload: Record<string, unknown> = {
      body: { contentType: "HTML", content: options.bodyHtml },
      toRecipients: options.to.map((e) => ({ emailAddress: { address: e } })),
    };
    if (options.cc?.length) {
      patchPayload.ccRecipients = options.cc.map((e) => ({ emailAddress: { address: e } }));
    }
    if (options.bcc?.length) {
      patchPayload.bccRecipients = options.bcc.map((e) => ({ emailAddress: { address: e } }));
    }

    const patchRes = await fetch(
      `${baseUrl}/messages/${encodeURIComponent(draftId)}`,
      { method: "PATCH", headers, body: JSON.stringify(patchPayload) }
    );

    if (!patchRes.ok) {
      const body = await patchRes.text().catch(() => "");
      console.warn(`[Graph] Failed to patch forward draft ${draftId}: ${patchRes.status}`, body);
      return false;
    }

    // Step 3: Send the draft
    const sendRes = await fetch(
      `${baseUrl}/messages/${encodeURIComponent(draftId)}/send`,
      { method: "POST", headers }
    );

    if (sendRes.status === 202 || sendRes.status === 200) return true;

    const body = await sendRes.text().catch(() => "");
    console.warn(`[Graph] Failed to send forward draft ${draftId}: ${sendRes.status}`, body);
    return false;
  } catch (err) {
    console.warn(`[Graph] Error forwarding message ${messageId}:`, err);
    return false;
  }
}
```

**Step 4: Add `fetchConversationThread` function**

Append to `lib/graph/messages.ts`:

```typescript
/**
 * Fetch the conversation thread for a message.
 * First fetches the message's conversationId, then retrieves all messages
 * in that conversation ordered chronologically.
 */
export async function fetchConversationThread(
  userMailbox: string,
  accessToken: string,
  messageId: string
): Promise<
  {
    from: string;
    date: string;
    subject: string;
    bodyPreview: string;
  }[]
> {
  const baseUrl = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(userMailbox)}`;
  const headers = { Authorization: `Bearer ${accessToken}` };

  try {
    // Step 1: Get conversationId from the message
    const msgRes = await fetch(
      `${baseUrl}/messages/${encodeURIComponent(messageId)}?$select=conversationId`,
      { headers }
    );
    if (!msgRes.ok) return [];

    const msg = await msgRes.json();
    const conversationId = msg.conversationId;
    if (!conversationId) return [];

    // Step 2: Fetch all messages in this conversation
    const threadRes = await fetch(
      `${baseUrl}/messages?$filter=conversationId eq '${conversationId}'&$select=from,receivedDateTime,subject,bodyPreview&$orderby=receivedDateTime asc&$top=25`,
      { headers }
    );
    if (!threadRes.ok) return [];

    const threadData = await threadRes.json();
    return (threadData.value || []).map(
      (m: {
        from?: { emailAddress?: { address?: string } };
        receivedDateTime?: string;
        subject?: string;
        bodyPreview?: string;
      }) => ({
        from: m.from?.emailAddress?.address || "unknown",
        date: m.receivedDateTime || "",
        subject: m.subject || "",
        bodyPreview: m.bodyPreview || "",
      })
    );
  } catch (err) {
    console.warn(`[Graph] Error fetching conversation thread:`, err);
    return [];
  }
}
```

**Step 5: Commit**

```bash
git add lib/graph/messages.ts
git commit -m "feat: add Graph reply, replyAll, forward, and thread functions"
```

---

### Task 3: Shared Graph Credential Resolution Helper

**Files:**
- Create: `lib/graph/resolve.ts`

The forward route has credential resolution logic (~30 lines) that will be repeated in reply and reply-all routes. Extract it into a shared helper.

**Step 1: Create the helper**

Create `lib/graph/resolve.ts`:

```typescript
import { db } from "@/lib/db";
import { graphSubscriptions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  getGraphCredentialsByIdUnsafe,
  getGraphAccessTokenFromCreds,
} from "@/lib/graph/credentials";
import { extractUserFromResource } from "@/lib/graph/messages";

export interface GraphSendContext {
  token: string;
  mailbox: string;
}

/**
 * Resolve the Graph API credentials and mailbox for sending emails.
 * Finds the first active graph subscription for the user and returns
 * an access token + mailbox address.
 *
 * Returns null with an error message if credentials can't be resolved.
 */
export async function resolveGraphSendContext(
  userId: string
): Promise<{ context: GraphSendContext } | { error: string; status: number }> {
  const [subscription] = await db
    .select()
    .from(graphSubscriptions)
    .where(
      and(
        eq(graphSubscriptions.tenantId, userId),
        eq(graphSubscriptions.active, true)
      )
    );

  if (!subscription?.credentialId) {
    return {
      error: "No active email integration found. Please connect an email account to send messages.",
      status: 502,
    };
  }

  const creds = await getGraphCredentialsByIdUnsafe(subscription.credentialId);
  if (!creds) {
    return {
      error: "Email integration credentials are missing. Please reconnect your email account.",
      status: 502,
    };
  }

  const token = await getGraphAccessTokenFromCreds(creds);
  const mailbox = extractUserFromResource(subscription.resource);
  if (!mailbox) {
    return {
      error: "Unable to determine sending mailbox. Please reconnect your email account.",
      status: 502,
    };
  }

  return { context: { token, mailbox } };
}
```

**Step 2: Commit**

```bash
git add lib/graph/resolve.ts
git commit -m "feat: extract shared Graph credential resolution helper"
```

---

### Task 4: Markdown-to-Email-Safe-HTML Utility

**Files:**
- Create: `lib/email/markdownToHtml.ts`

**Step 1: Create the utility**

Create `lib/email/markdownToHtml.ts`:

```typescript
import { marked } from "marked";

/**
 * Convert markdown to email-safe HTML with inline styles.
 * Email clients strip <style> tags and CSS classes, so everything
 * must be inline.
 */
export function markdownToEmailHtml(markdown: string): string {
  const rawHtml = marked.parse(markdown, { async: false }) as string;

  // Wrap in email-safe container with inline styles
  return `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.6; color: #1a1a1a;">
${rawHtml
  .replace(/<p>/g, '<p style="margin: 0 0 12px 0;">')
  .replace(/<a /g, '<a style="color: #2563eb;" ')
  .replace(/<strong>/g, '<strong style="font-weight: 600;">')
  .replace(/<ul>/g, '<ul style="margin: 0 0 12px 0; padding-left: 20px;">')
  .replace(/<ol>/g, '<ol style="margin: 0 0 12px 0; padding-left: 20px;">')
  .replace(/<li>/g, '<li style="margin: 0 0 4px 0;">')
  .replace(/<blockquote>/g, '<blockquote style="margin: 0 0 12px 0; padding: 8px 12px; border-left: 3px solid #d1d5db; color: #6b7280;">')
  .replace(/<code>/g, '<code style="font-family: monospace; font-size: 13px; background: #f3f4f6; padding: 1px 4px; border-radius: 3px;">')
  .replace(/<pre>/g, '<pre style="font-family: monospace; font-size: 13px; background: #f3f4f6; padding: 12px; border-radius: 6px; overflow-x: auto; margin: 0 0 12px 0;">')
  .replace(/<h1>/g, '<h1 style="font-size: 20px; font-weight: 600; margin: 0 0 8px 0;">')
  .replace(/<h2>/g, '<h2 style="font-size: 18px; font-weight: 600; margin: 0 0 8px 0;">')
  .replace(/<h3>/g, '<h3 style="font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">')
  .replace(/<hr>/g, '<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;">')
  .replace(/<table>/g, '<table style="border-collapse: collapse; margin: 0 0 12px 0;">')
  .replace(/<th>/g, '<th style="border: 1px solid #d1d5db; padding: 6px 10px; font-weight: 600; background: #f9fafb;">')
  .replace(/<td>/g, '<td style="border: 1px solid #d1d5db; padding: 6px 10px;">')}
</div>`;
}
```

**Step 2: Commit**

```bash
git add lib/email/markdownToHtml.ts
git commit -m "feat: add markdown-to-email-safe-HTML converter"
```

---

### Task 5: Reply Draft AI Prompt

**Files:**
- Modify: `lib/ai/prompts.ts`

**Step 1: Add prompt key constant**

Add after line 57 (`PROMPT_EMAIL_FORWARD_DRAFT`):

```typescript
export const PROMPT_EMAIL_REPLY_DRAFT = "email_reply_draft";
```

**Step 2: Add prompt definition to `PROMPT_DEFAULTS` registry**

Add a new entry in the `PROMPT_DEFAULTS` object, after the `PROMPT_EMAIL_FORWARD_DRAFT` entry (after line 439):

```typescript
  [PROMPT_EMAIL_REPLY_DRAFT]: {
    key: PROMPT_EMAIL_REPLY_DRAFT,
    name: "Email Reply Draft",
    description: "Generates contextually appropriate email reply drafts based on conversation thread and optional work items.",
    category: "Email Processing",
    defaultText: `You are a professional email reply assistant. Generate a draft reply to the email below.

You will receive context at one of three levels:
1. CURRENT EMAIL ONLY — Just the email being replied to.
2. FULL THREAD — The entire conversation thread, oldest first.
3. THREAD + WORK ITEMS — Thread plus related Kanban cards, action items, and meeting notes.

Guidelines:
- Write a professional, contextually appropriate reply in markdown format
- Keep it concise: 3-5 sentences for most replies
- Address the specific questions or requests in the email
- If work items are provided and relevant (e.g., delivery dates, project status), incorporate that awareness naturally
- Match the communication tone from the thread (formal vs casual, brief vs detailed)
- Do NOT include a subject line, email headers, or signatures
- Do NOT include greetings like "Hi [Name]" — start directly with the response content
- Output markdown only, no wrapping code fences

Respond with ONLY a JSON object:
{"draft": "<your markdown reply>", "intent": "<category>"}

INTENT CATEGORIES:
- acknowledgment: Confirming receipt or understanding
- answer: Directly answering a question
- action_commit: Committing to do something requested
- pushback: Declining or suggesting alternatives
- info_request: Asking for more information before proceeding
- follow_up: Following up on a previous discussion
- delegation: Redirecting to someone else`,
  },
```

**Step 3: Commit**

```bash
git add lib/ai/prompts.ts
git commit -m "feat: add email reply draft AI prompt"
```

---

### Task 6: API Route — Reply Draft (AI Generation)

**Files:**
- Create: `app/api/emails/[id]/reply-draft/route.ts`

**Step 1: Create the route**

Create `app/api/emails/[id]/reply-draft/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { getEmailDetail } from "@/lib/email/emails";
import { resolveGraphSendContext } from "@/lib/graph/resolve";
import { fetchConversationThread } from "@/lib/graph/messages";
import { chatCompletion, TokenLimitError } from "@/lib/ai/client";
import { resolvePrompt } from "@/lib/ai/resolvePrompt";
import { PROMPT_EMAIL_REPLY_DRAFT, PROMPT_EMAIL_FORWARD_DRAFT } from "@/lib/ai/prompts";
import { db } from "@/lib/db";
import { cards, columns, boards } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface ReplyDraftRequest {
  action: "reply" | "reply_all" | "forward";
  contextLevel: "email_only" | "full_thread" | "thread_and_app";
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

    // Only support Outlook emails (numeric IDs)
    if (UUID_REGEX.test(id)) {
      return NextResponse.json(
        { error: "AI drafts are only supported for Outlook emails" },
        { status: 400 }
      );
    }

    const emailId = parseInt(id, 10);
    if (isNaN(emailId) || emailId < 1) {
      return NextResponse.json({ error: "Invalid email ID" }, { status: 400 });
    }

    const email = await getEmailDetail(emailId, userId);
    if (!email) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    // Skip generation for empty emails
    const bodyText = email.body_plain_text?.trim();
    if (!bodyText || bodyText.length < 10) {
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
      // Fetch thread from Graph API
      const graphResult = await resolveGraphSendContext(userId);
      if ("context" in graphResult && email.message_id) {
        const thread = await fetchConversationThread(
          graphResult.context.mailbox,
          graphResult.context.token,
          email.message_id
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

    if (contextLevel === "thread_and_app") {
      // Fetch related Kanban cards (matching sender email or subject keywords)
      try {
        const senderEmail = email.sender;
        const recentCards = await db
          .select({
            title: cards.title,
            priority: cards.priority,
            dueDate: cards.dueDate,
            columnName: columns.name,
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
        const subjectWords = (email.subject || "")
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
    }

    // Always include the current email
    contextParts.push("CURRENT EMAIL:");
    contextParts.push(`From: ${email.sender}`);
    contextParts.push(`To: ${email.recipients.join(", ")}`);
    if (email.cc.length) contextParts.push(`CC: ${email.cc.join(", ")}`);
    contextParts.push(`Subject: ${email.subject || "(No subject)"}`);
    contextParts.push(`Date: ${email.received_at}`);
    contextParts.push(`Body: ${bodyText.slice(0, 2000)}`);

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
```

**Step 2: Commit**

```bash
git add app/api/emails/[id]/reply-draft/route.ts
git commit -m "feat: add AI reply draft API with 3 context levels"
```

---

### Task 7: API Route — Reply

**Files:**
- Create: `app/api/emails/[id]/reply/route.ts`

**Step 1: Create the route**

Create `app/api/emails/[id]/reply/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { getEmailDetail } from "@/lib/email/emails";
import { resolveGraphSendContext } from "@/lib/graph/resolve";
import { replyGraphMessage } from "@/lib/graph/messages";
import { markdownToEmailHtml } from "@/lib/email/markdownToHtml";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ReplyRequest {
  bodyMarkdown: string;
  to?: string[];
  cc?: string[];
  bcc?: string[];
}

/**
 * POST /api/emails/[id]/reply
 *
 * Send a reply to an Outlook email via Microsoft Graph.
 * Converts markdown body to email-safe HTML.
 * Uses Graph's native reply endpoint for proper threading.
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
    const emailId = parseInt(id, 10);
    if (isNaN(emailId) || emailId < 1) {
      return NextResponse.json({ error: "Invalid email ID" }, { status: 400 });
    }

    const body: ReplyRequest = await request.json();
    if (!body.bodyMarkdown?.trim()) {
      return NextResponse.json({ error: "Reply body is required" }, { status: 400 });
    }

    // Validate email addresses if provided
    for (const list of [body.to, body.cc, body.bcc]) {
      if (list?.some((e) => !EMAIL_REGEX.test(e))) {
        return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
      }
    }

    const email = await getEmailDetail(emailId, userId);
    if (!email) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    if (!email.message_id) {
      return NextResponse.json(
        { error: "Cannot reply: email has no Graph message ID" },
        { status: 400 }
      );
    }

    const graphResult = await resolveGraphSendContext(userId);
    if ("error" in graphResult) {
      return NextResponse.json(
        { error: graphResult.error },
        { status: graphResult.status }
      );
    }

    const bodyHtml = markdownToEmailHtml(body.bodyMarkdown);
    const sent = await replyGraphMessage(
      graphResult.context.mailbox,
      graphResult.context.token,
      email.message_id,
      {
        bodyHtml,
        to: body.to,
        cc: body.cc,
        bcc: body.bcc,
      }
    );

    if (!sent) {
      return NextResponse.json(
        { error: "Failed to send reply. Your email account may need additional permissions." },
        { status: 502 }
      );
    }

    return NextResponse.json({ message: "Reply sent" });
  } catch (error) {
    console.error("Error sending reply:", error);
    return NextResponse.json({ error: "Failed to send reply" }, { status: 500 });
  }
}
```

**Step 2: Commit**

```bash
git add app/api/emails/[id]/reply/route.ts
git commit -m "feat: add reply API route using Graph native endpoint"
```

---

### Task 8: API Route — Reply All

**Files:**
- Create: `app/api/emails/[id]/reply-all/route.ts`

**Step 1: Create the route**

Create `app/api/emails/[id]/reply-all/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { getEmailDetail } from "@/lib/email/emails";
import { resolveGraphSendContext } from "@/lib/graph/resolve";
import { replyAllGraphMessage } from "@/lib/graph/messages";
import { markdownToEmailHtml } from "@/lib/email/markdownToHtml";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ReplyAllRequest {
  bodyMarkdown: string;
  to?: string[];
  cc?: string[];
  bcc?: string[];
}

/**
 * POST /api/emails/[id]/reply-all
 *
 * Send a reply-all to an Outlook email via Microsoft Graph.
 * Converts markdown body to email-safe HTML.
 * Uses Graph's native replyAll endpoint for proper threading.
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
    const emailId = parseInt(id, 10);
    if (isNaN(emailId) || emailId < 1) {
      return NextResponse.json({ error: "Invalid email ID" }, { status: 400 });
    }

    const body: ReplyAllRequest = await request.json();
    if (!body.bodyMarkdown?.trim()) {
      return NextResponse.json({ error: "Reply body is required" }, { status: 400 });
    }

    for (const list of [body.to, body.cc, body.bcc]) {
      if (list?.some((e) => !EMAIL_REGEX.test(e))) {
        return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
      }
    }

    const email = await getEmailDetail(emailId, userId);
    if (!email) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    if (!email.message_id) {
      return NextResponse.json(
        { error: "Cannot reply: email has no Graph message ID" },
        { status: 400 }
      );
    }

    const graphResult = await resolveGraphSendContext(userId);
    if ("error" in graphResult) {
      return NextResponse.json(
        { error: graphResult.error },
        { status: graphResult.status }
      );
    }

    const bodyHtml = markdownToEmailHtml(body.bodyMarkdown);
    const sent = await replyAllGraphMessage(
      graphResult.context.mailbox,
      graphResult.context.token,
      email.message_id,
      {
        bodyHtml,
        to: body.to,
        cc: body.cc,
        bcc: body.bcc,
      }
    );

    if (!sent) {
      return NextResponse.json(
        { error: "Failed to send reply. Your email account may need additional permissions." },
        { status: 502 }
      );
    }

    return NextResponse.json({ message: "Reply sent to all" });
  } catch (error) {
    console.error("Error sending reply-all:", error);
    return NextResponse.json({ error: "Failed to send reply" }, { status: 500 });
  }
}
```

**Step 2: Commit**

```bash
git add app/api/emails/[id]/reply-all/route.ts
git commit -m "feat: add reply-all API route using Graph native endpoint"
```

---

### Task 9: Refactor Forward Route

**Files:**
- Modify: `app/api/emails/[id]/forward/route.ts`

Refactor the existing forward route to:
1. Use `resolveGraphSendContext` helper (DRY)
2. Use `forwardGraphMessage` (Graph native forward with threading)
3. Accept markdown body instead of plain text
4. Support CC/BCC

**Step 1: Rewrite the forward route**

Replace the entire file `app/api/emails/[id]/forward/route.ts` with:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { getEmailDetail } from "@/lib/email/emails";
import { getGmailEmailById } from "@/lib/gmail/emails";
import { resolveGraphSendContext } from "@/lib/graph/resolve";
import { forwardGraphMessage } from "@/lib/graph/messages";
import { markdownToEmailHtml } from "@/lib/email/markdownToHtml";
import { chatCompletion, TokenLimitError } from "@/lib/ai/client";
import { resolvePrompt } from "@/lib/ai/resolvePrompt";
import { PROMPT_EMAIL_FORWARD_DRAFT } from "@/lib/ai/prompts";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ForwardRequestBody {
  bodyMarkdown?: string;
  to?: string[];
  cc?: string[];
  bcc?: string[];
  /** @deprecated Use reply-draft endpoint instead. Kept for backward compat. */
  generateDraft?: boolean;
  /** @deprecated */
  recipientEmail?: string;
  /** @deprecated */
  message?: string;
}

type ForwardIntent = "delegation" | "fyi" | "escalation" | "action_request" | "approval" | "context" | "follow_up";

/**
 * POST /api/emails/[id]/forward
 *
 * Forward an email via Microsoft Graph's native forward endpoint.
 * Supports markdown body (converted to HTML) with proper threading.
 *
 * Also supports legacy format (recipientEmail + message) for backward compatibility.
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
    const body: ForwardRequestBody = await request.json();

    // Legacy: generateDraft support (redirect to reply-draft in future)
    if (body.generateDraft) {
      return handleLegacyDraftGeneration(id, userId, body);
    }

    // Resolve recipients — support both new (to[]) and legacy (recipientEmail) format
    const toRecipients = body.to?.length
      ? body.to
      : body.recipientEmail
        ? [body.recipientEmail]
        : [];

    if (!toRecipients.length || toRecipients.some((e) => !EMAIL_REGEX.test(e))) {
      return NextResponse.json(
        { error: "At least one valid recipient email is required" },
        { status: 400 }
      );
    }

    for (const list of [body.cc, body.bcc]) {
      if (list?.some((e) => !EMAIL_REGEX.test(e))) {
        return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
      }
    }

    // Fetch email — support both Outlook (numeric) and Gmail (UUID)
    let messageId: string | null = null;
    let subject: string | null = null;

    if (UUID_REGEX.test(id)) {
      const gmailEmail = await getGmailEmailById(id, userId);
      if (!gmailEmail) {
        return NextResponse.json({ error: "Email not found" }, { status: 404 });
      }
      // Gmail emails can't use Graph forward — fall back error
      return NextResponse.json(
        { error: "Forwarding is only supported for Outlook emails" },
        { status: 400 }
      );
    }

    const emailId = parseInt(id, 10);
    if (isNaN(emailId) || emailId < 1) {
      return NextResponse.json({ error: "Invalid email ID" }, { status: 400 });
    }

    const email = await getEmailDetail(emailId, userId);
    if (!email) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    messageId = email.message_id;
    subject = email.subject;

    if (!messageId) {
      return NextResponse.json(
        { error: "Cannot forward: email has no Graph message ID" },
        { status: 400 }
      );
    }

    const graphResult = await resolveGraphSendContext(userId);
    if ("error" in graphResult) {
      return NextResponse.json(
        { error: graphResult.error },
        { status: graphResult.status }
      );
    }

    // Build HTML body from markdown or legacy plain text
    const markdown = body.bodyMarkdown || body.message || "";
    const bodyHtml = markdown
      ? markdownToEmailHtml(markdown)
      : "";

    const sent = await forwardGraphMessage(
      graphResult.context.mailbox,
      graphResult.context.token,
      messageId,
      {
        bodyHtml,
        to: toRecipients,
        cc: body.cc,
        bcc: body.bcc,
      }
    );

    if (!sent) {
      return NextResponse.json(
        { error: "Failed to forward email. Your email account may need additional permissions." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      message: "Email forwarded successfully",
      to: toRecipients,
    });
  } catch (error) {
    console.error("Error forwarding email:", error);
    return NextResponse.json(
      { error: "Failed to forward email" },
      { status: 500 }
    );
  }
}

/**
 * Legacy draft generation handler.
 * Kept for backward compatibility with the old forward modal.
 */
async function handleLegacyDraftGeneration(
  id: string,
  userId: string,
  body: ForwardRequestBody
) {
  const emailId = parseInt(id, 10);
  if (isNaN(emailId) || emailId < 1) {
    return NextResponse.json({ error: "Invalid email ID" }, { status: 400 });
  }

  const email = await getEmailDetail(emailId, userId);
  if (!email) {
    return NextResponse.json({ error: "Email not found" }, { status: 404 });
  }

  const bodyText = email.body_plain_text?.trim();
  if (!bodyText || bodyText.length < 10) {
    return NextResponse.json({ draft: "", intent: "fyi" as ForwardIntent });
  }

  try {
    const promptTemplate = await resolvePrompt(PROMPT_EMAIL_FORWARD_DRAFT, userId);
    const emailContext = [
      `ORIGINAL EMAIL:`,
      `From: ${email.sender}`,
      `Subject: ${email.subject || "(No subject)"}`,
      `Date: ${email.received_at}`,
      `Body: ${bodyText.slice(0, 2000)}`,
      ...(body.recipientEmail ? [``, `FORWARDING TO: ${body.recipientEmail}`] : []),
    ].join("\n");

    const fullPrompt = `${promptTemplate}\n\n${emailContext}`;
    const raw = await chatCompletion(fullPrompt, { maxTokens: 300, userId });

    let draft = "";
    let intent: ForwardIntent = "fyi";
    try {
      const parsed = JSON.parse(raw);
      if (parsed.message) draft = parsed.message;
      if (parsed.intent) intent = parsed.intent as ForwardIntent;
    } catch {
      draft = raw;
    }

    return NextResponse.json({ draft, intent });
  } catch (err) {
    if (err instanceof TokenLimitError) {
      return NextResponse.json({ error: (err as Error).message }, { status: 402 });
    }
    console.error("Error generating forward draft:", err);
    return NextResponse.json({ draft: "", intent: "fyi" as ForwardIntent });
  }
}
```

**Step 2: Commit**

```bash
git add app/api/emails/[id]/forward/route.ts
git commit -m "refactor: forward route uses Graph native endpoint with markdown support"
```

---

### Task 10: EmailChipInput Component

**Files:**
- Create: `components/email/EmailChipInput.tsx`

**Step 1: Create the component**

Create `components/email/EmailChipInput.tsx`:

```tsx
"use client";

import { useState, useRef, useCallback, type KeyboardEvent } from "react";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface EmailChipInputProps {
  label: string;
  emails: string[];
  onChange: (emails: string[]) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function EmailChipInput({
  label,
  emails,
  onChange,
  placeholder = "Add email...",
  autoFocus,
}: EmailChipInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addEmail = useCallback(
    (raw: string) => {
      const email = raw.trim().toLowerCase();
      if (!email) return;
      if (!EMAIL_REGEX.test(email)) {
        setError(true);
        return;
      }
      if (emails.includes(email)) {
        setInputValue("");
        return;
      }
      onChange([...emails, email]);
      setInputValue("");
      setError(false);
    },
    [emails, onChange]
  );

  const removeEmail = useCallback(
    (email: string) => {
      onChange(emails.filter((e) => e !== email));
    },
    [emails, onChange]
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "Tab" || e.key === ",") {
      if (inputValue.trim()) {
        e.preventDefault();
        addEmail(inputValue);
      } else if (e.key === "Tab") {
        // Allow normal tab behavior when input is empty
        return;
      }
    } else if (e.key === "Backspace" && !inputValue && emails.length > 0) {
      removeEmail(emails[emails.length - 1]);
    }
    setError(false);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text");
    // Handle pasting multiple comma/semicolon-separated emails
    if (text.includes(",") || text.includes(";")) {
      e.preventDefault();
      const parts = text.split(/[,;]\s*/).filter(Boolean);
      const newEmails = [...emails];
      for (const part of parts) {
        const email = part.trim().toLowerCase();
        if (EMAIL_REGEX.test(email) && !newEmails.includes(email)) {
          newEmails.push(email);
        }
      }
      onChange(newEmails);
      setInputValue("");
    }
  };

  return (
    <div
      className={`flex items-center gap-1.5 flex-wrap px-3 py-1.5 rounded-lg border bg-[var(--card)] transition-colors ${
        error
          ? "border-[var(--destructive)]"
          : "border-[var(--border)] focus-within:border-[var(--ring)]"
      }`}
      onClick={() => inputRef.current?.focus()}
    >
      <span className="text-xs font-medium text-[var(--muted-foreground)] w-8 flex-shrink-0 select-none">
        {label}
      </span>
      {emails.map((email) => (
        <span
          key={email}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--secondary)] text-xs text-[var(--foreground)] max-w-[200px] group"
        >
          <span className="truncate">{email}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeEmail(email);
            }}
            className="opacity-0 group-hover:opacity-100 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-opacity flex-shrink-0"
            tabIndex={-1}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          setError(false);
        }}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onBlur={() => {
          if (inputValue.trim()) addEmail(inputValue);
        }}
        placeholder={emails.length === 0 ? placeholder : ""}
        className="flex-1 min-w-[120px] bg-transparent text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] outline-none"
        autoFocus={autoFocus}
        data-compose-field
      />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/email/EmailChipInput.tsx
git commit -m "feat: add EmailChipInput component with tag/chip UX"
```

---

### Task 11: SplitButton Component

**Files:**
- Create: `components/email/SplitButton.tsx`

**Step 1: Create the component**

Create `components/email/SplitButton.tsx`:

```tsx
"use client";

import { useState, useRef, useEffect } from "react";

interface SplitButtonProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  dropdownLabel: string;
  dropdownIcon?: React.ReactNode;
  onDropdownClick: () => void;
  active?: boolean;
  disabled?: boolean;
}

export function SplitButton({
  label,
  icon,
  onClick,
  dropdownLabel,
  dropdownIcon,
  onDropdownClick,
  active,
  disabled,
}: SplitButtonProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-flex">
      {/* Main button */}
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`inline-flex items-center gap-1.5 p-2 md:pl-3 md:pr-1.5 md:py-1.5 text-sm font-medium rounded-l-lg border border-r-0 border-[var(--border)] transition-colors disabled:opacity-40 ${
          active
            ? "bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/30"
            : "text-[var(--foreground)] hover:bg-[var(--accent)]"
        }`}
        title={label}
      >
        {icon}
        <span className="hidden md:inline">{label}</span>
      </button>

      {/* Dropdown trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        disabled={disabled}
        className={`inline-flex items-center px-1 md:px-1.5 rounded-r-lg border border-[var(--border)] transition-colors disabled:opacity-40 ${
          active
            ? "bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/30"
            : "text-[var(--foreground)] hover:bg-[var(--accent)]"
        }`}
        title={`${label} options`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {open && (
        <div className="absolute top-full right-0 mt-1 z-50 min-w-[180px] bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg py-1">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onDropdownClick();
            }}
            className="w-full text-left px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--accent)] flex items-center gap-2"
          >
            {dropdownIcon || (
              <span className="text-[var(--primary)]" style={{ fontSize: "12px" }}>
                ✦
              </span>
            )}
            {dropdownLabel}
          </button>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/email/SplitButton.tsx
git commit -m "feat: add SplitButton component for reply/forward actions"
```

---

### Task 12: MarkdownCompose Component

**Files:**
- Create: `components/email/MarkdownCompose.tsx`

**Step 1: Create the component**

Create `components/email/MarkdownCompose.tsx`:

```tsx
"use client";

import { useState, useRef, useCallback, useEffect, type KeyboardEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownComposeProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  generating?: boolean;
  generatingLabel?: string;
  autoFocus?: boolean;
}

export function MarkdownCompose({
  value,
  onChange,
  placeholder = "Write your message in markdown...",
  generating,
  generatingLabel = "Generating draft...",
  autoFocus,
}: MarkdownComposeProps) {
  const [preview, setPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta || preview) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.max(120, Math.min(ta.scrollHeight, 300))}px`;
  }, [value, preview]);

  // Focus textarea on mount
  useEffect(() => {
    if (autoFocus && textareaRef.current && !preview) {
      textareaRef.current.focus();
    }
  }, [autoFocus, preview]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      // Cmd/Ctrl+Shift+P to toggle preview
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setPreview((p) => !p);
      }
    },
    []
  );

  const togglePreview = useCallback(() => {
    setPreview((p) => !p);
  }, []);

  return (
    <div className="relative">
      {/* Editor / Preview area */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden">
        {preview ? (
          <div className="px-3 py-2 min-h-[120px] max-h-[300px] overflow-y-auto prose prose-sm prose-invert max-w-none text-sm text-[var(--foreground)]">
            {value ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
            ) : (
              <p className="text-[var(--muted-foreground)] italic">Nothing to preview</p>
            )}
          </div>
        ) : (
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={generating ? "" : placeholder}
              className={`w-full px-3 py-2 text-sm font-mono bg-transparent text-[var(--foreground)] placeholder-[var(--muted-foreground)] outline-none resize-none min-h-[120px] ${
                generating && !value ? "opacity-60" : ""
              }`}
              data-compose-field
            />
            {generating && !value && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  {generatingLabel}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Preview toggle */}
      <div className="flex items-center gap-2 mt-1.5">
        <button
          type="button"
          onClick={togglePreview}
          className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          {preview ? "Edit" : "Preview"}{" "}
          <kbd className="text-[10px] px-1 py-0.5 rounded border border-[var(--border)] bg-[var(--secondary)]">
            {navigator.platform?.includes("Mac") ? "⌘" : "Ctrl"}+⇧+P
          </kbd>
        </button>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/email/MarkdownCompose.tsx
git commit -m "feat: add MarkdownCompose component with edit/preview toggle"
```

---

### Task 13: ComposePane Component

**Files:**
- Create: `components/email/ComposePane.tsx`

This is the main compose pane that combines chip inputs, markdown editor, context selector, and action buttons.

**Step 1: Create the component**

Create `components/email/ComposePane.tsx`:

```tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { EmailChipInput } from "./EmailChipInput";
import { MarkdownCompose } from "./MarkdownCompose";
import { useToast } from "@/components/ui/Toast";

export type ComposeAction = "reply" | "reply_all" | "forward";
export type ContextLevel = "email_only" | "full_thread" | "thread_and_app";

interface ComposePaneProps {
  emailId: number | string;
  action: ComposeAction;
  aiMode: boolean;
  /** Pre-populated recipients */
  defaultTo: string[];
  defaultCc: string[];
  onClose: () => void;
  onSent: () => void;
}

export function ComposePane({
  emailId,
  action,
  aiMode,
  defaultTo,
  defaultCc,
  onClose,
  onSent,
}: ComposePaneProps) {
  const { toast } = useToast();
  const paneRef = useRef<HTMLDivElement>(null);

  // Recipient state
  const [to, setTo] = useState<string[]>(defaultTo);
  const [cc, setCc] = useState<string[]>(defaultCc);
  const [bcc, setBcc] = useState<string[]>([]);
  const [showCc, setShowCc] = useState(defaultCc.length > 0);
  const [showBcc, setShowBcc] = useState(false);

  // Compose state
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  // AI state
  const [contextLevel, setContextLevel] = useState<ContextLevel>("email_only");
  const [generating, setGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [intent, setIntent] = useState<string | null>(null);
  const userEdited = useRef(false);

  // Auto-generate AI draft on mount if in AI mode
  useEffect(() => {
    if (!aiMode) return;
    generateDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateDraft = useCallback(async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/emails/${emailId}/reply-draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: action === "reply_all" ? "reply_all" : action,
          contextLevel,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.error) {
          toast({ title: "Draft generation failed", description: data.error, variant: "destructive" });
        }
        return;
      }
      const data = await res.json();
      if (!userEdited.current && data.draft) {
        setBody(data.draft);
      }
      if (data.intent) setIntent(data.intent);
      setHasGenerated(true);
    } catch {
      toast({ title: "Failed to generate draft", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  }, [emailId, action, contextLevel, toast]);

  const handleSend = async () => {
    if (!body.trim()) {
      toast({ title: "Message body is required", variant: "destructive" });
      return;
    }
    if (action === "forward" && to.length === 0) {
      toast({ title: "At least one recipient is required", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      const endpoint =
        action === "reply"
          ? `/api/emails/${emailId}/reply`
          : action === "reply_all"
            ? `/api/emails/${emailId}/reply-all`
            : `/api/emails/${emailId}/forward`;

      const payload: Record<string, unknown> = {
        bodyMarkdown: body,
      };
      if (to.length) payload.to = to;
      if (cc.length) payload.cc = cc;
      if (bcc.length) payload.bcc = bcc;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send");
      }

      const actionLabel =
        action === "reply" ? "Reply" : action === "reply_all" ? "Reply all" : "Forward";
      toast({ title: `${actionLabel} sent`, variant: "success" });
      onSent();
    } catch (err) {
      toast({
        title: "Send failed",
        description: err instanceof Error ? err.message : "Failed to send",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  // Cmd/Ctrl+Enter to send
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleSend();
      }
      if (e.key === "Escape") {
        // If a compose field is focused, blur it first
        const active = document.activeElement;
        if (
          active &&
          paneRef.current?.contains(active) &&
          (active.tagName === "INPUT" || active.tagName === "TEXTAREA")
        ) {
          (active as HTMLElement).blur();
          e.stopPropagation();
          return;
        }
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [body, to, cc, bcc, sending]);

  const actionLabel =
    action === "reply" ? "Reply" : action === "reply_all" ? "Reply All" : "Forward";

  return (
    <div
      ref={paneRef}
      className="border-t border-[var(--border)] bg-[var(--background)] px-3 py-3 md:px-6 md:py-4 space-y-3"
      data-compose-pane
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-[var(--foreground)]">{actionLabel}</h3>
          {intent && !generating && (
            <span
              className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] font-medium"
              title={`AI detected intent: ${intent.replace("_", " ")}`}
            >
              {intent.replace("_", " ")}
            </span>
          )}
        </div>
      </div>

      {/* Recipients */}
      <div className="space-y-1.5">
        <EmailChipInput
          label="To"
          emails={to}
          onChange={setTo}
          autoFocus={action === "forward"}
        />

        {showCc && (
          <EmailChipInput label="CC" emails={cc} onChange={setCc} />
        )}

        {showBcc && (
          <EmailChipInput label="BCC" emails={bcc} onChange={setBcc} />
        )}

        {(!showCc || !showBcc) && (
          <div className="flex gap-2 pl-10">
            {!showCc && (
              <button
                type="button"
                onClick={() => setShowCc(true)}
                className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                +CC
              </button>
            )}
            {!showBcc && (
              <button
                type="button"
                onClick={() => setShowBcc(true)}
                className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                +BCC
              </button>
            )}
          </div>
        )}
      </div>

      {/* AI context selector + regenerate */}
      {aiMode && (
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-xs text-[var(--muted-foreground)]">Context:</label>
          <select
            value={contextLevel}
            onChange={(e) => setContextLevel(e.target.value as ContextLevel)}
            className="text-xs px-2 py-1 rounded-md border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] outline-none"
          >
            <option value="email_only">This email</option>
            <option value="full_thread">Full thread</option>
            <option value="thread_and_app">Thread + my data</option>
          </select>
          <button
            type="button"
            onClick={() => {
              userEdited.current = false;
              setBody("");
              generateDraft();
            }}
            disabled={generating}
            className="text-xs text-[var(--primary)] hover:underline disabled:opacity-40"
          >
            {hasGenerated ? "Regenerate" : "Draft with AI"}
          </button>
        </div>
      )}

      {/* Markdown editor */}
      <MarkdownCompose
        value={body}
        onChange={(v) => {
          userEdited.current = true;
          setBody(v);
        }}
        generating={generating}
        autoFocus={action !== "forward"}
      />

      {/* Actions */}
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 text-sm font-medium rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSend}
          disabled={sending || !body.trim() || (action === "forward" && to.length === 0)}
          className="px-3 py-1.5 text-sm font-medium rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {sending ? "Sending..." : `Send ${actionLabel}`}{" "}
          <kbd className="text-[10px] ml-1 opacity-70">
            {typeof navigator !== "undefined" && navigator.platform?.includes("Mac") ? "⌘" : "Ctrl"}↵
          </kbd>
        </button>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/email/ComposePane.tsx
git commit -m "feat: add ComposePane with recipients, markdown editor, and AI drafts"
```

---

### Task 14: useComposeShortcuts Hook

**Files:**
- Create: `hooks/useComposeShortcuts.ts`

**Step 1: Create the hook**

Create `hooks/useComposeShortcuts.ts`:

```typescript
"use client";

import { useEffect, useCallback, useRef } from "react";

type ComposeAction = "reply" | "reply_all" | "forward";

interface ComposeShortcutCallbacks {
  onAction: (action: ComposeAction, aiMode: boolean) => void;
  onClose: () => void;
  /** Whether a compose pane is currently open */
  isOpen: boolean;
}

/**
 * Keyboard shortcut hook for email compose actions.
 *
 * Command mode (compose fields NOT focused):
 * - R: Reply
 * - A: Reply All
 * - F: Forward
 * - Shift+R: Reply with AI
 * - Shift+A: Reply All with AI
 * - Shift+F: Forward with AI
 * - Escape: Close compose pane
 *
 * Always active:
 * - Cmd/Ctrl+Enter: Handled by ComposePane directly
 * - Escape: Close compose pane (handled by ComposePane with blur-first logic)
 */
export function useComposeShortcuts({
  onAction,
  onClose,
  isOpen,
}: ComposeShortcutCallbacks) {
  const callbacksRef = useRef({ onAction, onClose, isOpen });
  callbacksRef.current = { onAction, onClose, isOpen };

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const { onAction, onClose, isOpen } = callbacksRef.current;

      // Check if we're in "insert mode" (compose field focused)
      const active = document.activeElement;
      const isComposeField =
        active?.hasAttribute("data-compose-field") ||
        active?.closest("[data-compose-pane]") !== null;

      // Command mode shortcuts — only when compose fields are NOT focused
      if (!isComposeField && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const key = e.key.toLowerCase();

        if (key === "r" && !e.shiftKey) {
          e.preventDefault();
          onAction("reply", false);
          return;
        }
        if (key === "a" && !e.shiftKey) {
          e.preventDefault();
          onAction("reply_all", false);
          return;
        }
        if (key === "f" && !e.shiftKey) {
          e.preventDefault();
          onAction("forward", false);
          return;
        }
        if (key === "r" && e.shiftKey) {
          e.preventDefault();
          onAction("reply", true);
          return;
        }
        if (key === "a" && e.shiftKey) {
          e.preventDefault();
          onAction("reply_all", true);
          return;
        }
        if (key === "f" && e.shiftKey) {
          e.preventDefault();
          onAction("forward", true);
          return;
        }
        if (key === "escape" && isOpen) {
          e.preventDefault();
          onClose();
          return;
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);
}
```

**Step 2: Commit**

```bash
git add hooks/useComposeShortcuts.ts
git commit -m "feat: add useComposeShortcuts hook with command/insert mode"
```

---

### Task 15: Integrate Into Inbox Detail Page

**Files:**
- Modify: `app/(app)/inbox/[id]/page.tsx`

This is the largest task — wire everything together in the email detail page. The changes:

1. Add imports for new components and hook
2. Add compose pane state
3. Replace the Forward button with three SplitButtons
4. Remove the old forward modal
5. Add the ComposePane below the email body
6. Wire up keyboard shortcuts

**Step 1: Update imports**

Replace the existing imports section (lines 1-12) with:

```tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import DOMPurify from "isomorphic-dompurify";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { EmailActionSidebar } from "@/components/email/EmailActionSidebar";
import { SendToPageModal } from "@/components/email/SendToPageModal";
import { CopyToPageToolbar } from "@/components/email/CopyToPageToolbar";
import { SplitButton } from "@/components/email/SplitButton";
import { ComposePane, type ComposeAction } from "@/components/email/ComposePane";
import { useComposeShortcuts } from "@/hooks/useComposeShortcuts";
import type { EmailDetail, EmailAttachmentMetadata, EmailLabelChip } from "@/types/email";
```

**Step 2: Replace forward state with compose state**

Replace lines 150-157 (the forward state declarations):

```tsx
  // Forward state
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardRecipient, setForwardRecipient] = useState("");
  const [forwardMessage, setForwardMessage] = useState("");
  const [forwardGenerating, setForwardGenerating] = useState(false);
  const [forwardSending, setForwardSending] = useState(false);
  const [forwardIntent, setForwardIntent] = useState<string | null>(null);
  const forwardUserEdited = useRef(false);
```

With:

```tsx
  // Compose pane state
  const [composeAction, setComposeAction] = useState<ComposeAction | null>(null);
  const [composeAiMode, setComposeAiMode] = useState(false);
```

**Step 3: Remove the forward draft generation effect**

Delete lines 272-304 (the `useEffect` that auto-generates forwarding draft when modal opens).

**Step 4: Add compose helper functions and shortcuts hook**

Add after the `sendToPageSelectedText` / `emailBodyRef` declarations:

```tsx
  // Determine if this is an Outlook email (compose only for Outlook)
  const isOutlookEmail = email ? !isNaN(Number(email.id)) : false;

  // Compute default recipients for compose pane
  const getDefaultRecipients = useCallback(
    (action: ComposeAction) => {
      if (!email) return { to: [], cc: [] };
      if (action === "forward") return { to: [], cc: [] };
      if (action === "reply") return { to: [email.sender], cc: [] };
      // reply_all: To = sender, CC = original To + CC minus sender and self
      // We don't know the user's email here, so we include all and let user remove
      const allRecipients = [...email.recipients, ...email.cc];
      const ccList = allRecipients.filter(
        (e) => e !== email.sender && !e.includes("noreply")
      );
      return { to: [email.sender], cc: ccList };
    },
    [email]
  );

  const openCompose = useCallback(
    (action: ComposeAction, aiMode: boolean) => {
      if (!isOutlookEmail) return;
      setComposeAction(action);
      setComposeAiMode(aiMode);
    },
    [isOutlookEmail]
  );

  const closeCompose = useCallback(() => {
    setComposeAction(null);
    setComposeAiMode(false);
  }, []);

  // Keyboard shortcuts
  useComposeShortcuts({
    onAction: openCompose,
    onClose: closeCompose,
    isOpen: composeAction !== null,
  });
```

**Step 5: Replace the Forward button in the header with three SplitButtons**

Replace the existing forward button (lines 398-408, the block with `onClick={() => { setForwardRecipient(""); ...`):

```tsx
          <button
            onClick={() => { setForwardRecipient(""); setForwardMessage(""); setForwardIntent(null); forwardUserEdited.current = false; setShowForwardModal(true); }}
            className="inline-flex items-center gap-2 p-2 md:px-3 md:py-1.5 text-sm font-medium rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
            title="Forward email"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 17 20 12 15 7" />
              <path d="M4 18v-2a4 4 0 0 1 4-4h12" />
            </svg>
            <span className="hidden md:inline">Forward</span>
          </button>
```

With the three SplitButtons:

```tsx
          {isOutlookEmail && (
            <>
              <SplitButton
                label="Reply"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 17 4 12 9 7" />
                    <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
                  </svg>
                }
                onClick={() => openCompose("reply", false)}
                dropdownLabel="Reply with AI"
                onDropdownClick={() => openCompose("reply", true)}
                active={composeAction === "reply"}
              />
              <SplitButton
                label="Reply All"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 17 4 12 9 7" />
                    <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
                    <polyline points="13 17 8 12 13 7" />
                  </svg>
                }
                onClick={() => openCompose("reply_all", false)}
                dropdownLabel="Reply All with AI"
                onDropdownClick={() => openCompose("reply_all", true)}
                active={composeAction === "reply_all"}
              />
              <SplitButton
                label="Forward"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 17 20 12 15 7" />
                    <path d="M4 18v-2a4 4 0 0 1 4-4h12" />
                  </svg>
                }
                onClick={() => openCompose("forward", false)}
                dropdownLabel="Forward with AI"
                onDropdownClick={() => openCompose("forward", true)}
                active={composeAction === "forward"}
              />
            </>
          )}
```

**Step 6: Add ComposePane below the email body**

In the main content area, after the `</main>` closing tag (line ~593) and before the `<EmailActionSidebar>`, add the compose pane. Actually, the compose pane should be inside the main content area, below the email body but above the sidebar.

Find the closing `</main>` tag and insert the ComposePane just before it (after the `CopyToPageToolbar`):

```tsx
            {/* Compose Pane (inline below email body) */}
            {composeAction && email && (
              <ComposePane
                emailId={email.id}
                action={composeAction}
                aiMode={composeAiMode}
                defaultTo={getDefaultRecipients(composeAction).to}
                defaultCc={getDefaultRecipients(composeAction).cc}
                onClose={closeCompose}
                onSent={closeCompose}
              />
            )}
```

**Step 7: Remove the old forward modal**

Delete the entire forward modal block (lines 624-748, from `{/* Forward email modal */}` through the closing `</Modal>`).

**Step 8: Commit**

```bash
git add app/(app)/inbox/[id]/page.tsx
git commit -m "feat: integrate reply/reply-all/forward compose pane into email detail"
```

---

### Task 16: Verify and Test

**Step 1: Run the dev server**

Run: `npm run dev`

Verify the app compiles without errors.

**Step 2: Manual testing checklist**

Navigate to `http://localhost:3000/inbox` and open an Outlook email. Verify:

1. **Header buttons**: Three split buttons (Reply, Reply All, Forward) appear for Outlook emails
2. **Manual Reply**: Click Reply → compose pane opens below email with To pre-populated as sender
3. **Manual Reply All**: Click Reply All → To = sender, CC = other recipients
4. **Manual Forward**: Click Forward → To is empty, user types recipient
5. **AI Reply**: Click Reply dropdown → "Reply with AI" → compose pane opens, AI draft generates
6. **Context selector**: Change context level → click "Regenerate" → new draft with more context
7. **Markdown preview**: Toggle preview button → see rendered markdown
8. **Email chips**: Type email + Enter → chip appears. Click x → chip removed. Paste comma-separated → multiple chips.
9. **CC/BCC**: Click +CC → CC row appears. Click +BCC → BCC row appears.
10. **Keyboard shortcuts**: Press R (outside compose) → Reply opens. Press Shift+R → Reply with AI. Press Escape → compose closes.
11. **Cmd/Ctrl+Enter**: Sends the email.
12. **Non-Outlook emails**: Gmail/Zoom emails should NOT show Reply/Forward buttons.

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete email reply, reply-all, forward with AI compose"
```
