-- Daily Briefing Status Enum
DO $$ BEGIN
  CREATE TYPE "public"."daily_briefing_status" AS ENUM('generating', 'completed', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Daily Briefings Table
CREATE TABLE IF NOT EXISTS "daily_briefings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "briefing_date" date NOT NULL,
  "status" "daily_briefing_status" DEFAULT 'generating' NOT NULL,
  "briefing_html" text,
  "overdue_card_count" integer DEFAULT 0 NOT NULL,
  "email_count" integer DEFAULT 0 NOT NULL,
  "meeting_count" integer DEFAULT 0 NOT NULL,
  "action_item_count" integer DEFAULT 0 NOT NULL,
  "email_sent_at" timestamp with time zone,
  "deleted_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS "idx_daily_briefings_user_id" ON "daily_briefings" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_daily_briefings_user_date" ON "daily_briefings" ("user_id", "briefing_date");

-- RLS Policies
ALTER TABLE "daily_briefings" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crud-authenticated-policy-select" ON "daily_briefings"
  AS PERMISSIVE FOR SELECT TO "authenticated"
  USING ((select auth.user_id()) = "user_id"::text);

CREATE POLICY "crud-authenticated-policy-insert" ON "daily_briefings"
  AS PERMISSIVE FOR INSERT TO "authenticated"
  WITH CHECK ((select auth.user_id()) = "user_id"::text);

CREATE POLICY "crud-authenticated-policy-update" ON "daily_briefings"
  AS PERMISSIVE FOR UPDATE TO "authenticated"
  USING ((select auth.user_id()) = "user_id"::text);

CREATE POLICY "crud-authenticated-policy-delete" ON "daily_briefings"
  AS PERMISSIVE FOR DELETE TO "authenticated"
  USING ((select auth.user_id()) = "user_id"::text);
