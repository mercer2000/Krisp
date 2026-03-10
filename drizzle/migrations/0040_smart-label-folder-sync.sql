-- Add Outlook folder sync columns to smart_labels
ALTER TABLE smart_labels
  ADD COLUMN graph_folder_id VARCHAR(255),
  ADD COLUMN folder_sync_status VARCHAR(20) NOT NULL DEFAULT 'none',
  ADD COLUMN outlook_account_id UUID REFERENCES outlook_oauth_tokens(id) ON DELETE SET NULL;

CREATE INDEX idx_smart_labels_folder_sync ON smart_labels (folder_sync_status);

-- Folder move queue for retry logic on Outlook folder moves
CREATE TABLE folder_move_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES smart_labels(id) ON DELETE CASCADE,
  email_id VARCHAR(255) NOT NULL,
  graph_message_id VARCHAR(512) NOT NULL,
  graph_folder_id VARCHAR(255) NOT NULL,
  outlook_account_id UUID NOT NULL REFERENCES outlook_oauth_tokens(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  next_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fmq_tenant ON folder_move_queue (tenant_id);
CREATE INDEX idx_fmq_status_retry ON folder_move_queue (status, next_retry_at);
CREATE INDEX idx_fmq_label ON folder_move_queue (label_id);
CREATE UNIQUE INDEX uq_fmq_email_label ON folder_move_queue (email_id, label_id);

-- RLS policies for folder_move_queue
ALTER TABLE folder_move_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY folder_move_queue_auth_select ON folder_move_queue
  FOR SELECT TO authenticated
  USING (tenant_id = (SELECT auth.user_id()::uuid));

CREATE POLICY folder_move_queue_auth_insert ON folder_move_queue
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT auth.user_id()::uuid));

CREATE POLICY folder_move_queue_auth_update ON folder_move_queue
  FOR UPDATE TO authenticated
  USING (tenant_id = (SELECT auth.user_id()::uuid))
  WITH CHECK (tenant_id = (SELECT auth.user_id()::uuid));

CREATE POLICY folder_move_queue_auth_delete ON folder_move_queue
  FOR DELETE TO authenticated
  USING (tenant_id = (SELECT auth.user_id()::uuid));
