-- Add email_id column to action_items table for cascade delete support
-- When an email is deleted, associated action items (and their cards) are also deleted.

ALTER TABLE action_items
  ADD COLUMN IF NOT EXISTS email_id integer;

-- Index for efficient cascade lookups
CREATE INDEX IF NOT EXISTS idx_action_items_email_id
  ON action_items (email_id)
  WHERE email_id IS NOT NULL;
