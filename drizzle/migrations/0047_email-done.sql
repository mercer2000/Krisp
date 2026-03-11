-- Add is_done column for email triage ("Done" action)
ALTER TABLE emails ADD COLUMN IF NOT EXISTS is_done BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_emails_is_done ON emails (tenant_id, is_done) WHERE is_done = true;

ALTER TABLE gmail_emails ADD COLUMN IF NOT EXISTS is_done BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_gmail_emails_is_done ON gmail_emails (tenant_id, is_done) WHERE is_done = true;
