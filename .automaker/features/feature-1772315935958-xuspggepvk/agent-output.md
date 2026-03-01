

I'll start by exploring the codebase to understand the existing structure, then plan and implement the Gmail email ingestion feature.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore codebase structure and existing patterns",
      "status": "in_progress",
      "activeForm": "Exploring codebase structure and existing patterns"
    },
    {
      "content": "Plan implementation approach",
      "status": "pending",
      "activeForm": "Planning implementation approach"
    },
    {
      "content": "Create database schema and migration for emails table",
      "status": "pending",
      "activeForm": "Creating database schema and migration for emails table"
    },
    {
      "content": "Implement Gmail webhook endpoint (Pub/Sub push)",
      "status": "pending",
      "activeForm": "Implementing Gmail webhook endpoint"
    },
    {
      "content": "Implement Apps Script webhook endpoint",
      "status": "pending",
      "activeForm": "Implementing Apps Script webhook endpoint"
    },
    {
      "content": "Implement Gmail API integration (OAuth, watch, message fetch)",
      "status": "pending",
      "activeForm": "Implementing Gmail API integration"
    },
    {
      "content": "Build admin integrations page UI",
      "status": "pending",
      "activeForm": "Building admin integrations page UI"
    },
    {
      "content": "Add tenant management for Gmail integrations",
      "status": "pending",
      "activeForm": "Adding tenant management for Gmail integrations"
    },
    {
      "content": "Verify and review implementation",
      "status": "pending",
      "activeForm": "Verifying and reviewing implementation"
    }
  ]
}

🔧 Tool: Task
Input: {
  "description": "Explore codebase structure",
  "prompt": "Thoroughly explore the codebase at C:\\Code\\Krisp to understand:\n1. The directory structure (especially app/, lib/, components/)\n2. Existing API route patterns (how routes are structured in app/api/)\n3. Database setup (lib/db/, drizzle config, schema)\n4. Authentication patterns (NextAuth setup)\n5. Existing webhook patterns (any existing webhook endpoints)\n6. Component patterns and UI library used\n7. Environment variables and configuration\n8. package.json dependencies\n9. Any existing tenant/multi-tenant patterns\n10. The existing Krisp webhook implementation for reference\n\nProvide a detailed report of everything you find.",
  "subagent_type": "Explore"
}

🔧 Tool: Bash
Input: {
  "command": "find C:\\Code\\Krisp -type f -name \"package.json\" -o -type f -name \"tsconfig.json\" -o -type f -name \"next.config.js\" | head -20",
  "description": "Find key configuration files"
}

🔧 Tool: Glob
Input: {
  "pattern": "C:\\Code\\Krisp/**/*.md"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\package.json"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\tsconfig.json"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\next.config.ts"
}

🔧 Tool: Bash
Input: {
  "command": "find . -type f -name \"*.ts\" -o -name \"*.tsx\" | grep -E \"(app|lib|components)\" | head -50",
  "description": "Find TypeScript/TSX files in app, lib, and components directories"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\.env.local"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\db\\schema.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\drizzle.config.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\db\\index.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\auth\\[...nextauth]\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\auth.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "C:\\Code\\Krisp\\lib\\**\\*.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\webhooks\\key-points\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\krisp\\webhookKeyPoints.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\krisp\\db.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\webhooks\\email\\microsoft365\\[tenantId]\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\email\\emails.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\validators\\schemas.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "C:\\Code\\Krisp\\types\\*.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\v1\\boards\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\types\\webhook.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\types\\email.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\types\\index.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\auth\\getRequiredUser.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\v1\\boards\\[boardId]\\route.ts"
}

🔧 Tool: Bash
Input: {
  "command": "ls -la C:\\Code\\Krisp\\components\\",
  "description": "List component directory structure"
}

🔧 Tool: Bash
Input: {
  "command": "find components -name \"*.tsx\" | head -20",
  "description": "List component files"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\components\\ui\\AppShell.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\providers.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\layout.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\search\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\meetings\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\v1\\cards\\[id]\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\email\\password-reset.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\email\\resend.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "C:\\Code\\Krisp\\app\\api\\v1\\auth\\*.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\v1\\auth\\register\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\v1\\auth\\forgot-password\\route.ts"
}

🔧 Tool: Bash
Input: {
  "command": "find . -type f -name \"tailwind.config.*\" -o -name \"globals.css\" | head -5",
  "description": "Find styling configuration"
}

🔧 Tool: Bash
Input: {
  "command": "ls -la app/\\(auth\\)/ 2>/dev/null | head -20",
  "description": "List auth routes directory"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\globals.css"
}
Now I have a thorough understanding of the codebase. Let me look at the existing email webhook and database patterns more closely.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\webhooks\\email\\microsoft365\\[tenantId]\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\email\\db.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\types\\email.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\db\\schema.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\email\\emails.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\validators\\schemas.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\page.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\components\\ui\\SideNav.tsx"
}
Now let me look at the existing integrations client page.

🔧 Tool: Glob
Input: {
  "pattern": "app/(app)/admin/integrations/**/*"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\db\\index.ts"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore codebase structure and existing patterns",
      "status": "completed",
      "activeForm": "Exploring codebase structure and existing patterns"
    },
    {
      "content": "Plan implementation approach",
      "status": "completed",
      "activeForm": "Planning implementation approach"
    },
    {
      "content": "Add Gmail email types and Zod validation schemas",
      "status": "in_progress",
      "activeForm": "Adding Gmail email types and Zod validation schemas"
    },
    {
      "content": "Update database schema with gmail_emails table",
      "status": "pending",
      "activeForm": "Updating database schema with gmail_emails table"
    },
    {
      "content": "Create Gmail email database query functions",
      "status": "pending",
      "activeForm": "Creating Gmail email database query functions"
    },
    {
      "content": "Implement Gmail Pub/Sub webhook endpoint",
      "status": "pending",
      "activeForm": "Implementing Gmail Pub/Sub webhook endpoint"
    },
    {
      "content": "Implement Apps Script webhook endpoint",
      "status": "pending",
      "activeForm": "Implementing Apps Script webhook endpoint"
    },
    {
      "content": "Add Gmail tab to admin integrations page",
      "status": "pending",
      "activeForm": "Adding Gmail tab to admin integrations page"
    },
    {
      "content": "Run drizzle-kit generate for migration",
      "status": "pending",
      "activeForm": "Running drizzle-kit generate for migration"
    },
    {
      "content": "Verify build compiles cleanly",
      "status": "pending",
      "activeForm": "Verifying build compiles cleanly"
    }
  ]
}
Now I have a clear picture. The codebase already has an email ingestion pattern for Microsoft 365. I need to add a parallel Gmail integration. Let me implement this step by step.

First, let me add the Gmail types and validation schemas.

🔧 Tool: Write
Input: {
  "file_path": "C:\\Code\\Krisp\\types\\gmail.ts",
  "content": "/**\n * Types for Gmail email ingestion via Google Pub/Sub and Apps Script\n */\n\nexport interface GmailAttachmentMetadata {\n  name: string;\n  mimeType: string;\n  size: number;\n  attachmentId: string;\n}\n\n/**\n * Pub/Sub push message envelope.\n * The `data` field is base64-encoded and contains `{ emailAddress, historyId }`.\n */\nexport interface PubSubPushMessage {\n  message: {\n    data: string;\n    messageId: string;\n    publishTime: string;\n  };\n  subscription: string;\n}\n\nexport interface PubSubDecodedData {\n  emailAddress: string;\n  historyId: number;\n}\n\n/**\n * Apps Script webhook payload — pre-parsed email data sent directly\n * from the tenant's Apps Script project.\n */\nexport interface GmailAppsScriptPayload {\n  messageId: string;\n  sender: string;\n  recipients: string;\n  subject?: string;\n  bodyPlain?: string;\n  bodyHtml?: string;\n  receivedAt: string;\n}\n\n/**\n * Database row type for gmail_emails table.\n */\nexport interface GmailEmailRow {\n  id: string;\n  tenant_id: string;\n  gmail_message_id: string;\n  thread_id: string | null;\n  sender: string;\n  recipients: object;\n  subject: string | null;\n  body_plain: string | null;\n  body_html: string | null;\n  received_at: Date;\n  attachments: object;\n  labels: object;\n  raw_payload: object | null;\n  ingested_at: Date;\n  updated_at: Date;\n}\n\nexport interface GmailEmailInsert {\n  tenant_id: string;\n  gmail_message_id: string;\n  thread_id?: string | null;\n  sender: string;\n  recipients: object;\n  subject?: string | null;\n  body_plain?: string | null;\n  body_html?: string | null;\n  received_at: Date;\n  attachments?: object;\n  labels?: object;\n  raw_payload?: object | null;\n}\n"
}
Now add the Zod validation schemas.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\validators\\schemas.ts",
  "offset": 127
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\lib\\validators\\schemas.ts",
  "old_string": "export type EmailWebhookPayloadInput = z.infer<typeof emailWebhookPayloadSchema>;\n\nexport type LoginInput = z.infer<typeof loginSchema>;",
  "new_string": "export type EmailWebhookPayloadInput = z.infer<typeof emailWebhookPayloadSchema>;\n\n// ── Gmail Webhook (Pub/Sub Push) ─────────────────────\nexport const pubSubPushMessageSchema = z.object({\n  message: z.object({\n    data: z.string().min(1, \"data is required\"),\n    messageId: z.string().min(1, \"messageId is required\"),\n    publishTime: z.string().min(1, \"publishTime is required\"),\n  }),\n  subscription: z.string().min(1, \"subscription is required\"),\n});\n\nexport type PubSubPushMessageInput = z.infer<typeof pubSubPushMessageSchema>;\n\n// ── Gmail Webhook (Apps Script) ──────────────────────\nconst MAX_BODY_SIZE = 5 * 1024 * 1024; // 5MB\n\nexport const gmailAppsScriptPayloadSchema = z.object({\n  messageId: z.string().min(1, \"messageId is required\"),\n  sender: z.string().min(1, \"sender is required\"),\n  recipients: z.string().min(1, \"recipients is required\"),\n  subject: z.string().optional(),\n  bodyPlain: z.string().max(MAX_BODY_SIZE, \"body exceeds 5MB limit\").optional(),\n  bodyHtml: z.string().max(MAX_BODY_SIZE, \"body exceeds 5MB limit\").optional(),\n  receivedAt: z.string().min(1, \"receivedAt is required\"),\n});\n\nexport type GmailAppsScriptPayloadInput = z.infer<typeof gmailAppsScriptPayloadSchema>;\n\nexport type LoginInput = z.infer<typeof loginSchema>;"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Add Gmail email types and Zod validation schemas",
      "status": "completed",
      "activeForm": "Adding Gmail email types and Zod validation schemas"
    },
    {
      "content": "Update database schema with gmail_emails table",
      "status": "in_progress",
      "activeForm": "Updating database schema with gmail_emails table"
    },
    {
      "content": "Create Gmail email database query functions",
      "status": "pending",
      "activeForm": "Creating Gmail email database query functions"
    },
    {
      "content": "Implement Gmail Pub/Sub webhook endpoint",
      "status": "pending",
      "activeForm": "Implementing Gmail Pub/Sub webhook endpoint"
    },
    {
      "content": "Implement Apps Script webhook endpoint",
      "status": "pending",
      "activeForm": "Implementing Apps Script webhook endpoint"
    },
    {
      "content": "Add Gmail tab to admin integrations page",
      "status": "pending",
      "activeForm": "Adding Gmail tab to admin integrations page"
    },
    {
      "content": "Run drizzle-kit generate for migration",
      "status": "pending",
      "activeForm": "Running drizzle-kit generate for migration"
    },
    {
      "content": "Verify build compiles cleanly",
      "status": "pending",
      "activeForm": "Verifying build compiles cleanly"
    }
  ]
}
Now let me add the `gmail_emails` table to the Drizzle schema.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\lib\\db\\schema.ts",
  "old_string": "// ── Emails (Microsoft 365 Exchange) ──────────────────\nexport const emails = pgTable(",
  "new_string": "// ── Gmail Emails ─────────────────────────────────────\nexport const gmailEmails = pgTable(\n  \"gmail_emails\",\n  {\n    id: uuid(\"id\").defaultRandom().primaryKey(),\n    tenantId: uuid(\"tenant_id\")\n      .notNull()\n      .references(() => users.id, { onDelete: \"cascade\" }),\n    gmailMessageId: text(\"gmail_message_id\").notNull(),\n    threadId: text(\"thread_id\"),\n    sender: text(\"sender\").notNull(),\n    recipients: jsonb(\"recipients\").notNull().default([]),\n    subject: text(\"subject\"),\n    bodyPlain: text(\"body_plain\"),\n    bodyHtml: text(\"body_html\"),\n    receivedAt: timestamp(\"received_at\", { withTimezone: true }).notNull(),\n    attachments: jsonb(\"attachments\").notNull().default([]),\n    labels: jsonb(\"labels\").notNull().default([]),\n    rawPayload: jsonb(\"raw_payload\"),\n    ingestedAt: timestamp(\"ingested_at\", { withTimezone: true })\n      .defaultNow()\n      .notNull(),\n    updatedAt: timestamp(\"updated_at\", { withTimezone: true })\n      .defaultNow()\n      .notNull(),\n  },\n  (table) => [\n    uniqueIndex(\"uq_tenant_gmail_message\").on(\n      table.tenantId,\n      table.gmailMessageId\n    ),\n    index(\"idx_gmail_emails_tenant_id\").on(table.tenantId),\n    index(\"idx_gmail_emails_received_at\").on(table.tenantId, table.receivedAt),\n    index(\"idx_gmail_emails_sender\").on(table.tenantId, table.sender),\n  ]\n);\n\n// ── Emails (Microsoft 365 Exchange) ──────────────────\nexport const emails = pgTable("
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\db\\schema.ts"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\lib\\db\\schema.ts",
  "old_string": "// ── Emails (Microsoft 365 Exchange) ──────────────────\nexport const emails = pgTable(",
  "new_string": "// ── Gmail Emails ─────────────────────────────────────\nexport const gmailEmails = pgTable(\n  \"gmail_emails\",\n  {\n    id: uuid(\"id\").defaultRandom().primaryKey(),\n    tenantId: uuid(\"tenant_id\")\n      .notNull()\n      .references(() => users.id, { onDelete: \"cascade\" }),\n    gmailMessageId: text(\"gmail_message_id\").notNull(),\n    threadId: text(\"thread_id\"),\n    sender: text(\"sender\").notNull(),\n    recipients: jsonb(\"recipients\").notNull().default([]),\n    subject: text(\"subject\"),\n    bodyPlain: text(\"body_plain\"),\n    bodyHtml: text(\"body_html\"),\n    receivedAt: timestamp(\"received_at\", { withTimezone: true }).notNull(),\n    attachments: jsonb(\"attachments\").notNull().default([]),\n    labels: jsonb(\"labels\").notNull().default([]),\n    rawPayload: jsonb(\"raw_payload\"),\n    ingestedAt: timestamp(\"ingested_at\", { withTimezone: true })\n      .defaultNow()\n      .notNull(),\n    updatedAt: timestamp(\"updated_at\", { withTimezone: true })\n      .defaultNow()\n      .notNull(),\n  },\n  (table) => [\n    uniqueIndex(\"uq_tenant_gmail_message\").on(\n      table.tenantId,\n      table.gmailMessageId\n    ),\n    index(\"idx_gmail_emails_tenant_id\").on(table.tenantId),\n    index(\"idx_gmail_emails_received_at\").on(table.tenantId, table.receivedAt),\n    index(\"idx_gmail_emails_sender\").on(table.tenantId, table.sender),\n  ]\n);\n\n// ── Emails (Microsoft 365 Exchange) ──────────────────\nexport const emails = pgTable("
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Add Gmail email types and Zod validation schemas",
      "status": "completed",
      "activeForm": "Adding Gmail email types and Zod validation schemas"
    },
    {
      "content": "Update database schema with gmail_emails table",
      "status": "completed",
      "activeForm": "Updating database schema with gmail_emails table"
    },
    {
      "content": "Create Gmail email database query functions",
      "status": "in_progress",
      "activeForm": "Creating Gmail email database query functions"
    },
    {
      "content": "Implement Gmail Pub/Sub webhook endpoint",
      "status": "pending",
      "activeForm": "Implementing Gmail Pub/Sub webhook endpoint"
    },
    {
      "content": "Implement Apps Script webhook endpoint",
      "status": "pending",
      "activeForm": "Implementing Apps Script webhook endpoint"
    },
    {
      "content": "Add Gmail tab to admin integrations page",
      "status": "pending",
      "activeForm": "Adding Gmail tab to admin integrations page"
    },
    {
      "content": "Run drizzle-kit generate for migration",
      "status": "pending",
      "activeForm": "Running drizzle-kit generate for migration"
    },
    {
      "content": "Verify build compiles cleanly",
      "status": "pending",
      "activeForm": "Verifying build compiles cleanly"
    }
  ]
}
Now create the Gmail email database query functions. Following the existing pattern in `lib/email/`, I'll create a parallel `lib/gmail/` module.

🔧 Tool: Write
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\gmail\\db.ts",
  "content": "import { neon } from \"@neondatabase/serverless\";\n\nconst sql = neon(process.env.DATABASE_URL!);\n\nexport default sql;\n"
}

🔧 Tool: Write
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\gmail\\emails.ts",
  "content": "import sql from \"./db\";\nimport type { GmailEmailRow, GmailEmailInsert } from \"@/types/gmail\";\n\nconst MAX_BODY_SIZE = 5 * 1024 * 1024; // 5MB\n\n/**\n * Truncate a string to maxLen, returning the truncated string.\n */\nfunction truncateBody(body: string | null | undefined, maxLen: number): string | null {\n  if (!body) return null;\n  if (body.length <= maxLen) return body;\n  return body.slice(0, maxLen);\n}\n\n/**\n * Insert a new Gmail email record. Uses INSERT ... ON CONFLICT DO NOTHING\n * for idempotent deduplication on (tenant_id, gmail_message_id).\n */\nexport async function insertGmailEmail(\n  data: GmailEmailInsert\n): Promise<GmailEmailRow | null> {\n  const bodyPlain = truncateBody(data.body_plain, MAX_BODY_SIZE);\n  const bodyHtml = truncateBody(data.body_html, MAX_BODY_SIZE);\n\n  const rows = await sql`\n    INSERT INTO gmail_emails (\n      tenant_id,\n      gmail_message_id,\n      thread_id,\n      sender,\n      recipients,\n      subject,\n      body_plain,\n      body_html,\n      received_at,\n      attachments,\n      labels,\n      raw_payload\n    ) VALUES (\n      ${data.tenant_id},\n      ${data.gmail_message_id},\n      ${data.thread_id ?? null},\n      ${data.sender},\n      ${JSON.stringify(data.recipients ?? [])},\n      ${data.subject ?? null},\n      ${bodyPlain},\n      ${bodyHtml},\n      ${data.received_at.toISOString()},\n      ${JSON.stringify(data.attachments ?? [])},\n      ${JSON.stringify(data.labels ?? [])},\n      ${data.raw_payload ? JSON.stringify(data.raw_payload) : null}\n    )\n    ON CONFLICT (tenant_id, gmail_message_id) DO NOTHING\n    RETURNING *\n  `;\n\n  // null means the row already existed (duplicate)\n  return (rows[0] as GmailEmailRow) || null;\n}\n\n/**\n * Check if a Gmail email already exists (for deduplication checks).\n */\nexport async function gmailEmailExists(\n  tenantId: string,\n  gmailMessageId: string\n): Promise<boolean> {\n  const rows = await sql`\n    SELECT 1 FROM gmail_emails\n    WHERE tenant_id = ${tenantId} AND gmail_message_id = ${gmailMessageId}\n  `;\n  return rows.length > 0;\n}\n\n/**\n * Get recent Gmail emails for a tenant.\n */\nexport async function getRecentGmailEmails(\n  tenantId: string,\n  limit: number = 50\n): Promise<GmailEmailRow[]> {\n  const rows = await sql`\n    SELECT * FROM gmail_emails\n    WHERE tenant_id = ${tenantId}\n    ORDER BY received_at DESC\n    LIMIT ${limit}\n  `;\n  return rows as GmailEmailRow[];\n}\n\n/**\n * Get a single Gmail email by ID (scoped to tenant).\n */\nexport async function getGmailEmailById(\n  id: string,\n  tenantId: string\n): Promise<GmailEmailRow | null> {\n  const rows = await sql`\n    SELECT * FROM gmail_emails\n    WHERE id = ${id} AND tenant_id = ${tenantId}\n  `;\n  return (rows[0] as GmailEmailRow) || null;\n}\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Add Gmail email types and Zod validation schemas",
      "status": "completed",
      "activeForm": "Adding Gmail email types and Zod validation schemas"
    },
    {
      "content": "Update database schema with gmail_emails table",
      "status": "completed",
      "activeForm": "Updating database schema with gmail_emails table"
    },
    {
      "content": "Create Gmail email database query functions",
      "status": "completed",
      "activeForm": "Creating Gmail email database query functions"
    },
    {
      "content": "Implement Gmail Pub/Sub webhook endpoint",
      "status": "in_progress",
      "activeForm": "Implementing Gmail Pub/Sub webhook endpoint"
    },
    {
      "content": "Implement Apps Script webhook endpoint",
      "status": "pending",
      "activeForm": "Implementing Apps Script webhook endpoint"
    },
    {
      "content": "Add Gmail tab to admin integrations page",
      "status": "pending",
      "activeForm": "Adding Gmail tab to admin integrations page"
    },
    {
      "content": "Run drizzle-kit generate for migration",
      "status": "pending",
      "activeForm": "Running drizzle-kit generate for migration"
    },
    {
      "content": "Verify build compiles cleanly",
      "status": "pending",
      "activeForm": "Verifying build compiles cleanly"
    }
  ]
}
Now implement the Gmail Pub/Sub webhook endpoint. This endpoint receives Pub/Sub push notifications. Since this app doesn't have actual Gmail API access yet (that requires OAuth setup per tenant), I'll implement the endpoint to receive and decode the Pub/Sub message, and store a placeholder that can be extended once Gmail API OAuth is configured.

For the Pub/Sub endpoint, the spec says the actual message content comes from the Gmail API after decoding the historyId. Since we don't have OAuth tokens stored yet, this endpoint will validate the push, decode the historyId, and log it — the actual Gmail API fetch requires per-tenant OAuth which is a setup step. However, I'll implement the full endpoint structure as specified.

Let me create the webhook route structure.

🔧 Tool: Bash
Input: {
  "command": "ls \"C:\\Code\\Krisp\\app\\api\\webhooks\\email\"",
  "description": "List existing email webhook directories"
}

🔧 Tool: Write
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\webhooks\\email\\gmail\\[tenantId]\\route.ts",
  "content": "import { NextRequest, NextResponse } from \"next/server\";\nimport { insertGmailEmail } from \"@/lib/gmail/emails\";\nimport {\n  pubSubPushMessageSchema,\n  gmailAppsScriptPayloadSchema,\n} from \"@/lib/validators/schemas\";\nimport { db } from \"@/lib/db\";\nimport { users } from \"@/lib/db/schema\";\nimport { eq } from \"drizzle-orm\";\n\nconst GMAIL_WEBHOOK_SECRET = process.env.GMAIL_WEBHOOK_SECRET;\n\n/**\n * Validates the `?token=` query parameter as a secondary auth layer.\n * For Pub/Sub push, also validates the Bearer token in Authorization header\n * against Google's token info (simplified to secret comparison here).\n */\nfunction validateToken(request: NextRequest): boolean {\n  if (!GMAIL_WEBHOOK_SECRET) {\n    console.warn(\n      \"GMAIL_WEBHOOK_SECRET not configured - authorization disabled\"\n    );\n    return true;\n  }\n\n  // Check query parameter token (used by both Pub/Sub and Apps Script)\n  const tokenParam = request.nextUrl.searchParams.get(\"token\");\n  if (tokenParam) {\n    return timingSafeEqual(tokenParam, GMAIL_WEBHOOK_SECRET);\n  }\n\n  // Check X-API-Key header (used by Apps Script)\n  const apiKey = request.headers.get(\"x-api-key\");\n  if (apiKey) {\n    return timingSafeEqual(apiKey, GMAIL_WEBHOOK_SECRET);\n  }\n\n  // Check Authorization header (used by Pub/Sub push)\n  const authHeader = request.headers.get(\"authorization\");\n  if (authHeader) {\n    const token = authHeader.startsWith(\"Bearer \")\n      ? authHeader.slice(7)\n      : authHeader;\n    return timingSafeEqual(token, GMAIL_WEBHOOK_SECRET);\n  }\n\n  return false;\n}\n\nfunction timingSafeEqual(a: string, b: string): boolean {\n  if (a.length !== b.length) return false;\n  let result = 0;\n  for (let i = 0; i < a.length; i++) {\n    result |= a.charCodeAt(i) ^ b.charCodeAt(i);\n  }\n  return result === 0;\n}\n\nconst UUID_REGEX =\n  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;\n\nexport async function POST(\n  request: NextRequest,\n  { params }: { params: Promise<{ tenantId: string }> }\n) {\n  try {\n    // Validate auth\n    if (!validateToken(request)) {\n      return NextResponse.json({ error: \"Unauthorized\" }, { status: 401 });\n    }\n\n    const { tenantId } = await params;\n\n    // Validate UUID format\n    if (!UUID_REGEX.test(tenantId)) {\n      return NextResponse.json(\n        { error: \"Invalid tenant ID format\" },\n        { status: 400 }\n      );\n    }\n\n    // Validate that the tenant (user) exists\n    const [tenant] = await db\n      .select({ id: users.id })\n      .from(users)\n      .where(eq(users.id, tenantId));\n\n    if (!tenant) {\n      return NextResponse.json({ error: \"Tenant not found\" }, { status: 404 });\n    }\n\n    // Parse request body\n    let body: unknown;\n    try {\n      body = await request.json();\n    } catch {\n      return NextResponse.json(\n        { error: \"Invalid JSON payload\" },\n        { status: 400 }\n      );\n    }\n\n    // Determine message type: Pub/Sub push or Apps Script direct payload\n    const pubSubResult = pubSubPushMessageSchema.safeParse(body);\n\n    if (pubSubResult.success) {\n      return handlePubSubPush(pubSubResult.data, tenantId);\n    }\n\n    // Try Apps Script payload\n    const appsScriptResult = gmailAppsScriptPayloadSchema.safeParse(body);\n\n    if (appsScriptResult.success) {\n      return handleAppsScriptPayload(appsScriptResult.data, tenantId);\n    }\n\n    // Neither format matched\n    return NextResponse.json(\n      {\n        error: \"Validation failed\",\n        details:\n          \"Payload must be a Google Pub/Sub push message or an Apps Script email payload\",\n      },\n      { status: 400 }\n    );\n  } catch (error) {\n    console.error(\"Error processing Gmail webhook:\", error);\n\n    // Handle unique constraint violation (race condition on duplicate)\n    if (\n      error instanceof Error &&\n      error.message.includes(\"duplicate key value\")\n    ) {\n      return NextResponse.json(\n        { message: \"Email already processed\" },\n        { status: 200 }\n      );\n    }\n\n    return NextResponse.json(\n      { error: \"Internal server error\" },\n      { status: 500 }\n    );\n  }\n}\n\n/**\n * Handle a Google Pub/Sub push notification.\n *\n * The push payload contains a base64-encoded `data` field with\n * `{ emailAddress, historyId }`. The actual email must be fetched\n * via the Gmail API using history.list + messages.get.\n *\n * Since Gmail API OAuth tokens are managed per-tenant and the actual\n * fetch requires the Gmail API client, this endpoint decodes the\n * notification and acknowledges it. Full Gmail API integration\n * requires the tenant to complete OAuth setup first.\n */\nasync function handlePubSubPush(\n  message: { message: { data: string; messageId: string; publishTime: string }; subscription: string },\n  tenantId: string\n) {\n  // Decode the base64 data field\n  let decoded: { emailAddress?: string; historyId?: number };\n  try {\n    const raw = Buffer.from(message.message.data, \"base64\").toString(\"utf-8\");\n    decoded = JSON.parse(raw);\n  } catch {\n    return NextResponse.json(\n      { error: \"Invalid Pub/Sub message data\" },\n      { status: 400 }\n    );\n  }\n\n  if (!decoded.emailAddress || !decoded.historyId) {\n    return NextResponse.json(\n      { error: \"Missing emailAddress or historyId in Pub/Sub data\" },\n      { status: 400 }\n    );\n  }\n\n  // Log the notification for now — actual Gmail API fetch requires OAuth tokens\n  console.log(\n    `[Gmail Pub/Sub] Tenant ${tenantId}: notification for ${decoded.emailAddress}, historyId=${decoded.historyId}`\n  );\n\n  // TODO: When Gmail OAuth is configured per-tenant:\n  // 1. Get tenant's OAuth tokens from database\n  // 2. Call Gmail API history.list with the historyId\n  // 3. For each new message, call messages.get\n  // 4. Parse and store each email via insertGmailEmail()\n  // 5. Update tenant's stored historyId\n\n  // Acknowledge the Pub/Sub push to prevent retries\n  return NextResponse.json(\n    {\n      message: \"Pub/Sub notification received\",\n      emailAddress: decoded.emailAddress,\n      historyId: decoded.historyId,\n    },\n    { status: 200 }\n  );\n}\n\n/**\n * Handle a direct payload from Google Apps Script.\n *\n * Apps Script sends pre-parsed email data, so we can store it immediately\n * without needing Gmail API access.\n */\nasync function handleAppsScriptPayload(\n  payload: {\n    messageId: string;\n    sender: string;\n    recipients: string;\n    subject?: string;\n    bodyPlain?: string;\n    bodyHtml?: string;\n    receivedAt: string;\n  },\n  tenantId: string\n) {\n  // Parse recipients string into array (comma-separated)\n  const recipientsList = payload.recipients\n    .split(\",\")\n    .map((r) => r.trim())\n    .filter(Boolean);\n\n  const result = await insertGmailEmail({\n    tenant_id: tenantId,\n    gmail_message_id: payload.messageId,\n    sender: payload.sender,\n    recipients: recipientsList,\n    subject: payload.subject ?? null,\n    body_plain: payload.bodyPlain ?? null,\n    body_html: payload.bodyHtml ?? null,\n    received_at: new Date(payload.receivedAt),\n    raw_payload: payload,\n  });\n\n  // null means duplicate (ON CONFLICT DO NOTHING returned no rows)\n  if (!result) {\n    return NextResponse.json(\n      { message: \"Email already processed\", messageId: payload.messageId },\n      { status: 200 }\n    );\n  }\n\n  return NextResponse.json(\n    {\n      message: \"Email received and stored successfully\",\n      id: result.id,\n      gmailMessageId: result.gmail_message_id,\n    },\n    { status: 201 }\n  );\n}\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Add Gmail email types and Zod validation schemas",
      "status": "completed",
      "activeForm": "Adding Gmail email types and Zod validation schemas"
    },
    {
      "content": "Update database schema with gmail_emails table",
      "status": "completed",
      "activeForm": "Updating database schema with gmail_emails table"
    },
    {
      "content": "Create Gmail email database query functions",
      "status": "completed",
      "activeForm": "Creating Gmail email database query functions"
    },
    {
      "content": "Implement Gmail Pub/Sub webhook endpoint",
      "status": "completed",
      "activeForm": "Implementing Gmail Pub/Sub webhook endpoint"
    },
    {
      "content": "Implement Apps Script webhook endpoint",
      "status": "completed",
      "activeForm": "Implementing Apps Script webhook endpoint"
    },
    {
      "content": "Add Gmail tab to admin integrations page",
      "status": "in_progress",
      "activeForm": "Adding Gmail tab to admin integrations page"
    },
    {
      "content": "Run drizzle-kit generate for migration",
      "status": "pending",
      "activeForm": "Running drizzle-kit generate for migration"
    },
    {
      "content": "Verify build compiles cleanly",
      "status": "pending",
      "activeForm": "Verifying build compiles cleanly"
    }
  ]
}
Now let me add the Gmail tab to the admin integrations page. I need to update the `IntegrationsClient.tsx` to add a Gmail tab alongside the existing Microsoft 365 and Krisp tabs.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx"
}
Now I'll update the IntegrationsClient to add the Gmail tab. I need to add a new tab and Gmail section. The file is large, so I'll make targeted edits.

First, add Gmail to the TABS array:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "old_string": "const TABS = [\n  {\n    id: \"microsoft365\" as const,\n    label: \"Microsoft 365\",\n    icon: (\n      <svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"currentColor\">\n        <path d=\"M11.5 3v8.5H3V3h8.5zm0 18H3v-8.5h8.5V21zm1-18H21v8.5h-8.5V3zm0 18v-8.5H21V21h-8.5z\" />\n      </svg>\n    ),\n    color: \"#0078D4\",\n  },\n  {\n    id: \"crisp\" as const,\n    label: \"Krisp Meetings\",\n    icon: (\n      <svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"2\" strokeLinecap=\"round\" strokeLinejoin=\"round\">\n        <path d=\"M12 18.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13Z\" />\n        <path d=\"M12 2v2\" />\n        <path d=\"M12 20v2\" />\n        <path d=\"m4.93 4.93 1.41 1.41\" />\n        <path d=\"m17.66 17.66 1.41 1.41\" />\n        <path d=\"M2 12h2\" />\n        <path d=\"M20 12h2\" />\n        <path d=\"m6.34 17.66-1.41 1.41\" />\n        <path d=\"m19.07 4.93-1.41 1.41\" />\n      </svg>\n    ),\n    color: \"#4B45DC\",\n  },\n] as const;",
  "new_string": "const GMAIL_FIELD_MAPPING = [\n  { appsScript: \"msg.getId()\", payload: \"messageId\", description: \"Unique Gmail message identifier (required for dedup)\" },\n  { appsScript: \"msg.getFrom()\", payload: \"sender\", description: \"Sender email address\" },\n  { appsScript: \"msg.getTo()\", payload: \"recipients\", description: \"Comma-separated recipient addresses\" },\n  { appsScript: \"msg.getSubject()\", payload: \"subject\", description: \"Email subject line\" },\n  { appsScript: \"msg.getPlainBody()\", payload: \"bodyPlain\", description: \"Plain text body\" },\n  { appsScript: \"msg.getBody()\", payload: \"bodyHtml\", description: \"HTML body content\" },\n  { appsScript: \"msg.getDate().toISOString()\", payload: \"receivedAt\", description: \"ISO 8601 timestamp\" },\n];\n\nconst TABS = [\n  {\n    id: \"microsoft365\" as const,\n    label: \"Microsoft 365\",\n    icon: (\n      <svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"currentColor\">\n        <path d=\"M11.5 3v8.5H3V3h8.5zm0 18H3v-8.5h8.5V21zm1-18H21v8.5h-8.5V3zm0 18v-8.5H21V21h-8.5z\" />\n      </svg>\n    ),\n    color: \"#0078D4\",\n  },\n  {\n    id: \"gmail\" as const,\n    label: \"Gmail\",\n    icon: (\n      <svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"currentColor\">\n        <path d=\"M20 18h-2V9.25L12 13 6 9.25V18H4V6h1.2l6.8 4.25L18.8 6H20m0-2H4c-1.11 0-2 .89-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2z\" />\n      </svg>\n    ),\n    color: \"#EA4335\",\n  },\n  {\n    id: \"crisp\" as const,\n    label: \"Krisp Meetings\",\n    icon: (\n      <svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"2\" strokeLinecap=\"round\" strokeLinejoin=\"round\">\n        <path d=\"M12 18.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13Z\" />\n        <path d=\"M12 2v2\" />\n        <path d=\"M12 20v2\" />\n        <path d=\"m4.93 4.93 1.41 1.41\" />\n        <path d=\"m17.66 17.66 1.41 1.41\" />\n        <path d=\"M2 12h2\" />\n        <path d=\"M20 12h2\" />\n        <path d=\"m6.34 17.66-1.41 1.41\" />\n        <path d=\"m19.07 4.93-1.41 1.41\" />\n      </svg>\n    ),\n    color: \"#4B45DC\",\n  },\n] as const;"
}
Now add the Gmail webhook URL and the Gmail section content. First, add the URL:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "old_string": "  const webhookUrl = `${origin}/api/webhooks/email/microsoft365/${tenantId}`;\n  const crispWebhookUrl = `${origin}/api/webhooks/key-points?user_id=${tenantId}`;",
  "new_string": "  const webhookUrl = `${origin}/api/webhooks/email/microsoft365/${tenantId}`;\n  const gmailWebhookUrl = `${origin}/api/webhooks/email/gmail/${tenantId}`;\n  const crispWebhookUrl = `${origin}/api/webhooks/key-points?user_id=${tenantId}`;"
}
Now add the Gmail section between Microsoft 365 and Crisp sections:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "old_string": "          {/* Crisp Meeting Webhook Section */}\n          {activeTab === \"crisp\" && <section className=\"rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden\">",
  "new_string": "          {/* Gmail Section */}\n          {activeTab === \"gmail\" && <section className=\"rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden\">\n            <div className=\"px-6 py-5 border-b border-[var(--border)]\">\n              <div className=\"flex items-center gap-3\">\n                <div className=\"w-10 h-10 rounded-lg bg-[#EA4335] flex items-center justify-center\">\n                  <svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"white\">\n                    <path d=\"M20 18h-2V9.25L12 13 6 9.25V18H4V6h1.2l6.8 4.25L18.8 6H20m0-2H4c-1.11 0-2 .89-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2z\" />\n                  </svg>\n                </div>\n                <div>\n                  <h2 className=\"text-lg font-semibold text-[var(--foreground)]\">\n                    Gmail / Google Workspace Email\n                  </h2>\n                  <p className=\"text-sm text-[var(--muted-foreground)]\">\n                    Ingest emails via Google Pub/Sub or Apps Script\n                  </p>\n                </div>\n              </div>\n            </div>\n\n            <div className=\"p-6 space-y-8\">\n              {/* Webhook URL */}\n              <div>\n                <h3 className=\"text-sm font-semibold text-[var(--foreground)] mb-2\">\n                  Your Webhook URL\n                </h3>\n                <p className=\"text-sm text-[var(--muted-foreground)] mb-3\">\n                  This is your tenant-specific endpoint. Use it as the Pub/Sub push\n                  subscription URL or the Apps Script POST target.\n                </p>\n                <div className=\"flex items-center p-3 rounded-lg bg-[var(--secondary)] border border-[var(--border)]\">\n                  <code className=\"flex-1 text-sm text-[var(--foreground)] break-all\">\n                    {gmailWebhookUrl}\n                  </code>\n                  <CopyButton text={gmailWebhookUrl} />\n                </div>\n              </div>\n\n              {/* Authentication */}\n              <div>\n                <h3 className=\"text-sm font-semibold text-[var(--foreground)] mb-2\">\n                  Authentication\n                </h3>\n                <p className=\"text-sm text-[var(--muted-foreground)] mb-3\">\n                  Requests are authenticated via a <code className=\"px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)] text-xs\">?token=</code> query\n                  parameter, <code className=\"px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)] text-xs\">X-API-Key</code> header,\n                  or <code className=\"px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)] text-xs\">Authorization: Bearer</code> header\n                  matching the <code className=\"px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)] text-xs\">GMAIL_WEBHOOK_SECRET</code> environment\n                  variable.\n                </p>\n                <div className=\"p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-[var(--foreground)]\">\n                  Contact your server administrator for the secret value. It is\n                  defined as the <code className=\"font-mono\">GMAIL_WEBHOOK_SECRET</code> environment\n                  variable.\n                </div>\n              </div>\n\n              {/* Setup Option A */}\n              <div>\n                <div className=\"flex items-center gap-2 mb-4\">\n                  <span className=\"px-2.5 py-1 text-xs font-semibold rounded-full bg-green-500/10 text-green-600 border border-green-500/20\">\n                    Recommended\n                  </span>\n                  <h3 className=\"text-sm font-semibold text-[var(--foreground)]\">\n                    Setup Option A &mdash; Full Integration (Pub/Sub)\n                  </h3>\n                </div>\n\n                <ol className=\"space-y-6\">\n                  <li className=\"flex gap-4\">\n                    <span className=\"flex-shrink-0 w-7 h-7 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-sm font-semibold\">\n                      1\n                    </span>\n                    <div className=\"flex-1\">\n                      <p className=\"font-medium text-[var(--foreground)]\">\n                        Enable the Gmail API\n                      </p>\n                      <p className=\"text-sm text-[var(--muted-foreground)] mt-1\">\n                        Go to{\" \"}\n                        <span className=\"font-medium text-[var(--foreground)]\">Google Cloud Console</span>{\" \"}\n                        &rarr; <span className=\"font-medium text-[var(--foreground)]\">APIs &amp; Services</span>{\" \"}\n                        &rarr; <span className=\"font-medium text-[var(--foreground)]\">Enable APIs</span>{\" \"}\n                        &rarr; search for &quot;Gmail API&quot; and enable it.\n                      </p>\n                    </div>\n                  </li>\n\n                  <li className=\"flex gap-4\">\n                    <span className=\"flex-shrink-0 w-7 h-7 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-sm font-semibold\">\n                      2\n                    </span>\n                    <div className=\"flex-1\">\n                      <p className=\"font-medium text-[var(--foreground)]\">\n                        Create a Pub/Sub Topic\n                      </p>\n                      <p className=\"text-sm text-[var(--muted-foreground)] mt-1\">\n                        In the same Google Cloud project, create a Pub/Sub topic named{\" \"}\n                        <code className=\"px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)] text-xs\">gmail-inbound</code>.\n                      </p>\n                    </div>\n                  </li>\n\n                  <li className=\"flex gap-4\">\n                    <span className=\"flex-shrink-0 w-7 h-7 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-sm font-semibold\">\n                      3\n                    </span>\n                    <div className=\"flex-1\">\n                      <p className=\"font-medium text-[var(--foreground)]\">\n                        Create a Push Subscription\n                      </p>\n                      <p className=\"text-sm text-[var(--muted-foreground)] mt-1\">\n                        Create a push subscription on the topic pointing to your webhook URL\n                        with the token appended:\n                      </p>\n                      <div className=\"flex items-center mt-3 p-2 rounded bg-[var(--secondary)] border border-[var(--border)]\">\n                        <code className=\"text-sm text-[var(--foreground)] break-all\">\n                          {gmailWebhookUrl}?token=YOUR_SECRET\n                        </code>\n                      </div>\n                    </div>\n                  </li>\n\n                  <li className=\"flex gap-4\">\n                    <span className=\"flex-shrink-0 w-7 h-7 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-sm font-semibold\">\n                      4\n                    </span>\n                    <div className=\"flex-1\">\n                      <p className=\"font-medium text-[var(--foreground)]\">\n                        Grant Publish Rights\n                      </p>\n                      <p className=\"text-sm text-[var(--muted-foreground)] mt-1\">\n                        Grant the <code className=\"px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)] text-xs\">Pub/Sub Publisher</code> role\n                        to <code className=\"px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)] text-xs\">gmail-api-push@system.gserviceaccount.com</code> on\n                        your Pub/Sub topic.\n                      </p>\n                    </div>\n                  </li>\n\n                  <li className=\"flex gap-4\">\n                    <span className=\"flex-shrink-0 w-7 h-7 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-sm font-semibold\">\n                      5\n                    </span>\n                    <div className=\"flex-1\">\n                      <p className=\"font-medium text-[var(--foreground)]\">\n                        Set Up Gmail Watch\n                      </p>\n                      <p className=\"text-sm text-[var(--muted-foreground)] mt-1\">\n                        After completing OAuth authorization, call the Gmail Watch API to start\n                        monitoring the inbox:\n                      </p>\n                      <div className=\"mt-3\">\n                        <CodeBlock>{`POST https://gmail.googleapis.com/gmail/v1/users/me/watch\n{\n  \"topicName\": \"projects/YOUR_PROJECT/topics/gmail-inbound\",\n  \"labelIds\": [\"INBOX\"],\n  \"labelFilterBehavior\": \"INCLUDE\"\n}`}</CodeBlock>\n                      </div>\n                      <p className=\"text-sm text-[var(--muted-foreground)] mt-3\">\n                        Watch subscriptions expire after 7 days. Set up a daily job to renew\n                        watches expiring within 24 hours.\n                      </p>\n                    </div>\n                  </li>\n\n                  <li className=\"flex gap-4\">\n                    <span className=\"flex-shrink-0 w-7 h-7 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-sm font-semibold\">\n                      6\n                    </span>\n                    <div className=\"flex-1\">\n                      <p className=\"font-medium text-[var(--foreground)]\">\n                        Test the Integration\n                      </p>\n                      <p className=\"text-sm text-[var(--muted-foreground)] mt-1\">\n                        Send a test email to the monitored Gmail account. The Pub/Sub notification\n                        should arrive at your webhook endpoint within seconds. Check server logs\n                        for confirmation.\n                      </p>\n                    </div>\n                  </li>\n                </ol>\n              </div>\n\n              {/* Setup Option B */}\n              <div className=\"border-t border-[var(--border)] pt-8\">\n                <h3 className=\"text-sm font-semibold text-[var(--foreground)] mb-4\">\n                  Setup Option B &mdash; Apps Script (Simpler)\n                </h3>\n                <p className=\"text-sm text-[var(--muted-foreground)] mb-4\">\n                  For a simpler setup that doesn&apos;t require Pub/Sub or OAuth on your backend,\n                  deploy this Google Apps Script template. It polls Gmail and POSTs directly to\n                  your webhook with a delay of up to 1 minute.\n                </p>\n\n                <ol className=\"space-y-6\">\n                  <li className=\"flex gap-4\">\n                    <span className=\"flex-shrink-0 w-7 h-7 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-sm font-semibold\">\n                      1\n                    </span>\n                    <div className=\"flex-1\">\n                      <p className=\"font-medium text-[var(--foreground)]\">\n                        Create an Apps Script Project\n                      </p>\n                      <p className=\"text-sm text-[var(--muted-foreground)] mt-1\">\n                        Open{\" \"}\n                        <span className=\"font-medium text-[var(--foreground)]\">script.google.com</span>{\" \"}\n                        while signed into the Gmail account you want to monitor. Create a new project.\n                      </p>\n                    </div>\n                  </li>\n\n                  <li className=\"flex gap-4\">\n                    <span className=\"flex-shrink-0 w-7 h-7 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-sm font-semibold\">\n                      2\n                    </span>\n                    <div className=\"flex-1\">\n                      <p className=\"font-medium text-[var(--foreground)]\">\n                        Paste the Script Template\n                      </p>\n                      <p className=\"text-sm text-[var(--muted-foreground)] mt-1\">\n                        Replace the default code with the following, using your webhook URL and\n                        API key:\n                      </p>\n                      <div className=\"mt-3\">\n                        <CodeBlock>{`function checkNewEmails() {\n  var webhookUrl = \"${gmailWebhookUrl}\";\n  var apiKey = \"YOUR_GMAIL_WEBHOOK_SECRET\";\n  var lastRun = PropertiesService.getScriptProperties()\n                  .getProperty(\"lastRun\") || \"2000/01/01\";\n\n  var threads = GmailApp.search(\"after:\" + lastRun + \" in:inbox\");\n\n  for (var i = 0; i < threads.length; i++) {\n    var messages = threads[i].getMessages();\n    for (var j = 0; j < messages.length; j++) {\n      var msg = messages[j];\n      var payload = {\n        messageId: msg.getId(),\n        sender: msg.getFrom(),\n        recipients: msg.getTo(),\n        subject: msg.getSubject(),\n        bodyPlain: msg.getPlainBody(),\n        bodyHtml: msg.getBody(),\n        receivedAt: msg.getDate().toISOString()\n      };\n\n      UrlFetchApp.fetch(webhookUrl, {\n        method: \"POST\",\n        headers: {\n          \"Content-Type\": \"application/json\",\n          \"X-API-Key\": apiKey\n        },\n        payload: JSON.stringify(payload),\n        muteHttpExceptions: true\n      });\n    }\n  }\n\n  PropertiesService.getScriptProperties()\n    .setProperty(\"lastRun\",\n      new Date().toLocaleDateString(\"en-US\"));\n}`}</CodeBlock>\n                      </div>\n                    </div>\n                  </li>\n\n                  <li className=\"flex gap-4\">\n                    <span className=\"flex-shrink-0 w-7 h-7 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-sm font-semibold\">\n                      3\n                    </span>\n                    <div className=\"flex-1\">\n                      <p className=\"font-medium text-[var(--foreground)]\">\n                        Run Once Manually\n                      </p>\n                      <p className=\"text-sm text-[var(--muted-foreground)] mt-1\">\n                        Click <span className=\"font-medium text-[var(--foreground)]\">Run</span> to\n                        execute the function once and grant the required Gmail permissions.\n                      </p>\n                    </div>\n                  </li>\n\n                  <li className=\"flex gap-4\">\n                    <span className=\"flex-shrink-0 w-7 h-7 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-sm font-semibold\">\n                      4\n                    </span>\n                    <div className=\"flex-1\">\n                      <p className=\"font-medium text-[var(--foreground)]\">\n                        Set Up a Time Trigger\n                      </p>\n                      <p className=\"text-sm text-[var(--muted-foreground)] mt-1\">\n                        Go to <span className=\"font-medium text-[var(--foreground)]\">Triggers</span>{\" \"}\n                        &rarr; <span className=\"font-medium text-[var(--foreground)]\">Add Trigger</span>{\" \"}\n                        &rarr; set <code className=\"px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)] text-xs\">checkNewEmails</code> to\n                        run every 1 minute.\n                      </p>\n                    </div>\n                  </li>\n                </ol>\n              </div>\n\n              {/* Field Mapping Reference */}\n              <div className=\"border-t border-[var(--border)] pt-8\">\n                <h3 className=\"text-sm font-semibold text-[var(--foreground)] mb-3\">\n                  Field Mapping Reference (Apps Script)\n                </h3>\n                <div className=\"overflow-x-auto rounded-lg border border-[var(--border)]\">\n                  <table className=\"w-full text-sm\">\n                    <thead>\n                      <tr className=\"bg-[var(--secondary)]\">\n                        <th className=\"px-4 py-3 text-left font-medium text-[var(--foreground)]\">\n                          Apps Script / Gmail Value\n                        </th>\n                        <th className=\"px-4 py-3 text-left font-medium text-[var(--foreground)]\">\n                          Webhook Payload Key\n                        </th>\n                        <th className=\"px-4 py-3 text-left font-medium text-[var(--foreground)]\">\n                          Description\n                        </th>\n                      </tr>\n                    </thead>\n                    <tbody className=\"divide-y divide-[var(--border)]\">\n                      {GMAIL_FIELD_MAPPING.map((field) => (\n                        <tr key={field.payload}>\n                          <td className=\"px-4 py-3\">\n                            <code className=\"px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)] text-xs\">\n                              {field.appsScript}\n                            </code>\n                          </td>\n                          <td className=\"px-4 py-3\">\n                            <code className=\"px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)] text-xs\">\n                              {field.payload}\n                            </code>\n                          </td>\n                          <td className=\"px-4 py-3 text-[var(--muted-foreground)]\">\n                            {field.description}\n                          </td>\n                        </tr>\n                      ))}\n                    </tbody>\n                  </table>\n                </div>\n              </div>\n\n              {/* Response Codes */}\n              <div>\n                <h3 className=\"text-sm font-semibold text-[var(--foreground)] mb-3\">\n                  Response Codes\n                </h3>\n                <div className=\"overflow-x-auto rounded-lg border border-[var(--border)]\">\n                  <table className=\"w-full text-sm\">\n                    <thead>\n                      <tr className=\"bg-[var(--secondary)]\">\n                        <th className=\"px-4 py-3 text-left font-medium text-[var(--foreground)]\">\n                          Code\n                        </th>\n                        <th className=\"px-4 py-3 text-left font-medium text-[var(--foreground)]\">\n                          Meaning\n                        </th>\n                      </tr>\n                    </thead>\n                    <tbody className=\"divide-y divide-[var(--border)]\">\n                      <tr>\n                        <td className=\"px-4 py-3\">\n                          <code className=\"px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 text-xs font-semibold\">\n                            200\n                          </code>\n                        </td>\n                        <td className=\"px-4 py-3 text-[var(--muted-foreground)]\">\n                          Success or duplicate &mdash; Pub/Sub will not retry on 200\n                        </td>\n                      </tr>\n                      <tr>\n                        <td className=\"px-4 py-3\">\n                          <code className=\"px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 text-xs font-semibold\">\n                            201\n                          </code>\n                        </td>\n                        <td className=\"px-4 py-3 text-[var(--muted-foreground)]\">\n                          Email received and stored successfully (Apps Script path)\n                        </td>\n                      </tr>\n                      <tr>\n                        <td className=\"px-4 py-3\">\n                          <code className=\"px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 text-xs font-semibold\">\n                            400\n                          </code>\n                        </td>\n                        <td className=\"px-4 py-3 text-[var(--muted-foreground)]\">\n                          Payload malformed or tenant resolution failed\n                        </td>\n                      </tr>\n                      <tr>\n                        <td className=\"px-4 py-3\">\n                          <code className=\"px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 text-xs font-semibold\">\n                            401\n                          </code>\n                        </td>\n                        <td className=\"px-4 py-3 text-[var(--muted-foreground)]\">\n                          Auth token invalid\n                        </td>\n                      </tr>\n                      <tr>\n                        <td className=\"px-4 py-3\">\n                          <code className=\"px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 text-xs font-semibold\">\n                            500\n                          </code>\n                        </td>\n                        <td className=\"px-4 py-3 text-[var(--muted-foreground)]\">\n                          Internal error &mdash; Pub/Sub will retry with exponential backoff\n                        </td>\n                      </tr>\n                    </tbody>\n                  </table>\n                </div>\n              </div>\n            </div>\n          </section>}\n\n          {/* Crisp Meeting Webhook Section */}\n          {activeTab === \"crisp\" && <section className=\"rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden\">"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Add Gmail email types and Zod validation schemas",
      "status": "completed",
      "activeForm": "Adding Gmail email types and Zod validation schemas"
    },
    {
      "content": "Update database schema with gmail_emails table",
      "status": "completed",
      "activeForm": "Updating database schema with gmail_emails table"
    },
    {
      "content": "Create Gmail email database query functions",
      "status": "completed",
      "activeForm": "Creating Gmail email database query functions"
    },
    {
      "content": "Implement Gmail Pub/Sub webhook endpoint",
      "status": "completed",
      "activeForm": "Implementing Gmail Pub/Sub webhook endpoint"
    },
    {
      "content": "Implement Apps Script webhook endpoint",
      "status": "completed",
      "activeForm": "Implementing Apps Script webhook endpoint"
    },
    {
      "content": "Add Gmail tab to admin integrations page",
      "status": "completed",
      "activeForm": "Adding Gmail tab to admin integrations page"
    },
    {
      "content": "Run drizzle-kit generate for migration",
      "status": "in_progress",
      "activeForm": "Running drizzle-kit generate for migration"
    },
    {
      "content": "Verify build compiles cleanly",
      "status": "pending",
      "activeForm": "Verifying build compiles cleanly"
    }
  ]
}
Now let me generate the Drizzle migration. I need to check the drizzle config first.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\drizzle.config.ts"
}

🔧 Tool: Bash
Input: {
  "command": "ls \"C:\\Code\\Krisp\\drizzle\\migrations\"",
  "description": "List existing Drizzle migrations"
}

🔧 Tool: Bash
Input: {
  "command": "ls \"C:\\Code\\Krisp\\drizzle\" 2>/dev/null || echo \"No drizzle directory\"",
  "description": "Check if drizzle directory exists"
}

🔧 Tool: Glob
Input: {
  "pattern": "drizzle/**/*",
  "path": "C:\\Code\\Krisp"
}
There's no existing migrations directory, so drizzle-kit generate would create the first one. Let me try to generate a migration. Based on the memory note, drizzle-kit needs the DATABASE_URL passed inline.

🔧 Tool: Bash
Input: {
  "command": "cd /c/Code/Krisp && npx drizzle-kit generate 2>&1 | head -30",
  "description": "Generate Drizzle migration for gmail_emails table",
  "timeout": 30000
}
The migration was generated. Since there were no previous migrations, it created the initial migration including all tables. Let me verify.

🔧 Tool: Glob
Input: {
  "pattern": "drizzle/migrations/**/*",
  "path": "C:\\Code\\Krisp"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\drizzle\\migrations\\0000_groovy_micromax.sql"
}
The migration looks correct. The `gmail_emails` table is at lines 60-76 with the proper schema, constraints, indexes, and foreign key. Now let me verify the build compiles cleanly.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Add Gmail email types and Zod validation schemas",
      "status": "completed",
      "activeForm": "Adding Gmail email types and Zod validation schemas"
    },
    {
      "content": "Update database schema with gmail_emails table",
      "status": "completed",
      "activeForm": "Updating database schema with gmail_emails table"
    },
    {
      "content": "Create Gmail email database query functions",
      "status": "completed",
      "activeForm": "Creating Gmail email database query functions"
    },
    {
      "content": "Implement Gmail Pub/Sub webhook endpoint",
      "status": "completed",
      "activeForm": "Implementing Gmail Pub/Sub webhook endpoint"
    },
    {
      "content": "Implement Apps Script webhook endpoint",
      "status": "completed",
      "activeForm": "Implementing Apps Script webhook endpoint"
    },
    {
      "content": "Add Gmail tab to admin integrations page",
      "status": "completed",
      "activeForm": "Adding Gmail tab to admin integrations page"
    },
    {
      "content": "Run drizzle-kit generate for migration",
      "status": "completed",
      "activeForm": "Running drizzle-kit generate for migration"
    },
    {
      "content": "Verify build compiles cleanly",
      "status": "in_progress",
      "activeForm": "Verifying build compiles cleanly"
    }
  ]
}

🔧 Tool: Bash
Input: {
  "command": "cd /c/Code/Krisp && npx tsc --noEmit 2>&1 | head -50",
  "description": "TypeScript type check",
  "timeout": 120000
}
TypeScript compiles cleanly with no errors. Let me also do a quick build check.

🔧 Tool: Bash
Input: {
  "command": "cd /c/Code/Krisp && npx next build 2>&1 | tail -40",
  "description": "Next.js build check",
  "timeout": 120000
}
Build succeeds. The new route `api/webhooks/email/gmail/[tenantId]` is visible in the route list. Let me verify the final state of all the files I created/modified.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Add Gmail email types and Zod validation schemas",
      "status": "completed",
      "activeForm": "Adding Gmail email types and Zod validation schemas"
    },
    {
      "content": "Update database schema with gmail_emails table",
      "status": "completed",
      "activeForm": "Updating database schema with gmail_emails table"
    },
    {
      "content": "Create Gmail email database query functions",
      "status": "completed",
      "activeForm": "Creating Gmail email database query functions"
    },
    {
      "content": "Implement Gmail Pub/Sub webhook endpoint",
      "status": "completed",
      "activeForm": "Implementing Gmail Pub/Sub webhook endpoint"
    },
    {
      "content": "Implement Apps Script webhook endpoint",
      "status": "completed",
      "activeForm": "Implementing Apps Script webhook endpoint"
    },
    {
      "content": "Add Gmail tab to admin integrations page",
      "status": "completed",
      "activeForm": "Adding Gmail tab to admin integrations page"
    },
    {
      "content": "Run drizzle-kit generate for migration",
      "status": "completed",
      "activeForm": "Running drizzle-kit generate for migration"
    },
    {
      "content": "Verify build compiles cleanly",
      "status": "completed",
      "activeForm": "Verifying build compiles cleanly"
    }
  ]
}
All tasks are complete. The implementation compiles and builds successfully.

<summary>
## Summary: Gmail Email Ingestion via Google Pub/Sub & Apps Script

### Changes Implemented
- Added `gmail_emails` database table to Drizzle schema with UUID primary key, tenant scoping, unique constraint on `(tenant_id, gmail_message_id)`, and indexes on tenant_id, received_at, and sender
- Created Gmail-specific TypeScript types (`GmailEmailRow`, `GmailEmailInsert`, `PubSubPushMessage`, `GmailAppsScriptPayload`, etc.)
- Added Zod validation schemas for both Pub/Sub push messages (`pubSubPushMessageSchema`) and Apps Script payloads (`gmailAppsScriptPayloadSchema`) with 5MB body size limits
- Created Gmail database query module (`lib/gmail/`) with `insertGmailEmail` (uses `INSERT ... ON CONFLICT DO NOTHING` for idempotent dedup), `gmailEmailExists`, `getRecentGmailEmails`, and `getGmailEmailById`
- Implemented unified webhook endpoint at `POST /api/webhooks/email/gmail/[tenantId]` that auto-detects payload type:
  - **Pub/Sub push path**: Decodes base64 message data, extracts `emailAddress` and `historyId`, acknowledges with 200 (Gmail API fetch requires per-tenant OAuth setup)
  - **Apps Script path**: Parses pre-parsed email payload, stores directly to database via `insertGmailEmail`
- Authentication supports three methods: `?token=` query parameter, `X-API-Key` header, or `Authorization: Bearer` header — all validated against `GMAIL_WEBHOOK_SECRET` env var with timing-safe comparison
- Added Gmail tab to the admin integrations page (`/admin/integrations`) with:
  - Webhook URL display with copy button
  - Setup Option A (Pub/Sub full integration) — 6-step guide covering Gmail API enablement, Pub/Sub topic creation, push subscription, publishing rights, Gmail Watch API, and testing
  - Setup Option B (Apps Script) — 4-step guide with ready-to-paste script template pre-filled with the tenant's webhook URL
  - Field mapping reference table for Apps Script payloads
  - Response codes reference table
- Generated Drizzle migration (`drizzle/migrations/0000_groovy_micromax.sql`) containing the full schema including the new `gmail_emails` table

### Files Modified
- `lib/db/schema.ts` — Added `gmailEmails` table definition
- `lib/validators/schemas.ts` — Added `pubSubPushMessageSchema` and `gmailAppsScriptPayloadSchema` with types
- `app/(app)/admin/integrations/IntegrationsClient.tsx` — Added Gmail tab, webhook URL, setup guides, field mapping, response codes

### Files Created
- `types/gmail.ts` — Gmail-specific TypeScript interfaces
- `lib/gmail/db.ts` — Neon serverless SQL connection for Gmail queries
- `lib/gmail/emails.ts` — Gmail email CRUD operations with dedup support
- `app/api/webhooks/email/gmail/[tenantId]/route.ts` — Unified webhook endpoint handling both Pub/Sub and Apps Script payloads
- `drizzle/migrations/0000_groovy_micromax.sql` — Database migration
- `drizzle/migrations/meta/0000_snapshot.json` — Migration snapshot
- `drizzle/migrations/meta/_journal.json` — Migration journal

### Notes for Developer
- **New env var needed**: `GMAIL_WEBHOOK_SECRET` — used for authenticating Gmail webhook requests. If not set, auth is bypassed with a console warning (not recommended for production).
- **Pub/Sub path is a stub**: The Pub/Sub push handler decodes and acknowledges notifications but doesn't yet fetch emails via the Gmail API. Full implementation requires per-tenant OAuth token storage and Gmail API client integration (watch registration, history.list, messages.get). The TODO comments in the route file outline the exact steps.
- **Apps Script path is fully functional**: Emails sent from the Apps Script template are parsed and stored immediately in the `gmail_emails` table.
- **Migration note**: This is the first Drizzle migration generated for the project. It includes ALL tables, not just `gmail_emails`. If the database already has existing tables, you may need to use `drizzle-kit push` instead or manually extract just the `gmail_emails` CREATE statements.
- The deduplication uses `INSERT ... ON CONFLICT DO NOTHING` on the `(tenant_id, gmail_message_id)` unique constraint, returning null for duplicates (200 response) to prevent Pub/Sub retries.
</summary>