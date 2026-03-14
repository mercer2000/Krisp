-- Migration: Live Agent Support (Phase 2)
-- Adds agent presence, session escalation, tickets, and canned responses

-- 1. New enums
CREATE TYPE "support_session_status" AS ENUM (
  'ai_only',
  'pending_agent',
  'agent_active',
  'agent_closed',
  'ticket_created'
);

CREATE TYPE "support_ticket_status" AS ENUM (
  'open',
  'in_progress',
  'resolved',
  'closed'
);

CREATE TYPE "support_ticket_priority" AS ENUM (
  'low',
  'medium',
  'high'
);

-- 2. Extend support_chat_role enum (must be outside transaction)
ALTER TYPE "support_chat_role" ADD VALUE IF NOT EXISTS 'agent';
ALTER TYPE "support_chat_role" ADD VALUE IF NOT EXISTS 'system';

-- 3. Add columns to support_chat_sessions
ALTER TABLE "support_chat_sessions"
  ADD COLUMN "status" "support_session_status" NOT NULL DEFAULT 'ai_only',
  ADD COLUMN "assigned_agent_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  ADD COLUMN "escalated_at" timestamptz,
  ADD COLUMN "agent_notes" text;

CREATE INDEX "idx_support_sessions_status" ON "support_chat_sessions"("status");
CREATE INDEX "idx_support_sessions_agent" ON "support_chat_sessions"("assigned_agent_id");

-- 4. Add agent_id column to support_chat_messages
ALTER TABLE "support_chat_messages"
  ADD COLUMN "agent_id" uuid REFERENCES "users"("id") ON DELETE SET NULL;

-- 5. Create support_agent_presence table
CREATE TABLE "support_agent_presence" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "status" varchar(20) NOT NULL DEFAULT 'online',
  "last_ping" timestamptz NOT NULL DEFAULT now(),
  "max_concurrent" integer NOT NULL DEFAULT 5,
  "active_count" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX "idx_support_agent_presence_user" ON "support_agent_presence"("user_id");
CREATE INDEX "idx_agent_presence_status" ON "support_agent_presence"("status");
CREATE INDEX "idx_agent_presence_ping" ON "support_agent_presence"("last_ping");

-- 6. Create support_tickets table
CREATE TABLE "support_tickets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "session_id" uuid NOT NULL REFERENCES "support_chat_sessions"("id") ON DELETE CASCADE,
  "subject" text NOT NULL,
  "status" "support_ticket_status" NOT NULL DEFAULT 'open',
  "priority" "support_ticket_priority" NOT NULL DEFAULT 'medium',
  "assigned_agent_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "resolved_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX "idx_support_tickets_status" ON "support_tickets"("status");
CREATE INDEX "idx_support_tickets_agent" ON "support_tickets"("assigned_agent_id");
CREATE INDEX "idx_support_tickets_created" ON "support_tickets"("created_at");

-- 7. Create support_canned_responses table
CREATE TABLE "support_canned_responses" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" varchar(100) NOT NULL,
  "content" text NOT NULL,
  "category" varchar(50),
  "shortcut" varchar(20),
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
