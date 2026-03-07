-- Add thought reminders for scheduling resurfacing reminders on brain thoughts

DO $$ BEGIN
  CREATE TYPE "public"."reminder_mode" AS ENUM('one_time', 'spaced_repetition');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."reminder_status" AS ENUM('pending', 'sent', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "thought_reminders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "thought_id" uuid NOT NULL REFERENCES "brain_thoughts"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "scheduled_at" timestamp with time zone NOT NULL,
  "mode" "reminder_mode" NOT NULL DEFAULT 'one_time',
  "status" "reminder_status" NOT NULL DEFAULT 'pending',
  "repetition_number" integer NOT NULL DEFAULT 0,
  "sent_at" timestamp with time zone,
  "note" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_thought_reminders_user" ON "thought_reminders" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "idx_thought_reminders_pending" ON "thought_reminders" USING btree ("status", "scheduled_at");
CREATE INDEX IF NOT EXISTS "idx_thought_reminders_thought" ON "thought_reminders" USING btree ("thought_id");

-- RLS policies
ALTER TABLE "thought_reminders" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "thought_reminders_auth_select" ON "thought_reminders" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "thought_reminders"."user_id"));
CREATE POLICY "thought_reminders_auth_insert" ON "thought_reminders" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "thought_reminders"."user_id"));
CREATE POLICY "thought_reminders_auth_update" ON "thought_reminders" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "thought_reminders"."user_id"));
CREATE POLICY "thought_reminders_auth_delete" ON "thought_reminders" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "thought_reminders"."user_id"));
