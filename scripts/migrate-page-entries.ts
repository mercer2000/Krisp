import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  // 1. Create enums
  await sql`CREATE TYPE "public"."page_type" AS ENUM('page', 'knowledge', 'decisions')`;
  console.log("Created page_type enum");

  await sql`CREATE TYPE "public"."page_entry_type" AS ENUM('knowledge', 'decision', 'email_summary', 'manual')`;
  console.log("Created page_entry_type enum");

  // 2. Add new columns to pages
  await sql`ALTER TABLE pages ADD COLUMN page_type page_type NOT NULL DEFAULT 'page'`;
  await sql`ALTER TABLE pages ADD COLUMN color varchar(7)`;
  await sql`ALTER TABLE pages ADD COLUMN smart_rule text`;
  await sql`ALTER TABLE pages ADD COLUMN smart_active boolean NOT NULL DEFAULT false`;
  console.log("Added new columns to pages");

  // 3. Create page_entries table
  await sql`CREATE TABLE page_entries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id uuid NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    entry_type page_entry_type NOT NULL,
    title varchar(500) NOT NULL DEFAULT '',
    content text NOT NULL DEFAULT '',
    metadata jsonb DEFAULT '{}'::jsonb,
    source_id varchar(255),
    source_type varchar(50),
    confidence integer,
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`;
  console.log("Created page_entries table");

  // 4. Enable RLS
  await sql`ALTER TABLE page_entries ENABLE ROW LEVEL SECURITY`;
  console.log("Enabled RLS on page_entries");

  // 5. Create indexes
  await sql`CREATE INDEX idx_page_entries_page_sort ON page_entries (page_id, sort_order)`;
  await sql`CREATE INDEX idx_page_entries_source ON page_entries (source_type, source_id)`;
  await sql`CREATE UNIQUE INDEX uq_page_entry_source ON page_entries (page_id, source_type, source_id)`;
  console.log("Created indexes");

  // 6. Create RLS policies
  await sql`CREATE POLICY page_entries_auth_select ON page_entries AS PERMISSIVE FOR SELECT TO authenticated USING (page_id IN (SELECT p.id FROM pages p JOIN workspaces w ON p.workspace_id = w.id WHERE w.owner_id = (select auth.user_id()::uuid)))`;
  await sql`CREATE POLICY page_entries_auth_insert ON page_entries AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (page_id IN (SELECT p.id FROM pages p JOIN workspaces w ON p.workspace_id = w.id WHERE w.owner_id = (select auth.user_id()::uuid)))`;
  await sql`CREATE POLICY page_entries_auth_update ON page_entries AS PERMISSIVE FOR UPDATE TO authenticated USING (page_id IN (SELECT p.id FROM pages p JOIN workspaces w ON p.workspace_id = w.id WHERE w.owner_id = (select auth.user_id()::uuid))) WITH CHECK (page_id IN (SELECT p.id FROM pages p JOIN workspaces w ON p.workspace_id = w.id WHERE w.owner_id = (select auth.user_id()::uuid)))`;
  await sql`CREATE POLICY page_entries_auth_delete ON page_entries AS PERMISSIVE FOR DELETE TO authenticated USING (page_id IN (SELECT p.id FROM pages p JOIN workspaces w ON p.workspace_id = w.id WHERE w.owner_id = (select auth.user_id()::uuid)))`;
  console.log("Created RLS policies");

  // 7. Grant to authenticated role
  await sql`GRANT SELECT, INSERT, UPDATE, DELETE ON page_entries TO authenticated`;
  console.log("Granted permissions");

  console.log("Migration complete!");
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
