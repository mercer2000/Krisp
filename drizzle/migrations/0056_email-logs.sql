CREATE TABLE IF NOT EXISTS "email_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "recipient_email" text NOT NULL,
  "from_email" text NOT NULL,
  "type" varchar(100) NOT NULL,
  "subject" text NOT NULL,
  "html_body" text NOT NULL,
  "resend_id" text,
  "status" varchar(20) NOT NULL DEFAULT 'sent',
  "original_email_log_id" uuid REFERENCES "email_logs"("id") ON DELETE SET NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "email_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email_log_id" uuid NOT NULL REFERENCES "email_logs"("id") ON DELETE CASCADE,
  "event_type" varchar(50) NOT NULL,
  "metadata" jsonb,
  "occurred_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_email_logs_recipient" ON "email_logs" ("recipient_email");
CREATE INDEX IF NOT EXISTS "idx_email_logs_type" ON "email_logs" ("type");
CREATE INDEX IF NOT EXISTS "idx_email_logs_status" ON "email_logs" ("status");
CREATE INDEX IF NOT EXISTS "idx_email_logs_resend_id" ON "email_logs" ("resend_id");
CREATE INDEX IF NOT EXISTS "idx_email_logs_created" ON "email_logs" ("created_at");
CREATE INDEX IF NOT EXISTS "idx_email_logs_user_created" ON "email_logs" ("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_email_events_log" ON "email_events" ("email_log_id");
CREATE INDEX IF NOT EXISTS "idx_email_events_type" ON "email_events" ("event_type");
