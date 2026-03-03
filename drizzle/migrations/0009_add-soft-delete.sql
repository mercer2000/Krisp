-- Add deleted_at column for soft deletion to cards, action_items, webhook_key_points, and emails
ALTER TABLE "cards" ADD COLUMN "deleted_at" timestamp with time zone;
ALTER TABLE "action_items" ADD COLUMN "deleted_at" timestamp with time zone;
ALTER TABLE "webhook_key_points" ADD COLUMN "deleted_at" timestamp with time zone;
ALTER TABLE "emails" ADD COLUMN "deleted_at" timestamp with time zone;

-- Index for efficient trash queries (find soft-deleted items)
CREATE INDEX "idx_cards_deleted_at" ON "cards" ("deleted_at") WHERE "deleted_at" IS NOT NULL;
CREATE INDEX "idx_action_items_deleted_at" ON "action_items" ("deleted_at") WHERE "deleted_at" IS NOT NULL;
CREATE INDEX "idx_webhook_key_points_deleted_at" ON "webhook_key_points" ("deleted_at") WHERE "deleted_at" IS NOT NULL;
CREATE INDEX "idx_emails_deleted_at" ON "emails" ("deleted_at") WHERE "deleted_at" IS NOT NULL;
