-- Zoom user-managed OAuth tokens (mirrors outlook_oauth_tokens pattern)
CREATE TABLE IF NOT EXISTS zoom_user_oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  zoom_email VARCHAR(255) NOT NULL,
  zoom_user_id VARCHAR(255),
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMPTZ NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  sync_cursor TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, zoom_email)
);

-- Add zoom_account_id to existing zoom_chat_messages (nullable, links to user account)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'zoom_chat_messages') THEN
    ALTER TABLE zoom_chat_messages ADD COLUMN IF NOT EXISTS zoom_account_id UUID REFERENCES zoom_user_oauth_tokens(id);
  END IF;
END $$;

-- RLS policies for zoom_user_oauth_tokens
ALTER TABLE zoom_user_oauth_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY zoom_user_oauth_tokens_select ON zoom_user_oauth_tokens
  FOR SELECT TO authenticated
  USING (tenant_id = auth.user_id()::uuid);

CREATE POLICY zoom_user_oauth_tokens_insert ON zoom_user_oauth_tokens
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = auth.user_id()::uuid);

CREATE POLICY zoom_user_oauth_tokens_update ON zoom_user_oauth_tokens
  FOR UPDATE TO authenticated
  USING (tenant_id = auth.user_id()::uuid);

CREATE POLICY zoom_user_oauth_tokens_delete ON zoom_user_oauth_tokens
  FOR DELETE TO authenticated
  USING (tenant_id = auth.user_id()::uuid);
