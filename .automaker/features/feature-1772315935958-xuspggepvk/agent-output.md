

I'll start by exploring the current state of the codebase to understand what's already been implemented, then plan and implement the Gmail Watch setup.

🔧 Tool: Task
Input: {
  "description": "Explore Gmail integration code",
  "prompt": "Explore the Gmail integration code in C:\\Code\\Krisp to understand:\n1. The current webhook endpoint at app/api/webhooks/email/gmail/[tenantId]/route.ts\n2. The lib/gmail/ directory (db.ts, emails.ts)\n3. The lib/db/schema.ts - especially any Gmail/tenant-related tables\n4. The app/(app)/admin/integrations/IntegrationsClient.tsx - the Gmail tab\n5. The types/gmail.ts file\n6. The lib/validators/schemas.ts - Gmail schemas\n7. Any existing Google OAuth or API integration code\n8. The .env.local file for existing env vars\n9. The auth.ts file for NextAuth setup\n10. The package.json for existing Google-related dependencies\n\nProvide a comprehensive report of all findings.",
  "subagent_type": "Explore"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/gmail/**"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/webhooks/email/**"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/types/gmail.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\db\\schema.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\package.json"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\webhooks\\email\\gmail\\[tenantId]\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\gmail\\db.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\gmail\\emails.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\types\\gmail.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\validators\\schemas.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\auth.ts"
}

🔧 Tool: Bash
Input: {
  "command": "find \"C:\\Code\\Krisp\" -name \".env.local\" -o -name \".env\" | head -5"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/auth/**"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "offset": 1,
  "limit": 300
}

🔧 Tool: Grep
Input: {
  "pattern": "GMAIL|Google|OAuth|google",
  "path": "C:\\Code\\Krisp",
  "glob": "*.ts,*.tsx,.env*",
  "output_mode": "content",
  "head_limit": 50
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "offset": 700,
  "limit": 500
}

🔧 Tool: Glob
Input: {
  "pattern": "**/*.env*"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/lib/google/**"
}

🔧 Tool: Bash
Input: {
  "command": "find \"C:\\Code\\Krisp\" -type f -name \"*[Gg]mail*\" -o -name \"*[Gg]oogle*\" 2>/dev/null | head -20"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\.env.local"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\.env.example"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "offset": 1200,
  "limit": 500
}

🔧 Tool: Glob
Input: {
  "pattern": "**/app/api/**"
}

🔧 Tool: Bash
Input: {
  "command": "find \"C:\\Code\\Krisp\\app\\api\" -type f -name \"*.ts\" 2>/dev/null | head -20"
}

🔧 Tool: Grep
Input: {
  "pattern": "oauth|client_id|client_secret|GMAIL|authorization_code",
  "path": "C:\\Code\\Krisp",
  "glob": "*.ts,*.tsx",
  "output_mode": "content",
  "head_limit": 30
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\webhook-secret\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\webhooks\\email\\microsoft365\\[tenantId]\\route.ts",
  "offset": 1,
  "limit": 200
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\webhooks\\email\\graph\\[tenantId]\\route.ts",
  "offset": 1,
  "limit": 200
}

🔧 Tool: Glob
Input: {
  "pattern": "**/lib/email/**"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/lib/microsoft/**"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\email\\emails.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/types/email.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\types\\email.ts"
}

🔧 Tool: Grep
Input: {
  "pattern": "@google|googleapis|google-auth|google-api",
  "path": "C:\\Code\\Krisp\\package.json",
  "output_mode": "content"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/db/migrations/**"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\db\\migrations\\004_create_graph_subscriptions.sql"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\db\\migrations\\003_create_emails.sql"
}

🔧 Tool: Bash
Input: {
  "command": "find \"C:\\Code\\Krisp\\db\\migrations\" -name \"*.sql\" -type f | sort"
}

🔧 Tool: Bash
Input: {
  "command": "ls -la \"C:\\Code\\Krisp\\lib\\graph\" 2>/dev/null || echo \"Directory does not exist\""
}

🔧 Tool: Bash
Input: {
  "command": "ls -la \"C:\\Code\\Krisp\\app\\api\\webhooks\\email\\graph\" 2>/dev/null || echo \"Directory does not exist\""
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\graph\\subscriptions.ts"
}

🔧 Tool: Bash
Input: {
  "command": "find \"C:\\Code\\Krisp\" -name \"drizzle.config.ts\" -o -name \"tsconfig.json\" 2>/dev/null"
}

🔧 Tool: Grep
Input: {
  "pattern": "TODO|FIXME|XXX|BUG|HACK",
  "path": "C:\\Code\\Krisp\\app\\api\\webhooks\\email\\gmail",
  "output_mode": "content"
}

🔧 Tool: Grep
Input: {
  "pattern": "TODO|FIXME",
  "path": "C:\\Code\\Krisp\\lib\\gmail",
  "output_mode": "content"
}
Now I have a clear picture. Let me read the key files I need to modify.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\webhooks\\email\\gmail\\[tenantId]\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\gmail\\emails.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\types\\gmail.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\db\\schema.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\package.json"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\.env.local"
}
Now let me also look at the existing Graph API subscription pattern for reference, since it has a similar watch/subscription lifecycle.

🔧 Tool: Glob
Input: {
  "pattern": "app/api/webhooks/email/graph/**/*",
  "path": "C:\\Code\\Krisp"
}

🔧 Tool: Glob
Input: {
  "pattern": "lib/graph/**/*",
  "path": "C:\\Code\\Krisp"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\webhooks\\email\\graph\\[tenantId]\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\graph\\subscriptions.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "offset": 1,
  "limit": 100
}
Now let me read the rest of the IntegrationsClient, particularly the Gmail section and the Graph API section (for the subscription pattern).

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "offset": 100,
  "limit": 200
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "offset": 300,
  "limit": 200
}
Now let me see the Graph API section to understand the subscription management pattern used there.

🔧 Tool: Grep
Input: {
  "pattern": "activeTab === \"graph\"",
  "path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "output_mode": "content",
  "-n": true
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "offset": 622,
  "limit": 300
}
Good. I now have a thorough understanding of the codebase. Let me now check where the Gmail section starts in the integrations page and read it completely.

🔧 Tool: Grep
Input: {
  "pattern": "activeTab === \"gmail\"",
  "path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "output_mode": "content",
  "-n": true
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "offset": 1126,
  "limit": 500
}
Now I have a complete understanding of the codebase. Let me plan the implementation.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Add gmail_watch_subscriptions table to Drizzle schema",
      "status": "pending",
      "activeForm": "Adding gmail_watch_subscriptions table to schema"
    },
    {
      "content": "Create lib/gmail/watch.ts with watch management functions",
      "status": "pending",
      "activeForm": "Creating Gmail watch management functions"
    },
    {
      "content": "Create API routes for Gmail watch setup/renew/stop",
      "status": "pending",
      "activeForm": "Creating Gmail watch API routes"
    },
    {
      "content": "Update Pub/Sub webhook handler to fetch emails via Gmail API",
      "status": "pending",
      "activeForm": "Updating Pub/Sub webhook handler"
    },
    {
      "content": "Add Gmail OAuth config and env vars",
      "status": "pending",
      "activeForm": "Adding Gmail OAuth configuration"
    },
    {
      "content": "Update IntegrationsClient.tsx with watch management UI",
      "status": "pending",
      "activeForm": "Updating integrations UI with watch management"
    },
    {
      "content": "Generate Drizzle migration",
      "status": "pending",
      "activeForm": "Generating Drizzle migration"
    },
    {
      "content": "Verify build compiles cleanly",
      "status": "pending",
      "activeForm": "Verifying build compiles cleanly"
    }
  ]
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Add gmail_watch_subscriptions table to Drizzle schema",
      "status": "in_progress",
      "activeForm": "Adding gmail_watch_subscriptions table to schema"
    },
    {
      "content": "Create lib/gmail/watch.ts with watch management functions",
      "status": "pending",
      "activeForm": "Creating Gmail watch management functions"
    },
    {
      "content": "Create API routes for Gmail watch setup/renew/stop",
      "status": "pending",
      "activeForm": "Creating Gmail watch API routes"
    },
    {
      "content": "Update Pub/Sub webhook handler to fetch emails via Gmail API",
      "status": "pending",
      "activeForm": "Updating Pub/Sub webhook handler"
    },
    {
      "content": "Add Gmail OAuth config and env vars",
      "status": "pending",
      "activeForm": "Adding Gmail OAuth configuration"
    },
    {
      "content": "Update IntegrationsClient.tsx with watch management UI",
      "status": "pending",
      "activeForm": "Updating integrations UI with watch management"
    },
    {
      "content": "Generate Drizzle migration",
      "status": "pending",
      "activeForm": "Generating Drizzle migration"
    },
    {
      "content": "Verify build compiles cleanly",
      "status": "pending",
      "activeForm": "Verifying build compiles cleanly"
    }
  ]
}
First, let me add the `gmail_watch_subscriptions` table to track per-tenant watch state (OAuth tokens, historyId, expiration). I'll add it to the schema after the `gmailEmails` table.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\lib\\db\\schema.ts",
  "old_string": "// ── Webhook Secrets ──────────────────────────────────",
  "new_string": "// ── Gmail Watch Subscriptions ────────────────────────\nexport const gmailWatchSubscriptions = pgTable(\n  \"gmail_watch_subscriptions\",\n  {\n    id: uuid(\"id\").defaultRandom().primaryKey(),\n    tenantId: uuid(\"tenant_id\")\n      .notNull()\n      .references(() => users.id, { onDelete: \"cascade\" }),\n    emailAddress: varchar(\"email_address\", { length: 320 }).notNull(),\n    historyId: varchar(\"history_id\", { length: 100 }),\n    expiration: timestamp(\"expiration\", { withTimezone: true }),\n    topicName: varchar(\"topic_name\", { length: 512 }).notNull(),\n    accessToken: text(\"access_token\"),\n    refreshToken: text(\"refresh_token\"),\n    tokenExpiry: timestamp(\"token_expiry\", { withTimezone: true }),\n    active: boolean(\"active\").default(true).notNull(),\n    createdAt: timestamp(\"created_at\", { withTimezone: true })\n      .defaultNow()\n      .notNull(),\n    updatedAt: timestamp(\"updated_at\", { withTimezone: true })\n      .defaultNow()\n      .notNull(),\n  },\n  (table) => [\n    uniqueIndex(\"uq_gmail_watch_tenant_email\").on(\n      table.tenantId,\n      table.emailAddress\n    ),\n    index(\"idx_gmail_watch_tenant\").on(table.tenantId),\n    index(\"idx_gmail_watch_expiration\").on(table.expiration),\n  ]\n);\n\n// ── Webhook Secrets ──────────────────────────────────"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Add gmail_watch_subscriptions table to Drizzle schema",
      "status": "completed",
      "activeForm": "Adding gmail_watch_subscriptions table to schema"
    },
    {
      "content": "Create lib/gmail/watch.ts with watch management functions",
      "status": "in_progress",
      "activeForm": "Creating Gmail watch management functions"
    },
    {
      "content": "Create API routes for Gmail watch setup/renew/stop",
      "status": "pending",
      "activeForm": "Creating Gmail watch API routes"
    },
    {
      "content": "Update Pub/Sub webhook handler to fetch emails via Gmail API",
      "status": "pending",
      "activeForm": "Updating Pub/Sub webhook handler"
    },
    {
      "content": "Add Gmail OAuth config and env vars",
      "status": "pending",
      "activeForm": "Adding Gmail OAuth configuration"
    },
    {
      "content": "Update IntegrationsClient.tsx with watch management UI",
      "status": "pending",
      "activeForm": "Updating integrations UI with watch management"
    },
    {
      "content": "Generate Drizzle migration",
      "status": "pending",
      "activeForm": "Generating Drizzle migration"
    },
    {
      "content": "Verify build compiles cleanly",
      "status": "pending",
      "activeForm": "Verifying build compiles cleanly"
    }
  ]
}
Now let me create the Gmail watch management module. This will handle OAuth token refresh, calling the Gmail Watch API, fetching emails via history.list + messages.get, and watch renewal.

🔧 Tool: Write
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\gmail\\watch.ts",
  "content": "import { db } from \"@/lib/db\";\nimport { gmailWatchSubscriptions } from \"@/lib/db/schema\";\nimport { eq, and, lt } from \"drizzle-orm\";\n\n// ── Types ────────────────────────────────────────────\n\nexport interface GmailWatchInsert {\n  tenantId: string;\n  emailAddress: string;\n  topicName: string;\n  accessToken: string;\n  refreshToken: string;\n  tokenExpiry: Date;\n}\n\nexport interface GmailWatchResponse {\n  historyId: string;\n  expiration: string; // milliseconds since epoch as string\n}\n\nexport interface GmailHistoryMessage {\n  id: string;\n  threadId: string;\n}\n\nexport interface GmailMessage {\n  id: string;\n  threadId: string;\n  labelIds?: string[];\n  internalDate: string;\n  payload: {\n    headers: Array<{ name: string; value: string }>;\n    mimeType: string;\n    body?: { size: number; data?: string };\n    parts?: Array<{\n      mimeType: string;\n      filename?: string;\n      body: { size: number; data?: string; attachmentId?: string };\n      parts?: Array<{\n        mimeType: string;\n        body: { size: number; data?: string };\n      }>;\n    }>;\n  };\n}\n\n// ── Token Management ─────────────────────────────────\n\nconst GOOGLE_TOKEN_URL = \"https://oauth2.googleapis.com/token\";\n\n/**\n * Refresh an expired Google OAuth access token using the refresh token.\n */\nexport async function refreshAccessToken(\n  refreshToken: string\n): Promise<{ accessToken: string; expiresAt: Date }> {\n  const clientId = process.env.GOOGLE_CLIENT_ID;\n  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;\n\n  if (!clientId || !clientSecret) {\n    throw new Error(\n      \"GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be configured\"\n    );\n  }\n\n  const res = await fetch(GOOGLE_TOKEN_URL, {\n    method: \"POST\",\n    headers: { \"Content-Type\": \"application/x-www-form-urlencoded\" },\n    body: new URLSearchParams({\n      client_id: clientId,\n      client_secret: clientSecret,\n      refresh_token: refreshToken,\n      grant_type: \"refresh_token\",\n    }),\n  });\n\n  if (!res.ok) {\n    const err = await res.text();\n    throw new Error(`Token refresh failed (${res.status}): ${err}`);\n  }\n\n  const data = await res.json();\n  return {\n    accessToken: data.access_token,\n    expiresAt: new Date(Date.now() + data.expires_in * 1000),\n  };\n}\n\n/**\n * Get a valid access token for a watch subscription, refreshing if needed.\n */\nasync function getValidAccessToken(\n  subscription: typeof gmailWatchSubscriptions.$inferSelect\n): Promise<string> {\n  const now = new Date();\n  const bufferMs = 5 * 60 * 1000; // 5 minute buffer\n\n  if (\n    subscription.accessToken &&\n    subscription.tokenExpiry &&\n    subscription.tokenExpiry.getTime() > now.getTime() + bufferMs\n  ) {\n    return subscription.accessToken;\n  }\n\n  if (!subscription.refreshToken) {\n    throw new Error(\n      `No refresh token for watch subscription ${subscription.id}`\n    );\n  }\n\n  const { accessToken, expiresAt } = await refreshAccessToken(\n    subscription.refreshToken\n  );\n\n  // Update stored tokens\n  await db\n    .update(gmailWatchSubscriptions)\n    .set({\n      accessToken,\n      tokenExpiry: expiresAt,\n      updatedAt: new Date(),\n    })\n    .where(eq(gmailWatchSubscriptions.id, subscription.id));\n\n  return accessToken;\n}\n\n// ── Gmail Watch API ──────────────────────────────────\n\nconst GMAIL_API_BASE = \"https://gmail.googleapis.com/gmail/v1/users/me\";\n\n/**\n * Call Gmail Watch API to start monitoring an inbox.\n * Returns the initial historyId and watch expiration.\n */\nexport async function createGmailWatch(\n  accessToken: string,\n  topicName: string\n): Promise<GmailWatchResponse> {\n  const res = await fetch(`${GMAIL_API_BASE}/watch`, {\n    method: \"POST\",\n    headers: {\n      Authorization: `Bearer ${accessToken}`,\n      \"Content-Type\": \"application/json\",\n    },\n    body: JSON.stringify({\n      topicName,\n      labelIds: [\"INBOX\"],\n      labelFilterBehavior: \"INCLUDE\",\n    }),\n  });\n\n  if (!res.ok) {\n    const err = await res.text();\n    throw new Error(`Gmail watch creation failed (${res.status}): ${err}`);\n  }\n\n  return res.json();\n}\n\n/**\n * Stop an existing Gmail watch.\n */\nexport async function stopGmailWatch(accessToken: string): Promise<void> {\n  const res = await fetch(`${GMAIL_API_BASE}/stop`, {\n    method: \"POST\",\n    headers: {\n      Authorization: `Bearer ${accessToken}`,\n    },\n  });\n\n  // 204 is success, but Google may also return 200 or even 404 if already stopped\n  if (!res.ok && res.status !== 404) {\n    const err = await res.text();\n    throw new Error(`Gmail watch stop failed (${res.status}): ${err}`);\n  }\n}\n\n// ── Gmail History & Message Fetch ────────────────────\n\n/**\n * Fetch new message IDs since a given historyId using history.list.\n */\nexport async function fetchHistorySince(\n  accessToken: string,\n  startHistoryId: string\n): Promise<{ messageIds: string[]; latestHistoryId: string }> {\n  const messageIds: string[] = [];\n  let pageToken: string | undefined;\n  let latestHistoryId = startHistoryId;\n\n  do {\n    const url = new URL(`${GMAIL_API_BASE}/history`);\n    url.searchParams.set(\"startHistoryId\", startHistoryId);\n    url.searchParams.set(\"historyTypes\", \"messageAdded\");\n    url.searchParams.set(\"labelId\", \"INBOX\");\n    if (pageToken) url.searchParams.set(\"pageToken\", pageToken);\n\n    const res = await fetch(url.toString(), {\n      headers: { Authorization: `Bearer ${accessToken}` },\n    });\n\n    if (!res.ok) {\n      // 404 means the historyId is too old (> 7 days) — caller should re-watch\n      if (res.status === 404) {\n        return { messageIds: [], latestHistoryId: startHistoryId };\n      }\n      const err = await res.text();\n      throw new Error(`Gmail history.list failed (${res.status}): ${err}`);\n    }\n\n    const data = await res.json();\n    latestHistoryId = data.historyId || latestHistoryId;\n\n    if (data.history) {\n      for (const entry of data.history) {\n        if (entry.messagesAdded) {\n          for (const added of entry.messagesAdded) {\n            messageIds.push(added.message.id);\n          }\n        }\n      }\n    }\n\n    pageToken = data.nextPageToken;\n  } while (pageToken);\n\n  return { messageIds: [...new Set(messageIds)], latestHistoryId };\n}\n\n/**\n * Fetch a single Gmail message by ID with full payload.\n */\nexport async function fetchGmailMessage(\n  accessToken: string,\n  messageId: string\n): Promise<GmailMessage> {\n  const res = await fetch(\n    `${GMAIL_API_BASE}/messages/${messageId}?format=full`,\n    {\n      headers: { Authorization: `Bearer ${accessToken}` },\n    }\n  );\n\n  if (!res.ok) {\n    const err = await res.text();\n    throw new Error(\n      `Gmail messages.get failed for ${messageId} (${res.status}): ${err}`\n    );\n  }\n\n  return res.json();\n}\n\n/**\n * Extract header value from a Gmail message payload.\n */\nexport function getHeader(\n  message: GmailMessage,\n  name: string\n): string | undefined {\n  return message.payload.headers.find(\n    (h) => h.name.toLowerCase() === name.toLowerCase()\n  )?.value;\n}\n\n/**\n * Decode base64url-encoded body data from Gmail API.\n */\nexport function decodeBase64Url(data: string): string {\n  const base64 = data.replace(/-/g, \"+\").replace(/_/g, \"/\");\n  return Buffer.from(base64, \"base64\").toString(\"utf-8\");\n}\n\n/**\n * Extract plain text and HTML bodies from a Gmail message.\n */\nexport function extractBodies(message: GmailMessage): {\n  bodyPlain: string | null;\n  bodyHtml: string | null;\n} {\n  let bodyPlain: string | null = null;\n  let bodyHtml: string | null = null;\n\n  const parts = message.payload.parts;\n\n  if (parts) {\n    for (const part of parts) {\n      if (part.mimeType === \"text/plain\" && part.body.data) {\n        bodyPlain = decodeBase64Url(part.body.data);\n      } else if (part.mimeType === \"text/html\" && part.body.data) {\n        bodyHtml = decodeBase64Url(part.body.data);\n      } else if (\n        part.mimeType === \"multipart/alternative\" &&\n        part.parts\n      ) {\n        for (const subpart of part.parts) {\n          if (subpart.mimeType === \"text/plain\" && subpart.body.data) {\n            bodyPlain = decodeBase64Url(subpart.body.data);\n          } else if (subpart.mimeType === \"text/html\" && subpart.body.data) {\n            bodyHtml = decodeBase64Url(subpart.body.data);\n          }\n        }\n      }\n    }\n  } else if (message.payload.body?.data) {\n    // Simple message (no parts)\n    if (message.payload.mimeType === \"text/plain\") {\n      bodyPlain = decodeBase64Url(message.payload.body.data);\n    } else if (message.payload.mimeType === \"text/html\") {\n      bodyHtml = decodeBase64Url(message.payload.body.data);\n    }\n  }\n\n  return { bodyPlain, bodyHtml };\n}\n\n/**\n * Extract attachment metadata from a Gmail message.\n */\nexport function extractAttachments(\n  message: GmailMessage\n): Array<{ name: string; mimeType: string; size: number; attachmentId: string }> {\n  const attachments: Array<{\n    name: string;\n    mimeType: string;\n    size: number;\n    attachmentId: string;\n  }> = [];\n\n  if (!message.payload.parts) return attachments;\n\n  for (const part of message.payload.parts) {\n    if (part.filename && part.body.attachmentId) {\n      attachments.push({\n        name: part.filename,\n        mimeType: part.mimeType,\n        size: part.body.size,\n        attachmentId: part.body.attachmentId,\n      });\n    }\n  }\n\n  return attachments;\n}\n\n// ── Database Operations ──────────────────────────────\n\n/**\n * Create or update a Gmail watch subscription record.\n */\nexport async function upsertGmailWatch(data: GmailWatchInsert & {\n  historyId?: string;\n  expiration?: Date;\n}) {\n  const existing = await db\n    .select()\n    .from(gmailWatchSubscriptions)\n    .where(\n      and(\n        eq(gmailWatchSubscriptions.tenantId, data.tenantId),\n        eq(gmailWatchSubscriptions.emailAddress, data.emailAddress)\n      )\n    );\n\n  if (existing.length > 0) {\n    const [result] = await db\n      .update(gmailWatchSubscriptions)\n      .set({\n        topicName: data.topicName,\n        historyId: data.historyId ?? existing[0].historyId,\n        expiration: data.expiration ?? existing[0].expiration,\n        accessToken: data.accessToken,\n        refreshToken: data.refreshToken,\n        tokenExpiry: data.tokenExpiry,\n        active: true,\n        updatedAt: new Date(),\n      })\n      .where(eq(gmailWatchSubscriptions.id, existing[0].id))\n      .returning();\n    return result;\n  }\n\n  const [result] = await db\n    .insert(gmailWatchSubscriptions)\n    .values({\n      tenantId: data.tenantId,\n      emailAddress: data.emailAddress,\n      topicName: data.topicName,\n      historyId: data.historyId ?? null,\n      expiration: data.expiration ?? null,\n      accessToken: data.accessToken,\n      refreshToken: data.refreshToken,\n      tokenExpiry: data.tokenExpiry,\n    })\n    .returning();\n\n  return result;\n}\n\n/**\n * Get the active watch subscription for a tenant.\n */\nexport async function getActiveWatch(tenantId: string) {\n  const results = await db\n    .select()\n    .from(gmailWatchSubscriptions)\n    .where(\n      and(\n        eq(gmailWatchSubscriptions.tenantId, tenantId),\n        eq(gmailWatchSubscriptions.active, true)\n      )\n    );\n  return results[0] ?? null;\n}\n\n/**\n * Update the historyId for a watch subscription after processing.\n */\nexport async function updateWatchHistoryId(\n  subscriptionId: string,\n  historyId: string\n) {\n  await db\n    .update(gmailWatchSubscriptions)\n    .set({\n      historyId,\n      updatedAt: new Date(),\n    })\n    .where(eq(gmailWatchSubscriptions.id, subscriptionId));\n}\n\n/**\n * Deactivate a watch subscription.\n */\nexport async function deactivateWatch(subscriptionId: string) {\n  await db\n    .update(gmailWatchSubscriptions)\n    .set({\n      active: false,\n      updatedAt: new Date(),\n    })\n    .where(eq(gmailWatchSubscriptions.id, subscriptionId));\n}\n\n/**\n * Get watches expiring before a given date (for renewal cron).\n */\nexport async function getExpiringWatches(beforeDate: Date) {\n  return db\n    .select()\n    .from(gmailWatchSubscriptions)\n    .where(\n      and(\n        eq(gmailWatchSubscriptions.active, true),\n        lt(gmailWatchSubscriptions.expiration, beforeDate)\n      )\n    );\n}\n\n/**\n * Set up a Gmail watch for a tenant: calls the Watch API, stores the\n * subscription record, and returns the watch response.\n */\nexport async function setupGmailWatch(data: GmailWatchInsert) {\n  // Call Gmail Watch API\n  const watchResponse = await createGmailWatch(\n    data.accessToken,\n    data.topicName\n  );\n\n  // Store the subscription\n  const subscription = await upsertGmailWatch({\n    ...data,\n    historyId: watchResponse.historyId,\n    expiration: new Date(parseInt(watchResponse.expiration, 10)),\n  });\n\n  return { subscription, watchResponse };\n}\n\n/**\n * Renew an existing Gmail watch subscription.\n */\nexport async function renewGmailWatch(subscriptionId: string) {\n  const [subscription] = await db\n    .select()\n    .from(gmailWatchSubscriptions)\n    .where(eq(gmailWatchSubscriptions.id, subscriptionId));\n\n  if (!subscription) {\n    throw new Error(`Watch subscription ${subscriptionId} not found`);\n  }\n\n  const accessToken = await getValidAccessToken(subscription);\n\n  const watchResponse = await createGmailWatch(\n    accessToken,\n    subscription.topicName\n  );\n\n  await db\n    .update(gmailWatchSubscriptions)\n    .set({\n      historyId: watchResponse.historyId,\n      expiration: new Date(parseInt(watchResponse.expiration, 10)),\n      updatedAt: new Date(),\n    })\n    .where(eq(gmailWatchSubscriptions.id, subscriptionId));\n\n  return watchResponse;\n}\n\n/**\n * Process a Pub/Sub notification: fetch new emails since the stored\n * historyId, parse them, and return data ready for insertion.\n */\nexport async function processGmailNotification(\n  tenantId: string,\n  notifiedHistoryId: number\n) {\n  const subscription = await getActiveWatch(tenantId);\n  if (!subscription) {\n    console.warn(\n      `[Gmail Watch] No active watch for tenant ${tenantId}`\n    );\n    return { processed: 0 };\n  }\n\n  const startHistoryId =\n    subscription.historyId || String(notifiedHistoryId);\n  const accessToken = await getValidAccessToken(subscription);\n\n  // Fetch new messages since last processed historyId\n  const { messageIds, latestHistoryId } = await fetchHistorySince(\n    accessToken,\n    startHistoryId\n  );\n\n  if (messageIds.length === 0) {\n    // Update historyId even if no new messages\n    await updateWatchHistoryId(subscription.id, latestHistoryId);\n    return { processed: 0 };\n  }\n\n  // Fetch each message and prepare for insertion\n  const emails = [];\n  for (const msgId of messageIds) {\n    try {\n      const message = await fetchGmailMessage(accessToken, msgId);\n      const { bodyPlain, bodyHtml } = extractBodies(message);\n      const attachments = extractAttachments(message);\n\n      emails.push({\n        tenant_id: tenantId,\n        gmail_message_id: message.id,\n        thread_id: message.threadId,\n        sender: getHeader(message, \"From\") ?? \"(unknown)\",\n        recipients: parseRecipients(message),\n        subject: getHeader(message, \"Subject\") ?? null,\n        body_plain: bodyPlain,\n        body_html: bodyHtml,\n        received_at: new Date(parseInt(message.internalDate, 10)),\n        attachments,\n        labels: message.labelIds ?? [],\n        raw_payload: null, // Don't store full payload to save space\n      });\n    } catch (err) {\n      console.error(\n        `[Gmail Watch] Failed to fetch message ${msgId}:`,\n        err\n      );\n    }\n  }\n\n  // Update the historyId to the latest\n  await updateWatchHistoryId(subscription.id, latestHistoryId);\n\n  return { processed: emails.length, emails };\n}\n\n/**\n * Parse recipients from To, Cc, Bcc headers into a structured array.\n */\nfunction parseRecipients(message: GmailMessage) {\n  const to = getHeader(message, \"To\") ?? \"\";\n  const cc = getHeader(message, \"Cc\") ?? \"\";\n  const bcc = getHeader(message, \"Bcc\") ?? \"\";\n\n  const parse = (header: string) =>\n    header\n      .split(\",\")\n      .map((s) => s.trim())\n      .filter(Boolean);\n\n  return {\n    to: parse(to),\n    cc: parse(cc),\n    bcc: parse(bcc),\n  };\n}\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Add gmail_watch_subscriptions table to Drizzle schema",
      "status": "completed",
      "activeForm": "Adding gmail_watch_subscriptions table to schema"
    },
    {
      "content": "Create lib/gmail/watch.ts with watch management functions",
      "status": "completed",
      "activeForm": "Creating Gmail watch management functions"
    },
    {
      "content": "Create API routes for Gmail watch setup/renew/stop",
      "status": "in_progress",
      "activeForm": "Creating Gmail watch API routes"
    },
    {
      "content": "Update Pub/Sub webhook handler to fetch emails via Gmail API",
      "status": "pending",
      "activeForm": "Updating Pub/Sub webhook handler"
    },
    {
      "content": "Add Gmail OAuth config and env vars",
      "status": "pending",
      "activeForm": "Adding Gmail OAuth configuration"
    },
    {
      "content": "Update IntegrationsClient.tsx with watch management UI",
      "status": "pending",
      "activeForm": "Updating integrations UI with watch management"
    },
    {
      "content": "Generate Drizzle migration",
      "status": "pending",
      "activeForm": "Generating Drizzle migration"
    },
    {
      "content": "Verify build compiles cleanly",
      "status": "pending",
      "activeForm": "Verifying build compiles cleanly"
    }
  ]
}
Now let me create the API routes. I need three endpoints:
1. `POST /api/gmail/watch` - Set up a new watch (with OAuth tokens)
2. `POST /api/gmail/watch/renew` - Renew an existing watch
3. `DELETE /api/gmail/watch` - Stop and deactivate a watch
4. `GET /api/gmail/watch` - Get watch status

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\auth\\getRequiredUser.ts"
}
Let me check how existing API routes handle auth (for API routes vs pages).

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\webhook-secret\\route.ts"
}
Good, I can see the pattern. Auth API routes use `const session = await auth()` from `@/auth`. Now let me create the Gmail watch API route.

🔧 Tool: Write
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\gmail\\watch\\route.ts",
  "content": "import { NextRequest, NextResponse } from \"next/server\";\nimport { auth } from \"@/auth\";\nimport {\n  setupGmailWatch,\n  getActiveWatch,\n  renewGmailWatch,\n  stopGmailWatch,\n  deactivateWatch,\n  getValidAccessTokenForTenant,\n} from \"@/lib/gmail/watch\";\n\n/**\n * GET /api/gmail/watch\n * Returns the current Gmail watch status for the authenticated user.\n */\nexport async function GET() {\n  try {\n    const session = await auth();\n    const userId = session?.user?.id;\n    if (!userId) {\n      return NextResponse.json({ error: \"Unauthorized\" }, { status: 401 });\n    }\n\n    const watch = await getActiveWatch(userId);\n\n    if (!watch) {\n      return NextResponse.json({ active: false, watch: null });\n    }\n\n    return NextResponse.json({\n      active: true,\n      watch: {\n        id: watch.id,\n        emailAddress: watch.emailAddress,\n        historyId: watch.historyId,\n        expiration: watch.expiration,\n        topicName: watch.topicName,\n        createdAt: watch.createdAt,\n        updatedAt: watch.updatedAt,\n      },\n    });\n  } catch (error) {\n    console.error(\"Error fetching Gmail watch status:\", error);\n    return NextResponse.json(\n      { error: \"Failed to fetch watch status\" },\n      { status: 500 }\n    );\n  }\n}\n\n/**\n * POST /api/gmail/watch\n * Set up a new Gmail watch subscription for the authenticated user.\n *\n * Body: {\n *   emailAddress: string,\n *   topicName: string,\n *   accessToken: string,\n *   refreshToken: string,\n *   tokenExpiry: string (ISO 8601)\n * }\n */\nexport async function POST(request: NextRequest) {\n  try {\n    const session = await auth();\n    const userId = session?.user?.id;\n    if (!userId) {\n      return NextResponse.json({ error: \"Unauthorized\" }, { status: 401 });\n    }\n\n    const body = await request.json();\n\n    const { emailAddress, topicName, accessToken, refreshToken, tokenExpiry } =\n      body;\n\n    if (!emailAddress || !topicName || !accessToken || !refreshToken) {\n      return NextResponse.json(\n        {\n          error:\n            \"emailAddress, topicName, accessToken, and refreshToken are required\",\n        },\n        { status: 400 }\n      );\n    }\n\n    const { subscription, watchResponse } = await setupGmailWatch({\n      tenantId: userId,\n      emailAddress,\n      topicName,\n      accessToken,\n      refreshToken,\n      tokenExpiry: tokenExpiry ? new Date(tokenExpiry) : new Date(Date.now() + 3600 * 1000),\n    });\n\n    return NextResponse.json({\n      message: \"Gmail watch created successfully\",\n      watch: {\n        id: subscription.id,\n        emailAddress: subscription.emailAddress,\n        historyId: watchResponse.historyId,\n        expiration: new Date(\n          parseInt(watchResponse.expiration, 10)\n        ).toISOString(),\n        topicName: subscription.topicName,\n      },\n    });\n  } catch (error) {\n    console.error(\"Error setting up Gmail watch:\", error);\n    return NextResponse.json(\n      {\n        error: \"Failed to set up Gmail watch\",\n        details: error instanceof Error ? error.message : \"Unknown error\",\n      },\n      { status: 500 }\n    );\n  }\n}\n\n/**\n * PUT /api/gmail/watch\n * Renew the existing Gmail watch subscription for the authenticated user.\n */\nexport async function PUT() {\n  try {\n    const session = await auth();\n    const userId = session?.user?.id;\n    if (!userId) {\n      return NextResponse.json({ error: \"Unauthorized\" }, { status: 401 });\n    }\n\n    const watch = await getActiveWatch(userId);\n    if (!watch) {\n      return NextResponse.json(\n        { error: \"No active Gmail watch found\" },\n        { status: 404 }\n      );\n    }\n\n    const watchResponse = await renewGmailWatch(watch.id);\n\n    return NextResponse.json({\n      message: \"Gmail watch renewed successfully\",\n      expiration: new Date(\n        parseInt(watchResponse.expiration, 10)\n      ).toISOString(),\n      historyId: watchResponse.historyId,\n    });\n  } catch (error) {\n    console.error(\"Error renewing Gmail watch:\", error);\n    return NextResponse.json(\n      {\n        error: \"Failed to renew Gmail watch\",\n        details: error instanceof Error ? error.message : \"Unknown error\",\n      },\n      { status: 500 }\n    );\n  }\n}\n\n/**\n * DELETE /api/gmail/watch\n * Stop and deactivate the Gmail watch for the authenticated user.\n */\nexport async function DELETE() {\n  try {\n    const session = await auth();\n    const userId = session?.user?.id;\n    if (!userId) {\n      return NextResponse.json({ error: \"Unauthorized\" }, { status: 401 });\n    }\n\n    const watch = await getActiveWatch(userId);\n    if (!watch) {\n      return NextResponse.json(\n        { error: \"No active Gmail watch found\" },\n        { status: 404 }\n      );\n    }\n\n    // Stop the watch on Google's side\n    try {\n      const accessToken = await getValidAccessTokenForTenant(userId);\n      await stopGmailWatch(accessToken);\n    } catch (err) {\n      console.warn(\n        \"[Gmail Watch] Failed to stop watch on Google side (may already be expired):\",\n        err\n      );\n    }\n\n    // Deactivate locally\n    await deactivateWatch(watch.id);\n\n    return NextResponse.json({\n      message: \"Gmail watch stopped and deactivated\",\n    });\n  } catch (error) {\n    console.error(\"Error stopping Gmail watch:\", error);\n    return NextResponse.json(\n      {\n        error: \"Failed to stop Gmail watch\",\n        details: error instanceof Error ? error.message : \"Unknown error\",\n      },\n      { status: 500 }\n    );\n  }\n}\n"
}
I need to add the `getValidAccessTokenForTenant` export to `lib/gmail/watch.ts` since the API route references it. Let me update the watch module to export that function.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\lib\\gmail\\watch.ts",
  "old_string": "/**\n * Get a valid access token for a watch subscription, refreshing if needed.\n */\nasync function getValidAccessToken(\n  subscription: typeof gmailWatchSubscriptions.$inferSelect\n): Promise<string> {",
  "new_string": "/**\n * Get a valid access token for a watch subscription, refreshing if needed.\n */\nexport async function getValidAccessToken(\n  subscription: typeof gmailWatchSubscriptions.$inferSelect\n): Promise<string> {"
}
Now add the `getValidAccessTokenForTenant` convenience function that looks up the subscription first.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\lib\\gmail\\watch.ts",
  "old_string": "// ── Gmail Watch API ──────────────────────────────────",
  "new_string": "/**\n * Get a valid access token for a tenant by looking up their active watch.\n */\nexport async function getValidAccessTokenForTenant(\n  tenantId: string\n): Promise<string> {\n  const subscription = await getActiveWatch(tenantId);\n  if (!subscription) {\n    throw new Error(`No active watch subscription for tenant ${tenantId}`);\n  }\n  return getValidAccessToken(subscription);\n}\n\n// ── Gmail Watch API ──────────────────────────────────"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Add gmail_watch_subscriptions table to Drizzle schema",
      "status": "completed",
      "activeForm": "Adding gmail_watch_subscriptions table to schema"
    },
    {
      "content": "Create lib/gmail/watch.ts with watch management functions",
      "status": "completed",
      "activeForm": "Creating Gmail watch management functions"
    },
    {
      "content": "Create API routes for Gmail watch setup/renew/stop",
      "status": "completed",
      "activeForm": "Creating Gmail watch API routes"
    },
    {
      "content": "Update Pub/Sub webhook handler to fetch emails via Gmail API",
      "status": "in_progress",
      "activeForm": "Updating Pub/Sub webhook handler"
    },
    {
      "content": "Add Gmail OAuth config and env vars",
      "status": "pending",
      "activeForm": "Adding Gmail OAuth configuration"
    },
    {
      "content": "Update IntegrationsClient.tsx with watch management UI",
      "status": "pending",
      "activeForm": "Updating integrations UI with watch management"
    },
    {
      "content": "Generate Drizzle migration",
      "status": "pending",
      "activeForm": "Generating Drizzle migration"
    },
    {
      "content": "Verify build compiles cleanly",
      "status": "pending",
      "activeForm": "Verifying build compiles cleanly"
    }
  ]
}
Now let me update the Pub/Sub webhook handler to actually fetch emails via the Gmail API when a watch subscription is active.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\api\\webhooks\\email\\gmail\\[tenantId]\\route.ts",
  "old_string": "import { NextRequest, NextResponse } from \"next/server\";\nimport { insertGmailEmail } from \"@/lib/gmail/emails\";\nimport {\n  pubSubPushMessageSchema,\n  gmailAppsScriptPayloadSchema,\n} from \"@/lib/validators/schemas\";\nimport { db } from \"@/lib/db\";\nimport { users } from \"@/lib/db/schema\";\nimport { eq } from \"drizzle-orm\";",
  "new_string": "import { NextRequest, NextResponse } from \"next/server\";\nimport { insertGmailEmail } from \"@/lib/gmail/emails\";\nimport { processGmailNotification } from \"@/lib/gmail/watch\";\nimport {\n  pubSubPushMessageSchema,\n  gmailAppsScriptPayloadSchema,\n} from \"@/lib/validators/schemas\";\nimport { db } from \"@/lib/db\";\nimport { users } from \"@/lib/db/schema\";\nimport { eq } from \"drizzle-orm\";"
}
Now replace the stub `handlePubSubPush` with the real implementation:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\api\\webhooks\\email\\gmail\\[tenantId]\\route.ts",
  "old_string": "/**\n * Handle a Google Pub/Sub push notification.\n *\n * The push payload contains a base64-encoded `data` field with\n * `{ emailAddress, historyId }`. The actual email must be fetched\n * via the Gmail API using history.list + messages.get.\n *\n * Since Gmail API OAuth tokens are managed per-tenant and the actual\n * fetch requires the Gmail API client, this endpoint decodes the\n * notification and acknowledges it. Full Gmail API integration\n * requires the tenant to complete OAuth setup first.\n */\nasync function handlePubSubPush(\n  message: { message: { data: string; messageId: string; publishTime: string }; subscription: string },\n  tenantId: string\n) {\n  // Decode the base64 data field\n  let decoded: { emailAddress?: string; historyId?: number };\n  try {\n    const raw = Buffer.from(message.message.data, \"base64\").toString(\"utf-8\");\n    decoded = JSON.parse(raw);\n  } catch {\n    return NextResponse.json(\n      { error: \"Invalid Pub/Sub message data\" },\n      { status: 400 }\n    );\n  }\n\n  if (!decoded.emailAddress || !decoded.historyId) {\n    return NextResponse.json(\n      { error: \"Missing emailAddress or historyId in Pub/Sub data\" },\n      { status: 400 }\n    );\n  }\n\n  // Log the notification for now — actual Gmail API fetch requires OAuth tokens\n  console.log(\n    `[Gmail Pub/Sub] Tenant ${tenantId}: notification for ${decoded.emailAddress}, historyId=${decoded.historyId}`\n  );\n\n  // TODO: When Gmail OAuth is configured per-tenant:\n  // 1. Get tenant's OAuth tokens from database\n  // 2. Call Gmail API history.list with the historyId\n  // 3. For each new message, call messages.get\n  // 4. Parse and store each email via insertGmailEmail()\n  // 5. Update tenant's stored historyId\n\n  // Acknowledge the Pub/Sub push to prevent retries\n  return NextResponse.json(\n    {\n      message: \"Pub/Sub notification received\",\n      emailAddress: decoded.emailAddress,\n      historyId: decoded.historyId,\n    },\n    { status: 200 }\n  );\n}",
  "new_string": "/**\n * Handle a Google Pub/Sub push notification.\n *\n * The push payload contains a base64-encoded `data` field with\n * `{ emailAddress, historyId }`. The actual email is fetched\n * via the Gmail API using history.list + messages.get when the\n * tenant has an active watch subscription with OAuth tokens.\n */\nasync function handlePubSubPush(\n  message: { message: { data: string; messageId: string; publishTime: string }; subscription: string },\n  tenantId: string\n) {\n  // Decode the base64 data field\n  let decoded: { emailAddress?: string; historyId?: number };\n  try {\n    const raw = Buffer.from(message.message.data, \"base64\").toString(\"utf-8\");\n    decoded = JSON.parse(raw);\n  } catch {\n    return NextResponse.json(\n      { error: \"Invalid Pub/Sub message data\" },\n      { status: 400 }\n    );\n  }\n\n  if (!decoded.emailAddress || !decoded.historyId) {\n    return NextResponse.json(\n      { error: \"Missing emailAddress or historyId in Pub/Sub data\" },\n      { status: 400 }\n    );\n  }\n\n  console.log(\n    `[Gmail Pub/Sub] Tenant ${tenantId}: notification for ${decoded.emailAddress}, historyId=${decoded.historyId}`\n  );\n\n  // Attempt to fetch and store emails via Gmail API\n  try {\n    const result = await processGmailNotification(\n      tenantId,\n      decoded.historyId\n    );\n\n    if (result.emails && result.emails.length > 0) {\n      let stored = 0;\n      for (const emailData of result.emails) {\n        try {\n          await insertGmailEmail(emailData);\n          stored++;\n        } catch (err) {\n          // Skip duplicates silently\n          if (\n            err instanceof Error &&\n            err.message.includes(\"duplicate key value\")\n          ) {\n            continue;\n          }\n          console.error(\n            `[Gmail Pub/Sub] Failed to store email ${emailData.gmail_message_id}:`,\n            err\n          );\n        }\n      }\n\n      return NextResponse.json(\n        {\n          message: \"Emails fetched and stored\",\n          emailAddress: decoded.emailAddress,\n          processed: result.processed,\n          stored,\n        },\n        { status: 200 }\n      );\n    }\n\n    return NextResponse.json(\n      {\n        message: \"Notification processed, no new emails\",\n        emailAddress: decoded.emailAddress,\n        historyId: decoded.historyId,\n      },\n      { status: 200 }\n    );\n  } catch (err) {\n    // If no active watch subscription, acknowledge anyway to prevent\n    // Pub/Sub retries — the tenant needs to set up OAuth first\n    console.warn(\n      `[Gmail Pub/Sub] Could not process notification for tenant ${tenantId}:`,\n      err instanceof Error ? err.message : err\n    );\n\n    return NextResponse.json(\n      {\n        message: \"Notification acknowledged (watch not configured)\",\n        emailAddress: decoded.emailAddress,\n        historyId: decoded.historyId,\n      },\n      { status: 200 }\n    );\n  }\n}"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Add gmail_watch_subscriptions table to Drizzle schema",
      "status": "completed",
      "activeForm": "Adding gmail_watch_subscriptions table to schema"
    },
    {
      "content": "Create lib/gmail/watch.ts with watch management functions",
      "status": "completed",
      "activeForm": "Creating Gmail watch management functions"
    },
    {
      "content": "Create API routes for Gmail watch setup/renew/stop",
      "status": "completed",
      "activeForm": "Creating Gmail watch API routes"
    },
    {
      "content": "Update Pub/Sub webhook handler to fetch emails via Gmail API",
      "status": "completed",
      "activeForm": "Updating Pub/Sub webhook handler"
    },
    {
      "content": "Add Gmail OAuth config and env vars",
      "status": "in_progress",
      "activeForm": "Adding Gmail OAuth configuration"
    },
    {
      "content": "Update IntegrationsClient.tsx with watch management UI",
      "status": "pending",
      "activeForm": "Updating integrations UI with watch management"
    },
    {
      "content": "Generate Drizzle migration",
      "status": "pending",
      "activeForm": "Generating Drizzle migration"
    },
    {
      "content": "Verify build compiles cleanly",
      "status": "pending",
      "activeForm": "Verifying build compiles cleanly"
    }
  ]
}
Now let me add the necessary env var placeholders to `.env.local`.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\.env.local",
  "old_string": "# Anthropic API Key for Claude-powered search",
  "new_string": "# Gmail Watch - Google OAuth credentials (for Pub/Sub full integration)\n# Create these at Google Cloud Console > APIs & Services > Credentials > OAuth 2.0 Client IDs\nGOOGLE_CLIENT_ID=\nGOOGLE_CLIENT_SECRET=\n\n# Gmail Webhook Secret - authenticates incoming Pub/Sub and Apps Script requests\nGMAIL_WEBHOOK_SECRET=\n\n# Anthropic API Key for Claude-powered search"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Add gmail_watch_subscriptions table to Drizzle schema",
      "status": "completed",
      "activeForm": "Adding gmail_watch_subscriptions table to schema"
    },
    {
      "content": "Create lib/gmail/watch.ts with watch management functions",
      "status": "completed",
      "activeForm": "Creating Gmail watch management functions"
    },
    {
      "content": "Create API routes for Gmail watch setup/renew/stop",
      "status": "completed",
      "activeForm": "Creating Gmail watch API routes"
    },
    {
      "content": "Update Pub/Sub webhook handler to fetch emails via Gmail API",
      "status": "completed",
      "activeForm": "Updating Pub/Sub webhook handler"
    },
    {
      "content": "Add Gmail OAuth config and env vars",
      "status": "completed",
      "activeForm": "Adding Gmail OAuth configuration"
    },
    {
      "content": "Update IntegrationsClient.tsx with watch management UI",
      "status": "in_progress",
      "activeForm": "Updating integrations UI with watch management"
    },
    {
      "content": "Generate Drizzle migration",
      "status": "pending",
      "activeForm": "Generating Drizzle migration"
    },
    {
      "content": "Verify build compiles cleanly",
      "status": "pending",
      "activeForm": "Verifying build compiles cleanly"
    }
  ]
}
Now let me update the IntegrationsClient.tsx to add watch management UI in the Gmail tab. I'll add a "Watch Status" section that shows the current watch state and provides setup/renew/stop controls. Let me read the exact area I need to modify.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "offset": 1,
  "limit": 5
}
I need to add a `GmailWatchManager` component similar to `WebhookSecretManager`, and insert it into the Gmail tab section. Let me add the component after the `WebhookSecretManager` component and before the `IntegrationsClient` function.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "old_string": "export function IntegrationsClient({ tenantId }: { tenantId: string }) {",
  "new_string": "interface WatchStatus {\n  active: boolean;\n  watch: {\n    id: string;\n    emailAddress: string;\n    historyId: string | null;\n    expiration: string | null;\n    topicName: string;\n    createdAt: string;\n    updatedAt: string;\n  } | null;\n}\n\nfunction GmailWatchManager() {\n  const [status, setStatus] = useState<WatchStatus | null>(null);\n  const [loading, setLoading] = useState(true);\n  const [actionLoading, setActionLoading] = useState<string | null>(null);\n  const [error, setError] = useState<string | null>(null);\n  const [success, setSuccess] = useState<string | null>(null);\n\n  // Setup form state\n  const [showSetup, setShowSetup] = useState(false);\n  const [setupForm, setSetupForm] = useState({\n    emailAddress: \"\",\n    topicName: \"\",\n    accessToken: \"\",\n    refreshToken: \"\",\n  });\n\n  const fetchStatus = useCallback(async () => {\n    try {\n      setLoading(true);\n      setError(null);\n      const res = await fetch(\"/api/gmail/watch\");\n      if (!res.ok) throw new Error(\"Failed to fetch\");\n      const data = await res.json();\n      setStatus(data);\n    } catch {\n      setError(\"Failed to load watch status\");\n    } finally {\n      setLoading(false);\n    }\n  }, []);\n\n  useEffect(() => {\n    fetchStatus();\n  }, [fetchStatus]);\n\n  const handleSetup = async () => {\n    if (!setupForm.emailAddress || !setupForm.topicName || !setupForm.accessToken || !setupForm.refreshToken) {\n      setError(\"All fields are required\");\n      return;\n    }\n    setActionLoading(\"setup\");\n    setError(null);\n    setSuccess(null);\n    try {\n      const res = await fetch(\"/api/gmail/watch\", {\n        method: \"POST\",\n        headers: { \"Content-Type\": \"application/json\" },\n        body: JSON.stringify(setupForm),\n      });\n      if (!res.ok) {\n        const data = await res.json();\n        throw new Error(data.details || data.error || \"Setup failed\");\n      }\n      setSuccess(\"Gmail watch created successfully\");\n      setShowSetup(false);\n      setSetupForm({ emailAddress: \"\", topicName: \"\", accessToken: \"\", refreshToken: \"\" });\n      setTimeout(() => setSuccess(null), 5000);\n      await fetchStatus();\n    } catch (err) {\n      setError(err instanceof Error ? err.message : \"Failed to set up watch\");\n    } finally {\n      setActionLoading(null);\n    }\n  };\n\n  const handleRenew = async () => {\n    setActionLoading(\"renew\");\n    setError(null);\n    setSuccess(null);\n    try {\n      const res = await fetch(\"/api/gmail/watch\", { method: \"PUT\" });\n      if (!res.ok) {\n        const data = await res.json();\n        throw new Error(data.details || data.error || \"Renewal failed\");\n      }\n      setSuccess(\"Gmail watch renewed successfully\");\n      setTimeout(() => setSuccess(null), 5000);\n      await fetchStatus();\n    } catch (err) {\n      setError(err instanceof Error ? err.message : \"Failed to renew watch\");\n    } finally {\n      setActionLoading(null);\n    }\n  };\n\n  const handleStop = async () => {\n    setActionLoading(\"stop\");\n    setError(null);\n    setSuccess(null);\n    try {\n      const res = await fetch(\"/api/gmail/watch\", { method: \"DELETE\" });\n      if (!res.ok) {\n        const data = await res.json();\n        throw new Error(data.details || data.error || \"Stop failed\");\n      }\n      setSuccess(\"Gmail watch stopped\");\n      setTimeout(() => setSuccess(null), 5000);\n      await fetchStatus();\n    } catch (err) {\n      setError(err instanceof Error ? err.message : \"Failed to stop watch\");\n    } finally {\n      setActionLoading(null);\n    }\n  };\n\n  const isExpiringSoon = status?.watch?.expiration\n    ? new Date(status.watch.expiration).getTime() - Date.now() < 24 * 60 * 60 * 1000\n    : false;\n\n  const isExpired = status?.watch?.expiration\n    ? new Date(status.watch.expiration).getTime() < Date.now()\n    : false;\n\n  return (\n    <div>\n      <h3 className=\"text-sm font-semibold text-[var(--foreground)] mb-2\">\n        Gmail Watch Status\n      </h3>\n      <p className=\"text-sm text-[var(--muted-foreground)] mb-3\">\n        The Gmail Watch monitors your inbox via Pub/Sub and automatically\n        fetches new emails. Watch subscriptions expire after 7 days and must\n        be renewed.\n      </p>\n\n      {error && (\n        <div className=\"mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-600\">\n          {error}\n        </div>\n      )}\n      {success && (\n        <div className=\"mb-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-green-600\">\n          {success}\n        </div>\n      )}\n\n      {loading ? (\n        <div className=\"p-4 rounded-lg bg-[var(--secondary)] border border-[var(--border)] text-sm text-[var(--muted-foreground)]\">\n          Loading...\n        </div>\n      ) : status?.active && status.watch ? (\n        <div className=\"space-y-4\">\n          {/* Active watch display */}\n          <div className=\"p-4 rounded-lg border border-[var(--border)] bg-[var(--secondary)]\">\n            <div className=\"flex items-center gap-2 mb-3\">\n              <div className={`w-2.5 h-2.5 rounded-full ${isExpired ? \"bg-red-500\" : isExpiringSoon ? \"bg-amber-500\" : \"bg-green-500\"}`} />\n              <span className=\"text-sm font-medium text-[var(--foreground)]\">\n                {isExpired ? \"Watch Expired\" : isExpiringSoon ? \"Watch Expiring Soon\" : \"Watch Active\"}\n              </span>\n            </div>\n            <div className=\"grid grid-cols-2 gap-3 text-sm\">\n              <div>\n                <span className=\"text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider\">\n                  Email\n                </span>\n                <p className=\"text-[var(--foreground)] mt-0.5\">{status.watch.emailAddress}</p>\n              </div>\n              <div>\n                <span className=\"text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider\">\n                  Topic\n                </span>\n                <p className=\"text-[var(--foreground)] mt-0.5 break-all\">{status.watch.topicName}</p>\n              </div>\n              <div>\n                <span className=\"text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider\">\n                  History ID\n                </span>\n                <p className=\"text-[var(--foreground)] mt-0.5 font-mono\">{status.watch.historyId ?? \"—\"}</p>\n              </div>\n              <div>\n                <span className=\"text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider\">\n                  Expires\n                </span>\n                <p className={`mt-0.5 ${isExpired ? \"text-red-600 font-medium\" : isExpiringSoon ? \"text-amber-600 font-medium\" : \"text-[var(--foreground)]\"}`}>\n                  {status.watch.expiration\n                    ? new Date(status.watch.expiration).toLocaleString()\n                    : \"—\"}\n                </p>\n              </div>\n            </div>\n          </div>\n\n          {(isExpiringSoon || isExpired) && (\n            <div className={`p-3 rounded-lg text-sm ${isExpired ? \"bg-red-500/10 border border-red-500/20 text-red-600\" : \"bg-amber-500/10 border border-amber-500/20 text-amber-700\"}`}>\n              {isExpired\n                ? \"Your watch subscription has expired. Pub/Sub notifications are no longer being delivered. Renew now to resume email ingestion.\"\n                : \"Your watch subscription expires within 24 hours. Renew it to prevent interruption.\"}\n            </div>\n          )}\n\n          <div className=\"flex gap-2\">\n            <button\n              onClick={handleRenew}\n              disabled={actionLoading !== null}\n              className=\"px-4 py-2 text-sm font-medium rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50\"\n            >\n              {actionLoading === \"renew\" ? \"Renewing...\" : \"Renew Watch\"}\n            </button>\n            <button\n              onClick={handleStop}\n              disabled={actionLoading !== null}\n              className=\"px-4 py-2 text-sm font-medium rounded-md border border-red-500/30 text-red-600 hover:bg-red-500/10 transition-colors disabled:opacity-50\"\n            >\n              {actionLoading === \"stop\" ? \"Stopping...\" : \"Stop Watch\"}\n            </button>\n          </div>\n        </div>\n      ) : (\n        <div className=\"space-y-4\">\n          <div className=\"p-4 rounded-lg border border-[var(--border)] bg-[var(--secondary)]\">\n            <div className=\"flex items-center gap-2 mb-2\">\n              <div className=\"w-2.5 h-2.5 rounded-full bg-gray-400\" />\n              <span className=\"text-sm font-medium text-[var(--muted-foreground)]\">\n                No Active Watch\n              </span>\n            </div>\n            <p className=\"text-sm text-[var(--muted-foreground)]\">\n              Set up a Gmail watch to start receiving real-time email\n              notifications via Pub/Sub. You&apos;ll need OAuth tokens from\n              a Google Cloud project with the Gmail API enabled.\n            </p>\n          </div>\n\n          {!showSetup ? (\n            <button\n              onClick={() => setShowSetup(true)}\n              className=\"px-4 py-2 text-sm font-medium rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity\"\n            >\n              Set Up Gmail Watch\n            </button>\n          ) : (\n            <div className=\"space-y-3 p-4 rounded-lg border border-[var(--border)] bg-[var(--card)]\">\n              <h4 className=\"text-sm font-semibold text-[var(--foreground)]\">\n                Configure Gmail Watch\n              </h4>\n              <p className=\"text-xs text-[var(--muted-foreground)]\">\n                Provide your Gmail address, Google Cloud Pub/Sub topic name, and\n                OAuth tokens obtained from the Google OAuth consent flow with the{\" \"}\n                <code className=\"px-1 py-0.5 rounded bg-[var(--secondary)] text-xs\">gmail.readonly</code>{\" \"}\n                scope.\n              </p>\n              <div>\n                <label className=\"text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider\">\n                  Gmail Address\n                </label>\n                <input\n                  type=\"email\"\n                  value={setupForm.emailAddress}\n                  onChange={(e) => setSetupForm({ ...setupForm, emailAddress: e.target.value })}\n                  placeholder=\"user@gmail.com\"\n                  className=\"mt-1 w-full px-3 py-2 text-sm rounded-md border border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]\"\n                />\n              </div>\n              <div>\n                <label className=\"text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider\">\n                  Pub/Sub Topic Name\n                </label>\n                <input\n                  type=\"text\"\n                  value={setupForm.topicName}\n                  onChange={(e) => setSetupForm({ ...setupForm, topicName: e.target.value })}\n                  placeholder=\"projects/my-project/topics/gmail-inbound\"\n                  className=\"mt-1 w-full px-3 py-2 text-sm rounded-md border border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]\"\n                />\n              </div>\n              <div>\n                <label className=\"text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider\">\n                  Access Token\n                </label>\n                <input\n                  type=\"password\"\n                  value={setupForm.accessToken}\n                  onChange={(e) => setSetupForm({ ...setupForm, accessToken: e.target.value })}\n                  placeholder=\"ya29.a0...\"\n                  className=\"mt-1 w-full px-3 py-2 text-sm rounded-md border border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]\"\n                />\n              </div>\n              <div>\n                <label className=\"text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider\">\n                  Refresh Token\n                </label>\n                <input\n                  type=\"password\"\n                  value={setupForm.refreshToken}\n                  onChange={(e) => setSetupForm({ ...setupForm, refreshToken: e.target.value })}\n                  placeholder=\"1//0e...\"\n                  className=\"mt-1 w-full px-3 py-2 text-sm rounded-md border border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]\"\n                />\n              </div>\n              <div className=\"flex gap-2 pt-1\">\n                <button\n                  onClick={handleSetup}\n                  disabled={actionLoading !== null}\n                  className=\"px-4 py-2 text-sm font-medium rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50\"\n                >\n                  {actionLoading === \"setup\" ? \"Creating...\" : \"Create Watch\"}\n                </button>\n                <button\n                  onClick={() => setShowSetup(false)}\n                  className=\"px-4 py-2 text-sm font-medium rounded-md border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors\"\n                >\n                  Cancel\n                </button>\n              </div>\n            </div>\n          )}\n        </div>\n      )}\n    </div>\n  );\n}\n\nexport function IntegrationsClient({ tenantId }: { tenantId: string }) {"
}
Now I need to add the `GmailWatchManager` component into the Gmail tab section. Let me place it after the Authentication section and before Setup Option A.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "old_string": "              {/* Setup Option A */}\n              <div>\n                <div className=\"flex items-center gap-2 mb-4\">\n                  <span className=\"px-2.5 py-1 text-xs font-semibold rounded-full bg-green-500/10 text-green-600 border border-green-500/20\">\n                    Recommended\n                  </span>\n                  <h3 className=\"text-sm font-semibold text-[var(--foreground)]\">\n                    Setup Option A &mdash; Full Integration (Pub/Sub)\n                  </h3>\n                </div>",
  "new_string": "              {/* Gmail Watch Manager */}\n              <GmailWatchManager />\n\n              {/* Setup Option A */}\n              <div>\n                <div className=\"flex items-center gap-2 mb-4\">\n                  <span className=\"px-2.5 py-1 text-xs font-semibold rounded-full bg-green-500/10 text-green-600 border border-green-500/20\">\n                    Recommended\n                  </span>\n                  <h3 className=\"text-sm font-semibold text-[var(--foreground)]\">\n                    Setup Option A &mdash; Full Integration (Pub/Sub)\n                  </h3>\n                </div>"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Add gmail_watch_subscriptions table to Drizzle schema",
      "status": "completed",
      "activeForm": "Adding gmail_watch_subscriptions table to schema"
    },
    {
      "content": "Create lib/gmail/watch.ts with watch management functions",
      "status": "completed",
      "activeForm": "Creating Gmail watch management functions"
    },
    {
      "content": "Create API routes for Gmail watch setup/renew/stop",
      "status": "completed",
      "activeForm": "Creating Gmail watch API routes"
    },
    {
      "content": "Update Pub/Sub webhook handler to fetch emails via Gmail API",
      "status": "completed",
      "activeForm": "Updating Pub/Sub webhook handler"
    },
    {
      "content": "Add Gmail OAuth config and env vars",
      "status": "completed",
      "activeForm": "Adding Gmail OAuth configuration"
    },
    {
      "content": "Update IntegrationsClient.tsx with watch management UI",
      "status": "completed",
      "activeForm": "Updating integrations UI with watch management"
    },
    {
      "content": "Generate Drizzle migration",
      "status": "in_progress",
      "activeForm": "Generating Drizzle migration"
    },
    {
      "content": "Verify build compiles cleanly",
      "status": "pending",
      "activeForm": "Verifying build compiles cleanly"
    }
  ]
}
Now let me first check if TypeScript compiles, then generate the migration.

🔧 Tool: Bash
Input: {
  "command": "cd /c/Code/Krisp && npx tsc --noEmit 2>&1 | head -60",
  "description": "TypeScript type check",
  "timeout": 120000
}
TypeScript compiles cleanly. Now let me clean up the existing generated migration (which was from the previous agent's work and doesn't include the new table) and regenerate.

🔧 Tool: Bash
Input: {
  "command": "cd /c/Code/Krisp && npx drizzle-kit generate 2>&1 | head -30",
  "description": "Generate Drizzle migration for gmail_watch_subscriptions",
  "timeout": 30000
}

🔧 Tool: Glob
Input: {
  "pattern": "drizzle/migrations/*.sql",
  "path": "C:\\Code\\Krisp"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\drizzle\\migrations\\0002_smart_ares.sql"
}
The migration includes the `gmail_watch_subscriptions` table with all the correct columns, foreign keys, and indexes. Now let me verify the build.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Add gmail_watch_subscriptions table to Drizzle schema",
      "status": "completed",
      "activeForm": "Adding gmail_watch_subscriptions table to schema"
    },
    {
      "content": "Create lib/gmail/watch.ts with watch management functions",
      "status": "completed",
      "activeForm": "Creating Gmail watch management functions"
    },
    {
      "content": "Create API routes for Gmail watch setup/renew/stop",
      "status": "completed",
      "activeForm": "Creating Gmail watch API routes"
    },
    {
      "content": "Update Pub/Sub webhook handler to fetch emails via Gmail API",
      "status": "completed",
      "activeForm": "Updating Pub/Sub webhook handler"
    },
    {
      "content": "Add Gmail OAuth config and env vars",
      "status": "completed",
      "activeForm": "Adding Gmail OAuth configuration"
    },
    {
      "content": "Update IntegrationsClient.tsx with watch management UI",
      "status": "completed",
      "activeForm": "Updating integrations UI with watch management"
    },
    {
      "content": "Generate Drizzle migration",
      "status": "completed",
      "activeForm": "Generating Drizzle migration"
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
  "command": "cd /c/Code/Krisp && npx next build 2>&1 | tail -50",
  "description": "Next.js build check",
  "timeout": 180000
}
Build succeeds. The new `api/gmail/watch` route is visible in the build output. Let me mark the final task as complete.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Add gmail_watch_subscriptions table to Drizzle schema",
      "status": "completed",
      "activeForm": "Adding gmail_watch_subscriptions table to schema"
    },
    {
      "content": "Create lib/gmail/watch.ts with watch management functions",
      "status": "completed",
      "activeForm": "Creating Gmail watch management functions"
    },
    {
      "content": "Create API routes for Gmail watch setup/renew/stop",
      "status": "completed",
      "activeForm": "Creating Gmail watch API routes"
    },
    {
      "content": "Update Pub/Sub webhook handler to fetch emails via Gmail API",
      "status": "completed",
      "activeForm": "Updating Pub/Sub webhook handler"
    },
    {
      "content": "Add Gmail OAuth config and env vars",
      "status": "completed",
      "activeForm": "Adding Gmail OAuth configuration"
    },
    {
      "content": "Update IntegrationsClient.tsx with watch management UI",
      "status": "completed",
      "activeForm": "Updating integrations UI with watch management"
    },
    {
      "content": "Generate Drizzle migration",
      "status": "completed",
      "activeForm": "Generating Drizzle migration"
    },
    {
      "content": "Verify build compiles cleanly",
      "status": "completed",
      "activeForm": "Verifying build compiles cleanly"
    }
  ]
}
All tasks complete. Here's a summary of what was implemented:

## Summary: Gmail Watch Setup

### New Files
- **`lib/gmail/watch.ts`** — Full Gmail Watch lifecycle management:
  - OAuth token refresh via `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`
  - `createGmailWatch()` — calls `POST gmail/v1/users/me/watch` with topic and label filters
  - `stopGmailWatch()` — calls `POST gmail/v1/users/me/stop`
  - `fetchHistorySince()` — pages through `history.list` to get new message IDs since a given historyId
  - `fetchGmailMessage()` — fetches full message payload via `messages.get`
  - `extractBodies()` — decodes base64url body parts (handles simple, multipart, and nested multipart/alternative)
  - `extractAttachments()` — extracts attachment metadata (name, MIME type, size, attachmentId)
  - `processGmailNotification()` — end-to-end: gets active watch → refreshes token → fetches history → fetches messages → returns parsed emails
  - `setupGmailWatch()`, `renewGmailWatch()`, `getExpiringWatches()` — database + API lifecycle
  - `upsertGmailWatch()`, `getActiveWatch()`, `updateWatchHistoryId()`, `deactivateWatch()` — CRUD

- **`app/api/gmail/watch/route.ts`** — REST API for watch management:
  - `GET` — returns current watch status (active/expired/expiring)
  - `POST` — creates a new watch (accepts email, topic, access/refresh tokens)
  - `PUT` — renews an existing watch (refreshes token, re-calls Watch API)
  - `DELETE` — stops watch on Google's side + deactivates locally

### Modified Files
- **`lib/db/schema.ts`** — Added `gmail_watch_subscriptions` table with columns for `email_address`, `history_id`, `expiration`, `topic_name`, `access_token`, `refresh_token`, `token_expiry`, `active`, and indexes on `(tenant_id, email_address)` unique, `tenant_id`, and `expiration`

- **`app/api/webhooks/email/gmail/[tenantId]/route.ts`** — Updated `handlePubSubPush` from a stub to a full implementation that calls `processGmailNotification()` to fetch and store emails via the Gmail API when an active watch exists. Falls back gracefully to acknowledging notifications when no watch is configured.

- **`app/(app)/admin/integrations/IntegrationsClient.tsx`** — Added `GmailWatchManager` component in the Gmail tab showing:
  - Active/expired/expiring status with color-coded indicator
  - Watch details (email, topic, historyId, expiration)
  - Expiration warnings (amber for <24h, red for expired)
  - Renew/Stop buttons
  - Setup form (email, topic name, access token, refresh token) when no watch exists

- **`.env.local`** — Added `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GMAIL_WEBHOOK_SECRET` placeholders

### New Migration
- **`drizzle/migrations/0002_smart_ares.sql`** — Creates `gmail_watch_subscriptions` table with all constraints and indexes

### How It Works End-to-End
1. User goes to `/admin/integrations` → Gmail tab → clicks "Set Up Gmail Watch"
2. Fills in their Gmail address, Pub/Sub topic, and OAuth tokens from Google Cloud Console
3. Backend calls `POST gmail/v1/users/me/watch` → stores the subscription with `historyId` and `expiration`
4. When a new email arrives, Gmail publishes to Pub/Sub → Pub/Sub pushes to `/api/webhooks/email/gmail/[tenantId]`
5. The webhook handler decodes the Pub/Sub message → calls `processGmailNotification()` → which refreshes the OAuth token → calls `history.list` → `messages.get` → parses headers/body/attachments → inserts into `gmail_emails`
6. Watch must be renewed every 7 days — the UI shows warnings and a "Renew Watch" button; `getExpiringWatches()` is available for a cron job