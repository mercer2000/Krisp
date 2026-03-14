CREATE TABLE IF NOT EXISTS "webhook_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "source" varchar(50) NOT NULL,
  "tenant_id" uuid REFERENCES "users"("id") ON DELETE CASCADE,
  "status" varchar(20) NOT NULL,
  "method" varchar(10),
  "duration_ms" integer,
  "message_count" integer,
  "error_message" text,
  "metadata" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_webhook_logs_source" ON "webhook_logs" ("source");
CREATE INDEX IF NOT EXISTS "idx_webhook_logs_tenant" ON "webhook_logs" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_webhook_logs_created" ON "webhook_logs" ("created_at");
