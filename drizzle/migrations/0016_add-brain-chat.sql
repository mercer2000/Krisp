-- Brain Chat: AI agent chat for Second Brain
DO $$ BEGIN
  CREATE TYPE "brain_chat_role" AS ENUM ('user', 'assistant');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "brain_chat_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "title" varchar(255) NOT NULL DEFAULT 'New Chat',
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "brain_chat_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "session_id" uuid NOT NULL REFERENCES "brain_chat_sessions"("id") ON DELETE CASCADE,
  "role" "brain_chat_role" NOT NULL,
  "content" text NOT NULL,
  "sources_used" jsonb DEFAULT '[]',
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_brain_chat_sessions_user" ON "brain_chat_sessions" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_brain_chat_sessions_updated" ON "brain_chat_sessions" ("user_id", "updated_at");
CREATE INDEX IF NOT EXISTS "idx_brain_chat_messages_session" ON "brain_chat_messages" ("session_id");
CREATE INDEX IF NOT EXISTS "idx_brain_chat_messages_created" ON "brain_chat_messages" ("session_id", "created_at");
