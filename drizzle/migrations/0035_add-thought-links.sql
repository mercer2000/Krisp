-- Thought Links: link brain thoughts to cards, meetings, or emails
CREATE TABLE IF NOT EXISTS "thought_links" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "thought_id" uuid NOT NULL REFERENCES "brain_thoughts"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "linked_entity_type" varchar(30) NOT NULL,
  "linked_entity_id" varchar(255) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "uq_thought_link"
  ON "thought_links" ("thought_id", "linked_entity_type", "linked_entity_id");
CREATE INDEX IF NOT EXISTS "idx_thought_links_thought" ON "thought_links" ("thought_id");
CREATE INDEX IF NOT EXISTS "idx_thought_links_user" ON "thought_links" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_thought_links_entity" ON "thought_links" ("linked_entity_type", "linked_entity_id");

-- RLS
ALTER TABLE "thought_links" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "thought_links_crud_read"
  ON "thought_links" FOR SELECT TO "authenticated"
  USING ((select auth.user_id()::uuid) = user_id);

CREATE POLICY "thought_links_crud_insert"
  ON "thought_links" FOR INSERT TO "authenticated"
  WITH CHECK ((select auth.user_id()::uuid) = user_id);

CREATE POLICY "thought_links_crud_update"
  ON "thought_links" FOR UPDATE TO "authenticated"
  USING ((select auth.user_id()::uuid) = user_id)
  WITH CHECK ((select auth.user_id()::uuid) = user_id);

CREATE POLICY "thought_links_crud_delete"
  ON "thought_links" FOR DELETE TO "authenticated"
  USING ((select auth.user_id()::uuid) = user_id);
