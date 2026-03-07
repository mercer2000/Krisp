CREATE TABLE IF NOT EXISTS "vip_contacts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "email" varchar(512) NOT NULL,
  "domain" varchar(255),
  "display_name" varchar(255),
  "notify_on_new" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_vip_contacts_tenant_email" ON "vip_contacts" ("tenant_id", "email");
CREATE INDEX IF NOT EXISTS "idx_vip_contacts_tenant" ON "vip_contacts" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_vip_contacts_domain" ON "vip_contacts" ("tenant_id", "domain");

ALTER TABLE "vip_contacts" ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "crud_vip_contacts_policy_select"
    ON "vip_contacts"
    AS PERMISSIVE
    FOR SELECT
    TO "authenticated"
    USING ((select auth.user_id()::uuid = tenant_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "crud_vip_contacts_policy_insert"
    ON "vip_contacts"
    AS PERMISSIVE
    FOR INSERT
    TO "authenticated"
    WITH CHECK ((select auth.user_id()::uuid = tenant_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "crud_vip_contacts_policy_update"
    ON "vip_contacts"
    AS PERMISSIVE
    FOR UPDATE
    TO "authenticated"
    USING ((select auth.user_id()::uuid = tenant_id))
    WITH CHECK ((select auth.user_id()::uuid = tenant_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "crud_vip_contacts_policy_delete"
    ON "vip_contacts"
    AS PERMISSIVE
    FOR DELETE
    TO "authenticated"
    USING ((select auth.user_id()::uuid = tenant_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
