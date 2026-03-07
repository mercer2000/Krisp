-- Enable Row Level Security on all user-scoped tables
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "boards" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "columns" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "cards" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "card_tags" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "decisions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "action_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "webhook_key_points" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "gmail_emails" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "gmail_watch_subscriptions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "webhook_secrets" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "graph_credentials" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "graph_subscriptions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "emails" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "email_labels" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "email_label_assignments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "calendar_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "calendar_sync_state" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "outlook_oauth_tokens" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "zoom_oauth_tokens" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "zoom_chat_messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "brain_chat_sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "brain_chat_messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "weekly_reviews" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "workspaces" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "pages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "blocks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "database_rows" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "telegram_bot_tokens" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "outbound_webhooks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "outbound_webhook_deliveries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "brain_thoughts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "zapier_ingest_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "custom_prompts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "custom_prompt_history" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "extension_downloads" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

-- ── Users (auth.user_id()::uuid = id) ──
CREATE POLICY "crud-authenticated-policy-select" ON "users" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "users"."id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "users" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "users"."id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "users" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "users"."id")) WITH CHECK ((select auth.user_id()::uuid = "users"."id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "users" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "users"."id"));--> statement-breakpoint

-- ── Boards (auth.user_id()::uuid = user_id) ──
CREATE POLICY "crud-authenticated-policy-select" ON "boards" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "boards"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "boards" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "boards"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "boards" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "boards"."user_id")) WITH CHECK ((select auth.user_id()::uuid = "boards"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "boards" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "boards"."user_id"));--> statement-breakpoint

-- ── Columns (subquery via boards.user_id) ──
CREATE POLICY "columns_auth_select" ON "columns" AS PERMISSIVE FOR SELECT TO "authenticated" USING (board_id IN (SELECT id FROM boards WHERE user_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "columns_auth_insert" ON "columns" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (board_id IN (SELECT id FROM boards WHERE user_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "columns_auth_update" ON "columns" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (board_id IN (SELECT id FROM boards WHERE user_id = (select auth.user_id()::uuid))) WITH CHECK (board_id IN (SELECT id FROM boards WHERE user_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "columns_auth_delete" ON "columns" AS PERMISSIVE FOR DELETE TO "authenticated" USING (board_id IN (SELECT id FROM boards WHERE user_id = (select auth.user_id()::uuid)));--> statement-breakpoint

-- ── Cards (subquery via columns → boards.user_id) ──
CREATE POLICY "cards_auth_select" ON "cards" AS PERMISSIVE FOR SELECT TO "authenticated" USING (column_id IN (SELECT c.id FROM columns c JOIN boards b ON c.board_id = b.id WHERE b.user_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "cards_auth_insert" ON "cards" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (column_id IN (SELECT c.id FROM columns c JOIN boards b ON c.board_id = b.id WHERE b.user_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "cards_auth_update" ON "cards" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (column_id IN (SELECT c.id FROM columns c JOIN boards b ON c.board_id = b.id WHERE b.user_id = (select auth.user_id()::uuid))) WITH CHECK (column_id IN (SELECT c.id FROM columns c JOIN boards b ON c.board_id = b.id WHERE b.user_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "cards_auth_delete" ON "cards" AS PERMISSIVE FOR DELETE TO "authenticated" USING (column_id IN (SELECT c.id FROM columns c JOIN boards b ON c.board_id = b.id WHERE b.user_id = (select auth.user_id()::uuid)));--> statement-breakpoint

-- ── Card Tags (subquery via cards → columns → boards.user_id) ──
CREATE POLICY "card_tags_auth_select" ON "card_tags" AS PERMISSIVE FOR SELECT TO "authenticated" USING (card_id IN (SELECT ca.id FROM cards ca JOIN columns co ON ca.column_id = co.id JOIN boards b ON co.board_id = b.id WHERE b.user_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "card_tags_auth_insert" ON "card_tags" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (card_id IN (SELECT ca.id FROM cards ca JOIN columns co ON ca.column_id = co.id JOIN boards b ON co.board_id = b.id WHERE b.user_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "card_tags_auth_update" ON "card_tags" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (card_id IN (SELECT ca.id FROM cards ca JOIN columns co ON ca.column_id = co.id JOIN boards b ON co.board_id = b.id WHERE b.user_id = (select auth.user_id()::uuid))) WITH CHECK (card_id IN (SELECT ca.id FROM cards ca JOIN columns co ON ca.column_id = co.id JOIN boards b ON co.board_id = b.id WHERE b.user_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "card_tags_auth_delete" ON "card_tags" AS PERMISSIVE FOR DELETE TO "authenticated" USING (card_id IN (SELECT ca.id FROM cards ca JOIN columns co ON ca.column_id = co.id JOIN boards b ON co.board_id = b.id WHERE b.user_id = (select auth.user_id()::uuid)));--> statement-breakpoint

-- ── Decisions (auth.user_id()::uuid = user_id) ──
CREATE POLICY "crud-authenticated-policy-select" ON "decisions" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "decisions"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "decisions" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "decisions"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "decisions" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "decisions"."user_id")) WITH CHECK ((select auth.user_id()::uuid = "decisions"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "decisions" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "decisions"."user_id"));--> statement-breakpoint

-- ── Action Items (auth.user_id()::uuid = user_id) ──
CREATE POLICY "crud-authenticated-policy-select" ON "action_items" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "action_items"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "action_items" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "action_items"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "action_items" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "action_items"."user_id")) WITH CHECK ((select auth.user_id()::uuid = "action_items"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "action_items" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "action_items"."user_id"));--> statement-breakpoint

-- ── Webhook Key Points (auth.user_id()::uuid = user_id) ──
CREATE POLICY "crud-authenticated-policy-select" ON "webhook_key_points" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "webhook_key_points"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "webhook_key_points" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "webhook_key_points"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "webhook_key_points" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "webhook_key_points"."user_id")) WITH CHECK ((select auth.user_id()::uuid = "webhook_key_points"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "webhook_key_points" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "webhook_key_points"."user_id"));--> statement-breakpoint

-- ── Password Reset Tokens (auth.user_id()::uuid = user_id) ──
CREATE POLICY "crud-authenticated-policy-select" ON "password_reset_tokens" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "password_reset_tokens"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "password_reset_tokens" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "password_reset_tokens"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "password_reset_tokens" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "password_reset_tokens"."user_id")) WITH CHECK ((select auth.user_id()::uuid = "password_reset_tokens"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "password_reset_tokens" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "password_reset_tokens"."user_id"));--> statement-breakpoint

-- ── Gmail Emails (auth.user_id()::uuid = tenant_id) ──
CREATE POLICY "crud-authenticated-policy-select" ON "gmail_emails" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "gmail_emails"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "gmail_emails" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "gmail_emails"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "gmail_emails" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "gmail_emails"."tenant_id")) WITH CHECK ((select auth.user_id()::uuid = "gmail_emails"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "gmail_emails" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "gmail_emails"."tenant_id"));--> statement-breakpoint

-- ── Gmail Watch Subscriptions (auth.user_id()::uuid = tenant_id) ──
CREATE POLICY "crud-authenticated-policy-select" ON "gmail_watch_subscriptions" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "gmail_watch_subscriptions"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "gmail_watch_subscriptions" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "gmail_watch_subscriptions"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "gmail_watch_subscriptions" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "gmail_watch_subscriptions"."tenant_id")) WITH CHECK ((select auth.user_id()::uuid = "gmail_watch_subscriptions"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "gmail_watch_subscriptions" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "gmail_watch_subscriptions"."tenant_id"));--> statement-breakpoint

-- ── Webhook Secrets (auth.user_id()::uuid = user_id) ──
CREATE POLICY "crud-authenticated-policy-select" ON "webhook_secrets" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "webhook_secrets"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "webhook_secrets" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "webhook_secrets"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "webhook_secrets" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "webhook_secrets"."user_id")) WITH CHECK ((select auth.user_id()::uuid = "webhook_secrets"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "webhook_secrets" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "webhook_secrets"."user_id"));--> statement-breakpoint

-- ── Graph Credentials (auth.user_id()::uuid = tenant_id) ──
CREATE POLICY "crud-authenticated-policy-select" ON "graph_credentials" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "graph_credentials"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "graph_credentials" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "graph_credentials"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "graph_credentials" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "graph_credentials"."tenant_id")) WITH CHECK ((select auth.user_id()::uuid = "graph_credentials"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "graph_credentials" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "graph_credentials"."tenant_id"));--> statement-breakpoint

-- ── Graph Subscriptions (auth.user_id()::uuid = tenant_id) ──
CREATE POLICY "crud-authenticated-policy-select" ON "graph_subscriptions" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "graph_subscriptions"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "graph_subscriptions" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "graph_subscriptions"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "graph_subscriptions" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "graph_subscriptions"."tenant_id")) WITH CHECK ((select auth.user_id()::uuid = "graph_subscriptions"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "graph_subscriptions" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "graph_subscriptions"."tenant_id"));--> statement-breakpoint

-- ── Emails (auth.user_id()::uuid = tenant_id) ──
CREATE POLICY "crud-authenticated-policy-select" ON "emails" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "emails"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "emails" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "emails"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "emails" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "emails"."tenant_id")) WITH CHECK ((select auth.user_id()::uuid = "emails"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "emails" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "emails"."tenant_id"));--> statement-breakpoint

-- ── Email Labels (auth.user_id()::uuid = tenant_id) ──
CREATE POLICY "crud-authenticated-policy-select" ON "email_labels" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "email_labels"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "email_labels" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "email_labels"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "email_labels" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "email_labels"."tenant_id")) WITH CHECK ((select auth.user_id()::uuid = "email_labels"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "email_labels" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "email_labels"."tenant_id"));--> statement-breakpoint

-- ── Email Label Assignments (subquery via emails.tenant_id) ──
CREATE POLICY "email_label_assignments_auth_select" ON "email_label_assignments" AS PERMISSIVE FOR SELECT TO "authenticated" USING (email_id IN (SELECT id FROM emails WHERE tenant_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "email_label_assignments_auth_insert" ON "email_label_assignments" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (email_id IN (SELECT id FROM emails WHERE tenant_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "email_label_assignments_auth_update" ON "email_label_assignments" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (email_id IN (SELECT id FROM emails WHERE tenant_id = (select auth.user_id()::uuid))) WITH CHECK (email_id IN (SELECT id FROM emails WHERE tenant_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "email_label_assignments_auth_delete" ON "email_label_assignments" AS PERMISSIVE FOR DELETE TO "authenticated" USING (email_id IN (SELECT id FROM emails WHERE tenant_id = (select auth.user_id()::uuid)));--> statement-breakpoint

-- ── Calendar Events (auth.user_id()::uuid = tenant_id) ──
CREATE POLICY "crud-authenticated-policy-select" ON "calendar_events" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "calendar_events"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "calendar_events" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "calendar_events"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "calendar_events" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "calendar_events"."tenant_id")) WITH CHECK ((select auth.user_id()::uuid = "calendar_events"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "calendar_events" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "calendar_events"."tenant_id"));--> statement-breakpoint

-- ── Calendar Sync State (auth.user_id()::uuid = tenant_id) ──
CREATE POLICY "crud-authenticated-policy-select" ON "calendar_sync_state" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "calendar_sync_state"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "calendar_sync_state" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "calendar_sync_state"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "calendar_sync_state" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "calendar_sync_state"."tenant_id")) WITH CHECK ((select auth.user_id()::uuid = "calendar_sync_state"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "calendar_sync_state" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "calendar_sync_state"."tenant_id"));--> statement-breakpoint

-- ── Outlook OAuth Tokens (auth.user_id()::uuid = tenant_id) ──
CREATE POLICY "crud-authenticated-policy-select" ON "outlook_oauth_tokens" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "outlook_oauth_tokens"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "outlook_oauth_tokens" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "outlook_oauth_tokens"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "outlook_oauth_tokens" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "outlook_oauth_tokens"."tenant_id")) WITH CHECK ((select auth.user_id()::uuid = "outlook_oauth_tokens"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "outlook_oauth_tokens" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "outlook_oauth_tokens"."tenant_id"));--> statement-breakpoint

-- ── Zoom OAuth Tokens (auth.user_id()::uuid = tenant_id) ──
CREATE POLICY "crud-authenticated-policy-select" ON "zoom_oauth_tokens" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "zoom_oauth_tokens"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "zoom_oauth_tokens" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "zoom_oauth_tokens"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "zoom_oauth_tokens" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "zoom_oauth_tokens"."tenant_id")) WITH CHECK ((select auth.user_id()::uuid = "zoom_oauth_tokens"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "zoom_oauth_tokens" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "zoom_oauth_tokens"."tenant_id"));--> statement-breakpoint

-- ── Zoom Chat Messages (auth.user_id()::uuid = tenant_id) ──
CREATE POLICY "crud-authenticated-policy-select" ON "zoom_chat_messages" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "zoom_chat_messages"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "zoom_chat_messages" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "zoom_chat_messages"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "zoom_chat_messages" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "zoom_chat_messages"."tenant_id")) WITH CHECK ((select auth.user_id()::uuid = "zoom_chat_messages"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "zoom_chat_messages" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "zoom_chat_messages"."tenant_id"));--> statement-breakpoint

-- ── Brain Chat Sessions (auth.user_id()::uuid = user_id) ──
CREATE POLICY "crud-authenticated-policy-select" ON "brain_chat_sessions" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "brain_chat_sessions"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "brain_chat_sessions" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "brain_chat_sessions"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "brain_chat_sessions" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "brain_chat_sessions"."user_id")) WITH CHECK ((select auth.user_id()::uuid = "brain_chat_sessions"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "brain_chat_sessions" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "brain_chat_sessions"."user_id"));--> statement-breakpoint

-- ── Brain Chat Messages (subquery via brain_chat_sessions.user_id) ──
CREATE POLICY "brain_chat_messages_auth_select" ON "brain_chat_messages" AS PERMISSIVE FOR SELECT TO "authenticated" USING (session_id IN (SELECT id FROM brain_chat_sessions WHERE user_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "brain_chat_messages_auth_insert" ON "brain_chat_messages" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (session_id IN (SELECT id FROM brain_chat_sessions WHERE user_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "brain_chat_messages_auth_update" ON "brain_chat_messages" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (session_id IN (SELECT id FROM brain_chat_sessions WHERE user_id = (select auth.user_id()::uuid))) WITH CHECK (session_id IN (SELECT id FROM brain_chat_sessions WHERE user_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "brain_chat_messages_auth_delete" ON "brain_chat_messages" AS PERMISSIVE FOR DELETE TO "authenticated" USING (session_id IN (SELECT id FROM brain_chat_sessions WHERE user_id = (select auth.user_id()::uuid)));--> statement-breakpoint

-- ── Weekly Reviews (auth.user_id()::uuid = user_id) ──
CREATE POLICY "crud-authenticated-policy-select" ON "weekly_reviews" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "weekly_reviews"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "weekly_reviews" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "weekly_reviews"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "weekly_reviews" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "weekly_reviews"."user_id")) WITH CHECK ((select auth.user_id()::uuid = "weekly_reviews"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "weekly_reviews" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "weekly_reviews"."user_id"));--> statement-breakpoint

-- ── Workspaces (auth.user_id()::uuid = owner_id) ──
CREATE POLICY "crud-authenticated-policy-select" ON "workspaces" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "workspaces"."owner_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "workspaces" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "workspaces"."owner_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "workspaces" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "workspaces"."owner_id")) WITH CHECK ((select auth.user_id()::uuid = "workspaces"."owner_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "workspaces" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "workspaces"."owner_id"));--> statement-breakpoint

-- ── Pages (subquery via workspaces.owner_id) ──
CREATE POLICY "pages_auth_select" ON "pages" AS PERMISSIVE FOR SELECT TO "authenticated" USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "pages_auth_insert" ON "pages" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (workspace_id IN (SELECT id FROM workspaces WHERE owner_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "pages_auth_update" ON "pages" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_id = (select auth.user_id()::uuid))) WITH CHECK (workspace_id IN (SELECT id FROM workspaces WHERE owner_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "pages_auth_delete" ON "pages" AS PERMISSIVE FOR DELETE TO "authenticated" USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_id = (select auth.user_id()::uuid)));--> statement-breakpoint

-- ── Blocks (subquery via pages → workspaces.owner_id) ──
CREATE POLICY "blocks_auth_select" ON "blocks" AS PERMISSIVE FOR SELECT TO "authenticated" USING (page_id IN (SELECT p.id FROM pages p JOIN workspaces w ON p.workspace_id = w.id WHERE w.owner_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "blocks_auth_insert" ON "blocks" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (page_id IN (SELECT p.id FROM pages p JOIN workspaces w ON p.workspace_id = w.id WHERE w.owner_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "blocks_auth_update" ON "blocks" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (page_id IN (SELECT p.id FROM pages p JOIN workspaces w ON p.workspace_id = w.id WHERE w.owner_id = (select auth.user_id()::uuid))) WITH CHECK (page_id IN (SELECT p.id FROM pages p JOIN workspaces w ON p.workspace_id = w.id WHERE w.owner_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "blocks_auth_delete" ON "blocks" AS PERMISSIVE FOR DELETE TO "authenticated" USING (page_id IN (SELECT p.id FROM pages p JOIN workspaces w ON p.workspace_id = w.id WHERE w.owner_id = (select auth.user_id()::uuid)));--> statement-breakpoint

-- ── Database Rows (subquery via pages → workspaces.owner_id) ──
CREATE POLICY "database_rows_auth_select" ON "database_rows" AS PERMISSIVE FOR SELECT TO "authenticated" USING (database_page_id IN (SELECT p.id FROM pages p JOIN workspaces w ON p.workspace_id = w.id WHERE w.owner_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "database_rows_auth_insert" ON "database_rows" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (database_page_id IN (SELECT p.id FROM pages p JOIN workspaces w ON p.workspace_id = w.id WHERE w.owner_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "database_rows_auth_update" ON "database_rows" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (database_page_id IN (SELECT p.id FROM pages p JOIN workspaces w ON p.workspace_id = w.id WHERE w.owner_id = (select auth.user_id()::uuid))) WITH CHECK (database_page_id IN (SELECT p.id FROM pages p JOIN workspaces w ON p.workspace_id = w.id WHERE w.owner_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "database_rows_auth_delete" ON "database_rows" AS PERMISSIVE FOR DELETE TO "authenticated" USING (database_page_id IN (SELECT p.id FROM pages p JOIN workspaces w ON p.workspace_id = w.id WHERE w.owner_id = (select auth.user_id()::uuid)));--> statement-breakpoint

-- ── Telegram Bot Tokens (auth.user_id()::uuid = user_id) ──
CREATE POLICY "crud-authenticated-policy-select" ON "telegram_bot_tokens" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "telegram_bot_tokens"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "telegram_bot_tokens" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "telegram_bot_tokens"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "telegram_bot_tokens" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "telegram_bot_tokens"."user_id")) WITH CHECK ((select auth.user_id()::uuid = "telegram_bot_tokens"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "telegram_bot_tokens" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "telegram_bot_tokens"."user_id"));--> statement-breakpoint

-- ── Outbound Webhooks (auth.user_id()::uuid = user_id) ──
CREATE POLICY "crud-authenticated-policy-select" ON "outbound_webhooks" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "outbound_webhooks"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "outbound_webhooks" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "outbound_webhooks"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "outbound_webhooks" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "outbound_webhooks"."user_id")) WITH CHECK ((select auth.user_id()::uuid = "outbound_webhooks"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "outbound_webhooks" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "outbound_webhooks"."user_id"));--> statement-breakpoint

-- ── Outbound Webhook Deliveries (subquery via outbound_webhooks.user_id) ──
CREATE POLICY "outbound_webhook_deliveries_auth_select" ON "outbound_webhook_deliveries" AS PERMISSIVE FOR SELECT TO "authenticated" USING (webhook_id IN (SELECT id FROM outbound_webhooks WHERE user_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "outbound_webhook_deliveries_auth_insert" ON "outbound_webhook_deliveries" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (webhook_id IN (SELECT id FROM outbound_webhooks WHERE user_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "outbound_webhook_deliveries_auth_update" ON "outbound_webhook_deliveries" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (webhook_id IN (SELECT id FROM outbound_webhooks WHERE user_id = (select auth.user_id()::uuid))) WITH CHECK (webhook_id IN (SELECT id FROM outbound_webhooks WHERE user_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "outbound_webhook_deliveries_auth_delete" ON "outbound_webhook_deliveries" AS PERMISSIVE FOR DELETE TO "authenticated" USING (webhook_id IN (SELECT id FROM outbound_webhooks WHERE user_id = (select auth.user_id()::uuid)));--> statement-breakpoint

-- ── Brain Thoughts (auth.user_id()::uuid = user_id) ──
CREATE POLICY "crud-authenticated-policy-select" ON "brain_thoughts" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "brain_thoughts"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "brain_thoughts" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "brain_thoughts"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "brain_thoughts" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "brain_thoughts"."user_id")) WITH CHECK ((select auth.user_id()::uuid = "brain_thoughts"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "brain_thoughts" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "brain_thoughts"."user_id"));--> statement-breakpoint

-- ── Zapier Ingest Logs (auth.user_id()::uuid = user_id) ──
CREATE POLICY "crud-authenticated-policy-select" ON "zapier_ingest_logs" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "zapier_ingest_logs"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "zapier_ingest_logs" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "zapier_ingest_logs"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "zapier_ingest_logs" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "zapier_ingest_logs"."user_id")) WITH CHECK ((select auth.user_id()::uuid = "zapier_ingest_logs"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "zapier_ingest_logs" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "zapier_ingest_logs"."user_id"));--> statement-breakpoint

-- ── Custom Prompts (auth.user_id()::uuid = user_id) ──
CREATE POLICY "crud-authenticated-policy-select" ON "custom_prompts" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "custom_prompts"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "custom_prompts" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "custom_prompts"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "custom_prompts" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "custom_prompts"."user_id")) WITH CHECK ((select auth.user_id()::uuid = "custom_prompts"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "custom_prompts" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "custom_prompts"."user_id"));--> statement-breakpoint

-- ── Custom Prompt History (auth.user_id()::uuid = user_id) ──
CREATE POLICY "crud-authenticated-policy-select" ON "custom_prompt_history" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "custom_prompt_history"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "custom_prompt_history" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "custom_prompt_history"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "custom_prompt_history" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "custom_prompt_history"."user_id")) WITH CHECK ((select auth.user_id()::uuid = "custom_prompt_history"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "custom_prompt_history" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "custom_prompt_history"."user_id"));--> statement-breakpoint

-- ── Extension Downloads (auth.user_id()::uuid = user_id) ──
CREATE POLICY "crud-authenticated-policy-select" ON "extension_downloads" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "extension_downloads"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "extension_downloads" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "extension_downloads"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "extension_downloads" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "extension_downloads"."user_id")) WITH CHECK ((select auth.user_id()::uuid = "extension_downloads"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "extension_downloads" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "extension_downloads"."user_id"));
