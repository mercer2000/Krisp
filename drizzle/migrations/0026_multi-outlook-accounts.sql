-- Allow multiple Outlook accounts per tenant by changing unique constraint
-- from (tenant_id) to (tenant_id, outlook_email)
DROP INDEX IF EXISTS "uq_outlook_oauth_tenant";
CREATE UNIQUE INDEX IF NOT EXISTS "uq_outlook_oauth_tenant_email" ON "outlook_oauth_tokens" USING btree ("tenant_id", "outlook_email");
CREATE INDEX IF NOT EXISTS "idx_outlook_oauth_tenant" ON "outlook_oauth_tokens" USING btree ("tenant_id");
