-- Weekly Planning System Migration
-- Adds: weekly_plans table, daily_themes table
-- Modifies: cards (Big 3 fields), columns (Focus column), weekly_reviews (plan link)

-- 1. Create the weekly_plan_status enum
DO $$ BEGIN
  CREATE TYPE "public"."weekly_plan_status" AS ENUM('planning', 'active', 'assessed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Create weekly_plans table
CREATE TABLE IF NOT EXISTS "weekly_plans" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "week_start" date NOT NULL,
  "week_end" date NOT NULL,
  "weekly_review_id" uuid REFERENCES "weekly_reviews"("id") ON DELETE SET NULL,
  "big_three_card_ids" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "ai_assessment" text,
  "user_reflection" text,
  "assessment_score" integer,
  "assessment_email_sent_at" timestamp with time zone,
  "status" "weekly_plan_status" NOT NULL DEFAULT 'planning',
  "deleted_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

-- 3. Create daily_themes table
CREATE TABLE IF NOT EXISTS "daily_themes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "weekly_plan_id" uuid NOT NULL REFERENCES "weekly_plans"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "date" date NOT NULL,
  "theme" text NOT NULL,
  "ai_rationale" text,
  "suggested_card_ids" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "is_overridden" boolean NOT NULL DEFAULT false,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

-- 4. Add columns to existing tables
ALTER TABLE "cards" ADD COLUMN IF NOT EXISTS "is_big_three" boolean NOT NULL DEFAULT false;
ALTER TABLE "cards" ADD COLUMN IF NOT EXISTS "big_three_week_start" date;

ALTER TABLE "columns" ADD COLUMN IF NOT EXISTS "is_focus_column" boolean NOT NULL DEFAULT false;

ALTER TABLE "weekly_reviews" ADD COLUMN IF NOT EXISTS "weekly_plan_id" uuid REFERENCES "weekly_plans"("id") ON DELETE SET NULL;

-- 5. Create indexes
CREATE INDEX IF NOT EXISTS "weekly_plans_user_id_idx" ON "weekly_plans" ("user_id");
CREATE INDEX IF NOT EXISTS "weekly_plans_user_week_idx" ON "weekly_plans" ("user_id", "week_start");
CREATE INDEX IF NOT EXISTS "daily_themes_plan_id_idx" ON "daily_themes" ("weekly_plan_id");
CREATE INDEX IF NOT EXISTS "daily_themes_user_date_idx" ON "daily_themes" ("user_id", "date");

-- 6. RLS policies for weekly_plans
ALTER TABLE "weekly_plans" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "weekly_plans_crud_select" ON "weekly_plans"
  AS PERMISSIVE FOR SELECT TO "authenticated"
  USING ((SELECT auth.user_id()::uuid) = "user_id");

CREATE POLICY "weekly_plans_crud_insert" ON "weekly_plans"
  AS PERMISSIVE FOR INSERT TO "authenticated"
  WITH CHECK ((SELECT auth.user_id()::uuid) = "user_id");

CREATE POLICY "weekly_plans_crud_update" ON "weekly_plans"
  AS PERMISSIVE FOR UPDATE TO "authenticated"
  USING ((SELECT auth.user_id()::uuid) = "user_id");

CREATE POLICY "weekly_plans_crud_delete" ON "weekly_plans"
  AS PERMISSIVE FOR DELETE TO "authenticated"
  USING ((SELECT auth.user_id()::uuid) = "user_id");

-- 7. RLS policies for daily_themes
ALTER TABLE "daily_themes" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_themes_crud_select" ON "daily_themes"
  AS PERMISSIVE FOR SELECT TO "authenticated"
  USING ((SELECT auth.user_id()::uuid) = "user_id");

CREATE POLICY "daily_themes_crud_insert" ON "daily_themes"
  AS PERMISSIVE FOR INSERT TO "authenticated"
  WITH CHECK ((SELECT auth.user_id()::uuid) = "user_id");

CREATE POLICY "daily_themes_crud_update" ON "daily_themes"
  AS PERMISSIVE FOR UPDATE TO "authenticated"
  USING ((SELECT auth.user_id()::uuid) = "user_id");

CREATE POLICY "daily_themes_crud_delete" ON "daily_themes"
  AS PERMISSIVE FOR DELETE TO "authenticated"
  USING ((SELECT auth.user_id()::uuid) = "user_id");
