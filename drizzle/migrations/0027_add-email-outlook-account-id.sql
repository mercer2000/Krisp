-- Add outlook_account_id to emails table to track which connected account each email came from
ALTER TABLE "emails" ADD COLUMN "outlook_account_id" uuid REFERENCES "outlook_oauth_tokens"("id") ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS "idx_emails_outlook_account" ON "emails" USING btree ("outlook_account_id");
