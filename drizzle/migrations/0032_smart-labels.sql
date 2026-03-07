-- Smart Labels: AI-Powered Prompt-Driven Label Engine
-- Users define natural-language rules; AI classifies items against them.

CREATE TABLE IF NOT EXISTS smart_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  prompt TEXT NOT NULL,
  color VARCHAR(7) NOT NULL DEFAULT '#6366F1',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_smart_labels_tenant_name UNIQUE (tenant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_smart_labels_tenant ON smart_labels(tenant_id);

-- Junction table linking smart labels to any item type
CREATE TABLE IF NOT EXISTS smart_label_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label_id UUID NOT NULL REFERENCES smart_labels(id) ON DELETE CASCADE,
  item_type VARCHAR(30) NOT NULL,  -- 'email', 'card', 'action_item', 'meeting'
  item_id VARCHAR(255) NOT NULL,   -- polymorphic ID (cast to string)
  confidence INTEGER,              -- 0-100 AI confidence
  assigned_by VARCHAR(20) NOT NULL DEFAULT 'ai',  -- 'ai' | 'manual'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_smart_label_item UNIQUE (label_id, item_type, item_id)
);

CREATE INDEX IF NOT EXISTS idx_smart_label_items_label ON smart_label_items(label_id);
CREATE INDEX IF NOT EXISTS idx_smart_label_items_item ON smart_label_items(item_type, item_id);

-- ── RLS Policies ────────────────────────────────────────

ALTER TABLE smart_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_label_items ENABLE ROW LEVEL SECURITY;

-- smart_labels: direct tenant_id ownership
CREATE POLICY smart_labels_auth_select ON smart_labels FOR SELECT TO authenticated
  USING (tenant_id = (SELECT auth.user_id()::uuid));
CREATE POLICY smart_labels_auth_insert ON smart_labels FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT auth.user_id()::uuid));
CREATE POLICY smart_labels_auth_update ON smart_labels FOR UPDATE TO authenticated
  USING (tenant_id = (SELECT auth.user_id()::uuid))
  WITH CHECK (tenant_id = (SELECT auth.user_id()::uuid));
CREATE POLICY smart_labels_auth_delete ON smart_labels FOR DELETE TO authenticated
  USING (tenant_id = (SELECT auth.user_id()::uuid));

-- smart_label_items: access through parent smart_labels
CREATE POLICY smart_label_items_auth_select ON smart_label_items FOR SELECT TO authenticated
  USING (label_id IN (SELECT id FROM smart_labels WHERE tenant_id = (SELECT auth.user_id()::uuid)));
CREATE POLICY smart_label_items_auth_insert ON smart_label_items FOR INSERT TO authenticated
  WITH CHECK (label_id IN (SELECT id FROM smart_labels WHERE tenant_id = (SELECT auth.user_id()::uuid)));
CREATE POLICY smart_label_items_auth_update ON smart_label_items FOR UPDATE TO authenticated
  USING (label_id IN (SELECT id FROM smart_labels WHERE tenant_id = (SELECT auth.user_id()::uuid)))
  WITH CHECK (label_id IN (SELECT id FROM smart_labels WHERE tenant_id = (SELECT auth.user_id()::uuid)));
CREATE POLICY smart_label_items_auth_delete ON smart_label_items FOR DELETE TO authenticated
  USING (label_id IN (SELECT id FROM smart_labels WHERE tenant_id = (SELECT auth.user_id()::uuid)));
