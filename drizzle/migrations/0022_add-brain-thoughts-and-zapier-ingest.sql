-- Brain Thoughts (Open Brain persistent memory)
CREATE TABLE IF NOT EXISTS "brain_thoughts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "content" text NOT NULL,
  "source" varchar(100) NOT NULL DEFAULT 'manual',
  "author" varchar(255),
  "topic" varchar(255),
  "sentiment" varchar(50),
  "urgency" varchar(50),
  "tags" jsonb NOT NULL DEFAULT '[]',
  "embedding" vector(1536),
  "source_timestamp" timestamptz,
  "truncated" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT NOW(),
  "updated_at" timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_brain_thoughts_user" ON "brain_thoughts" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_brain_thoughts_user_created" ON "brain_thoughts" ("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_brain_thoughts_source" ON "brain_thoughts" ("user_id", "source");

-- Zapier Ingest Status Enum
DO $$ BEGIN
  CREATE TYPE "zapier_ingest_status" AS ENUM ('success', 'failed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Zapier Ingest Logs
CREATE TABLE IF NOT EXISTS "zapier_ingest_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "source" varchar(255) NOT NULL,
  "routing_target" varchar(20) NOT NULL,
  "status" "zapier_ingest_status" NOT NULL,
  "idempotency_key" varchar(255),
  "error_message" text,
  "thought_id" uuid,
  "card_id" uuid,
  "created_at" timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_zapier_ingest_logs_user" ON "zapier_ingest_logs" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_zapier_ingest_logs_user_created" ON "zapier_ingest_logs" ("user_id", "created_at");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_zapier_ingest_idempotency" ON "zapier_ingest_logs" ("user_id", "idempotency_key");
