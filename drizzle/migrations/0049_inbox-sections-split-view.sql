-- Split inbox view: sections and layouts tables

CREATE TABLE IF NOT EXISTS "inbox_sections" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" varchar(100) NOT NULL,
  "filter_criteria" jsonb NOT NULL,
  "color" varchar(7) NOT NULL DEFAULT '#6366F1',
  "position" integer NOT NULL DEFAULT 0,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_inbox_sections_tenant" ON "inbox_sections" ("tenant_id");

-- RLS policies for inbox_sections
ALTER TABLE "inbox_sections" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crud_authenticated_policy_select_inbox_sections"
  ON "inbox_sections"
  AS PERMISSIVE
  FOR SELECT
  TO "authenticated"
  USING ((select auth.user_id()::uuid = "inbox_sections"."tenant_id"));

CREATE POLICY "crud_authenticated_policy_insert_inbox_sections"
  ON "inbox_sections"
  AS PERMISSIVE
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((select auth.user_id()::uuid = "inbox_sections"."tenant_id"));

CREATE POLICY "crud_authenticated_policy_update_inbox_sections"
  ON "inbox_sections"
  AS PERMISSIVE
  FOR UPDATE
  TO "authenticated"
  USING ((select auth.user_id()::uuid = "inbox_sections"."tenant_id"));

CREATE POLICY "crud_authenticated_policy_delete_inbox_sections"
  ON "inbox_sections"
  AS PERMISSIVE
  FOR DELETE
  TO "authenticated"
  USING ((select auth.user_id()::uuid = "inbox_sections"."tenant_id"));

-- Layouts table
CREATE TABLE IF NOT EXISTS "inbox_layouts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" varchar(100) NOT NULL,
  "left_section_id" uuid REFERENCES "inbox_sections"("id") ON DELETE SET NULL,
  "right_section_id" uuid REFERENCES "inbox_sections"("id") ON DELETE SET NULL,
  "is_default" boolean NOT NULL DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_inbox_layouts_tenant" ON "inbox_layouts" ("tenant_id");

-- RLS policies for inbox_layouts
ALTER TABLE "inbox_layouts" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crud_authenticated_policy_select_inbox_layouts"
  ON "inbox_layouts"
  AS PERMISSIVE
  FOR SELECT
  TO "authenticated"
  USING ((select auth.user_id()::uuid = "inbox_layouts"."tenant_id"));

CREATE POLICY "crud_authenticated_policy_insert_inbox_layouts"
  ON "inbox_layouts"
  AS PERMISSIVE
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((select auth.user_id()::uuid = "inbox_layouts"."tenant_id"));

CREATE POLICY "crud_authenticated_policy_update_inbox_layouts"
  ON "inbox_layouts"
  AS PERMISSIVE
  FOR UPDATE
  TO "authenticated"
  USING ((select auth.user_id()::uuid = "inbox_layouts"."tenant_id"));

CREATE POLICY "crud_authenticated_policy_delete_inbox_layouts"
  ON "inbox_layouts"
  AS PERMISSIVE
  FOR DELETE
  TO "authenticated"
  USING ((select auth.user_id()::uuid = "inbox_layouts"."tenant_id"));
