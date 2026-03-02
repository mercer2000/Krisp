

Let me start by understanding the current state of the codebase after the previous implementation work.

🔧 Tool: Task
Input: {
  "description": "Explore current Graph implementation",
  "subagent_type": "Explore",
  "prompt": "Explore the current state of the Microsoft Graph integration in C:\\Code\\Krisp. I need to understand what has already been implemented from the plan above and what the current code looks like. Check:\n\n1. Read lib/db/schema.ts - look for graphCredentials table and graphSubscriptions table\n2. Read lib/graph/token.ts if it exists\n3. Read lib/graph/credentials.ts if it exists\n4. Read lib/graph/messages.ts if it exists\n5. Read app/api/graph/credentials/route.ts if it exists\n6. Read app/api/graph/subscriptions/route.ts\n7. Read app/api/webhooks/email/graph/[tenantId]/route.ts\n8. Read lib/graph/subscriptions.ts\n9. Read lib/email/emails.ts\n10. Read app/(app)/admin/integrations/IntegrationsClient.tsx (full file - it's large)\n11. List all files in lib/graph/\n12. Check if there are any Drizzle migrations related to graph_credentials\n\nThe key question: Has the plan been implemented already, or is the codebase still in the \"manual access token paste\" state? I need to know the exact current state before adding multi-connection support.\n\nWorking directory: C:\\Code\\Krisp"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\db\\schema.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "lib/graph/**/*.ts",
  "path": "C:\\Code\\Krisp"
}

🔧 Tool: Glob
Input: {
  "pattern": "app/api/graph/**/*.ts",
  "path": "C:\\Code\\Krisp"
}

🔧 Tool: Glob
Input: {
  "pattern": "app/api/webhooks/email/**/*.ts",
  "path": "C:\\Code\\Krisp"
}

🔧 Tool: Bash
Input: {
  "command": "find \"C:\\Code\\Krisp\" -name \"*migration*\" -o -name \"*graph*\" | grep -E \"(migrations|drizzle)\" | head -20"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\graph\\credentials.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\graph\\subscriptions.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\graph\\credentials\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\graph\\subscriptions\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\webhooks\\email\\graph\\[tenantId]\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\drizzle\\migrations\\0003_add_graph_credentials.sql"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\email\\emails.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "limit": 200
}

🔧 Tool: Grep
Input: {
  "pattern": "Graph|credentials|subscription",
  "path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "output_mode": "content",
  "context": 5
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "offset": 200,
  "limit": 300
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "offset": 500,
  "limit": 250
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "offset": 800,
  "limit": 200
}

🔧 Tool: Bash
Input: {
  "command": "grep -n \"export default\\|return (\" \"C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx\" | tail -50"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "offset": 1050,
  "limit": 350
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "offset": 1399,
  "limit": 300
}
Good. The plan has already been implemented. The codebase has working Client Credentials flow with one credential set per user. Now I need to add support for **multiple Graph connections** (multiple email accounts per user). Let me read the key files to understand the exact current state.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\db\\schema.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\graph\\credentials.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\graph\\subscriptions.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\graph\\credentials\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\graph\\subscriptions\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\webhooks\\email\\graph\\[tenantId]\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\email\\emails.ts"
}
Now let me read the IntegrationsClient.tsx in chunks to understand the UI.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "offset": 1,
  "limit": 100
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "offset": 100,
  "limit": 100
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "offset": 200,
  "limit": 100
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "offset": 300,
  "limit": 100
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "offset": 400,
  "limit": 100
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "offset": 500,
  "limit": 100
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "offset": 600,
  "limit": 100
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "offset": 700,
  "limit": 100
}
Let me continue reading the rest of the file.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "offset": 800,
  "limit": 200
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "offset": 1000,
  "limit": 200
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "offset": 1200,
  "limit": 200
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "offset": 1400,
  "limit": 200
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "offset": 1600,
  "limit": 300
}
Now I have a thorough understanding of the full codebase. Let me plan the multi-connection implementation.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Update DB schema: remove unique constraint on graphCredentials.tenantId, add label/name column",
      "status": "pending",
      "activeForm": "Updating DB schema for multiple credentials per tenant"
    },
    {
      "content": "Update lib/graph/credentials.ts for multi-credential CRUD operations",
      "status": "pending",
      "activeForm": "Updating credentials library for multi-credential support"
    },
    {
      "content": "Add credentialId column to graphSubscriptions table",
      "status": "pending",
      "activeForm": "Adding credentialId FK to graphSubscriptions"
    },
    {
      "content": "Update lib/graph/subscriptions.ts to link subscriptions to credentials",
      "status": "pending",
      "activeForm": "Updating subscriptions library for credential linking"
    },
    {
      "content": "Update /api/graph/credentials route for multi-credential CRUD",
      "status": "pending",
      "activeForm": "Updating credentials API route"
    },
    {
      "content": "Update /api/graph/subscriptions route to use credentialId",
      "status": "pending",
      "activeForm": "Updating subscriptions API route"
    },
    {
      "content": "Update webhook handler to look up credential via subscription",
      "status": "pending",
      "activeForm": "Updating webhook handler for credential lookup"
    },
    {
      "content": "Update IntegrationsClient.tsx UI for managing multiple connections",
      "status": "pending",
      "activeForm": "Updating admin UI for multiple Graph connections"
    },
    {
      "content": "Generate Drizzle migration and verify TypeScript compilation",
      "status": "pending",
      "activeForm": "Generating migration and verifying types"
    }
  ]
}
Now let me start implementing. The key changes to support multiple Graph connections:

1. **`graphCredentials`**: Remove unique constraint on `tenantId` (currently `uq_graph_credentials_tenant`), add a `label` column for display name
2. **`graphSubscriptions`**: Add `credentialId` FK pointing to `graphCredentials.id`
3. **API routes**: Update to accept/return credential IDs, support multiple credentials
4. **UI**: List of credentials with add/remove, link subscriptions to specific credentials

Let me start with the schema and library changes.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Update DB schema: remove unique constraint on graphCredentials.tenantId, add label/name column",
      "status": "in_progress",
      "activeForm": "Updating DB schema for multiple credentials per tenant"
    },
    {
      "content": "Update lib/graph/credentials.ts for multi-credential CRUD operations",
      "status": "pending",
      "activeForm": "Updating credentials library for multi-credential support"
    },
    {
      "content": "Add credentialId column to graphSubscriptions table",
      "status": "pending",
      "activeForm": "Adding credentialId FK to graphSubscriptions"
    },
    {
      "content": "Update lib/graph/subscriptions.ts to link subscriptions to credentials",
      "status": "pending",
      "activeForm": "Updating subscriptions library for credential linking"
    },
    {
      "content": "Update /api/graph/credentials route for multi-credential CRUD",
      "status": "pending",
      "activeForm": "Updating credentials API route"
    },
    {
      "content": "Update /api/graph/subscriptions route to use credentialId",
      "status": "pending",
      "activeForm": "Updating subscriptions API route"
    },
    {
      "content": "Update webhook handler to look up credential via subscription",
      "status": "pending",
      "activeForm": "Updating webhook handler for credential lookup"
    },
    {
      "content": "Update IntegrationsClient.tsx UI for managing multiple connections",
      "status": "pending",
      "activeForm": "Updating admin UI for multiple Graph connections"
    },
    {
      "content": "Generate Drizzle migration and verify TypeScript compilation",
      "status": "pending",
      "activeForm": "Generating migration and verifying types"
    }
  ]
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\lib\\db\\schema.ts",
  "old_string": "// ── Graph Credentials (Azure AD App Registration) ────\nexport const graphCredentials = pgTable(\n  \"graph_credentials\",\n  {\n    id: uuid(\"id\").defaultRandom().primaryKey(),\n    tenantId: uuid(\"tenant_id\")\n      .notNull()\n      .references(() => users.id, { onDelete: \"cascade\" }),\n    azureTenantId: varchar(\"azure_tenant_id\", { length: 255 }).notNull(),\n    clientId: varchar(\"client_id\", { length: 255 }).notNull(),\n    clientSecret: text(\"client_secret\").notNull(),\n    createdAt: timestamp(\"created_at\", { withTimezone: true })\n      .defaultNow()\n      .notNull(),\n    updatedAt: timestamp(\"updated_at\", { withTimezone: true })\n      .defaultNow()\n      .notNull(),\n  },\n  (table) => [\n    uniqueIndex(\"uq_graph_credentials_tenant\").on(table.tenantId),\n  ]\n);",
  "new_string": "// ── Graph Credentials (Azure AD App Registration) ────\nexport const graphCredentials = pgTable(\n  \"graph_credentials\",\n  {\n    id: uuid(\"id\").defaultRandom().primaryKey(),\n    tenantId: uuid(\"tenant_id\")\n      .notNull()\n      .references(() => users.id, { onDelete: \"cascade\" }),\n    label: varchar(\"label\", { length: 255 }).notNull().default(\"Default\"),\n    azureTenantId: varchar(\"azure_tenant_id\", { length: 255 }).notNull(),\n    clientId: varchar(\"client_id\", { length: 255 }).notNull(),\n    clientSecret: text(\"client_secret\").notNull(),\n    createdAt: timestamp(\"created_at\", { withTimezone: true })\n      .defaultNow()\n      .notNull(),\n    updatedAt: timestamp(\"updated_at\", { withTimezone: true })\n      .defaultNow()\n      .notNull(),\n  },\n  (table) => [\n    index(\"idx_graph_credentials_tenant\").on(table.tenantId),\n  ]\n);"
}
Now add `credentialId` to `graphSubscriptions`:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\lib\\db\\schema.ts",
  "old_string": "// ── Graph Subscriptions (Microsoft Graph API) ────────\nexport const graphSubscriptions = pgTable(\n  \"graph_subscriptions\",\n  {\n    id: uuid(\"id\").defaultRandom().primaryKey(),\n    tenantId: uuid(\"tenant_id\")\n      .notNull()\n      .references(() => users.id, { onDelete: \"cascade\" }),\n    subscriptionId: varchar(\"subscription_id\", { length: 512 }).notNull(),\n    resource: varchar(\"resource\", { length: 512 }).notNull(),\n    changeType: varchar(\"change_type\", { length: 100 }).notNull(),\n    clientState: varchar(\"client_state\", { length: 255 }).notNull(),\n    expirationDateTime: timestamp(\"expiration_date_time\", {\n      withTimezone: true,\n    }).notNull(),\n    notificationUrl: text(\"notification_url\").notNull(),\n    active: boolean(\"active\").default(true).notNull(),\n    createdAt: timestamp(\"created_at\", { withTimezone: true })\n      .defaultNow()\n      .notNull(),\n    updatedAt: timestamp(\"updated_at\", { withTimezone: true })\n      .defaultNow()\n      .notNull(),\n  },\n  (table) => [\n    uniqueIndex(\"uq_graph_subscription_id\").on(table.subscriptionId),\n    index(\"idx_graph_subscriptions_tenant\").on(table.tenantId),\n    index(\"idx_graph_subscriptions_expiration\").on(table.expirationDateTime),\n  ]\n);",
  "new_string": "// ── Graph Subscriptions (Microsoft Graph API) ────────\nexport const graphSubscriptions = pgTable(\n  \"graph_subscriptions\",\n  {\n    id: uuid(\"id\").defaultRandom().primaryKey(),\n    tenantId: uuid(\"tenant_id\")\n      .notNull()\n      .references(() => users.id, { onDelete: \"cascade\" }),\n    credentialId: uuid(\"credential_id\").references(() => graphCredentials.id, {\n      onDelete: \"set null\",\n    }),\n    subscriptionId: varchar(\"subscription_id\", { length: 512 }).notNull(),\n    resource: varchar(\"resource\", { length: 512 }).notNull(),\n    changeType: varchar(\"change_type\", { length: 100 }).notNull(),\n    clientState: varchar(\"client_state\", { length: 255 }).notNull(),\n    expirationDateTime: timestamp(\"expiration_date_time\", {\n      withTimezone: true,\n    }).notNull(),\n    notificationUrl: text(\"notification_url\").notNull(),\n    active: boolean(\"active\").default(true).notNull(),\n    createdAt: timestamp(\"created_at\", { withTimezone: true })\n      .defaultNow()\n      .notNull(),\n    updatedAt: timestamp(\"updated_at\", { withTimezone: true })\n      .defaultNow()\n      .notNull(),\n  },\n  (table) => [\n    uniqueIndex(\"uq_graph_subscription_id\").on(table.subscriptionId),\n    index(\"idx_graph_subscriptions_tenant\").on(table.tenantId),\n    index(\"idx_graph_subscriptions_expiration\").on(table.expirationDateTime),\n    index(\"idx_graph_subscriptions_credential\").on(table.credentialId),\n  ]\n);"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Update DB schema: remove unique constraint on graphCredentials.tenantId, add label/name column",
      "status": "completed",
      "activeForm": "Updating DB schema for multiple credentials per tenant"
    },
    {
      "content": "Add credentialId column to graphSubscriptions table",
      "status": "completed",
      "activeForm": "Adding credentialId FK to graphSubscriptions"
    },
    {
      "content": "Update lib/graph/credentials.ts for multi-credential CRUD operations",
      "status": "in_progress",
      "activeForm": "Updating credentials library for multi-credential support"
    },
    {
      "content": "Update lib/graph/subscriptions.ts to link subscriptions to credentials",
      "status": "pending",
      "activeForm": "Updating subscriptions library for credential linking"
    },
    {
      "content": "Update /api/graph/credentials route for multi-credential CRUD",
      "status": "pending",
      "activeForm": "Updating credentials API route"
    },
    {
      "content": "Update /api/graph/subscriptions route to use credentialId",
      "status": "pending",
      "activeForm": "Updating subscriptions API route"
    },
    {
      "content": "Update webhook handler to look up credential via subscription",
      "status": "pending",
      "activeForm": "Updating webhook handler for credential lookup"
    },
    {
      "content": "Update IntegrationsClient.tsx UI for managing multiple connections",
      "status": "pending",
      "activeForm": "Updating admin UI for multiple Graph connections"
    },
    {
      "content": "Generate Drizzle migration and verify TypeScript compilation",
      "status": "pending",
      "activeForm": "Generating migration and verifying types"
    }
  ]
}
Now update `lib/graph/credentials.ts` — change from single-credential to multi-credential:

🔧 Tool: Write
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\graph\\credentials.ts",
  "content": "import { db } from \"@/lib/db\";\nimport { graphCredentials } from \"@/lib/db/schema\";\nimport { eq, and } from \"drizzle-orm\";\n\nexport interface GraphCredentialsInsert {\n  tenantId: string;\n  label: string;\n  azureTenantId: string;\n  clientId: string;\n  clientSecret: string;\n}\n\n/**\n * Create new Azure AD app credentials for a tenant.\n */\nexport async function createGraphCredentials(data: GraphCredentialsInsert) {\n  const [result] = await db\n    .insert(graphCredentials)\n    .values(data)\n    .returning();\n  return result;\n}\n\n/**\n * Update existing Azure AD app credentials.\n */\nexport async function updateGraphCredentials(\n  id: string,\n  tenantId: string,\n  data: Partial<Pick<GraphCredentialsInsert, \"label\" | \"azureTenantId\" | \"clientId\" | \"clientSecret\">>\n) {\n  const [result] = await db\n    .update(graphCredentials)\n    .set({ ...data, updatedAt: new Date() })\n    .where(\n      and(\n        eq(graphCredentials.id, id),\n        eq(graphCredentials.tenantId, tenantId)\n      )\n    )\n    .returning();\n  return result ?? null;\n}\n\n/**\n * Get all Azure AD credentials for a tenant.\n */\nexport async function getAllGraphCredentials(tenantId: string) {\n  return db\n    .select()\n    .from(graphCredentials)\n    .where(eq(graphCredentials.tenantId, tenantId));\n}\n\n/**\n * Get a specific credential by ID, scoped to tenant.\n */\nexport async function getGraphCredentialsById(id: string, tenantId: string) {\n  const [result] = await db\n    .select()\n    .from(graphCredentials)\n    .where(\n      and(\n        eq(graphCredentials.id, id),\n        eq(graphCredentials.tenantId, tenantId)\n      )\n    );\n  return result ?? null;\n}\n\n/**\n * Get a credential by ID (no tenant scoping — for webhook handler use).\n */\nexport async function getGraphCredentialsByIdUnsafe(id: string) {\n  const [result] = await db\n    .select()\n    .from(graphCredentials)\n    .where(eq(graphCredentials.id, id));\n  return result ?? null;\n}\n\n/**\n * Delete Azure AD credentials for a tenant.\n */\nexport async function deleteGraphCredentials(id: string, tenantId: string) {\n  await db\n    .delete(graphCredentials)\n    .where(\n      and(\n        eq(graphCredentials.id, id),\n        eq(graphCredentials.tenantId, tenantId)\n      )\n    );\n}\n\n/**\n * Obtain an access token from Azure AD using the client credentials flow.\n * Accepts the credential record directly to avoid extra DB lookups.\n */\nexport async function getGraphAccessTokenFromCreds(creds: {\n  azureTenantId: string;\n  clientId: string;\n  clientSecret: string;\n}): Promise<string> {\n  // Validate stored tenant ID format to prevent SSRF via URL injection\n  const guidRegex =\n    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;\n  if (!guidRegex.test(creds.azureTenantId)) {\n    throw new Error(\"Stored Azure Tenant ID is invalid. Please update your credentials.\");\n  }\n\n  const tokenUrl = `https://login.microsoftonline.com/${creds.azureTenantId}/oauth2/v2.0/token`;\n\n  const body = new URLSearchParams({\n    client_id: creds.clientId,\n    client_secret: creds.clientSecret,\n    scope: \"https://graph.microsoft.com/.default\",\n    grant_type: \"client_credentials\",\n  });\n\n  const response = await fetch(tokenUrl, {\n    method: \"POST\",\n    headers: { \"Content-Type\": \"application/x-www-form-urlencoded\" },\n    body: body.toString(),\n  });\n\n  if (!response.ok) {\n    const errorBody = await response.text();\n    let detail: string;\n    try {\n      const parsed = JSON.parse(errorBody);\n      detail = parsed.error_description || parsed.error || errorBody;\n    } catch {\n      detail = errorBody;\n    }\n    throw new Error(`Azure AD token request failed: ${detail}`);\n  }\n\n  const data = await response.json();\n  return data.access_token;\n}\n\n/**\n * Get an access token for a specific credential by ID (tenant-scoped).\n */\nexport async function getGraphAccessToken(credentialId: string, tenantId: string): Promise<string> {\n  const creds = await getGraphCredentialsById(credentialId, tenantId);\n  if (!creds) {\n    throw new Error(\"Credential not found. Set up your Azure AD app credentials first.\");\n  }\n  return getGraphAccessTokenFromCreds(creds);\n}\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Update DB schema: remove unique constraint on graphCredentials.tenantId, add label/name column",
      "status": "completed",
      "activeForm": "Updating DB schema for multiple credentials per tenant"
    },
    {
      "content": "Add credentialId column to graphSubscriptions table",
      "status": "completed",
      "activeForm": "Adding credentialId FK to graphSubscriptions"
    },
    {
      "content": "Update lib/graph/credentials.ts for multi-credential CRUD operations",
      "status": "completed",
      "activeForm": "Updating credentials library for multi-credential support"
    },
    {
      "content": "Update lib/graph/subscriptions.ts to link subscriptions to credentials",
      "status": "in_progress",
      "activeForm": "Updating subscriptions library for credential linking"
    },
    {
      "content": "Update /api/graph/credentials route for multi-credential CRUD",
      "status": "pending",
      "activeForm": "Updating credentials API route"
    },
    {
      "content": "Update /api/graph/subscriptions route to use credentialId",
      "status": "pending",
      "activeForm": "Updating subscriptions API route"
    },
    {
      "content": "Update webhook handler to look up credential via subscription",
      "status": "pending",
      "activeForm": "Updating webhook handler for credential lookup"
    },
    {
      "content": "Update IntegrationsClient.tsx UI for managing multiple connections",
      "status": "pending",
      "activeForm": "Updating admin UI for multiple Graph connections"
    },
    {
      "content": "Generate Drizzle migration and verify TypeScript compilation",
      "status": "pending",
      "activeForm": "Generating migration and verifying types"
    }
  ]
}
Now update `lib/graph/subscriptions.ts` to include `credentialId`:

🔧 Tool: Write
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\graph\\subscriptions.ts",
  "content": "import { db } from \"@/lib/db\";\nimport { graphSubscriptions } from \"@/lib/db/schema\";\nimport { eq, and, lt } from \"drizzle-orm\";\n\nexport interface GraphSubscriptionInsert {\n  tenantId: string;\n  credentialId: string;\n  subscriptionId: string;\n  resource: string;\n  changeType: string;\n  clientState: string;\n  expirationDateTime: Date;\n  notificationUrl: string;\n}\n\n/**\n * Store a new Graph subscription record.\n */\nexport async function createGraphSubscription(data: GraphSubscriptionInsert) {\n  const [result] = await db\n    .insert(graphSubscriptions)\n    .values({\n      tenantId: data.tenantId,\n      credentialId: data.credentialId,\n      subscriptionId: data.subscriptionId,\n      resource: data.resource,\n      changeType: data.changeType,\n      clientState: data.clientState,\n      expirationDateTime: data.expirationDateTime,\n      notificationUrl: data.notificationUrl,\n    })\n    .returning();\n\n  return result;\n}\n\n/**\n * Get all active subscriptions for a tenant.\n */\nexport async function getActiveSubscriptions(tenantId: string) {\n  return db\n    .select()\n    .from(graphSubscriptions)\n    .where(\n      and(\n        eq(graphSubscriptions.tenantId, tenantId),\n        eq(graphSubscriptions.active, true)\n      )\n    );\n}\n\n/**\n * Get subscriptions expiring before a given date (for renewal).\n */\nexport async function getExpiringSubscriptions(beforeDate: Date) {\n  return db\n    .select()\n    .from(graphSubscriptions)\n    .where(\n      and(\n        eq(graphSubscriptions.active, true),\n        lt(graphSubscriptions.expirationDateTime, beforeDate)\n      )\n    );\n}\n\n/**\n * Update a subscription's expiration date (after renewal).\n */\nexport async function renewSubscription(\n  subscriptionId: string,\n  newExpiration: Date\n) {\n  const [result] = await db\n    .update(graphSubscriptions)\n    .set({\n      expirationDateTime: newExpiration,\n      updatedAt: new Date(),\n    })\n    .where(eq(graphSubscriptions.subscriptionId, subscriptionId))\n    .returning();\n\n  return result;\n}\n\n/**\n * Deactivate a subscription (e.g., when it's deleted or expired).\n */\nexport async function deactivateSubscription(subscriptionId: string) {\n  const [result] = await db\n    .update(graphSubscriptions)\n    .set({\n      active: false,\n      updatedAt: new Date(),\n    })\n    .where(eq(graphSubscriptions.subscriptionId, subscriptionId))\n    .returning();\n\n  return result;\n}\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Update DB schema: remove unique constraint on graphCredentials.tenantId, add label/name column",
      "status": "completed",
      "activeForm": "Updating DB schema for multiple credentials per tenant"
    },
    {
      "content": "Add credentialId column to graphSubscriptions table",
      "status": "completed",
      "activeForm": "Adding credentialId FK to graphSubscriptions"
    },
    {
      "content": "Update lib/graph/credentials.ts for multi-credential CRUD operations",
      "status": "completed",
      "activeForm": "Updating credentials library for multi-credential support"
    },
    {
      "content": "Update lib/graph/subscriptions.ts to link subscriptions to credentials",
      "status": "completed",
      "activeForm": "Updating subscriptions library for credential linking"
    },
    {
      "content": "Update /api/graph/credentials route for multi-credential CRUD",
      "status": "in_progress",
      "activeForm": "Updating credentials API route"
    },
    {
      "content": "Update /api/graph/subscriptions route to use credentialId",
      "status": "pending",
      "activeForm": "Updating subscriptions API route"
    },
    {
      "content": "Update webhook handler to look up credential via subscription",
      "status": "pending",
      "activeForm": "Updating webhook handler for credential lookup"
    },
    {
      "content": "Update IntegrationsClient.tsx UI for managing multiple connections",
      "status": "pending",
      "activeForm": "Updating admin UI for multiple Graph connections"
    },
    {
      "content": "Generate Drizzle migration and verify TypeScript compilation",
      "status": "pending",
      "activeForm": "Generating migration and verifying types"
    }
  ]
}
Now update the credentials API route for multi-credential CRUD:

🔧 Tool: Write
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\graph\\credentials\\route.ts",
  "content": "import { auth } from \"@/auth\";\nimport { NextRequest, NextResponse } from \"next/server\";\nimport {\n  createGraphCredentials,\n  getAllGraphCredentials,\n  getGraphCredentialsById,\n  deleteGraphCredentials,\n  getGraphAccessTokenFromCreds,\n} from \"@/lib/graph/credentials\";\n\nconst GUID_REGEX =\n  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;\n\n/**\n * GET /api/graph/credentials\n * List all Azure AD credentials for the current user.\n * Returns masked secrets — never the full client secret.\n */\nexport async function GET() {\n  try {\n    const session = await auth();\n    const userId = session?.user?.id;\n    if (!userId) {\n      return NextResponse.json({ error: \"Unauthorized\" }, { status: 401 });\n    }\n\n    const credentials = await getAllGraphCredentials(userId);\n\n    return NextResponse.json({\n      credentials: credentials.map((c) => ({\n        id: c.id,\n        label: c.label,\n        azureTenantId: c.azureTenantId,\n        clientId: c.clientId,\n        clientSecretHint:\n          c.clientSecret.length > 8\n            ? c.clientSecret.slice(0, 4) + \"...\" + c.clientSecret.slice(-4)\n            : \"****\",\n        createdAt: c.createdAt,\n        updatedAt: c.updatedAt,\n      })),\n    });\n  } catch (error) {\n    console.error(\"Error fetching Graph credentials:\", error);\n    return NextResponse.json(\n      { error: \"Internal server error\" },\n      { status: 500 }\n    );\n  }\n}\n\n/**\n * POST /api/graph/credentials\n * Create a new set of Azure AD app credentials.\n *\n * Body: { label, azureTenantId, clientId, clientSecret }\n */\nexport async function POST(request: NextRequest) {\n  try {\n    const session = await auth();\n    const userId = session?.user?.id;\n    if (!userId) {\n      return NextResponse.json({ error: \"Unauthorized\" }, { status: 401 });\n    }\n\n    let body: {\n      label?: string;\n      azureTenantId?: string;\n      clientId?: string;\n      clientSecret?: string;\n    };\n    try {\n      body = await request.json();\n    } catch {\n      return NextResponse.json(\n        { error: \"Invalid JSON payload\" },\n        { status: 400 }\n      );\n    }\n\n    const { azureTenantId, clientId, clientSecret } = body;\n    const label = body.label?.trim() || \"Default\";\n\n    if (!azureTenantId || !clientId || !clientSecret) {\n      return NextResponse.json(\n        { error: \"azureTenantId, clientId, and clientSecret are all required\" },\n        { status: 400 }\n      );\n    }\n\n    if (!GUID_REGEX.test(azureTenantId.trim())) {\n      return NextResponse.json(\n        { error: \"Azure Tenant ID must be a valid GUID (e.g. 12345678-abcd-1234-abcd-123456789abc)\" },\n        { status: 400 }\n      );\n    }\n    if (!GUID_REGEX.test(clientId.trim())) {\n      return NextResponse.json(\n        { error: \"Application (Client) ID must be a valid GUID\" },\n        { status: 400 }\n      );\n    }\n    if (clientSecret.trim().length < 8 || clientSecret.trim().length > 500) {\n      return NextResponse.json(\n        { error: \"Client secret must be between 8 and 500 characters\" },\n        { status: 400 }\n      );\n    }\n\n    const result = await createGraphCredentials({\n      tenantId: userId,\n      label,\n      azureTenantId: azureTenantId.trim(),\n      clientId: clientId.trim(),\n      clientSecret: clientSecret.trim(),\n    });\n\n    return NextResponse.json(\n      {\n        message: \"Credentials saved\",\n        credential: {\n          id: result.id,\n          label: result.label,\n          azureTenantId: result.azureTenantId,\n          clientId: result.clientId,\n        },\n      },\n      { status: 201 }\n    );\n  } catch (error) {\n    console.error(\"Error saving Graph credentials:\", error);\n    return NextResponse.json(\n      { error: \"Internal server error\" },\n      { status: 500 }\n    );\n  }\n}\n\n/**\n * PUT /api/graph/credentials\n * Test a specific credential by requesting an access token from Azure AD.\n *\n * Body: { credentialId }\n */\nexport async function PUT(request: NextRequest) {\n  try {\n    const session = await auth();\n    const userId = session?.user?.id;\n    if (!userId) {\n      return NextResponse.json({ error: \"Unauthorized\" }, { status: 401 });\n    }\n\n    let body: { credentialId?: string };\n    try {\n      body = await request.json();\n    } catch {\n      return NextResponse.json(\n        { error: \"Invalid JSON payload\" },\n        { status: 400 }\n      );\n    }\n\n    if (!body.credentialId) {\n      return NextResponse.json(\n        { error: \"credentialId is required\" },\n        { status: 400 }\n      );\n    }\n\n    const creds = await getGraphCredentialsById(body.credentialId, userId);\n    if (!creds) {\n      return NextResponse.json(\n        { error: \"Credential not found\" },\n        { status: 404 }\n      );\n    }\n\n    const token = await getGraphAccessTokenFromCreds(creds);\n    return NextResponse.json({\n      success: true,\n      tokenLength: token.length,\n      message: \"Successfully obtained access token from Azure AD\",\n    });\n  } catch (error) {\n    const message =\n      error instanceof Error ? error.message : \"Failed to obtain token\";\n    return NextResponse.json({ success: false, error: message }, { status: 400 });\n  }\n}\n\n/**\n * DELETE /api/graph/credentials\n * Remove a specific set of Azure AD credentials.\n *\n * Body: { credentialId }\n */\nexport async function DELETE(request: NextRequest) {\n  try {\n    const session = await auth();\n    const userId = session?.user?.id;\n    if (!userId) {\n      return NextResponse.json({ error: \"Unauthorized\" }, { status: 401 });\n    }\n\n    let body: { credentialId?: string };\n    try {\n      body = await request.json();\n    } catch {\n      return NextResponse.json(\n        { error: \"Invalid JSON payload\" },\n        { status: 400 }\n      );\n    }\n\n    if (!body.credentialId) {\n      return NextResponse.json(\n        { error: \"credentialId is required\" },\n        { status: 400 }\n      );\n    }\n\n    await deleteGraphCredentials(body.credentialId, userId);\n    return NextResponse.json({ message: \"Credentials removed\" });\n  } catch (error) {\n    console.error(\"Error removing Graph credentials:\", error);\n    return NextResponse.json(\n      { error: \"Internal server error\" },\n      { status: 500 }\n    );\n  }\n}\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Update DB schema: remove unique constraint on graphCredentials.tenantId, add label/name column",
      "status": "completed",
      "activeForm": "Updating DB schema for multiple credentials per tenant"
    },
    {
      "content": "Add credentialId column to graphSubscriptions table",
      "status": "completed",
      "activeForm": "Adding credentialId FK to graphSubscriptions"
    },
    {
      "content": "Update lib/graph/credentials.ts for multi-credential CRUD operations",
      "status": "completed",
      "activeForm": "Updating credentials library for multi-credential support"
    },
    {
      "content": "Update lib/graph/subscriptions.ts to link subscriptions to credentials",
      "status": "completed",
      "activeForm": "Updating subscriptions library for credential linking"
    },
    {
      "content": "Update /api/graph/credentials route for multi-credential CRUD",
      "status": "completed",
      "activeForm": "Updating credentials API route"
    },
    {
      "content": "Update /api/graph/subscriptions route to use credentialId",
      "status": "in_progress",
      "activeForm": "Updating subscriptions API route"
    },
    {
      "content": "Update webhook handler to look up credential via subscription",
      "status": "pending",
      "activeForm": "Updating webhook handler for credential lookup"
    },
    {
      "content": "Update IntegrationsClient.tsx UI for managing multiple connections",
      "status": "pending",
      "activeForm": "Updating admin UI for multiple Graph connections"
    },
    {
      "content": "Generate Drizzle migration and verify TypeScript compilation",
      "status": "pending",
      "activeForm": "Generating migration and verifying types"
    }
  ]
}
Now update the subscriptions API route to accept `credentialId`:

🔧 Tool: Write
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\graph\\subscriptions\\route.ts",
  "content": "import { auth } from \"@/auth\";\nimport { NextRequest, NextResponse } from \"next/server\";\nimport {\n  createGraphSubscription,\n  getActiveSubscriptions,\n  deactivateSubscription,\n} from \"@/lib/graph/subscriptions\";\nimport {\n  getGraphCredentialsById,\n  getGraphAccessTokenFromCreds,\n} from \"@/lib/graph/credentials\";\n\nconst GRAPH_SUBSCRIPTIONS_URL =\n  \"https://graph.microsoft.com/v1.0/subscriptions\";\n\n/**\n * GET /api/graph/subscriptions\n * List all active Graph subscriptions for the current user.\n */\nexport async function GET() {\n  try {\n    const session = await auth();\n    const userId = session?.user?.id;\n    if (!userId) {\n      return NextResponse.json({ error: \"Unauthorized\" }, { status: 401 });\n    }\n\n    const subscriptions = await getActiveSubscriptions(userId);\n    return NextResponse.json({ subscriptions });\n  } catch (error) {\n    console.error(\"Error fetching Graph subscriptions:\", error);\n    return NextResponse.json(\n      { error: \"Internal server error\" },\n      { status: 500 }\n    );\n  }\n}\n\n/**\n * POST /api/graph/subscriptions\n * Create a new Graph subscription by proxying to Microsoft Graph API,\n * then storing the result in our database.\n *\n * Body: { credentialId, mailbox, changeType?, clientState? }\n */\nexport async function POST(request: NextRequest) {\n  try {\n    const session = await auth();\n    const userId = session?.user?.id;\n    if (!userId) {\n      return NextResponse.json({ error: \"Unauthorized\" }, { status: 401 });\n    }\n\n    let body: {\n      credentialId?: string;\n      mailbox?: string;\n      changeType?: string;\n      clientState?: string;\n    };\n    try {\n      body = await request.json();\n    } catch {\n      body = {};\n    }\n\n    const credentialId = body.credentialId?.trim();\n    if (!credentialId) {\n      return NextResponse.json(\n        { error: \"credentialId is required\" },\n        { status: 400 }\n      );\n    }\n\n    const mailbox = body.mailbox?.trim();\n    if (!mailbox) {\n      return NextResponse.json(\n        { error: \"Mailbox email is required\" },\n        { status: 400 }\n      );\n    }\n\n    // Get the credential and obtain an access token\n    const creds = await getGraphCredentialsById(credentialId, userId);\n    if (!creds) {\n      return NextResponse.json(\n        { error: \"Credential not found\" },\n        { status: 404 }\n      );\n    }\n\n    let accessToken: string;\n    try {\n      accessToken = await getGraphAccessTokenFromCreds(creds);\n    } catch (error) {\n      const message =\n        error instanceof Error ? error.message : \"Failed to obtain access token\";\n      return NextResponse.json(\n        { error: message },\n        { status: 400 }\n      );\n    }\n\n    const resource = `users/${mailbox}/mailFolders/inbox/messages`;\n    const changeType = body.changeType || \"created\";\n    const clientState =\n      body.clientState || crypto.randomUUID().replace(/-/g, \"\");\n\n    // Build the notification URL from the request origin\n    const origin = request.nextUrl.origin;\n    const notificationUrl = `${origin}/api/webhooks/email/graph/${userId}`;\n\n    // Max expiration for mail resources is ~3 days (4230 minutes)\n    const expirationDateTime = new Date(\n      Date.now() + 3 * 24 * 60 * 60 * 1000 - 60000\n    ).toISOString();\n\n    const subscriptionPayload = {\n      changeType,\n      notificationUrl,\n      resource,\n      expirationDateTime,\n      clientState,\n    };\n\n    // Create subscription on Microsoft Graph\n    const graphResponse = await fetch(GRAPH_SUBSCRIPTIONS_URL, {\n      method: \"POST\",\n      headers: {\n        \"Content-Type\": \"application/json\",\n        Authorization: `Bearer ${accessToken}`,\n      },\n      body: JSON.stringify(subscriptionPayload),\n    });\n\n    if (!graphResponse.ok) {\n      const errorBody = await graphResponse.text();\n      let errorDetail: string;\n      try {\n        const parsed = JSON.parse(errorBody);\n        errorDetail =\n          parsed?.error?.message || parsed?.error_description || errorBody;\n      } catch {\n        errorDetail = errorBody;\n      }\n      return NextResponse.json(\n        {\n          error: \"Microsoft Graph API error\",\n          status: graphResponse.status,\n          detail: errorDetail,\n        },\n        { status: graphResponse.status >= 400 ? graphResponse.status : 502 }\n      );\n    }\n\n    const graphResult = await graphResponse.json();\n\n    // Store in our database\n    const subscription = await createGraphSubscription({\n      tenantId: userId,\n      credentialId,\n      subscriptionId: graphResult.id,\n      resource: graphResult.resource,\n      changeType: graphResult.changeType,\n      clientState,\n      expirationDateTime: new Date(graphResult.expirationDateTime),\n      notificationUrl,\n    });\n\n    return NextResponse.json(\n      {\n        message: \"Subscription created\",\n        subscription: {\n          id: subscription.id,\n          subscriptionId: graphResult.id,\n          resource: graphResult.resource,\n          changeType: graphResult.changeType,\n          expirationDateTime: graphResult.expirationDateTime,\n          notificationUrl,\n          credentialId,\n        },\n      },\n      { status: 201 }\n    );\n  } catch (error) {\n    console.error(\"Error creating Graph subscription:\", error);\n    return NextResponse.json(\n      { error: \"Internal server error\" },\n      { status: 500 }\n    );\n  }\n}\n\n/**\n * DELETE /api/graph/subscriptions\n * Delete a Graph subscription by ID.\n * Automatically obtains an access token to delete from Graph.\n *\n * Body: { subscriptionId }\n */\nexport async function DELETE(request: NextRequest) {\n  try {\n    const session = await auth();\n    const userId = session?.user?.id;\n    if (!userId) {\n      return NextResponse.json({ error: \"Unauthorized\" }, { status: 401 });\n    }\n\n    let body: { subscriptionId?: string };\n    try {\n      body = await request.json();\n    } catch {\n      return NextResponse.json(\n        { error: \"Invalid JSON payload\" },\n        { status: 400 }\n      );\n    }\n\n    const { subscriptionId } = body;\n    if (!subscriptionId) {\n      return NextResponse.json(\n        { error: \"subscriptionId is required\" },\n        { status: 400 }\n      );\n    }\n\n    // Look up the subscription to find its credentialId\n    const subscriptions = await getActiveSubscriptions(userId);\n    const sub = subscriptions.find((s) => s.subscriptionId === subscriptionId);\n\n    // Try to delete from Microsoft Graph using the linked credential\n    if (sub?.credentialId) {\n      try {\n        const creds = await getGraphCredentialsById(sub.credentialId, userId);\n        if (creds) {\n          const accessToken = await getGraphAccessTokenFromCreds(creds);\n          const graphResponse = await fetch(\n            `${GRAPH_SUBSCRIPTIONS_URL}/${subscriptionId}`,\n            {\n              method: \"DELETE\",\n              headers: {\n                Authorization: `Bearer ${accessToken}`,\n              },\n            }\n          );\n\n          if (!graphResponse.ok && graphResponse.status !== 404) {\n            const errorBody = await graphResponse.text();\n            console.warn(\n              `[Graph] Failed to delete subscription ${subscriptionId} from Graph:`,\n              errorBody\n            );\n          }\n        }\n      } catch (error) {\n        console.warn(\n          `[Graph] Could not obtain token to delete subscription from Graph:`,\n          error instanceof Error ? error.message : error\n        );\n      }\n    }\n\n    // Deactivate in our database\n    await deactivateSubscription(subscriptionId);\n\n    return NextResponse.json({ message: \"Subscription deleted\" });\n  } catch (error) {\n    console.error(\"Error deleting Graph subscription:\", error);\n    return NextResponse.json(\n      { error: \"Internal server error\" },\n      { status: 500 }\n    );\n  }\n}\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Update DB schema: remove unique constraint on graphCredentials.tenantId, add label/name column",
      "status": "completed",
      "activeForm": "Updating DB schema for multiple credentials per tenant"
    },
    {
      "content": "Add credentialId column to graphSubscriptions table",
      "status": "completed",
      "activeForm": "Adding credentialId FK to graphSubscriptions"
    },
    {
      "content": "Update lib/graph/credentials.ts for multi-credential CRUD operations",
      "status": "completed",
      "activeForm": "Updating credentials library for multi-credential support"
    },
    {
      "content": "Update lib/graph/subscriptions.ts to link subscriptions to credentials",
      "status": "completed",
      "activeForm": "Updating subscriptions library for credential linking"
    },
    {
      "content": "Update /api/graph/credentials route for multi-credential CRUD",
      "status": "completed",
      "activeForm": "Updating credentials API route"
    },
    {
      "content": "Update /api/graph/subscriptions route to use credentialId",
      "status": "completed",
      "activeForm": "Updating subscriptions API route"
    },
    {
      "content": "Update webhook handler to look up credential via subscription",
      "status": "in_progress",
      "activeForm": "Updating webhook handler for credential lookup"
    },
    {
      "content": "Update IntegrationsClient.tsx UI for managing multiple connections",
      "status": "pending",
      "activeForm": "Updating admin UI for multiple Graph connections"
    },
    {
      "content": "Generate Drizzle migration and verify TypeScript compilation",
      "status": "pending",
      "activeForm": "Generating migration and verifying types"
    }
  ]
}
Now update the webhook handler. The subscription now has a `credentialId`, so the handler can look up the credential to potentially fetch full email content in the future. For now, the key change is that we're aware of the credential linkage:

🔧 Tool: Write
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\webhooks\\email\\graph\\[tenantId]\\route.ts",
  "content": "import { NextRequest, NextResponse } from \"next/server\";\nimport { graphNotificationPayloadSchema } from \"@/lib/validators/schemas\";\nimport { db } from \"@/lib/db\";\nimport { users, graphSubscriptions } from \"@/lib/db/schema\";\nimport { eq, and } from \"drizzle-orm\";\nimport { insertEmail, emailExists } from \"@/lib/email/emails\";\nimport {\n  getGraphCredentialsByIdUnsafe,\n  getGraphAccessTokenFromCreds,\n} from \"@/lib/graph/credentials\";\n\nconst UUID_REGEX =\n  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;\n\n/**\n * GET handler for Microsoft Graph subscription validation.\n *\n * When a subscription is created, Microsoft sends a GET request with a\n * `validationToken` query parameter. The endpoint must respond with the\n * token value as text/plain within 10 seconds.\n */\nexport async function GET(\n  request: NextRequest,\n  { params }: { params: Promise<{ tenantId: string }> }\n) {\n  const validationToken = request.nextUrl.searchParams.get(\"validationToken\");\n\n  if (!validationToken) {\n    return NextResponse.json(\n      { error: \"Missing validationToken\" },\n      { status: 400 }\n    );\n  }\n\n  const { tenantId } = await params;\n\n  if (!UUID_REGEX.test(tenantId)) {\n    return NextResponse.json(\n      { error: \"Invalid tenant ID format\" },\n      { status: 400 }\n    );\n  }\n\n  // Validate that the tenant exists\n  const [tenant] = await db\n    .select({ id: users.id })\n    .from(users)\n    .where(eq(users.id, tenantId));\n\n  if (!tenant) {\n    return NextResponse.json({ error: \"Tenant not found\" }, { status: 404 });\n  }\n\n  // Echo back the validation token as text/plain (required by Microsoft Graph)\n  return new NextResponse(validationToken, {\n    status: 200,\n    headers: { \"Content-Type\": \"text/plain\" },\n  });\n}\n\n/**\n * Fetch a message from Microsoft Graph API using app-only credentials.\n */\nasync function fetchGraphMessage(\n  accessToken: string,\n  resource: string,\n  messageId: string\n): Promise<{\n  from: string;\n  to: string[];\n  cc: string[];\n  subject: string;\n  bodyPlainText: string;\n  bodyHtml: string;\n  receivedDateTime: string;\n} | null> {\n  // Extract the user portion from the resource path\n  // e.g. \"users/user@domain.com/mailFolders/inbox/messages\" -> \"users/user@domain.com\"\n  const parts = resource.split(\"/\");\n  const usersIdx = parts.indexOf(\"users\");\n  if (usersIdx === -1 || usersIdx + 1 >= parts.length) return null;\n  const userPath = `users/${parts[usersIdx + 1]}`;\n\n  const url = `https://graph.microsoft.com/v1.0/${userPath}/messages/${messageId}?$select=from,toRecipients,ccRecipients,subject,body,bodyPreview,receivedDateTime`;\n\n  try {\n    const res = await fetch(url, {\n      headers: { Authorization: `Bearer ${accessToken}` },\n    });\n    if (!res.ok) {\n      console.warn(`[Graph] Failed to fetch message ${messageId}: ${res.status}`);\n      return null;\n    }\n    const msg = await res.json();\n\n    const extractEmail = (r: { emailAddress?: { address?: string } }) =>\n      r?.emailAddress?.address || \"\";\n\n    return {\n      from: msg.from?.emailAddress?.address || \"\",\n      to: (msg.toRecipients || []).map(extractEmail).filter(Boolean),\n      cc: (msg.ccRecipients || []).map(extractEmail).filter(Boolean),\n      subject: msg.subject || \"\",\n      bodyPlainText: msg.bodyPreview || \"\",\n      bodyHtml: msg.body?.contentType === \"html\" ? msg.body.content || \"\" : \"\",\n      receivedDateTime: msg.receivedDateTime || new Date().toISOString(),\n    };\n  } catch (err) {\n    console.warn(`[Graph] Error fetching message ${messageId}:`, err);\n    return null;\n  }\n}\n\n/**\n * POST handler for Microsoft Graph change notifications.\n *\n * When a subscribed resource changes, Microsoft sends a POST with a\n * JSON body containing an array of notification objects. Each notification\n * includes the subscriptionId and clientState for verification.\n *\n * Important: Microsoft expects a 202 response within 3 seconds.\n * Heavy processing should be done asynchronously.\n */\nexport async function POST(\n  request: NextRequest,\n  { params }: { params: Promise<{ tenantId: string }> }\n) {\n  try {\n    const { tenantId } = await params;\n\n    if (!UUID_REGEX.test(tenantId)) {\n      return NextResponse.json(\n        { error: \"Invalid tenant ID format\" },\n        { status: 400 }\n      );\n    }\n\n    // Microsoft Graph sends validation via POST with validationToken in query string.\n    // Must respond with 200 and the token as text/plain.\n    const validationToken =\n      request.nextUrl.searchParams.get(\"validationToken\");\n    if (validationToken) {\n      return new NextResponse(validationToken, {\n        status: 200,\n        headers: { \"Content-Type\": \"text/plain\" },\n      });\n    }\n\n    // Parse the notification payload\n    let body: unknown;\n    try {\n      body = await request.json();\n    } catch {\n      return NextResponse.json(\n        { error: \"Invalid JSON payload\" },\n        { status: 400 }\n      );\n    }\n\n    const parsed = graphNotificationPayloadSchema.safeParse(body);\n    if (!parsed.success) {\n      return NextResponse.json(\n        {\n          error: \"Validation failed\",\n          details: parsed.error.flatten().fieldErrors,\n        },\n        { status: 400 }\n      );\n    }\n\n    const notifications = parsed.data.value;\n\n    // Process each notification\n    for (const notification of notifications) {\n      // Validate clientState against stored subscription\n      const [subscription] = await db\n        .select()\n        .from(graphSubscriptions)\n        .where(\n          and(\n            eq(graphSubscriptions.subscriptionId, notification.subscriptionId),\n            eq(graphSubscriptions.tenantId, tenantId),\n            eq(graphSubscriptions.active, true)\n          )\n        );\n\n      if (!subscription) {\n        console.warn(\n          `[Graph] Unknown subscription ${notification.subscriptionId} for tenant ${tenantId}`\n        );\n        continue;\n      }\n\n      if (\n        notification.clientState &&\n        notification.clientState !== subscription.clientState\n      ) {\n        console.warn(\n          `[Graph] clientState mismatch for subscription ${notification.subscriptionId}`\n        );\n        continue;\n      }\n\n      // Extract resource data — for mail messages, the resource path\n      // looks like \"me/mailFolders/inbox/messages/{id}\" or \"users/{id}/messages/{id}\"\n      const messageId =\n        notification.resourceData?.id || extractMessageId(notification.resource);\n\n      if (!messageId) {\n        console.warn(\n          `[Graph] Could not extract message ID from notification: ${notification.resource}`\n        );\n        continue;\n      }\n\n      // Check for duplicate\n      const exists = await emailExists(tenantId, messageId);\n      if (exists) {\n        continue;\n      }\n\n      // Try to fetch full email content using the linked credential\n      let emailData: {\n        from: string;\n        to: string[];\n        cc?: string[];\n        subject?: string;\n        bodyPlainText?: string;\n        bodyHtml?: string;\n        receivedDateTime: string;\n      } = {\n        from: \"(pending Graph API fetch)\",\n        to: [],\n        receivedDateTime: new Date().toISOString(),\n      };\n\n      if (subscription.credentialId) {\n        try {\n          const creds = await getGraphCredentialsByIdUnsafe(subscription.credentialId);\n          if (creds) {\n            const token = await getGraphAccessTokenFromCreds(creds);\n            const fullMessage = await fetchGraphMessage(token, subscription.resource, messageId);\n            if (fullMessage) {\n              emailData = fullMessage;\n            }\n          }\n        } catch (err) {\n          console.warn(\n            `[Graph] Could not fetch full message for ${messageId}:`,\n            err instanceof Error ? err.message : err\n          );\n        }\n      }\n\n      try {\n        await insertEmail(\n          {\n            messageId,\n            from: emailData.from,\n            to: emailData.to,\n            cc: emailData.cc,\n            subject: emailData.subject,\n            bodyPlainText: emailData.bodyPlainText,\n            bodyHtml: emailData.bodyHtml,\n            receivedDateTime: emailData.receivedDateTime,\n          },\n          tenantId\n        );\n      } catch (err) {\n        if (\n          err instanceof Error &&\n          err.message.includes(\"duplicate key value\")\n        ) {\n          continue;\n        }\n        console.error(\n          `[Graph] Error storing notification for message ${messageId}:`,\n          err\n        );\n      }\n\n      console.log(\n        `[Graph] Tenant ${tenantId}: change notification for ${notification.resource}, changeType=${notification.changeType}`\n      );\n    }\n\n    // Microsoft expects 202 Accepted\n    return NextResponse.json(\n      { message: \"Notifications processed\" },\n      { status: 202 }\n    );\n  } catch (error) {\n    console.error(\"Error processing Graph webhook:\", error);\n    return NextResponse.json(\n      { error: \"Internal server error\" },\n      { status: 500 }\n    );\n  }\n}\n\n/**\n * Extract a message ID from a Graph resource path.\n * e.g. \"me/messages/AAMkAGI2...\" -> \"AAMkAGI2...\"\n *      \"users/xxx/mailFolders/inbox/messages/AAMkAGI2...\" -> \"AAMkAGI2...\"\n */\nfunction extractMessageId(resource: string): string | null {\n  const parts = resource.split(\"/\");\n  const messagesIdx = parts.lastIndexOf(\"messages\");\n  if (messagesIdx !== -1 && messagesIdx + 1 < parts.length) {\n    return parts[messagesIdx + 1];\n  }\n  return null;\n}\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Update DB schema: remove unique constraint on graphCredentials.tenantId, add label/name column",
      "status": "completed",
      "activeForm": "Updating DB schema for multiple credentials per tenant"
    },
    {
      "content": "Add credentialId column to graphSubscriptions table",
      "status": "completed",
      "activeForm": "Adding credentialId FK to graphSubscriptions"
    },
    {
      "content": "Update lib/graph/credentials.ts for multi-credential CRUD operations",
      "status": "completed",
      "activeForm": "Updating credentials library for multi-credential support"
    },
    {
      "content": "Update lib/graph/subscriptions.ts to link subscriptions to credentials",
      "status": "completed",
      "activeForm": "Updating subscriptions library for credential linking"
    },
    {
      "content": "Update /api/graph/credentials route for multi-credential CRUD",
      "status": "completed",
      "activeForm": "Updating credentials API route"
    },
    {
      "content": "Update /api/graph/subscriptions route to use credentialId",
      "status": "completed",
      "activeForm": "Updating subscriptions API route"
    },
    {
      "content": "Update webhook handler to look up credential via subscription",
      "status": "completed",
      "activeForm": "Updating webhook handler for credential lookup"
    },
    {
      "content": "Update IntegrationsClient.tsx UI for managing multiple connections",
      "status": "in_progress",
      "activeForm": "Updating admin UI for multiple Graph connections"
    },
    {
      "content": "Generate Drizzle migration and verify TypeScript compilation",
      "status": "pending",
      "activeForm": "Generating migration and verifying types"
    }
  ]
}
Now the big one — updating the UI. I need to rewrite the `GraphCredentialsManager` and `GraphSubscriptionManager` components. Let me also read the rest of the file to make sure I don't miss anything.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "offset": 1899,
  "limit": 200
}
Good, I have a clear picture of the full file. Now I need to update the key Graph-related components in the UI. The main changes are:

1. `GraphCredentialsManager` → manage a list of credentials, add/remove
2. `GraphSubscriptionManager` → select which credential to use when creating a subscription
3. The interfaces need updating
4. The parent `IntegrationsClient` needs to pass credential list info

Let me now rewrite the Graph components. I'll replace the `GraphCredentialsStatus` interface and `GraphCredentialsManager` component:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "old_string": "interface GraphSubscription {\n  id: string;\n  subscriptionId: string;\n  resource: string;\n  changeType: string;\n  expirationDateTime: string;\n  active: boolean;\n}\n\ninterface GraphCredentialsStatus {\n  configured: boolean;\n  azureTenantId?: string;\n  clientId?: string;\n  clientSecretHint?: string;\n  updatedAt?: string;\n}\n\nfunction GraphCredentialsManager({\n  onStatusChange,\n}: {\n  onStatusChange: (configured: boolean) => void;\n}) {\n  const [azureTenantId, setAzureTenantId] = useState(\"\");\n  const [clientId, setClientId] = useState(\"\");\n  const [clientSecret, setClientSecret] = useState(\"\");\n  const [saving, setSaving] = useState(false);\n  const [testing, setTesting] = useState(false);\n  const [error, setError] = useState<string | null>(null);\n  const [success, setSuccess] = useState<string | null>(null);\n  const [status, setStatus] = useState<GraphCredentialsStatus | null>(null);\n  const [loading, setLoading] = useState(true);\n\n  const fetchStatus = useCallback(async () => {\n    try {\n      setLoading(true);\n      const res = await fetch(\"/api/graph/credentials\");\n      if (!res.ok) throw new Error(\"Failed to fetch\");\n      const data = await res.json();\n      setStatus(data);\n      onStatusChange(data.configured);\n    } catch {\n      // Silently fail\n    } finally {\n      setLoading(false);\n    }\n  }, [onStatusChange]);\n\n  useEffect(() => {\n    fetchStatus();\n  }, [fetchStatus]);\n\n  const handleSave = async () => {\n    if (!azureTenantId.trim() || !clientId.trim() || !clientSecret.trim()) return;\n    setSaving(true);\n    setError(null);\n    setSuccess(null);\n    try {\n      const res = await fetch(\"/api/graph/credentials\", {\n        method: \"POST\",\n        headers: { \"Content-Type\": \"application/json\" },\n        body: JSON.stringify({\n          azureTenantId: azureTenantId.trim(),\n          clientId: clientId.trim(),\n          clientSecret: clientSecret.trim(),\n        }),\n      });\n      if (!res.ok) {\n        const data = await res.json();\n        throw new Error(data.error || \"Failed to save\");\n      }\n      setSuccess(\"Credentials saved successfully\");\n      setAzureTenantId(\"\");\n      setClientId(\"\");\n      setClientSecret(\"\");\n      setTimeout(() => setSuccess(null), 5000);\n      await fetchStatus();\n    } catch (err) {\n      setError(err instanceof Error ? err.message : \"Failed to save credentials\");\n    } finally {\n      setSaving(false);\n    }\n  };\n\n  const handleTest = async () => {\n    setTesting(true);\n    setError(null);\n    setSuccess(null);\n    try {\n      const res = await fetch(\"/api/graph/credentials\", { method: \"PUT\" });\n      const data = await res.json();\n      if (!data.success) {\n        setError(data.error || \"Token test failed\");\n        return;\n      }\n      setSuccess(\"Connection successful — obtained access token from Azure AD\");\n      setTimeout(() => setSuccess(null), 5000);\n    } catch {\n      setError(\"Failed to test connection\");\n    } finally {\n      setTesting(false);\n    }\n  };\n\n  const handleRemove = async () => {\n    setError(null);\n    setSuccess(null);\n    try {\n      const res = await fetch(\"/api/graph/credentials\", { method: \"DELETE\" });\n      if (!res.ok) throw new Error(\"Failed to remove\");\n      setSuccess(\"Credentials removed\");\n      setTimeout(() => setSuccess(null), 3000);\n      await fetchStatus();\n    } catch {\n      setError(\"Failed to remove credentials\");\n    }\n  };\n\n  if (loading) {\n    return (\n      <div className=\"p-4 rounded-lg bg-[var(--secondary)] border border-[var(--border)] text-sm text-[var(--muted-foreground)]\">\n        Loading...\n      </div>\n    );\n  }\n\n  return (\n    <div className=\"space-y-4\">\n      {status?.configured && (\n        <div className=\"p-4 rounded-lg bg-green-500/10 border border-green-500/20 space-y-2\">\n          <div className=\"flex items-center gap-2\">\n            <div className=\"w-2 h-2 rounded-full bg-green-500\" />\n            <span className=\"text-sm font-medium text-green-600\">Connected</span>\n          </div>\n          <div className=\"text-xs text-[var(--muted-foreground)] space-y-1\">\n            <p>Azure Tenant: <code className=\"px-1 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)]\">{status.azureTenantId}</code></p>\n            <p>Client ID: <code className=\"px-1 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)]\">{status.clientId}</code></p>\n            <p>Client Secret: <code className=\"px-1 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)]\">{status.clientSecretHint}</code></p>\n          </div>\n          <div className=\"flex gap-2 mt-3\">\n            <button\n              onClick={handleTest}\n              disabled={testing}\n              className=\"px-3 py-1.5 text-xs font-medium rounded-md border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors disabled:opacity-50\"\n            >\n              {testing ? \"Testing...\" : \"Test Connection\"}\n            </button>\n            <button\n              onClick={handleRemove}\n              className=\"px-3 py-1.5 text-xs font-medium rounded-md border border-red-500/30 text-red-600 hover:bg-red-500/10 transition-colors\"\n            >\n              Remove\n            </button>\n          </div>\n        </div>\n      )}\n\n      {!status?.configured && (\n        <div className=\"p-5 rounded-lg border border-[var(--border)] bg-[var(--secondary)]/50 space-y-4\">\n          <div>\n            <label className=\"text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider\">\n              Azure Tenant ID <span className=\"text-red-500\">*</span>\n            </label>\n            <input\n              type=\"text\"\n              value={azureTenantId}\n              onChange={(e) => setAzureTenantId(e.target.value)}\n              placeholder=\"e.g. 12345678-abcd-1234-abcd-123456789abc\"\n              className=\"mt-1 w-full px-3 py-2 text-sm rounded-md border border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--ring)]\"\n            />\n            <p className=\"mt-1 text-xs text-[var(--muted-foreground)]\">\n              Found in Azure Portal &rarr; Azure Active Directory &rarr; Overview &rarr; Tenant ID\n            </p>\n          </div>\n\n          <div>\n            <label className=\"text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider\">\n              Application (Client) ID <span className=\"text-red-500\">*</span>\n            </label>\n            <input\n              type=\"text\"\n              value={clientId}\n              onChange={(e) => setClientId(e.target.value)}\n              placeholder=\"e.g. 12345678-abcd-1234-abcd-123456789abc\"\n              className=\"mt-1 w-full px-3 py-2 text-sm rounded-md border border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--ring)]\"\n            />\n            <p className=\"mt-1 text-xs text-[var(--muted-foreground)]\">\n              Found in Azure Portal &rarr; App registrations &rarr; Your app &rarr; Application (client) ID\n            </p>\n          </div>\n\n          <div>\n            <label className=\"text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider\">\n              Client Secret <span className=\"text-red-500\">*</span>\n            </label>\n            <input\n              type=\"password\"\n              value={clientSecret}\n              onChange={(e) => setClientSecret(e.target.value)}\n              placeholder=\"Paste the client secret value\"\n              className=\"mt-1 w-full px-3 py-2 text-sm rounded-md border border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]\"\n            />\n            <p className=\"mt-1 text-xs text-[var(--muted-foreground)]\">\n              Found in Azure Portal &rarr; App registrations &rarr; Your app &rarr; Certificates &amp; secrets\n            </p>\n          </div>\n\n          <button\n            onClick={handleSave}\n            disabled={saving || !azureTenantId.trim() || !clientId.trim() || !clientSecret.trim()}\n            className=\"px-4 py-2 text-sm font-medium rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50\"\n          >\n            {saving ? \"Saving...\" : \"Save Credentials\"}\n          </button>\n        </div>\n      )}\n\n      {error && (\n        <div className=\"p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-600\">\n          {error}\n        </div>\n      )}\n      {success && (\n        <div className=\"p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-green-600\">\n          {success}\n        </div>\n      )}\n    </div>\n  );\n}",
  "new_string": "interface GraphSubscription {\n  id: string;\n  subscriptionId: string;\n  credentialId: string | null;\n  resource: string;\n  changeType: string;\n  expirationDateTime: string;\n  active: boolean;\n}\n\ninterface GraphCredential {\n  id: string;\n  label: string;\n  azureTenantId: string;\n  clientId: string;\n  clientSecretHint: string;\n  createdAt: string;\n  updatedAt: string;\n}\n\nfunction GraphCredentialsManager({\n  onCredentialsChange,\n}: {\n  onCredentialsChange: (credentials: GraphCredential[]) => void;\n}) {\n  const [credentials, setCredentials] = useState<GraphCredential[]>([]);\n  const [showForm, setShowForm] = useState(false);\n  const [label, setLabel] = useState(\"\");\n  const [azureTenantId, setAzureTenantId] = useState(\"\");\n  const [clientId, setClientId] = useState(\"\");\n  const [clientSecret, setClientSecret] = useState(\"\");\n  const [saving, setSaving] = useState(false);\n  const [testingId, setTestingId] = useState<string | null>(null);\n  const [error, setError] = useState<string | null>(null);\n  const [success, setSuccess] = useState<string | null>(null);\n  const [loading, setLoading] = useState(true);\n\n  const fetchCredentials = useCallback(async () => {\n    try {\n      setLoading(true);\n      const res = await fetch(\"/api/graph/credentials\");\n      if (!res.ok) throw new Error(\"Failed to fetch\");\n      const data = await res.json();\n      const creds = data.credentials || [];\n      setCredentials(creds);\n      onCredentialsChange(creds);\n    } catch {\n      // Silently fail\n    } finally {\n      setLoading(false);\n    }\n  }, [onCredentialsChange]);\n\n  useEffect(() => {\n    fetchCredentials();\n  }, [fetchCredentials]);\n\n  const handleSave = async () => {\n    if (!azureTenantId.trim() || !clientId.trim() || !clientSecret.trim()) return;\n    setSaving(true);\n    setError(null);\n    setSuccess(null);\n    try {\n      const res = await fetch(\"/api/graph/credentials\", {\n        method: \"POST\",\n        headers: { \"Content-Type\": \"application/json\" },\n        body: JSON.stringify({\n          label: label.trim() || undefined,\n          azureTenantId: azureTenantId.trim(),\n          clientId: clientId.trim(),\n          clientSecret: clientSecret.trim(),\n        }),\n      });\n      if (!res.ok) {\n        const data = await res.json();\n        throw new Error(data.error || \"Failed to save\");\n      }\n      setSuccess(\"Connection added successfully\");\n      setLabel(\"\");\n      setAzureTenantId(\"\");\n      setClientId(\"\");\n      setClientSecret(\"\");\n      setShowForm(false);\n      setTimeout(() => setSuccess(null), 5000);\n      await fetchCredentials();\n    } catch (err) {\n      setError(err instanceof Error ? err.message : \"Failed to save credentials\");\n    } finally {\n      setSaving(false);\n    }\n  };\n\n  const handleTest = async (credentialId: string) => {\n    setTestingId(credentialId);\n    setError(null);\n    setSuccess(null);\n    try {\n      const res = await fetch(\"/api/graph/credentials\", {\n        method: \"PUT\",\n        headers: { \"Content-Type\": \"application/json\" },\n        body: JSON.stringify({ credentialId }),\n      });\n      const data = await res.json();\n      if (!data.success) {\n        setError(data.error || \"Token test failed\");\n        return;\n      }\n      setSuccess(\"Connection successful — obtained access token from Azure AD\");\n      setTimeout(() => setSuccess(null), 5000);\n    } catch {\n      setError(\"Failed to test connection\");\n    } finally {\n      setTestingId(null);\n    }\n  };\n\n  const handleRemove = async (credentialId: string) => {\n    setError(null);\n    setSuccess(null);\n    try {\n      const res = await fetch(\"/api/graph/credentials\", {\n        method: \"DELETE\",\n        headers: { \"Content-Type\": \"application/json\" },\n        body: JSON.stringify({ credentialId }),\n      });\n      if (!res.ok) throw new Error(\"Failed to remove\");\n      setSuccess(\"Connection removed\");\n      setTimeout(() => setSuccess(null), 3000);\n      await fetchCredentials();\n    } catch {\n      setError(\"Failed to remove credentials\");\n    }\n  };\n\n  if (loading) {\n    return (\n      <div className=\"p-4 rounded-lg bg-[var(--secondary)] border border-[var(--border)] text-sm text-[var(--muted-foreground)]\">\n        Loading...\n      </div>\n    );\n  }\n\n  return (\n    <div className=\"space-y-4\">\n      {/* Existing credentials list */}\n      {credentials.length > 0 && (\n        <div className=\"space-y-3\">\n          {credentials.map((cred) => (\n            <div key={cred.id} className=\"p-4 rounded-lg bg-green-500/10 border border-green-500/20 space-y-2\">\n              <div className=\"flex items-center gap-2\">\n                <div className=\"w-2 h-2 rounded-full bg-green-500\" />\n                <span className=\"text-sm font-medium text-green-600\">{cred.label}</span>\n              </div>\n              <div className=\"text-xs text-[var(--muted-foreground)] space-y-1\">\n                <p>Azure Tenant: <code className=\"px-1 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)]\">{cred.azureTenantId}</code></p>\n                <p>Client ID: <code className=\"px-1 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)]\">{cred.clientId}</code></p>\n                <p>Client Secret: <code className=\"px-1 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)]\">{cred.clientSecretHint}</code></p>\n              </div>\n              <div className=\"flex gap-2 mt-3\">\n                <button\n                  onClick={() => handleTest(cred.id)}\n                  disabled={testingId !== null}\n                  className=\"px-3 py-1.5 text-xs font-medium rounded-md border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors disabled:opacity-50\"\n                >\n                  {testingId === cred.id ? \"Testing...\" : \"Test Connection\"}\n                </button>\n                <button\n                  onClick={() => handleRemove(cred.id)}\n                  className=\"px-3 py-1.5 text-xs font-medium rounded-md border border-red-500/30 text-red-600 hover:bg-red-500/10 transition-colors\"\n                >\n                  Remove\n                </button>\n              </div>\n            </div>\n          ))}\n        </div>\n      )}\n\n      {/* Add connection button / form */}\n      {!showForm ? (\n        <button\n          onClick={() => setShowForm(true)}\n          className=\"px-4 py-2 text-sm font-medium rounded-md border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors\"\n        >\n          + Add Connection\n        </button>\n      ) : (\n        <div className=\"p-5 rounded-lg border border-[var(--border)] bg-[var(--secondary)]/50 space-y-4\">\n          <div>\n            <label className=\"text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider\">\n              Connection Label\n            </label>\n            <input\n              type=\"text\"\n              value={label}\n              onChange={(e) => setLabel(e.target.value)}\n              placeholder=\"e.g. Sales Team Inbox, Support Mailbox\"\n              className=\"mt-1 w-full px-3 py-2 text-sm rounded-md border border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]\"\n            />\n            <p className=\"mt-1 text-xs text-[var(--muted-foreground)]\">\n              A friendly name to identify this connection. Defaults to &ldquo;Default&rdquo; if left blank.\n            </p>\n          </div>\n\n          <div>\n            <label className=\"text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider\">\n              Azure Tenant ID <span className=\"text-red-500\">*</span>\n            </label>\n            <input\n              type=\"text\"\n              value={azureTenantId}\n              onChange={(e) => setAzureTenantId(e.target.value)}\n              placeholder=\"e.g. 12345678-abcd-1234-abcd-123456789abc\"\n              className=\"mt-1 w-full px-3 py-2 text-sm rounded-md border border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--ring)]\"\n            />\n            <p className=\"mt-1 text-xs text-[var(--muted-foreground)]\">\n              Found in Azure Portal &rarr; Azure Active Directory &rarr; Overview &rarr; Tenant ID\n            </p>\n          </div>\n\n          <div>\n            <label className=\"text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider\">\n              Application (Client) ID <span className=\"text-red-500\">*</span>\n            </label>\n            <input\n              type=\"text\"\n              value={clientId}\n              onChange={(e) => setClientId(e.target.value)}\n              placeholder=\"e.g. 12345678-abcd-1234-abcd-123456789abc\"\n              className=\"mt-1 w-full px-3 py-2 text-sm rounded-md border border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--ring)]\"\n            />\n            <p className=\"mt-1 text-xs text-[var(--muted-foreground)]\">\n              Found in Azure Portal &rarr; App registrations &rarr; Your app &rarr; Application (client) ID\n            </p>\n          </div>\n\n          <div>\n            <label className=\"text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider\">\n              Client Secret <span className=\"text-red-500\">*</span>\n            </label>\n            <input\n              type=\"password\"\n              value={clientSecret}\n              onChange={(e) => setClientSecret(e.target.value)}\n              placeholder=\"Paste the client secret value\"\n              className=\"mt-1 w-full px-3 py-2 text-sm rounded-md border border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]\"\n            />\n            <p className=\"mt-1 text-xs text-[var(--muted-foreground)]\">\n              Found in Azure Portal &rarr; App registrations &rarr; Your app &rarr; Certificates &amp; secrets\n            </p>\n          </div>\n\n          <div className=\"flex gap-2\">\n            <button\n              onClick={handleSave}\n              disabled={saving || !azureTenantId.trim() || !clientId.trim() || !clientSecret.trim()}\n              className=\"px-4 py-2 text-sm font-medium rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50\"\n            >\n              {saving ? \"Saving...\" : \"Save Connection\"}\n            </button>\n            <button\n              onClick={() => {\n                setShowForm(false);\n                setLabel(\"\");\n                setAzureTenantId(\"\");\n                setClientId(\"\");\n                setClientSecret(\"\");\n              }}\n              className=\"px-4 py-2 text-sm font-medium rounded-md border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors\"\n            >\n              Cancel\n            </button>\n          </div>\n        </div>\n      )}\n\n      {error && (\n        <div className=\"p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-600\">\n          {error}\n        </div>\n      )}\n      {success && (\n        <div className=\"p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-green-600\">\n          {success}\n        </div>\n      )}\n    </div>\n  );\n}"
}
Now update the `GraphSubscriptionManager` to accept credentials and require selecting one:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "old_string": "function GraphSubscriptionManager({\n  graphWebhookUrl,\n  credentialsConfigured,\n}: {\n  graphWebhookUrl: string;\n  credentialsConfigured: boolean;\n}) {\n  const [mailbox, setMailbox] = useState(\"\");\n  const [clientState, setClientState] = useState(\"\");\n  const [creating, setCreating] = useState(false);\n  const [error, setError] = useState<string | null>(null);\n  const [success, setSuccess] = useState<string | null>(null);\n  const [subscriptions, setSubscriptions] = useState<GraphSubscription[]>([]);\n  const [loadingSubs, setLoadingSubs] = useState(true);\n\n  const fetchSubscriptions = useCallback(async () => {\n    try {\n      setLoadingSubs(true);\n      const res = await fetch(\"/api/graph/subscriptions\");\n      if (!res.ok) throw new Error(\"Failed to fetch\");\n      const data = await res.json();\n      setSubscriptions(data.subscriptions || []);\n    } catch {\n      // Silently fail — subscriptions list is supplementary\n    } finally {\n      setLoadingSubs(false);\n    }\n  }, []);\n\n  useEffect(() => {\n    fetchSubscriptions();\n  }, [fetchSubscriptions]);\n\n  const handleCreate = async () => {\n    setCreating(true);\n    setError(null);\n    setSuccess(null);\n    try {\n      const res = await fetch(\"/api/graph/subscriptions\", {\n        method: \"POST\",\n        headers: { \"Content-Type\": \"application/json\" },\n        body: JSON.stringify({\n          mailbox: mailbox.trim(),\n          clientState: clientState.trim() || undefined,\n        }),\n      });\n      const data = await res.json();\n      if (!res.ok) {\n        setError(data.detail || data.error || \"Failed to create subscription\");\n        return;\n      }\n      setSuccess(\n        `Subscription created (ID: ${data.subscription.subscriptionId.slice(0, 8)}...). Expires: ${new Date(data.subscription.expirationDateTime).toLocaleString()}`\n      );\n      setClientState(\"\");\n      setTimeout(() => setSuccess(null), 8000);\n      await fetchSubscriptions();\n    } catch {\n      setError(\"Failed to create subscription\");\n    } finally {\n      setCreating(false);\n    }\n  };\n\n  const handleDelete = async (subscriptionId: string) => {\n    setError(null);\n    setSuccess(null);\n    try {\n      const res = await fetch(\"/api/graph/subscriptions\", {\n        method: \"DELETE\",\n        headers: { \"Content-Type\": \"application/json\" },\n        body: JSON.stringify({ subscriptionId }),\n      });\n      if (!res.ok) throw new Error(\"Failed to delete\");\n      setSuccess(\"Subscription deleted\");\n      setTimeout(() => setSuccess(null), 3000);\n      await fetchSubscriptions();\n    } catch {\n      setError(\"Failed to delete subscription\");\n    }\n  };\n\n  const isExpired = (dateStr: string) => new Date(dateStr) < new Date();\n\n  return (\n    <div className=\"space-y-6\">\n      {/* Create subscription form */}\n      <div className=\"p-5 rounded-lg border border-[var(--border)] bg-[var(--secondary)]/50 space-y-4\">\n        {!credentialsConfigured && (\n          <div className=\"p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-amber-600\">\n            Configure your Azure AD credentials above before creating a subscription.\n          </div>\n        )}\n\n        <div className=\"grid grid-cols-1 sm:grid-cols-2 gap-4\">\n          <div>\n            <label className=\"text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider\">\n              Mailbox Email <span className=\"text-red-500\">*</span>\n            </label>\n            <input\n              type=\"email\"\n              value={mailbox}\n              onChange={(e) => setMailbox(e.target.value)}\n              placeholder=\"user@yourdomain.com\"\n              className=\"mt-1 w-full px-3 py-2 text-sm rounded-md border border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--ring)]\"\n            />\n            <p className=\"mt-1 text-xs text-[var(--muted-foreground)]\">\n              The Microsoft 365 mailbox to monitor for new emails.\n            </p>\n          </div>\n          <div>\n            <label className=\"text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider\">\n              Client State{\" \"}\n              <span className=\"normal-case font-normal\">(optional)</span>\n            </label>\n            <input\n              type=\"text\"\n              value={clientState}\n              onChange={(e) => setClientState(e.target.value)}\n              placeholder=\"Auto-generated if empty\"\n              className=\"mt-1 w-full px-3 py-2 text-sm rounded-md border border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--ring)]\"\n            />\n          </div>\n        </div>\n\n        {mailbox.trim() && (\n          <div>\n            <label className=\"text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider\">\n              Resource\n            </label>\n            <div className=\"mt-1 flex items-center p-2 rounded-md bg-[var(--secondary)] border border-[var(--border)]\">\n              <code className=\"flex-1 text-sm text-[var(--muted-foreground)] break-all\">\n                users/{mailbox.trim()}/mailFolders/inbox/messages\n              </code>\n            </div>\n          </div>\n        )}\n\n        <div>\n          <label className=\"text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider\">\n            Notification URL\n          </label>\n          <div className=\"mt-1 flex items-center p-2 rounded-md bg-[var(--secondary)] border border-[var(--border)]\">\n            <code className=\"flex-1 text-sm text-[var(--muted-foreground)] break-all\">\n              {graphWebhookUrl}\n            </code>\n          </div>\n          <p className=\"mt-1 text-xs text-[var(--muted-foreground)]\">\n            Set automatically. Expiration is set to ~3 days (the maximum for\n            mail resources).\n          </p>\n        </div>\n\n        {error && (\n          <div className=\"p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-600\">\n            {error}\n          </div>\n        )}\n        {success && (\n          <div className=\"p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-green-600\">\n            {success}\n          </div>\n        )}\n\n        <button\n          onClick={handleCreate}\n          disabled={creating || !credentialsConfigured || !mailbox.trim()}\n          className=\"px-4 py-2 text-sm font-medium rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50\"\n        >\n          {creating ? \"Creating...\" : \"Create Subscription\"}\n        </button>\n      </div>\n\n      {/* Active subscriptions list */}\n      <div>\n        <h4 className=\"text-sm font-semibold text-[var(--foreground)] mb-3\">\n          Active Subscriptions\n        </h4>\n        {loadingSubs ? (\n          <div className=\"p-4 rounded-lg bg-[var(--secondary)] border border-[var(--border)] text-sm text-[var(--muted-foreground)]\">\n            Loading...\n          </div>\n        ) : subscriptions.length === 0 ? (\n          <div className=\"p-4 rounded-lg bg-[var(--secondary)] border border-[var(--border)] text-sm text-[var(--muted-foreground)]\">\n            No active subscriptions. Create one above to start receiving email\n            notifications.\n          </div>\n        ) : (\n          <div className=\"space-y-2\">\n            {subscriptions.map((sub) => (\n              <div\n                key={sub.id}\n                className=\"flex items-center gap-3 p-3 rounded-lg bg-[var(--secondary)] border border-[var(--border)]\"\n              >\n                <div className=\"flex-1 min-w-0\">\n                  <div className=\"flex items-center gap-2\">\n                    <code className=\"text-xs text-[var(--foreground)] font-mono truncate\">\n                      {sub.subscriptionId}\n                    </code>\n                    {isExpired(sub.expirationDateTime) && (\n                      <span className=\"shrink-0 px-1.5 py-0.5 text-[10px] font-semibold rounded bg-red-500/10 text-red-600 uppercase\">\n                        Expired\n                      </span>\n                    )}\n                  </div>\n                  <p className=\"text-xs text-[var(--muted-foreground)] mt-1\">\n                    {sub.resource} &middot; {sub.changeType} &middot; Expires{\" \"}\n                    {new Date(sub.expirationDateTime).toLocaleString()}\n                  </p>\n                </div>\n                <button\n                  onClick={() => handleDelete(sub.subscriptionId)}\n                  className=\"shrink-0 px-3 py-1.5 text-xs font-medium rounded-md border border-red-500/30 text-red-600 hover:bg-red-500/10 transition-colors\"\n                >\n                  Delete\n                </button>\n              </div>\n            ))}\n          </div>\n        )}\n      </div>\n    </div>\n  );\n}",
  "new_string": "function GraphSubscriptionManager({\n  graphWebhookUrl,\n  credentials,\n}: {\n  graphWebhookUrl: string;\n  credentials: GraphCredential[];\n}) {\n  const [selectedCredentialId, setSelectedCredentialId] = useState(\"\");\n  const [mailbox, setMailbox] = useState(\"\");\n  const [clientState, setClientState] = useState(\"\");\n  const [creating, setCreating] = useState(false);\n  const [error, setError] = useState<string | null>(null);\n  const [success, setSuccess] = useState<string | null>(null);\n  const [subscriptions, setSubscriptions] = useState<GraphSubscription[]>([]);\n  const [loadingSubs, setLoadingSubs] = useState(true);\n\n  // Auto-select the first credential when credentials load\n  useEffect(() => {\n    if (credentials.length > 0 && !selectedCredentialId) {\n      setSelectedCredentialId(credentials[0].id);\n    }\n    // Clear selection if the selected credential was removed\n    if (selectedCredentialId && !credentials.find((c) => c.id === selectedCredentialId)) {\n      setSelectedCredentialId(credentials[0]?.id || \"\");\n    }\n  }, [credentials, selectedCredentialId]);\n\n  const fetchSubscriptions = useCallback(async () => {\n    try {\n      setLoadingSubs(true);\n      const res = await fetch(\"/api/graph/subscriptions\");\n      if (!res.ok) throw new Error(\"Failed to fetch\");\n      const data = await res.json();\n      setSubscriptions(data.subscriptions || []);\n    } catch {\n      // Silently fail — subscriptions list is supplementary\n    } finally {\n      setLoadingSubs(false);\n    }\n  }, []);\n\n  useEffect(() => {\n    fetchSubscriptions();\n  }, [fetchSubscriptions]);\n\n  const handleCreate = async () => {\n    setCreating(true);\n    setError(null);\n    setSuccess(null);\n    try {\n      const res = await fetch(\"/api/graph/subscriptions\", {\n        method: \"POST\",\n        headers: { \"Content-Type\": \"application/json\" },\n        body: JSON.stringify({\n          credentialId: selectedCredentialId,\n          mailbox: mailbox.trim(),\n          clientState: clientState.trim() || undefined,\n        }),\n      });\n      const data = await res.json();\n      if (!res.ok) {\n        setError(data.detail || data.error || \"Failed to create subscription\");\n        return;\n      }\n      setSuccess(\n        `Subscription created (ID: ${data.subscription.subscriptionId.slice(0, 8)}...). Expires: ${new Date(data.subscription.expirationDateTime).toLocaleString()}`\n      );\n      setClientState(\"\");\n      setTimeout(() => setSuccess(null), 8000);\n      await fetchSubscriptions();\n    } catch {\n      setError(\"Failed to create subscription\");\n    } finally {\n      setCreating(false);\n    }\n  };\n\n  const handleDelete = async (subscriptionId: string) => {\n    setError(null);\n    setSuccess(null);\n    try {\n      const res = await fetch(\"/api/graph/subscriptions\", {\n        method: \"DELETE\",\n        headers: { \"Content-Type\": \"application/json\" },\n        body: JSON.stringify({ subscriptionId }),\n      });\n      if (!res.ok) throw new Error(\"Failed to delete\");\n      setSuccess(\"Subscription deleted\");\n      setTimeout(() => setSuccess(null), 3000);\n      await fetchSubscriptions();\n    } catch {\n      setError(\"Failed to delete subscription\");\n    }\n  };\n\n  const isExpired = (dateStr: string) => new Date(dateStr) < new Date();\n\n  const getCredentialLabel = (credentialId: string | null) => {\n    if (!credentialId) return null;\n    return credentials.find((c) => c.id === credentialId)?.label || null;\n  };\n\n  return (\n    <div className=\"space-y-6\">\n      {/* Create subscription form */}\n      <div className=\"p-5 rounded-lg border border-[var(--border)] bg-[var(--secondary)]/50 space-y-4\">\n        {credentials.length === 0 && (\n          <div className=\"p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-amber-600\">\n            Add at least one Azure AD connection above before creating a subscription.\n          </div>\n        )}\n\n        {credentials.length > 0 && (\n          <div>\n            <label className=\"text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider\">\n              Connection <span className=\"text-red-500\">*</span>\n            </label>\n            <select\n              value={selectedCredentialId}\n              onChange={(e) => setSelectedCredentialId(e.target.value)}\n              className=\"mt-1 w-full px-3 py-2 text-sm rounded-md border border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]\"\n            >\n              {credentials.map((cred) => (\n                <option key={cred.id} value={cred.id}>\n                  {cred.label} ({cred.azureTenantId.slice(0, 8)}...)\n                </option>\n              ))}\n            </select>\n            <p className=\"mt-1 text-xs text-[var(--muted-foreground)]\">\n              Select which Azure AD connection to use for this subscription.\n            </p>\n          </div>\n        )}\n\n        <div className=\"grid grid-cols-1 sm:grid-cols-2 gap-4\">\n          <div>\n            <label className=\"text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider\">\n              Mailbox Email <span className=\"text-red-500\">*</span>\n            </label>\n            <input\n              type=\"email\"\n              value={mailbox}\n              onChange={(e) => setMailbox(e.target.value)}\n              placeholder=\"user@yourdomain.com\"\n              className=\"mt-1 w-full px-3 py-2 text-sm rounded-md border border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--ring)]\"\n            />\n            <p className=\"mt-1 text-xs text-[var(--muted-foreground)]\">\n              The Microsoft 365 mailbox to monitor for new emails.\n            </p>\n          </div>\n          <div>\n            <label className=\"text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider\">\n              Client State{\" \"}\n              <span className=\"normal-case font-normal\">(optional)</span>\n            </label>\n            <input\n              type=\"text\"\n              value={clientState}\n              onChange={(e) => setClientState(e.target.value)}\n              placeholder=\"Auto-generated if empty\"\n              className=\"mt-1 w-full px-3 py-2 text-sm rounded-md border border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--ring)]\"\n            />\n          </div>\n        </div>\n\n        {mailbox.trim() && (\n          <div>\n            <label className=\"text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider\">\n              Resource\n            </label>\n            <div className=\"mt-1 flex items-center p-2 rounded-md bg-[var(--secondary)] border border-[var(--border)]\">\n              <code className=\"flex-1 text-sm text-[var(--muted-foreground)] break-all\">\n                users/{mailbox.trim()}/mailFolders/inbox/messages\n              </code>\n            </div>\n          </div>\n        )}\n\n        <div>\n          <label className=\"text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider\">\n            Notification URL\n          </label>\n          <div className=\"mt-1 flex items-center p-2 rounded-md bg-[var(--secondary)] border border-[var(--border)]\">\n            <code className=\"flex-1 text-sm text-[var(--muted-foreground)] break-all\">\n              {graphWebhookUrl}\n            </code>\n          </div>\n          <p className=\"mt-1 text-xs text-[var(--muted-foreground)]\">\n            Set automatically. Expiration is set to ~3 days (the maximum for\n            mail resources).\n          </p>\n        </div>\n\n        {error && (\n          <div className=\"p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-600\">\n            {error}\n          </div>\n        )}\n        {success && (\n          <div className=\"p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-green-600\">\n            {success}\n          </div>\n        )}\n\n        <button\n          onClick={handleCreate}\n          disabled={creating || credentials.length === 0 || !selectedCredentialId || !mailbox.trim()}\n          className=\"px-4 py-2 text-sm font-medium rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50\"\n        >\n          {creating ? \"Creating...\" : \"Create Subscription\"}\n        </button>\n      </div>\n\n      {/* Active subscriptions list */}\n      <div>\n        <h4 className=\"text-sm font-semibold text-[var(--foreground)] mb-3\">\n          Active Subscriptions\n        </h4>\n        {loadingSubs ? (\n          <div className=\"p-4 rounded-lg bg-[var(--secondary)] border border-[var(--border)] text-sm text-[var(--muted-foreground)]\">\n            Loading...\n          </div>\n        ) : subscriptions.length === 0 ? (\n          <div className=\"p-4 rounded-lg bg-[var(--secondary)] border border-[var(--border)] text-sm text-[var(--muted-foreground)]\">\n            No active subscriptions. Create one above to start receiving email\n            notifications.\n          </div>\n        ) : (\n          <div className=\"space-y-2\">\n            {subscriptions.map((sub) => (\n              <div\n                key={sub.id}\n                className=\"flex items-center gap-3 p-3 rounded-lg bg-[var(--secondary)] border border-[var(--border)]\"\n              >\n                <div className=\"flex-1 min-w-0\">\n                  <div className=\"flex items-center gap-2\">\n                    <code className=\"text-xs text-[var(--foreground)] font-mono truncate\">\n                      {sub.subscriptionId}\n                    </code>\n                    {isExpired(sub.expirationDateTime) && (\n                      <span className=\"shrink-0 px-1.5 py-0.5 text-[10px] font-semibold rounded bg-red-500/10 text-red-600 uppercase\">\n                        Expired\n                      </span>\n                    )}\n                    {getCredentialLabel(sub.credentialId) && (\n                      <span className=\"shrink-0 px-1.5 py-0.5 text-[10px] font-medium rounded bg-blue-500/10 text-blue-600\">\n                        {getCredentialLabel(sub.credentialId)}\n                      </span>\n                    )}\n                  </div>\n                  <p className=\"text-xs text-[var(--muted-foreground)] mt-1\">\n                    {sub.resource} &middot; {sub.changeType} &middot; Expires{\" \"}\n                    {new Date(sub.expirationDateTime).toLocaleString()}\n                  </p>\n                </div>\n                <button\n                  onClick={() => handleDelete(sub.subscriptionId)}\n                  className=\"shrink-0 px-3 py-1.5 text-xs font-medium rounded-md border border-red-500/30 text-red-600 hover:bg-red-500/10 transition-colors\"\n                >\n                  Delete\n                </button>\n              </div>\n            ))}\n          </div>\n        )}\n      </div>\n    </div>\n  );\n}"
}
I see the linter updated the webhook route to use a different pattern with `after()` for async processing, `fetchGraphMessage` and `extractUserFromResource` from `@/lib/graph/messages`, and `updateEmailByMessageId` from `@/lib/email/emails`. These files don't exist yet — I need to create them. Let me also update the parent component that passes props to these components.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "old_string": "export function IntegrationsClient({ tenantId }: { tenantId: string }) {\n  const [activeTab, setActiveTab] = useState<TabId>(\"microsoft365\");\n  const [graphCredentialsConfigured, setGraphCredentialsConfigured] = useState(false);\n  const origin = typeof window !== \"undefined\" ? window.location.origin : \"https://your-domain.com\";",
  "new_string": "export function IntegrationsClient({ tenantId }: { tenantId: string }) {\n  const [activeTab, setActiveTab] = useState<TabId>(\"microsoft365\");\n  const [graphCredentials, setGraphCredentials] = useState<GraphCredential[]>([]);\n  const origin = typeof window !== \"undefined\" ? window.location.origin : \"https://your-domain.com\";"
}
Now update the Graph tab section where it renders the components:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "old_string": "                      <GraphCredentialsManager onStatusChange={setGraphCredentialsConfigured} />",
  "new_string": "                      <GraphCredentialsManager onCredentialsChange={setGraphCredentials} />"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "old_string": "                      <GraphSubscriptionManager graphWebhookUrl={graphWebhookUrl} credentialsConfigured={graphCredentialsConfigured} />",
  "new_string": "                      <GraphSubscriptionManager graphWebhookUrl={graphWebhookUrl} credentials={graphCredentials} />"
}
Now I need to create the missing files that the linter-modified webhook route expects. Let me create `lib/graph/messages.ts` and add `updateEmailByMessageId` to `lib/email/emails.ts`.

🔧 Tool: Write
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\graph\\messages.ts",
  "content": "/**\n * Fetch a full email message from Microsoft Graph API.\n *\n * Uses the /users/{mailbox}/messages/{messageId} endpoint\n * which requires application-level (client_credentials) auth.\n */\nexport async function fetchGraphMessage(\n  mailboxUser: string,\n  messageId: string,\n  accessToken: string\n): Promise<{\n  from: string;\n  to: string[];\n  cc: string[];\n  subject: string;\n  bodyPlainText: string;\n  bodyHtml: string;\n  receivedDateTime: string;\n} | null> {\n  const url = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(mailboxUser)}/messages/${encodeURIComponent(messageId)}?$select=from,toRecipients,ccRecipients,subject,body,bodyPreview,receivedDateTime`;\n\n  try {\n    const res = await fetch(url, {\n      headers: { Authorization: `Bearer ${accessToken}` },\n    });\n    if (!res.ok) {\n      console.warn(`[Graph] Failed to fetch message ${messageId}: ${res.status}`);\n      return null;\n    }\n    const msg = await res.json();\n\n    const extractEmail = (r: { emailAddress?: { address?: string } }) =>\n      r?.emailAddress?.address || \"\";\n\n    return {\n      from: msg.from?.emailAddress?.address || \"\",\n      to: (msg.toRecipients || []).map(extractEmail).filter(Boolean),\n      cc: (msg.ccRecipients || []).map(extractEmail).filter(Boolean),\n      subject: msg.subject || \"\",\n      bodyPlainText: msg.bodyPreview || \"\",\n      bodyHtml: msg.body?.contentType === \"html\" ? msg.body.content || \"\" : \"\",\n      receivedDateTime: msg.receivedDateTime || new Date().toISOString(),\n    };\n  } catch (err) {\n    console.warn(`[Graph] Error fetching message ${messageId}:`, err);\n    return null;\n  }\n}\n\n/**\n * Extract the user/mailbox portion from a Graph subscription resource path.\n * e.g. \"users/user@domain.com/mailFolders/inbox/messages\" -> \"user@domain.com\"\n */\nexport function extractUserFromResource(resource: string): string | null {\n  const parts = resource.split(\"/\");\n  const usersIdx = parts.indexOf(\"users\");\n  if (usersIdx !== -1 && usersIdx + 1 < parts.length) {\n    return parts[usersIdx + 1];\n  }\n  return null;\n}\n"
}

🔧 Tool: Glob
Input: {
  "pattern": "lib/graph/messages.ts",
  "path": "C:\\Code\\Krisp"
}
The file already exists — the linter must have created it. Let me read it.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\graph\\messages.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\webhooks\\email\\graph\\[tenantId]\\route.ts"
}
Good — the linter created a much better version of the webhook handler using Next.js `after()` for async processing. Now I need to add the `updateEmailByMessageId` function to `lib/email/emails.ts`. Let me also check the `EmailWebhookPayload` type to make sure it has the right fields.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\types\\email.ts"
}
Now add `updateEmailByMessageId` to `lib/email/emails.ts`:

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\email\\emails.ts"
}
The linter already added `updateEmailByMessageId` to `lib/email/emails.ts` and created `lib/graph/messages.ts`. Both look correct. The webhook handler is also updated with the `after()` pattern for async email fetching.

Now let me mark the UI task as complete and move on to generating the migration and verifying compilation.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Update DB schema: remove unique constraint on graphCredentials.tenantId, add label/name column",
      "status": "completed",
      "activeForm": "Updating DB schema for multiple credentials per tenant"
    },
    {
      "content": "Add credentialId column to graphSubscriptions table",
      "status": "completed",
      "activeForm": "Adding credentialId FK to graphSubscriptions"
    },
    {
      "content": "Update lib/graph/credentials.ts for multi-credential CRUD operations",
      "status": "completed",
      "activeForm": "Updating credentials library for multi-credential support"
    },
    {
      "content": "Update lib/graph/subscriptions.ts to link subscriptions to credentials",
      "status": "completed",
      "activeForm": "Updating subscriptions library for credential linking"
    },
    {
      "content": "Update /api/graph/credentials route for multi-credential CRUD",
      "status": "completed",
      "activeForm": "Updating credentials API route"
    },
    {
      "content": "Update /api/graph/subscriptions route to use credentialId",
      "status": "completed",
      "activeForm": "Updating subscriptions API route"
    },
    {
      "content": "Update webhook handler to look up credential via subscription",
      "status": "completed",
      "activeForm": "Updating webhook handler for credential lookup"
    },
    {
      "content": "Update IntegrationsClient.tsx UI for managing multiple connections",
      "status": "completed",
      "activeForm": "Updating admin UI for multiple Graph connections"
    },
    {
      "content": "Generate Drizzle migration and verify TypeScript compilation",
      "status": "in_progress",
      "activeForm": "Generating migration and verifying types"
    }
  ]
}
Let me first check the existing migrations to understand the naming pattern, then generate the new migration.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\drizzle\\migrations\\meta\\_journal.json"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\drizzle.config.ts"
}
Let me check if there's a `.env` file or `.env.local` we can use for the DATABASE_URL:

🔧 Tool: Glob
Input: {
  "pattern": ".env*",
  "path": "C:\\Code\\Krisp"
}

🔧 Tool: Bash
Input: {
  "command": "cd \"C:\\Code\\Krisp\" && grep \"^DATABASE_URL\" .env.local 2>/dev/null | head -1 | cut -c1-30",
  "description": "Check if DATABASE_URL is set in .env.local"
}
Good, the DATABASE_URL exists. Let me read the last migration to understand what was already applied:

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\drizzle\\migrations\\0003_add_graph_credentials.sql"
}
Now let me generate the migration. The changes are:
1. Drop unique index `uq_graph_credentials_tenant`, replace with regular index `idx_graph_credentials_tenant`
2. Add `label` column to `graph_credentials`
3. Add `credential_id` column to `graph_subscriptions` with FK and index

🔧 Tool: Bash
Input: {
  "command": "cd \"C:\\Code\\Krisp\" && source .env.local && npx drizzle-kit generate 2>&1",
  "description": "Generate Drizzle migration for multi-connection schema changes",
  "timeout": 30000
}
Let me verify the generated migration:

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\drizzle\\migrations\\0004_vengeful_black_crow.sql"
}
The migration looks like it's trying to CREATE the `graph_credentials` table again (it already exists from migration 0003). This is because drizzle-kit generated it as a full diff. The migration will fail on the CREATE TABLE since it already exists. I need to manually write the migration to only include the incremental changes: drop the unique index, add the `label` column, add `credential_id` to subscriptions, and create the new indexes.

🔧 Tool: Write
Input: {
  "file_path": "C:\\Code\\Krisp\\drizzle\\migrations\\0004_vengeful_black_crow.sql",
  "content": "-- Add label column to graph_credentials for multi-connection support\nALTER TABLE \"graph_credentials\" ADD COLUMN \"label\" varchar(255) DEFAULT 'Default' NOT NULL;\n--> statement-breakpoint\n-- Drop the unique constraint on tenant_id to allow multiple credentials per tenant\nDROP INDEX IF EXISTS \"uq_graph_credentials_tenant\";\n--> statement-breakpoint\n-- Add a regular index on tenant_id for query performance\nCREATE INDEX \"idx_graph_credentials_tenant\" ON \"graph_credentials\" USING btree (\"tenant_id\");\n--> statement-breakpoint\n-- Add credential_id column to graph_subscriptions to link subscriptions to credentials\nALTER TABLE \"graph_subscriptions\" ADD COLUMN \"credential_id\" uuid;\n--> statement-breakpoint\n-- Add FK constraint from graph_subscriptions.credential_id to graph_credentials.id\nALTER TABLE \"graph_subscriptions\" ADD CONSTRAINT \"graph_subscriptions_credential_id_graph_credentials_id_fk\" FOREIGN KEY (\"credential_id\") REFERENCES \"public\".\"graph_credentials\"(\"id\") ON DELETE set null ON UPDATE no action;\n--> statement-breakpoint\n-- Add index on credential_id for performance\nCREATE INDEX \"idx_graph_subscriptions_credential\" ON \"graph_subscriptions\" USING btree (\"credential_id\");\n"
}
Now let me verify TypeScript compilation:

🔧 Tool: Bash
Input: {
  "command": "cd \"C:\\Code\\Krisp\" && npx tsc --noEmit 2>&1 | head -80",
  "description": "TypeScript type check",
  "timeout": 120000
}
TypeScript compiles cleanly with no errors. Let me now also update the migration journal to properly reflect the new migration entry:

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\drizzle\\migrations\\meta\\_journal.json"
}
The journal already has the entry. Let me also check that the snapshot file was updated (drizzle-kit generates these):

🔧 Tool: Glob
Input: {
  "pattern": "drizzle/migrations/meta/0004_snapshot.json",
  "path": "C:\\Code\\Krisp"
}
Good. Everything is in place. Let me mark the last task complete.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Update DB schema: remove unique constraint on graphCredentials.tenantId, add label/name column",
      "status": "completed",
      "activeForm": "Updating DB schema for multiple credentials per tenant"
    },
    {
      "content": "Add credentialId column to graphSubscriptions table",
      "status": "completed",
      "activeForm": "Adding credentialId FK to graphSubscriptions"
    },
    {
      "content": "Update lib/graph/credentials.ts for multi-credential CRUD operations",
      "status": "completed",
      "activeForm": "Updating credentials library for multi-credential support"
    },
    {
      "content": "Update lib/graph/subscriptions.ts to link subscriptions to credentials",
      "status": "completed",
      "activeForm": "Updating subscriptions library for credential linking"
    },
    {
      "content": "Update /api/graph/credentials route for multi-credential CRUD",
      "status": "completed",
      "activeForm": "Updating credentials API route"
    },
    {
      "content": "Update /api/graph/subscriptions route to use credentialId",
      "status": "completed",
      "activeForm": "Updating subscriptions API route"
    },
    {
      "content": "Update webhook handler to look up credential via subscription",
      "status": "completed",
      "activeForm": "Updating webhook handler for credential lookup"
    },
    {
      "content": "Update IntegrationsClient.tsx UI for managing multiple connections",
      "status": "completed",
      "activeForm": "Updating admin UI for multiple Graph connections"
    },
    {
      "content": "Generate Drizzle migration and verify TypeScript compilation",
      "status": "completed",
      "activeForm": "Generating migration and verifying types"
    }
  ]
}
All done. Here's a summary of what was implemented:

## Multi-Connection Microsoft Graph Support

### Schema Changes (`lib/db/schema.ts`)
- **`graphCredentials`**: Removed unique constraint on `tenantId` (was `uq_graph_credentials_tenant`), replaced with a regular index. Added `label` column for friendly connection names (e.g., "Sales Inbox", "Support Mailbox")
- **`graphSubscriptions`**: Added `credentialId` column (nullable UUID FK to `graphCredentials.id`, `ON DELETE SET NULL`) with index

### Backend (`lib/graph/`)
- **`credentials.ts`**: Rewrote from single-credential (upsert) to multi-credential pattern:
  - `createGraphCredentials()` — insert new credential
  - `getAllGraphCredentials(tenantId)` — list all credentials for a user
  - `getGraphCredentialsById(id, tenantId)` — get specific credential (tenant-scoped)
  - `getGraphCredentialsByIdUnsafe(id)` — get by ID without tenant scoping (for webhook handler)
  - `deleteGraphCredentials(id, tenantId)` — delete specific credential
  - `getGraphAccessTokenFromCreds(creds)` — get token from credential object directly
  - `getGraphAccessToken(credentialId, tenantId)` — convenience wrapper
- **`subscriptions.ts`**: Added `credentialId` to `GraphSubscriptionInsert` interface
- **`messages.ts`** (created by linter): `fetchGraphMessage()` and `extractUserFromResource()` for full email content fetching

### API Routes
- **`/api/graph/credentials`**: Now returns a `credentials[]` array (GET), creates new credentials (POST), tests specific credentials by `credentialId` (PUT), deletes by `credentialId` (DELETE)
- **`/api/graph/subscriptions`**: POST now requires `credentialId` in the body to specify which connection to use. DELETE looks up the linked credential for cleanup
- **Webhook handler**: Uses `after()` for async full email fetching via the subscription's linked credential. Inserts stub first, then backfills from Graph API

### UI (`IntegrationsClient.tsx`)
- **GraphCredentialsManager**: Shows a list of all configured connections with test/remove buttons per connection. "Add Connection" form includes a label field
- **GraphSubscriptionManager**: Dropdown to select which connection to use when creating a subscription. Subscription list shows which connection each subscription uses (blue badge)

### Migration
- `drizzle/migrations/0004_vengeful_black_crow.sql` — adds `label` column, drops unique constraint, adds `credential_id` to subscriptions with FK and indexes