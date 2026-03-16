

Let me first explore the existing support chat implementation to understand what's already built, then create a detailed implementation plan.

🔧 Tool: Task
Input: {
  "description": "Explore support chat codebase",
  "subagent_type": "Explore",
  "prompt": "Thoroughly explore the existing support chat implementation in C:\\Code\\Krisp. I need to understand what's already built for the AI support chat widget (Phase 1) so I can plan the Phase 2 live agent support addition.\n\nSearch for:\n1. All files under app/api/support-chat/ — read the route handlers\n2. All files under app/(app)/admin/support/ — read the admin pages\n3. The support-related tables in lib/db/schema.ts (support_widget_config, support_kb_chunks, support_chat_sessions, support_chat_messages)\n4. Components under components/support/ — the widget UI\n5. lib/support/ — any support utility files\n6. public/widget/ — the embed script\n7. The migration files for support (drizzle/migrations/0054*)\n8. scripts/seed-knowledge-base.ts\n\nFor each file found, read its contents and summarize what it does. I need a comprehensive understanding of the existing implementation.",
  "model": "sonnet"
}

🔧 Tool: Glob
Input: {
  "pattern": "app/api/support-chat/**/*"
}

🔧 Tool: Glob
Input: {
  "pattern": "app/(app)/admin/support/**/*"
}

🔧 Tool: Glob
Input: {
  "pattern": "components/support/**/*"
}

🔧 Tool: Glob
Input: {
  "pattern": "lib/support/**/*"
}

🔧 Tool: Glob
Input: {
  "pattern": "public/widget/**/*"
}

🔧 Tool: Glob
Input: {
  "pattern": "drizzle/migrations/0054*"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\scripts\\seed-knowledge-base.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\db\\schema.ts",
  "offset": 1,
  "limit": 100
}

🔧 Tool: Grep
Input: {
  "pattern": "support_widget_config|support_kb_chunks|support_chat_sessions|support_chat_messages",
  "path": "C:\\Code\\Krisp\\lib\\db\\schema.ts",
  "output_mode": "content",
  "-n": true,
  "-C": 15
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\support-chat\\widget-config\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\support-chat\\message\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\support-chat\\session\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\support\\page.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\support\\knowledge-base\\page.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\support\\config\\page.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\support\\conversations\\page.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\support\\chat-engine.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\support\\kb-ingest.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\components\\support\\SupportChatWidget.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\components\\support\\SupportChatWidgetLoader.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\public\\widget\\support-chat.js"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\drizzle\\migrations\\0054_support-chat-widget.sql"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\support\\conversations\\ConversationsClient.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\support\\config\\WidgetConfigClient.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\support\\knowledge-base\\KnowledgeBaseClient.tsx"
}

🔧 Tool: Glob
Input: {
  "pattern": "app/api/admin/support/**/*"
}
Now I have a comprehensive understanding of the existing Phase 1 implementation. Let me create the detailed implementation plan.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\db\\schema.ts",
  "offset": 1,
  "limit": 50
}

🔧 Tool: Grep
Input: {
  "pattern": "support_widget_config|support_kb_sources|support_kb_chunks|support_chat_sessions|support_chat_messages",
  "path": "C:\\Code\\Krisp\\lib\\db\\schema.ts",
  "output_mode": "content",
  "-n": true
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\db\\schema.ts",
  "offset": 2440,
  "limit": 150
}
Now let me check the existing admin support pages and chat engine for more context.

🔧 Tool: Glob
Input: {
  "pattern": "app/(app)/admin/support/**/*"
}

🔧 Tool: Glob
Input: {
  "pattern": "lib/support/*"
}

🔧 Tool: Glob
Input: {
  "pattern": "components/support/*"
}

🔧 Tool: Glob
Input: {
  "pattern": "app/api/support-chat/**/*"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\support\\chat-engine.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\components\\support\\SupportChatWidget.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\support-chat\\message\\route.ts"
}
Now let me check the existing admin support hub and conversations pages to understand the admin patterns.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\support\\page.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\support\\conversations\\ConversationsClient.tsx"
}
Now I have a thorough understanding of the existing Phase 1 implementation. Let me check the existing admin auth pattern and look at what the migration numbering should be.

🔧 Tool: Glob
Input: {
  "pattern": "drizzle/migrations/005*.sql"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\docs\\plans"
}

🔧 Tool: Glob
Input: {
  "pattern": "drizzle/migrations/005*.sql"
}

🔧 Tool: Bash
Input: {
  "command": "ls \"C:\\Code\\Krisp\\docs\\plans\"",
  "description": "List existing plan files"
}
Let me also check the existing support agent feature spec and the admin auth pattern.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\docs\\plans\\2026-03-14-support-agent-feature-spec.md"
}

🔧 Tool: Grep
Input: {
  "pattern": "getRequiredAdmin",
  "output_mode": "files_with_matches",
  "head_limit": 5
}
Now let me check how admin auth works in this codebase.

🔧 Tool: Grep
Input: {
  "pattern": "getRequiredAdmin",
  "path": "C:\\Code\\Krisp\\lib",
  "output_mode": "files_with_matches"
}

🔧 Tool: Grep
Input: {
  "pattern": "getRequiredAdmin",
  "path": "C:\\Code\\Krisp\\app\\api\\admin",
  "output_mode": "files_with_matches",
  "head_limit": 5
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\auth\\getRequiredAdmin.ts"
}
I now have all the context needed. Let me write the comprehensive implementation plan.

🔧 Tool: Write
Input: {
  "file_path": "C:\\Code\\Krisp\\docs\\plans\\2026-03-14-live-agent-support.md",
  "content": "# Live Agent Support — Phase 2 Implementation Plan\n\n> **Date:** 2026-03-14\n> **Status:** Draft\n> **Depends on:** Phase 1 AI Support Chat Widget (complete — migration 0054)\n> **Branch:** `feature/live-agent-support`\n\n---\n\n## Overview\n\nAdd human agent live chat support to the existing AI support widget. When users request a human or the AI cannot resolve an issue, the conversation escalates to a live agent. Admins see a real-time support dashboard showing active chats, can claim conversations, and respond directly. When no agents are online, the system creates a support ticket for async follow-up.\n\nThis plan covers five subsystems: schema changes, agent presence & routing, admin live dashboard, widget escalation flow, and ticket management.\n\n---\n\n## Existing Foundation (Phase 1)\n\nThe following are already built and working:\n\n| Component | Location |\n|---|---|\n| Widget UI (React) | `components/support/SupportChatWidget.tsx` |\n| Widget embed (vanilla JS) | `public/widget/support-chat.js` |\n| Chat engine (RAG) | `lib/support/chat-engine.ts` |\n| KB ingestion | `lib/support/kb-ingest.ts` |\n| Session API | `app/api/support-chat/session/route.ts` |\n| Message API | `app/api/support-chat/message/route.ts` |\n| Widget config API | `app/api/support-chat/widget-config/route.ts` |\n| Admin KB management | `app/api/admin/support/kb/` |\n| Admin config | `app/api/admin/support/config/route.ts` |\n| Admin conversations | `app/api/admin/support/conversations/` |\n| Admin hub page | `app/(app)/admin/support/page.tsx` |\n| Schema tables | `support_widget_config`, `support_kb_sources`, `support_kb_chunks`, `support_chat_sessions`, `support_chat_messages` |\n| Migration | `drizzle/migrations/0054_support-chat-widget.sql` |\n\n---\n\n## SUBSYSTEM 1: Database Schema Changes\n\n### Migration: `0057_live-agent-support.sql`\n\nAll changes are **additive only** — no modifications to existing tables.\n\n#### 1.1 New Enums\n\n```sql\nCREATE TYPE \"support_session_status\" AS ENUM (\n  'ai_only',        -- default: AI handling the conversation\n  'pending_agent',   -- user requested human, waiting for agent to claim\n  'agent_active',    -- agent has claimed and is actively chatting\n  'agent_closed',    -- agent closed the conversation\n  'ticket_created'   -- no agent available, ticket created\n);\n\nCREATE TYPE \"support_ticket_status\" AS ENUM (\n  'open',\n  'in_progress',\n  'resolved',\n  'closed'\n);\n\nCREATE TYPE \"support_ticket_priority\" AS ENUM (\n  'low',\n  'medium',\n  'high'\n);\n```\n\n#### 1.2 Alter `support_chat_sessions` — Add Columns\n\n```sql\nALTER TABLE support_chat_sessions\n  ADD COLUMN status support_session_status NOT NULL DEFAULT 'ai_only',\n  ADD COLUMN assigned_agent_id uuid REFERENCES users(id) ON DELETE SET NULL,\n  ADD COLUMN escalated_at timestamptz,\n  ADD COLUMN agent_notes text;\n\nCREATE INDEX idx_support_sessions_status ON support_chat_sessions(status);\nCREATE INDEX idx_support_sessions_agent ON support_chat_sessions(assigned_agent_id);\n```\n\n#### 1.3 Alter `support_chat_messages` — Extend Role Enum\n\n```sql\nALTER TYPE support_chat_role ADD VALUE 'agent';\nALTER TYPE support_chat_role ADD VALUE 'system';\n\nALTER TABLE support_chat_messages\n  ADD COLUMN agent_id uuid REFERENCES users(id) ON DELETE SET NULL;\n```\n\n- `agent` role: messages sent by a human agent\n- `system` role: system-generated messages (e.g., \"You've been connected to an agent\")\n- `agent_id`: populated only for `agent` role messages\n\n#### 1.4 New Table: `support_agent_presence`\n\nTracks which agents are currently online and available.\n\n```sql\nCREATE TABLE support_agent_presence (\n  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),\n  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,\n  status varchar(20) NOT NULL DEFAULT 'online', -- 'online', 'away', 'offline'\n  last_ping timestamptz NOT NULL DEFAULT now(),\n  max_concurrent integer NOT NULL DEFAULT 5,\n  active_count integer NOT NULL DEFAULT 0,\n  created_at timestamptz NOT NULL DEFAULT now(),\n  UNIQUE(user_id)\n);\n\nCREATE INDEX idx_agent_presence_status ON support_agent_presence(status);\nCREATE INDEX idx_agent_presence_ping ON support_agent_presence(last_ping);\n```\n\n**Presence heartbeat:** Agents send a ping every 30 seconds via `POST /api/admin/support/live/ping`. If `last_ping` is older than 90 seconds, the agent is considered offline. A cron-like cleanup runs on each ping to mark stale agents as offline.\n\n#### 1.5 New Table: `support_tickets`\n\nFor async follow-up when no agents are online.\n\n```sql\nCREATE TABLE support_tickets (\n  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),\n  session_id uuid NOT NULL REFERENCES support_chat_sessions(id) ON DELETE CASCADE,\n  subject text NOT NULL,\n  status support_ticket_status NOT NULL DEFAULT 'open',\n  priority support_ticket_priority NOT NULL DEFAULT 'medium',\n  assigned_agent_id uuid REFERENCES users(id) ON DELETE SET NULL,\n  resolved_at timestamptz,\n  created_at timestamptz NOT NULL DEFAULT now(),\n  updated_at timestamptz NOT NULL DEFAULT now()\n);\n\nCREATE INDEX idx_support_tickets_status ON support_tickets(status);\nCREATE INDEX idx_support_tickets_agent ON support_tickets(assigned_agent_id);\nCREATE INDEX idx_support_tickets_created ON support_tickets(created_at);\n```\n\n#### 1.6 New Table: `support_canned_responses`\n\nPre-written responses agents can insert with one click.\n\n```sql\nCREATE TABLE support_canned_responses (\n  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),\n  title varchar(100) NOT NULL,\n  content text NOT NULL,\n  category varchar(50),\n  shortcut varchar(20), -- e.g., \"/greeting\", \"/billing\"\n  sort_order integer NOT NULL DEFAULT 0,\n  created_at timestamptz NOT NULL DEFAULT now(),\n  updated_at timestamptz NOT NULL DEFAULT now()\n);\n```\n\n#### 1.7 Drizzle Schema Updates\n\nAdd all new tables and column additions to `lib/db/schema.ts`:\n\n- `supportSessionStatusEnum` — new pgEnum\n- `supportTicketStatusEnum` — new pgEnum\n- `supportTicketPriorityEnum` — new pgEnum\n- Add `status`, `assignedAgentId`, `escalatedAt`, `agentNotes` columns to `supportChatSessions`\n- Add `agentId` column to `supportChatMessages`\n- `supportAgentPresence` — new pgTable\n- `supportTickets` — new pgTable\n- `supportCannedResponses` — new pgTable\n- Update relations for new FKs\n\n---\n\n## SUBSYSTEM 2: Agent Presence & Routing\n\n### 2.1 Presence Service — `lib/support/agent-presence.ts`\n\nCore functions:\n\n```typescript\n// Go online — upsert presence row\nasync function goOnline(userId: string): Promise<void>\n\n// Go offline — set status to 'offline'\nasync function goOffline(userId: string): Promise<void>\n\n// Heartbeat ping — update last_ping, cleanup stale agents\nasync function ping(userId: string): Promise<void>\n\n// Check if any agents are online (last_ping within 90s, status != 'offline')\nasync function isAnyAgentOnline(): Promise<boolean>\n\n// Get all online agents sorted by active_count (for load balancing)\nasync function getAvailableAgents(): Promise<AgentPresence[]>\n\n// Increment/decrement active conversation count\nasync function incrementActiveCount(userId: string): Promise<void>\nasync function decrementActiveCount(userId: string): Promise<void>\n```\n\n### 2.2 Routing Service — `lib/support/agent-routing.ts`\n\nHandles escalation from AI to human:\n\n```typescript\n// Request human agent — called when user clicks \"Talk to a person\" or AI suggests escalation\nasync function requestAgent(sessionId: string): Promise<{\n  status: 'pending_agent' | 'ticket_created';\n  ticketId?: string;\n}>\n```\n\nLogic:\n1. Check `isAnyAgentOnline()`\n2. If yes: update session status to `pending_agent`, set `escalated_at`, insert a `system` role message (\"You've been connected to the queue. An agent will be with you shortly.\"), return `pending_agent`\n3. If no: update session status to `ticket_created`, create a `support_tickets` row with subject derived from the first user message, insert a `system` role message (\"No agents are currently available. We've created a support ticket and will get back to you soon.\"), return `ticket_created`\n\n```typescript\n// Claim a pending session — agent takes ownership\nasync function claimSession(sessionId: string, agentId: string): Promise<void>\n```\n\nLogic:\n1. Verify session status is `pending_agent`\n2. Update session: `status = 'agent_active'`, `assigned_agent_id = agentId`\n3. Increment agent's `active_count`\n4. Insert `system` message: \"You're now chatting with {agentName}.\"\n\n```typescript\n// Close a session — agent marks conversation as resolved\nasync function closeSession(sessionId: string, agentId: string, notes?: string): Promise<void>\n```\n\nLogic:\n1. Update session: `status = 'agent_closed'`, `agent_notes = notes`\n2. Decrement agent's `active_count`\n3. Insert `system` message: \"This conversation has been closed. Thank you for chatting with us!\"\n\n### 2.3 Agent Message Handler — `lib/support/agent-chat.ts`\n\n```typescript\n// Send a message as an agent\nasync function sendAgentMessage(\n  sessionId: string,\n  agentId: string,\n  content: string\n): Promise<ChatMessage>\n```\n\nLogic:\n1. Validate session `status = 'agent_active'` and `assigned_agent_id = agentId`\n2. Insert message with `role = 'agent'`, `agent_id = agentId`\n3. Update session `updated_at`\n4. Return the saved message\n\n---\n\n## SUBSYSTEM 3: API Routes\n\nAll admin routes use `getRequiredAdmin()` for auth, consistent with existing patterns. All inputs validated with Zod.\n\n### 3.1 Public Widget Endpoints (no auth)\n\n#### `POST /api/support-chat/request-agent`\n\nFile: `app/api/support-chat/request-agent/route.ts`\n\n```\nInput:  { sessionId: string (uuid) }\nOutput: { status: 'pending_agent' | 'ticket_created', ticketId?: string }\n```\n\nCalled by the widget when user clicks \"Talk to a person\". Delegates to `requestAgent()`.\n\n#### `GET /api/support-chat/agents-online`\n\nFile: `app/api/support-chat/agents-online/route.ts`\n\n```\nOutput: { online: boolean }\n```\n\nLightweight endpoint the widget calls to show/hide the \"Talk to a person\" button. Returns whether any agent has pinged within 90 seconds.\n\n#### Modify: `GET /api/support-chat/session/[sessionId]/messages` (new)\n\nFile: `app/api/support-chat/session/[sessionId]/messages/route.ts`\n\n```\nInput:  sessionId (path param), since (query param, ISO timestamp, optional)\nOutput: { messages: ChatMessage[], sessionStatus: string }\n```\n\nPolling endpoint for the widget to get new messages. Returns messages created after `since` timestamp plus current session status. The widget polls this every 3 seconds when in `pending_agent` or `agent_active` state.\n\n### 3.2 Admin Live Support Endpoints\n\n#### `POST /api/admin/support/live/ping`\n\nFile: `app/api/admin/support/live/ping/route.ts`\n\n```\nOutput: { ok: true, pendingCount: number, activeCount: number }\n```\n\nAgent heartbeat. Called every 30s by the admin live dashboard. Returns queue counts. Also triggers stale-agent cleanup.\n\n#### `POST /api/admin/support/live/go-online`\n\nFile: `app/api/admin/support/live/go-online/route.ts`\n\n```\nOutput: { ok: true }\n```\n\nMarks the agent as online. Called when agent opens the live support dashboard.\n\n#### `POST /api/admin/support/live/go-offline`\n\nFile: `app/api/admin/support/live/go-offline/route.ts`\n\n```\nOutput: { ok: true }\n```\n\nMarks the agent as offline. Called when agent navigates away or clicks \"Go Offline\".\n\n#### `GET /api/admin/support/live/queue`\n\nFile: `app/api/admin/support/live/queue/route.ts`\n\n```\nOutput: { sessions: PendingSession[] }\n```\n\nReturns all sessions with `status = 'pending_agent'`, ordered by `escalated_at` ASC (oldest first). Each entry includes session metadata, first user message, and message count.\n\n#### `GET /api/admin/support/live/active`\n\nFile: `app/api/admin/support/live/active/route.ts`\n\n```\nOutput: { sessions: ActiveSession[] }\n```\n\nReturns all sessions where `status = 'agent_active'` and `assigned_agent_id` = current agent. Includes last message preview and unread count.\n\n#### `POST /api/admin/support/live/claim`\n\nFile: `app/api/admin/support/live/claim/route.ts`\n\n```\nInput:  { sessionId: string (uuid) }\nOutput: { ok: true, session: SessionDetail }\n```\n\nAgent claims a pending session. Delegates to `claimSession()`.\n\n#### `POST /api/admin/support/live/message`\n\nFile: `app/api/admin/support/live/message/route.ts`\n\n```\nInput:  { sessionId: string (uuid), content: string (1-5000 chars) }\nOutput: { message: ChatMessage }\n```\n\nAgent sends a message in an active session. Delegates to `sendAgentMessage()`.\n\n#### `POST /api/admin/support/live/close`\n\nFile: `app/api/admin/support/live/close/route.ts`\n\n```\nInput:  { sessionId: string (uuid), notes?: string }\nOutput: { ok: true }\n```\n\nAgent closes an active session. Delegates to `closeSession()`.\n\n#### `GET /api/admin/support/live/session/[sessionId]`\n\nFile: `app/api/admin/support/live/session/[sessionId]/route.ts`\n\n```\nOutput: { session: SessionDetail, messages: ChatMessage[] }\n```\n\nReturns full session detail and all messages for the agent chat view.\n\n### 3.3 Ticket Management Endpoints\n\n#### `GET /api/admin/support/tickets`\n\nFile: `app/api/admin/support/tickets/route.ts`\n\n```\nQuery:  status (optional filter), page (default 1)\nOutput: { tickets: Ticket[], totalPages: number }\n```\n\nPaginated list of support tickets, 20 per page, ordered by `created_at` DESC.\n\n#### `GET /api/admin/support/tickets/[ticketId]`\n\nFile: `app/api/admin/support/tickets/[ticketId]/route.ts`\n\n```\nOutput: { ticket: TicketDetail, session: SessionDetail, messages: ChatMessage[] }\n```\n\nFull ticket detail with linked conversation.\n\n#### `PATCH /api/admin/support/tickets/[ticketId]`\n\nFile: same as above\n\n```\nInput:  { status?: string, priority?: string, assignedAgentId?: string }\nOutput: { ticket: TicketDetail }\n```\n\nUpdate ticket status, priority, or assignment.\n\n### 3.4 Canned Responses Endpoints\n\n#### `GET /api/admin/support/canned-responses`\n\nFile: `app/api/admin/support/canned-responses/route.ts`\n\n```\nOutput: { responses: CannedResponse[] }\n```\n\n#### `POST /api/admin/support/canned-responses`\n\n```\nInput:  { title: string, content: string, category?: string, shortcut?: string }\nOutput: { response: CannedResponse }\n```\n\n#### `PATCH /api/admin/support/canned-responses/[id]`\n\n```\nInput:  { title?: string, content?: string, category?: string, shortcut?: string }\nOutput: { response: CannedResponse }\n```\n\n#### `DELETE /api/admin/support/canned-responses/[id]`\n\n```\nOutput: { ok: true }\n```\n\n---\n\n## SUBSYSTEM 4: Widget Escalation Flow\n\n### 4.1 Widget Changes — `components/support/SupportChatWidget.tsx`\n\nModifications to the existing widget component:\n\n**New state:**\n- `sessionStatus: 'ai_only' | 'pending_agent' | 'agent_active' | 'agent_closed'`\n- `agentsOnline: boolean`\n- `pollingInterval: NodeJS.Timer | null`\n\n**New behavior:**\n\n1. **\"Talk to a person\" button**: Shown in the chat input area when `agentsOnline === true` and `sessionStatus === 'ai_only'`. On click:\n   - Calls `POST /api/support-chat/request-agent`\n   - Sets `sessionStatus` to the response status\n   - If `pending_agent`: starts polling `GET /api/support-chat/session/[sessionId]/messages` every 3s\n   - If `ticket_created`: shows a system message about the ticket\n\n2. **Agent presence check**: On mount and every 60s, calls `GET /api/support-chat/agents-online`. Updates `agentsOnline` state.\n\n3. **Polling for agent messages**: When `sessionStatus` is `pending_agent` or `agent_active`, poll `GET /api/support-chat/session/[sessionId]/messages?since=<lastMessageTimestamp>` every 3 seconds. Append new messages to the messages array.\n\n4. **Message routing**: When `sessionStatus === 'agent_active'`, user messages are sent via the existing `POST /api/support-chat/message` endpoint. The server-side handler needs a small modification (see 4.2) to skip RAG and just save the user message (no AI response).\n\n5. **System messages**: Render messages with `role === 'system'` in a centered, muted style (no bubble, italic text).\n\n6. **Agent messages**: Render messages with `role === 'agent'` similarly to `assistant` messages but with the agent's name in the header instead of \"Brain\".\n\n7. **Session closed**: When polling returns `sessionStatus === 'agent_closed'`, show a system message and stop polling. Show a \"Start new conversation\" button that resets the session.\n\n### 4.2 Chat Engine Modification — `lib/support/chat-engine.ts`\n\nModify `handleSupportMessage()`:\n\n```typescript\n// At the top of the function, after validating session:\nconst sessionData = await db.select({ status: supportChatSessions.status })\n  .from(supportChatSessions)\n  .where(eq(supportChatSessions.id, sessionId))\n  .limit(1);\n\n// If session is in agent_active state, save user message only (no RAG/AI)\nif (sessionData[0]?.status === 'agent_active') {\n  await db.insert(supportChatMessages).values({\n    sessionId,\n    role: 'user',\n    content: userMessage,\n  });\n  // Update session timestamp\n  await db.update(supportChatSessions)\n    .set({ updatedAt: new Date() })\n    .where(eq(supportChatSessions.id, sessionId));\n  return { response: '', sessionId }; // empty response, agent will respond\n}\n\n// ... existing RAG flow continues for ai_only sessions\n```\n\n### 4.3 Embed Script Changes — `public/widget/support-chat.js`\n\nMirror the same escalation flow for the vanilla JS widget:\n\n- Add \"Talk to a person\" link in the input area\n- Poll for new messages when in `pending_agent` / `agent_active` state\n- Render `system` and `agent` role messages with appropriate styling\n- Check agent availability on mount\n\n---\n\n## SUBSYSTEM 5: Admin UI\n\n### 5.1 Update Admin Support Hub — `app/(app)/admin/support/page.tsx`\n\nAdd two new cards to the existing 3-card grid:\n\n```typescript\n{\n  title: \"Live Support\",\n  description: \"Monitor chat queue, claim conversations, and respond to users in real time.\",\n  href: \"/admin/support/live\",\n  icon: Headphones,  // from lucide-react\n},\n{\n  title: \"Tickets\",\n  description: \"View and manage support tickets created when no agents were available.\",\n  href: \"/admin/support/tickets\",\n  icon: Ticket,  // from lucide-react\n}\n```\n\n### 5.2 Live Support Dashboard — `app/(app)/admin/support/live/`\n\n#### Page: `app/(app)/admin/support/live/page.tsx`\n\nServer component that calls `getRequiredAdmin()` and renders `<LiveSupportClient />`.\n\n#### Client: `app/(app)/admin/support/live/LiveSupportClient.tsx`\n\nFull-screen dashboard with three panels:\n\n**Left Panel — Queue & Active Chats (300px wide):**\n- Online/Offline toggle at top (calls go-online/go-offline)\n- \"Pending\" section: list of pending sessions waiting for an agent (pulled from `/api/admin/support/live/queue`)\n  - Each entry shows: first message preview (truncated), time waiting, page URL\n  - Click \"Claim\" button to claim the session\n- \"My Conversations\" section: list of active sessions assigned to this agent (from `/api/admin/support/live/active`)\n  - Each entry shows: last message preview, unread indicator\n  - Click to select and load in the center panel\n- Auto-refresh: poll queue every 5s, active sessions every 5s\n\n**Center Panel — Chat Window (flex-1):**\n- When no session selected: empty state with instructions\n- When session selected:\n  - Header: session metadata (page URL, user agent, time started)\n  - Message thread: all messages rendered chronologically with role labels (User, Brain/AI, Agent, System)\n  - Input area at bottom: textarea + send button\n  - \"Close Conversation\" button in header\n  - Auto-poll for new messages every 3s\n\n**Right Panel — Tools (280px wide, collapsible):**\n- **Session Info**: metadata, escalation time, message count\n- **Agent Notes**: textarea to add internal notes (saved on blur)\n- **Canned Responses**: searchable list, click to insert into the message input\n- **AI Context**: show what KB chunks were retrieved for this user's questions (read from the session's message history)\n\n**Heartbeat:** The dashboard component runs a 30s interval calling `POST /api/admin/support/live/ping`. On component unmount (page navigation, tab close), call go-offline via `navigator.sendBeacon` or the `beforeunload` event.\n\n**Audio notification:** Play a short notification sound when a new session enters the pending queue.\n\n### 5.3 Tickets Page — `app/(app)/admin/support/tickets/`\n\n#### Page: `app/(app)/admin/support/tickets/page.tsx`\n\nServer component → `<TicketsClient />`.\n\n#### Client: `app/(app)/admin/support/tickets/TicketsClient.tsx`\n\nTable view with:\n- Filter tabs: All, Open, In Progress, Resolved, Closed\n- Columns: Subject (truncated), Status badge, Priority badge, Created date, Assigned agent\n- Click row → detail drawer or separate page showing:\n  - Full conversation thread from the linked session\n  - Status/priority/assignment dropdowns to update\n  - Internal notes\n\n### 5.4 Canned Responses Admin — `app/(app)/admin/support/canned-responses/`\n\n#### Page + Client\n\nSimple CRUD interface:\n- Table listing all canned responses: title, category, shortcut, content preview\n- \"Add Response\" button opens a modal/inline form\n- Edit/delete actions per row\n- Drag-to-reorder for sort_order (stretch goal — can use simple up/down arrows initially)\n\n---\n\n## File Inventory\n\n### New Files\n\n| # | File Path | Purpose |\n|---|---|---|\n| 1 | `drizzle/migrations/0057_live-agent-support.sql` | Schema migration |\n| 2 | `lib/support/agent-presence.ts` | Presence heartbeat + online/offline logic |\n| 3 | `lib/support/agent-routing.ts` | Escalation, claim, close logic |\n| 4 | `lib/support/agent-chat.ts` | Agent message sending |\n| 5 | `app/api/support-chat/request-agent/route.ts` | Public: request human agent |\n| 6 | `app/api/support-chat/agents-online/route.ts` | Public: check agent availability |\n| 7 | `app/api/support-chat/session/[sessionId]/messages/route.ts` | Public: poll for new messages |\n| 8 | `app/api/admin/support/live/ping/route.ts` | Admin: heartbeat |\n| 9 | `app/api/admin/support/live/go-online/route.ts` | Admin: go online |\n| 10 | `app/api/admin/support/live/go-offline/route.ts` | Admin: go offline |\n| 11 | `app/api/admin/support/live/queue/route.ts` | Admin: pending queue |\n| 12 | `app/api/admin/support/live/active/route.ts` | Admin: active sessions |\n| 13 | `app/api/admin/support/live/claim/route.ts` | Admin: claim session |\n| 14 | `app/api/admin/support/live/message/route.ts` | Admin: send message |\n| 15 | `app/api/admin/support/live/close/route.ts` | Admin: close session |\n| 16 | `app/api/admin/support/live/session/[sessionId]/route.ts` | Admin: session detail |\n| 17 | `app/api/admin/support/tickets/route.ts` | Admin: list tickets |\n| 18 | `app/api/admin/support/tickets/[ticketId]/route.ts` | Admin: ticket detail + update |\n| 19 | `app/api/admin/support/canned-responses/route.ts` | Admin: list + create canned responses |\n| 20 | `app/api/admin/support/canned-responses/[id]/route.ts` | Admin: update + delete canned response |\n| 21 | `app/(app)/admin/support/live/page.tsx` | Admin: live support page |\n| 22 | `app/(app)/admin/support/live/LiveSupportClient.tsx` | Admin: live dashboard client component |\n| 23 | `app/(app)/admin/support/tickets/page.tsx` | Admin: tickets page |\n| 24 | `app/(app)/admin/support/tickets/TicketsClient.tsx` | Admin: tickets client component |\n| 25 | `app/(app)/admin/support/canned-responses/page.tsx` | Admin: canned responses page |\n| 26 | `app/(app)/admin/support/canned-responses/CannedResponsesClient.tsx` | Admin: canned responses client |\n\n### Modified Files\n\n| # | File Path | Changes |\n|---|---|---|\n| 1 | `lib/db/schema.ts` | Add new enums, tables, columns, relations |\n| 2 | `lib/support/chat-engine.ts` | Skip RAG when session is in `agent_active` state |\n| 3 | `components/support/SupportChatWidget.tsx` | Add escalation flow, polling, agent/system messages |\n| 4 | `public/widget/support-chat.js` | Mirror escalation flow in embed script |\n| 5 | `app/(app)/admin/support/page.tsx` | Add Live Support and Tickets cards |\n| 6 | `app/api/support-chat/message/route.ts` | Return session status in response |\n\n---\n\n## Implementation Order\n\n### Step 1: Schema & Migration\n1. Add new enums and tables to `lib/db/schema.ts`\n2. Add new columns to existing support tables\n3. Write `drizzle/migrations/0057_live-agent-support.sql`\n4. Run migration against dev database\n5. Verify with `drizzle-kit push` or manual SQL\n\n### Step 2: Core Services\n6. Implement `lib/support/agent-presence.ts`\n7. Implement `lib/support/agent-routing.ts`\n8. Implement `lib/support/agent-chat.ts`\n9. Modify `lib/support/chat-engine.ts` to handle `agent_active` state\n\n### Step 3: API Routes — Public\n10. Build `POST /api/support-chat/request-agent`\n11. Build `GET /api/support-chat/agents-online`\n12. Build `GET /api/support-chat/session/[sessionId]/messages`\n\n### Step 4: API Routes — Admin Live\n13. Build ping, go-online, go-offline routes\n14. Build queue, active, claim routes\n15. Build message, close, session detail routes\n\n### Step 5: API Routes — Admin Tickets & Canned Responses\n16. Build ticket list, detail, update routes\n17. Build canned response CRUD routes\n\n### Step 6: Widget Changes\n18. Modify `SupportChatWidget.tsx` with escalation flow\n19. Modify `public/widget/support-chat.js` with escalation flow\n\n### Step 7: Admin UI\n20. Build live support dashboard (`LiveSupportClient.tsx`)\n21. Build tickets page (`TicketsClient.tsx`)\n22. Build canned responses page (`CannedResponsesClient.tsx`)\n23. Update admin hub with new cards\n\n### Step 8: Testing & Polish\n24. Verify TypeScript strict mode passes\n25. Test full escalation flow: AI → request agent → claim → chat → close\n26. Test ticket creation flow when no agents online\n27. Test widget on standalone HTML page with embed script\n28. Test existing AI-only flow is unaffected\n\n---\n\n## Key Design Decisions\n\n### Polling vs. WebSockets\n\n**Decision: Polling (3s interval)**\n\nRationale:\n- The existing codebase has no WebSocket infrastructure (no socket.io, no Pusher, no Ably)\n- Polling at 3s is well within acceptable latency for a support chat\n- Dramatically simpler to implement, test, and maintain\n- No additional infrastructure or dependencies needed\n- The admin dashboard polls at 5s for queue updates\n- Can upgrade to WebSockets in a future phase if latency becomes a concern\n\n### Agent Presence: Heartbeat vs. Connection-based\n\n**Decision: Heartbeat (30s ping, 90s timeout)**\n\nRationale:\n- Simpler than WebSocket connections for tracking presence\n- Self-healing: stale agents automatically go offline\n- `navigator.sendBeacon` provides best-effort offline notification on page close\n- 90s timeout means worst case a disconnected agent is shown as online for ~90s\n\n### Escalation Trigger: User-Initiated Only\n\n**Decision: Users explicitly request an agent via button click**\n\nRationale:\n- Phase 1 spec explicitly excluded proactive triggers\n- Keeps the flow predictable and simple\n- The \"Talk to a person\" button only appears when agents are online\n- AI never auto-escalates (future consideration for Phase 3)\n\n### Session Lifecycle\n\n```\nai_only → pending_agent → agent_active → agent_closed\n                ↓\n          ticket_created (when no agents online)\n```\n\n- A session starts as `ai_only` and stays there unless the user requests an agent\n- `pending_agent` sessions are visible in the admin queue\n- Once an agent claims it, it moves to `agent_active`\n- The agent can close it → `agent_closed`\n- If no agents are online when escalation is requested → `ticket_created`\n\n### Message Flow During Agent Chat\n\nWhen `status === 'agent_active'`:\n- User messages are saved via the existing `/api/support-chat/message` endpoint (but the server skips the RAG flow and returns an empty response)\n- Agent messages are saved via `/api/admin/support/live/message`\n- The widget polls `/api/support-chat/session/[sessionId]/messages` to get both user and agent messages\n\n---\n\n## Out of Scope\n\nThese items are explicitly not included in this plan:\n\n- Real-time WebSocket connections (polling is used instead)\n- Typing indicators for agent/user (would require WebSockets)\n- File/image attachments in agent chat\n- Agent performance metrics or analytics\n- Customer satisfaction ratings (thumbs up/down)\n- Auto-assignment / round-robin routing (agent manually claims from queue)\n- Business hours configuration\n- Email notifications for tickets\n- Corrections system (Q&A overrides) — tracked separately\n- Multi-agent assignment to a single session\n- Conversation transfer between agents\n\n---\n\n## Acceptance Criteria\n\n1. **Escalation Flow**: User can click \"Talk to a person\" → session moves to pending → agent claims → live two-way chat works → agent closes\n2. **Ticket Fallback**: When no agents online, requesting an agent creates a ticket with the conversation linked\n3. **Agent Presence**: Agent goes online/offline via dashboard toggle; stale agents auto-expire after 90s\n4. **Queue Management**: Pending sessions appear in admin queue in FIFO order; agent can claim any pending session\n5. **Message Delivery**: User messages appear in agent dashboard within 5s; agent messages appear in widget within 3s (polling interval)\n6. **Session Continuity**: AI chat history is preserved when escalating to agent — agent sees the full conversation including AI responses\n7. **Canned Responses**: Agent can create, edit, delete, and use canned responses in active chats\n8. **Tickets**: Admin can view, filter, update status/priority, and assign tickets\n9. **Widget Compatibility**: Escalation flow works in both the React widget and the vanilla JS embed script\n10. **No Regressions**: Existing AI-only chat flow, knowledge base, and admin conversations viewer all work unchanged\n11. **TypeScript**: Zero new type errors in strict mode\n12. **Zod Validation**: All new API routes use Zod input validation\n13. **Admin Auth**: All admin routes use `getRequiredAdmin()` pattern\n"
}
The implementation plan has been saved to `C:\Code\Krisp\docs\plans\2026-03-14-live-agent-support.md`.

The plan covers five subsystems:

1. **Database Schema** — 3 new tables (`support_agent_presence`, `support_tickets`, `support_canned_responses`), 3 new enums, and additive columns on existing `support_chat_sessions` and `support_chat_messages` tables

2. **Agent Presence & Routing** — Heartbeat-based presence (30s ping / 90s timeout), escalation logic (AI → pending → claimed → closed, or fallback to ticket), and agent message handling

3. **API Routes** — 3 public endpoints (request-agent, agents-online, message polling) + 13 admin endpoints (presence, queue, claim, message, close, tickets CRUD, canned responses CRUD)

4. **Widget Escalation Flow** — "Talk to a person" button, 3s polling for agent messages, system/agent message rendering, session status tracking — for both the React component and vanilla JS embed

5. **Admin UI** — 3-panel live support dashboard (queue + chat window + tools), tickets management page, canned responses CRUD page, and updated support hub

Key design decisions: polling over WebSockets (no existing WS infrastructure), heartbeat-based presence, user-initiated escalation only, and 26 new files with 6 modified files.