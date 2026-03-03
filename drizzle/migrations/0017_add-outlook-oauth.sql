CREATE TABLE IF NOT EXISTS "outlook_oauth_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "outlook_email" varchar(320) NOT NULL,
  "access_token" text NOT NULL,
  "refresh_token" text NOT NULL,
  "token_expiry" timestamp with time zone NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "last_sync_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_outlook_oauth_tenant" ON "outlook_oauth_tokens" USING btree ("tenant_id");
