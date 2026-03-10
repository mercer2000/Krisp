

I'll start by exploring the codebase to understand the existing Outlook integration and calendar page structure.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing Outlook integration and calendar page",
      "status": "in_progress",
      "activeForm": "Exploring existing Outlook integration and calendar page"
    },
    {
      "content": "Plan calendar sync implementation approach",
      "status": "pending",
      "activeForm": "Planning calendar sync implementation approach"
    },
    {
      "content": "Implement calendar sync API and logic",
      "status": "pending",
      "activeForm": "Implementing calendar sync API and logic"
    },
    {
      "content": "Update calendar page UI to display synced events",
      "status": "pending",
      "activeForm": "Updating calendar page UI to display synced events"
    },
    {
      "content": "Add calendar sync settings to integration page",
      "status": "pending",
      "activeForm": "Adding calendar sync settings to integration page"
    }
  ]
}

🔧 Tool: Task
Input: {
  "description": "Explore Outlook integration code",
  "prompt": "Explore the codebase to understand the existing Outlook/Microsoft integration. I need to understand:\n\n1. How the Outlook integration is currently set up (OAuth, tokens, settings)\n2. The calendar page at app/calendar (or similar path)\n3. The integration/settings page structure\n4. Any existing Microsoft Graph API usage\n5. Database schema related to integrations and calendar\n6. How tokens are stored and refreshed\n\nSearch thoroughly for:\n- Files related to \"outlook\", \"microsoft\", \"calendar\", \"integration\"\n- OAuth configuration for Microsoft\n- Any existing calendar-related components or API routes\n- The integration settings page\n\nProvide a comprehensive summary of all relevant files, their purposes, and how they connect.",
  "subagent_type": "Explore"
}

🔧 Tool: Task
Input: {
  "description": "Explore database schema",
  "prompt": "Read the database schema file at lib/db/schema.ts and provide a comprehensive summary of:\n1. All tables related to integrations, calendar, users\n2. Column definitions and types\n3. Any relations defined\n4. RLS policies on relevant tables\n\nAlso check for any migration files related to calendar or outlook integrations.",
  "subagent_type": "Explore"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/*outlook*"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/*microsoft*"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\db\\schema.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/*calendar*"
}

🔧 Tool: Glob
Input: {
  "pattern": "drizzle/migrations/*.sql"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/*integration*"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/calendar/**"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/oauth*"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\drizzle\\migrations\\0010_add-calendar-events.sql"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\drizzle\\migrations\\0017_add-outlook-oauth.sql"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\drizzle\\migrations\\0003_add_graph_credentials.sql"
}

🔧 Tool: Glob
Input: {
  "pattern": "app/api/outlook/**"
}

🔧 Tool: Glob
Input: {
  "pattern": "lib/outlook/**"
}

🔧 Tool: Glob
Input: {
  "pattern": "lib/graph/**"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\drizzle\\migrations\\0002_smart_ares.sql"
}

🔧 Tool: Glob
Input: {
  "pattern": "app/(app)/admin/integrations/**"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\drizzle\\migrations\\0001_melodic_solo.sql"
}

🔧 Tool: Grep
Input: {
  "pattern": "outlook_integration|microsoft_integration|integration_type",
  "type": "sql"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\db\\schema.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\drizzle\\migrations\\0017_add-outlook-oauth.sql"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\drizzle\\migrations\\0010_add-calendar-events.sql"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\drizzle\\migrations\\0006_add-zoom-chat-integration.sql"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\outlook\\oauth.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\outlook\\db.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\outlook\\messages.ts"
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
  "file_path": "C:\\Code\\Krisp\\app\\api\\outlook\\sync\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\calendar\\sync\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\calendar\\upcoming\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\graph\\calendar.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\graph\\credentials.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\calendar\\page.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\page.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "offset": 1,
  "limit": 200
}

🔧 Tool: Grep
Input: {
  "pattern": "outlook|microsoft|calendar|credentials|graph",
  "type": "ts,tsx",
  "path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations",
  "output_mode": "content",
  "head_limit": 100
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\graph\\subscriptions.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\graph\\messages.ts"
}

🔧 Tool: Bash
Input: {
  "command": "grep -n \"outlook\\|microsoft\\|calendar\\|graph\" \"C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx\" | head -60"
}

🔧 Tool: Bash
Input: {
  "command": "find /c/Code/Krisp -type f \\( -name \"*.ts\" -o -name \"*.tsx\" \\) -path \"*/lib/hooks/*\" | head -20"
}

🔧 Tool: Glob
Input: {
  "pattern": "lib/hooks/use*"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\hooks\\useCalendar.ts"
}

🔧 Tool: Bash
Input: {
  "command": "find /c/Code/Krisp/app/api -type d | grep -E \"(outlook|calendar|graph)\" | head -20"
}

🔧 Tool: Glob
Input: {
  "pattern": "app/api/graph/**"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\graph\\credentials\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\graph\\subscriptions\\route.ts"
}

🔧 Tool: Bash
Input: {
  "command": "find /c/Code/Krisp/app/api/webhooks -type f -name \"*.ts\" | head -20"
}

🔧 Tool: Bash
Input: {
  "command": "grep -r \"OAUTH_OUTLOOK\" /c/Code/Krisp --include=\"*.ts\" --include=\"*.tsx\" --include=\"*.json\" --include=\".env*\" 2>/dev/null | grep -v node_modules | grep -v \".next\" | head -20"
}

🔧 Tool: Bash
Input: {
  "command": "find /c/Code/Krisp -name \".env*\" -o -name \"*.example\" | grep -v node_modules | head -10"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\.env.example"
}
Now I have a thorough understanding of the codebase. Let me read the key files I'll need to modify.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\calendar\\page.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\outlook\\oauth.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\graph\\calendar.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\calendar\\sync\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\hooks\\useCalendar.ts"
}
Now let me read the Outlook OAuth route, the integration page, and the Outlook messages module to understand the full picture.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\outlook\\oauth\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\outlook\\messages.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\calendar\\upcoming\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\outlook\\db.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\db\\encryption-helpers.ts"
}
Now let me check the Outlook OAuth scopes and the integration client page to understand the current Outlook tab setup.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing Outlook integration and calendar page",
      "status": "completed",
      "activeForm": "Exploring existing Outlook integration and calendar page"
    },
    {
      "content": "Plan calendar sync implementation approach",
      "status": "in_progress",
      "activeForm": "Planning calendar sync implementation approach"
    },
    {
      "content": "Implement Outlook calendar sync library (lib/outlook/calendar.ts)",
      "status": "pending",
      "activeForm": "Implementing Outlook calendar sync library"
    },
    {
      "content": "Create Outlook calendar sync API route",
      "status": "pending",
      "activeForm": "Creating Outlook calendar sync API route"
    },
    {
      "content": "Update OAuth scopes to include Calendars.Read",
      "status": "pending",
      "activeForm": "Updating OAuth scopes to include Calendars.Read"
    },
    {
      "content": "Update calendar page to support both Graph and Outlook sources",
      "status": "pending",
      "activeForm": "Updating calendar page to support both Graph and Outlook sources"
    },
    {
      "content": "Add Outlook calendar sync to integration page",
      "status": "pending",
      "activeForm": "Adding Outlook calendar sync to integration page"
    }
  ]
}
Let me check the integration page more carefully for the Outlook tab section.

🔧 Tool: Grep
Input: {
  "pattern": "Outlook\\.com|OutlookConnection|outlook.*tab|calendar.*sync|Calendar.*Sync",
  "path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "output_mode": "content",
  "-n": true
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\types\\index.ts"
}
Now let me read the relevant sections of the IntegrationsClient to see the Outlook tab.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "offset": 1570,
  "limit": 200
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "offset": 3430,
  "limit": 250
}
Now I have a thorough understanding of the codebase. Let me also check the OutlookIntegrationManager component to see its structure.

🔧 Tool: Grep
Input: {
  "pattern": "function OutlookIntegrationManager",
  "path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "output_mode": "content",
  "-n": true
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "offset": 1477,
  "limit": 100
}
Now I have all the context I need. Let me plan and implement the feature. Here's the approach:

1. **The Outlook OAuth currently requests `Mail.Read Mail.ReadWrite` scopes but NOT `Calendars.Read`** - need to add calendar scopes
2. **Create `lib/outlook/calendar.ts`** - fetch calendar events from Microsoft Graph using delegated auth (`/me/calendarView`)
3. **Create `app/api/outlook/calendar/sync/route.ts`** - API route to trigger Outlook calendar sync
4. **Update the calendar page** to also check for Outlook connection (not just Graph credentials)
5. **Update the integration page** to add a calendar sync button alongside the email sync
6. **Add hooks** for Outlook calendar sync

Let me implement all of this.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing Outlook integration and calendar page",
      "status": "completed",
      "activeForm": "Exploring existing Outlook integration and calendar page"
    },
    {
      "content": "Plan calendar sync implementation approach",
      "status": "completed",
      "activeForm": "Planning calendar sync implementation approach"
    },
    {
      "content": "Update OAuth scopes to include Calendars.Read",
      "status": "in_progress",
      "activeForm": "Updating OAuth scopes to include Calendars.Read"
    },
    {
      "content": "Create Outlook calendar sync library (lib/outlook/calendar.ts)",
      "status": "pending",
      "activeForm": "Creating Outlook calendar sync library"
    },
    {
      "content": "Create Outlook calendar sync API route",
      "status": "pending",
      "activeForm": "Creating Outlook calendar sync API route"
    },
    {
      "content": "Update calendar hooks for Outlook support",
      "status": "pending",
      "activeForm": "Updating calendar hooks for Outlook support"
    },
    {
      "content": "Update calendar page to support Outlook integration",
      "status": "pending",
      "activeForm": "Updating calendar page to support Outlook integration"
    },
    {
      "content": "Add calendar sync button to Outlook integration page section",
      "status": "pending",
      "activeForm": "Adding calendar sync button to Outlook integration page section"
    }
  ]
}
First, update the OAuth scopes to include `Calendars.Read`.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\lib\\outlook\\oauth.ts",
  "old_string": "    scope: \"openid profile email Mail.Read Mail.ReadWrite offline_access User.Read\",\n    state,\n    prompt: \"consent\",",
  "new_string": "    scope: \"openid profile email Mail.Read Mail.ReadWrite Calendars.Read offline_access User.Read\",\n    state,\n    prompt: \"consent\","
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\lib\\outlook\\oauth.ts",
  "old_string": "      scope: \"openid profile email Mail.Read Mail.ReadWrite offline_access User.Read\",",
  "new_string": "      scope: \"openid profile email Mail.Read Mail.ReadWrite Calendars.Read offline_access User.Read\","
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing Outlook integration and calendar page",
      "status": "completed",
      "activeForm": "Exploring existing Outlook integration and calendar page"
    },
    {
      "content": "Plan calendar sync implementation approach",
      "status": "completed",
      "activeForm": "Planning calendar sync implementation approach"
    },
    {
      "content": "Update OAuth scopes to include Calendars.Read",
      "status": "completed",
      "activeForm": "Updating OAuth scopes to include Calendars.Read"
    },
    {
      "content": "Create Outlook calendar sync library (lib/outlook/calendar.ts)",
      "status": "in_progress",
      "activeForm": "Creating Outlook calendar sync library"
    },
    {
      "content": "Create Outlook calendar sync API route",
      "status": "pending",
      "activeForm": "Creating Outlook calendar sync API route"
    },
    {
      "content": "Update calendar hooks for Outlook support",
      "status": "pending",
      "activeForm": "Updating calendar hooks for Outlook support"
    },
    {
      "content": "Update calendar page to support Outlook integration",
      "status": "pending",
      "activeForm": "Updating calendar page to support Outlook integration"
    },
    {
      "content": "Add calendar sync button to Outlook integration page section",
      "status": "pending",
      "activeForm": "Adding calendar sync button to Outlook integration page section"
    }
  ]
}
Now create the Outlook calendar sync library. This uses delegated auth (`/me/calendarView`) instead of the Graph API's app-only auth (`/users/{mailbox}/calendarView`).

🔧 Tool: Write
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\outlook\\calendar.ts",
  "content": "import { db } from \"@/lib/db\";\nimport { calendarEvents, calendarSyncState } from \"@/lib/db/schema\";\nimport { eq, and, gte, lte, asc } from \"drizzle-orm\";\nimport {\n  encryptFields,\n  decryptRows,\n  CALENDAR_EVENT_ENCRYPTED_FIELDS,\n} from \"@/lib/db/encryption-helpers\";\nimport type { GraphCalendarEvent } from \"@/lib/graph/calendar\";\n\nconst GRAPH_BASE = \"https://graph.microsoft.com/v1.0\";\n\n/**\n * Fetch calendar events from the authenticated user's calendar using\n * delegated permissions (/me/calendarView).\n */\nexport async function fetchOutlookCalendarEvents(\n  accessToken: string,\n  startDate: Date,\n  endDate: Date\n): Promise<GraphCalendarEvent[]> {\n  const select = [\n    \"id\",\n    \"subject\",\n    \"bodyPreview\",\n    \"body\",\n    \"start\",\n    \"end\",\n    \"isAllDay\",\n    \"location\",\n    \"organizer\",\n    \"attendees\",\n    \"webLink\",\n    \"isCancelled\",\n    \"showAs\",\n    \"importance\",\n    \"type\",\n    \"seriesMasterId\",\n  ].join(\",\");\n\n  const startISO = startDate.toISOString();\n  const endISO = endDate.toISOString();\n\n  const url = `${GRAPH_BASE}/me/calendarView?startDateTime=${startISO}&endDateTime=${endISO}&$select=${select}&$orderby=start/dateTime asc&$top=250`;\n\n  const allEvents: GraphCalendarEvent[] = [];\n  let nextLink: string | null = url;\n\n  while (nextLink) {\n    const res = await fetch(nextLink, {\n      headers: {\n        Authorization: `Bearer ${accessToken}`,\n        Prefer: 'outlook.timezone=\"UTC\"',\n      },\n    });\n\n    if (!res.ok) {\n      const errorBody = await res.text().catch(() => \"\");\n      console.warn(\n        `[Outlook Calendar] Failed to fetch events: ${res.status}`,\n        errorBody\n      );\n      break;\n    }\n\n    const data: { value?: GraphCalendarEvent[]; \"@odata.nextLink\"?: string } =\n      await res.json();\n    allEvents.push(...(data.value || []));\n    nextLink = data[\"@odata.nextLink\"] || null;\n  }\n\n  return allEvents;\n}\n\n/**\n * Map a Graph calendar event to the database shape.\n * credentialId is null for Outlook delegated-auth syncs.\n */\nfunction mapOutlookEvent(event: GraphCalendarEvent, tenantId: string) {\n  const isRecurring =\n    event.type === \"occurrence\" ||\n    event.type === \"exception\" ||\n    !!event.seriesMasterId;\n\n  return {\n    tenantId,\n    credentialId: null as string | null,\n    graphEventId: event.id,\n    subject: event.subject || null,\n    bodyPreview: event.bodyPreview || null,\n    bodyHtml:\n      event.body?.contentType === \"html\" ? event.body.content || null : null,\n    startDateTime: new Date(\n      event.start.dateTime +\n        (event.start.dateTime.endsWith(\"Z\") ? \"\" : \"Z\")\n    ),\n    endDateTime: new Date(\n      event.end.dateTime +\n        (event.end.dateTime.endsWith(\"Z\") ? \"\" : \"Z\")\n    ),\n    isAllDay: event.isAllDay ?? false,\n    location: event.location?.displayName || null,\n    organizerEmail: event.organizer?.emailAddress?.address || null,\n    organizerName: event.organizer?.emailAddress?.name || null,\n    attendees: (event.attendees || []).map((a) => ({\n      email: a.emailAddress?.address || \"\",\n      name: a.emailAddress?.name || \"\",\n      response: a.status?.response || \"none\",\n      type: a.type || \"required\",\n    })),\n    webLink: event.webLink || null,\n    isCancelled: event.isCancelled ?? false,\n    showAs: event.showAs || null,\n    importance: event.importance || null,\n    isRecurring,\n    seriesMasterId: event.seriesMasterId || null,\n    rawPayload: event as unknown as Record<string, unknown>,\n    lastSyncedAt: new Date(),\n    updatedAt: new Date(),\n  };\n}\n\n/**\n * Sync Outlook calendar events into the database using delegated auth.\n * Uses upsert for deduplication by (tenantId, graphEventId).\n */\nexport async function syncOutlookCalendarEvents(\n  tenantId: string,\n  outlookEmail: string,\n  accessToken: string,\n  startDate: Date,\n  endDate: Date\n): Promise<{ synced: number; errors: number }> {\n  const events = await fetchOutlookCalendarEvents(\n    accessToken,\n    startDate,\n    endDate\n  );\n\n  let synced = 0;\n  let errors = 0;\n\n  for (const event of events) {\n    try {\n      const mapped = mapOutlookEvent(event, tenantId);\n      const encrypted = encryptFields(mapped, CALENDAR_EVENT_ENCRYPTED_FIELDS);\n      await db\n        .insert(calendarEvents)\n        .values(encrypted)\n        .onConflictDoUpdate({\n          target: [calendarEvents.tenantId, calendarEvents.graphEventId],\n          set: {\n            subject: encrypted.subject,\n            bodyPreview: encrypted.bodyPreview,\n            bodyHtml: encrypted.bodyHtml,\n            startDateTime: encrypted.startDateTime,\n            endDateTime: encrypted.endDateTime,\n            isAllDay: encrypted.isAllDay,\n            location: encrypted.location,\n            organizerEmail: encrypted.organizerEmail,\n            organizerName: encrypted.organizerName,\n            attendees: encrypted.attendees,\n            webLink: encrypted.webLink,\n            isCancelled: encrypted.isCancelled,\n            showAs: encrypted.showAs,\n            importance: encrypted.importance,\n            isRecurring: encrypted.isRecurring,\n            seriesMasterId: encrypted.seriesMasterId,\n            rawPayload: encrypted.rawPayload,\n            lastSyncedAt: encrypted.lastSyncedAt,\n            updatedAt: encrypted.updatedAt,\n          },\n        });\n      synced++;\n    } catch (err) {\n      console.warn(`[Outlook Calendar] Error upserting event ${event.id}:`, err);\n      errors++;\n    }\n  }\n\n  // Update sync state (credentialId is null for Outlook delegated-auth)\n  // Use a sentinel credential ID since the unique constraint requires it\n  await updateOutlookCalendarSyncState(tenantId, outlookEmail);\n\n  return { synced, errors };\n}\n\n/**\n * Update sync state for Outlook calendar.\n * Since calendar_sync_state.credentialId is NOT NULL, we use a deterministic\n * UUID derived from the tenant for Outlook OAuth-based syncs.\n */\nasync function updateOutlookCalendarSyncState(\n  tenantId: string,\n  mailbox: string\n) {\n  // Use a deterministic \"sentinel\" credentialId for Outlook OAuth syncs.\n  // We store a sync state row with credentialId = tenantId itself to track\n  // Outlook calendar syncs separately from Graph API syncs.\n  // Since credentialId references graph_credentials which may not exist,\n  // we set it to null and update via raw SQL to bypass the FK constraint.\n  const sql = (await import(\"./db\")).default;\n\n  await sql`\n    INSERT INTO calendar_sync_state (tenant_id, credential_id, mailbox, last_sync_at)\n    VALUES (${tenantId}, NULL, ${mailbox}, NOW())\n    ON CONFLICT (tenant_id, credential_id, mailbox)\n    DO UPDATE SET last_sync_at = NOW(), updated_at = NOW()\n  `;\n}\n\n/**\n * Get Outlook calendar sync state for a tenant.\n */\nexport async function getOutlookCalendarSyncState(tenantId: string) {\n  const sql = (await import(\"./db\")).default;\n  const rows = await sql`\n    SELECT * FROM calendar_sync_state\n    WHERE tenant_id = ${tenantId} AND credential_id IS NULL AND active = true\n    ORDER BY last_sync_at DESC\n    LIMIT 1\n  `;\n  return rows[0] || null;\n}\n\n/**\n * Get calendar events for an Outlook-synced tenant (credentialId is null).\n */\nexport async function getOutlookCalendarEventsInRange(\n  tenantId: string,\n  start: Date,\n  end: Date\n) {\n  const rows = await db\n    .select()\n    .from(calendarEvents)\n    .where(\n      and(\n        eq(calendarEvents.tenantId, tenantId),\n        gte(calendarEvents.startDateTime, start),\n        lte(calendarEvents.endDateTime, end)\n      )\n    )\n    .orderBy(asc(calendarEvents.startDateTime));\n  return decryptRows(\n    rows as Record<string, unknown>[],\n    CALENDAR_EVENT_ENCRYPTED_FIELDS\n  ) as typeof rows;\n}\n"
}
Wait - I need to check the schema constraint on `calendar_sync_state.credentialId`. Let me verify.

🔧 Tool: Grep
Input: {
  "pattern": "calendarSyncState|calendar_sync_state",
  "path": "C:\\Code\\Krisp\\lib\\db\\schema.ts",
  "output_mode": "content",
  "-n": true,
  "context": 5
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\db\\schema.ts",
  "offset": 740,
  "limit": 40
}
I see - `credentialId` is `notNull()` with a FK to `graphCredentials`. This means we can't use `NULL` for Outlook calendar syncs. I need to take a different approach. Instead of trying to use the existing `calendarSyncState` table, I'll track Outlook calendar sync state through the `outlook_oauth_tokens.last_sync_at` field (repurposed — or add a specific column).

Actually, looking more carefully, the simplest approach is to just store the last calendar sync timestamp in the `outlook_oauth_tokens` table. We already have `last_sync_at` there. But that's being used for email sync. Let me think about this differently.

The cleanest approach: don't track a separate sync state for Outlook calendar. Just use the `outlook_oauth_tokens.last_sync_at` for general "last sync" and let the calendar events be stored in the same `calendar_events` table with `credentialId = null`. The calendar page already queries `calendar_events` regardless of `credentialId`. The sync state tracking will just use a dedicated column on `outlook_oauth_tokens`.

Let me update the approach - I'll add a `last_calendar_sync_at` column to `outlook_oauth_tokens`, and update the library accordingly.

Actually, let me keep it even simpler. We don't need a separate sync state table entry at all. The calendar page uses `useSyncState()` which checks for Graph credentials. For Outlook, we'll use a separate hook that checks the Outlook OAuth status. The calendar events themselves go into the same `calendar_events` table with `credentialId = null`.

Let me update the library to skip the sync state tracking and just store events.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\outlook\\calendar.ts"
}
The `calendar_sync_state.credential_id` has a `NOT NULL` constraint and an FK to `graph_credentials`. We can't bypass this cleanly. The simplest approach is to track the last calendar sync time directly on `outlook_oauth_tokens` and skip the `calendar_sync_state` table entirely for Outlook-based syncs. The existing `last_sync_at` is used for email sync, so I'll add a `last_calendar_sync_at` column.

But adding a migration/schema change adds complexity. Let me use an even simpler approach: just use `updateOutlookLastSync` to track when we last synced (email or calendar), and use the `outlookOauthTokens` status as the "sync state" indicator. The calendar page will check the Outlook connection status to determine if the user has an Outlook connection, and we can track calendar-specific sync state via a simple raw SQL update.

Actually, the cleanest approach is just: update the `outlook_oauth_tokens` table with a new `last_calendar_sync_at` column via raw SQL, no Drizzle schema change needed. But that requires a migration too.

Let me simplify even further. The calendar page already queries `calendar_events` for any events belonging to the tenant. The Outlook sync will just insert events there. For the sync state, we can just update `outlook_oauth_tokens.last_sync_at` since that serves the same purpose. And on the calendar page, we'll check if the user has an Outlook connection to enable the sync button.

Let me rewrite the library file to be cleaner:

🔧 Tool: Write
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\outlook\\calendar.ts",
  "content": "import { db } from \"@/lib/db\";\nimport { calendarEvents } from \"@/lib/db/schema\";\nimport {\n  encryptFields,\n  CALENDAR_EVENT_ENCRYPTED_FIELDS,\n} from \"@/lib/db/encryption-helpers\";\nimport type { GraphCalendarEvent } from \"@/lib/graph/calendar\";\nimport { updateOutlookLastSync } from \"./oauth\";\n\nconst GRAPH_BASE = \"https://graph.microsoft.com/v1.0\";\n\n/**\n * Fetch calendar events from the authenticated user's calendar using\n * delegated permissions (/me/calendarView).\n */\nexport async function fetchOutlookCalendarEvents(\n  accessToken: string,\n  startDate: Date,\n  endDate: Date\n): Promise<GraphCalendarEvent[]> {\n  const select = [\n    \"id\",\n    \"subject\",\n    \"bodyPreview\",\n    \"body\",\n    \"start\",\n    \"end\",\n    \"isAllDay\",\n    \"location\",\n    \"organizer\",\n    \"attendees\",\n    \"webLink\",\n    \"isCancelled\",\n    \"showAs\",\n    \"importance\",\n    \"type\",\n    \"seriesMasterId\",\n  ].join(\",\");\n\n  const startISO = startDate.toISOString();\n  const endISO = endDate.toISOString();\n\n  const url = `${GRAPH_BASE}/me/calendarView?startDateTime=${startISO}&endDateTime=${endISO}&$select=${select}&$orderby=start/dateTime asc&$top=250`;\n\n  const allEvents: GraphCalendarEvent[] = [];\n  let nextLink: string | null = url;\n\n  while (nextLink) {\n    const res = await fetch(nextLink, {\n      headers: {\n        Authorization: `Bearer ${accessToken}`,\n        Prefer: 'outlook.timezone=\"UTC\"',\n      },\n    });\n\n    if (!res.ok) {\n      const errorBody = await res.text().catch(() => \"\");\n      console.warn(\n        `[Outlook Calendar] Failed to fetch events: ${res.status}`,\n        errorBody\n      );\n      break;\n    }\n\n    const data: { value?: GraphCalendarEvent[]; \"@odata.nextLink\"?: string } =\n      await res.json();\n    allEvents.push(...(data.value || []));\n    nextLink = data[\"@odata.nextLink\"] || null;\n  }\n\n  return allEvents;\n}\n\n/**\n * Map a Graph calendar event to the database shape.\n * credentialId is null for Outlook delegated-auth syncs.\n */\nfunction mapOutlookEvent(event: GraphCalendarEvent, tenantId: string) {\n  const isRecurring =\n    event.type === \"occurrence\" ||\n    event.type === \"exception\" ||\n    !!event.seriesMasterId;\n\n  return {\n    tenantId,\n    credentialId: null as string | null,\n    graphEventId: event.id,\n    subject: event.subject || null,\n    bodyPreview: event.bodyPreview || null,\n    bodyHtml:\n      event.body?.contentType === \"html\" ? event.body.content || null : null,\n    startDateTime: new Date(\n      event.start.dateTime +\n        (event.start.dateTime.endsWith(\"Z\") ? \"\" : \"Z\")\n    ),\n    endDateTime: new Date(\n      event.end.dateTime +\n        (event.end.dateTime.endsWith(\"Z\") ? \"\" : \"Z\")\n    ),\n    isAllDay: event.isAllDay ?? false,\n    location: event.location?.displayName || null,\n    organizerEmail: event.organizer?.emailAddress?.address || null,\n    organizerName: event.organizer?.emailAddress?.name || null,\n    attendees: (event.attendees || []).map((a) => ({\n      email: a.emailAddress?.address || \"\",\n      name: a.emailAddress?.name || \"\",\n      response: a.status?.response || \"none\",\n      type: a.type || \"required\",\n    })),\n    webLink: event.webLink || null,\n    isCancelled: event.isCancelled ?? false,\n    showAs: event.showAs || null,\n    importance: event.importance || null,\n    isRecurring,\n    seriesMasterId: event.seriesMasterId || null,\n    rawPayload: event as unknown as Record<string, unknown>,\n    lastSyncedAt: new Date(),\n    updatedAt: new Date(),\n  };\n}\n\n/**\n * Sync Outlook calendar events into the database using delegated auth.\n * Uses upsert for deduplication by (tenantId, graphEventId).\n * Stores events in the shared calendar_events table with credentialId = null.\n */\nexport async function syncOutlookCalendarEvents(\n  tenantId: string,\n  accessToken: string,\n  startDate: Date,\n  endDate: Date\n): Promise<{ synced: number; errors: number }> {\n  const events = await fetchOutlookCalendarEvents(\n    accessToken,\n    startDate,\n    endDate\n  );\n\n  let synced = 0;\n  let errors = 0;\n\n  for (const event of events) {\n    try {\n      const mapped = mapOutlookEvent(event, tenantId);\n      const encrypted = encryptFields(mapped, CALENDAR_EVENT_ENCRYPTED_FIELDS);\n      await db\n        .insert(calendarEvents)\n        .values(encrypted)\n        .onConflictDoUpdate({\n          target: [calendarEvents.tenantId, calendarEvents.graphEventId],\n          set: {\n            subject: encrypted.subject,\n            bodyPreview: encrypted.bodyPreview,\n            bodyHtml: encrypted.bodyHtml,\n            startDateTime: encrypted.startDateTime,\n            endDateTime: encrypted.endDateTime,\n            isAllDay: encrypted.isAllDay,\n            location: encrypted.location,\n            organizerEmail: encrypted.organizerEmail,\n            organizerName: encrypted.organizerName,\n            attendees: encrypted.attendees,\n            webLink: encrypted.webLink,\n            isCancelled: encrypted.isCancelled,\n            showAs: encrypted.showAs,\n            importance: encrypted.importance,\n            isRecurring: encrypted.isRecurring,\n            seriesMasterId: encrypted.seriesMasterId,\n            rawPayload: encrypted.rawPayload,\n            lastSyncedAt: encrypted.lastSyncedAt,\n            updatedAt: encrypted.updatedAt,\n          },\n        });\n      synced++;\n    } catch (err) {\n      console.warn(`[Outlook Calendar] Error upserting event ${event.id}:`, err);\n      errors++;\n    }\n  }\n\n  // Update the last sync timestamp on the outlook token record\n  await updateOutlookLastSync(tenantId);\n\n  return { synced, errors };\n}\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing Outlook integration and calendar page",
      "status": "completed",
      "activeForm": "Exploring existing Outlook integration and calendar page"
    },
    {
      "content": "Plan calendar sync implementation approach",
      "status": "completed",
      "activeForm": "Planning calendar sync implementation approach"
    },
    {
      "content": "Update OAuth scopes to include Calendars.Read",
      "status": "completed",
      "activeForm": "Updating OAuth scopes to include Calendars.Read"
    },
    {
      "content": "Create Outlook calendar sync library (lib/outlook/calendar.ts)",
      "status": "completed",
      "activeForm": "Creating Outlook calendar sync library"
    },
    {
      "content": "Create Outlook calendar sync API route",
      "status": "in_progress",
      "activeForm": "Creating Outlook calendar sync API route"
    },
    {
      "content": "Update calendar hooks for Outlook support",
      "status": "pending",
      "activeForm": "Updating calendar hooks for Outlook support"
    },
    {
      "content": "Update calendar page to support Outlook integration",
      "status": "pending",
      "activeForm": "Updating calendar page to support Outlook integration"
    },
    {
      "content": "Add calendar sync button to Outlook integration page section",
      "status": "pending",
      "activeForm": "Adding calendar sync button to Outlook integration page section"
    }
  ]
}
Now create the API route for Outlook calendar sync.

🔧 Tool: Bash
Input: {
  "command": "ls \"C:\\Code\\Krisp\\app\\api\\outlook\"",
  "description": "List existing Outlook API routes"
}

🔧 Tool: Bash
Input: {
  "command": "mkdir -p \"C:\\Code\\Krisp\\app\\api\\outlook\\calendar\"",
  "description": "Create Outlook calendar API directory"
}

🔧 Tool: Write
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\outlook\\calendar\\route.ts",
  "content": "import { auth } from \"@/auth\";\nimport { NextRequest, NextResponse } from \"next/server\";\nimport { getValidOutlookAccessToken, getOutlookTokenForTenant } from \"@/lib/outlook/oauth\";\nimport { syncOutlookCalendarEvents } from \"@/lib/outlook/calendar\";\n\n/**\n * POST /api/outlook/calendar\n * Trigger a calendar sync using the user's Outlook OAuth connection.\n *\n * Body: { daysBack?, daysForward? }\n */\nexport async function POST(request: NextRequest) {\n  try {\n    const session = await auth();\n    const userId = session?.user?.id;\n    if (!userId) {\n      return NextResponse.json({ error: \"Unauthorized\" }, { status: 401 });\n    }\n\n    let body: { daysBack?: number; daysForward?: number };\n    try {\n      body = await request.json();\n    } catch {\n      body = {};\n    }\n\n    // Verify the user has an active Outlook connection\n    const token = await getOutlookTokenForTenant(userId);\n    if (!token) {\n      return NextResponse.json(\n        { error: \"No active Outlook connection. Please connect your Outlook account first.\" },\n        { status: 400 }\n      );\n    }\n\n    let accessToken: string;\n    try {\n      accessToken = await getValidOutlookAccessToken(userId);\n    } catch (error) {\n      const message =\n        error instanceof Error\n          ? error.message\n          : \"Failed to obtain access token\";\n      return NextResponse.json({ error: message }, { status: 400 });\n    }\n\n    const daysBack = Math.min(body.daysBack ?? 7, 90);\n    const daysForward = Math.min(body.daysForward ?? 30, 180);\n\n    const startDate = new Date();\n    startDate.setDate(startDate.getDate() - daysBack);\n    startDate.setHours(0, 0, 0, 0);\n\n    const endDate = new Date();\n    endDate.setDate(endDate.getDate() + daysForward);\n    endDate.setHours(23, 59, 59, 999);\n\n    const result = await syncOutlookCalendarEvents(\n      userId,\n      accessToken,\n      startDate,\n      endDate\n    );\n\n    return NextResponse.json({\n      message: \"Outlook calendar sync complete\",\n      synced: result.synced,\n      errors: result.errors,\n      range: {\n        start: startDate.toISOString(),\n        end: endDate.toISOString(),\n      },\n    });\n  } catch (error) {\n    console.error(\"Error syncing Outlook calendar:\", error);\n    return NextResponse.json(\n      { error: \"Internal server error\" },\n      { status: 500 }\n    );\n  }\n}\n\n/**\n * GET /api/outlook/calendar\n * Get the Outlook calendar sync status.\n */\nexport async function GET() {\n  try {\n    const session = await auth();\n    const userId = session?.user?.id;\n    if (!userId) {\n      return NextResponse.json({ error: \"Unauthorized\" }, { status: 401 });\n    }\n\n    const token = await getOutlookTokenForTenant(userId);\n\n    if (!token) {\n      return NextResponse.json({ connected: false });\n    }\n\n    return NextResponse.json({\n      connected: true,\n      outlookEmail: token.outlook_email,\n      lastSyncAt: token.last_sync_at,\n    });\n  } catch (error) {\n    console.error(\"Error fetching Outlook calendar status:\", error);\n    return NextResponse.json(\n      { error: \"Internal server error\" },\n      { status: 500 }\n    );\n  }\n}\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing Outlook integration and calendar page",
      "status": "completed",
      "activeForm": "Exploring existing Outlook integration and calendar page"
    },
    {
      "content": "Plan calendar sync implementation approach",
      "status": "completed",
      "activeForm": "Planning calendar sync implementation approach"
    },
    {
      "content": "Update OAuth scopes to include Calendars.Read",
      "status": "completed",
      "activeForm": "Updating OAuth scopes to include Calendars.Read"
    },
    {
      "content": "Create Outlook calendar sync library (lib/outlook/calendar.ts)",
      "status": "completed",
      "activeForm": "Creating Outlook calendar sync library"
    },
    {
      "content": "Create Outlook calendar sync API route",
      "status": "completed",
      "activeForm": "Creating Outlook calendar sync API route"
    },
    {
      "content": "Update calendar hooks for Outlook support",
      "status": "in_progress",
      "activeForm": "Updating calendar hooks for Outlook support"
    },
    {
      "content": "Update calendar page to support Outlook integration",
      "status": "pending",
      "activeForm": "Updating calendar page to support Outlook integration"
    },
    {
      "content": "Add calendar sync button to Outlook integration page section",
      "status": "pending",
      "activeForm": "Adding calendar sync button to Outlook integration page section"
    }
  ]
}
Now update the calendar hooks to support Outlook calendar sync.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\hooks\\useCalendar.ts"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\lib\\hooks\\useCalendar.ts",
  "old_string": "export function useSyncState() {\n  return useQuery<{\n    syncStates: Array<{\n      id: string;\n      tenantId: string;\n      credentialId: string;\n      mailbox: string;\n      lastSyncAt: string | null;\n      active: boolean;\n    }>;\n    credentials: Array<{\n      id: string;\n      label: string;\n      azureTenantId: string;\n      clientId: string;\n    }>;\n  }>({\n    queryKey: [\"calendar\", \"syncState\"],\n    queryFn: () => fetchJSON(\"/api/calendar/sync\"),\n  });\n}",
  "new_string": "export function useSyncState() {\n  return useQuery<{\n    syncStates: Array<{\n      id: string;\n      tenantId: string;\n      credentialId: string;\n      mailbox: string;\n      lastSyncAt: string | null;\n      active: boolean;\n    }>;\n    credentials: Array<{\n      id: string;\n      label: string;\n      azureTenantId: string;\n      clientId: string;\n    }>;\n  }>({\n    queryKey: [\"calendar\", \"syncState\"],\n    queryFn: () => fetchJSON(\"/api/calendar/sync\"),\n  });\n}\n\nexport function useOutlookCalendarStatus() {\n  return useQuery<{\n    connected: boolean;\n    outlookEmail?: string;\n    lastSyncAt?: string | null;\n  }>({\n    queryKey: [\"calendar\", \"outlookStatus\"],\n    queryFn: () => fetchJSON(\"/api/outlook/calendar\"),\n  });\n}\n\nexport function useOutlookCalendarSync() {\n  const qc = useQueryClient();\n  return useMutation({\n    mutationFn: (data: { daysBack?: number; daysForward?: number }) =>\n      fetchJSON<{ message: string; synced: number; errors: number }>(\n        \"/api/outlook/calendar\",\n        {\n          method: \"POST\",\n          headers: { \"Content-Type\": \"application/json\" },\n          body: JSON.stringify(data),\n        }\n      ),\n    onSuccess: () => {\n      qc.invalidateQueries({ queryKey: [\"calendar\"] });\n    },\n  });\n}"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing Outlook integration and calendar page",
      "status": "completed",
      "activeForm": "Exploring existing Outlook integration and calendar page"
    },
    {
      "content": "Plan calendar sync implementation approach",
      "status": "completed",
      "activeForm": "Planning calendar sync implementation approach"
    },
    {
      "content": "Update OAuth scopes to include Calendars.Read",
      "status": "completed",
      "activeForm": "Updating OAuth scopes to include Calendars.Read"
    },
    {
      "content": "Create Outlook calendar sync library (lib/outlook/calendar.ts)",
      "status": "completed",
      "activeForm": "Creating Outlook calendar sync library"
    },
    {
      "content": "Create Outlook calendar sync API route",
      "status": "completed",
      "activeForm": "Creating Outlook calendar sync API route"
    },
    {
      "content": "Update calendar hooks for Outlook support",
      "status": "completed",
      "activeForm": "Updating calendar hooks for Outlook support"
    },
    {
      "content": "Update calendar page to support Outlook integration",
      "status": "in_progress",
      "activeForm": "Updating calendar page to support Outlook integration"
    },
    {
      "content": "Add calendar sync button to Outlook integration page section",
      "status": "pending",
      "activeForm": "Adding calendar sync button to Outlook integration page section"
    }
  ]
}
Now update the calendar page to support both Graph API and Outlook integrations.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\calendar\\page.tsx"
}
Now I'll rewrite the calendar page to support both Graph API credentials and Outlook OAuth as calendar sources.

🔧 Tool: Write
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\calendar\\page.tsx",
  "content": "\"use client\";\n\nimport { useState } from \"react\";\nimport {\n  useCalendarEventsInRange,\n  useCalendarSync,\n  useSyncState,\n  useOutlookCalendarStatus,\n  useOutlookCalendarSync,\n} from \"@/lib/hooks/useCalendar\";\nimport type { CalendarEvent } from \"@/types\";\n\nfunction getWeekRange() {\n  const now = new Date();\n  const start = new Date(now);\n  start.setHours(0, 0, 0, 0);\n  const end = new Date(now);\n  end.setDate(end.getDate() + 7);\n  end.setHours(23, 59, 59, 999);\n  return { start, end };\n}\n\nfunction formatTimeRange(event: CalendarEvent) {\n  const start = new Date(event.startDateTime);\n  const end = new Date(event.endDateTime);\n\n  if (event.isAllDay) return \"All day\";\n\n  return `${start.toLocaleTimeString([], { hour: \"numeric\", minute: \"2-digit\" })} – ${end.toLocaleTimeString([], { hour: \"numeric\", minute: \"2-digit\" })}`;\n}\n\nfunction formatDate(dateStr: string) {\n  const d = new Date(dateStr);\n  const now = new Date();\n  const isToday = d.toDateString() === now.toDateString();\n  const isTomorrow =\n    d.toDateString() ===\n    new Date(now.getTime() + 86400000).toDateString();\n\n  if (isToday) return \"Today\";\n  if (isTomorrow) return \"Tomorrow\";\n  return d.toLocaleDateString([], {\n    weekday: \"long\",\n    month: \"long\",\n    day: \"numeric\",\n  });\n}\n\nfunction groupEventsByDate(events: CalendarEvent[]) {\n  const groups: Record<string, CalendarEvent[]> = {};\n  for (const event of events) {\n    const key = new Date(event.startDateTime).toDateString();\n    if (!groups[key]) groups[key] = [];\n    groups[key].push(event);\n  }\n  return Object.entries(groups).sort(\n    ([a], [b]) => new Date(a).getTime() - new Date(b).getTime()\n  );\n}\n\nfunction EventCard({ event }: { event: CalendarEvent }) {\n  const [expanded, setExpanded] = useState(false);\n  const attendeeCount = event.attendees?.length || 0;\n\n  return (\n    <div\n      className=\"rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 transition-shadow hover:shadow-sm\"\n    >\n      <div className=\"flex items-start justify-between gap-2\">\n        <div className=\"min-w-0 flex-1\">\n          <h3 className=\"text-sm font-medium text-[var(--foreground)]\">\n            {event.subject || \"(No subject)\"}\n          </h3>\n          <p className=\"mt-0.5 text-xs text-[var(--muted-foreground)]\">\n            {formatTimeRange(event)}\n          </p>\n          {event.location && (\n            <p className=\"mt-0.5 text-xs text-[var(--muted-foreground)]\">\n              {event.location}\n            </p>\n          )}\n          {event.organizerName && (\n            <p className=\"mt-0.5 text-xs text-[var(--muted-foreground)]\">\n              Organizer: {event.organizerName}\n            </p>\n          )}\n        </div>\n        <div className=\"flex flex-shrink-0 items-center gap-2\">\n          {event.showAs && (\n            <span\n              className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${\n                event.showAs === \"busy\"\n                  ? \"bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400\"\n                  : event.showAs === \"tentative\"\n                    ? \"bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400\"\n                    : \"bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400\"\n              }`}\n            >\n              {event.showAs}\n            </span>\n          )}\n          {event.webLink && (\n            <a\n              href={event.webLink}\n              target=\"_blank\"\n              rel=\"noopener noreferrer\"\n              className=\"text-xs text-[var(--primary)] hover:underline\"\n            >\n              Open\n            </a>\n          )}\n        </div>\n      </div>\n\n      {attendeeCount > 0 && (\n        <div className=\"mt-2\">\n          <button\n            onClick={() => setExpanded(!expanded)}\n            className=\"text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]\"\n          >\n            {expanded ? \"Hide\" : \"Show\"} {attendeeCount} attendee{attendeeCount !== 1 ? \"s\" : \"\"}\n          </button>\n          {expanded && (\n            <div className=\"mt-1 space-y-0.5\">\n              {event.attendees.map((a, i) => (\n                <div key={i} className=\"flex items-center gap-2 text-xs text-[var(--muted-foreground)]\">\n                  <span\n                    className={`h-1.5 w-1.5 rounded-full ${\n                      a.response === \"accepted\"\n                        ? \"bg-green-500\"\n                        : a.response === \"declined\"\n                          ? \"bg-red-500\"\n                          : a.response === \"tentativelyAccepted\"\n                            ? \"bg-yellow-500\"\n                            : \"bg-gray-400\"\n                    }`}\n                  />\n                  <span>{a.name || a.email}</span>\n                </div>\n              ))}\n            </div>\n          )}\n        </div>\n      )}\n    </div>\n  );\n}\n\nexport default function CalendarPage() {\n  const [daysForward, setDaysForward] = useState(7);\n  const { start } = getWeekRange();\n  const end = new Date(start);\n  end.setDate(end.getDate() + daysForward);\n  end.setHours(23, 59, 59, 999);\n\n  const { data, isLoading, error } = useCalendarEventsInRange(\n    start.toISOString(),\n    end.toISOString()\n  );\n\n  // Graph API sync (Azure AD credentials)\n  const graphSyncMutation = useCalendarSync();\n  const { data: syncData } = useSyncState();\n\n  // Outlook OAuth sync (personal/work Microsoft accounts)\n  const { data: outlookStatus } = useOutlookCalendarStatus();\n  const outlookSyncMutation = useOutlookCalendarSync();\n\n  const events = data?.events || [];\n  const grouped = groupEventsByDate(events);\n\n  const hasGraphCredentials = (syncData?.credentials?.length ?? 0) > 0;\n  const hasGraphSyncState = (syncData?.syncStates?.length ?? 0) > 0;\n  const hasOutlookConnection = outlookStatus?.connected === true;\n\n  // User has at least one calendar source configured\n  const hasAnySource = hasGraphCredentials || hasOutlookConnection;\n  const hasAnySyncReady = hasGraphSyncState || hasOutlookConnection;\n\n  const isSyncing = graphSyncMutation.isPending || outlookSyncMutation.isPending;\n\n  const handleSync = () => {\n    // Sync from all available sources\n    if (hasGraphCredentials && hasGraphSyncState && syncData?.credentials?.length) {\n      const cred = syncData.credentials[0];\n      const mailbox = syncData.syncStates?.[0]?.mailbox || \"\";\n      if (mailbox) {\n        graphSyncMutation.mutate({\n          credentialId: cred.id,\n          mailbox,\n          daysBack: 7,\n          daysForward,\n        });\n      }\n    }\n\n    if (hasOutlookConnection) {\n      outlookSyncMutation.mutate({\n        daysBack: 7,\n        daysForward,\n      });\n    }\n  };\n\n  const syncedCount =\n    (graphSyncMutation.isSuccess ? graphSyncMutation.data.synced : 0) +\n    (outlookSyncMutation.isSuccess ? outlookSyncMutation.data.synced : 0);\n  const syncErrors =\n    (graphSyncMutation.isSuccess ? graphSyncMutation.data.errors : 0) +\n    (outlookSyncMutation.isSuccess ? outlookSyncMutation.data.errors : 0);\n  const showSyncResult = graphSyncMutation.isSuccess || outlookSyncMutation.isSuccess;\n\n  return (\n    <div className=\"mx-auto max-w-3xl p-6\">\n      <div className=\"mb-6 flex items-center justify-between\">\n        <h1 className=\"text-xl font-bold text-[var(--foreground)]\">Calendar</h1>\n        <div className=\"flex items-center gap-3\">\n          <select\n            value={daysForward}\n            onChange={(e) => setDaysForward(Number(e.target.value))}\n            className=\"rounded-md border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-sm text-[var(--foreground)]\"\n          >\n            <option value={7}>Next 7 days</option>\n            <option value={14}>Next 14 days</option>\n            <option value={30}>Next 30 days</option>\n          </select>\n          {hasAnySyncReady && (\n            <button\n              onClick={handleSync}\n              disabled={isSyncing}\n              className=\"rounded-md bg-[var(--primary)] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50\"\n            >\n              {isSyncing ? \"Syncing...\" : \"Sync Now\"}\n            </button>\n          )}\n        </div>\n      </div>\n\n      {showSyncResult && (\n        <div className=\"mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400\">\n          Synced {syncedCount} events.\n          {syncErrors > 0 && ` (${syncErrors} errors)`}\n        </div>\n      )}\n\n      {!hasAnySource && (\n        <div className=\"rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 text-center\">\n          <h2 className=\"mb-2 text-base font-medium text-[var(--foreground)]\">\n            Connect your Calendar\n          </h2>\n          <p className=\"mb-4 text-sm text-[var(--muted-foreground)]\">\n            Connect your Outlook account or set up Azure AD credentials in\n            Integrations to sync your calendar events.\n          </p>\n          <a\n            href=\"/admin/integrations\"\n            className=\"inline-block rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90\"\n          >\n            Go to Integrations\n          </a>\n        </div>\n      )}\n\n      {hasGraphCredentials && !hasGraphSyncState && !hasOutlookConnection && (\n        <div className=\"rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 text-center\">\n          <h2 className=\"mb-2 text-base font-medium text-[var(--foreground)]\">\n            Start your first calendar sync\n          </h2>\n          <p className=\"mb-4 text-sm text-[var(--muted-foreground)]\">\n            Your Azure AD credentials are configured. Enter your mailbox email\n            to begin syncing calendar events.\n          </p>\n          <SyncSetupForm\n            credentials={syncData?.credentials || []}\n            onSync={(credentialId, mailbox) => {\n              graphSyncMutation.mutate({ credentialId, mailbox, daysBack: 7, daysForward: 30 });\n            }}\n            isPending={graphSyncMutation.isPending}\n          />\n        </div>\n      )}\n\n      {hasOutlookConnection && !hasGraphCredentials && events.length === 0 && !isLoading && (\n        <div className=\"mb-4 rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 text-center\">\n          <h2 className=\"mb-2 text-base font-medium text-[var(--foreground)]\">\n            Sync your Outlook calendar\n          </h2>\n          <p className=\"mb-3 text-sm text-[var(--muted-foreground)]\">\n            Your Outlook account ({outlookStatus.outlookEmail}) is connected.\n            Click below to sync your calendar events.\n          </p>\n          <button\n            onClick={() => outlookSyncMutation.mutate({ daysBack: 7, daysForward: 30 })}\n            disabled={outlookSyncMutation.isPending}\n            className=\"rounded-md bg-[#0078D4] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#106ebe] disabled:opacity-50\"\n          >\n            {outlookSyncMutation.isPending ? \"Syncing...\" : \"Sync Outlook Calendar\"}\n          </button>\n        </div>\n      )}\n\n      {isLoading && (\n        <div className=\"space-y-3\">\n          {[1, 2, 3].map((i) => (\n            <div\n              key={i}\n              className=\"animate-pulse rounded-lg border border-[var(--border)] bg-[var(--card)] p-4\"\n            >\n              <div className=\"h-4 w-1/3 rounded bg-[var(--muted-foreground)]/20\" />\n              <div className=\"mt-2 h-3 w-1/2 rounded bg-[var(--muted-foreground)]/10\" />\n            </div>\n          ))}\n        </div>\n      )}\n\n      {error && (\n        <div className=\"rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400\">\n          Failed to load calendar events.\n        </div>\n      )}\n\n      {!isLoading && !error && grouped.length === 0 && hasAnySyncReady && (\n        <div className=\"rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 text-center text-sm text-[var(--muted-foreground)]\">\n          No events in the selected range. Try syncing or expanding the date\n          range.\n        </div>\n      )}\n\n      <div className=\"space-y-6\">\n        {grouped.map(([dateStr, dayEvents]) => (\n          <div key={dateStr}>\n            <h2 className=\"mb-2 text-sm font-semibold text-[var(--foreground)]\">\n              {formatDate(dayEvents[0].startDateTime)}\n            </h2>\n            <div className=\"space-y-2\">\n              {dayEvents.map((event) => (\n                <EventCard key={event.id} event={event} />\n              ))}\n            </div>\n          </div>\n        ))}\n      </div>\n    </div>\n  );\n}\n\nfunction SyncSetupForm({\n  credentials,\n  onSync,\n  isPending,\n}: {\n  credentials: Array<{ id: string; label: string }>;\n  onSync: (credentialId: string, mailbox: string) => void;\n  isPending: boolean;\n}) {\n  const [mailbox, setMailbox] = useState(\"\");\n  const [credentialId, setCredentialId] = useState(credentials[0]?.id || \"\");\n\n  return (\n    <div className=\"mx-auto max-w-sm space-y-3\">\n      {credentials.length > 1 && (\n        <select\n          value={credentialId}\n          onChange={(e) => setCredentialId(e.target.value)}\n          className=\"w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)]\"\n        >\n          {credentials.map((c) => (\n            <option key={c.id} value={c.id}>\n              {c.label}\n            </option>\n          ))}\n        </select>\n      )}\n      <input\n        type=\"email\"\n        placeholder=\"user@example.com\"\n        value={mailbox}\n        onChange={(e) => setMailbox(e.target.value)}\n        className=\"w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]\"\n      />\n      <button\n        onClick={() => {\n          if (mailbox.trim() && credentialId) {\n            onSync(credentialId, mailbox.trim());\n          }\n        }}\n        disabled={!mailbox.trim() || !credentialId || isPending}\n        className=\"w-full rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50\"\n      >\n        {isPending ? \"Syncing...\" : \"Sync Calendar\"}\n      </button>\n    </div>\n  );\n}\n"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing Outlook integration and calendar page",
      "status": "completed",
      "activeForm": "Exploring existing Outlook integration and calendar page"
    },
    {
      "content": "Plan calendar sync implementation approach",
      "status": "completed",
      "activeForm": "Planning calendar sync implementation approach"
    },
    {
      "content": "Update OAuth scopes to include Calendars.Read",
      "status": "completed",
      "activeForm": "Updating OAuth scopes to include Calendars.Read"
    },
    {
      "content": "Create Outlook calendar sync library (lib/outlook/calendar.ts)",
      "status": "completed",
      "activeForm": "Creating Outlook calendar sync library"
    },
    {
      "content": "Create Outlook calendar sync API route",
      "status": "completed",
      "activeForm": "Creating Outlook calendar sync API route"
    },
    {
      "content": "Update calendar hooks for Outlook support",
      "status": "completed",
      "activeForm": "Updating calendar hooks for Outlook support"
    },
    {
      "content": "Update calendar page to support Outlook integration",
      "status": "completed",
      "activeForm": "Updating calendar page to support Outlook integration"
    },
    {
      "content": "Add calendar sync button to Outlook integration page section",
      "status": "in_progress",
      "activeForm": "Adding calendar sync button to Outlook integration page section"
    }
  ]
}
Now update the Integrations page to add a calendar sync button to the Outlook section. I need to modify the `OutlookIntegrationManager` component to include calendar sync functionality.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "offset": 1645,
  "limit": 60
}
I need to add calendar sync state and a calendar sync button to the `OutlookIntegrationManager`. I'll add the calendar sync functionality right after the email sync button.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "old_string": "function OutlookIntegrationManager() {\n  const [status, setStatus] = useState<{\n    connected: boolean;\n    outlookEmail?: string;\n    tokenExpiry?: string;\n    isExpired?: boolean;\n    lastSyncAt?: string | null;\n    createdAt?: string;\n  } | null>(null);\n  const [loading, setLoading] = useState(true);\n  const [syncing, setSyncing] = useState(false);\n  const [actionLoading, setActionLoading] = useState(false);\n  const [error, setError] = useState<string | null>(null);\n  const [success, setSuccess] = useState<string | null>(null);\n  const [syncResult, setSyncResult] = useState<{\n    total: number;\n    inserted: number;\n    skipped: number;\n  } | null>(null);",
  "new_string": "function OutlookIntegrationManager() {\n  const [status, setStatus] = useState<{\n    connected: boolean;\n    outlookEmail?: string;\n    tokenExpiry?: string;\n    isExpired?: boolean;\n    lastSyncAt?: string | null;\n    createdAt?: string;\n  } | null>(null);\n  const [loading, setLoading] = useState(true);\n  const [syncing, setSyncing] = useState(false);\n  const [syncingCalendar, setSyncingCalendar] = useState(false);\n  const [actionLoading, setActionLoading] = useState(false);\n  const [error, setError] = useState<string | null>(null);\n  const [success, setSuccess] = useState<string | null>(null);\n  const [syncResult, setSyncResult] = useState<{\n    total: number;\n    inserted: number;\n    skipped: number;\n  } | null>(null);\n  const [calendarSyncResult, setCalendarSyncResult] = useState<{\n    synced: number;\n    errors: number;\n  } | null>(null);"
}
Now add the calendar sync handler right after the `handleSync` function:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "old_string": "    } catch (err) {\n      setError(err instanceof Error ? err.message : \"Sync failed\");\n    } finally {\n      setSyncing(false);\n    }\n  };\n\n  return (\n    <div>\n      <h3 className=\"text-sm font-semibold text-[var(--foreground)] mb-2\">\n        Connection Status",
  "new_string": "    } catch (err) {\n      setError(err instanceof Error ? err.message : \"Sync failed\");\n    } finally {\n      setSyncing(false);\n    }\n  };\n\n  const handleCalendarSync = async () => {\n    setSyncingCalendar(true);\n    setError(null);\n    setCalendarSyncResult(null);\n    try {\n      const res = await fetch(\"/api/outlook/calendar\", {\n        method: \"POST\",\n        headers: { \"Content-Type\": \"application/json\" },\n        body: JSON.stringify({ daysBack: 7, daysForward: 30 }),\n      });\n      const data = await res.json();\n      if (!res.ok) throw new Error(data.error || \"Calendar sync failed\");\n      setCalendarSyncResult({ synced: data.synced, errors: data.errors });\n      setSuccess(`Calendar sync complete: ${data.synced} events synced`);\n      setTimeout(() => setSuccess(null), 5000);\n    } catch (err) {\n      setError(err instanceof Error ? err.message : \"Calendar sync failed\");\n    } finally {\n      setSyncingCalendar(false);\n    }\n  };\n\n  return (\n    <div>\n      <h3 className=\"text-sm font-semibold text-[var(--foreground)] mb-2\">\n        Connection Status"
}
Now add the calendar sync result display and button. I'll add it right after the email sync result and before the action buttons:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "old_string": "          {syncResult && (\n            <div className=\"p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-[var(--foreground)]\">\n              Fetched {syncResult.total} messages: {syncResult.inserted} new, {syncResult.skipped} already existed.\n            </div>\n          )}\n\n          <div className=\"flex gap-2\">\n            <button\n              onClick={handleSync}\n              disabled={syncing}\n              className=\"px-4 py-2 text-sm font-medium rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50\"\n            >\n              {syncing ? \"Syncing...\" : \"Sync Emails Now\"}\n            </button>\n            <button\n              onClick={handleDisconnect}\n              disabled={actionLoading}\n              className=\"px-4 py-2 text-sm font-medium rounded-md border border-red-500/30 text-red-600 hover:bg-red-500/10 transition-colors disabled:opacity-50\"\n            >\n              {actionLoading ? \"Disconnecting...\" : \"Disconnect\"}\n            </button>\n          </div>",
  "new_string": "          {syncResult && (\n            <div className=\"p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-[var(--foreground)]\">\n              Fetched {syncResult.total} messages: {syncResult.inserted} new, {syncResult.skipped} already existed.\n            </div>\n          )}\n\n          {calendarSyncResult && (\n            <div className=\"p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-[var(--foreground)]\">\n              Calendar: {calendarSyncResult.synced} events synced.\n              {calendarSyncResult.errors > 0 && ` (${calendarSyncResult.errors} errors)`}\n            </div>\n          )}\n\n          <div className=\"flex gap-2 flex-wrap\">\n            <button\n              onClick={handleSync}\n              disabled={syncing}\n              className=\"px-4 py-2 text-sm font-medium rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50\"\n            >\n              {syncing ? \"Syncing...\" : \"Sync Emails Now\"}\n            </button>\n            <button\n              onClick={handleCalendarSync}\n              disabled={syncingCalendar}\n              className=\"px-4 py-2 text-sm font-medium rounded-md bg-[#0078D4] text-white hover:bg-[#106ebe] transition-colors disabled:opacity-50\"\n            >\n              {syncingCalendar ? \"Syncing...\" : \"Sync Calendar Now\"}\n            </button>\n            <button\n              onClick={handleDisconnect}\n              disabled={actionLoading}\n              className=\"px-4 py-2 text-sm font-medium rounded-md border border-red-500/30 text-red-600 hover:bg-red-500/10 transition-colors disabled:opacity-50\"\n            >\n              {actionLoading ? \"Disconnecting...\" : \"Disconnect\"}\n            </button>\n          </div>"
}
Now update the "Not Connected" text to mention calendar as well:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "old_string": "            <p className=\"text-sm text-[var(--muted-foreground)]\">\n              Connect your Outlook.com account to start importing emails. You\n              will be redirected to Microsoft to authorize the app.\n            </p>",
  "new_string": "            <p className=\"text-sm text-[var(--muted-foreground)]\">\n              Connect your Outlook account to start importing emails and\n              syncing calendar events. You will be redirected to Microsoft to\n              authorize the app.\n            </p>"
}
Now update the Outlook section header description to mention calendar:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "old_string": "                  <p className=\"text-sm text-[var(--muted-foreground)]\">\n                    Read emails from personal and work Microsoft accounts via OAuth\n                  </p>",
  "new_string": "                  <p className=\"text-sm text-[var(--muted-foreground)]\">\n                    Sync emails and calendar from Microsoft accounts via OAuth\n                  </p>"
}
Now update the description paragraph and the "How It Works" table in the Outlook section:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "old_string": "                  This integration connects to any Microsoft account — personal (Outlook.com, Hotmail, Live.com)\n                  or work/school (Office 365, Exchange Online) — using the Microsoft identity platform v2.0\n                  with delegated OAuth permissions and the authorization code flow.",
  "new_string": "                  This integration connects to any Microsoft account — personal (Outlook.com, Hotmail, Live.com)\n                  or work/school (Office 365, Exchange Online) — using the Microsoft identity platform v2.0\n                  with delegated OAuth permissions and the authorization code flow. It supports\n                  both email sync and calendar sync."
}
Now add a calendar sync row to the "How It Works" table:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "old_string": "                      <tr>\n                        <td className=\"px-4 py-3 font-medium text-[var(--foreground)]\">\n                          Sync\n                        </td>\n                        <td className=\"px-4 py-3 text-[var(--muted-foreground)]\">\n                          Click &quot;Sync Emails Now&quot; to pull recent inbox messages. The system\n                          deduplicates and only imports new emails.\n                        </td>\n                      </tr>",
  "new_string": "                      <tr>\n                        <td className=\"px-4 py-3 font-medium text-[var(--foreground)]\">\n                          Email Sync\n                        </td>\n                        <td className=\"px-4 py-3 text-[var(--muted-foreground)]\">\n                          Click &quot;Sync Emails Now&quot; to pull recent inbox messages. The system\n                          deduplicates and only imports new emails.\n                        </td>\n                      </tr>\n                      <tr>\n                        <td className=\"px-4 py-3 font-medium text-[var(--foreground)]\">\n                          Calendar Sync\n                        </td>\n                        <td className=\"px-4 py-3 text-[var(--muted-foreground)]\">\n                          Click &quot;Sync Calendar Now&quot; to pull calendar events from the past\n                          7 days to 30 days ahead. Events are deduplicated and updated on each sync.\n                        </td>\n                      </tr>"
}
Now update the "Important Notes" section to mention calendar:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "old_string": "                  <div className=\"p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-[var(--foreground)]\">\n                    <span className=\"font-medium\">Pull-based sync:</span> Unlike the Graph API\n                    integration which uses push notifications, this integration requires manual or\n                    scheduled syncs via the &quot;Sync Emails Now&quot; button.\n                  </div>\n                  <div className=\"p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-[var(--foreground)]\">\n                    <span className=\"font-medium\">Personal accounts only:</span> This uses\n                    the <code className=\"px-1 py-0.5 rounded bg-[var(--secondary)] text-xs\">/consumers</code> authority\n                    endpoint. For organizational (work/school) accounts, use the Graph API tab instead.\n                  </div>",
  "new_string": "                  <div className=\"p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-[var(--foreground)]\">\n                    <span className=\"font-medium\">Pull-based sync:</span> Unlike the Graph API\n                    integration which uses push notifications, this integration requires manual or\n                    scheduled syncs via the &quot;Sync Emails Now&quot; and &quot;Sync Calendar Now&quot; buttons.\n                  </div>\n                  <div className=\"p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-[var(--foreground)]\">\n                    <span className=\"font-medium\">Calendar scope:</span> Calendar sync\n                    uses the <code className=\"px-1 py-0.5 rounded bg-[var(--secondary)] text-xs\">Calendars.Read</code> permission.\n                    If you connected before this feature was added, disconnect and reconnect to\n                    grant the new permission.\n                  </div>"
}
Now let me also update the "Connection Status" description text:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "old_string": "      <p className=\"text-sm text-[var(--muted-foreground)] mb-3\">\n        Connect your personal Microsoft account (Outlook.com, Hotmail, Live) to\n        read emails using delegated OAuth permissions.\n      </p>",
  "new_string": "      <p className=\"text-sm text-[var(--muted-foreground)] mb-3\">\n        Connect your Microsoft account (Outlook.com, Hotmail, Live, Office 365) to\n        sync emails and calendar events using delegated OAuth permissions.\n      </p>"
}
Now let me verify the build works by checking for any TypeScript issues.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing Outlook integration and calendar page",
      "status": "completed",
      "activeForm": "Exploring existing Outlook integration and calendar page"
    },
    {
      "content": "Plan calendar sync implementation approach",
      "status": "completed",
      "activeForm": "Planning calendar sync implementation approach"
    },
    {
      "content": "Update OAuth scopes to include Calendars.Read",
      "status": "completed",
      "activeForm": "Updating OAuth scopes to include Calendars.Read"
    },
    {
      "content": "Create Outlook calendar sync library (lib/outlook/calendar.ts)",
      "status": "completed",
      "activeForm": "Creating Outlook calendar sync library"
    },
    {
      "content": "Create Outlook calendar sync API route",
      "status": "completed",
      "activeForm": "Creating Outlook calendar sync API route"
    },
    {
      "content": "Update calendar hooks for Outlook support",
      "status": "completed",
      "activeForm": "Updating calendar hooks for Outlook support"
    },
    {
      "content": "Update calendar page to support Outlook integration",
      "status": "completed",
      "activeForm": "Updating calendar page to support Outlook integration"
    },
    {
      "content": "Add calendar sync button to Outlook integration page section",
      "status": "completed",
      "activeForm": "Adding calendar sync button to Outlook integration page section"
    },
    {
      "content": "Verify TypeScript compilation and review changes",
      "status": "in_progress",
      "activeForm": "Verifying TypeScript compilation and reviewing changes"
    }
  ]
}
Let me verify all the files look correct by reviewing the key changes.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\outlook\\calendar.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\outlook\\calendar\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\hooks\\useCalendar.ts"
}
I notice there's an unused import in the API route. Let me clean that up.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\api\\outlook\\calendar\\route.ts",
  "old_string": "import { getValidOutlookAccessToken, getOutlookTokenForTenant } from \"@/lib/outlook/oauth\";",
  "new_string": "import { getValidOutlookAccessToken, getOutlookTokenForTenant } from \"@/lib/outlook/oauth\";\n// getOutlookTokenForTenant used for connection check, getValidOutlookAccessToken for auto-refreshing token"
}
Wait, that's unnecessary. Both are actually used in the file. Let me revert.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\api\\outlook\\calendar\\route.ts",
  "old_string": "import { getValidOutlookAccessToken, getOutlookTokenForTenant } from \"@/lib/outlook/oauth\";\n// getOutlookTokenForTenant used for connection check, getValidOutlookAccessToken for auto-refreshing token",
  "new_string": "import { getValidOutlookAccessToken, getOutlookTokenForTenant } from \"@/lib/outlook/oauth\";"
}
Now let me try to build to see if there are any TypeScript issues.

🔧 Tool: Bash
Input: {
  "command": "cd /c/Code/Krisp && npx tsc --noEmit --pretty 2>&1 | head -80",
  "description": "Check for TypeScript compilation errors",
  "timeout": 120000
}

🔧 Tool: Bash
Input: {
  "command": "cd /c/Code/Krisp && npx tsc --noEmit --pretty 2>&1 | tail -80",
  "description": "Check TypeScript errors - tail output",
  "timeout": 120000
}

🔧 Tool: Bash
Input: {
  "command": "cd /c/Code/Krisp && npx tsc --noEmit --pretty 2>&1",
  "description": "Full TypeScript check",
  "timeout": 120000
}
TypeScript compilation passes with no errors. Let me mark everything as complete and do a final review.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing Outlook integration and calendar page",
      "status": "completed",
      "activeForm": "Exploring existing Outlook integration and calendar page"
    },
    {
      "content": "Plan calendar sync implementation approach",
      "status": "completed",
      "activeForm": "Planning calendar sync implementation approach"
    },
    {
      "content": "Update OAuth scopes to include Calendars.Read",
      "status": "completed",
      "activeForm": "Updating OAuth scopes to include Calendars.Read"
    },
    {
      "content": "Create Outlook calendar sync library (lib/outlook/calendar.ts)",
      "status": "completed",
      "activeForm": "Creating Outlook calendar sync library"
    },
    {
      "content": "Create Outlook calendar sync API route",
      "status": "completed",
      "activeForm": "Creating Outlook calendar sync API route"
    },
    {
      "content": "Update calendar hooks for Outlook support",
      "status": "completed",
      "activeForm": "Updating calendar hooks for Outlook support"
    },
    {
      "content": "Update calendar page to support Outlook integration",
      "status": "completed",
      "activeForm": "Updating calendar page to support Outlook integration"
    },
    {
      "content": "Add calendar sync button to Outlook integration page section",
      "status": "completed",
      "activeForm": "Adding calendar sync button to Outlook integration page section"
    },
    {
      "content": "Verify TypeScript compilation and review changes",
      "status": "completed",
      "activeForm": "Verifying TypeScript compilation and reviewing changes"
    }
  ]
}
<summary>
## Summary: Outlook Calendar Sync Integration

### Changes Implemented
- **Added `Calendars.Read` OAuth scope** to both the authorization URL builder and token refresh flow, enabling calendar access for Outlook OAuth connections
- **Created `lib/outlook/calendar.ts`** — new library module that fetches calendar events from Microsoft Graph's `/me/calendarView` endpoint using delegated auth, maps them to the existing `calendar_events` database schema, and upserts with encryption
- **Created `app/api/outlook/calendar/route.ts`** — new API route with POST (trigger calendar sync with configurable daysBack/daysForward) and GET (check Outlook calendar connection status) handlers
- **Added new React Query hooks** (`useOutlookCalendarStatus`, `useOutlookCalendarSync`) to `lib/hooks/useCalendar.ts` for frontend integration
- **Updated the Calendar page** (`app/(app)/calendar/page.tsx`) to detect both Graph API credentials AND Outlook OAuth connections as calendar sources, with unified sync button that triggers all available sources
- **Updated the Integrations page** (`app/(app)/admin/integrations/IntegrationsClient.tsx`) Outlook tab with:
  - New "Sync Calendar Now" button alongside existing "Sync Emails Now"
  - Calendar sync result display
  - Updated descriptions mentioning calendar sync capability
  - Updated "How It Works" table with Calendar Sync row
  - Updated "Important Notes" with guidance on reconnecting for calendar permissions

### Files Modified
- `lib/outlook/oauth.ts` — added `Calendars.Read` to OAuth scopes (both auth URL and token refresh)
- `lib/hooks/useCalendar.ts` — added `useOutlookCalendarStatus` and `useOutlookCalendarSync` hooks
- `app/(app)/calendar/page.tsx` — rewritten to support dual calendar sources (Graph API + Outlook OAuth)
- `app/(app)/admin/integrations/IntegrationsClient.tsx` — added calendar sync UI to Outlook section

### Files Created
- `lib/outlook/calendar.ts` — Outlook calendar fetch, mapping, and sync logic
- `app/api/outlook/calendar/route.ts` — API route for Outlook calendar sync

### Notes for Developer
- Users who connected their Outlook account before this change will need to **disconnect and reconnect** to grant the new `Calendars.Read` permission
- Calendar events from Outlook OAuth syncs are stored in the same `calendar_events` table as Graph API syncs, with `credentialId = null` to differentiate them
- The sync uses the existing `outlook_oauth_tokens.last_sync_at` field to track when the last sync occurred
- TypeScript compilation passes with no errors
</summary>