-- Email Contacts table for auto-extracted sender/recipient addresses
CREATE TABLE IF NOT EXISTS "email_contacts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "email" text NOT NULL,
  "display_name" text,
  "email_count" integer DEFAULT 0 NOT NULL,
  "last_email_at" timestamp with time zone,
  "first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Unique index: one contact per email per tenant
CREATE UNIQUE INDEX IF NOT EXISTS "uq_email_contacts_tenant_email"
  ON "email_contacts" ("tenant_id", "email");

-- Lookup indexes
CREATE INDEX IF NOT EXISTS "idx_email_contacts_tenant"
  ON "email_contacts" ("tenant_id");

CREATE INDEX IF NOT EXISTS "idx_email_contacts_email_count"
  ON "email_contacts" ("tenant_id", "email_count");

-- Enable RLS
ALTER TABLE "email_contacts" ENABLE ROW LEVEL SECURITY;

-- RLS policies (tenant-scoped CRUD)
CREATE POLICY "email_contacts_crud_select"
  ON "email_contacts" FOR SELECT TO "authenticated"
  USING ((select auth.user_id()::uuid) = "tenant_id");

CREATE POLICY "email_contacts_crud_insert"
  ON "email_contacts" FOR INSERT TO "authenticated"
  WITH CHECK ((select auth.user_id()::uuid) = "tenant_id");

CREATE POLICY "email_contacts_crud_update"
  ON "email_contacts" FOR UPDATE TO "authenticated"
  USING ((select auth.user_id()::uuid) = "tenant_id")
  WITH CHECK ((select auth.user_id()::uuid) = "tenant_id");

CREATE POLICY "email_contacts_crud_delete"
  ON "email_contacts" FOR DELETE TO "authenticated"
  USING ((select auth.user_id()::uuid) = "tenant_id");
