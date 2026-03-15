-- Add is_pinned column to smart_labels (default true so new labels are pinned)
ALTER TABLE smart_labels ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT true;
