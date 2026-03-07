-- Smart Label Auto-Draft Reply & Context Window
-- Adds per-label auto-draft toggle, context entries table, and email drafts table

-- Add auto-draft columns to smart_labels
ALTER TABLE "smart_labels" ADD COLUMN IF NOT EXISTS "auto_draft_enabled" boolean NOT NULL DEFAULT false;
ALTER TABLE "smart_labels" ADD COLUMN IF NOT EXISTS "context_window_max" integer NOT NULL DEFAULT 7;

-- Context entries table (per-label memory for tone calibration)
CREATE TABLE IF NOT EXISTS "smart_label_context_entries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "label_id" uuid NOT NULL REFERENCES "smart_labels"("id") ON DELETE CASCADE,
  "email_id" varchar(255) NOT NULL,
  "email_type" varchar(30) NOT NULL,
  "sender" text NOT NULL,
  "subject" text,
  "received_at" timestamptz NOT NULL,
  "body_excerpt" text,
  "user_replied" boolean NOT NULL DEFAULT false,
  "reply_excerpt" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_slce_label" ON "smart_label_context_entries"("label_id");
CREATE INDEX IF NOT EXISTS "idx_slce_label_created" ON "smart_label_context_entries"("label_id", "created_at");

-- RLS for context entries
ALTER TABLE "smart_label_context_entries" ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'slce_auth_select' AND tablename = 'smart_label_context_entries') THEN
    CREATE POLICY "slce_auth_select" ON "smart_label_context_entries" FOR SELECT TO "authenticated"
      USING (label_id IN (SELECT id FROM smart_labels WHERE tenant_id = (select auth.user_id()::uuid)));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'slce_auth_insert' AND tablename = 'smart_label_context_entries') THEN
    CREATE POLICY "slce_auth_insert" ON "smart_label_context_entries" FOR INSERT TO "authenticated"
      WITH CHECK (label_id IN (SELECT id FROM smart_labels WHERE tenant_id = (select auth.user_id()::uuid)));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'slce_auth_update' AND tablename = 'smart_label_context_entries') THEN
    CREATE POLICY "slce_auth_update" ON "smart_label_context_entries" FOR UPDATE TO "authenticated"
      USING (label_id IN (SELECT id FROM smart_labels WHERE tenant_id = (select auth.user_id()::uuid)))
      WITH CHECK (label_id IN (SELECT id FROM smart_labels WHERE tenant_id = (select auth.user_id()::uuid)));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'slce_auth_delete' AND tablename = 'smart_label_context_entries') THEN
    CREATE POLICY "slce_auth_delete" ON "smart_label_context_entries" FOR DELETE TO "authenticated"
      USING (label_id IN (SELECT id FROM smart_labels WHERE tenant_id = (select auth.user_id()::uuid)));
  END IF;
END $$;

-- Email draft status enum
DO $$ BEGIN
  CREATE TYPE "email_draft_status" AS ENUM ('pending_review', 'sent', 'discarded');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Email drafts table
CREATE TABLE IF NOT EXISTS "email_drafts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "email_id" varchar(255) NOT NULL,
  "email_type" varchar(30) NOT NULL,
  "label_id" uuid REFERENCES "smart_labels"("id") ON DELETE SET NULL,
  "draft_body" text NOT NULL,
  "status" "email_draft_status" NOT NULL DEFAULT 'pending_review',
  "discarded_at" timestamptz,
  "sent_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_email_drafts_tenant" ON "email_drafts"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_email_drafts_email" ON "email_drafts"("email_id", "email_type");
CREATE INDEX IF NOT EXISTS "idx_email_drafts_status" ON "email_drafts"("tenant_id", "status");

-- RLS for email drafts
ALTER TABLE "email_drafts" ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'crud_email_drafts_select' AND tablename = 'email_drafts') THEN
    CREATE POLICY "crud_email_drafts_select" ON "email_drafts" FOR SELECT TO "authenticated"
      USING ((select auth.user_id()::uuid) = tenant_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'crud_email_drafts_insert' AND tablename = 'email_drafts') THEN
    CREATE POLICY "crud_email_drafts_insert" ON "email_drafts" FOR INSERT TO "authenticated"
      WITH CHECK ((select auth.user_id()::uuid) = tenant_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'crud_email_drafts_update' AND tablename = 'email_drafts') THEN
    CREATE POLICY "crud_email_drafts_update" ON "email_drafts" FOR UPDATE TO "authenticated"
      USING ((select auth.user_id()::uuid) = tenant_id)
      WITH CHECK ((select auth.user_id()::uuid) = tenant_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'crud_email_drafts_delete' AND tablename = 'email_drafts') THEN
    CREATE POLICY "crud_email_drafts_delete" ON "email_drafts" FOR DELETE TO "authenticated"
      USING ((select auth.user_id()::uuid) = tenant_id);
  END IF;
END $$;
