

I'll start by exploring the existing Krisp webhook endpoint and understanding the current structure.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing webhook endpoint and database schema",
      "status": "in_progress",
      "activeForm": "Exploring existing webhook endpoint and database schema"
    },
    {
      "content": "Plan multi-tenant approach",
      "status": "pending",
      "activeForm": "Planning multi-tenant approach"
    },
    {
      "content": "Implement multi-tenant support in webhook endpoint",
      "status": "pending",
      "activeForm": "Implementing multi-tenant support in webhook endpoint"
    },
    {
      "content": "Update search endpoint for multi-tenant filtering",
      "status": "pending",
      "activeForm": "Updating search endpoint for multi-tenant filtering"
    }
  ]
}

🔧 Tool: Task
Input: {
  "description": "Explore Krisp webhook codebase",
  "prompt": "Explore the codebase to understand the Krisp webhook endpoint and related files. I need to understand:\n\n1. The webhook endpoint (likely in app/api/webhooks/ or similar)\n2. The database schema for webhook_key_points table\n3. The search endpoint that queries webhook data\n4. The database connection/query files for Krisp\n5. Any auth/middleware related files\n6. The Drizzle schema file\n\nLook in these likely locations:\n- app/api/webhooks/\n- app/api/search/\n- lib/krisp/\n- lib/db/\n- lib/db/schema.ts\n- auth.ts\n- middleware.ts\n- types/\n\nRead the full contents of all relevant files and report back everything you find.",
  "subagent_type": "Explore"
}

🔧 Tool: Bash
Input: {
  "command": "find \"C:\\Code\\Krisp\" -type f -name \"*.ts\" -o -name \"*.tsx\" -o -name \"*.json\" | head -50",
  "description": "List TypeScript and JSON files in the project"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/*.ts",
  "path": "C:\\Code\\Krisp"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/*.tsx",
  "path": "C:\\Code\\Krisp"
}

🔧 Tool: Bash
Input: {
  "command": "find \"C:\\Code\\Krisp\" -path \"*/node_modules\" -prune -o -type f \\( -name \"*.ts\" -o -name \"*.tsx\" \\) -print | sort",
  "description": "List all TypeScript files excluding node_modules"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\webhooks\\key-points\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\db\\schema.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\search\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\krisp\\db.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\krisp\\webhookKeyPoints.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\auth.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\middleware.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\types\\webhook.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\db\\index.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\types\\index.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\drizzle.config.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\package.json"
}
Now I have a thorough understanding of the codebase. The current system is indeed single-tenant — there's no `user_id` associated with webhook data, and the search endpoint queries all meetings without user filtering. Let me read the key files to confirm the details before planning.

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
  "file_path": "C:\\Code\\Krisp\\lib\\db\\schema.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\search\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\types\\webhook.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\auth.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\middleware.ts"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing webhook endpoint and database schema",
      "status": "completed",
      "activeForm": "Exploring existing webhook endpoint and database schema"
    },
    {
      "content": "Plan multi-tenant approach",
      "status": "in_progress",
      "activeForm": "Planning multi-tenant approach"
    },
    {
      "content": "Implement multi-tenant support in webhook endpoint",
      "status": "pending",
      "activeForm": "Implementing multi-tenant support in webhook endpoint"
    },
    {
      "content": "Update search endpoint for multi-tenant filtering",
      "status": "pending",
      "activeForm": "Updating search endpoint for multi-tenant filtering"
    }
  ]
}
Now I have a clear picture. Here's what needs to change for multi-tenant support:

**Current state**: The `webhook_key_points` table has no `user_id` column. All meetings are stored and queried globally — any user can see all meetings. The webhook endpoint uses a shared `WEBHOOK_SECRET` for auth, not user-specific auth.

**Plan**:
1. **Schema**: Add `user_id` column (UUID, FK to `users.id`) to `webhook_key_points`
2. **Webhook endpoint**: Accept `user_id` as a query parameter (e.g., `/api/webhooks/key-points?user_id=<uuid>`) so Krisp can pass the user ID when sending webhooks
3. **Query functions**: Add `userId` parameter to all query functions so data is filtered per-user
4. **Search endpoint**: Extract user from the session (via `auth()`) and filter results to that user's meetings
5. **Types**: Add `user_id` to `WebhookKeyPointsRow`

Let me implement this.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing webhook endpoint and database schema",
      "status": "completed",
      "activeForm": "Exploring existing webhook endpoint and database schema"
    },
    {
      "content": "Plan multi-tenant approach",
      "status": "completed",
      "activeForm": "Planning multi-tenant approach"
    },
    {
      "content": "Add user_id to schema and types",
      "status": "in_progress",
      "activeForm": "Adding user_id to schema and types"
    },
    {
      "content": "Update query functions with user_id filtering",
      "status": "pending",
      "activeForm": "Updating query functions with user_id filtering"
    },
    {
      "content": "Update webhook endpoint to accept user_id",
      "status": "pending",
      "activeForm": "Updating webhook endpoint to accept user_id"
    },
    {
      "content": "Update search endpoint for multi-tenant filtering",
      "status": "pending",
      "activeForm": "Updating search endpoint for multi-tenant filtering"
    },
    {
      "content": "Generate Drizzle migration",
      "status": "pending",
      "activeForm": "Generating Drizzle migration"
    }
  ]
}
First, add `user_id` to the schema and types.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\lib\\db\\schema.ts",
  "old_string": "// ── Webhook Key Points (Krisp Meetings) ───────────────\nexport const webhookKeyPoints = pgTable(\"webhook_key_points\", {\n  id: serial(\"id\").primaryKey(),\n  webhookId: varchar(\"webhook_id\", { length: 255 }).notNull().unique(),\n  eventType: varchar(\"event_type\", { length: 100 }).notNull(),\n  meetingId: varchar(\"meeting_id\", { length: 255 }).notNull(),",
  "new_string": "// ── Webhook Key Points (Krisp Meetings) ───────────────\nexport const webhookKeyPoints = pgTable(\"webhook_key_points\", {\n  id: serial(\"id\").primaryKey(),\n  userId: uuid(\"user_id\")\n    .notNull()\n    .references(() => users.id, { onDelete: \"cascade\" }),\n  webhookId: varchar(\"webhook_id\", { length: 255 }).notNull().unique(),\n  eventType: varchar(\"event_type\", { length: 100 }).notNull(),\n  meetingId: varchar(\"meeting_id\", { length: 255 }).notNull(),"
}
Now update the `WebhookKeyPointsRow` and `WebhookKeyPointsInsert` types.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\types\\webhook.ts",
  "old_string": "// Database row type\nexport interface WebhookKeyPointsRow {\n  id: number;\n  webhook_id: string;",
  "new_string": "// Database row type\nexport interface WebhookKeyPointsRow {\n  id: number;\n  user_id: string;\n  webhook_id: string;"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\types\\webhook.ts",
  "old_string": "// Insert data type (excludes auto-generated fields)\nexport interface WebhookKeyPointsInsert {\n  webhook_id: string;",
  "new_string": "// Insert data type (excludes auto-generated fields)\nexport interface WebhookKeyPointsInsert {\n  user_id: string;\n  webhook_id: string;"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing webhook endpoint and database schema",
      "status": "completed",
      "activeForm": "Exploring existing webhook endpoint and database schema"
    },
    {
      "content": "Plan multi-tenant approach",
      "status": "completed",
      "activeForm": "Planning multi-tenant approach"
    },
    {
      "content": "Add user_id to schema and types",
      "status": "completed",
      "activeForm": "Adding user_id to schema and types"
    },
    {
      "content": "Update query functions with user_id filtering",
      "status": "in_progress",
      "activeForm": "Updating query functions with user_id filtering"
    },
    {
      "content": "Update webhook endpoint to accept user_id",
      "status": "pending",
      "activeForm": "Updating webhook endpoint to accept user_id"
    },
    {
      "content": "Update search endpoint for multi-tenant filtering",
      "status": "pending",
      "activeForm": "Updating search endpoint for multi-tenant filtering"
    },
    {
      "content": "Generate Drizzle migration",
      "status": "pending",
      "activeForm": "Generating Drizzle migration"
    }
  ]
}
Now update the query functions in `webhookKeyPoints.ts` to accept and filter by `userId`.

🔧 Tool: Write
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\krisp\\webhookKeyPoints.ts",
  "content": "import sql from \"./db\";\nimport type {\n  KrispWebhook,\n  WebhookKeyPointsRow,\n} from \"@/types/webhook\";\n\n/**\n * Insert a new key points webhook into the database\n */\nexport async function insertWebhookKeyPoints(\n  webhook: KrispWebhook,\n  userId: string\n): Promise<WebhookKeyPointsRow> {\n  const { id, event, data } = webhook;\n  const { meeting, content, raw_meeting, raw_content } = data;\n\n  const rows = await sql`\n    INSERT INTO webhook_key_points (\n      user_id,\n      webhook_id,\n      event_type,\n      meeting_id,\n      meeting_title,\n      meeting_url,\n      meeting_start_date,\n      meeting_end_date,\n      meeting_duration,\n      speakers,\n      participants,\n      calendar_event_id,\n      content,\n      raw_meeting,\n      raw_content,\n      full_payload\n    ) VALUES (\n      ${userId},\n      ${id},\n      ${event},\n      ${meeting.id},\n      ${meeting.title},\n      ${meeting.url},\n      ${meeting.start_date ? new Date(meeting.start_date).toISOString() : null},\n      ${meeting.end_date ? new Date(meeting.end_date).toISOString() : null},\n      ${meeting.duration},\n      ${JSON.stringify(meeting.speakers)},\n      ${JSON.stringify(meeting.participants)},\n      ${meeting.calendar_event_id},\n      ${JSON.stringify(content)},\n      ${raw_meeting},\n      ${raw_content},\n      ${JSON.stringify(webhook)}\n    )\n    RETURNING *\n  `;\n\n  return rows[0] as WebhookKeyPointsRow;\n}\n\n/**\n * Get a webhook key points record by webhook ID\n */\nexport async function getWebhookKeyPointsByWebhookId(\n  webhookId: string\n): Promise<WebhookKeyPointsRow | null> {\n  const rows = await sql`\n    SELECT * FROM webhook_key_points WHERE webhook_id = ${webhookId}\n  `;\n  return (rows[0] as WebhookKeyPointsRow) || null;\n}\n\n/**\n * Get all webhook key points records for a meeting\n */\nexport async function getWebhookKeyPointsByMeetingId(\n  meetingId: string,\n  userId: string\n): Promise<WebhookKeyPointsRow[]> {\n  const rows = await sql`\n    SELECT * FROM webhook_key_points\n    WHERE meeting_id = ${meetingId} AND user_id = ${userId}\n    ORDER BY received_at DESC\n  `;\n  return rows as WebhookKeyPointsRow[];\n}\n\n/**\n * Get recent webhook key points records for a user\n */\nexport async function getRecentWebhookKeyPoints(\n  userId: string,\n  limit: number = 10\n): Promise<WebhookKeyPointsRow[]> {\n  const rows = await sql`\n    SELECT * FROM webhook_key_points\n    WHERE user_id = ${userId}\n    ORDER BY received_at DESC\n    LIMIT ${limit}\n  `;\n  return rows as WebhookKeyPointsRow[];\n}\n\n/**\n * Check if a webhook already exists (for idempotency)\n */\nexport async function webhookExists(webhookId: string): Promise<boolean> {\n  const rows = await sql`\n    SELECT 1 FROM webhook_key_points WHERE webhook_id = ${webhookId}\n  `;\n  return rows.length > 0;\n}\n\n/**\n * Search meetings by text using PostgreSQL full-text search\n * Searches across meeting title, raw_content (transcript), and key points\n */\nexport async function searchMeetings(\n  searchText: string,\n  userId: string,\n  limit: number = 10\n): Promise<WebhookKeyPointsRow[]> {\n  const rows = await sql`\n    SELECT *,\n      ts_rank(\n        to_tsvector('english', COALESCE(meeting_title, '') || ' ' || COALESCE(raw_content, '') || ' ' || COALESCE(content::text, '')),\n        plainto_tsquery('english', ${searchText})\n      ) as rank\n    FROM webhook_key_points\n    WHERE\n      user_id = ${userId}\n      AND to_tsvector('english', COALESCE(meeting_title, '') || ' ' || COALESCE(raw_content, '') || ' ' || COALESCE(content::text, ''))\n      @@ plainto_tsquery('english', ${searchText})\n    ORDER BY rank DESC, received_at DESC\n    LIMIT ${limit}\n  `;\n  return rows as WebhookKeyPointsRow[];\n}\n\n/**\n * Get all meetings with basic info for LLM context\n */\nexport async function getAllMeetingsSummary(\n  userId: string,\n  limit: number = 50\n): Promise<{ id: number; meeting_id: string; meeting_title: string | null; meeting_start_date: Date | null; speakers: string[]; content_preview: string }[]> {\n  const rows = await sql`\n    SELECT\n      id,\n      meeting_id,\n      meeting_title,\n      meeting_start_date,\n      speakers,\n      LEFT(raw_content, 500) as content_preview\n    FROM webhook_key_points\n    WHERE user_id = ${userId}\n    ORDER BY meeting_start_date DESC\n    LIMIT ${limit}\n  `;\n  return rows as { id: number; meeting_id: string; meeting_title: string | null; meeting_start_date: Date | null; speakers: string[]; content_preview: string }[];\n}\n\n/**\n * Get full meeting details by ID (scoped to user)\n */\nexport async function getMeetingById(\n  id: number,\n  userId: string\n): Promise<WebhookKeyPointsRow | null> {\n  const rows = await sql`\n    SELECT * FROM webhook_key_points WHERE id = ${id} AND user_id = ${userId}\n  `;\n  return (rows[0] as WebhookKeyPointsRow) || null;\n}\n\n/**\n * Simple keyword search (case-insensitive ILIKE)\n * Fallback when full-text search returns no results\n */\nexport async function searchMeetingsSimple(\n  searchText: string,\n  userId: string,\n  limit: number = 10\n): Promise<WebhookKeyPointsRow[]> {\n  const searchPattern = `%${searchText}%`;\n  const rows = await sql`\n    SELECT *\n    FROM webhook_key_points\n    WHERE\n      user_id = ${userId}\n      AND (\n        meeting_title ILIKE ${searchPattern}\n        OR raw_content ILIKE ${searchPattern}\n        OR content::text ILIKE ${searchPattern}\n      )\n    ORDER BY received_at DESC\n    LIMIT ${limit}\n  `;\n  return rows as WebhookKeyPointsRow[];\n}\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing webhook endpoint and database schema",
      "status": "completed",
      "activeForm": "Exploring existing webhook endpoint and database schema"
    },
    {
      "content": "Plan multi-tenant approach",
      "status": "completed",
      "activeForm": "Planning multi-tenant approach"
    },
    {
      "content": "Add user_id to schema and types",
      "status": "completed",
      "activeForm": "Adding user_id to schema and types"
    },
    {
      "content": "Update query functions with user_id filtering",
      "status": "completed",
      "activeForm": "Updating query functions with user_id filtering"
    },
    {
      "content": "Update webhook endpoint to accept user_id",
      "status": "in_progress",
      "activeForm": "Updating webhook endpoint to accept user_id"
    },
    {
      "content": "Update search endpoint for multi-tenant filtering",
      "status": "pending",
      "activeForm": "Updating search endpoint for multi-tenant filtering"
    },
    {
      "content": "Generate Drizzle migration",
      "status": "pending",
      "activeForm": "Generating Drizzle migration"
    }
  ]
}
Now update the webhook endpoint to accept `user_id` as a query parameter.

🔧 Tool: Write
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\webhooks\\key-points\\route.ts",
  "content": "import { NextRequest, NextResponse } from \"next/server\";\nimport {\n  insertWebhookKeyPoints,\n  webhookExists,\n} from \"@/lib/krisp/webhookKeyPoints\";\nimport type { KrispWebhook, WebhookEventType } from \"@/types/webhook\";\nimport { db } from \"@/lib/db\";\nimport { users } from \"@/lib/db/schema\";\nimport { eq } from \"drizzle-orm\";\n\nconst SUPPORTED_EVENTS: WebhookEventType[] = [\n  \"key_points_generated\",\n  \"transcript_created\",\n];\n\nconst WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;\n\n/**\n * Validates the authorization header against the configured webhook secret.\n * Supports both \"Bearer <token>\" and raw token formats.\n */\nfunction validateAuthorization(request: NextRequest): boolean {\n  if (!WEBHOOK_SECRET) {\n    console.warn(\"WEBHOOK_SECRET not configured - authorization disabled\");\n    return true;\n  }\n\n  const authHeader = request.headers.get(\"authorization\");\n  if (!authHeader) {\n    return false;\n  }\n\n  // Support both \"Bearer <token>\" and raw token formats\n  const token = authHeader.startsWith(\"Bearer \")\n    ? authHeader.slice(7)\n    : authHeader;\n\n  // Use timing-safe comparison to prevent timing attacks\n  if (token.length !== WEBHOOK_SECRET.length) {\n    return false;\n  }\n\n  let result = 0;\n  for (let i = 0; i < token.length; i++) {\n    result |= token.charCodeAt(i) ^ WEBHOOK_SECRET.charCodeAt(i);\n  }\n  return result === 0;\n}\n\nexport async function POST(request: NextRequest) {\n  try {\n    // Validate authorization header\n    if (!validateAuthorization(request)) {\n      return NextResponse.json(\n        { error: \"Unauthorized\" },\n        { status: 401 }\n      );\n    }\n\n    // Extract user_id from query parameter\n    const { searchParams } = new URL(request.url);\n    const userId = searchParams.get(\"user_id\");\n\n    if (!userId) {\n      return NextResponse.json(\n        { error: \"Missing required query parameter: user_id\" },\n        { status: 400 }\n      );\n    }\n\n    // Validate that the user exists\n    const [user] = await db\n      .select({ id: users.id })\n      .from(users)\n      .where(eq(users.id, userId));\n\n    if (!user) {\n      return NextResponse.json(\n        { error: \"Invalid user_id: user not found\" },\n        { status: 404 }\n      );\n    }\n\n    const payload = (await request.json()) as KrispWebhook;\n\n    // Validate required fields\n    if (!payload.id || !payload.event || !payload.data) {\n      return NextResponse.json(\n        { error: \"Invalid webhook payload: missing required fields\" },\n        { status: 400 }\n      );\n    }\n\n    // Check if this is a supported event type\n    if (!SUPPORTED_EVENTS.includes(payload.event as WebhookEventType)) {\n      return NextResponse.json(\n        { error: `Unsupported event type: ${payload.event}` },\n        { status: 400 }\n      );\n    }\n\n    // Validate meeting data\n    if (!payload.data.meeting || !payload.data.meeting.id) {\n      return NextResponse.json(\n        { error: \"Invalid webhook payload: missing meeting data\" },\n        { status: 400 }\n      );\n    }\n\n    // Check for duplicate webhook (idempotency)\n    const exists = await webhookExists(payload.id);\n    if (exists) {\n      return NextResponse.json(\n        { message: \"Webhook already processed\", webhook_id: payload.id },\n        { status: 200 }\n      );\n    }\n\n    // Insert the webhook data with user association\n    const result = await insertWebhookKeyPoints(payload, userId);\n\n    return NextResponse.json(\n      {\n        message: \"Webhook received and stored successfully\",\n        id: result.id,\n        webhook_id: result.webhook_id,\n      },\n      { status: 201 }\n    );\n  } catch (error) {\n    console.error(\"Error processing webhook:\", error);\n\n    // Handle unique constraint violation (duplicate webhook_id)\n    if (\n      error instanceof Error &&\n      error.message.includes(\"duplicate key value\")\n    ) {\n      return NextResponse.json(\n        { message: \"Webhook already processed\" },\n        { status: 200 }\n      );\n    }\n\n    return NextResponse.json(\n      { error: \"Internal server error\" },\n      { status: 500 }\n    );\n  }\n}\n\n// Optional: GET endpoint to retrieve stored webhooks\nexport async function GET(request: NextRequest) {\n  try {\n    // Validate authorization header\n    if (!validateAuthorization(request)) {\n      return NextResponse.json(\n        { error: \"Unauthorized\" },\n        { status: 401 }\n      );\n    }\n\n    const { searchParams } = new URL(request.url);\n    const userId = searchParams.get(\"user_id\");\n    const meetingId = searchParams.get(\"meeting_id\");\n    const limit = parseInt(searchParams.get(\"limit\") || \"10\", 10);\n\n    if (!userId) {\n      return NextResponse.json(\n        { error: \"Missing required query parameter: user_id\" },\n        { status: 400 }\n      );\n    }\n\n    const {\n      getWebhookKeyPointsByMeetingId,\n      getRecentWebhookKeyPoints,\n    } = await import(\"@/lib/krisp/webhookKeyPoints\");\n\n    let results;\n    if (meetingId) {\n      results = await getWebhookKeyPointsByMeetingId(meetingId, userId);\n    } else {\n      results = await getRecentWebhookKeyPoints(userId, limit);\n    }\n\n    return NextResponse.json({ data: results }, { status: 200 });\n  } catch (error) {\n    console.error(\"Error fetching webhooks:\", error);\n    return NextResponse.json(\n      { error: \"Internal server error\" },\n      { status: 500 }\n    );\n  }\n}\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing webhook endpoint and database schema",
      "status": "completed",
      "activeForm": "Exploring existing webhook endpoint and database schema"
    },
    {
      "content": "Plan multi-tenant approach",
      "status": "completed",
      "activeForm": "Planning multi-tenant approach"
    },
    {
      "content": "Add user_id to schema and types",
      "status": "completed",
      "activeForm": "Adding user_id to schema and types"
    },
    {
      "content": "Update query functions with user_id filtering",
      "status": "completed",
      "activeForm": "Updating query functions with user_id filtering"
    },
    {
      "content": "Update webhook endpoint to accept user_id",
      "status": "completed",
      "activeForm": "Updating webhook endpoint to accept user_id"
    },
    {
      "content": "Update search endpoint for multi-tenant filtering",
      "status": "in_progress",
      "activeForm": "Updating search endpoint for multi-tenant filtering"
    },
    {
      "content": "Generate Drizzle migration",
      "status": "pending",
      "activeForm": "Generating Drizzle migration"
    }
  ]
}
Now update the search endpoint to use session-based auth and scope queries to the logged-in user.

🔧 Tool: Write
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\search\\route.ts",
  "content": "import { NextRequest, NextResponse } from \"next/server\";\nimport Anthropic from \"@anthropic-ai/sdk\";\nimport { auth } from \"@/auth\";\nimport {\n  searchMeetings,\n  searchMeetingsSimple,\n  getAllMeetingsSummary,\n  getMeetingById,\n} from \"@/lib/krisp/webhookKeyPoints\";\nimport type { WebhookKeyPointsRow } from \"@/types/webhook\";\n\nconst anthropic = new Anthropic({\n  apiKey: process.env.ANTHROPIC_API_KEY,\n});\n\ninterface SearchResult {\n  meetings: WebhookKeyPointsRow[];\n  answer: string;\n  searchQuery: string;\n}\n\n/**\n * Get the authenticated user's ID from the session.\n * Returns null if not authenticated.\n */\nasync function getAuthenticatedUserId(): Promise<string | null> {\n  const session = await auth();\n  return session?.user?.id ?? null;\n}\n\n/**\n * POST /api/search\n * Natural language search across meeting transcripts using LLM\n */\nexport async function POST(request: NextRequest) {\n  try {\n    const userId = await getAuthenticatedUserId();\n    if (!userId) {\n      return NextResponse.json(\n        { error: \"Unauthorized\" },\n        { status: 401 }\n      );\n    }\n\n    const { query } = await request.json();\n\n    if (!query || typeof query !== \"string\") {\n      return NextResponse.json(\n        { error: \"Query is required\" },\n        { status: 400 }\n      );\n    }\n\n    // Step 1: Use LLM to extract search terms from natural language query\n    const searchTerms = await extractSearchTerms(query);\n\n    // Step 2: Search the database for relevant meetings (scoped to user)\n    let meetings = await searchMeetings(searchTerms, userId, 10);\n\n    // Fallback to simple search if full-text search returns no results\n    if (meetings.length === 0) {\n      meetings = await searchMeetingsSimple(searchTerms, userId, 10);\n    }\n\n    // Also try searching with individual words if still no results\n    if (meetings.length === 0) {\n      const words = searchTerms.split(/\\s+/).filter(w => w.length > 2);\n      for (const word of words) {\n        const wordResults = await searchMeetingsSimple(word, userId, 10);\n        if (wordResults.length > 0) {\n          meetings = wordResults;\n          break;\n        }\n      }\n    }\n\n    // Step 3: Always fetch recent meetings so the LLM has context for\n    // temporal queries like \"last meeting\" or \"most recent 1:1\"\n    const { getRecentWebhookKeyPoints } = await import(\"@/lib/krisp/webhookKeyPoints\");\n    const recentMeetings = await getRecentWebhookKeyPoints(userId, 5);\n\n    // Merge: search results first, then recent meetings (deduplicated)\n    const seenIds = new Set(meetings.map(m => m.id));\n    const allMeetings = [\n      ...meetings,\n      ...recentMeetings.filter(m => !seenIds.has(m.id)),\n    ];\n\n    if (allMeetings.length === 0) {\n      return NextResponse.json({\n        meetings: [],\n        answer: `No meetings found yet. Meetings will appear here once Krisp sends webhook data.`,\n        searchQuery: searchTerms,\n      } as SearchResult);\n    }\n\n    // Step 4: Use LLM to generate an answer based on the query and all available meeting data\n    const answer = await generateAnswer(query, allMeetings);\n\n    return NextResponse.json({\n      meetings: allMeetings,\n      answer,\n      searchQuery: searchTerms,\n    } as SearchResult);\n  } catch (error) {\n    console.error(\"Search error:\", error);\n    return NextResponse.json(\n      { error: \"Search failed\" },\n      { status: 500 }\n    );\n  }\n}\n\n/**\n * GET /api/search?q=query\n * Simple search endpoint\n */\nexport async function GET(request: NextRequest) {\n  try {\n    const userId = await getAuthenticatedUserId();\n    if (!userId) {\n      return NextResponse.json(\n        { error: \"Unauthorized\" },\n        { status: 401 }\n      );\n    }\n\n    const { searchParams } = new URL(request.url);\n    const query = searchParams.get(\"q\");\n    const meetingId = searchParams.get(\"meeting_id\");\n\n    if (meetingId) {\n      const meeting = await getMeetingById(parseInt(meetingId, 10), userId);\n      if (!meeting) {\n        return NextResponse.json(\n          { error: \"Meeting not found\" },\n          { status: 404 }\n        );\n      }\n      return NextResponse.json({ meeting });\n    }\n\n    if (!query) {\n      // Return recent meetings for this user\n      const summary = await getAllMeetingsSummary(userId, 20);\n      return NextResponse.json({ meetings: summary });\n    }\n\n    // Simple keyword search (scoped to user)\n    let meetings = await searchMeetings(query, userId, 10);\n    if (meetings.length === 0) {\n      meetings = await searchMeetingsSimple(query, userId, 10);\n    }\n\n    return NextResponse.json({ meetings });\n  } catch (error) {\n    console.error(\"Search error:\", error);\n    return NextResponse.json(\n      { error: \"Search failed\" },\n      { status: 500 }\n    );\n  }\n}\n\n/**\n * Extract search terms from natural language query using Claude\n */\nasync function extractSearchTerms(query: string): Promise<string> {\n  try {\n    const response = await anthropic.messages.create({\n      model: \"claude-sonnet-4-20250514\",\n      max_tokens: 100,\n      messages: [\n        {\n          role: \"user\",\n          content: `You are a search query optimizer. Extract the key search terms from this question about meeting transcripts.\nReturn only the essential keywords that would be useful for searching meeting transcripts.\nDo not include common words like \"meeting\", \"transcript\", \"find\", \"search\", etc.\nReturn just the search terms, nothing else.\n\nQuestion: ${query}`,\n        },\n      ],\n    });\n\n    const textBlock = response.content.find((block) => block.type === \"text\");\n    return textBlock?.text?.trim() || query;\n  } catch (error) {\n    console.error(\"Error extracting search terms:\", error);\n    // Fallback to original query if LLM fails\n    return query;\n  }\n}\n\n/**\n * Generate a natural language answer based on the query and meeting data\n */\nasync function generateAnswer(\n  query: string,\n  meetings: WebhookKeyPointsRow[]\n): Promise<string> {\n  try {\n    // Prepare meeting context for the LLM\n    const meetingContext = meetings.map((m, i) => {\n      const keyPoints = Array.isArray(m.content)\n        ? m.content.map((kp) => (\"description\" in kp ? kp.description : kp.text) || \"\").filter(Boolean).join(\"\\n- \")\n        : \"\";\n      return `\nMeeting ${i + 1}: \"${m.meeting_title || \"Untitled\"}\"\nDate: ${m.meeting_start_date ? new Date(m.meeting_start_date).toLocaleDateString() : \"Unknown\"}\nSpeakers: ${Array.isArray(m.speakers) ? m.speakers.map((s: unknown) => typeof s === \"string\" ? s : ((s as Record<string, string>).first_name || \"\") + \" \" + ((s as Record<string, string>).last_name || \"\")).map((n: string) => n.trim() || \"Unknown Speaker\").join(\", \") : \"Unknown\"}\nKey Points:\n- ${keyPoints}\nTranscript excerpt: ${m.raw_content?.slice(0, 1000) || \"No transcript available\"}\n---`;\n    }).join(\"\\n\");\n\n    const response = await anthropic.messages.create({\n      model: \"claude-sonnet-4-20250514\",\n      max_tokens: 500,\n      messages: [\n        {\n          role: \"user\",\n          content: `You are a helpful assistant that answers questions about meeting transcripts.\nYou have access to meeting data including titles, dates, speakers, key points, and transcripts.\nProvide concise, helpful answers based on the meeting data provided.\nIf you can't find the answer in the provided data, say so clearly.\nWhen referencing meetings, mention the meeting title and date.\n\nBased on the following meeting data, answer this question: \"${query}\"\n\nMeeting Data:\n${meetingContext}`,\n        },\n      ],\n    });\n\n    const textBlock = response.content.find((block) => block.type === \"text\");\n    return textBlock?.text?.trim() || \"I couldn't generate an answer.\";\n  } catch (error) {\n    console.error(\"Error generating answer:\", error);\n    return `Found ${meetings.length} relevant meeting(s). Unable to generate AI summary at this time.`;\n  }\n}\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing webhook endpoint and database schema",
      "status": "completed",
      "activeForm": "Exploring existing webhook endpoint and database schema"
    },
    {
      "content": "Plan multi-tenant approach",
      "status": "completed",
      "activeForm": "Planning multi-tenant approach"
    },
    {
      "content": "Add user_id to schema and types",
      "status": "completed",
      "activeForm": "Adding user_id to schema and types"
    },
    {
      "content": "Update query functions with user_id filtering",
      "status": "completed",
      "activeForm": "Updating query functions with user_id filtering"
    },
    {
      "content": "Update webhook endpoint to accept user_id",
      "status": "completed",
      "activeForm": "Updating webhook endpoint to accept user_id"
    },
    {
      "content": "Update search endpoint for multi-tenant filtering",
      "status": "completed",
      "activeForm": "Updating search endpoint for multi-tenant filtering"
    },
    {
      "content": "Generate Drizzle migration",
      "status": "in_progress",
      "activeForm": "Generating Drizzle migration"
    }
  ]
}
Now let me generate the Drizzle migration for the schema change. Let me check if there are existing migrations first.

🔧 Tool: Glob
Input: {
  "pattern": "drizzle/**/*"
}

🔧 Tool: Glob
Input: {
  "pattern": "db/**/*.sql"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\db\\migrations\\001_create_webhook_key_points.sql"
}
The project uses manual SQL migrations in `db/migrations/`. Let me create a migration to add the `user_id` column.

🔧 Tool: Write
Input: {
  "file_path": "C:\\Code\\Krisp\\db\\migrations\\002_add_user_id_to_webhook_key_points.sql",
  "content": "-- Migration: Add user_id column to webhook_key_points for multi-tenant support\n-- Description: Associates each webhook record with a specific user\n\n-- Add user_id column (nullable first for existing data)\nALTER TABLE webhook_key_points\nADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE;\n\n-- If there are existing rows and a known user, update them here:\n-- UPDATE webhook_key_points SET user_id = '<your-user-uuid>' WHERE user_id IS NULL;\n\n-- Once existing data is backfilled, make the column NOT NULL\n-- ALTER TABLE webhook_key_points ALTER COLUMN user_id SET NOT NULL;\n\n-- Index for efficient per-user queries\nCREATE INDEX IF NOT EXISTS idx_webhook_key_points_user_id ON webhook_key_points(user_id);\n\n-- Composite index for common filtered queries\nCREATE INDEX IF NOT EXISTS idx_webhook_key_points_user_received ON webhook_key_points(user_id, received_at DESC);\n"
}
Now let me verify the build compiles. Let me also check if there are any other files that import from the query functions that need updating.

🔧 Tool: Grep
Input: {
  "pattern": "from.*webhookKeyPoints|from.*krisp/",
  "glob": "**/*.{ts,tsx}"
}
Good — only the two files we already updated import from the query functions. Let me also check if the search endpoint is excluded from middleware auth, since it now needs auth.

Looking at the middleware, the `config.matcher` excludes `api/` routes entirely:
```
matcher: ["/((?!api/|_next/static|_next/image|favicon.ico).*)"]
```

This means the middleware doesn't run on API routes at all. The search endpoint now handles its own auth check via `auth()` directly, which is the correct approach since it needs the user ID from the session.

Let me verify the build compiles.

🔧 Tool: Bash
Input: {
  "command": "cd /c/Code/Krisp && npx tsc --noEmit 2>&1 | head -50",
  "description": "Type-check the project",
  "timeout": 120000
}
No TypeScript errors — the build passes cleanly. Let me mark the final task complete.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing webhook endpoint and database schema",
      "status": "completed",
      "activeForm": "Exploring existing webhook endpoint and database schema"
    },
    {
      "content": "Plan multi-tenant approach",
      "status": "completed",
      "activeForm": "Planning multi-tenant approach"
    },
    {
      "content": "Add user_id to schema and types",
      "status": "completed",
      "activeForm": "Adding user_id to schema and types"
    },
    {
      "content": "Update query functions with user_id filtering",
      "status": "completed",
      "activeForm": "Updating query functions with user_id filtering"
    },
    {
      "content": "Update webhook endpoint to accept user_id",
      "status": "completed",
      "activeForm": "Updating webhook endpoint to accept user_id"
    },
    {
      "content": "Update search endpoint for multi-tenant filtering",
      "status": "completed",
      "activeForm": "Updating search endpoint for multi-tenant filtering"
    },
    {
      "content": "Generate Drizzle migration",
      "status": "completed",
      "activeForm": "Generating Drizzle migration"
    }
  ]
}
All changes are implemented and the project type-checks clean. Here's what was done:

**Multi-tenant approach:**
- **Webhook ingestion** (`POST /api/webhooks/key-points?user_id=<uuid>`): The `user_id` is passed as a query parameter. This is the right pattern because webhook calls come from Krisp's servers (not the browser), so they can't use session cookies. The endpoint validates the user exists before inserting.
- **Search/read endpoints** (`/api/search`): The user ID is extracted from the authenticated session via `auth()`. Users can only see their own meetings — no `user_id` parameter needed since it comes from the JWT.
- **GET webhooks** (`GET /api/webhooks/key-points?user_id=<uuid>`): Also requires `user_id` param since it uses Bearer token auth (server-to-server).

**Migration note:** The SQL migration (`002_add_user_id_to_webhook_key_points.sql`) adds the column as nullable first so existing data isn't broken. There's a commented instruction to backfill existing rows and then make it `NOT NULL` once that's done.

<summary>
## Summary: Multi-tenant support for Krisp webhook endpoint

### Changes Implemented
- Added `user_id` (UUID, FK to `users.id`) column to `webhook_key_points` table in Drizzle schema
- Added `user_id` field to `WebhookKeyPointsRow` and `WebhookKeyPointsInsert` TypeScript interfaces
- Updated `insertWebhookKeyPoints()` to accept and store `userId` parameter
- Updated all query functions (`getRecentWebhookKeyPoints`, `getWebhookKeyPointsByMeetingId`, `searchMeetings`, `searchMeetingsSimple`, `getAllMeetingsSummary`, `getMeetingById`) to require `userId` and filter results with `WHERE user_id = $userId`
- Updated webhook POST endpoint to require `user_id` query parameter and validate user exists before inserting
- Updated webhook GET endpoint to require `user_id` query parameter for scoped retrieval
- Updated search endpoint (both POST and GET) to authenticate via NextAuth `auth()` session and scope all queries to the logged-in user's data
- Created SQL migration `002_add_user_id_to_webhook_key_points.sql` with indexes for efficient per-user queries

### Files Modified
- `lib/db/schema.ts` — Added `userId` column to `webhookKeyPoints` table
- `types/webhook.ts` — Added `user_id` to `WebhookKeyPointsRow` and `WebhookKeyPointsInsert`
- `lib/krisp/webhookKeyPoints.ts` — All query functions now accept and filter by `userId`
- `app/api/webhooks/key-points/route.ts` — Requires `user_id` query param, validates user, passes to insert
- `app/api/search/route.ts` — Uses `auth()` session for user ID, passes to all query functions

### Files Created
- `db/migrations/002_add_user_id_to_webhook_key_points.sql` — Migration to add `user_id` column and indexes

### Notes for Developer
- The migration adds `user_id` as nullable to preserve existing data. After backfilling existing rows with a valid user ID, uncomment the `ALTER COLUMN user_id SET NOT NULL` line.
- Webhook URL format is now: `POST /api/webhooks/key-points?user_id=<uuid>` — each user's Krisp integration should be configured with their specific user ID in the webhook URL.
- The search endpoint (`/api/search`) now requires authentication — unauthenticated requests return 401. The middleware matcher already excludes `/api/` routes, so auth is handled in the route handler itself via `auth()`.
</summary>