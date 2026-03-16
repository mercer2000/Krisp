-- Migrate existing smart rules (on pages) into the smart_labels table.
-- Each page with a smart_rule becomes a smart label with extract_knowledge
-- enabled and clip_to_page_id pointing back to the original page.

INSERT INTO smart_labels (
  tenant_id,
  name,
  prompt,
  color,
  active,
  extract_knowledge,
  clip_to_page_id,
  graph_folder_id,
  folder_sync_status,
  outlook_account_id
)
SELECT
  p.created_by,
  -- Use the page title as the label name; fall back to 'Smart Rule' if empty.
  -- Append a suffix if it would collide with an existing smart label name.
  CASE
    WHEN EXISTS (
      SELECT 1 FROM smart_labels sl
      WHERE sl.tenant_id = p.created_by
        AND sl.name = COALESCE(NULLIF(p.title, ''), 'Smart Rule')
    )
    THEN COALESCE(NULLIF(p.title, ''), 'Smart Rule') || ' (migrated)'
    ELSE COALESCE(NULLIF(p.title, ''), 'Smart Rule')
  END,
  p.smart_rule,
  COALESCE(p.color, '#6366F1'),
  p.smart_active,
  true,
  p.id,
  p.smart_rule_folder_id,
  CASE
    WHEN p.smart_rule_folder_id IS NOT NULL THEN 'synced'
    ELSE 'none'
  END,
  p.smart_rule_account_id
FROM pages p
WHERE p.smart_rule IS NOT NULL
  AND p.smart_rule <> ''
  -- Skip pages that already have a smart label pointing to them
  AND NOT EXISTS (
    SELECT 1 FROM smart_labels sl
    WHERE sl.clip_to_page_id = p.id
  );
