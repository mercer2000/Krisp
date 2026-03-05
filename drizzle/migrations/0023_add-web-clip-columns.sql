-- Add web clip columns to brain_thoughts
ALTER TABLE "brain_thoughts" ADD COLUMN IF NOT EXISTS "source_url" text;
ALTER TABLE "brain_thoughts" ADD COLUMN IF NOT EXISTS "source_domain" varchar(255);

CREATE INDEX IF NOT EXISTS "idx_brain_thoughts_source_url" ON "brain_thoughts" ("user_id", "source_url");
