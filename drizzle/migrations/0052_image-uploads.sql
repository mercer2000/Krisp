CREATE TABLE "uploads" (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "tenant_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "filename" varchar(512) NOT NULL,
  "content_type" varchar(100) NOT NULL,
  "size_bytes" integer NOT NULL,
  "blob_url" text NOT NULL,
  "source" varchar(50) NOT NULL,
  "source_id" varchar(255),
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX "idx_uploads_tenant" ON "uploads" ("tenant_id");

ALTER TABLE "uploads" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "uploads_crud_read" ON "uploads"
  FOR SELECT TO "authenticated"
  USING ((select auth.user_id()::uuid = tenant_id));

CREATE POLICY "uploads_crud_insert" ON "uploads"
  FOR INSERT TO "authenticated"
  WITH CHECK ((select auth.user_id()::uuid = tenant_id));

CREATE POLICY "uploads_crud_update" ON "uploads"
  FOR UPDATE TO "authenticated"
  USING ((select auth.user_id()::uuid = tenant_id));

CREATE POLICY "uploads_crud_delete" ON "uploads"
  FOR DELETE TO "authenticated"
  USING ((select auth.user_id()::uuid = tenant_id));
