-- Add extraction_source column to action_items to distinguish auto vs manual extraction
ALTER TABLE "action_items" ADD COLUMN "extraction_source" varchar(50) DEFAULT 'manual' NOT NULL;

-- Add index for efficient querying by extraction source
CREATE INDEX "idx_action_items_extraction_source" ON "action_items" ("extraction_source");

-- Add composite index for meeting deduplication checks
CREATE INDEX "idx_action_items_meeting_user" ON "action_items" ("meeting_id", "user_id") WHERE "deleted_at" IS NULL;
