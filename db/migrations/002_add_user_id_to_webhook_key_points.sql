-- Migration: Add user_id column to webhook_key_points for multi-tenant support
-- Description: Associates each webhook record with a specific user

-- Add user_id column (nullable first for existing data)
ALTER TABLE webhook_key_points
ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- If there are existing rows and a known user, update them here:
-- UPDATE webhook_key_points SET user_id = '<your-user-uuid>' WHERE user_id IS NULL;

-- Once existing data is backfilled, make the column NOT NULL
-- ALTER TABLE webhook_key_points ALTER COLUMN user_id SET NOT NULL;

-- Index for efficient per-user queries
CREATE INDEX IF NOT EXISTS idx_webhook_key_points_user_id ON webhook_key_points(user_id);

-- Composite index for common filtered queries
CREATE INDEX IF NOT EXISTS idx_webhook_key_points_user_received ON webhook_key_points(user_id, received_at DESC);
