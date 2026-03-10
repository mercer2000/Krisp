

I'll start by exploring the existing Outlook integration to understand the current structure before planning the multi-account implementation.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing Outlook integration code",
      "status": "in_progress",
      "activeForm": "Exploring existing Outlook integration code"
    },
    {
      "content": "Plan multi-account implementation approach",
      "status": "pending",
      "activeForm": "Planning multi-account implementation approach"
    },
    {
      "content": "Update database schema for multiple accounts",
      "status": "pending",
      "activeForm": "Updating database schema for multiple accounts"
    },
    {
      "content": "Update OAuth flow to support multiple accounts",
      "status": "pending",
      "activeForm": "Updating OAuth flow for multiple accounts"
    },
    {
      "content": "Update API routes and calendar logic",
      "status": "pending",
      "activeForm": "Updating API routes and calendar logic"
    },
    {
      "content": "Update frontend UI for multi-account management",
      "status": "pending",
      "activeForm": "Updating frontend UI for multi-account management"
    }
  ]
}

🔧 Tool: Task
Input: {
  "description": "Explore Outlook integration code",
  "prompt": "Thoroughly explore the existing Outlook integration in this codebase. I need to understand:\n\n1. All files related to Outlook/Microsoft OAuth and calendar integration\n2. The database schema related to Outlook (any tables storing tokens, accounts, etc.)\n3. The OAuth flow (how tokens are obtained, stored, refreshed)\n4. The calendar API routes and how they fetch/display calendar data\n5. The frontend components that show Outlook calendar data or manage Outlook connections\n6. Any integration settings/admin pages\n\nSearch for files with \"outlook\" in the name, and also search for references to \"microsoft\", \"graph\", \"outlook\", \"calendar\" in the codebase. Read all relevant files fully.\n\nReturn a comprehensive summary with file paths and key code sections.",
  "subagent_type": "Explore"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/*outlook*"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/*calendar*"
}

🔧 Tool: Grep
Input: {
  "pattern": "microsoft|graph\\.microsoft|outlook",
  "type": "ts",
  "output_mode": "files_with_matches"
}

🔧 Tool: Grep
Input: {
  "pattern": "oauth.*outlook|outlook.*oauth",
  "type": "ts",
  "output_mode": "files_with_matches"
}

🔧 Tool: Bash
Input: {
  "command": "find \"C:\\Code\\Krisp\" -name \"*.ts\" -o -name \"*.tsx\" | grep -E \"(outlook|calendar)\" | grep -v node_modules | grep -v \".next\" | grep -v \".worktrees\""
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\outlook\\oauth.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\outlook\\oauth\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\outlook\\oauth\\callback\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\outlook\\calendar.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\outlook\\messages.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\outlook\\calendar\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\outlook\\sync\\route.ts"
}

🔧 Tool: Grep
Input: {
  "pattern": "outlook_oauth_tokens|calendar_events",
  "path": "C:\\Code\\Krisp\\lib\\db\\schema.ts",
  "output_mode": "content"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\calendar\\page.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\hooks\\useCalendar.ts"
}

🔧 Tool: Bash
Input: {
  "command": "wc -l \"C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx\""
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\hooks\\useCalendar.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\outlook\\db.ts"
}

🔧 Tool: Grep
Input: {
  "pattern": "Outlook|outlook",
  "path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "output_mode": "content",
  "context": 3
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\db\\schema.ts",
  "offset": 650,
  "limit": 200
}

🔧 Tool: Bash
Input: {
  "command": "grep -n \"outlook_oauth_tokens\\|CREATE TABLE.*outlook\" \"C:\\Code\\Krisp\\drizzle\\migrations\\0017_add-outlook-oauth.sql\" | head -50"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\drizzle\\migrations\\0017_add-outlook-oauth.sql"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "offset": 1477,
  "limit": 350
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "offset": 3485,
  "limit": 250
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\graph\\calendar.ts"
}

🔧 Tool: Bash
Input: {
  "command": "grep -E \"OAUTH_OUTLOOK|OUTLOOK\" \"C:\\Code\\Krisp\\\\.env.local\" 2>/dev/null || echo \"Not found in .env.local\""
}

🔧 Tool: Bash
Input: {
  "command": "grep -r \"OAUTH_OUTLOOK\" \"C:\\Code\\Krisp\\app\" \"C:\\Code\\Krisp\\lib\" --include=\"*.ts\" --include=\"*.tsx\" | head -20"
}
Now let me read the key files in detail to understand the exact implementation.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\db\\schema.ts",
  "offset": 770,
  "limit": 60
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\outlook\\oauth.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\outlook\\calendar.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\outlook\\oauth\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\outlook\\oauth\\callback\\route.ts"
}
Now let me read the remaining key files.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\outlook\\calendar\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\outlook\\sync\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\outlook\\messages.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\outlook\\db.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\hooks\\useCalendar.ts"
}
Now let me read the frontend integrations page to understand the UI.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "offset": 1470,
  "limit": 300
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\calendar\\page.tsx"
}
Now let me also check the existing migration and calendar_events schema for the credential_id relationship.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\db\\schema.ts",
  "offset": 685,
  "limit": 100
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\drizzle\\migrations\\0017_add-outlook-oauth.sql"
}
Now I have a complete understanding of the codebase. Let me also check the migration journal to understand the migration numbering.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\drizzle\\migrations\\meta\\_journal.json"
}

🔧 Tool: Glob
Input: {
  "pattern": "drizzle/migrations/*.sql",
  "path": "C:\\Code\\Krisp"
}
Now I have a thorough understanding. Let me check the encryption helpers to understand the pattern.

🔧 Tool: Grep
Input: {
  "pattern": "CALENDAR_EVENT_ENCRYPTED_FIELDS",
  "output_mode": "content",
  "context": 2
}
I now have a complete picture of the codebase. Let me plan and start implementing.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing Outlook integration code",
      "status": "completed",
      "activeForm": "Exploring existing Outlook integration code"
    },
    {
      "content": "Plan multi-account implementation approach",
      "status": "completed",
      "activeForm": "Planning multi-account implementation approach"
    },
    {
      "content": "Update database schema for multiple accounts",
      "status": "in_progress",
      "activeForm": "Updating database schema for multiple accounts"
    },
    {
      "content": "Update OAuth flow to support multiple accounts",
      "status": "pending",
      "activeForm": "Updating OAuth flow for multiple accounts"
    },
    {
      "content": "Update API routes for multi-account sync",
      "status": "pending",
      "activeForm": "Updating API routes for multi-account sync"
    },
    {
      "content": "Update calendar sync logic for multi-account",
      "status": "pending",
      "activeForm": "Updating calendar sync logic for multi-account"
    },
    {
      "content": "Update email sync logic for multi-account",
      "status": "pending",
      "activeForm": "Updating email sync logic for multi-account"
    },
    {
      "content": "Update React hooks for multi-account",
      "status": "pending",
      "activeForm": "Updating React hooks for multi-account"
    },
    {
      "content": "Update frontend UI for multi-account management",
      "status": "pending",
      "activeForm": "Updating frontend UI for multi-account management"
    }
  ]
}
Here's my plan:

**Current state**: The `outlook_oauth_tokens` table has a `UNIQUE(tenant_id)` constraint, meaning only one Outlook account per user. The `upsertOutlookTokens` function uses `ON CONFLICT (tenant_id)` to overwrite.

**Multi-account approach**:
1. **Schema**: Change unique constraint from `(tenant_id)` to `(tenant_id, outlook_email)` so each user can have multiple accounts uniquely identified by email
2. **OAuth flow**: Pass an identifier so we know which account we're connecting/disconnecting/syncing
3. **API routes**: Return lists of accounts, accept `accountId` parameter for per-account operations
4. **Frontend**: Show a list of connected accounts, allow adding more, individual sync/disconnect per account

Let me start implementing.

### Step 1: Database Schema Change

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\lib\\db\\schema.ts",
  "old_string": "  (table) => [\n    uniqueIndex(\"uq_outlook_oauth_tenant\").on(table.tenantId),\n    crudPolicy({\n      role: authenticatedRole,\n      read: authUid(table.tenantId),\n      modify: authUid(table.tenantId),\n    }),\n  ]\n);",
  "new_string": "  (table) => [\n    uniqueIndex(\"uq_outlook_oauth_tenant_email\").on(\n      table.tenantId,\n      table.outlookEmail\n    ),\n    index(\"idx_outlook_oauth_tenant\").on(table.tenantId),\n    crudPolicy({\n      role: authenticatedRole,\n      read: authUid(table.tenantId),\n      modify: authUid(table.tenantId),\n    }),\n  ]\n);"
}
Now create the migration SQL.

🔧 Tool: Write
Input: {
  "file_path": "C:\\Code\\Krisp\\drizzle\\migrations\\0026_multi-outlook-accounts.sql",
  "content": "-- Allow multiple Outlook accounts per tenant by changing unique constraint\n-- from (tenant_id) to (tenant_id, outlook_email)\nDROP INDEX IF EXISTS \"uq_outlook_oauth_tenant\";\nCREATE UNIQUE INDEX IF NOT EXISTS \"uq_outlook_oauth_tenant_email\" ON \"outlook_oauth_tokens\" USING btree (\"tenant_id\", \"outlook_email\");\nCREATE INDEX IF NOT EXISTS \"idx_outlook_oauth_tenant\" ON \"outlook_oauth_tokens\" USING btree (\"tenant_id\");\n"
}
Now update the migration journal.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\drizzle\\migrations\\meta\\_journal.json"
}
I see there are migration files 0023-0025 that exist but aren't in the journal. Let me check:

🔧 Tool: Glob
Input: {
  "pattern": "drizzle/migrations/002[3-9]*.sql",
  "path": "C:\\Code\\Krisp"
}
Those migrations exist but aren't in the journal yet. I'll add my migration entry to the journal following the existing pattern. Since those 0023-0025 aren't tracked, I'll add mine as the next entry after 0022.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\drizzle\\migrations\\meta\\_journal.json",
  "old_string": "    {\n      \"idx\": 22,\n      \"version\": \"7\",\n      \"when\": 1772748252573,\n      \"tag\": \"0022_add-row-level-security\",\n      \"breakpoints\": true\n    }\n  ]\n}",
  "new_string": "    {\n      \"idx\": 22,\n      \"version\": \"7\",\n      \"when\": 1772748252573,\n      \"tag\": \"0022_add-row-level-security\",\n      \"breakpoints\": true\n    },\n    {\n      \"idx\": 23,\n      \"version\": \"7\",\n      \"when\": 1772870400000,\n      \"tag\": \"0026_multi-outlook-accounts\",\n      \"breakpoints\": true\n    }\n  ]\n}"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing Outlook integration code",
      "status": "completed",
      "activeForm": "Exploring existing Outlook integration code"
    },
    {
      "content": "Plan multi-account implementation approach",
      "status": "completed",
      "activeForm": "Planning multi-account implementation approach"
    },
    {
      "content": "Update database schema for multiple accounts",
      "status": "completed",
      "activeForm": "Updating database schema for multiple accounts"
    },
    {
      "content": "Update OAuth flow to support multiple accounts",
      "status": "in_progress",
      "activeForm": "Updating OAuth flow for multiple accounts"
    },
    {
      "content": "Update API routes for multi-account sync",
      "status": "pending",
      "activeForm": "Updating API routes for multi-account sync"
    },
    {
      "content": "Update calendar sync logic for multi-account",
      "status": "pending",
      "activeForm": "Updating calendar sync logic for multi-account"
    },
    {
      "content": "Update email sync logic for multi-account",
      "status": "pending",
      "activeForm": "Updating email sync logic for multi-account"
    },
    {
      "content": "Update React hooks for multi-account",
      "status": "pending",
      "activeForm": "Updating React hooks for multi-account"
    },
    {
      "content": "Update frontend UI for multi-account management",
      "status": "pending",
      "activeForm": "Updating frontend UI for multi-account management"
    }
  ]
}
### Step 2: Update OAuth functions in `lib/outlook/oauth.ts`

The key changes:
- `getOutlookTokenForTenant` → `getOutlookTokensForTenant` (returns all accounts)
- `getOutlookTokenById` (get a specific account by ID)
- `upsertOutlookTokens` → change ON CONFLICT to `(tenant_id, outlook_email)`
- `deactivateOutlookToken` → accept account ID instead of tenant ID
- `getValidOutlookAccessToken` → accept account ID
- `updateOutlookLastSync` → accept account ID

🔧 Tool: Write
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\outlook\\oauth.ts",
  "content": "import sql from \"./db\";\n\nexport interface OutlookOauthTokenRow {\n  id: string;\n  tenant_id: string;\n  outlook_email: string;\n  access_token: string;\n  refresh_token: string;\n  token_expiry: string;\n  active: boolean;\n  last_sync_at: string | null;\n  created_at: string;\n  updated_at: string;\n}\n\ninterface MicrosoftTokenResponse {\n  access_token: string;\n  refresh_token: string;\n  expires_in: number;\n  token_type: string;\n  scope: string;\n}\n\nconst MS_TOKEN_URL = \"https://login.microsoftonline.com/common/oauth2/v2.0/token\";\nconst MS_AUTH_URL = \"https://login.microsoftonline.com/common/oauth2/v2.0/authorize\";\n\n/**\n * Build the Microsoft OAuth authorization URL for personal accounts.\n */\nexport function buildOutlookAuthUrl(redirectUri: string, state: string): string {\n  const clientId = process.env.OAUTH_OUTLOOK_CLIENT_ID;\n  if (!clientId) {\n    throw new Error(\"OAUTH_OUTLOOK_CLIENT_ID must be configured\");\n  }\n\n  const params = new URLSearchParams({\n    client_id: clientId,\n    response_type: \"code\",\n    redirect_uri: redirectUri,\n    response_mode: \"query\",\n    scope: \"openid profile email Mail.Read Mail.ReadWrite Calendars.Read offline_access User.Read\",\n    state,\n    prompt: \"consent\",\n  });\n\n  return `${MS_AUTH_URL}?${params.toString()}`;\n}\n\n/**\n * Exchange an authorization code for tokens using Microsoft identity platform.\n */\nexport async function exchangeOutlookCode(\n  code: string,\n  redirectUri: string\n): Promise<MicrosoftTokenResponse> {\n  const clientId = process.env.OAUTH_OUTLOOK_CLIENT_ID;\n  const clientSecret = process.env.OAUTH_OUTLOOK_CLIENT_SECRET;\n  if (!clientId || !clientSecret) {\n    throw new Error(\"OAUTH_OUTLOOK_CLIENT_ID and OAUTH_OUTLOOK_CLIENT_SECRET must be configured\");\n  }\n\n  const response = await fetch(MS_TOKEN_URL, {\n    method: \"POST\",\n    headers: { \"Content-Type\": \"application/x-www-form-urlencoded\" },\n    body: new URLSearchParams({\n      client_id: clientId,\n      client_secret: clientSecret,\n      code,\n      redirect_uri: redirectUri,\n      grant_type: \"authorization_code\",\n    }),\n  });\n\n  if (!response.ok) {\n    const error = await response.text();\n    throw new Error(`Microsoft OAuth token exchange failed: ${error}`);\n  }\n\n  return response.json();\n}\n\n/**\n * Refresh an expired Microsoft access token.\n */\nexport async function refreshOutlookToken(\n  refreshToken: string\n): Promise<MicrosoftTokenResponse> {\n  const clientId = process.env.OAUTH_OUTLOOK_CLIENT_ID;\n  const clientSecret = process.env.OAUTH_OUTLOOK_CLIENT_SECRET;\n  if (!clientId || !clientSecret) {\n    throw new Error(\"OAUTH_OUTLOOK_CLIENT_ID and OAUTH_OUTLOOK_CLIENT_SECRET must be configured\");\n  }\n\n  const response = await fetch(MS_TOKEN_URL, {\n    method: \"POST\",\n    headers: { \"Content-Type\": \"application/x-www-form-urlencoded\" },\n    body: new URLSearchParams({\n      client_id: clientId,\n      client_secret: clientSecret,\n      refresh_token: refreshToken,\n      grant_type: \"refresh_token\",\n      scope: \"openid profile email Mail.Read Mail.ReadWrite Calendars.Read offline_access User.Read\",\n    }),\n  });\n\n  if (!response.ok) {\n    const error = await response.text();\n    throw new Error(`Microsoft token refresh failed: ${error}`);\n  }\n\n  return response.json();\n}\n\n/**\n * Get all active Outlook OAuth token records for a tenant.\n */\nexport async function getOutlookTokensForTenant(\n  tenantId: string\n): Promise<OutlookOauthTokenRow[]> {\n  const rows = await sql`\n    SELECT * FROM outlook_oauth_tokens\n    WHERE tenant_id = ${tenantId} AND active = true\n    ORDER BY created_at ASC\n  `;\n  return rows as OutlookOauthTokenRow[];\n}\n\n/**\n * Get a single active Outlook OAuth token by its ID and tenant.\n */\nexport async function getOutlookTokenById(\n  accountId: string,\n  tenantId: string\n): Promise<OutlookOauthTokenRow | null> {\n  const rows = await sql`\n    SELECT * FROM outlook_oauth_tokens\n    WHERE id = ${accountId} AND tenant_id = ${tenantId} AND active = true\n    LIMIT 1\n  `;\n  return (rows[0] as OutlookOauthTokenRow) || null;\n}\n\n/**\n * @deprecated Use getOutlookTokensForTenant for multi-account support.\n * Get the first active Outlook OAuth token record for a tenant (backwards compat).\n */\nexport async function getOutlookTokenForTenant(\n  tenantId: string\n): Promise<OutlookOauthTokenRow | null> {\n  const rows = await sql`\n    SELECT * FROM outlook_oauth_tokens\n    WHERE tenant_id = ${tenantId} AND active = true\n    LIMIT 1\n  `;\n  return (rows[0] as OutlookOauthTokenRow) || null;\n}\n\n/**\n * Upsert Outlook OAuth tokens for a tenant+email combination.\n * Multiple accounts are allowed per tenant — uniqueness is on (tenant_id, outlook_email).\n */\nexport async function upsertOutlookTokens(params: {\n  tenantId: string;\n  outlookEmail: string;\n  accessToken: string;\n  refreshToken: string;\n  tokenExpiry: Date;\n}): Promise<OutlookOauthTokenRow> {\n  const rows = await sql`\n    INSERT INTO outlook_oauth_tokens (\n      tenant_id,\n      outlook_email,\n      access_token,\n      refresh_token,\n      token_expiry,\n      active\n    ) VALUES (\n      ${params.tenantId},\n      ${params.outlookEmail},\n      ${params.accessToken},\n      ${params.refreshToken},\n      ${params.tokenExpiry.toISOString()},\n      true\n    )\n    ON CONFLICT (tenant_id, outlook_email)\n    DO UPDATE SET\n      access_token = EXCLUDED.access_token,\n      refresh_token = EXCLUDED.refresh_token,\n      token_expiry = EXCLUDED.token_expiry,\n      active = true,\n      updated_at = NOW()\n    RETURNING *\n  `;\n  return rows[0] as OutlookOauthTokenRow;\n}\n\n/**\n * Deactivate a specific Outlook OAuth account by its ID.\n */\nexport async function deactivateOutlookToken(\n  accountId: string,\n  tenantId: string\n): Promise<void> {\n  await sql`\n    UPDATE outlook_oauth_tokens\n    SET active = false, updated_at = NOW()\n    WHERE id = ${accountId} AND tenant_id = ${tenantId}\n  `;\n}\n\n/**\n * Deactivate all Outlook OAuth tokens for a tenant.\n */\nexport async function deactivateAllOutlookTokens(\n  tenantId: string\n): Promise<void> {\n  await sql`\n    UPDATE outlook_oauth_tokens\n    SET active = false, updated_at = NOW()\n    WHERE tenant_id = ${tenantId}\n  `;\n}\n\n/**\n * Update the last_sync_at timestamp for a specific account.\n */\nexport async function updateOutlookLastSync(\n  accountId: string\n): Promise<void> {\n  await sql`\n    UPDATE outlook_oauth_tokens\n    SET last_sync_at = NOW(), updated_at = NOW()\n    WHERE id = ${accountId} AND active = true\n  `;\n}\n\n/**\n * Get a valid access token for a specific Outlook account, refreshing if necessary.\n */\nexport async function getValidOutlookAccessToken(\n  accountId: string,\n  tenantId: string\n): Promise<string> {\n  const token = await getOutlookTokenById(accountId, tenantId);\n  if (!token) {\n    throw new Error(\"No active Outlook OAuth token found for this account\");\n  }\n\n  // Check if token expires within 5 minutes\n  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);\n  if (new Date(token.token_expiry) > fiveMinutesFromNow) {\n    return token.access_token;\n  }\n\n  // Token is expired or about to expire — refresh it\n  try {\n    const refreshed = await refreshOutlookToken(token.refresh_token);\n\n    await upsertOutlookTokens({\n      tenantId: token.tenant_id,\n      outlookEmail: token.outlook_email,\n      accessToken: refreshed.access_token,\n      refreshToken: refreshed.refresh_token,\n      tokenExpiry: new Date(Date.now() + refreshed.expires_in * 1000),\n    });\n\n    return refreshed.access_token;\n  } catch (err) {\n    // Refresh token may be revoked — deactivate so user sees they need to reconnect\n    await deactivateOutlookToken(accountId, tenantId);\n    throw new Error(\n      \"Outlook token refresh failed. Please reconnect your account. \" +\n      (err instanceof Error ? err.message : String(err))\n    );\n  }\n}\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing Outlook integration code",
      "status": "completed",
      "activeForm": "Exploring existing Outlook integration code"
    },
    {
      "content": "Plan multi-account implementation approach",
      "status": "completed",
      "activeForm": "Planning multi-account implementation approach"
    },
    {
      "content": "Update database schema for multiple accounts",
      "status": "completed",
      "activeForm": "Updating database schema for multiple accounts"
    },
    {
      "content": "Update OAuth flow to support multiple accounts",
      "status": "completed",
      "activeForm": "Updating OAuth flow for multiple accounts"
    },
    {
      "content": "Update API routes for multi-account sync",
      "status": "in_progress",
      "activeForm": "Updating API routes for multi-account sync"
    },
    {
      "content": "Update calendar sync logic for multi-account",
      "status": "pending",
      "activeForm": "Updating calendar sync logic for multi-account"
    },
    {
      "content": "Update email sync logic for multi-account",
      "status": "pending",
      "activeForm": "Updating email sync logic for multi-account"
    },
    {
      "content": "Update React hooks for multi-account",
      "status": "pending",
      "activeForm": "Updating React hooks for multi-account"
    },
    {
      "content": "Update frontend UI for multi-account management",
      "status": "pending",
      "activeForm": "Updating frontend UI for multi-account management"
    }
  ]
}
### Step 3: Update API Routes

Now update `app/api/outlook/oauth/route.ts` to return all accounts and support per-account disconnect.

🔧 Tool: Write
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\outlook\\oauth\\route.ts",
  "content": "import { NextRequest, NextResponse } from \"next/server\";\nimport { auth } from \"@/auth\";\nimport {\n  buildOutlookAuthUrl,\n  getOutlookTokensForTenant,\n  deactivateOutlookToken,\n} from \"@/lib/outlook/oauth\";\nimport { randomUUID } from \"crypto\";\n\n/**\n * GET /api/outlook/oauth\n * Returns the current Outlook OAuth connection status (all accounts),\n * or initiates the OAuth flow if ?action=connect is provided.\n */\nexport async function GET(request: NextRequest) {\n  try {\n    const session = await auth();\n    const userId = session?.user?.id;\n    if (!userId) {\n      return NextResponse.json({ error: \"Unauthorized\" }, { status: 401 });\n    }\n\n    const action = request.nextUrl.searchParams.get(\"action\");\n\n    // If action=connect, redirect to Microsoft OAuth\n    if (action === \"connect\") {\n      const origin = request.nextUrl.origin;\n      const redirectUri = `${origin}/api/outlook/oauth/callback`;\n      const state = `${userId}:${randomUUID()}`;\n      const authUrl = buildOutlookAuthUrl(redirectUri, state);\n      return NextResponse.redirect(authUrl);\n    }\n\n    // Otherwise, return connection status for all accounts\n    const tokens = await getOutlookTokensForTenant(userId);\n\n    if (tokens.length === 0) {\n      return NextResponse.json({ connected: false, accounts: [] });\n    }\n\n    const accounts = tokens.map((token) => ({\n      id: token.id,\n      outlookEmail: token.outlook_email,\n      tokenExpiry: token.token_expiry,\n      isExpired: new Date(token.token_expiry) < new Date(),\n      lastSyncAt: token.last_sync_at,\n      createdAt: token.created_at,\n      updatedAt: token.updated_at,\n    }));\n\n    return NextResponse.json({\n      connected: true,\n      accounts,\n    });\n  } catch (error) {\n    console.error(\"Error in Outlook OAuth route:\", error);\n    return NextResponse.json(\n      { error: \"Failed to process request\" },\n      { status: 500 }\n    );\n  }\n}\n\n/**\n * DELETE /api/outlook/oauth\n * Disconnect a specific Outlook account. Requires ?accountId=<uuid>.\n */\nexport async function DELETE(request: NextRequest) {\n  try {\n    const session = await auth();\n    const userId = session?.user?.id;\n    if (!userId) {\n      return NextResponse.json({ error: \"Unauthorized\" }, { status: 401 });\n    }\n\n    const accountId = request.nextUrl.searchParams.get(\"accountId\");\n    if (!accountId) {\n      return NextResponse.json(\n        { error: \"accountId query parameter is required\" },\n        { status: 400 }\n      );\n    }\n\n    await deactivateOutlookToken(accountId, userId);\n\n    return NextResponse.json({\n      message: \"Outlook account disconnected\",\n    });\n  } catch (error) {\n    console.error(\"Error disconnecting Outlook:\", error);\n    return NextResponse.json(\n      { error: \"Failed to disconnect Outlook\" },\n      { status: 500 }\n    );\n  }\n}\n"
}
The callback route is fine since `upsertOutlookTokens` now conflicts on `(tenant_id, outlook_email)` — connecting a new account creates a new row, reconnecting an existing email updates it. No changes needed there.

### Step 4: Update Calendar API route

🔧 Tool: Write
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\outlook\\calendar\\route.ts",
  "content": "import { auth } from \"@/auth\";\nimport { NextRequest, NextResponse } from \"next/server\";\nimport {\n  getValidOutlookAccessToken,\n  getOutlookTokensForTenant,\n  getOutlookTokenById,\n} from \"@/lib/outlook/oauth\";\nimport { syncOutlookCalendarEvents } from \"@/lib/outlook/calendar\";\n\n/**\n * POST /api/outlook/calendar\n * Trigger a calendar sync using the user's Outlook OAuth connection.\n *\n * Body: { accountId?, daysBack?, daysForward? }\n *\n * If accountId is provided, syncs only that account.\n * If omitted, syncs all connected Outlook accounts.\n */\nexport async function POST(request: NextRequest) {\n  try {\n    const session = await auth();\n    const userId = session?.user?.id;\n    if (!userId) {\n      return NextResponse.json({ error: \"Unauthorized\" }, { status: 401 });\n    }\n\n    let body: { accountId?: string; daysBack?: number; daysForward?: number };\n    try {\n      body = await request.json();\n    } catch {\n      body = {};\n    }\n\n    const daysBack = Math.min(body.daysBack ?? 7, 90);\n    const daysForward = Math.min(body.daysForward ?? 30, 180);\n\n    const startDate = new Date();\n    startDate.setDate(startDate.getDate() - daysBack);\n    startDate.setHours(0, 0, 0, 0);\n\n    const endDate = new Date();\n    endDate.setDate(endDate.getDate() + daysForward);\n    endDate.setHours(23, 59, 59, 999);\n\n    // Determine which accounts to sync\n    let accounts: { id: string; outlook_email: string }[];\n    if (body.accountId) {\n      const token = await getOutlookTokenById(body.accountId, userId);\n      if (!token) {\n        return NextResponse.json(\n          { error: \"Outlook account not found or inactive.\" },\n          { status: 400 }\n        );\n      }\n      accounts = [{ id: token.id, outlook_email: token.outlook_email }];\n    } else {\n      const tokens = await getOutlookTokensForTenant(userId);\n      if (tokens.length === 0) {\n        return NextResponse.json(\n          { error: \"No active Outlook connections. Please connect an Outlook account first.\" },\n          { status: 400 }\n        );\n      }\n      accounts = tokens.map((t) => ({ id: t.id, outlook_email: t.outlook_email }));\n    }\n\n    let totalSynced = 0;\n    let totalErrors = 0;\n    const results: { accountId: string; email: string; synced: number; errors: number; error?: string }[] = [];\n\n    for (const account of accounts) {\n      try {\n        const accessToken = await getValidOutlookAccessToken(account.id, userId);\n        const result = await syncOutlookCalendarEvents(\n          userId,\n          account.id,\n          accessToken,\n          startDate,\n          endDate\n        );\n        totalSynced += result.synced;\n        totalErrors += result.errors;\n        results.push({\n          accountId: account.id,\n          email: account.outlook_email,\n          synced: result.synced,\n          errors: result.errors,\n        });\n      } catch (err) {\n        const message = err instanceof Error ? err.message : \"Failed to sync\";\n        results.push({\n          accountId: account.id,\n          email: account.outlook_email,\n          synced: 0,\n          errors: 0,\n          error: message,\n        });\n        totalErrors++;\n      }\n    }\n\n    return NextResponse.json({\n      message: \"Outlook calendar sync complete\",\n      synced: totalSynced,\n      errors: totalErrors,\n      results,\n      range: {\n        start: startDate.toISOString(),\n        end: endDate.toISOString(),\n      },\n    });\n  } catch (error) {\n    console.error(\"Error syncing Outlook calendar:\", error);\n    return NextResponse.json(\n      { error: \"Internal server error\" },\n      { status: 500 }\n    );\n  }\n}\n\n/**\n * GET /api/outlook/calendar\n * Get the Outlook calendar sync status for all connected accounts.\n */\nexport async function GET() {\n  try {\n    const session = await auth();\n    const userId = session?.user?.id;\n    if (!userId) {\n      return NextResponse.json({ error: \"Unauthorized\" }, { status: 401 });\n    }\n\n    const tokens = await getOutlookTokensForTenant(userId);\n\n    if (tokens.length === 0) {\n      return NextResponse.json({ connected: false, accounts: [] });\n    }\n\n    return NextResponse.json({\n      connected: true,\n      accounts: tokens.map((t) => ({\n        id: t.id,\n        outlookEmail: t.outlook_email,\n        lastSyncAt: t.last_sync_at,\n      })),\n    });\n  } catch (error) {\n    console.error(\"Error fetching Outlook calendar status:\", error);\n    return NextResponse.json(\n      { error: \"Internal server error\" },\n      { status: 500 }\n    );\n  }\n}\n"
}
### Step 5: Update calendar sync logic to accept accountId

🔧 Tool: Write
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\outlook\\calendar.ts",
  "content": "import { db } from \"@/lib/db\";\nimport { calendarEvents } from \"@/lib/db/schema\";\nimport {\n  encryptFields,\n  CALENDAR_EVENT_ENCRYPTED_FIELDS,\n} from \"@/lib/db/encryption-helpers\";\nimport type { GraphCalendarEvent } from \"@/lib/graph/calendar\";\nimport { updateOutlookLastSync } from \"./oauth\";\n\nconst GRAPH_BASE = \"https://graph.microsoft.com/v1.0\";\n\n/**\n * Fetch calendar events from the authenticated user's calendar using\n * delegated permissions (/me/calendarView).\n */\nexport async function fetchOutlookCalendarEvents(\n  accessToken: string,\n  startDate: Date,\n  endDate: Date\n): Promise<GraphCalendarEvent[]> {\n  const select = [\n    \"id\",\n    \"subject\",\n    \"bodyPreview\",\n    \"body\",\n    \"start\",\n    \"end\",\n    \"isAllDay\",\n    \"location\",\n    \"organizer\",\n    \"attendees\",\n    \"webLink\",\n    \"isCancelled\",\n    \"showAs\",\n    \"importance\",\n    \"type\",\n    \"seriesMasterId\",\n  ].join(\",\");\n\n  const startISO = startDate.toISOString();\n  const endISO = endDate.toISOString();\n\n  const url = `${GRAPH_BASE}/me/calendarView?startDateTime=${startISO}&endDateTime=${endISO}&$select=${select}&$orderby=start/dateTime asc&$top=250`;\n\n  const allEvents: GraphCalendarEvent[] = [];\n  let nextLink: string | null = url;\n\n  while (nextLink) {\n    const res = await fetch(nextLink, {\n      headers: {\n        Authorization: `Bearer ${accessToken}`,\n        Prefer: 'outlook.timezone=\"UTC\"',\n      },\n    });\n\n    if (!res.ok) {\n      const errorBody = await res.text().catch(() => \"\");\n      console.warn(\n        `[Outlook Calendar] Failed to fetch events: ${res.status}`,\n        errorBody\n      );\n      break;\n    }\n\n    const data: { value?: GraphCalendarEvent[]; \"@odata.nextLink\"?: string } =\n      await res.json();\n    allEvents.push(...(data.value || []));\n    nextLink = data[\"@odata.nextLink\"] || null;\n  }\n\n  return allEvents;\n}\n\n/**\n * Map a Graph calendar event to the database shape.\n * credentialId is null for Outlook delegated-auth syncs.\n */\nfunction mapOutlookEvent(event: GraphCalendarEvent, tenantId: string) {\n  const isRecurring =\n    event.type === \"occurrence\" ||\n    event.type === \"exception\" ||\n    !!event.seriesMasterId;\n\n  return {\n    tenantId,\n    credentialId: null as string | null,\n    graphEventId: event.id,\n    subject: event.subject || null,\n    bodyPreview: event.bodyPreview || null,\n    bodyHtml:\n      event.body?.contentType === \"html\" ? event.body.content || null : null,\n    startDateTime: new Date(\n      event.start.dateTime +\n        (event.start.dateTime.endsWith(\"Z\") ? \"\" : \"Z\")\n    ),\n    endDateTime: new Date(\n      event.end.dateTime +\n        (event.end.dateTime.endsWith(\"Z\") ? \"\" : \"Z\")\n    ),\n    isAllDay: event.isAllDay ?? false,\n    location: event.location?.displayName || null,\n    organizerEmail: event.organizer?.emailAddress?.address || null,\n    organizerName: event.organizer?.emailAddress?.name || null,\n    attendees: (event.attendees || []).map((a) => ({\n      email: a.emailAddress?.address || \"\",\n      name: a.emailAddress?.name || \"\",\n      response: a.status?.response || \"none\",\n      type: a.type || \"required\",\n    })),\n    webLink: event.webLink || null,\n    isCancelled: event.isCancelled ?? false,\n    showAs: event.showAs || null,\n    importance: event.importance || null,\n    isRecurring,\n    seriesMasterId: event.seriesMasterId || null,\n    rawPayload: event as unknown as Record<string, unknown>,\n    lastSyncedAt: new Date(),\n    updatedAt: new Date(),\n  };\n}\n\n/**\n * Sync Outlook calendar events into the database using delegated auth.\n * Uses upsert for deduplication by (tenantId, graphEventId).\n * Stores events in the shared calendar_events table with credentialId = null.\n */\nexport async function syncOutlookCalendarEvents(\n  tenantId: string,\n  accountId: string,\n  accessToken: string,\n  startDate: Date,\n  endDate: Date\n): Promise<{ synced: number; errors: number }> {\n  const events = await fetchOutlookCalendarEvents(\n    accessToken,\n    startDate,\n    endDate\n  );\n\n  let synced = 0;\n  let errors = 0;\n\n  for (const event of events) {\n    try {\n      const mapped = mapOutlookEvent(event, tenantId);\n      const encrypted = encryptFields(mapped, CALENDAR_EVENT_ENCRYPTED_FIELDS);\n      await db\n        .insert(calendarEvents)\n        .values(encrypted)\n        .onConflictDoUpdate({\n          target: [calendarEvents.tenantId, calendarEvents.graphEventId],\n          set: {\n            subject: encrypted.subject,\n            bodyPreview: encrypted.bodyPreview,\n            bodyHtml: encrypted.bodyHtml,\n            startDateTime: encrypted.startDateTime,\n            endDateTime: encrypted.endDateTime,\n            isAllDay: encrypted.isAllDay,\n            location: encrypted.location,\n            organizerEmail: encrypted.organizerEmail,\n            organizerName: encrypted.organizerName,\n            attendees: encrypted.attendees,\n            webLink: encrypted.webLink,\n            isCancelled: encrypted.isCancelled,\n            showAs: encrypted.showAs,\n            importance: encrypted.importance,\n            isRecurring: encrypted.isRecurring,\n            seriesMasterId: encrypted.seriesMasterId,\n            rawPayload: encrypted.rawPayload,\n            lastSyncedAt: encrypted.lastSyncedAt,\n            updatedAt: encrypted.updatedAt,\n          },\n        });\n      synced++;\n    } catch (err) {\n      console.warn(`[Outlook Calendar] Error upserting event ${event.id}:`, err);\n      errors++;\n    }\n  }\n\n  // Update the last sync timestamp on the outlook token record\n  await updateOutlookLastSync(accountId);\n\n  return { synced, errors };\n}\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing Outlook integration code",
      "status": "completed",
      "activeForm": "Exploring existing Outlook integration code"
    },
    {
      "content": "Plan multi-account implementation approach",
      "status": "completed",
      "activeForm": "Planning multi-account implementation approach"
    },
    {
      "content": "Update database schema for multiple accounts",
      "status": "completed",
      "activeForm": "Updating database schema for multiple accounts"
    },
    {
      "content": "Update OAuth flow to support multiple accounts",
      "status": "completed",
      "activeForm": "Updating OAuth flow for multiple accounts"
    },
    {
      "content": "Update API routes for multi-account sync",
      "status": "completed",
      "activeForm": "Updating API routes for multi-account sync"
    },
    {
      "content": "Update calendar sync logic for multi-account",
      "status": "completed",
      "activeForm": "Updating calendar sync logic for multi-account"
    },
    {
      "content": "Update email sync logic for multi-account",
      "status": "in_progress",
      "activeForm": "Updating email sync logic for multi-account"
    },
    {
      "content": "Update React hooks for multi-account",
      "status": "pending",
      "activeForm": "Updating React hooks for multi-account"
    },
    {
      "content": "Update frontend UI for multi-account management",
      "status": "pending",
      "activeForm": "Updating frontend UI for multi-account management"
    }
  ]
}
### Step 6: Update Email Sync API route

🔧 Tool: Write
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\outlook\\sync\\route.ts",
  "content": "import { NextRequest, NextResponse } from \"next/server\";\nimport { auth } from \"@/auth\";\nimport {\n  getValidOutlookAccessToken,\n  getOutlookTokensForTenant,\n  getOutlookTokenById,\n  updateOutlookLastSync,\n} from \"@/lib/outlook/oauth\";\nimport { fetchOutlookInboxMessages } from \"@/lib/outlook/messages\";\nimport { insertEmail, emailExists } from \"@/lib/email/emails\";\n\n/**\n * POST /api/outlook/sync\n * Pull recent emails from the user's Outlook.com inbox using delegated auth.\n * Inserts any new messages that don't already exist.\n *\n * Body: { accountId? }\n *\n * If accountId is provided, syncs only that account.\n * If omitted, syncs all connected Outlook accounts.\n */\nexport async function POST(request: NextRequest) {\n  try {\n    const session = await auth();\n    const userId = session?.user?.id;\n    if (!userId) {\n      return NextResponse.json({ error: \"Unauthorized\" }, { status: 401 });\n    }\n\n    let body: { accountId?: string };\n    try {\n      body = await request.json();\n    } catch {\n      body = {};\n    }\n\n    // Determine which accounts to sync\n    let accounts: { id: string; outlook_email: string; last_sync_at: string | null }[];\n    if (body.accountId) {\n      const token = await getOutlookTokenById(body.accountId, userId);\n      if (!token) {\n        return NextResponse.json(\n          { error: \"Outlook account not found or inactive.\" },\n          { status: 400 }\n        );\n      }\n      accounts = [{ id: token.id, outlook_email: token.outlook_email, last_sync_at: token.last_sync_at }];\n    } else {\n      const tokens = await getOutlookTokensForTenant(userId);\n      if (tokens.length === 0) {\n        return NextResponse.json(\n          { error: \"Outlook not connected. Please connect your Outlook account first.\" },\n          { status: 400 }\n        );\n      }\n      accounts = tokens.map((t) => ({ id: t.id, outlook_email: t.outlook_email, last_sync_at: t.last_sync_at }));\n    }\n\n    let totalInserted = 0;\n    let totalSkipped = 0;\n    let totalMessages = 0;\n    const results: { accountId: string; email: string; total: number; inserted: number; skipped: number; error?: string }[] = [];\n\n    for (const account of accounts) {\n      try {\n        const accessToken = await getValidOutlookAccessToken(account.id, userId);\n\n        const afterDate = account.last_sync_at || undefined;\n        const { messages } = await fetchOutlookInboxMessages(accessToken, {\n          top: 50,\n          after: afterDate || undefined,\n        });\n\n        let inserted = 0;\n        let skipped = 0;\n\n        for (const msg of messages) {\n          const exists = await emailExists(userId, msg.messageId);\n          if (exists) {\n            skipped++;\n            continue;\n          }\n\n          try {\n            await insertEmail(msg, userId);\n            inserted++;\n          } catch (err) {\n            if (\n              err instanceof Error &&\n              err.message.includes(\"duplicate key value\")\n            ) {\n              skipped++;\n              continue;\n            }\n            console.error(`[Outlook Sync] Error inserting message ${msg.messageId}:`, err);\n          }\n        }\n\n        await updateOutlookLastSync(account.id);\n\n        totalInserted += inserted;\n        totalSkipped += skipped;\n        totalMessages += messages.length;\n        results.push({\n          accountId: account.id,\n          email: account.outlook_email,\n          total: messages.length,\n          inserted,\n          skipped,\n        });\n      } catch (err) {\n        const message = err instanceof Error ? err.message : \"Sync failed\";\n        results.push({\n          accountId: account.id,\n          email: account.outlook_email,\n          total: 0,\n          inserted: 0,\n          skipped: 0,\n          error: message,\n        });\n      }\n    }\n\n    return NextResponse.json({\n      message: \"Sync completed\",\n      total: totalMessages,\n      inserted: totalInserted,\n      skipped: totalSkipped,\n      results,\n    });\n  } catch (error) {\n    console.error(\"[Outlook Sync] Error:\", error);\n    return NextResponse.json(\n      { error: error instanceof Error ? error.message : \"Sync failed\" },\n      { status: 500 }\n    );\n  }\n}\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing Outlook integration code",
      "status": "completed",
      "activeForm": "Exploring existing Outlook integration code"
    },
    {
      "content": "Plan multi-account implementation approach",
      "status": "completed",
      "activeForm": "Planning multi-account implementation approach"
    },
    {
      "content": "Update database schema for multiple accounts",
      "status": "completed",
      "activeForm": "Updating database schema for multiple accounts"
    },
    {
      "content": "Update OAuth flow to support multiple accounts",
      "status": "completed",
      "activeForm": "Updating OAuth flow for multiple accounts"
    },
    {
      "content": "Update API routes for multi-account sync",
      "status": "completed",
      "activeForm": "Updating API routes for multi-account sync"
    },
    {
      "content": "Update calendar sync logic for multi-account",
      "status": "completed",
      "activeForm": "Updating calendar sync logic for multi-account"
    },
    {
      "content": "Update email sync logic for multi-account",
      "status": "completed",
      "activeForm": "Updating email sync logic for multi-account"
    },
    {
      "content": "Update React hooks for multi-account",
      "status": "in_progress",
      "activeForm": "Updating React hooks for multi-account"
    },
    {
      "content": "Update frontend UI for multi-account management",
      "status": "pending",
      "activeForm": "Updating frontend UI for multi-account management"
    }
  ]
}
### Step 7: Update React hooks

🔧 Tool: Write
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\hooks\\useCalendar.ts",
  "content": "\"use client\";\n\nimport { useQuery, useMutation, useQueryClient } from \"@tanstack/react-query\";\nimport type { CalendarEvent } from \"@/types\";\n\nasync function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {\n  const res = await fetch(url, init);\n  if (!res.ok) {\n    const body = await res.json().catch(() => ({}));\n    throw new Error(body.error || `Request failed: ${res.status}`);\n  }\n  if (res.status === 204) return undefined as T;\n  return res.json();\n}\n\nexport function useUpcomingEvents(limit = 5) {\n  return useQuery<{ events: CalendarEvent[] }>({\n    queryKey: [\"calendar\", \"upcoming\", limit],\n    queryFn: () => fetchJSON(`/api/calendar/upcoming?limit=${limit}`),\n  });\n}\n\nexport function useCalendarEventsInRange(start: string, end: string) {\n  return useQuery<{ events: CalendarEvent[] }>({\n    queryKey: [\"calendar\", \"range\", start, end],\n    queryFn: () =>\n      fetchJSON(\n        `/api/calendar/upcoming?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`\n      ),\n    enabled: !!start && !!end,\n  });\n}\n\nexport function useCalendarSync() {\n  const qc = useQueryClient();\n  return useMutation({\n    mutationFn: (data: {\n      credentialId: string;\n      mailbox: string;\n      daysBack?: number;\n      daysForward?: number;\n    }) =>\n      fetchJSON<{ message: string; synced: number; errors: number }>(\n        \"/api/calendar/sync\",\n        {\n          method: \"POST\",\n          headers: { \"Content-Type\": \"application/json\" },\n          body: JSON.stringify(data),\n        }\n      ),\n    onSuccess: () => {\n      qc.invalidateQueries({ queryKey: [\"calendar\"] });\n    },\n  });\n}\n\nexport function useSyncState() {\n  return useQuery<{\n    syncStates: Array<{\n      id: string;\n      tenantId: string;\n      credentialId: string;\n      mailbox: string;\n      lastSyncAt: string | null;\n      active: boolean;\n    }>;\n    credentials: Array<{\n      id: string;\n      label: string;\n      azureTenantId: string;\n      clientId: string;\n    }>;\n  }>({\n    queryKey: [\"calendar\", \"syncState\"],\n    queryFn: () => fetchJSON(\"/api/calendar/sync\"),\n  });\n}\n\nexport interface OutlookAccount {\n  id: string;\n  outlookEmail: string;\n  lastSyncAt?: string | null;\n}\n\nexport function useOutlookCalendarStatus() {\n  return useQuery<{\n    connected: boolean;\n    accounts: OutlookAccount[];\n  }>({\n    queryKey: [\"calendar\", \"outlookStatus\"],\n    queryFn: () => fetchJSON(\"/api/outlook/calendar\"),\n  });\n}\n\nexport function useOutlookCalendarSync() {\n  const qc = useQueryClient();\n  return useMutation({\n    mutationFn: (data: { accountId?: string; daysBack?: number; daysForward?: number }) =>\n      fetchJSON<{ message: string; synced: number; errors: number }>(\n        \"/api/outlook/calendar\",\n        {\n          method: \"POST\",\n          headers: { \"Content-Type\": \"application/json\" },\n          body: JSON.stringify(data),\n        }\n      ),\n    onSuccess: () => {\n      qc.invalidateQueries({ queryKey: [\"calendar\"] });\n    },\n  });\n}\n"
}
I already read it earlier but it seems the write tool requires re-reading. Let me re-read and write.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\hooks\\useCalendar.ts"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\lib\\hooks\\useCalendar.ts",
  "old_string": "export function useOutlookCalendarStatus() {\n  return useQuery<{\n    connected: boolean;\n    outlookEmail?: string;\n    lastSyncAt?: string | null;\n  }>({\n    queryKey: [\"calendar\", \"outlookStatus\"],\n    queryFn: () => fetchJSON(\"/api/outlook/calendar\"),\n  });\n}\n\nexport function useOutlookCalendarSync() {\n  const qc = useQueryClient();\n  return useMutation({\n    mutationFn: (data: { daysBack?: number; daysForward?: number }) =>\n      fetchJSON<{ message: string; synced: number; errors: number }>(\n        \"/api/outlook/calendar\",\n        {\n          method: \"POST\",\n          headers: { \"Content-Type\": \"application/json\" },\n          body: JSON.stringify(data),\n        }\n      ),\n    onSuccess: () => {\n      qc.invalidateQueries({ queryKey: [\"calendar\"] });\n    },\n  });\n}",
  "new_string": "export interface OutlookAccount {\n  id: string;\n  outlookEmail: string;\n  lastSyncAt?: string | null;\n}\n\nexport function useOutlookCalendarStatus() {\n  return useQuery<{\n    connected: boolean;\n    accounts: OutlookAccount[];\n  }>({\n    queryKey: [\"calendar\", \"outlookStatus\"],\n    queryFn: () => fetchJSON(\"/api/outlook/calendar\"),\n  });\n}\n\nexport function useOutlookCalendarSync() {\n  const qc = useQueryClient();\n  return useMutation({\n    mutationFn: (data: { accountId?: string; daysBack?: number; daysForward?: number }) =>\n      fetchJSON<{ message: string; synced: number; errors: number }>(\n        \"/api/outlook/calendar\",\n        {\n          method: \"POST\",\n          headers: { \"Content-Type\": \"application/json\" },\n          body: JSON.stringify(data),\n        }\n      ),\n    onSuccess: () => {\n      qc.invalidateQueries({ queryKey: [\"calendar\"] });\n    },\n  });\n}"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing Outlook integration code",
      "status": "completed",
      "activeForm": "Exploring existing Outlook integration code"
    },
    {
      "content": "Plan multi-account implementation approach",
      "status": "completed",
      "activeForm": "Planning multi-account implementation approach"
    },
    {
      "content": "Update database schema for multiple accounts",
      "status": "completed",
      "activeForm": "Updating database schema for multiple accounts"
    },
    {
      "content": "Update OAuth flow to support multiple accounts",
      "status": "completed",
      "activeForm": "Updating OAuth flow for multiple accounts"
    },
    {
      "content": "Update API routes for multi-account sync",
      "status": "completed",
      "activeForm": "Updating API routes for multi-account sync"
    },
    {
      "content": "Update calendar sync logic for multi-account",
      "status": "completed",
      "activeForm": "Updating calendar sync logic for multi-account"
    },
    {
      "content": "Update email sync logic for multi-account",
      "status": "completed",
      "activeForm": "Updating email sync logic for multi-account"
    },
    {
      "content": "Update React hooks for multi-account",
      "status": "completed",
      "activeForm": "Updating React hooks for multi-account"
    },
    {
      "content": "Update frontend UI for multi-account management",
      "status": "in_progress",
      "activeForm": "Updating frontend UI for multi-account management"
    }
  ]
}
### Step 8: Update the Frontend UI

Now for the major UI update. I need to update the `OutlookIntegrationManager` component and the calendar page.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "offset": 1477,
  "limit": 265
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "old_string": "function OutlookIntegrationManager() {\n  const [status, setStatus] = useState<{\n    connected: boolean;\n    outlookEmail?: string;\n    tokenExpiry?: string;\n    isExpired?: boolean;\n    lastSyncAt?: string | null;\n    createdAt?: string;\n  } | null>(null);\n  const [loading, setLoading] = useState(true);\n  const [syncing, setSyncing] = useState(false);\n  const [syncingCalendar, setSyncingCalendar] = useState(false);\n  const [actionLoading, setActionLoading] = useState(false);\n  const [error, setError] = useState<string | null>(null);\n  const [success, setSuccess] = useState<string | null>(null);\n  const [syncResult, setSyncResult] = useState<{\n    total: number;\n    inserted: number;\n    skipped: number;\n  } | null>(null);\n  const [calendarSyncResult, setCalendarSyncResult] = useState<{\n    synced: number;\n    errors: number;\n  } | null>(null);\n\n  const fetchStatus = useCallback(async () => {\n    try {\n      setLoading(true);\n      setError(null);\n      const res = await fetch(\"/api/outlook/oauth\");\n      if (!res.ok) throw new Error(\"Failed to fetch\");\n      const data = await res.json();\n      setStatus(data);\n    } catch {\n      setError(\"Failed to load Outlook connection status\");\n    } finally {\n      setLoading(false);\n    }\n  }, []);\n\n  useEffect(() => {\n    fetchStatus();\n  }, [fetchStatus]);\n\n  // Check for OAuth callback result in URL params\n  useEffect(() => {\n    const params = new URLSearchParams(window.location.search);\n    if (params.get(\"outlook_connected\") === \"true\") {\n      setSuccess(\"Outlook connected successfully!\");\n      setTimeout(() => setSuccess(null), 5000);\n      fetchStatus();\n      const url = new URL(window.location.href);\n      url.searchParams.delete(\"outlook_connected\");\n      window.history.replaceState({}, \"\", url.toString());\n    }\n    if (params.get(\"outlook_error\")) {\n      setError(`Outlook connection failed: ${params.get(\"outlook_error\")}`);\n      const url = new URL(window.location.href);\n      url.searchParams.delete(\"outlook_error\");\n      window.history.replaceState({}, \"\", url.toString());\n    }\n  }, [fetchStatus]);\n\n  const handleConnect = () => {\n    window.location.href = \"/api/outlook/oauth?action=connect\";\n  };\n\n  const handleDisconnect = async () => {\n    setActionLoading(true);\n    setError(null);\n    setSuccess(null);\n    try {\n      const res = await fetch(\"/api/outlook/oauth\", { method: \"DELETE\" });\n      if (!res.ok) throw new Error(\"Failed to disconnect\");\n      setSuccess(\"Outlook disconnected\");\n      setTimeout(() => setSuccess(null), 5000);\n      await fetchStatus();\n    } catch (err) {\n      setError(\n        err instanceof Error ? err.message : \"Failed to disconnect Outlook\"\n      );\n    } finally {\n      setActionLoading(false);\n    }\n  };\n\n  const handleSync = async () => {\n    setSyncing(true);\n    setError(null);\n    setSyncResult(null);\n    try {\n      const res = await fetch(\"/api/outlook/sync\", { method: \"POST\" });\n      const data = await res.json();\n      if (!res.ok) throw new Error(data.error || \"Sync failed\");\n      setSyncResult({ total: data.total, inserted: data.inserted, skipped: data.skipped });\n      setSuccess(`Sync complete: ${data.inserted} new emails imported`);\n      setTimeout(() => setSuccess(null), 5000);\n      await fetchStatus();\n    } catch (err) {\n      setError(err instanceof Error ? err.message : \"Sync failed\");\n    } finally {\n      setSyncing(false);\n    }\n  };\n\n  const handleCalendarSync = async () => {\n    setSyncingCalendar(true);\n    setError(null);\n    setCalendarSyncResult(null);\n    try {\n      const res = await fetch(\"/api/outlook/calendar\", {\n        method: \"POST\",\n        headers: { \"Content-Type\": \"application/json\" },\n        body: JSON.stringify({ daysBack: 7, daysForward: 30 }),\n      });\n      const data = await res.json();\n      if (!res.ok) throw new Error(data.error || \"Calendar sync failed\");\n      setCalendarSyncResult({ synced: data.synced, errors: data.errors });\n      setSuccess(`Calendar sync complete: ${data.synced} events synced`);\n      setTimeout(() => setSuccess(null), 5000);\n    } catch (err) {\n      setError(err instanceof Error ? err.message : \"Calendar sync failed\");\n    } finally {\n      setSyncingCalendar(false);\n    }\n  };\n\n  return (\n    <div>\n      <h3 className=\"text-sm font-semibold text-[var(--foreground)] mb-2\">\n        Connection Status\n      </h3>\n      <p className=\"text-sm text-[var(--muted-foreground)] mb-3\">\n        Connect your Microsoft account (Outlook.com, Hotmail, Live, Office 365) to\n        sync emails and calendar events using delegated OAuth permissions.\n      </p>\n\n      {error && (\n        <div className=\"mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-600\">\n          {error}\n        </div>\n      )}\n      {success && (\n        <div className=\"mb-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-green-600\">\n          {success}\n        </div>\n      )}\n\n      {loading ? (\n        <div className=\"p-4 rounded-lg bg-[var(--secondary)] border border-[var(--border)] text-sm text-[var(--muted-foreground)]\">\n          Loading...\n        </div>\n      ) : status?.connected ? (\n        <div className=\"space-y-4\">\n          <div className=\"p-4 rounded-lg border border-[var(--border)] bg-[var(--secondary)]\">\n            <div className=\"flex items-center gap-2 mb-3\">\n              <div\n                className={`w-2.5 h-2.5 rounded-full ${\n                  status.isExpired ? \"bg-amber-500\" : \"bg-green-500\"\n                }`}\n              />\n              <span className=\"text-sm font-medium text-[var(--foreground)]\">\n                {status.isExpired\n                  ? \"Token Expired (will auto-refresh)\"\n                  : \"Connected\"}\n              </span>\n            </div>\n            <div className=\"grid grid-cols-2 gap-3 text-sm\">\n              <div>\n                <span className=\"text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider\">\n                  Email\n                </span>\n                <p className=\"text-[var(--foreground)] mt-0.5\">\n                  {status.outlookEmail}\n                </p>\n              </div>\n              <div>\n                <span className=\"text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider\">\n                  Connected Since\n                </span>\n                <p className=\"text-[var(--foreground)] mt-0.5\">\n                  {status.createdAt\n                    ? new Date(status.createdAt).toLocaleString()\n                    : \"—\"}\n                </p>\n              </div>\n              <div>\n                <span className=\"text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider\">\n                  Last Sync\n                </span>\n                <p className=\"text-[var(--foreground)] mt-0.5\">\n                  {status.lastSyncAt\n                    ? new Date(status.lastSyncAt).toLocaleString()\n                    : \"Never\"}\n                </p>\n              </div>\n            </div>\n          </div>\n\n          {syncResult && (\n            <div className=\"p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-[var(--foreground)]\">\n              Fetched {syncResult.total} messages: {syncResult.inserted} new, {syncResult.skipped} already existed.\n            </div>\n          )}\n\n          {calendarSyncResult && (\n            <div className=\"p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-[var(--foreground)]\">\n              Calendar: {calendarSyncResult.synced} events synced.\n              {calendarSyncResult.errors > 0 && ` (${calendarSyncResult.errors} errors)`}\n            </div>\n          )}\n\n          <div className=\"flex gap-2 flex-wrap\">\n            <button\n              onClick={handleSync}\n              disabled={syncing}\n              className=\"px-4 py-2 text-sm font-medium rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50\"\n            >\n              {syncing ? \"Syncing...\" : \"Sync Emails Now\"}\n            </button>\n            <button\n              onClick={handleCalendarSync}\n              disabled={syncingCalendar}\n              className=\"px-4 py-2 text-sm font-medium rounded-md bg-[#0078D4] text-white hover:bg-[#106ebe] transition-colors disabled:opacity-50\"\n            >\n              {syncingCalendar ? \"Syncing...\" : \"Sync Calendar Now\"}\n            </button>\n            <button\n              onClick={handleDisconnect}\n              disabled={actionLoading}\n              className=\"px-4 py-2 text-sm font-medium rounded-md border border-red-500/30 text-red-600 hover:bg-red-500/10 transition-colors disabled:opacity-50\"\n            >\n              {actionLoading ? \"Disconnecting...\" : \"Disconnect\"}\n            </button>\n          </div>\n        </div>\n      ) : (\n        <div className=\"space-y-4\">\n          <div className=\"p-4 rounded-lg border border-[var(--border)] bg-[var(--secondary)]\">\n            <div className=\"flex items-center gap-2 mb-2\">\n              <div className=\"w-2.5 h-2.5 rounded-full bg-gray-400\" />\n              <span className=\"text-sm font-medium text-[var(--muted-foreground)]\">\n                Not Connected\n              </span>\n            </div>\n            <p className=\"text-sm text-[var(--muted-foreground)]\">\n              Connect your Outlook account to start importing emails and\n              syncing calendar events. You will be redirected to Microsoft to\n              authorize the app.\n            </p>\n          </div>\n\n          <button\n            onClick={handleConnect}\n            className=\"px-4 py-2 text-sm font-medium rounded-md bg-[#0078D4] text-white hover:bg-[#106ebe] transition-colors\"\n          >\n            Connect Outlook Account\n          </button>\n        </div>\n      )}\n    </div>\n  );\n}",
  "new_string": "interface OutlookAccountInfo {\n  id: string;\n  outlookEmail: string;\n  tokenExpiry: string;\n  isExpired: boolean;\n  lastSyncAt: string | null;\n  createdAt: string;\n  updatedAt: string;\n}\n\nfunction OutlookIntegrationManager() {\n  const [status, setStatus] = useState<{\n    connected: boolean;\n    accounts: OutlookAccountInfo[];\n  } | null>(null);\n  const [loading, setLoading] = useState(true);\n  const [syncingAccounts, setSyncingAccounts] = useState<Set<string>>(new Set());\n  const [calendarSyncingAccounts, setCalendarSyncingAccounts] = useState<Set<string>>(new Set());\n  const [disconnectingAccounts, setDisconnectingAccounts] = useState<Set<string>>(new Set());\n  const [error, setError] = useState<string | null>(null);\n  const [success, setSuccess] = useState<string | null>(null);\n  const [syncResults, setSyncResults] = useState<Record<string, {\n    total: number;\n    inserted: number;\n    skipped: number;\n  }>>({});\n  const [calendarSyncResults, setCalendarSyncResults] = useState<Record<string, {\n    synced: number;\n    errors: number;\n  }>>({});\n\n  const fetchStatus = useCallback(async () => {\n    try {\n      setLoading(true);\n      setError(null);\n      const res = await fetch(\"/api/outlook/oauth\");\n      if (!res.ok) throw new Error(\"Failed to fetch\");\n      const data = await res.json();\n      setStatus(data);\n    } catch {\n      setError(\"Failed to load Outlook connection status\");\n    } finally {\n      setLoading(false);\n    }\n  }, []);\n\n  useEffect(() => {\n    fetchStatus();\n  }, [fetchStatus]);\n\n  // Check for OAuth callback result in URL params\n  useEffect(() => {\n    const params = new URLSearchParams(window.location.search);\n    if (params.get(\"outlook_connected\") === \"true\") {\n      setSuccess(\"Outlook account connected successfully!\");\n      setTimeout(() => setSuccess(null), 5000);\n      fetchStatus();\n      const url = new URL(window.location.href);\n      url.searchParams.delete(\"outlook_connected\");\n      window.history.replaceState({}, \"\", url.toString());\n    }\n    if (params.get(\"outlook_error\")) {\n      setError(`Outlook connection failed: ${params.get(\"outlook_error\")}`);\n      const url = new URL(window.location.href);\n      url.searchParams.delete(\"outlook_error\");\n      window.history.replaceState({}, \"\", url.toString());\n    }\n  }, [fetchStatus]);\n\n  const handleConnect = () => {\n    window.location.href = \"/api/outlook/oauth?action=connect\";\n  };\n\n  const handleDisconnect = async (accountId: string) => {\n    setDisconnectingAccounts((prev) => new Set(prev).add(accountId));\n    setError(null);\n    setSuccess(null);\n    try {\n      const res = await fetch(`/api/outlook/oauth?accountId=${accountId}`, { method: \"DELETE\" });\n      if (!res.ok) throw new Error(\"Failed to disconnect\");\n      setSuccess(\"Outlook account disconnected\");\n      setTimeout(() => setSuccess(null), 5000);\n      await fetchStatus();\n    } catch (err) {\n      setError(\n        err instanceof Error ? err.message : \"Failed to disconnect Outlook\"\n      );\n    } finally {\n      setDisconnectingAccounts((prev) => {\n        const next = new Set(prev);\n        next.delete(accountId);\n        return next;\n      });\n    }\n  };\n\n  const handleSync = async (accountId: string) => {\n    setSyncingAccounts((prev) => new Set(prev).add(accountId));\n    setError(null);\n    setSyncResults((prev) => {\n      const next = { ...prev };\n      delete next[accountId];\n      return next;\n    });\n    try {\n      const res = await fetch(\"/api/outlook/sync\", {\n        method: \"POST\",\n        headers: { \"Content-Type\": \"application/json\" },\n        body: JSON.stringify({ accountId }),\n      });\n      const data = await res.json();\n      if (!res.ok) throw new Error(data.error || \"Sync failed\");\n      setSyncResults((prev) => ({\n        ...prev,\n        [accountId]: { total: data.total, inserted: data.inserted, skipped: data.skipped },\n      }));\n      setSuccess(`Sync complete: ${data.inserted} new emails imported`);\n      setTimeout(() => setSuccess(null), 5000);\n      await fetchStatus();\n    } catch (err) {\n      setError(err instanceof Error ? err.message : \"Sync failed\");\n    } finally {\n      setSyncingAccounts((prev) => {\n        const next = new Set(prev);\n        next.delete(accountId);\n        return next;\n      });\n    }\n  };\n\n  const handleCalendarSync = async (accountId: string) => {\n    setCalendarSyncingAccounts((prev) => new Set(prev).add(accountId));\n    setError(null);\n    setCalendarSyncResults((prev) => {\n      const next = { ...prev };\n      delete next[accountId];\n      return next;\n    });\n    try {\n      const res = await fetch(\"/api/outlook/calendar\", {\n        method: \"POST\",\n        headers: { \"Content-Type\": \"application/json\" },\n        body: JSON.stringify({ accountId, daysBack: 7, daysForward: 30 }),\n      });\n      const data = await res.json();\n      if (!res.ok) throw new Error(data.error || \"Calendar sync failed\");\n      setCalendarSyncResults((prev) => ({\n        ...prev,\n        [accountId]: { synced: data.synced, errors: data.errors },\n      }));\n      setSuccess(`Calendar sync complete: ${data.synced} events synced`);\n      setTimeout(() => setSuccess(null), 5000);\n    } catch (err) {\n      setError(err instanceof Error ? err.message : \"Calendar sync failed\");\n    } finally {\n      setCalendarSyncingAccounts((prev) => {\n        const next = new Set(prev);\n        next.delete(accountId);\n        return next;\n      });\n    }\n  };\n\n  const accounts = status?.accounts || [];\n\n  return (\n    <div>\n      <h3 className=\"text-sm font-semibold text-[var(--foreground)] mb-2\">\n        Connected Accounts\n      </h3>\n      <p className=\"text-sm text-[var(--muted-foreground)] mb-3\">\n        Connect one or more Microsoft accounts (Outlook.com, Hotmail, Live, Office 365) to\n        sync emails and calendar events using delegated OAuth permissions.\n      </p>\n\n      {error && (\n        <div className=\"mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-600\">\n          {error}\n        </div>\n      )}\n      {success && (\n        <div className=\"mb-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-green-600\">\n          {success}\n        </div>\n      )}\n\n      {loading ? (\n        <div className=\"p-4 rounded-lg bg-[var(--secondary)] border border-[var(--border)] text-sm text-[var(--muted-foreground)]\">\n          Loading...\n        </div>\n      ) : (\n        <div className=\"space-y-4\">\n          {accounts.length > 0 ? (\n            accounts.map((account) => (\n              <div\n                key={account.id}\n                className=\"p-4 rounded-lg border border-[var(--border)] bg-[var(--secondary)]\"\n              >\n                <div className=\"flex items-center gap-2 mb-3\">\n                  <div\n                    className={`w-2.5 h-2.5 rounded-full ${\n                      account.isExpired ? \"bg-amber-500\" : \"bg-green-500\"\n                    }`}\n                  />\n                  <span className=\"text-sm font-medium text-[var(--foreground)]\">\n                    {account.outlookEmail}\n                  </span>\n                  {account.isExpired && (\n                    <span className=\"text-xs text-amber-500\">(token expired, will auto-refresh)</span>\n                  )}\n                </div>\n                <div className=\"grid grid-cols-2 gap-3 text-sm mb-3\">\n                  <div>\n                    <span className=\"text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider\">\n                      Connected Since\n                    </span>\n                    <p className=\"text-[var(--foreground)] mt-0.5\">\n                      {new Date(account.createdAt).toLocaleString()}\n                    </p>\n                  </div>\n                  <div>\n                    <span className=\"text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider\">\n                      Last Sync\n                    </span>\n                    <p className=\"text-[var(--foreground)] mt-0.5\">\n                      {account.lastSyncAt\n                        ? new Date(account.lastSyncAt).toLocaleString()\n                        : \"Never\"}\n                    </p>\n                  </div>\n                </div>\n\n                {syncResults[account.id] && (\n                  <div className=\"mb-3 p-2 rounded bg-blue-500/10 border border-blue-500/20 text-xs text-[var(--foreground)]\">\n                    Fetched {syncResults[account.id].total} messages: {syncResults[account.id].inserted} new, {syncResults[account.id].skipped} already existed.\n                  </div>\n                )}\n\n                {calendarSyncResults[account.id] && (\n                  <div className=\"mb-3 p-2 rounded bg-blue-500/10 border border-blue-500/20 text-xs text-[var(--foreground)]\">\n                    Calendar: {calendarSyncResults[account.id].synced} events synced.\n                    {calendarSyncResults[account.id].errors > 0 && ` (${calendarSyncResults[account.id].errors} errors)`}\n                  </div>\n                )}\n\n                <div className=\"flex gap-2 flex-wrap\">\n                  <button\n                    onClick={() => handleSync(account.id)}\n                    disabled={syncingAccounts.has(account.id)}\n                    className=\"px-3 py-1.5 text-xs font-medium rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50\"\n                  >\n                    {syncingAccounts.has(account.id) ? \"Syncing...\" : \"Sync Emails\"}\n                  </button>\n                  <button\n                    onClick={() => handleCalendarSync(account.id)}\n                    disabled={calendarSyncingAccounts.has(account.id)}\n                    className=\"px-3 py-1.5 text-xs font-medium rounded-md bg-[#0078D4] text-white hover:bg-[#106ebe] transition-colors disabled:opacity-50\"\n                  >\n                    {calendarSyncingAccounts.has(account.id) ? \"Syncing...\" : \"Sync Calendar\"}\n                  </button>\n                  <button\n                    onClick={() => handleDisconnect(account.id)}\n                    disabled={disconnectingAccounts.has(account.id)}\n                    className=\"px-3 py-1.5 text-xs font-medium rounded-md border border-red-500/30 text-red-600 hover:bg-red-500/10 transition-colors disabled:opacity-50\"\n                  >\n                    {disconnectingAccounts.has(account.id) ? \"Disconnecting...\" : \"Disconnect\"}\n                  </button>\n                </div>\n              </div>\n            ))\n          ) : (\n            <div className=\"p-4 rounded-lg border border-[var(--border)] bg-[var(--secondary)]\">\n              <div className=\"flex items-center gap-2 mb-2\">\n                <div className=\"w-2.5 h-2.5 rounded-full bg-gray-400\" />\n                <span className=\"text-sm font-medium text-[var(--muted-foreground)]\">\n                  No Accounts Connected\n                </span>\n              </div>\n              <p className=\"text-sm text-[var(--muted-foreground)]\">\n                Connect your Outlook account to start importing emails and\n                syncing calendar events. You will be redirected to Microsoft to\n                authorize the app.\n              </p>\n            </div>\n          )}\n\n          <button\n            onClick={handleConnect}\n            className=\"px-4 py-2 text-sm font-medium rounded-md bg-[#0078D4] text-white hover:bg-[#106ebe] transition-colors\"\n          >\n            {accounts.length > 0 ? \"Add Another Account\" : \"Connect Outlook Account\"}\n          </button>\n        </div>\n      )}\n    </div>\n  );\n}"
}
Now update the calendar page to handle multi-account.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\calendar\\page.tsx"
}
Now I need to update the calendar page. The key changes are:
1. `outlookStatus?.connected` still works (returns `true` if any accounts are connected)
2. The prompt text referencing `outlookStatus.outlookEmail` needs to handle multiple accounts
3. The sync button now syncs all accounts (no `accountId` = sync all)

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\calendar\\page.tsx",
  "old_string": "      {hasOutlookConnection && !hasGraphCredentials && events.length === 0 && !isLoading && (\n        <div className=\"mb-4 rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 text-center\">\n          <h2 className=\"mb-2 text-base font-medium text-[var(--foreground)]\">\n            Sync your Outlook calendar\n          </h2>\n          <p className=\"mb-3 text-sm text-[var(--muted-foreground)]\">\n            Your Outlook account ({outlookStatus.outlookEmail}) is connected.\n            Click below to sync your calendar events.\n          </p>\n          <button\n            onClick={() => outlookSyncMutation.mutate({ daysBack: 7, daysForward: 30 })}\n            disabled={outlookSyncMutation.isPending}\n            className=\"rounded-md bg-[#0078D4] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#106ebe] disabled:opacity-50\"\n          >\n            {outlookSyncMutation.isPending ? \"Syncing...\" : \"Sync Outlook Calendar\"}\n          </button>\n        </div>\n      )}",
  "new_string": "      {hasOutlookConnection && !hasGraphCredentials && events.length === 0 && !isLoading && (\n        <div className=\"mb-4 rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 text-center\">\n          <h2 className=\"mb-2 text-base font-medium text-[var(--foreground)]\">\n            Sync your Outlook calendar\n          </h2>\n          <p className=\"mb-3 text-sm text-[var(--muted-foreground)]\">\n            {outlookStatus?.accounts && outlookStatus.accounts.length === 1\n              ? `Your Outlook account (${outlookStatus.accounts[0].outlookEmail}) is connected.`\n              : `${outlookStatus?.accounts?.length ?? 0} Outlook accounts are connected.`}\n            {\" \"}Click below to sync your calendar events.\n          </p>\n          <button\n            onClick={() => outlookSyncMutation.mutate({ daysBack: 7, daysForward: 30 })}\n            disabled={outlookSyncMutation.isPending}\n            className=\"rounded-md bg-[#0078D4] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#106ebe] disabled:opacity-50\"\n          >\n            {outlookSyncMutation.isPending ? \"Syncing...\" : \"Sync Outlook Calendar\"}\n          </button>\n        </div>\n      )}"
}
Now let me verify all the files compile correctly by checking for any import issues. Let me check that all consumers of the old `deactivateOutlookToken` function signature are updated (it now takes 2 params).

🔧 Tool: Grep
Input: {
  "pattern": "deactivateOutlookToken",
  "output_mode": "content",
  "context": 1,
  "glob": "*.ts"
}
Good, all usages are updated.

Let me also verify that `getOutlookTokenForTenant` (old single-token function) isn't used anywhere else that we missed.

🔧 Tool: Grep
Input: {
  "pattern": "getOutlookTokenForTenant",
  "output_mode": "content",
  "context": 1,
  "glob": "*.ts"
}
Good - the deprecated `getOutlookTokenForTenant` is only defined in oauth.ts now. Let me also verify `updateOutlookLastSync` is correctly updated everywhere.

🔧 Tool: Grep
Input: {
  "pattern": "updateOutlookLastSync",
  "output_mode": "content",
  "context": 1,
  "glob": "*.ts"
}
All usages pass `accountId` now. Let me also verify there's no old `getValidOutlookAccessToken` usage with just one parameter.

🔧 Tool: Grep
Input: {
  "pattern": "getValidOutlookAccessToken",
  "output_mode": "content",
  "context": 1,
  "glob": "*.ts"
}
All usages are correctly passing both `accountId` and `userId`. Let me verify the TypeScript compilation by checking for any remaining type issues.

🔧 Tool: Bash
Input: {
  "command": "cd /c/Code/Krisp && npx tsc --noEmit --pretty 2>&1 | head -80",
  "description": "Check TypeScript compilation for errors",
  "timeout": 120000
}
TypeScript compilation passes with no errors. Let me update the todo list and verify no tsx files reference the old single-account pattern.

🔧 Tool: Grep
Input: {
  "pattern": "outlookStatus\\.outlookEmail",
  "output_mode": "content",
  "context": 1
}
Good - only in the automaker output logs, not in actual source code. Let me also verify the `status.outlookEmail` reference is gone from IntegrationsClient.

🔧 Tool: Grep
Input: {
  "pattern": "status\\.outlookEmail",
  "output_mode": "content",
  "glob": "*.tsx"
}
Everything is clean. Let me mark the final task complete.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing Outlook integration code",
      "status": "completed",
      "activeForm": "Exploring existing Outlook integration code"
    },
    {
      "content": "Plan multi-account implementation approach",
      "status": "completed",
      "activeForm": "Planning multi-account implementation approach"
    },
    {
      "content": "Update database schema for multiple accounts",
      "status": "completed",
      "activeForm": "Updating database schema for multiple accounts"
    },
    {
      "content": "Update OAuth flow to support multiple accounts",
      "status": "completed",
      "activeForm": "Updating OAuth flow for multiple accounts"
    },
    {
      "content": "Update API routes for multi-account sync",
      "status": "completed",
      "activeForm": "Updating API routes for multi-account sync"
    },
    {
      "content": "Update calendar sync logic for multi-account",
      "status": "completed",
      "activeForm": "Updating calendar sync logic for multi-account"
    },
    {
      "content": "Update email sync logic for multi-account",
      "status": "completed",
      "activeForm": "Updating email sync logic for multi-account"
    },
    {
      "content": "Update React hooks for multi-account",
      "status": "completed",
      "activeForm": "Updating React hooks for multi-account"
    },
    {
      "content": "Update frontend UI for multi-account management",
      "status": "completed",
      "activeForm": "Updating frontend UI for multi-account management"
    }
  ]
}
<summary>
## Summary: Add the ability to connect to multiple outlook.com accounts

### Changes Implemented
- **Database schema**: Changed unique constraint on `outlook_oauth_tokens` from `(tenant_id)` to `(tenant_id, outlook_email)`, allowing multiple Outlook accounts per user. Added index on `tenant_id` for efficient lookups.
- **Migration**: Created `0026_multi-outlook-accounts.sql` to drop the old unique index and create the new composite one.
- **OAuth functions** (`lib/outlook/oauth.ts`): 
  - Added `getOutlookTokensForTenant()` to return all active accounts for a tenant
  - Added `getOutlookTokenById()` to get a specific account by its UUID
  - Changed `upsertOutlookTokens()` ON CONFLICT to use `(tenant_id, outlook_email)` so connecting a new email creates a new row
  - Changed `deactivateOutlookToken()` to accept `(accountId, tenantId)` for per-account disconnect
  - Changed `getValidOutlookAccessToken()` to accept `(accountId, tenantId)` for per-account token refresh
  - Changed `updateOutlookLastSync()` to accept `accountId` instead of `tenantId`
  - Added `deactivateAllOutlookTokens()` utility
  - Kept backwards-compatible `getOutlookTokenForTenant()` (deprecated)
- **OAuth API route** (`app/api/outlook/oauth/route.ts`): GET now returns `{ connected, accounts: [...] }` with all account details. DELETE requires `?accountId=` parameter.
- **Calendar API route** (`app/api/outlook/calendar/route.ts`): POST accepts optional `accountId` — syncs all accounts if omitted, or specific account if provided. GET returns all accounts' status.
- **Email sync route** (`app/api/outlook/sync/route.ts`): POST accepts optional `accountId` — syncs all accounts if omitted. Returns per-account results.
- **Calendar sync logic** (`lib/outlook/calendar.ts`): `syncOutlookCalendarEvents()` now takes `accountId` parameter to update the correct token's `last_sync_at`.
- **React hooks** (`lib/hooks/useCalendar.ts`): Updated `useOutlookCalendarStatus` return type to include `accounts` array. Updated `useOutlookCalendarSync` mutation to accept optional `accountId`.
- **Integrations UI** (`IntegrationsClient.tsx`): Completely reworked `OutlookIntegrationManager` to show a list of connected accounts, each with individual Sync Emails/Sync Calendar/Disconnect buttons. "Add Another Account" button appears when accounts already exist.
- **Calendar page** (`calendar/page.tsx`): Updated to handle multi-account status display.

### Files Modified
- `lib/db/schema.ts` — Changed unique index on `outlook_oauth_tokens`
- `drizzle/migrations/0026_multi-outlook-accounts.sql` — New migration
- `drizzle/migrations/meta/_journal.json` — Added migration entry
- `lib/outlook/oauth.ts` — All token management functions updated for multi-account
- `lib/outlook/calendar.ts` — `syncOutlookCalendarEvents` takes `accountId`
- `app/api/outlook/oauth/route.ts` — Returns accounts array, per-account disconnect
- `app/api/outlook/oauth/callback/route.ts` — No changes needed (upsert handles new constraint)
- `app/api/outlook/calendar/route.ts` — Multi-account sync support
- `app/api/outlook/sync/route.ts` — Multi-account email sync support
- `lib/hooks/useCalendar.ts` — Updated types and mutation signatures
- `app/(app)/admin/integrations/IntegrationsClient.tsx` — Multi-account UI
- `app/(app)/calendar/page.tsx` — Multi-account status display

### Notes for Developer
- Run the migration `0026_multi-outlook-accounts.sql` against your database before deploying
- Existing single-account tokens will continue to work — the new `(tenant_id, outlook_email)` unique constraint is backwards compatible since each existing row already has a unique email
- The "Connect Outlook Account" / "Add Another Account" button uses the same OAuth flow — Microsoft's consent screen naturally lets users pick which account to sign in with
- When syncing without specifying an `accountId`, all connected accounts are synced in sequence
- TypeScript compilation passes with no errors
</summary>