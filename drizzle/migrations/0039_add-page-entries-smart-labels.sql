-- Integrate knowledge and decisions into pages with smart label support
-- Adds page_type, color, smart_rule, smart_active columns to pages table
-- Creates page_entries table for knowledge, decisions, email summaries, and manual notes

-- ── Enums ───────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE page_type AS ENUM ('page', 'knowledge', 'decisions');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE page_entry_type AS ENUM ('knowledge', 'decision', 'email_summary', 'manual');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ── Alter pages table ───────────────────────────────

ALTER TABLE pages
  ADD COLUMN IF NOT EXISTS page_type page_type NOT NULL DEFAULT 'page',
  ADD COLUMN IF NOT EXISTS color VARCHAR(7),
  ADD COLUMN IF NOT EXISTS smart_rule TEXT,
  ADD COLUMN IF NOT EXISTS smart_active BOOLEAN NOT NULL DEFAULT false;

-- ── Create page_entries table ───────────────────────

CREATE TABLE IF NOT EXISTS page_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  entry_type page_entry_type NOT NULL,
  title VARCHAR(500) NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  metadata JSONB DEFAULT '{}',
  source_id VARCHAR(255),
  source_type VARCHAR(50),
  confidence INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indexes ─────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_page_entries_page_sort
  ON page_entries(page_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_page_entries_source
  ON page_entries(source_type, source_id);

-- NULLs are distinct in PG unique indexes, so manual entries (null source) are not constrained
CREATE UNIQUE INDEX IF NOT EXISTS uq_page_entry_source
  ON page_entries(page_id, source_type, source_id);

-- ── RLS Policies ────────────────────────────────────

ALTER TABLE page_entries ENABLE ROW LEVEL SECURITY;

-- page_entries: access through parent pages → workspaces ownership
CREATE POLICY page_entries_auth_select ON page_entries FOR SELECT TO authenticated
  USING (page_id IN (
    SELECT p.id FROM pages p
    JOIN workspaces w ON p.workspace_id = w.id
    WHERE w.owner_id = (SELECT auth.user_id()::uuid)
  ));

CREATE POLICY page_entries_auth_insert ON page_entries FOR INSERT TO authenticated
  WITH CHECK (page_id IN (
    SELECT p.id FROM pages p
    JOIN workspaces w ON p.workspace_id = w.id
    WHERE w.owner_id = (SELECT auth.user_id()::uuid)
  ));

CREATE POLICY page_entries_auth_update ON page_entries FOR UPDATE TO authenticated
  USING (page_id IN (
    SELECT p.id FROM pages p
    JOIN workspaces w ON p.workspace_id = w.id
    WHERE w.owner_id = (SELECT auth.user_id()::uuid)
  ))
  WITH CHECK (page_id IN (
    SELECT p.id FROM pages p
    JOIN workspaces w ON p.workspace_id = w.id
    WHERE w.owner_id = (SELECT auth.user_id()::uuid)
  ));

CREATE POLICY page_entries_auth_delete ON page_entries FOR DELETE TO authenticated
  USING (page_id IN (
    SELECT p.id FROM pages p
    JOIN workspaces w ON p.workspace_id = w.id
    WHERE w.owner_id = (SELECT auth.user_id()::uuid)
  ));
