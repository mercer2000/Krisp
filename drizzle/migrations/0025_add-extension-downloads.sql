CREATE TABLE IF NOT EXISTS "extension_downloads" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "version" varchar(20) NOT NULL,
  "downloaded_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_extension_downloads_user" ON "extension_downloads" ("user_id");
