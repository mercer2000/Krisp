-- Add newsletter detection columns and whitelist table

-- Add is_newsletter column to emails table
ALTER TABLE emails ADD COLUMN IF NOT EXISTS is_newsletter BOOLEAN NOT NULL DEFAULT false;

-- Add is_newsletter column to gmail_emails table
ALTER TABLE gmail_emails ADD COLUMN IF NOT EXISTS is_newsletter BOOLEAN NOT NULL DEFAULT false;

-- Create newsletter whitelist table
CREATE TABLE IF NOT EXISTS newsletter_whitelist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_email VARCHAR(512) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add unique index for tenant + sender
CREATE UNIQUE INDEX IF NOT EXISTS uq_newsletter_whitelist_tenant_sender
  ON newsletter_whitelist (tenant_id, sender_email);

-- Add tenant index for faster lookups
CREATE INDEX IF NOT EXISTS idx_newsletter_whitelist_tenant
  ON newsletter_whitelist (tenant_id);

-- Add RLS policies for newsletter_whitelist
ALTER TABLE newsletter_whitelist ENABLE ROW LEVEL SECURITY;

CREATE POLICY newsletter_whitelist_auth_select ON newsletter_whitelist
  FOR SELECT TO authenticated
  USING (tenant_id = (SELECT auth.user_id()::uuid));

CREATE POLICY newsletter_whitelist_auth_insert ON newsletter_whitelist
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT auth.user_id()::uuid));

CREATE POLICY newsletter_whitelist_auth_update ON newsletter_whitelist
  FOR UPDATE TO authenticated
  USING (tenant_id = (SELECT auth.user_id()::uuid))
  WITH CHECK (tenant_id = (SELECT auth.user_id()::uuid));

CREATE POLICY newsletter_whitelist_auth_delete ON newsletter_whitelist
  FOR DELETE TO authenticated
  USING (tenant_id = (SELECT auth.user_id()::uuid));
