

Let me first understand how emails are ingested in this codebase to find the right hook point for automatic classification.

🔧 Tool: Task
Input: {
  "description": "Find email ingestion hooks",
  "subagent_type": "Explore",
  "prompt": "I need to find where new emails are ingested/synced in the Krisp codebase so I can add automatic smart label classification. Look for:\n\n1. Email sync routes - check `app/api/gmail/sync/`, `app/api/outlook/sync/`, and any webhook endpoints that receive new emails\n2. Gmail push notification handler - check for `app/api/gmail/` routes that handle Gmail push notifications\n3. Any cron jobs or background tasks that sync emails - check `app/api/cron/`\n4. The email creation/insertion logic - where are new emails actually inserted into the database?\n5. Check `lib/gmail/` and `lib/outlook/` for sync functions\n6. Check `lib/email/emails.ts` for any insert/upsert functions\n\nRead the actual file contents to understand the flow. I need to know the exact function/location where a new email is committed to the database so I can add a classification call after it.\n\nWorking directory: C:\\Code\\Krisp",
  "model": "sonnet"
}

🔧 Tool: Glob
Input: {
  "pattern": "app/api/gmail/sync/**/*.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "app/api/outlook/sync/**/*.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "app/api/gmail/**/*.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "app/api/cron/**/*.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "lib/gmail/**/*.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "lib/outlook/**/*.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\gmail\\sync\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\outlook\\sync\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\gmail\\watch\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\gmail\\emails.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\outlook\\messages.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\email\\emails.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "app/api/gmail/webhook/**/*.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "app/api/webhooks/**/*.ts"
}

🔧 Tool: Grep
Input: {
  "pattern": "gmail.*push|push.*notification|pubsub",
  "output_mode": "files_with_matches",
  "glob": "**/*.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\webhooks\\email\\gmail\\[tenantId]\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\webhooks\\email\\graph\\[tenantId]\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\webhooks\\email\\microsoft365\\[tenantId]\\route.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "lib/smartLabels/**/*.ts"
}

🔧 Tool: Grep
Input: {
  "pattern": "smart.*label|classify|categorize",
  "output_mode": "files_with_matches",
  "glob": "**/*.ts",
  "-i": true
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\smartLabels\\classify.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\email\\classifyEmail.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\smartLabels\\labels.ts"
}

🔧 Tool: Grep
Input: {
  "pattern": "email.*label|ensureSystemLabels|assignLabelsToEmail",
  "output_mode": "files_with_matches",
  "glob": "lib/**/*.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\email\\classifyEmail.ts",
  "offset": 1,
  "limit": 30
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\email\\labels.ts"
}
Now let me read the specific files where I need to add classification hooks.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\gmail\\sync\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\outlook\\sync\\route.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "app/api/webhooks/email/**/*.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\webhooks\\email\\gmail\\[tenantId]\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\webhooks\\email\\graph\\[tenantId]\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\webhooks\\email\\microsoft365\\[tenantId]\\route.ts"
}
Now I need to check what `insertGmailEmail` and `insertEmail` return, since I need the email ID to pass to `classifyItem`.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\gmail\\emails.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\email\\emails.ts"
}
Now I have a clear picture. Here's what I need to know:

- `insertGmailEmail()` returns `GmailEmailRow | null` (null = duplicate). The row has an `id` field.
- `insertEmail()` returns `EmailRow` with an `id` field (numeric).
- `updateEmailByMessageId()` returns `void` — for Graph, I need the messageId to find the email ID.

The classification engine's `classifyItem("email", itemId, tenantId)` fetches content from the `emails` table. Gmail emails are in `gmail_emails` — I need to check if the classify function handles both tables. Let me check.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\smartLabels\\classify.ts",
  "offset": 30,
  "limit": 30
}
The classify function only queries the `emails` table (Outlook), not `gmail_emails`. I need to:

1. Add a `gmail_email` item type to the classifier, or update the `email` case to also check `gmail_emails`
2. Add the auto-classification hooks to all 5 ingestion points
3. Handle encrypted content (the classifier fetches raw DB content which is encrypted)

Let me also check if the classifier handles encrypted content:

🔧 Tool: Grep
Input: {
  "pattern": "decrypt|encrypt",
  "path": "C:\\Code\\Krisp\\lib\\smartLabels\\classify.ts",
  "output_mode": "content"
}
The classifier doesn't handle encrypted content. The `emails` and `gmail_emails` tables have encrypted sender, subject, and body columns. I need to fix this. Let me also check the validators for the `gmail_email` item type.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Update classify.ts to handle encrypted content and both email tables",
      "status": "in_progress",
      "activeForm": "Updating classifier for encrypted content"
    },
    {
      "content": "Add auto-classification to Gmail sync route",
      "status": "pending",
      "activeForm": "Adding auto-classification to Gmail sync"
    },
    {
      "content": "Add auto-classification to Gmail Pub/Sub webhook",
      "status": "pending",
      "activeForm": "Adding auto-classification to Gmail webhook"
    },
    {
      "content": "Add auto-classification to Gmail Apps Script webhook",
      "status": "pending",
      "activeForm": "Adding auto-classification to Gmail Apps Script webhook"
    },
    {
      "content": "Add auto-classification to Outlook sync route",
      "status": "pending",
      "activeForm": "Adding auto-classification to Outlook sync"
    },
    {
      "content": "Add auto-classification to Graph webhook",
      "status": "pending",
      "activeForm": "Adding auto-classification to Graph webhook"
    },
    {
      "content": "Add auto-classification to Microsoft 365 webhook",
      "status": "pending",
      "activeForm": "Adding auto-classification to M365 webhook"
    },
    {
      "content": "Update validators to support gmail_email item type",
      "status": "pending",
      "activeForm": "Updating validators"
    }
  ]
}
Now let me update the classifier to handle encrypted content and support both `email` (Outlook) and `gmail_email` item types.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\smartLabels\\classify.ts"
}
Now let me check the encryption import path:

🔧 Tool: Grep
Input: {
  "pattern": "from.*@/lib/encryption",
  "output_mode": "content",
  "head_limit": 5
}
Good. Now I have a clear plan. I'll also add an overloaded `classifyItem` that can accept pre-fetched content to avoid the DB round-trip (since webhooks already have the email content in memory). This is more efficient. Let me implement everything:

**1. Update `classify.ts`** — add decryption, `gmail_email` support, and a content-passing overload.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\lib\\smartLabels\\classify.ts",
  "old_string": "import { chatCompletion } from \"@/lib/ai/client\";\nimport { resolvePrompt } from \"@/lib/ai/resolvePrompt\";\nimport { PROMPT_SMART_LABEL_CLASSIFY } from \"@/lib/ai/prompts\";\nimport {\n  getActiveSmartLabels,\n  assignSmartLabel,\n  isItemSmartClassified,\n} from \"./labels\";\nimport sql from \"./db\";\nimport type { SmartLabel } from \"@/types/smartLabel\";\n\n/** Max body characters sent to the AI to control token usage. */\nconst MAX_BODY_CHARS = 3000;\n\n/** Maximum labels evaluated per classification pass. */\nconst MAX_LABELS_PER_PASS = 20;\n\ninterface ClassificationMatch {\n  label: string;\n  confidence: number;\n}\n\ninterface ClassificationResult {\n  matches: ClassificationMatch[];\n}\n\n/**\n * Fetch item content from the database based on type and ID.\n */\nasync function fetchItemContent(\n  itemType: string,\n  itemId: string,\n  tenantId: string\n): Promise<string | null> {\n  switch (itemType) {\n    case \"email\": {\n      const rows = await sql`\n        SELECT sender, subject, body_plain_text, recipients\n        FROM emails\n        WHERE id = ${parseInt(itemId, 10)} AND tenant_id = ${tenantId} AND deleted_at IS NULL\n      `;\n      if (rows.length === 0) return null;\n      const e = rows[0] as { sender: string; subject: string | null; body_plain_text: string | null; recipients: string[] };\n      return [\n        `From: ${e.sender}`,\n        `To: ${Array.isArray(e.recipients) ? e.recipients.join(\", \") : \"\"}`,\n        `Subject: ${e.subject || \"(No subject)\"}`,\n        `Body:\\n${(e.body_plain_text || \"\").slice(0, MAX_BODY_CHARS)}`,\n      ].join(\"\\n\");\n    }",
  "new_string": "import { chatCompletion } from \"@/lib/ai/client\";\nimport { resolvePrompt } from \"@/lib/ai/resolvePrompt\";\nimport { PROMPT_SMART_LABEL_CLASSIFY } from \"@/lib/ai/prompts\";\nimport {\n  getActiveSmartLabels,\n  assignSmartLabel,\n  isItemSmartClassified,\n} from \"./labels\";\nimport sql from \"./db\";\nimport { decryptNullable, isEncrypted } from \"@/lib/encryption\";\nimport type { SmartLabel } from \"@/types/smartLabel\";\n\n/** Max body characters sent to the AI to control token usage. */\nconst MAX_BODY_CHARS = 3000;\n\n/** Maximum labels evaluated per classification pass. */\nconst MAX_LABELS_PER_PASS = 20;\n\ninterface ClassificationMatch {\n  label: string;\n  confidence: number;\n}\n\ninterface ClassificationResult {\n  matches: ClassificationMatch[];\n}\n\n/** Decrypt a value if it's encrypted, otherwise return as-is. */\nfunction maybeDecrypt(val: string | null | undefined): string | null {\n  if (!val) return null;\n  if (isEncrypted(val)) return decryptNullable(val);\n  return val;\n}\n\n/**\n * Build a text summary from pre-fetched email data (avoids DB round-trip).\n */\nexport function buildEmailContent(data: {\n  sender: string;\n  recipients?: string[];\n  subject?: string | null;\n  bodyPlainText?: string | null;\n}): string {\n  return [\n    `From: ${data.sender}`,\n    `To: ${(data.recipients ?? []).join(\", \")}`,\n    `Subject: ${data.subject || \"(No subject)\"}`,\n    `Body:\\n${(data.bodyPlainText || \"\").slice(0, MAX_BODY_CHARS)}`,\n  ].join(\"\\n\");\n}\n\n/**\n * Fetch item content from the database based on type and ID.\n */\nasync function fetchItemContent(\n  itemType: string,\n  itemId: string,\n  tenantId: string\n): Promise<string | null> {\n  switch (itemType) {\n    case \"email\": {\n      const rows = await sql`\n        SELECT sender, subject, body_plain_text, recipients\n        FROM emails\n        WHERE id = ${parseInt(itemId, 10)} AND tenant_id = ${tenantId} AND deleted_at IS NULL\n      `;\n      if (rows.length === 0) return null;\n      const e = rows[0] as { sender: string; subject: string | null; body_plain_text: string | null; recipients: string[] };\n      return [\n        `From: ${maybeDecrypt(e.sender) || \"\"}`,\n        `To: ${Array.isArray(e.recipients) ? e.recipients.join(\", \") : \"\"}`,\n        `Subject: ${maybeDecrypt(e.subject) || \"(No subject)\"}`,\n        `Body:\\n${(maybeDecrypt(e.body_plain_text) || \"\").slice(0, MAX_BODY_CHARS)}`,\n      ].join(\"\\n\");\n    }\n    case \"gmail_email\": {\n      const rows = await sql`\n        SELECT sender, subject, body_plain, recipients\n        FROM gmail_emails\n        WHERE id = ${parseInt(itemId, 10)} AND tenant_id = ${tenantId}\n      `;\n      if (rows.length === 0) return null;\n      const e = rows[0] as { sender: string; subject: string | null; body_plain: string | null; recipients: string[] };\n      return [\n        `From: ${maybeDecrypt(e.sender) || \"\"}`,\n        `To: ${Array.isArray(e.recipients) ? e.recipients.join(\", \") : \"\"}`,\n        `Subject: ${maybeDecrypt(e.subject) || \"(No subject)\"}`,\n        `Body:\\n${(maybeDecrypt(e.body_plain) || \"\").slice(0, MAX_BODY_CHARS)}`,\n      ].join(\"\\n\");\n    }"
}
Now update the `classifyItem` function to also accept pre-fetched content:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\lib\\smartLabels\\classify.ts",
  "old_string": "/**\n * Classify a single item against all active smart labels.\n * Idempotent: skips if already classified by AI.\n */\nexport async function classifyItem(\n  itemType: string,\n  itemId: string,\n  tenantId: string,\n  options?: { force?: boolean }\n): Promise<{ matches: string[]; skipped: boolean }> {\n  // Idempotency check (unless forced)\n  if (!options?.force && await isItemSmartClassified(itemType, itemId)) {\n    return { matches: [], skipped: true };\n  }\n\n  const labels = await getActiveSmartLabels(tenantId);\n  if (labels.length === 0) {\n    return { matches: [], skipped: false };\n  }\n\n  const content = await fetchItemContent(itemType, itemId, tenantId);\n  if (!content) {\n    return { matches: [], skipped: false };\n  }",
  "new_string": "/**\n * Classify a single item against all active smart labels.\n * Idempotent: skips if already classified by AI.\n *\n * @param options.force     Re-classify even if already classified\n * @param options.content   Pre-fetched plaintext content (skips DB fetch)\n */\nexport async function classifyItem(\n  itemType: string,\n  itemId: string,\n  tenantId: string,\n  options?: { force?: boolean; content?: string }\n): Promise<{ matches: string[]; skipped: boolean }> {\n  // Idempotency check (unless forced)\n  if (!options?.force && await isItemSmartClassified(itemType, itemId)) {\n    return { matches: [], skipped: true };\n  }\n\n  const labels = await getActiveSmartLabels(tenantId);\n  if (labels.length === 0) {\n    return { matches: [], skipped: false };\n  }\n\n  const content = options?.content || await fetchItemContent(itemType, itemId, tenantId);\n  if (!content) {\n    return { matches: [], skipped: false };\n  }"
}
Now add `gmail_email` to the batch classification switch:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\lib\\smartLabels\\classify.ts",
  "old_string": "    case \"email\": {\n      const rows = await sql`\n        SELECT e.id::text as item_id\n        FROM emails e\n        WHERE e.tenant_id = ${tenantId}\n          AND e.deleted_at IS NULL\n          AND NOT EXISTS (\n            SELECT 1 FROM smart_label_items sli\n            WHERE sli.item_type = 'email' AND sli.item_id = e.id::text AND sli.assigned_by = 'ai'\n          )\n        ORDER BY e.received_at DESC\n        LIMIT ${limit}\n      `;\n      itemIds = (rows as { item_id: string }[]).map((r) => r.item_id);\n      break;\n    }",
  "new_string": "    case \"email\": {\n      const rows = await sql`\n        SELECT e.id::text as item_id\n        FROM emails e\n        WHERE e.tenant_id = ${tenantId}\n          AND e.deleted_at IS NULL\n          AND NOT EXISTS (\n            SELECT 1 FROM smart_label_items sli\n            WHERE sli.item_type = 'email' AND sli.item_id = e.id::text AND sli.assigned_by = 'ai'\n          )\n        ORDER BY e.received_at DESC\n        LIMIT ${limit}\n      `;\n      itemIds = (rows as { item_id: string }[]).map((r) => r.item_id);\n      break;\n    }\n    case \"gmail_email\": {\n      const rows = await sql`\n        SELECT g.id::text as item_id\n        FROM gmail_emails g\n        WHERE g.tenant_id = ${tenantId}\n          AND NOT EXISTS (\n            SELECT 1 FROM smart_label_items sli\n            WHERE sli.item_type = 'gmail_email' AND sli.item_id = g.id::text AND sli.assigned_by = 'ai'\n          )\n        ORDER BY g.received_at DESC\n        LIMIT ${limit}\n      `;\n      itemIds = (rows as { item_id: string }[]).map((r) => r.item_id);\n      break;\n    }"
}
Now update the validators to support `gmail_email` item type:

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\validators\\schemas.ts",
  "offset": 340,
  "limit": 20
}

🔧 Tool: Grep
Input: {
  "pattern": "classifySmartLabelsSchema|batchClassifySmartLabelsSchema",
  "path": "C:\\Code\\Krisp\\lib\\validators\\schemas.ts",
  "output_mode": "content",
  "-n": true,
  "-C": 3
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\lib\\validators\\schemas.ts",
  "old_string": "export const classifySmartLabelsSchema = z.object({\n  itemType: z.enum([\"email\", \"card\", \"action_item\", \"meeting\"]),\n  itemId: z.string().min(1),\n});\n\nexport const batchClassifySmartLabelsSchema = z.object({\n  itemType: z.enum([\"email\", \"card\", \"action_item\", \"meeting\"]),\n  limit: z.coerce.number().int().min(1).max(50).default(10),\n});",
  "new_string": "export const classifySmartLabelsSchema = z.object({\n  itemType: z.enum([\"email\", \"gmail_email\", \"card\", \"action_item\", \"meeting\"]),\n  itemId: z.string().min(1),\n});\n\nexport const batchClassifySmartLabelsSchema = z.object({\n  itemType: z.enum([\"email\", \"gmail_email\", \"card\", \"action_item\", \"meeting\"]),\n  limit: z.coerce.number().int().min(1).max(50).default(10),\n});"
}
Also update the types file:

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\types\\smartLabel.ts"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\types\\smartLabel.ts",
  "old_string": "  item_type: \"email\" | \"card\" | \"action_item\" | \"meeting\";",
  "new_string": "  item_type: \"email\" | \"gmail_email\" | \"card\" | \"action_item\" | \"meeting\";"
}
Also update the admin UI's classify dropdown to include Gmail emails:

🔧 Tool: Grep
Input: {
  "pattern": "option value=.email",
  "path": "C:\\Code\\Krisp\\app\\(app)\\admin\\smart-labels\\SmartLabelsClient.tsx",
  "output_mode": "content",
  "-C": 3
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\smart-labels\\SmartLabelsClient.tsx",
  "old_string": "            <option value=\"email\">Emails</option>\n            <option value=\"card\">Cards</option>\n            <option value=\"action_item\">Action Items</option>",
  "new_string": "            <option value=\"email\">Outlook Emails</option>\n            <option value=\"gmail_email\">Gmail Emails</option>\n            <option value=\"card\">Cards</option>\n            <option value=\"action_item\">Action Items</option>"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\smart-labels\\SmartLabelsClient.tsx",
  "offset": 525,
  "limit": 12
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\smart-labels\\SmartLabelsClient.tsx",
  "old_string": "            <option value=\"email\">Emails</option>\n            <option value=\"card\">Cards</option>\n            <option value=\"action_item\">Action Items</option>",
  "new_string": "            <option value=\"email\">Outlook Emails</option>\n            <option value=\"gmail_email\">Gmail Emails</option>\n            <option value=\"card\">Cards</option>\n            <option value=\"action_item\">Action Items</option>"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Update classify.ts to handle encrypted content and both email tables",
      "status": "completed",
      "activeForm": "Updating classifier for encrypted content"
    },
    {
      "content": "Update validators to support gmail_email item type",
      "status": "completed",
      "activeForm": "Updating validators"
    },
    {
      "content": "Add auto-classification to Gmail sync route",
      "status": "in_progress",
      "activeForm": "Adding auto-classification to Gmail sync"
    },
    {
      "content": "Add auto-classification to Gmail Pub/Sub webhook",
      "status": "pending",
      "activeForm": "Adding auto-classification to Gmail webhook"
    },
    {
      "content": "Add auto-classification to Gmail Apps Script webhook",
      "status": "pending",
      "activeForm": "Adding auto-classification to Gmail Apps Script webhook"
    },
    {
      "content": "Add auto-classification to Outlook sync route",
      "status": "pending",
      "activeForm": "Adding auto-classification to Outlook sync"
    },
    {
      "content": "Add auto-classification to Graph webhook",
      "status": "pending",
      "activeForm": "Adding auto-classification to Graph webhook"
    },
    {
      "content": "Add auto-classification to Microsoft 365 webhook",
      "status": "pending",
      "activeForm": "Adding auto-classification to M365 webhook"
    }
  ]
}
Now let me add auto-classification hooks to all 5 ingestion points. The pattern is: add `classifyItem` call in a `after()` callback (for webhooks that already use `after()`, add to the existing one; for sync routes, add `after()` from `next/server`).

**2. Gmail sync route** — add auto-classification after each inserted email:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\api\\gmail\\sync\\route.ts",
  "old_string": "import { NextRequest, NextResponse } from \"next/server\";\nimport { auth } from \"@/auth\";\nimport {\n  getActiveWatch,\n  getValidAccessToken,\n  fetchGmailMessage,\n  extractBodies,\n  extractAttachments,\n  getHeader,\n} from \"@/lib/gmail/watch\";\nimport { insertGmailEmail, gmailEmailExists } from \"@/lib/gmail/emails\";",
  "new_string": "import { NextRequest, NextResponse, after } from \"next/server\";\nimport { auth } from \"@/auth\";\nimport {\n  getActiveWatch,\n  getValidAccessToken,\n  fetchGmailMessage,\n  extractBodies,\n  extractAttachments,\n  getHeader,\n} from \"@/lib/gmail/watch\";\nimport { insertGmailEmail, gmailEmailExists } from \"@/lib/gmail/emails\";\nimport { classifyItem, buildEmailContent } from \"@/lib/smartLabels/classify\";"
}
Now add the classification call after successful insertions. I'll collect inserted emails and classify in a background `after()`:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\api\\gmail\\sync\\route.ts",
  "old_string": "    let inserted = 0;\n    let skipped = 0;\n\n    for (const stub of messageStubs) {\n      // Check if already exists\n      const exists = await gmailEmailExists(userId, stub.id);\n      if (exists) {\n        skipped++;\n        continue;\n      }\n\n      try {\n        const message = await fetchGmailMessage(accessToken, stub.id);\n        const { bodyPlain, bodyHtml } = extractBodies(message);\n        const attachments = extractAttachments(message);\n\n        const parseRecipients = (header: string | undefined) =>\n          header\n            ? header\n                .split(\",\")\n                .map((s) => s.trim())\n                .filter(Boolean)\n            : [];\n\n        const recipients = {\n          to: parseRecipients(getHeader(message, \"To\")),\n          cc: parseRecipients(getHeader(message, \"Cc\")),\n          bcc: parseRecipients(getHeader(message, \"Bcc\")),\n        };\n\n        await insertGmailEmail({\n          tenant_id: userId,\n          gmail_message_id: message.id,\n          thread_id: message.threadId,\n          sender: getHeader(message, \"From\") ?? \"(unknown)\",\n          recipients,\n          subject: getHeader(message, \"Subject\") ?? null,\n          body_plain: bodyPlain,\n          body_html: bodyHtml,\n          received_at: new Date(parseInt(message.internalDate, 10)),\n          attachments,\n          labels: message.labelIds ?? [],\n          raw_payload: null,\n        });\n\n        inserted++;\n      } catch (err) {\n        console.error(`[Gmail Sync] Failed to fetch/insert message ${stub.id}:`, err);\n      }\n    }\n\n    return NextResponse.json({\n      message: \"Gmail sync completed\",\n      total: messageStubs.length,\n      inserted,\n      skipped,\n    });",
  "new_string": "    let inserted = 0;\n    let skipped = 0;\n    const newEmails: { id: string; sender: string; recipients: string[]; subject: string | null; bodyPlainText: string | null }[] = [];\n\n    for (const stub of messageStubs) {\n      // Check if already exists\n      const exists = await gmailEmailExists(userId, stub.id);\n      if (exists) {\n        skipped++;\n        continue;\n      }\n\n      try {\n        const message = await fetchGmailMessage(accessToken, stub.id);\n        const { bodyPlain, bodyHtml } = extractBodies(message);\n        const attachments = extractAttachments(message);\n\n        const parseRecipients = (header: string | undefined) =>\n          header\n            ? header\n                .split(\",\")\n                .map((s) => s.trim())\n                .filter(Boolean)\n            : [];\n\n        const recipients = {\n          to: parseRecipients(getHeader(message, \"To\")),\n          cc: parseRecipients(getHeader(message, \"Cc\")),\n          bcc: parseRecipients(getHeader(message, \"Bcc\")),\n        };\n\n        const sender = getHeader(message, \"From\") ?? \"(unknown)\";\n        const subject = getHeader(message, \"Subject\") ?? null;\n\n        const row = await insertGmailEmail({\n          tenant_id: userId,\n          gmail_message_id: message.id,\n          thread_id: message.threadId,\n          sender,\n          recipients,\n          subject,\n          body_plain: bodyPlain,\n          body_html: bodyHtml,\n          received_at: new Date(parseInt(message.internalDate, 10)),\n          attachments,\n          labels: message.labelIds ?? [],\n          raw_payload: null,\n        });\n\n        if (row) {\n          inserted++;\n          newEmails.push({\n            id: String(row.id),\n            sender,\n            recipients: [...(recipients.to || []), ...(recipients.cc || [])],\n            subject,\n            bodyPlainText: bodyPlain ?? null,\n          });\n        }\n      } catch (err) {\n        console.error(`[Gmail Sync] Failed to fetch/insert message ${stub.id}:`, err);\n      }\n    }\n\n    // Auto-classify new emails with smart labels in background\n    if (newEmails.length > 0) {\n      after(async () => {\n        for (const email of newEmails) {\n          try {\n            const content = buildEmailContent(email);\n            await classifyItem(\"gmail_email\", email.id, userId, { content });\n          } catch (err) {\n            console.error(`[Gmail Sync] Smart label classification failed for ${email.id}:`, err);\n          }\n        }\n      });\n    }\n\n    return NextResponse.json({\n      message: \"Gmail sync completed\",\n      total: messageStubs.length,\n      inserted,\n      skipped,\n    });"
}
**3. Gmail Pub/Sub webhook** — add smart label classification to the existing `after()` block:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\api\\webhooks\\email\\gmail\\[tenantId]\\route.ts",
  "old_string": "import { NextRequest, NextResponse, after } from \"next/server\";\nimport { insertGmailEmail } from \"@/lib/gmail/emails\";\nimport { processGmailNotification } from \"@/lib/gmail/watch\";\nimport {\n  pubSubPushMessageSchema,\n  gmailAppsScriptPayloadSchema,\n} from \"@/lib/validators/schemas\";\nimport { db } from \"@/lib/db\";\nimport { users } from \"@/lib/db/schema\";\nimport { eq } from \"drizzle-orm\";\nimport { autoProcessEmailActions } from \"@/lib/actions/autoProcessEmailActions\";\nimport { dispatchWebhooks } from \"@/lib/webhooks/dispatch\";",
  "new_string": "import { NextRequest, NextResponse, after } from \"next/server\";\nimport { insertGmailEmail } from \"@/lib/gmail/emails\";\nimport { processGmailNotification } from \"@/lib/gmail/watch\";\nimport {\n  pubSubPushMessageSchema,\n  gmailAppsScriptPayloadSchema,\n} from \"@/lib/validators/schemas\";\nimport { db } from \"@/lib/db\";\nimport { users } from \"@/lib/db/schema\";\nimport { eq } from \"drizzle-orm\";\nimport { autoProcessEmailActions } from \"@/lib/actions/autoProcessEmailActions\";\nimport { dispatchWebhooks } from \"@/lib/webhooks/dispatch\";\nimport { classifyItem, buildEmailContent } from \"@/lib/smartLabels/classify\";"
}
Now add classification to the Pub/Sub handler's `after()` block:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\api\\webhooks\\email\\gmail\\[tenantId]\\route.ts",
  "old_string": "      // Auto-extract action items from newly stored emails in background\n      if (storedEmails.length > 0) {\n        after(async () => {\n          for (const emailData of storedEmails) {\n            try {\n              const recipients = Array.isArray(emailData.recipients)\n                ? emailData.recipients.map(String)\n                : [];\n              await autoProcessEmailActions(tenantId, {\n                sender: emailData.sender,\n                recipients,\n                subject: emailData.subject ?? null,\n                bodyPlainText: emailData.body_plain ?? null,\n                receivedAt:\n                  emailData.received_at instanceof Date\n                    ? emailData.received_at.toISOString()\n                    : String(emailData.received_at),\n              });\n            } catch (actionErr) {\n              console.error(\n                `[Gmail Pub/Sub] Error auto-processing actions for ${emailData.gmail_message_id}:`,\n                actionErr instanceof Error ? actionErr.message : actionErr\n              );\n            }\n          }\n        });\n      }",
  "new_string": "      // Auto-extract action items + smart label classification in background\n      if (storedEmails.length > 0) {\n        after(async () => {\n          for (const emailData of storedEmails) {\n            const recipients = Array.isArray(emailData.recipients)\n              ? emailData.recipients.map(String)\n              : [];\n\n            // Auto-process action items\n            try {\n              await autoProcessEmailActions(tenantId, {\n                sender: emailData.sender,\n                recipients,\n                subject: emailData.subject ?? null,\n                bodyPlainText: emailData.body_plain ?? null,\n                receivedAt:\n                  emailData.received_at instanceof Date\n                    ? emailData.received_at.toISOString()\n                    : String(emailData.received_at),\n              });\n            } catch (actionErr) {\n              console.error(\n                `[Gmail Pub/Sub] Error auto-processing actions for ${emailData.gmail_message_id}:`,\n                actionErr instanceof Error ? actionErr.message : actionErr\n              );\n            }\n\n            // Smart label classification\n            try {\n              const content = buildEmailContent({\n                sender: emailData.sender,\n                recipients,\n                subject: emailData.subject ?? null,\n                bodyPlainText: emailData.body_plain ?? null,\n              });\n              // We need the DB row ID — fetch it by gmail_message_id\n              const rows = await (await import(\"@/lib/smartLabels/db\")).default`\n                SELECT id FROM gmail_emails\n                WHERE tenant_id = ${tenantId} AND gmail_message_id = ${emailData.gmail_message_id}\n              `;\n              if (rows[0]) {\n                await classifyItem(\"gmail_email\", String(rows[0].id), tenantId, { content });\n              }\n            } catch (classifyErr) {\n              console.error(\n                `[Gmail Pub/Sub] Smart label classification failed for ${emailData.gmail_message_id}:`,\n                classifyErr instanceof Error ? classifyErr.message : classifyErr\n              );\n            }\n          }\n        });\n      }"
}
Wait, that dynamic import is ugly. The `insertGmailEmail` already returns the row with its ID. Let me fix this more cleanly. Looking back at the Pub/Sub handler — `storedEmails` contains the raw `emailData` objects (not the DB rows). But `insertGmailEmail` returns `GmailEmailRow | null` which has the `id`. I need to track the IDs from insertion.

Let me fix the approach — store the row IDs during insertion:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\api\\webhooks\\email\\gmail\\[tenantId]\\route.ts",
  "old_string": "    if (result.emails && result.emails.length > 0) {\n      let stored = 0;\n      const storedEmails: typeof result.emails = [];\n      for (const emailData of result.emails) {\n        try {\n          const row = await insertGmailEmail(emailData);\n          if (row) {\n            stored++;\n            storedEmails.push(emailData);\n          }\n        } catch (err) {",
  "new_string": "    if (result.emails && result.emails.length > 0) {\n      let stored = 0;\n      const storedEmails: (typeof result.emails[0] & { _dbId: string })[] = [];\n      for (const emailData of result.emails) {\n        try {\n          const row = await insertGmailEmail(emailData);\n          if (row) {\n            stored++;\n            storedEmails.push({ ...emailData, _dbId: String(row.id) });\n          }\n        } catch (err) {"
}
Now simplify the classification in the `after()` block to use the stored `_dbId`:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\api\\webhooks\\email\\gmail\\[tenantId]\\route.ts",
  "old_string": "            // Smart label classification\n            try {\n              const content = buildEmailContent({\n                sender: emailData.sender,\n                recipients,\n                subject: emailData.subject ?? null,\n                bodyPlainText: emailData.body_plain ?? null,\n              });\n              // We need the DB row ID — fetch it by gmail_message_id\n              const rows = await (await import(\"@/lib/smartLabels/db\")).default`\n                SELECT id FROM gmail_emails\n                WHERE tenant_id = ${tenantId} AND gmail_message_id = ${emailData.gmail_message_id}\n              `;\n              if (rows[0]) {\n                await classifyItem(\"gmail_email\", String(rows[0].id), tenantId, { content });\n              }\n            } catch (classifyErr) {\n              console.error(\n                `[Gmail Pub/Sub] Smart label classification failed for ${emailData.gmail_message_id}:`,\n                classifyErr instanceof Error ? classifyErr.message : classifyErr\n              );\n            }",
  "new_string": "            // Smart label classification\n            try {\n              const content = buildEmailContent({\n                sender: emailData.sender,\n                recipients,\n                subject: emailData.subject ?? null,\n                bodyPlainText: emailData.body_plain ?? null,\n              });\n              await classifyItem(\"gmail_email\", emailData._dbId, tenantId, { content });\n            } catch (classifyErr) {\n              console.error(\n                `[Gmail Pub/Sub] Smart label classification failed for ${emailData.gmail_message_id}:`,\n                classifyErr instanceof Error ? classifyErr.message : classifyErr\n              );\n            }"
}
**4. Gmail Apps Script handler** — add smart label classification to the existing `after()`:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\api\\webhooks\\email\\gmail\\[tenantId]\\route.ts",
  "old_string": "  // Auto-extract action items in background\n  after(async () => {\n    try {\n      await autoProcessEmailActions(tenantId, {\n        sender: payload.sender,\n        recipients: recipientsList,\n        subject: payload.subject ?? null,\n        bodyPlainText: payload.bodyPlain ?? null,\n        receivedAt: payload.receivedAt,\n      });\n    } catch (err) {\n      console.error(\n        `[Gmail Apps Script] Error auto-processing actions for ${payload.messageId}:`,\n        err instanceof Error ? err.message : err\n      );\n    }\n  });",
  "new_string": "  // Auto-extract action items + smart label classification in background\n  after(async () => {\n    try {\n      await autoProcessEmailActions(tenantId, {\n        sender: payload.sender,\n        recipients: recipientsList,\n        subject: payload.subject ?? null,\n        bodyPlainText: payload.bodyPlain ?? null,\n        receivedAt: payload.receivedAt,\n      });\n    } catch (err) {\n      console.error(\n        `[Gmail Apps Script] Error auto-processing actions for ${payload.messageId}:`,\n        err instanceof Error ? err.message : err\n      );\n    }\n\n    // Smart label classification\n    try {\n      const content = buildEmailContent({\n        sender: payload.sender,\n        recipients: recipientsList,\n        subject: payload.subject ?? null,\n        bodyPlainText: payload.bodyPlain ?? null,\n      });\n      await classifyItem(\"gmail_email\", String(result.id), tenantId, { content });\n    } catch (err) {\n      console.error(\n        `[Gmail Apps Script] Smart label classification failed for ${payload.messageId}:`,\n        err instanceof Error ? err.message : err\n      );\n    }\n  });"
}
**5. Outlook sync route** — add auto-classification:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\api\\outlook\\sync\\route.ts",
  "old_string": "import { NextRequest, NextResponse } from \"next/server\";\nimport { auth } from \"@/auth\";\nimport {\n  getValidOutlookAccessToken,\n  getOutlookTokensForTenant,\n  getOutlookTokenById,\n  updateOutlookLastSync,\n} from \"@/lib/outlook/oauth\";\nimport { fetchOutlookInboxMessages } from \"@/lib/outlook/messages\";\nimport { insertEmail, emailExists } from \"@/lib/email/emails\";",
  "new_string": "import { NextRequest, NextResponse, after } from \"next/server\";\nimport { auth } from \"@/auth\";\nimport {\n  getValidOutlookAccessToken,\n  getOutlookTokensForTenant,\n  getOutlookTokenById,\n  updateOutlookLastSync,\n} from \"@/lib/outlook/oauth\";\nimport { fetchOutlookInboxMessages } from \"@/lib/outlook/messages\";\nimport { insertEmail, emailExists } from \"@/lib/email/emails\";\nimport { classifyItem, buildEmailContent } from \"@/lib/smartLabels/classify\";"
}
Now add tracking of new emails and background classification:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\api\\outlook\\sync\\route.ts",
  "old_string": "    let totalInserted = 0;\n    let totalSkipped = 0;\n    let totalMessages = 0;\n    const results: { accountId: string; email: string; total: number; inserted: number; skipped: number; error?: string }[] = [];\n\n    for (const account of accounts) {\n      try {\n        const accessToken = await getValidOutlookAccessToken(account.id, userId);\n\n        const afterDate = account.last_sync_at || undefined;\n        const { messages } = await fetchOutlookInboxMessages(accessToken, {\n          top: 50,\n          after: afterDate || undefined,\n        });\n\n        let inserted = 0;\n        let skipped = 0;\n\n        for (const msg of messages) {\n          const exists = await emailExists(userId, msg.messageId);\n          if (exists) {\n            skipped++;\n            continue;\n          }\n\n          try {\n            await insertEmail(msg, userId, account.id);\n            inserted++;\n          } catch (err) {\n            if (\n              err instanceof Error &&\n              err.message.includes(\"duplicate key value\")\n            ) {\n              skipped++;\n              continue;\n            }\n            console.error(`[Outlook Sync] Error inserting message ${msg.messageId}:`, err);\n          }\n        }\n\n        await updateOutlookLastSync(account.id);\n\n        totalInserted += inserted;\n        totalSkipped += skipped;\n        totalMessages += messages.length;\n        results.push({\n          accountId: account.id,\n          email: account.outlook_email,\n          total: messages.length,\n          inserted,\n          skipped,\n        });\n      } catch (err) {\n        const message = err instanceof Error ? err.message : \"Sync failed\";\n        results.push({\n          accountId: account.id,\n          email: account.outlook_email,\n          total: 0,\n          inserted: 0,\n          skipped: 0,\n          error: message,\n        });\n      }\n    }\n\n    return NextResponse.json({\n      message: \"Sync completed\",\n      total: totalMessages,\n      inserted: totalInserted,\n      skipped: totalSkipped,\n      results,\n    });",
  "new_string": "    let totalInserted = 0;\n    let totalSkipped = 0;\n    let totalMessages = 0;\n    const newEmails: { id: string; sender: string; recipients: string[]; subject: string | null; bodyPlainText: string | null }[] = [];\n    const results: { accountId: string; email: string; total: number; inserted: number; skipped: number; error?: string }[] = [];\n\n    for (const account of accounts) {\n      try {\n        const accessToken = await getValidOutlookAccessToken(account.id, userId);\n\n        const afterDate = account.last_sync_at || undefined;\n        const { messages } = await fetchOutlookInboxMessages(accessToken, {\n          top: 50,\n          after: afterDate || undefined,\n        });\n\n        let inserted = 0;\n        let skipped = 0;\n\n        for (const msg of messages) {\n          const exists = await emailExists(userId, msg.messageId);\n          if (exists) {\n            skipped++;\n            continue;\n          }\n\n          try {\n            const row = await insertEmail(msg, userId, account.id);\n            inserted++;\n            newEmails.push({\n              id: String(row.id),\n              sender: msg.from,\n              recipients: msg.to,\n              subject: msg.subject ?? null,\n              bodyPlainText: msg.bodyPlainText ?? null,\n            });\n          } catch (err) {\n            if (\n              err instanceof Error &&\n              err.message.includes(\"duplicate key value\")\n            ) {\n              skipped++;\n              continue;\n            }\n            console.error(`[Outlook Sync] Error inserting message ${msg.messageId}:`, err);\n          }\n        }\n\n        await updateOutlookLastSync(account.id);\n\n        totalInserted += inserted;\n        totalSkipped += skipped;\n        totalMessages += messages.length;\n        results.push({\n          accountId: account.id,\n          email: account.outlook_email,\n          total: messages.length,\n          inserted,\n          skipped,\n        });\n      } catch (err) {\n        const message = err instanceof Error ? err.message : \"Sync failed\";\n        results.push({\n          accountId: account.id,\n          email: account.outlook_email,\n          total: 0,\n          inserted: 0,\n          skipped: 0,\n          error: message,\n        });\n      }\n    }\n\n    // Auto-classify new emails with smart labels in background\n    if (newEmails.length > 0) {\n      after(async () => {\n        for (const email of newEmails) {\n          try {\n            const content = buildEmailContent(email);\n            await classifyItem(\"email\", email.id, userId, { content });\n          } catch (err) {\n            console.error(`[Outlook Sync] Smart label classification failed for ${email.id}:`, err);\n          }\n        }\n      });\n    }\n\n    return NextResponse.json({\n      message: \"Sync completed\",\n      total: totalMessages,\n      inserted: totalInserted,\n      skipped: totalSkipped,\n      results,\n    });"
}
**6. Graph webhook** — add smart label classification to the existing `after()` block:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\api\\webhooks\\email\\graph\\[tenantId]\\route.ts",
  "old_string": "import { NextRequest, NextResponse, after } from \"next/server\";\nimport { graphNotificationPayloadSchema } from \"@/lib/validators/schemas\";\nimport { db } from \"@/lib/db\";\nimport { users, graphSubscriptions } from \"@/lib/db/schema\";\nimport { eq, and } from \"drizzle-orm\";\nimport { insertEmail, emailExists, updateEmailByMessageId } from \"@/lib/email/emails\";\nimport {\n  getGraphCredentialsByIdUnsafe,\n  getGraphAccessTokenFromCreds,\n} from \"@/lib/graph/credentials\";\nimport {\n  fetchGraphMessage,\n  extractUserFromResource,\n} from \"@/lib/graph/messages\";\nimport { autoProcessEmailActions } from \"@/lib/actions/autoProcessEmailActions\";\nimport { dispatchWebhooks } from \"@/lib/webhooks/dispatch\";",
  "new_string": "import { NextRequest, NextResponse, after } from \"next/server\";\nimport { graphNotificationPayloadSchema } from \"@/lib/validators/schemas\";\nimport { db } from \"@/lib/db\";\nimport { users, graphSubscriptions } from \"@/lib/db/schema\";\nimport { eq, and } from \"drizzle-orm\";\nimport { insertEmail, emailExists, updateEmailByMessageId } from \"@/lib/email/emails\";\nimport {\n  getGraphCredentialsByIdUnsafe,\n  getGraphAccessTokenFromCreds,\n} from \"@/lib/graph/credentials\";\nimport {\n  fetchGraphMessage,\n  extractUserFromResource,\n} from \"@/lib/graph/messages\";\nimport { autoProcessEmailActions } from \"@/lib/actions/autoProcessEmailActions\";\nimport { dispatchWebhooks } from \"@/lib/webhooks/dispatch\";\nimport { classifyItem, buildEmailContent } from \"@/lib/smartLabels/classify\";"
}
Now add classification after `autoProcessEmailActions` in the Graph webhook's `after()` block. The Graph webhook needs special handling because the email content is fetched asynchronously and the DB row needs to be found by messageId:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\api\\webhooks\\email\\graph\\[tenantId]\\route.ts",
  "old_string": "            // Auto-extract action items and create Kanban cards\n            try {\n              await autoProcessEmailActions(tenantId, {\n                sender: fullEmail.from,\n                recipients: fullEmail.to,\n                subject: fullEmail.subject ?? null,\n                bodyPlainText: fullEmail.bodyPlainText ?? null,\n                receivedAt: fullEmail.receivedDateTime,\n              });\n            } catch (actionErr) {\n              console.error(\n                `[Graph] Error auto-processing actions for message ${item.messageId}:`,\n                actionErr instanceof Error ? actionErr.message : actionErr\n              );\n            }",
  "new_string": "            // Auto-extract action items and create Kanban cards\n            try {\n              await autoProcessEmailActions(tenantId, {\n                sender: fullEmail.from,\n                recipients: fullEmail.to,\n                subject: fullEmail.subject ?? null,\n                bodyPlainText: fullEmail.bodyPlainText ?? null,\n                receivedAt: fullEmail.receivedDateTime,\n              });\n            } catch (actionErr) {\n              console.error(\n                `[Graph] Error auto-processing actions for message ${item.messageId}:`,\n                actionErr instanceof Error ? actionErr.message : actionErr\n              );\n            }\n\n            // Smart label classification\n            try {\n              const content = buildEmailContent({\n                sender: fullEmail.from,\n                recipients: fullEmail.to,\n                subject: fullEmail.subject ?? null,\n                bodyPlainText: fullEmail.bodyPlainText ?? null,\n              });\n              // Find the DB row ID by message_id\n              const { default: smartLabelSql } = await import(\"@/lib/smartLabels/db\");\n              const idRows = await smartLabelSql`\n                SELECT id FROM emails\n                WHERE tenant_id = ${tenantId} AND message_id = ${item.messageId}\n              `;\n              if (idRows[0]) {\n                await classifyItem(\"email\", String(idRows[0].id), tenantId, { content });\n              }\n            } catch (classifyErr) {\n              console.error(\n                `[Graph] Smart label classification failed for message ${item.messageId}:`,\n                classifyErr instanceof Error ? classifyErr.message : classifyErr\n              );\n            }"
}
Actually, using a dynamic import for the SQL connection is not clean. The Graph webhook's `after()` runs asynchronously after the response, so I can use a static import. But `lib/smartLabels/db.ts` just creates a `neon()` connection — same as `lib/email/db.ts`. Let me use the email db instead since it's already the same connection. Actually, the simplest thing is to just import the sql from a static import at the top level.

Let me clean this up — I'll import `sql` from `lib/smartLabels/db` statically:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\api\\webhooks\\email\\graph\\[tenantId]\\route.ts",
  "old_string": "import { classifyItem, buildEmailContent } from \"@/lib/smartLabels/classify\";",
  "new_string": "import { classifyItem, buildEmailContent } from \"@/lib/smartLabels/classify\";\nimport smartLabelSql from \"@/lib/smartLabels/db\";"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\api\\webhooks\\email\\graph\\[tenantId]\\route.ts",
  "old_string": "              const { default: smartLabelSql } = await import(\"@/lib/smartLabels/db\");\n              const idRows = await smartLabelSql`",
  "new_string": "              const idRows = await smartLabelSql`"
}
**7. Microsoft 365 webhook** — add smart label classification:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\api\\webhooks\\email\\microsoft365\\[tenantId]\\route.ts",
  "old_string": "import { NextRequest, NextResponse, after } from \"next/server\";\nimport { insertEmail, emailExists } from \"@/lib/email/emails\";\nimport { emailWebhookPayloadSchema } from \"@/lib/validators/schemas\";\nimport { db } from \"@/lib/db\";\nimport { users } from \"@/lib/db/schema\";\nimport { eq } from \"drizzle-orm\";\nimport { autoProcessEmailActions } from \"@/lib/actions/autoProcessEmailActions\";\nimport { dispatchWebhooks } from \"@/lib/webhooks/dispatch\";",
  "new_string": "import { NextRequest, NextResponse, after } from \"next/server\";\nimport { insertEmail, emailExists } from \"@/lib/email/emails\";\nimport { emailWebhookPayloadSchema } from \"@/lib/validators/schemas\";\nimport { db } from \"@/lib/db\";\nimport { users } from \"@/lib/db/schema\";\nimport { eq } from \"drizzle-orm\";\nimport { autoProcessEmailActions } from \"@/lib/actions/autoProcessEmailActions\";\nimport { dispatchWebhooks } from \"@/lib/webhooks/dispatch\";\nimport { classifyItem, buildEmailContent } from \"@/lib/smartLabels/classify\";"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\api\\webhooks\\email\\microsoft365\\[tenantId]\\route.ts",
  "old_string": "    // Auto-extract action items and create Kanban cards in background\n    after(async () => {\n      try {\n        await autoProcessEmailActions(tenantId, {\n          sender: payload.from,\n          recipients: payload.to,\n          subject: payload.subject ?? null,\n          bodyPlainText: payload.bodyPlainText ?? null,\n          receivedAt: payload.receivedDateTime,\n        });\n      } catch (err) {\n        console.error(\n          `[M365] Error auto-processing actions for message ${payload.messageId}:`,\n          err instanceof Error ? err.message : err\n        );\n      }\n    });",
  "new_string": "    // Auto-extract action items + smart label classification in background\n    after(async () => {\n      // Auto-process action items\n      try {\n        await autoProcessEmailActions(tenantId, {\n          sender: payload.from,\n          recipients: payload.to,\n          subject: payload.subject ?? null,\n          bodyPlainText: payload.bodyPlainText ?? null,\n          receivedAt: payload.receivedDateTime,\n        });\n      } catch (err) {\n        console.error(\n          `[M365] Error auto-processing actions for message ${payload.messageId}:`,\n          err instanceof Error ? err.message : err\n        );\n      }\n\n      // Smart label classification\n      try {\n        const content = buildEmailContent({\n          sender: payload.from,\n          recipients: payload.to,\n          subject: payload.subject ?? null,\n          bodyPlainText: payload.bodyPlainText ?? null,\n        });\n        await classifyItem(\"email\", String(result.id), tenantId, { content });\n      } catch (err) {\n        console.error(\n          `[M365] Smart label classification failed for message ${payload.messageId}:`,\n          err instanceof Error ? err.message : err\n        );\n      }\n    });"
}
Now let me update the inbox page to also fetch smart labels for Gmail emails. Currently it only fetches for `itemType: "email"`, but Gmail emails use `"gmail_email"` item type.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\inbox\\page.tsx",
  "offset": 275,
  "limit": 20
}
Let me find the smart label fetch effect in the inbox:

🔧 Tool: Grep
Input: {
  "pattern": "smart-labels/items",
  "path": "C:\\Code\\Krisp\\app\\(app)\\inbox\\page.tsx",
  "output_mode": "content",
  "-n": true,
  "-C": 8
}
I need to check the inbox page to understand how emails are structured — specifically, does the email list contain both Outlook and Gmail emails? If so, how do I tell them apart?

🔧 Tool: Grep
Input: {
  "pattern": "gmail_account_id|source.*gmail|provider",
  "path": "C:\\Code\\Krisp\\app\\(app)\\inbox\\page.tsx",
  "output_mode": "content",
  "-n": true,
  "head_limit": 10
}
The emails have a `provider` field. Let me check the `EmailListItem` type:

🔧 Tool: Grep
Input: {
  "pattern": "interface EmailListItem",
  "path": "C:\\Code\\Krisp\\types\\email.ts",
  "output_mode": "content",
  "-A": 15
}
The inbox merges Outlook and Gmail emails. Gmail emails have `provider: "gmail"` and Outlook have `provider: "outlook"`. Now I need to update the smart label fetch to handle both types — fetch with `"email"` for Outlook IDs and `"gmail_email"` for Gmail IDs, then merge the results.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\inbox\\page.tsx",
  "offset": 294,
  "limit": 15
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\inbox\\page.tsx",
  "old_string": "  // Fetch smart labels for displayed emails\n  useEffect(() => {\n    if (emails.length === 0) return;\n    const ids = emails.map((e) => String(e.id));\n    fetch(\"/api/smart-labels/items\", {\n      method: \"POST\",\n      headers: { \"Content-Type\": \"application/json\" },\n      body: JSON.stringify({ itemType: \"email\", itemIds: ids }),\n    })\n      .then((r) => r.json())\n      .then((d) => { if (d.data) setSmartLabelMap(d.data); })\n      .catch(() => {});\n  }, [emails]);",
  "new_string": "  // Fetch smart labels for displayed emails (split by provider)\n  useEffect(() => {\n    if (emails.length === 0) return;\n    const outlookIds = emails.filter((e) => e.provider !== \"gmail\").map((e) => String(e.id));\n    const gmailIds = emails.filter((e) => e.provider === \"gmail\").map((e) => String(e.id));\n\n    const fetches: Promise<Record<string, SmartLabelChip[]>>[] = [];\n    if (outlookIds.length > 0) {\n      fetches.push(\n        fetch(\"/api/smart-labels/items\", {\n          method: \"POST\",\n          headers: { \"Content-Type\": \"application/json\" },\n          body: JSON.stringify({ itemType: \"email\", itemIds: outlookIds }),\n        }).then((r) => r.json()).then((d) => d.data || {}).catch(() => ({}))\n      );\n    }\n    if (gmailIds.length > 0) {\n      fetches.push(\n        fetch(\"/api/smart-labels/items\", {\n          method: \"POST\",\n          headers: { \"Content-Type\": \"application/json\" },\n          body: JSON.stringify({ itemType: \"gmail_email\", itemIds: gmailIds }),\n        }).then((r) => r.json()).then((d) => d.data || {}).catch(() => ({}))\n      );\n    }\n    if (fetches.length > 0) {\n      Promise.all(fetches).then((results) => {\n        const merged: Record<string, SmartLabelChip[]> = {};\n        for (const r of results) {\n          for (const [k, v] of Object.entries(r)) {\n            merged[k] = v;\n          }\n        }\n        setSmartLabelMap(merged);\n      });\n    }\n  }, [emails]);"
}
Also need to update the validators to accept `gmail_email` in the batch items endpoint:

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\smart-labels\\items\\route.ts"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\api\\smart-labels\\items\\route.ts",
  "old_string": "const batchQuerySchema = z.object({\n  itemType: z.enum([\"email\", \"card\", \"action_item\", \"meeting\"]),\n  itemIds: z.array(z.string().min(1)).min(1).max(200),\n});",
  "new_string": "const batchQuerySchema = z.object({\n  itemType: z.enum([\"email\", \"gmail_email\", \"card\", \"action_item\", \"meeting\"]),\n  itemIds: z.array(z.string().min(1)).min(1).max(200),\n});"
}
Also update the `[id]/items` route:

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\smart-labels\\[id]\\items\\route.ts",
  "offset": 1,
  "limit": 15
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\api\\smart-labels\\[id]\\items\\route.ts",
  "old_string": "const addItemSchema = z.object({\n  itemType: z.enum([\"email\", \"card\", \"action_item\", \"meeting\"]),\n  itemId: z.string().min(1),\n});",
  "new_string": "const addItemSchema = z.object({\n  itemType: z.enum([\"email\", \"gmail_email\", \"card\", \"action_item\", \"meeting\"]),\n  itemId: z.string().min(1),\n});"
}
Now update the todo list and verify everything:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Update classify.ts to handle encrypted content and both email tables",
      "status": "completed",
      "activeForm": "Updating classifier for encrypted content"
    },
    {
      "content": "Update validators to support gmail_email item type",
      "status": "completed",
      "activeForm": "Updating validators"
    },
    {
      "content": "Add auto-classification to Gmail sync route",
      "status": "completed",
      "activeForm": "Adding auto-classification to Gmail sync"
    },
    {
      "content": "Add auto-classification to Gmail Pub/Sub webhook",
      "status": "completed",
      "activeForm": "Adding auto-classification to Gmail webhook"
    },
    {
      "content": "Add auto-classification to Gmail Apps Script webhook",
      "status": "completed",
      "activeForm": "Adding auto-classification to Gmail Apps Script webhook"
    },
    {
      "content": "Add auto-classification to Outlook sync route",
      "status": "completed",
      "activeForm": "Adding auto-classification to Outlook sync"
    },
    {
      "content": "Add auto-classification to Graph webhook",
      "status": "completed",
      "activeForm": "Adding auto-classification to Graph webhook"
    },
    {
      "content": "Add auto-classification to Microsoft 365 webhook",
      "status": "completed",
      "activeForm": "Adding auto-classification to M365 webhook"
    },
    {
      "content": "Verify all changes for correctness",
      "status": "in_progress",
      "activeForm": "Verifying all changes"
    }
  ]
}
Let me do a final review of all modified files to catch any issues:

🔧 Tool: Task
Input: {
  "description": "Review auto-classification changes",
  "subagent_type": "feature-dev:code-reviewer",
  "prompt": "Review the changes made to add automatic smart label classification when emails are ingested. Focus on correctness, not style.\n\nThe changes add `classifyItem()` calls (from `@/lib/smartLabels/classify`) to background `after()` callbacks in all email ingestion points. The key pattern is:\n\n1. After an email is inserted, build content from the already-available data using `buildEmailContent()`\n2. Call `classifyItem(itemType, id, tenantId, { content })` with the pre-built content to avoid re-fetching from DB\n3. For Outlook emails, `itemType = \"email\"`; for Gmail emails, `itemType = \"gmail_email\"`\n\nFiles to review:\n\n1. `lib/smartLabels/classify.ts` — Added decryption support, `gmail_email` case in `fetchItemContent` and `classifyBatch`, exported `buildEmailContent` helper, added `content` option to `classifyItem`\n2. `app/api/gmail/sync/route.ts` — Added `after()` with smart label classification for new Gmail emails\n3. `app/api/webhooks/email/gmail/[tenantId]/route.ts` — Added classification to both Pub/Sub and Apps Script handlers' existing `after()` blocks. Changed `storedEmails` to track `_dbId` from `insertGmailEmail()` return\n4. `app/api/outlook/sync/route.ts` — Added `after()` with smart label classification for new Outlook emails\n5. `app/api/webhooks/email/graph/[tenantId]/route.ts` — Added classification after `updateEmailByMessageId()` in the `after()` block. Uses `smartLabelSql` to look up the email ID by message_id since the Graph webhook inserts a stub first and updates later\n6. `app/api/webhooks/email/microsoft365/[tenantId]/route.ts` — Added classification to the existing `after()` block\n7. `app/(app)/inbox/page.tsx` — Updated smart label fetch to split by provider (email vs gmail_email)\n8. `app/api/smart-labels/items/route.ts` — Added `gmail_email` to batch query schema\n9. `app/api/smart-labels/[id]/items/route.ts` — Added `gmail_email` to add item schema\n10. `lib/validators/schemas.ts` — Added `gmail_email` to classify schemas\n11. `types/smartLabel.ts` — Added `gmail_email` to item_type union\n\nKey things to verify:\n- The `storedEmails` type change in the Gmail webhook (adding `_dbId`) — is this type-safe?\n- The `buildEmailContent` function signature matches all call sites\n- The `after()` usage is correct (Next.js 16 `after()` API)\n- No missing imports\n- The Graph webhook correctly finds the email ID after update\n\nWorking directory: C:\\Code\\Krisp",
  "model": "sonnet"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\smartLabels\\classify.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\gmail\\sync\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\webhooks\\email\\gmail\\[tenantId]\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\outlook\\sync\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\webhooks\\email\\graph\\[tenantId]\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\webhooks\\email\\microsoft365\\[tenantId]\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\inbox\\page.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\smart-labels\\items\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\smart-labels\\[id]\\items\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\validators\\schemas.ts",
  "offset": 1,
  "limit": 150
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\types\\smartLabel.ts"
}

🔧 Tool: Grep
Input: {
  "pattern": "insertGmailEmail",
  "output_mode": "content",
  "path": "C:\\Code\\Krisp\\lib\\gmail"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\gmail\\emails.ts",
  "offset": 40,
  "limit": 80
}

🔧 Tool: Grep
Input: {
  "pattern": "type GmailEmailRow|interface GmailEmailRow",
  "output_mode": "content",
  "path": "C:\\Code\\Krisp",
  "-A": 5
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\types\\gmail.ts",
  "offset": 47,
  "limit": 30
}
Good review. Let me apply the one suggested fix — add logging in the Graph webhook when the email ID lookup fails:

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\webhooks\\email\\graph\\[tenantId]\\route.ts",
  "offset": 278,
  "limit": 15
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\api\\webhooks\\email\\graph\\[tenantId]\\route.ts",
  "old_string": "              if (idRows[0]) {\n                await classifyItem(\"email\", String(idRows[0].id), tenantId, { content });\n              }",
  "new_string": "              if (idRows[0]) {\n                await classifyItem(\"email\", String(idRows[0].id), tenantId, { content });\n              } else {\n                console.warn(`[Graph] Could not find email ID for message ${item.messageId} during smart label classification`);\n              }"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Update classify.ts to handle encrypted content and both email tables",
      "status": "completed",
      "activeForm": "Updating classifier for encrypted content"
    },
    {
      "content": "Update validators to support gmail_email item type",
      "status": "completed",
      "activeForm": "Updating validators"
    },
    {
      "content": "Add auto-classification to Gmail sync route",
      "status": "completed",
      "activeForm": "Adding auto-classification to Gmail sync"
    },
    {
      "content": "Add auto-classification to Gmail Pub/Sub webhook",
      "status": "completed",
      "activeForm": "Adding auto-classification to Gmail webhook"
    },
    {
      "content": "Add auto-classification to Gmail Apps Script webhook",
      "status": "completed",
      "activeForm": "Adding auto-classification to Gmail Apps Script webhook"
    },
    {
      "content": "Add auto-classification to Outlook sync route",
      "status": "completed",
      "activeForm": "Adding auto-classification to Outlook sync"
    },
    {
      "content": "Add auto-classification to Graph webhook",
      "status": "completed",
      "activeForm": "Adding auto-classification to Graph webhook"
    },
    {
      "content": "Add auto-classification to Microsoft 365 webhook",
      "status": "completed",
      "activeForm": "Adding auto-classification to M365 webhook"
    },
    {
      "content": "Verify all changes for correctness",
      "status": "completed",
      "activeForm": "Verifying all changes"
    }
  ]
}
All done. Here's a summary of the changes:

## Summary: Auto-classification on email ingestion

Added automatic smart label classification that runs in the background whenever new emails are ingested, across all 5 ingestion points.

### How it works

When a new email is inserted into the database (via sync or webhook), the system now:
1. Builds a plaintext summary from the already-available email data (sender, recipients, subject, body) using `buildEmailContent()` — this avoids a redundant DB round-trip
2. Calls `classifyItem()` with the pre-built content in a `after()` callback so it runs in the background without blocking the response
3. The classifier evaluates the email against all active smart labels and applies matching ones with confidence scores

### Files modified

| File | Change |
|---|---|
| `lib/smartLabels/classify.ts` | Added `maybeDecrypt()` for encrypted DB content, `buildEmailContent()` export for pre-built content, `gmail_email` support in `fetchItemContent` and `classifyBatch`, `content` option on `classifyItem` |
| `app/api/gmail/sync/route.ts` | Tracks new email IDs/content, adds `after()` with `classifyItem("gmail_email", ...)` |
| `app/api/webhooks/email/gmail/[tenantId]/route.ts` | Pub/Sub: tracks `_dbId` from insert, adds classification to `after()`. Apps Script: adds classification to existing `after()` |
| `app/api/outlook/sync/route.ts` | Tracks new email IDs/content, adds `after()` with `classifyItem("email", ...)` |
| `app/api/webhooks/email/graph/[tenantId]/route.ts` | Adds classification after `updateEmailByMessageId()` in `after()`, looks up email ID by `message_id` |
| `app/api/webhooks/email/microsoft365/[tenantId]/route.ts` | Adds classification to existing `after()` block |
| `app/(app)/inbox/page.tsx` | Splits smart label fetch by provider (Outlook `"email"` vs Gmail `"gmail_email"`) |
| `lib/validators/schemas.ts` | Added `gmail_email` to classify/batch schemas |
| `types/smartLabel.ts` | Added `gmail_email` to `item_type` union |
| `app/api/smart-labels/items/route.ts` | Added `gmail_email` to batch query schema |
| `app/api/smart-labels/[id]/items/route.ts` | Added `gmail_email` to add item schema |
| `app/(app)/admin/smart-labels/SmartLabelsClient.tsx` | Added "Gmail Emails" option to batch classify dropdown |

### Key design decisions

- **Pre-built content**: The email data is already in memory at the webhook/sync handler, so `buildEmailContent()` avoids re-fetching and decrypting from DB
- **Background execution**: All classification runs in Next.js `after()` callbacks so webhook responses aren't delayed (critical for Graph which expects 202 within 3 seconds)
- **Idempotency**: `classifyItem` checks `isItemSmartClassified()` before processing, so duplicate webhook deliveries won't re-classify
- **Separate item types**: Gmail emails use `"gmail_email"` and Outlook emails use `"email"` since they're stored in different tables with different schemas