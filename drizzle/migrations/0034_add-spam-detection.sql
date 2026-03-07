-- Add spam detection columns to emails and gmail_emails tables

-- Add is_spam and unsubscribe_link columns to emails table
ALTER TABLE emails ADD COLUMN IF NOT EXISTS is_spam BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS unsubscribe_link TEXT;

-- Add is_spam and unsubscribe_link columns to gmail_emails table
ALTER TABLE gmail_emails ADD COLUMN IF NOT EXISTS is_spam BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE gmail_emails ADD COLUMN IF NOT EXISTS unsubscribe_link TEXT;

-- Add index for spam filtering on emails
CREATE INDEX IF NOT EXISTS idx_emails_is_spam ON emails (tenant_id, is_spam) WHERE is_spam = true;

-- Add index for spam filtering on gmail_emails
CREATE INDEX IF NOT EXISTS idx_gmail_emails_is_spam ON gmail_emails (tenant_id, is_spam) WHERE is_spam = true;
