

I'll start by exploring the codebase to understand the existing email classification and inbox structure before implementing the spam detection and unsubscribe feature.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing email classification and inbox code",
      "status": "in_progress",
      "activeForm": "Exploring existing email classification and inbox code"
    },
    {
      "content": "Plan spam detection and unsubscribe implementation",
      "status": "pending",
      "activeForm": "Planning spam detection and unsubscribe implementation"
    },
    {
      "content": "Add spam classification to AI email classifier",
      "status": "pending",
      "activeForm": "Adding spam classification to AI email classifier"
    },
    {
      "content": "Add unsubscribe link extraction and storage",
      "status": "pending",
      "activeForm": "Adding unsubscribe link extraction and storage"
    },
    {
      "content": "Update inbox UI with spam indicator and unsubscribe button",
      "status": "pending",
      "activeForm": "Updating inbox UI with spam indicator and unsubscribe button"
    },
    {
      "content": "Add database schema changes if needed",
      "status": "pending",
      "activeForm": "Adding database schema changes if needed"
    }
  ]
}

🔧 Tool: Task
Input: {
  "description": "Explore email classification code",
  "prompt": "Explore the codebase to understand the email classification system, inbox page, and email schema. I need to understand:\n\n1. How emails are classified (look at app/api/emails/classify/ and any related files)\n2. The email schema in lib/db/schema.ts (specifically email-related tables)\n3. The inbox page (app/(app)/inbox/page.tsx)\n4. Any existing newsletter detection (lib/email/newsletterDetection.ts)\n5. The AI prompts used for classification (lib/ai/prompts.ts)\n6. Email-related types and validators\n\nPlease provide detailed contents/summaries of all these files so I can understand the existing patterns.",
  "subagent_type": "Explore"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\db\\schema.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\emails\\classify\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\inbox\\page.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\ai\\prompts.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/lib/email/**"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\email\\classifyEmail.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\email\\emails.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\email\\newsletterDetection.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\email\\db.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/types/email*"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/lib/validators/**"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\types\\email.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\validators\\schemas.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/lib/email/labels.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\email\\labels.ts"
}
Now I have a thorough understanding of the existing system. Let me read the key files I'll need to modify.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing email classification and inbox code",
      "status": "completed",
      "activeForm": "Exploring existing email classification and inbox code"
    },
    {
      "content": "Plan spam detection and unsubscribe implementation",
      "status": "in_progress",
      "activeForm": "Planning spam detection and unsubscribe implementation"
    },
    {
      "content": "Add spam classification to AI email classifier",
      "status": "pending",
      "activeForm": "Adding spam classification to AI email classifier"
    },
    {
      "content": "Add unsubscribe link extraction and storage",
      "status": "pending",
      "activeForm": "Adding unsubscribe link extraction and storage"
    },
    {
      "content": "Update inbox UI with spam indicator and unsubscribe button",
      "status": "pending",
      "activeForm": "Updating inbox UI with spam indicator and unsubscribe button"
    },
    {
      "content": "Add database schema changes if needed",
      "status": "pending",
      "activeForm": "Adding database schema changes if needed"
    }
  ]
}
Let me read the key files I'll need to modify.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\db\\schema.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\ai\\prompts.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\email\\newsletterDetection.ts"
}
Now let me read the remaining key files I need to modify.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\emails\\classify\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\inbox\\page.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\email\\emails.ts"
}
Now let me also read the email types and the classifyEmail function to understand the full picture.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\types\\email.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\email\\classifyEmail.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\email\\labels.ts"
}
Now I have a complete understanding of the existing system. Let me also check the email API route and the `db` import for emails.

🔧 Tool: Glob
Input: {
  "pattern": "app/api/emails/route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\emails\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\email\\db.ts"
}
Now I have a thorough understanding. Let me plan and implement the feature.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing email classification and inbox code",
      "status": "completed",
      "activeForm": "Exploring existing email classification and inbox code"
    },
    {
      "content": "Plan spam detection and unsubscribe implementation",
      "status": "completed",
      "activeForm": "Planning spam detection and unsubscribe implementation"
    },
    {
      "content": "Add 'Spam' to system labels in lib/email/labels.ts",
      "status": "in_progress",
      "activeForm": "Adding Spam to system labels"
    },
    {
      "content": "Add is_spam and unsubscribe_link columns to emails schema",
      "status": "pending",
      "activeForm": "Adding is_spam and unsubscribe_link columns to schema"
    },
    {
      "content": "Create spam detection module with unsubscribe link extraction",
      "status": "pending",
      "activeForm": "Creating spam detection module"
    },
    {
      "content": "Add spam folder tab and unsubscribe button to inbox UI",
      "status": "pending",
      "activeForm": "Adding spam folder tab and unsubscribe button to inbox UI"
    },
    {
      "content": "Create API route for spam detection and unsubscribe",
      "status": "pending",
      "activeForm": "Creating API routes for spam detection and unsubscribe"
    },
    {
      "content": "Create database migration for new columns",
      "status": "pending",
      "activeForm": "Creating database migration"
    }
  ]
}
Here's my plan:

**Implementation approach:**
1. Add "Spam" as a system label in the classification system
2. Add `is_spam` and `unsubscribe_link` columns to both `emails` and `gmail_emails` tables
3. Create a spam detection module (similar pattern to newsletter detection) that uses heuristics + AI label presence + unsubscribe link extraction from email headers/body
4. Add a "Spam" folder tab to the inbox, similar to how "Newsletters" works
5. Show a prominent "Unsubscribe" button on spam emails in the inbox
6. Create an API endpoint for spam detection and marking

Let me start implementing.

First, add "Spam" to system labels:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\lib\\email\\labels.ts",
  "old_string": "/** Default system labels with their colors */\nexport const SYSTEM_LABELS: { name: string; color: string }[] = [\n  { name: \"Action Required\", color: \"#EF4444\" },\n  { name: \"FYI\", color: \"#3B82F6\" },\n  { name: \"Newsletter\", color: \"#8B5CF6\" },\n  { name: \"Invoice\", color: \"#F59E0B\" },\n  { name: \"Meeting Request\", color: \"#10B981\" },\n  { name: \"Support Ticket\", color: \"#F97316\" },\n];",
  "new_string": "/** Default system labels with their colors */\nexport const SYSTEM_LABELS: { name: string; color: string }[] = [\n  { name: \"Action Required\", color: \"#EF4444\" },\n  { name: \"FYI\", color: \"#3B82F6\" },\n  { name: \"Newsletter\", color: \"#8B5CF6\" },\n  { name: \"Spam\", color: \"#DC2626\" },\n  { name: \"Invoice\", color: \"#F59E0B\" },\n  { name: \"Meeting Request\", color: \"#10B981\" },\n  { name: \"Support Ticket\", color: \"#F97316\" },\n];"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing email classification and inbox code",
      "status": "completed",
      "activeForm": "Exploring existing email classification and inbox code"
    },
    {
      "content": "Plan spam detection and unsubscribe implementation",
      "status": "completed",
      "activeForm": "Planning spam detection and unsubscribe implementation"
    },
    {
      "content": "Add 'Spam' to system labels in lib/email/labels.ts",
      "status": "completed",
      "activeForm": "Adding Spam to system labels"
    },
    {
      "content": "Add is_spam and unsubscribe_link columns to emails schema",
      "status": "in_progress",
      "activeForm": "Adding is_spam and unsubscribe_link columns to schema"
    },
    {
      "content": "Create spam detection module with unsubscribe link extraction",
      "status": "pending",
      "activeForm": "Creating spam detection module"
    },
    {
      "content": "Add spam folder tab and unsubscribe button to inbox UI",
      "status": "pending",
      "activeForm": "Adding spam folder tab and unsubscribe button to inbox UI"
    },
    {
      "content": "Create API route for spam detection and unsubscribe",
      "status": "pending",
      "activeForm": "Creating API routes for spam detection and unsubscribe"
    },
    {
      "content": "Create database migration for new columns",
      "status": "pending",
      "activeForm": "Creating database migration"
    }
  ]
}
Now add `is_spam` and `unsubscribe_link` columns to the schema:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\lib\\db\\schema.ts",
  "old_string": "    isNewsletter: boolean(\"is_newsletter\").default(false).notNull(),\n    deletedAt: timestamp(\"deleted_at\", { withTimezone: true }),\n    createdAt: timestamp(\"created_at\", { withTimezone: true })\n      .defaultNow()\n      .notNull(),\n    updatedAt: timestamp(\"updated_at\", { withTimezone: true })\n      .defaultNow()\n      .notNull(),\n  },\n  (table) => [\n    uniqueIndex(\"uq_emails_tenant_message\").on(\n      table.tenantId,\n      table.messageId\n    ),\n    index(\"idx_emails_tenant_id\").on(table.tenantId),\n    index(\"idx_emails_received_at\").on(table.receivedAt),\n    index(\"idx_emails_tenant_received\").on(table.tenantId, table.receivedAt),\n    index(\"idx_emails_outlook_account\").on(table.outlookAccountId),\n    crudPolicy({\n      role: authenticatedRole,\n      read: authUid(table.tenantId),\n      modify: authUid(table.tenantId),\n    }),\n  ]\n);",
  "new_string": "    isNewsletter: boolean(\"is_newsletter\").default(false).notNull(),\n    isSpam: boolean(\"is_spam\").default(false).notNull(),\n    unsubscribeLink: text(\"unsubscribe_link\"),\n    deletedAt: timestamp(\"deleted_at\", { withTimezone: true }),\n    createdAt: timestamp(\"created_at\", { withTimezone: true })\n      .defaultNow()\n      .notNull(),\n    updatedAt: timestamp(\"updated_at\", { withTimezone: true })\n      .defaultNow()\n      .notNull(),\n  },\n  (table) => [\n    uniqueIndex(\"uq_emails_tenant_message\").on(\n      table.tenantId,\n      table.messageId\n    ),\n    index(\"idx_emails_tenant_id\").on(table.tenantId),\n    index(\"idx_emails_received_at\").on(table.receivedAt),\n    index(\"idx_emails_tenant_received\").on(table.tenantId, table.receivedAt),\n    index(\"idx_emails_outlook_account\").on(table.outlookAccountId),\n    crudPolicy({\n      role: authenticatedRole,\n      read: authUid(table.tenantId),\n      modify: authUid(table.tenantId),\n    }),\n  ]\n);"
}
Now add the same columns to the gmail_emails table:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\lib\\db\\schema.ts",
  "old_string": "    isNewsletter: boolean(\"is_newsletter\").default(false).notNull(),\n    ingestedAt: timestamp(\"ingested_at\", { withTimezone: true })\n      .defaultNow()\n      .notNull(),\n    updatedAt: timestamp(\"updated_at\", { withTimezone: true })\n      .defaultNow()\n      .notNull(),\n  },\n  (table) => [\n    uniqueIndex(\"uq_tenant_gmail_message\").on(",
  "new_string": "    isNewsletter: boolean(\"is_newsletter\").default(false).notNull(),\n    isSpam: boolean(\"is_spam\").default(false).notNull(),\n    unsubscribeLink: text(\"unsubscribe_link\"),\n    ingestedAt: timestamp(\"ingested_at\", { withTimezone: true })\n      .defaultNow()\n      .notNull(),\n    updatedAt: timestamp(\"updated_at\", { withTimezone: true })\n      .defaultNow()\n      .notNull(),\n  },\n  (table) => [\n    uniqueIndex(\"uq_tenant_gmail_message\").on("
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing email classification and inbox code",
      "status": "completed",
      "activeForm": "Exploring existing email classification and inbox code"
    },
    {
      "content": "Plan spam detection and unsubscribe implementation",
      "status": "completed",
      "activeForm": "Planning spam detection and unsubscribe implementation"
    },
    {
      "content": "Add 'Spam' to system labels in lib/email/labels.ts",
      "status": "completed",
      "activeForm": "Adding Spam to system labels"
    },
    {
      "content": "Add is_spam and unsubscribe_link columns to emails schema",
      "status": "completed",
      "activeForm": "Adding is_spam and unsubscribe_link columns to schema"
    },
    {
      "content": "Create spam detection module with unsubscribe link extraction",
      "status": "in_progress",
      "activeForm": "Creating spam detection module"
    },
    {
      "content": "Add spam folder tab and unsubscribe button to inbox UI",
      "status": "pending",
      "activeForm": "Adding spam folder tab and unsubscribe button to inbox UI"
    },
    {
      "content": "Create API route for spam detection and unsubscribe",
      "status": "pending",
      "activeForm": "Creating API routes for spam detection and unsubscribe"
    },
    {
      "content": "Create database migration for new columns",
      "status": "pending",
      "activeForm": "Creating database migration"
    }
  ]
}
Now create the spam detection module, following the same pattern as newsletterDetection.ts:

🔧 Tool: Write
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\email\\spamDetection.ts",
  "content": "import sql from \"./db\";\n\n/**\n * Spam detection and unsubscribe link extraction.\n * Uses a combination of header analysis, sender patterns, subject patterns,\n * body content analysis, and AI classification to detect spam messages.\n * Also extracts unsubscribe links from email headers and body content.\n */\n\n/** Common spam sender patterns */\nconst SPAM_SENDER_PATTERNS = [\n  /noreply@/i,\n  /no-reply@/i,\n  /promotions@/i,\n  /marketing@/i,\n  /offer@/i,\n  /deals@/i,\n  /promo@/i,\n  /sale@/i,\n  /info@.*\\.xyz$/i,\n  /info@.*\\.top$/i,\n  /info@.*\\.click$/i,\n  /info@.*\\.buzz$/i,\n];\n\n/** Common spam subject patterns */\nconst SPAM_SUBJECT_PATTERNS = [\n  /\\bfree\\b.*\\b(gift|trial|offer|money)\\b/i,\n  /\\bact now\\b/i,\n  /\\blimited time\\b/i,\n  /\\bno obligation\\b/i,\n  /\\bcongratulations\\b.*\\bwon\\b/i,\n  /\\byou('ve| have) been selected\\b/i,\n  /\\bclaim your\\b/i,\n  /\\bunsubscribe\\b/i,\n  /\\bopt.out\\b/i,\n  /\\bdiscount\\b.*\\b\\d+%/i,\n  /\\bspecial offer\\b/i,\n  /\\bexclusive deal\\b/i,\n];\n\n/** Body content spam signals */\nconst SPAM_BODY_PATTERNS = [\n  /unsubscribe/i,\n  /opt.out/i,\n  /email preferences/i,\n  /manage your subscription/i,\n  /stop receiving/i,\n  /remove yourself/i,\n  /click here to unsubscribe/i,\n];\n\n/**\n * Extract unsubscribe link from email headers and body.\n * Checks List-Unsubscribe header first (RFC 2369), then falls back to body parsing.\n */\nexport function extractUnsubscribeLink(email: {\n  rawPayload?: Record<string, unknown> | null;\n  bodyHtml?: string | null;\n  bodyPlainText?: string | null;\n}): string | null {\n  // 1. Check List-Unsubscribe header (most reliable)\n  if (email.rawPayload) {\n    const payload = email.rawPayload;\n\n    // Microsoft Graph API: internetMessageHeaders\n    const headers = payload.internetMessageHeaders as\n      | { name: string; value: string }[]\n      | undefined;\n    if (headers && Array.isArray(headers)) {\n      const listUnsubscribe = headers.find(\n        (h) => h.name?.toLowerCase() === \"list-unsubscribe\"\n      );\n      if (listUnsubscribe?.value) {\n        const link = parseUnsubscribeHeaderValue(listUnsubscribe.value);\n        if (link) return link;\n      }\n    }\n\n    // Gmail: check for headers in raw payload\n    const gmailHeaders = (payload as Record<string, unknown>).headers as\n      | { name: string; value: string }[]\n      | undefined;\n    if (gmailHeaders && Array.isArray(gmailHeaders) && !headers) {\n      const listUnsubscribe = gmailHeaders.find(\n        (h) => h.name?.toLowerCase() === \"list-unsubscribe\"\n      );\n      if (listUnsubscribe?.value) {\n        const link = parseUnsubscribeHeaderValue(listUnsubscribe.value);\n        if (link) return link;\n      }\n    }\n  }\n\n  // 2. Look for unsubscribe links in HTML body\n  if (email.bodyHtml) {\n    const link = extractUnsubscribeLinkFromHtml(email.bodyHtml);\n    if (link) return link;\n  }\n\n  // 3. Look for unsubscribe links in plain text body\n  if (email.bodyPlainText) {\n    const link = extractUnsubscribeLinkFromText(email.bodyPlainText);\n    if (link) return link;\n  }\n\n  return null;\n}\n\n/**\n * Parse the List-Unsubscribe header value.\n * Format: <https://example.com/unsub>, <mailto:unsub@example.com>\n * Prefer HTTPS links over mailto links.\n */\nfunction parseUnsubscribeHeaderValue(value: string): string | null {\n  const parts = value.split(\",\").map((p) => p.trim());\n\n  // Prefer https links\n  for (const part of parts) {\n    const match = part.match(/<(https?:\\/\\/[^>]+)>/);\n    if (match) return match[1];\n  }\n\n  // Fall back to mailto\n  for (const part of parts) {\n    const match = part.match(/<(mailto:[^>]+)>/);\n    if (match) return match[1];\n  }\n\n  return null;\n}\n\n/**\n * Extract unsubscribe link from HTML body by looking for links with\n * unsubscribe-related text or href patterns.\n */\nfunction extractUnsubscribeLinkFromHtml(html: string): string | null {\n  // Match anchor tags with unsubscribe-related text or href\n  const anchorRegex = /<a\\s[^>]*href=[\"']([^\"']+)[\"'][^>]*>([^<]*(?:unsubscribe|opt[- ]?out|manage\\s+(?:your\\s+)?(?:subscription|preferences)|stop\\s+receiving)[^<]*)<\\/a>/gi;\n  let match;\n  while ((match = anchorRegex.exec(html)) !== null) {\n    const href = match[1];\n    if (href && href.startsWith(\"http\")) return href;\n  }\n\n  // Also check href values containing \"unsubscribe\"\n  const hrefRegex = /<a\\s[^>]*href=[\"'](https?:\\/\\/[^\"']*(?:unsubscribe|unsub|opt[_-]?out|remove)[^\"']*)[\"']/gi;\n  while ((match = hrefRegex.exec(html)) !== null) {\n    if (match[1]) return match[1];\n  }\n\n  return null;\n}\n\n/**\n * Extract unsubscribe link from plain text body.\n */\nfunction extractUnsubscribeLinkFromText(text: string): string | null {\n  // Find URLs near unsubscribe-related words\n  const lines = text.split(\"\\n\");\n  for (const line of lines) {\n    if (/unsubscribe|opt.out|manage.+subscription/i.test(line)) {\n      const urlMatch = line.match(/(https?:\\/\\/\\S+)/);\n      if (urlMatch) return urlMatch[1];\n    }\n  }\n  return null;\n}\n\n/**\n * Detect if an email is spam based on heuristics.\n * Returns a confidence score 0-100 and extracted unsubscribe link.\n */\nexport function detectSpam(email: {\n  sender: string;\n  subject: string | null;\n  bodyPlainText?: string | null;\n  bodyHtml?: string | null;\n  rawPayload?: Record<string, unknown> | null;\n  labels?: { name: string; confidence: number | null }[];\n}): { isSpam: boolean; confidence: number; signals: string[]; unsubscribeLink: string | null } {\n  const signals: string[] = [];\n  let score = 0;\n\n  // 1. Check for List-Unsubscribe header (indicates bulk/marketing mail)\n  if (email.rawPayload) {\n    const payload = email.rawPayload;\n\n    const headers = payload.internetMessageHeaders as\n      | { name: string; value: string }[]\n      | undefined;\n    if (headers && Array.isArray(headers)) {\n      const hasPrecedenceBulk = headers.some(\n        (h) =>\n          h.name?.toLowerCase() === \"precedence\" &&\n          h.value?.toLowerCase() === \"bulk\"\n      );\n      if (hasPrecedenceBulk) {\n        score += 15;\n        signals.push(\"Precedence: bulk header\");\n      }\n\n      // X-Mailer or other bulk mail headers\n      const hasXMailer = headers.some(\n        (h) =>\n          h.name?.toLowerCase() === \"x-mailer\" ||\n          h.name?.toLowerCase() === \"x-campaign\"\n      );\n      if (hasXMailer) {\n        score += 10;\n        signals.push(\"Bulk mailer header present\");\n      }\n    }\n  }\n\n  // 2. Check sender patterns\n  const senderLower = email.sender.toLowerCase();\n  for (const pattern of SPAM_SENDER_PATTERNS) {\n    if (pattern.test(senderLower)) {\n      score += 15;\n      signals.push(`Sender matches spam pattern: ${pattern.source}`);\n      break;\n    }\n  }\n\n  // 3. Check subject patterns\n  if (email.subject) {\n    for (const pattern of SPAM_SUBJECT_PATTERNS) {\n      if (pattern.test(email.subject)) {\n        score += 20;\n        signals.push(`Subject matches spam pattern: ${pattern.source}`);\n        break;\n      }\n    }\n  }\n\n  // 4. Check body for spam signals (unsubscribe prompts etc.)\n  const bodyText = email.bodyPlainText || \"\";\n  let bodySignalCount = 0;\n  for (const pattern of SPAM_BODY_PATTERNS) {\n    if (pattern.test(bodyText)) {\n      bodySignalCount++;\n    }\n  }\n  if (bodySignalCount >= 2) {\n    score += 15;\n    signals.push(`Body contains ${bodySignalCount} spam signals`);\n  }\n\n  // 5. Check if AI classified as \"Spam\"\n  if (email.labels) {\n    const spamLabel = email.labels.find((l) => l.name === \"Spam\");\n    if (spamLabel) {\n      score += 40;\n      signals.push(\n        `AI classified as Spam (${spamLabel.confidence}% confidence)`\n      );\n    }\n  }\n\n  // Extract unsubscribe link\n  const unsubscribeLink = extractUnsubscribeLink({\n    rawPayload: email.rawPayload,\n    bodyHtml: email.bodyHtml,\n    bodyPlainText: email.bodyPlainText,\n  });\n\n  if (unsubscribeLink) {\n    score += 10;\n    signals.push(\"Unsubscribe link found\");\n  }\n\n  const confidence = Math.min(score, 100);\n\n  return {\n    isSpam: confidence >= 50,\n    confidence,\n    signals,\n    unsubscribeLink,\n  };\n}\n\n/**\n * Mark an email as spam in the database, with optional unsubscribe link.\n */\nexport async function markEmailAsSpam(\n  emailId: number,\n  isSpam: boolean,\n  unsubscribeLink: string | null = null\n): Promise<void> {\n  await sql`\n    UPDATE emails\n    SET is_spam = ${isSpam},\n        unsubscribe_link = ${unsubscribeLink},\n        updated_at = NOW()\n    WHERE id = ${emailId}\n  `;\n}\n\n/**\n * Mark a Gmail email as spam in the database, with optional unsubscribe link.\n */\nexport async function markGmailEmailAsSpam(\n  emailId: string,\n  isSpam: boolean,\n  unsubscribeLink: string | null = null\n): Promise<void> {\n  await sql`\n    UPDATE gmail_emails\n    SET is_spam = ${isSpam},\n        unsubscribe_link = ${unsubscribeLink},\n        updated_at = NOW()\n    WHERE id = ${emailId}\n  `;\n}\n\n/**\n * Batch detect and mark spam for Outlook emails.\n */\nexport async function detectAndMarkSpam(\n  tenantId: string,\n  emailBatch: {\n    id: number;\n    sender: string;\n    subject: string | null;\n    body_plain_text?: string | null;\n    body_html?: string | null;\n    raw_payload?: Record<string, unknown> | null;\n    labels?: { name: string; confidence: number | null }[];\n  }[]\n): Promise<{ marked: number; total: number }> {\n  let marked = 0;\n\n  for (const email of emailBatch) {\n    const result = detectSpam({\n      sender: email.sender,\n      subject: email.subject,\n      bodyPlainText: email.body_plain_text,\n      bodyHtml: email.body_html,\n      rawPayload: email.raw_payload,\n      labels: email.labels,\n    });\n\n    if (result.isSpam) {\n      await markEmailAsSpam(email.id, true, result.unsubscribeLink);\n      marked++;\n    }\n  }\n\n  return { marked, total: emailBatch.length };\n}\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing email classification and inbox code",
      "status": "completed",
      "activeForm": "Exploring existing email classification and inbox code"
    },
    {
      "content": "Plan spam detection and unsubscribe implementation",
      "status": "completed",
      "activeForm": "Planning spam detection and unsubscribe implementation"
    },
    {
      "content": "Add 'Spam' to system labels in lib/email/labels.ts",
      "status": "completed",
      "activeForm": "Adding Spam to system labels"
    },
    {
      "content": "Add is_spam and unsubscribe_link columns to emails schema",
      "status": "completed",
      "activeForm": "Adding is_spam and unsubscribe_link columns to schema"
    },
    {
      "content": "Create spam detection module with unsubscribe link extraction",
      "status": "completed",
      "activeForm": "Creating spam detection module"
    },
    {
      "content": "Create API route for spam detection and unsubscribe",
      "status": "in_progress",
      "activeForm": "Creating API routes for spam detection and unsubscribe"
    },
    {
      "content": "Update listEmails and email list API to include spam/unsubscribe data",
      "status": "pending",
      "activeForm": "Updating listEmails and email list API"
    },
    {
      "content": "Add spam folder tab and unsubscribe button to inbox UI",
      "status": "pending",
      "activeForm": "Adding spam folder tab and unsubscribe button to inbox UI"
    },
    {
      "content": "Create database migration for new columns",
      "status": "pending",
      "activeForm": "Creating database migration"
    }
  ]
}
Now let me check for the existing newsletter detect API route pattern:

🔧 Tool: Glob
Input: {
  "pattern": "app/api/emails/newsletter/**/*"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\emails\\newsletter\\detect\\route.ts"
}
Now I'll create the spam detection API route and the mark/unmark spam route. Let me create both in parallel:

🔧 Tool: Bash
Input: {
  "command": "ls \"C:/Code/Krisp/app/api/emails/spam\" 2>/dev/null || echo \"Directory does not exist\"",
  "description": "Check if spam API directory exists"
}

🔧 Tool: Bash
Input: {
  "command": "mkdir -p \"C:/Code/Krisp/app/api/emails/spam/detect\" && mkdir -p \"C:/Code/Krisp/app/api/emails/spam/[id]\"",
  "description": "Create spam API directories"
}

🔧 Tool: Write
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\emails\\spam\\detect\\route.ts",
  "content": "import { NextResponse } from \"next/server\";\nimport { auth } from \"@/auth\";\nimport sql from \"@/lib/email/db\";\nimport { detectAndMarkSpam } from \"@/lib/email/spamDetection\";\nimport { getLabelsForEmails } from \"@/lib/email/labels\";\nimport { isEncrypted, decryptNullable } from \"@/lib/encryption\";\n\n/**\n * POST /api/emails/spam/detect\n * Batch detect spam among unprocessed emails.\n * Scans emails that haven't been marked as spam yet.\n */\nexport async function POST() {\n  try {\n    const session = await auth();\n    const userId = session?.user?.id;\n    if (!userId) {\n      return NextResponse.json({ error: \"Unauthorized\" }, { status: 401 });\n    }\n\n    // Fetch up to 50 Outlook emails that haven't been marked as spam\n    const rows = await sql`\n      SELECT id, sender, subject, body_plain_text, body_html, raw_payload\n      FROM emails\n      WHERE tenant_id = ${userId}\n        AND deleted_at IS NULL\n        AND is_spam = false\n      ORDER BY received_at DESC\n      LIMIT 50\n    `;\n\n    if (rows.length === 0) {\n      return NextResponse.json({ marked: 0, total: 0 });\n    }\n\n    // Decrypt sender/subject/body and get labels\n    const emailIds = (rows as { id: number }[]).map((r) => r.id);\n    const labelsMap = await getLabelsForEmails(emailIds);\n\n    const batch = (rows as Record<string, unknown>[]).map((row) => {\n      const sender = typeof row.sender === \"string\" && isEncrypted(row.sender)\n        ? decryptNullable(row.sender) ?? \"\"\n        : (row.sender as string);\n      const subject = typeof row.subject === \"string\" && isEncrypted(row.subject)\n        ? decryptNullable(row.subject)\n        : (row.subject as string | null);\n      const bodyPlain = typeof row.body_plain_text === \"string\" && isEncrypted(row.body_plain_text)\n        ? decryptNullable(row.body_plain_text)\n        : (row.body_plain_text as string | null);\n      const bodyHtml = typeof row.body_html === \"string\" && isEncrypted(row.body_html)\n        ? decryptNullable(row.body_html)\n        : (row.body_html as string | null);\n\n      return {\n        id: row.id as number,\n        sender,\n        subject,\n        body_plain_text: bodyPlain,\n        body_html: bodyHtml,\n        raw_payload: row.raw_payload as Record<string, unknown> | null,\n        labels: labelsMap[row.id as number] ?? [],\n      };\n    });\n\n    const result = await detectAndMarkSpam(userId, batch);\n\n    return NextResponse.json({\n      marked: result.marked,\n      total: result.total,\n    });\n  } catch (error) {\n    console.error(\"Error detecting spam:\", error);\n    return NextResponse.json(\n      { error: \"Failed to detect spam\" },\n      { status: 500 }\n    );\n  }\n}\n"
}
Now create the route to mark/unmark an email as spam (PATCH) with the unsubscribe link:

🔧 Tool: Write
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\emails\\spam\\[id]\\route.ts",
  "content": "import { NextRequest, NextResponse } from \"next/server\";\nimport { auth } from \"@/auth\";\nimport sql from \"@/lib/email/db\";\n\n/**\n * PATCH /api/emails/spam/:id\n * Mark or unmark an email as spam.\n * Body: { isSpam: boolean }\n */\nexport async function PATCH(\n  request: NextRequest,\n  { params }: { params: Promise<{ id: string }> }\n) {\n  try {\n    const session = await auth();\n    const userId = session?.user?.id;\n    if (!userId) {\n      return NextResponse.json({ error: \"Unauthorized\" }, { status: 401 });\n    }\n\n    const { id } = await params;\n    const emailId = parseInt(id, 10);\n    if (isNaN(emailId)) {\n      return NextResponse.json({ error: \"Invalid email ID\" }, { status: 400 });\n    }\n\n    const body = await request.json();\n    const { isSpam } = body as { isSpam: boolean };\n\n    if (typeof isSpam !== \"boolean\") {\n      return NextResponse.json(\n        { error: \"isSpam must be a boolean\" },\n        { status: 400 }\n      );\n    }\n\n    const rows = await sql`\n      UPDATE emails\n      SET is_spam = ${isSpam}, updated_at = NOW()\n      WHERE id = ${emailId} AND tenant_id = ${userId}\n      RETURNING id, is_spam\n    `;\n\n    if (rows.length === 0) {\n      return NextResponse.json({ error: \"Email not found\" }, { status: 404 });\n    }\n\n    return NextResponse.json({ data: rows[0] });\n  } catch (error) {\n    console.error(\"Error updating spam status:\", error);\n    return NextResponse.json(\n      { error: \"Failed to update spam status\" },\n      { status: 500 }\n    );\n  }\n}\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing email classification and inbox code",
      "status": "completed",
      "activeForm": "Exploring existing email classification and inbox code"
    },
    {
      "content": "Plan spam detection and unsubscribe implementation",
      "status": "completed",
      "activeForm": "Planning spam detection and unsubscribe implementation"
    },
    {
      "content": "Add 'Spam' to system labels in lib/email/labels.ts",
      "status": "completed",
      "activeForm": "Adding Spam to system labels"
    },
    {
      "content": "Add is_spam and unsubscribe_link columns to emails schema",
      "status": "completed",
      "activeForm": "Adding is_spam and unsubscribe_link columns to schema"
    },
    {
      "content": "Create spam detection module with unsubscribe link extraction",
      "status": "completed",
      "activeForm": "Creating spam detection module"
    },
    {
      "content": "Create API route for spam detection and unsubscribe",
      "status": "completed",
      "activeForm": "Creating API routes for spam detection and unsubscribe"
    },
    {
      "content": "Update listEmails and email list API to include spam/unsubscribe data",
      "status": "in_progress",
      "activeForm": "Updating listEmails and email list API"
    },
    {
      "content": "Add spam folder tab and unsubscribe button to inbox UI",
      "status": "pending",
      "activeForm": "Adding spam folder tab and unsubscribe button to inbox UI"
    },
    {
      "content": "Create database migration for new columns",
      "status": "pending",
      "activeForm": "Creating database migration"
    }
  ]
}
Now I need to update the `listEmails` function to support spam folder filtering and include the unsubscribe link, and update the email list API route and types.

First, update `listEmails` in `lib/email/emails.ts`:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\lib\\email\\emails.ts",
  "old_string": "export async function listEmails(\n  tenantId: string,\n  opts: { page: number; limit: number; q?: string; after?: string; before?: string; accountId?: string; folder?: string }\n): Promise<{ rows: Array<{\n  id: number;\n  sender: string;\n  subject: string | null;\n  received_at: string;\n  recipients: string[];\n  attachments_metadata: EmailAttachmentMetadata[];\n  preview: string | null;\n  web_link: string | null;\n  outlook_account_id: string | null;\n  is_newsletter: boolean;\n}>; total: number }> {\n  const after = opts.after || null;\n  const before = opts.before || null;\n  const accountId = opts.accountId || null;\n  // folder filter: \"newsletter\" = only newsletters, \"inbox\" = exclude newsletters, undefined = all\n  const showNewsletter = opts.folder === \"newsletter\" ? true : opts.folder === \"inbox\" ? false : null;\n\n  // Fetch all matching emails (date-filtered server-side)\n  const allRows = await sql`\n    SELECT\n      id, sender, subject, received_at,\n      recipients,\n      attachments_metadata,\n      body_plain_text,\n      web_link,\n      outlook_account_id,\n      is_newsletter\n    FROM emails\n    WHERE tenant_id = ${tenantId}\n      AND deleted_at IS NULL\n      AND (${after}::timestamptz IS NULL OR received_at >= ${after}::timestamptz)\n      AND (${before}::timestamptz IS NULL OR received_at <= ${before}::timestamptz)\n      AND (${accountId}::uuid IS NULL OR outlook_account_id = ${accountId}::uuid)\n      AND (${showNewsletter}::boolean IS NULL OR is_newsletter = ${showNewsletter}::boolean)\n    ORDER BY received_at DESC\n  `;\n\n  // Decrypt and build result objects\n  let decrypted = (allRows as Record<string, unknown>[]).map((row) => {\n    const dr = decryptRow(row);\n    return {\n      id: dr.id as number,\n      sender: dr.sender as string,\n      subject: dr.subject as string | null,\n      received_at: dr.received_at as string,\n      recipients: dr.recipients as string[],\n      attachments_metadata: dr.attachments_metadata as EmailAttachmentMetadata[],\n      preview: dr.body_plain_text\n        ? (dr.body_plain_text as string).slice(0, 200)\n        : null,\n      web_link: dr.web_link as string | null,\n      outlook_account_id: dr.outlook_account_id as string | null,\n      is_newsletter: dr.is_newsletter as boolean,\n    };\n  });\n\n  // Apply keyword filter on decrypted sender/subject\n  if (opts.q) {\n    const lower = opts.q.toLowerCase();\n    decrypted = decrypted.filter(\n      (r) =>\n        r.sender.toLowerCase().includes(lower) ||\n        (r.subject?.toLowerCase().includes(lower) ?? false)\n    );\n  }\n\n  const total = decrypted.length;\n  const offset = (opts.page - 1) * opts.limit;\n  const paged = decrypted.slice(offset, offset + opts.limit);\n\n  return { rows: paged, total };\n}",
  "new_string": "export async function listEmails(\n  tenantId: string,\n  opts: { page: number; limit: number; q?: string; after?: string; before?: string; accountId?: string; folder?: string }\n): Promise<{ rows: Array<{\n  id: number;\n  sender: string;\n  subject: string | null;\n  received_at: string;\n  recipients: string[];\n  attachments_metadata: EmailAttachmentMetadata[];\n  preview: string | null;\n  web_link: string | null;\n  outlook_account_id: string | null;\n  is_newsletter: boolean;\n  is_spam: boolean;\n  unsubscribe_link: string | null;\n}>; total: number }> {\n  const after = opts.after || null;\n  const before = opts.before || null;\n  const accountId = opts.accountId || null;\n  // folder filter: \"newsletter\" = only newsletters, \"inbox\" = exclude newsletters/spam, \"spam\" = only spam, undefined = all\n  const showNewsletter = opts.folder === \"newsletter\" ? true : opts.folder === \"inbox\" ? false : null;\n  const showSpam = opts.folder === \"spam\" ? true : opts.folder === \"inbox\" ? false : null;\n\n  // Fetch all matching emails (date-filtered server-side)\n  const allRows = await sql`\n    SELECT\n      id, sender, subject, received_at,\n      recipients,\n      attachments_metadata,\n      body_plain_text,\n      web_link,\n      outlook_account_id,\n      is_newsletter,\n      is_spam,\n      unsubscribe_link\n    FROM emails\n    WHERE tenant_id = ${tenantId}\n      AND deleted_at IS NULL\n      AND (${after}::timestamptz IS NULL OR received_at >= ${after}::timestamptz)\n      AND (${before}::timestamptz IS NULL OR received_at <= ${before}::timestamptz)\n      AND (${accountId}::uuid IS NULL OR outlook_account_id = ${accountId}::uuid)\n      AND (${showNewsletter}::boolean IS NULL OR is_newsletter = ${showNewsletter}::boolean)\n      AND (${showSpam}::boolean IS NULL OR is_spam = ${showSpam}::boolean)\n    ORDER BY received_at DESC\n  `;\n\n  // Decrypt and build result objects\n  let decrypted = (allRows as Record<string, unknown>[]).map((row) => {\n    const dr = decryptRow(row);\n    return {\n      id: dr.id as number,\n      sender: dr.sender as string,\n      subject: dr.subject as string | null,\n      received_at: dr.received_at as string,\n      recipients: dr.recipients as string[],\n      attachments_metadata: dr.attachments_metadata as EmailAttachmentMetadata[],\n      preview: dr.body_plain_text\n        ? (dr.body_plain_text as string).slice(0, 200)\n        : null,\n      web_link: dr.web_link as string | null,\n      outlook_account_id: dr.outlook_account_id as string | null,\n      is_newsletter: dr.is_newsletter as boolean,\n      is_spam: dr.is_spam as boolean,\n      unsubscribe_link: dr.unsubscribe_link as string | null,\n    };\n  });\n\n  // Apply keyword filter on decrypted sender/subject\n  if (opts.q) {\n    const lower = opts.q.toLowerCase();\n    decrypted = decrypted.filter(\n      (r) =>\n        r.sender.toLowerCase().includes(lower) ||\n        (r.subject?.toLowerCase().includes(lower) ?? false)\n    );\n  }\n\n  const total = decrypted.length;\n  const offset = (opts.page - 1) * opts.limit;\n  const paged = decrypted.slice(offset, offset + opts.limit);\n\n  return { rows: paged, total };\n}"
}
Now update the email types to include `is_spam` and `unsubscribe_link`:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\types\\email.ts",
  "old_string": "// Inbox list item (lightweight, excludes body content)\nexport interface EmailListItem {\n  id: number | string;\n  sender: string;\n  subject: string | null;\n  received_at: string;\n  recipients: string[];\n  has_attachments: boolean;\n  preview: string | null;\n  web_link: string | null;\n  outlook_account_id: string | null;\n  account_id: string | null;\n  provider: \"outlook\" | \"gmail\" | \"zoom\";\n  labels?: EmailLabelChip[];\n  is_newsletter?: boolean;\n}",
  "new_string": "// Inbox list item (lightweight, excludes body content)\nexport interface EmailListItem {\n  id: number | string;\n  sender: string;\n  subject: string | null;\n  received_at: string;\n  recipients: string[];\n  has_attachments: boolean;\n  preview: string | null;\n  web_link: string | null;\n  outlook_account_id: string | null;\n  account_id: string | null;\n  provider: \"outlook\" | \"gmail\" | \"zoom\";\n  labels?: EmailLabelChip[];\n  is_newsletter?: boolean;\n  is_spam?: boolean;\n  unsubscribe_link?: string | null;\n}"
}
Now update the email list API route to pass spam/unsubscribe data through, and add "spam" to the folder enum in validators:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\api\\emails\\route.ts",
  "old_string": "      const outlookItems: EmailListItem[] = rows.map((row) => ({\n        id: row.id,\n        sender: row.sender,\n        subject: row.subject,\n        received_at: row.received_at as unknown as string,\n        recipients: Array.isArray(row.recipients) ? row.recipients : [],\n        has_attachments: Array.isArray(row.attachments_metadata) && (row.attachments_metadata as EmailAttachmentMetadata[]).length > 0,\n        preview: row.preview,\n        web_link: row.web_link ?? null,\n        outlook_account_id: row.outlook_account_id ?? null,\n        account_id: row.outlook_account_id ?? null,\n        provider: \"outlook\" as const,\n        labels: labelsMap[row.id] ?? [],\n        is_newsletter: row.is_newsletter,\n      }));",
  "new_string": "      const outlookItems: EmailListItem[] = rows.map((row) => ({\n        id: row.id,\n        sender: row.sender,\n        subject: row.subject,\n        received_at: row.received_at as unknown as string,\n        recipients: Array.isArray(row.recipients) ? row.recipients : [],\n        has_attachments: Array.isArray(row.attachments_metadata) && (row.attachments_metadata as EmailAttachmentMetadata[]).length > 0,\n        preview: row.preview,\n        web_link: row.web_link ?? null,\n        outlook_account_id: row.outlook_account_id ?? null,\n        account_id: row.outlook_account_id ?? null,\n        provider: \"outlook\" as const,\n        labels: labelsMap[row.id] ?? [],\n        is_newsletter: row.is_newsletter,\n        is_spam: row.is_spam,\n        unsubscribe_link: row.unsubscribe_link,\n      }));"
}
Now update the validator schema to accept "spam" as a folder value:

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\validators\\schemas.ts"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\lib\\validators\\schemas.ts",
  "old_string": "  folder: z.enum([\"inbox\", \"newsletter\"]).optional(),",
  "new_string": "  folder: z.enum([\"inbox\", \"newsletter\", \"spam\"]).optional(),"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing email classification and inbox code",
      "status": "completed",
      "activeForm": "Exploring existing email classification and inbox code"
    },
    {
      "content": "Plan spam detection and unsubscribe implementation",
      "status": "completed",
      "activeForm": "Planning spam detection and unsubscribe implementation"
    },
    {
      "content": "Add 'Spam' to system labels in lib/email/labels.ts",
      "status": "completed",
      "activeForm": "Adding Spam to system labels"
    },
    {
      "content": "Add is_spam and unsubscribe_link columns to emails schema",
      "status": "completed",
      "activeForm": "Adding is_spam and unsubscribe_link columns to schema"
    },
    {
      "content": "Create spam detection module with unsubscribe link extraction",
      "status": "completed",
      "activeForm": "Creating spam detection module"
    },
    {
      "content": "Create API route for spam detection and unsubscribe",
      "status": "completed",
      "activeForm": "Creating API routes for spam detection and unsubscribe"
    },
    {
      "content": "Update listEmails and email list API to include spam/unsubscribe data",
      "status": "completed",
      "activeForm": "Updating listEmails and email list API"
    },
    {
      "content": "Add spam folder tab and unsubscribe button to inbox UI",
      "status": "in_progress",
      "activeForm": "Adding spam folder tab and unsubscribe button to inbox UI"
    },
    {
      "content": "Create database migration for new columns",
      "status": "pending",
      "activeForm": "Creating database migration"
    }
  ]
}
Now let me also check how gmail emails are listed, since the email API route also handles gmail:

🔧 Tool: Grep
Input: {
  "pattern": "export async function listGmailEmails",
  "output_mode": "files_with_matches"
}

🔧 Tool: Grep
Input: {
  "pattern": "is_newsletter|is_spam|unsubscribe_link",
  "path": "C:\\Code\\Krisp\\lib\\gmail\\emails.ts",
  "output_mode": "content",
  "-n": true
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\gmail\\emails.ts",
  "offset": 130,
  "limit": 80
}
I need to update the gmail listEmails function too to support spam filtering and return spam/unsubscribe data:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\lib\\gmail\\emails.ts",
  "old_string": "export async function listGmailEmails(\n  tenantId: string,\n  opts: { q?: string; after?: string; before?: string; gmailAccountId?: string; folder?: string }\n): Promise<Array<{\n  id: string;\n  sender: string;\n  subject: string | null;\n  received_at: string;\n  recipients: string[];\n  has_attachments: boolean;\n  preview: string | null;\n  web_link: string | null;\n  gmail_account_id: string | null;\n  is_newsletter: boolean;\n}>> {\n  const after = opts.after || null;\n  const before = opts.before || null;\n  const showNewsletter = opts.folder === \"newsletter\" ? true : opts.folder === \"inbox\" ? false : null;\n\n  const allRows = await sql`\n    SELECT\n      id, sender, subject, received_at,\n      recipients, attachments, body_plain,\n      tenant_id, is_newsletter\n    FROM gmail_emails\n    WHERE tenant_id = ${tenantId}\n      AND (${after}::timestamptz IS NULL OR received_at >= ${after}::timestamptz)\n      AND (${before}::timestamptz IS NULL OR received_at <= ${before}::timestamptz)\n      AND (${showNewsletter}::boolean IS NULL OR is_newsletter = ${showNewsletter}::boolean)\n    ORDER BY received_at DESC\n  `;\n\n  let decrypted = (allRows as Record<string, unknown>[]).map((row) => {\n    const dr = decryptGmailRow(row);\n    const attachments = dr.attachments;\n    const hasAttachments = Array.isArray(attachments) && attachments.length > 0;\n    return {\n      id: dr.id as string,\n      sender: dr.sender as string,\n      subject: dr.subject as string | null,\n      received_at: dr.received_at as string,\n      recipients: Array.isArray(dr.recipients) ? dr.recipients : [],\n      has_attachments: hasAttachments,\n      preview: dr.body_plain\n        ? (dr.body_plain as string).slice(0, 200)\n        : null,\n      web_link: null as string | null,\n      gmail_account_id: opts.gmailAccountId ?? null,\n      is_newsletter: dr.is_newsletter as boolean,\n    };\n  });\n\n  // Apply keyword filter on decrypted sender/subject\n  if (opts.q) {\n    const lower = opts.q.toLowerCase();\n    decrypted = decrypted.filter(\n      (r) =>\n        r.sender.toLowerCase().includes(lower) ||\n        (r.subject?.toLowerCase().includes(lower) ?? false)\n    );\n  }\n\n  return decrypted;\n}",
  "new_string": "export async function listGmailEmails(\n  tenantId: string,\n  opts: { q?: string; after?: string; before?: string; gmailAccountId?: string; folder?: string }\n): Promise<Array<{\n  id: string;\n  sender: string;\n  subject: string | null;\n  received_at: string;\n  recipients: string[];\n  has_attachments: boolean;\n  preview: string | null;\n  web_link: string | null;\n  gmail_account_id: string | null;\n  is_newsletter: boolean;\n  is_spam: boolean;\n  unsubscribe_link: string | null;\n}>> {\n  const after = opts.after || null;\n  const before = opts.before || null;\n  const showNewsletter = opts.folder === \"newsletter\" ? true : opts.folder === \"inbox\" ? false : null;\n  const showSpam = opts.folder === \"spam\" ? true : opts.folder === \"inbox\" ? false : null;\n\n  const allRows = await sql`\n    SELECT\n      id, sender, subject, received_at,\n      recipients, attachments, body_plain,\n      tenant_id, is_newsletter, is_spam, unsubscribe_link\n    FROM gmail_emails\n    WHERE tenant_id = ${tenantId}\n      AND (${after}::timestamptz IS NULL OR received_at >= ${after}::timestamptz)\n      AND (${before}::timestamptz IS NULL OR received_at <= ${before}::timestamptz)\n      AND (${showNewsletter}::boolean IS NULL OR is_newsletter = ${showNewsletter}::boolean)\n      AND (${showSpam}::boolean IS NULL OR is_spam = ${showSpam}::boolean)\n    ORDER BY received_at DESC\n  `;\n\n  let decrypted = (allRows as Record<string, unknown>[]).map((row) => {\n    const dr = decryptGmailRow(row);\n    const attachments = dr.attachments;\n    const hasAttachments = Array.isArray(attachments) && attachments.length > 0;\n    return {\n      id: dr.id as string,\n      sender: dr.sender as string,\n      subject: dr.subject as string | null,\n      received_at: dr.received_at as string,\n      recipients: Array.isArray(dr.recipients) ? dr.recipients : [],\n      has_attachments: hasAttachments,\n      preview: dr.body_plain\n        ? (dr.body_plain as string).slice(0, 200)\n        : null,\n      web_link: null as string | null,\n      gmail_account_id: opts.gmailAccountId ?? null,\n      is_newsletter: dr.is_newsletter as boolean,\n      is_spam: dr.is_spam as boolean,\n      unsubscribe_link: dr.unsubscribe_link as string | null,\n    };\n  });\n\n  // Apply keyword filter on decrypted sender/subject\n  if (opts.q) {\n    const lower = opts.q.toLowerCase();\n    decrypted = decrypted.filter(\n      (r) =>\n        r.sender.toLowerCase().includes(lower) ||\n        (r.subject?.toLowerCase().includes(lower) ?? false)\n    );\n  }\n\n  return decrypted;\n}"
}
Now update the email API route to also pass through gmail spam/unsubscribe data:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\api\\emails\\route.ts",
  "old_string": "      const gmailItems: EmailListItem[] = gmailRows.map((row) => ({\n        id: row.id,\n        sender: row.sender,\n        subject: row.subject,\n        received_at: row.received_at as unknown as string,\n        recipients: Array.isArray(row.recipients) ? row.recipients : [],\n        has_attachments: row.has_attachments,\n        preview: row.preview,\n        web_link: row.web_link,\n        outlook_account_id: null,\n        account_id: row.gmail_account_id,\n        provider: \"gmail\" as const,\n        labels: [],\n        is_newsletter: row.is_newsletter,\n      }));",
  "new_string": "      const gmailItems: EmailListItem[] = gmailRows.map((row) => ({\n        id: row.id,\n        sender: row.sender,\n        subject: row.subject,\n        received_at: row.received_at as unknown as string,\n        recipients: Array.isArray(row.recipients) ? row.recipients : [],\n        has_attachments: row.has_attachments,\n        preview: row.preview,\n        web_link: row.web_link,\n        outlook_account_id: null,\n        account_id: row.gmail_account_id,\n        provider: \"gmail\" as const,\n        labels: [],\n        is_newsletter: row.is_newsletter,\n        is_spam: row.is_spam,\n        unsubscribe_link: row.unsubscribe_link,\n      }));"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\emails\\route.ts"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\api\\emails\\route.ts",
  "old_string": "      const gmailItems: EmailListItem[] = gmailRows.map((row) => ({\n        id: row.id,\n        sender: row.sender,\n        subject: row.subject,\n        received_at: row.received_at as unknown as string,\n        recipients: Array.isArray(row.recipients) ? row.recipients : [],\n        has_attachments: row.has_attachments,\n        preview: row.preview,\n        web_link: row.web_link,\n        outlook_account_id: null,\n        account_id: row.gmail_account_id,\n        provider: \"gmail\" as const,\n        labels: [],\n        is_newsletter: row.is_newsletter,\n      }));",
  "new_string": "      const gmailItems: EmailListItem[] = gmailRows.map((row) => ({\n        id: row.id,\n        sender: row.sender,\n        subject: row.subject,\n        received_at: row.received_at as unknown as string,\n        recipients: Array.isArray(row.recipients) ? row.recipients : [],\n        has_attachments: row.has_attachments,\n        preview: row.preview,\n        web_link: row.web_link,\n        outlook_account_id: null,\n        account_id: row.gmail_account_id,\n        provider: \"gmail\" as const,\n        labels: [],\n        is_newsletter: row.is_newsletter,\n        is_spam: row.is_spam,\n        unsubscribe_link: row.unsubscribe_link,\n      }));"
}
Also need to exclude Zoom from spam folder queries:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\api\\emails\\route.ts",
  "old_string": "    // Fetch Zoom chat messages\n    if (fetchZoom && folder !== \"newsletter\") {",
  "new_string": "    // Fetch Zoom chat messages (skip for newsletter/spam folders)\n    if (fetchZoom && folder !== \"newsletter\" && folder !== \"spam\") {"
}
Now the big update - the inbox UI. I need to add:
1. A "Spam" folder tab
2. A "Detect Spam" button
3. An unsubscribe button that appears prominently on spam emails
4. A spam indicator icon

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\inbox\\page.tsx",
  "offset": 167,
  "limit": 50
}
The inbox page seems to have been modified since I first read it — there are new smart label creation fields. Let me re-read the full file to get the current state:

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\inbox\\page.tsx"
}
Good, now I have the complete current state of the file. I need to make 4 key changes to the inbox page:

1. Update the `activeFolder` type to include "spam"
2. Add "Spam" tab to folder tabs  
3. Add a "Detect Spam" button
4. Add spam indicator and prominent unsubscribe button to email rows
5. Update the header title for spam folder

Let me make these changes:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\inbox\\page.tsx",
  "old_string": "  // Newsletter state\n  const [activeFolder, setActiveFolder] = useState<\"inbox\" | \"newsletter\" | \"all\">(\"inbox\");\n  const [detecting, setDetecting] = useState(false);\n  const [syncing, setSyncing] = useState(false);",
  "new_string": "  // Newsletter & Spam state\n  const [activeFolder, setActiveFolder] = useState<\"inbox\" | \"newsletter\" | \"spam\" | \"all\">(\"inbox\");\n  const [detecting, setDetecting] = useState(false);\n  const [detectingSpam, setDetectingSpam] = useState(false);\n  const [syncing, setSyncing] = useState(false);"
}
Now add the spam detect handler after the newsletter detect handler:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\inbox\\page.tsx",
  "old_string": "  // Fetch whitelist\n  const fetchWhitelist = async () => {",
  "new_string": "  // Detect spam\n  const handleDetectSpam = async () => {\n    setDetectingSpam(true);\n    try {\n      const res = await fetch(\"/api/emails/spam/detect\", { method: \"POST\" });\n      if (!res.ok) throw new Error(\"Failed to detect spam\");\n      const data = await res.json();\n      toast({\n        title: \"Spam detection complete\",\n        description: `${data.marked} spam emails detected out of ${data.total} scanned`,\n        variant: \"success\",\n      });\n      hasFetchedOnce.current = false;\n      fetchEmails(false);\n    } catch {\n      toast({ title: \"Spam detection failed\", variant: \"destructive\" });\n    } finally {\n      setDetectingSpam(false);\n    }\n  };\n\n  // Handle unsubscribe click\n  const handleUnsubscribe = (e: React.MouseEvent, link: string) => {\n    e.stopPropagation();\n    e.preventDefault();\n    window.open(link, \"_blank\", \"noopener,noreferrer\");\n  };\n\n  // Fetch whitelist\n  const fetchWhitelist = async () => {"
}
Now update the header title to include "Spam":

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\inbox\\page.tsx",
  "old_string": "            <h1 className=\"text-2xl font-bold text-[var(--foreground)]\">\n              {activeFolder === \"newsletter\" ? \"Newsletters\" : \"Inbox\"}\n            </h1>",
  "new_string": "            <h1 className=\"text-2xl font-bold text-[var(--foreground)]\">\n              {activeFolder === \"newsletter\" ? \"Newsletters\" : activeFolder === \"spam\" ? \"Spam\" : \"Inbox\"}\n            </h1>"
}
Now add the "Detect Spam" button next to the "Detect" newsletters button:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\inbox\\page.tsx",
  "old_string": "            {/* Manage labels button */}\n            <button\n              onClick={() => setShowLabelManager(true)}\n              className=\"px-3 py-2 text-sm font-medium rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors\"\n              data-testid=\"manage-labels-button\"\n            >",
  "new_string": "            {/* Detect spam button */}\n            <button\n              onClick={handleDetectSpam}\n              disabled={detectingSpam}\n              className=\"px-3 py-2 text-sm font-medium rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors disabled:opacity-40\"\n              title=\"Detect spam and unwanted emails\"\n              data-testid=\"detect-spam-button\"\n            >\n              {detectingSpam ? (\n                <span className=\"flex items-center gap-1.5\">\n                  <svg className=\"animate-spin h-3.5 w-3.5\" viewBox=\"0 0 24 24\" fill=\"none\">\n                    <circle className=\"opacity-25\" cx=\"12\" cy=\"12\" r=\"10\" stroke=\"currentColor\" strokeWidth=\"4\" />\n                    <path className=\"opacity-75\" fill=\"currentColor\" d=\"M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z\" />\n                  </svg>\n                  Scanning...\n                </span>\n              ) : (\n                <span className=\"flex items-center gap-1.5\">\n                  <svg xmlns=\"http://www.w3.org/2000/svg\" width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"2\" strokeLinecap=\"round\" strokeLinejoin=\"round\">\n                    <path d=\"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z\" />\n                    <line x1=\"9\" y1=\"9\" x2=\"15\" y2=\"15\" />\n                    <line x1=\"15\" y1=\"9\" x2=\"9\" y2=\"15\" />\n                  </svg>\n                  Spam\n                </span>\n              )}\n            </button>\n\n            {/* Manage labels button */}\n            <button\n              onClick={() => setShowLabelManager(true)}\n              className=\"px-3 py-2 text-sm font-medium rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors\"\n              data-testid=\"manage-labels-button\"\n            >"
}
Now add the "Spam" tab to folder tabs:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\inbox\\page.tsx",
  "old_string": "          {([\n            { key: \"inbox\" as const, label: \"Inbox\" },\n            { key: \"newsletter\" as const, label: \"Newsletters\" },\n            { key: \"all\" as const, label: \"All\" },\n          ]).map((tab) => (",
  "new_string": "          {([\n            { key: \"inbox\" as const, label: \"Inbox\" },\n            { key: \"newsletter\" as const, label: \"Newsletters\" },\n            { key: \"spam\" as const, label: \"Spam\" },\n            { key: \"all\" as const, label: \"All\" },\n          ]).map((tab) => ("
}
Now add the spam indicator and prominent unsubscribe button to each email row. I'll add:
1. A spam shield icon in the status indicators column 
2. A prominent "Unsubscribe" button in the actions area that's always visible (not hidden on hover) for spam emails

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\inbox\\page.tsx",
  "old_string": "                  {(classifiedIds.has(String(email.id)) || classifiedIds.has(email.id)) && (\n                    <svg\n                      xmlns=\"http://www.w3.org/2000/svg\"\n                      width=\"12\"\n                      height=\"12\"\n                      viewBox=\"0 0 24 24\"\n                      fill=\"none\"\n                      stroke=\"currentColor\"\n                      strokeWidth=\"2.5\"\n                      strokeLinecap=\"round\"\n                      strokeLinejoin=\"round\"\n                      className=\"text-emerald-500\"\n                      aria-label=\"Classified by AI\"\n                    >\n                      <polyline points=\"20 6 9 17 4 12\" />\n                    </svg>\n                  )}\n                </div>",
  "new_string": "                  {email.is_spam && (\n                    <svg\n                      xmlns=\"http://www.w3.org/2000/svg\"\n                      width=\"12\"\n                      height=\"12\"\n                      viewBox=\"0 0 24 24\"\n                      fill=\"none\"\n                      stroke=\"currentColor\"\n                      strokeWidth=\"2\"\n                      strokeLinecap=\"round\"\n                      strokeLinejoin=\"round\"\n                      className=\"text-red-500\"\n                      aria-label=\"Spam\"\n                    >\n                      <path d=\"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z\" />\n                      <line x1=\"9\" y1=\"9\" x2=\"15\" y2=\"15\" />\n                      <line x1=\"15\" y1=\"9\" x2=\"9\" y2=\"15\" />\n                    </svg>\n                  )}\n                  {(classifiedIds.has(String(email.id)) || classifiedIds.has(email.id)) && (\n                    <svg\n                      xmlns=\"http://www.w3.org/2000/svg\"\n                      width=\"12\"\n                      height=\"12\"\n                      viewBox=\"0 0 24 24\"\n                      fill=\"none\"\n                      stroke=\"currentColor\"\n                      strokeWidth=\"2.5\"\n                      strokeLinecap=\"round\"\n                      strokeLinejoin=\"round\"\n                      className=\"text-emerald-500\"\n                      aria-label=\"Classified by AI\"\n                    >\n                      <polyline points=\"20 6 9 17 4 12\" />\n                    </svg>\n                  )}\n                </div>"
}


I'll continue from where we left off. I need to:
1. Add the prominent unsubscribe button to the inbox UI email rows
2. Create the database migration
3. Output the summary

Let me first read the current state of the inbox page to see what's already been added.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\inbox\\page.tsx"
}
Good, I can see the current state. The inbox UI already has the spam detection button, spam folder tab, spam icon indicator, and the `handleUnsubscribe` function. Now I need to add the prominent unsubscribe button to the email row actions area. I'll make it always visible (not hidden behind hover) for emails with an unsubscribe link.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing email classification and inbox code",
      "status": "completed",
      "activeForm": "Exploring existing email classification and inbox code"
    },
    {
      "content": "Plan spam detection and unsubscribe implementation",
      "status": "completed",
      "activeForm": "Planning spam detection and unsubscribe implementation"
    },
    {
      "content": "Add 'Spam' to system labels in lib/email/labels.ts",
      "status": "completed",
      "activeForm": "Adding Spam to system labels"
    },
    {
      "content": "Add is_spam and unsubscribe_link columns to emails schema",
      "status": "completed",
      "activeForm": "Adding is_spam and unsubscribe_link columns to schema"
    },
    {
      "content": "Create spam detection module with unsubscribe link extraction",
      "status": "completed",
      "activeForm": "Creating spam detection module"
    },
    {
      "content": "Create API route for spam detection and unsubscribe",
      "status": "completed",
      "activeForm": "Creating API routes for spam detection and unsubscribe"
    },
    {
      "content": "Update listEmails and email list API to include spam/unsubscribe data",
      "status": "completed",
      "activeForm": "Updating listEmails and email list API"
    },
    {
      "content": "Add spam folder tab and unsubscribe button to inbox UI",
      "status": "in_progress",
      "activeForm": "Adding spam folder tab and unsubscribe button to inbox UI"
    },
    {
      "content": "Create database migration for new columns",
      "status": "pending",
      "activeForm": "Creating database migration"
    }
  ]
}
Now I'll add the prominent unsubscribe button. It should be always visible (not inside the `opacity-0 group-hover:opacity-100` div) for emails that have an `unsubscribe_link`. I'll add it between the Link and the hover actions div.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\inbox\\page.tsx",
  "old_string": "                {/* Actions */}\n                <div className=\"flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity\">\n                  <button\n                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); openSmartLabelCreator(email); }}\n                    className=\"p-1.5 rounded-md text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors\"\n                    title=\"Create smart label from this email\"\n                  >\n                    <svg xmlns=\"http://www.w3.org/2000/svg\" width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"2\" strokeLinecap=\"round\" strokeLinejoin=\"round\">\n                      <path d=\"M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z\" />\n                      <line x1=\"7\" y1=\"7\" x2=\"7.01\" y2=\"7\" />\n                      <line x1=\"17\" y1=\"2\" x2=\"17\" y2=\"7\" />\n                      <line x1=\"14.5\" y1=\"4.5\" x2=\"19.5\" y2=\"4.5\" />\n                    </svg>\n                  </button>",
  "new_string": "                {/* Unsubscribe button — always visible for emails with unsubscribe link */}\n                {email.unsubscribe_link && (\n                  <button\n                    onClick={(e) => handleUnsubscribe(e, email.unsubscribe_link!)}\n                    className=\"flex-shrink-0 px-2.5 py-1 text-xs font-medium rounded-md bg-red-500/10 text-red-600 hover:bg-red-500/20 border border-red-500/20 transition-colors\"\n                    title=\"Unsubscribe from this sender\"\n                    data-testid=\"unsubscribe-button\"\n                  >\n                    Unsubscribe\n                  </button>\n                )}\n\n                {/* Actions */}\n                <div className=\"flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity\">\n                  <button\n                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); openSmartLabelCreator(email); }}\n                    className=\"p-1.5 rounded-md text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors\"\n                    title=\"Create smart label from this email\"\n                  >\n                    <svg xmlns=\"http://www.w3.org/2000/svg\" width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"2\" strokeLinecap=\"round\" strokeLinejoin=\"round\">\n                      <path d=\"M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z\" />\n                      <line x1=\"7\" y1=\"7\" x2=\"7.01\" y2=\"7\" />\n                      <line x1=\"17\" y1=\"2\" x2=\"17\" y2=\"7\" />\n                      <line x1=\"14.5\" y1=\"4.5\" x2=\"19.5\" y2=\"4.5\" />\n                    </svg>\n                  </button>"
}
Now let me mark the UI task as complete and move on to the database migration.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing email classification and inbox code",
      "status": "completed",
      "activeForm": "Exploring existing email classification and inbox code"
    },
    {
      "content": "Plan spam detection and unsubscribe implementation",
      "status": "completed",
      "activeForm": "Planning spam detection and unsubscribe implementation"
    },
    {
      "content": "Add 'Spam' to system labels in lib/email/labels.ts",
      "status": "completed",
      "activeForm": "Adding Spam to system labels"
    },
    {
      "content": "Add is_spam and unsubscribe_link columns to emails schema",
      "status": "completed",
      "activeForm": "Adding is_spam and unsubscribe_link columns to schema"
    },
    {
      "content": "Create spam detection module with unsubscribe link extraction",
      "status": "completed",
      "activeForm": "Creating spam detection module"
    },
    {
      "content": "Create API route for spam detection and unsubscribe",
      "status": "completed",
      "activeForm": "Creating API routes for spam detection and unsubscribe"
    },
    {
      "content": "Update listEmails and email list API to include spam/unsubscribe data",
      "status": "completed",
      "activeForm": "Updating listEmails and email list API"
    },
    {
      "content": "Add spam folder tab and unsubscribe button to inbox UI",
      "status": "completed",
      "activeForm": "Adding spam folder tab and unsubscribe button to inbox UI"
    },
    {
      "content": "Create database migration for new columns",
      "status": "in_progress",
      "activeForm": "Creating database migration"
    }
  ]
}
Let me check the existing migration files to follow the naming convention.

🔧 Tool: Glob
Input: {
  "pattern": "drizzle/migrations/003*.sql"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\drizzle\\migrations\\meta\\_journal.json"
}
I see the latest migration is `0033_smart-label-drafts.sql` on disk but the journal only goes up to `0032`. Let me check what the latest migration file looks like for the pattern, and check if `0029_add-newsletter-detection.sql` already exists (which might have the `is_newsletter` column for reference).

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\drizzle\\migrations\\0029_add-newsletter-detection.sql"
}
Good, I can see the pattern. Now I'll create the migration for spam detection columns. The next number after `0033` would be `0034`.

🔧 Tool: Write
Input: {
  "file_path": "C:\\Code\\Krisp\\drizzle\\migrations\\0034_add-spam-detection.sql",
  "content": "-- Add spam detection columns to emails and gmail_emails tables\n\n-- Add is_spam and unsubscribe_link columns to emails table\nALTER TABLE emails ADD COLUMN IF NOT EXISTS is_spam BOOLEAN NOT NULL DEFAULT false;\nALTER TABLE emails ADD COLUMN IF NOT EXISTS unsubscribe_link TEXT;\n\n-- Add is_spam and unsubscribe_link columns to gmail_emails table\nALTER TABLE gmail_emails ADD COLUMN IF NOT EXISTS is_spam BOOLEAN NOT NULL DEFAULT false;\nALTER TABLE gmail_emails ADD COLUMN IF NOT EXISTS unsubscribe_link TEXT;\n\n-- Add index for spam filtering on emails\nCREATE INDEX IF NOT EXISTS idx_emails_is_spam ON emails (tenant_id, is_spam) WHERE is_spam = true;\n\n-- Add index for spam filtering on gmail_emails\nCREATE INDEX IF NOT EXISTS idx_gmail_emails_is_spam ON gmail_emails (tenant_id, is_spam) WHERE is_spam = true;\n"
}
Now update the journal to register this migration.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\drizzle\\migrations\\meta\\_journal.json",
  "old_string": "    {\n      \"idx\": 26,\n      \"version\": \"7\",\n      \"when\": 1772900000000,\n      \"tag\": \"0032_smart-labels\",\n      \"breakpoints\": true\n    }\n  ]\n}",
  "new_string": "    {\n      \"idx\": 26,\n      \"version\": \"7\",\n      \"when\": 1772900000000,\n      \"tag\": \"0032_smart-labels\",\n      \"breakpoints\": true\n    },\n    {\n      \"idx\": 27,\n      \"version\": \"7\",\n      \"when\": 1772910000000,\n      \"tag\": \"0034_add-spam-detection\",\n      \"breakpoints\": true\n    }\n  ]\n}"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing email classification and inbox code",
      "status": "completed",
      "activeForm": "Exploring existing email classification and inbox code"
    },
    {
      "content": "Plan spam detection and unsubscribe implementation",
      "status": "completed",
      "activeForm": "Planning spam detection and unsubscribe implementation"
    },
    {
      "content": "Add 'Spam' to system labels in lib/email/labels.ts",
      "status": "completed",
      "activeForm": "Adding Spam to system labels"
    },
    {
      "content": "Add is_spam and unsubscribe_link columns to emails schema",
      "status": "completed",
      "activeForm": "Adding is_spam and unsubscribe_link columns to schema"
    },
    {
      "content": "Create spam detection module with unsubscribe link extraction",
      "status": "completed",
      "activeForm": "Creating spam detection module"
    },
    {
      "content": "Create API route for spam detection and unsubscribe",
      "status": "completed",
      "activeForm": "Creating API routes for spam detection and unsubscribe"
    },
    {
      "content": "Update listEmails and email list API to include spam/unsubscribe data",
      "status": "completed",
      "activeForm": "Updating listEmails and email list API"
    },
    {
      "content": "Add spam folder tab and unsubscribe button to inbox UI",
      "status": "completed",
      "activeForm": "Adding spam folder tab and unsubscribe button to inbox UI"
    },
    {
      "content": "Create database migration for new columns",
      "status": "completed",
      "activeForm": "Creating database migration"
    }
  ]
}
All tasks are complete. Here's the summary of what was implemented:

<Summary>

## Spam Detection & Unsubscribe Feature

### Files Created
- **`lib/email/spamDetection.ts`** — Spam detection module with heuristic scoring (sender patterns, subject keywords, body signals, bulk headers, AI label matching) and unsubscribe link extraction from List-Unsubscribe headers, HTML body, and plain text body
- **`app/api/emails/spam/detect/route.ts`** — POST endpoint for batch spam detection across both Outlook and Gmail emails
- **`app/api/emails/spam/[id]/route.ts`** — PATCH endpoint for manually marking/unmarking individual emails as spam
- **`drizzle/migrations/0034_add-spam-detection.sql`** — Database migration adding `is_spam` (boolean) and `unsubscribe_link` (text) columns to both `emails` and `gmail_emails` tables with partial indexes

### Files Modified
- **`lib/email/labels.ts`** — Added "Spam" system label with red color (#DC2626)
- **`lib/db/schema.ts`** — Added `isSpam` and `unsubscribeLink` column definitions to both emails and gmail_emails Drizzle schemas
- **`lib/email/emails.ts`** — Updated `listEmails()` to include `is_spam`, `unsubscribe_link` in SELECT/results, added `showSpam` folder filter logic
- **`lib/gmail/emails.ts`** — Updated `listGmailEmails()` with matching spam filter and column additions
- **`app/api/emails/route.ts`** — Added `is_spam` and `unsubscribe_link` to both Outlook and Gmail item mappings, excluded spam from Zoom results
- **`types/email.ts`** — Added `is_spam` and `unsubscribe_link` to `EmailListItem` interface
- **`lib/validators/schemas.ts`** — Extended folder enum to include `"spam"`
- **`app/(app)/inbox/page.tsx`** — Added spam folder tab, "Detect Spam" button, spam shield icon indicator, and always-visible "Unsubscribe" button on email rows
- **`drizzle/migrations/meta/_journal.json`** — Registered new migration entry

### How It Works
1. **Detection**: Heuristic scoring system (threshold >= 50) analyzes sender patterns, subject keywords, body signals, bulk mail headers, and AI classification labels
2. **Unsubscribe extraction**: Parses RFC 2369 List-Unsubscribe headers (both MS Graph and Gmail raw payload formats), HTML anchor tags, and plain text URLs
3. **UI**: Spam tab filters to spam-only emails; always-visible red "Unsubscribe" button on any email with an extracted unsubscribe link opens it in a new tab for one-click unsubscription

</Summary>