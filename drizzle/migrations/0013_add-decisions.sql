-- Decision Register: stores detected and manual decisions
DO $$ BEGIN
  CREATE TYPE "public"."decision_status" AS ENUM('active', 'reconsidered', 'archived');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."decision_category" AS ENUM('technical', 'process', 'budget', 'strategic', 'other');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "decisions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "meeting_id" integer REFERENCES "webhook_key_points"("id") ON DELETE SET NULL,
  "email_id" integer,
  "statement" text NOT NULL,
  "context" text,
  "rationale" text,
  "participants" jsonb DEFAULT '[]'::jsonb,
  "category" "decision_category" DEFAULT 'other' NOT NULL,
  "status" "decision_status" DEFAULT 'active' NOT NULL,
  "priority" "priority" DEFAULT 'medium' NOT NULL,
  "extraction_source" varchar(50) DEFAULT 'manual' NOT NULL,
  "confidence" integer DEFAULT 100,
  "annotation" text,
  "decision_date" timestamp with time zone,
  "deleted_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_decisions_user_id" ON "decisions" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_decisions_meeting_id" ON "decisions" ("meeting_id");
CREATE INDEX IF NOT EXISTS "idx_decisions_status" ON "decisions" ("user_id", "status");
CREATE INDEX IF NOT EXISTS "idx_decisions_category" ON "decisions" ("user_id", "category");
