-- Google OAuth Tokens table for Google Calendar integration
CREATE TABLE IF NOT EXISTS "google_oauth_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "google_email" varchar(320) NOT NULL,
  "access_token" text NOT NULL,
  "refresh_token" text NOT NULL,
  "token_expiry" timestamp with time zone NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "last_sync_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Unique constraint for multi-account support per tenant
CREATE UNIQUE INDEX IF NOT EXISTS "uq_google_oauth_tenant_email"
  ON "google_oauth_tokens" ("tenant_id", "google_email");

-- Index for tenant lookups
CREATE INDEX IF NOT EXISTS "idx_google_oauth_tenant"
  ON "google_oauth_tokens" ("tenant_id");

-- Enable RLS
ALTER TABLE "google_oauth_tokens" ENABLE ROW LEVEL SECURITY;

-- RLS policies for authenticated role
CREATE POLICY "crud_authenticated_policy_select"
  ON "google_oauth_tokens"
  AS PERMISSIVE FOR SELECT
  TO "authenticated"
  USING ((select auth.user_id()::uuid = "google_oauth_tokens"."tenant_id"));

CREATE POLICY "crud_authenticated_policy_insert"
  ON "google_oauth_tokens"
  AS PERMISSIVE FOR INSERT
  TO "authenticated"
  WITH CHECK ((select auth.user_id()::uuid = "google_oauth_tokens"."tenant_id"));

CREATE POLICY "crud_authenticated_policy_update"
  ON "google_oauth_tokens"
  AS PERMISSIVE FOR UPDATE
  TO "authenticated"
  USING ((select auth.user_id()::uuid = "google_oauth_tokens"."tenant_id"));

CREATE POLICY "crud_authenticated_policy_delete"
  ON "google_oauth_tokens"
  AS PERMISSIVE FOR DELETE
  TO "authenticated"
  USING ((select auth.user_id()::uuid = "google_oauth_tokens"."tenant_id"));
