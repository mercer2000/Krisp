-- Create zoom channel type enum
DO $$ BEGIN
  CREATE TYPE "zoom_channel_type" AS ENUM ('dm', 'channel');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create zoom_oauth_tokens table
CREATE TABLE IF NOT EXISTS "zoom_oauth_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "zoom_account_id" varchar(255),
  "access_token" text NOT NULL,
  "refresh_token" text NOT NULL,
  "token_expiry" timestamp with time zone NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Create zoom_chat_messages table
CREATE TABLE IF NOT EXISTS "zoom_chat_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "zoom_user_id" varchar(255) NOT NULL,
  "message_id" varchar(512) NOT NULL,
  "channel_id" varchar(512),
  "channel_type" "zoom_channel_type" NOT NULL,
  "sender_id" varchar(255) NOT NULL,
  "sender_name" varchar(500),
  "message_content" text,
  "message_timestamp" timestamp with time zone NOT NULL,
  "is_edited" boolean DEFAULT false NOT NULL,
  "is_deleted" boolean DEFAULT false NOT NULL,
  "raw_payload" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Create indexes for zoom_oauth_tokens
CREATE UNIQUE INDEX IF NOT EXISTS "uq_zoom_oauth_tenant" ON "zoom_oauth_tokens" USING btree ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_zoom_oauth_tenant" ON "zoom_oauth_tokens" USING btree ("tenant_id");

-- Create indexes for zoom_chat_messages
CREATE UNIQUE INDEX IF NOT EXISTS "uq_zoom_chat_tenant_message" ON "zoom_chat_messages" USING btree ("tenant_id", "message_id");
CREATE INDEX IF NOT EXISTS "idx_zoom_chat_tenant" ON "zoom_chat_messages" USING btree ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_zoom_chat_zoom_user" ON "zoom_chat_messages" USING btree ("tenant_id", "zoom_user_id");
CREATE INDEX IF NOT EXISTS "idx_zoom_chat_timestamp" ON "zoom_chat_messages" USING btree ("tenant_id", "message_timestamp");
