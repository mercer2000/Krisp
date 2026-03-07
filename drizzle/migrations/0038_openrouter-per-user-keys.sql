-- Add per-user OpenRouter API key columns to users table
-- openrouter_api_key: encrypted API key (only returned at creation, stored encrypted)
-- openrouter_key_hash: hash from OpenRouter for key management (update/delete)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "openrouter_api_key" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "openrouter_key_hash" varchar(255);
