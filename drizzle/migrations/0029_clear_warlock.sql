CREATE TYPE "public"."brain_chat_role" AS ENUM('user', 'assistant');--> statement-breakpoint
CREATE TYPE "public"."daily_briefing_status" AS ENUM('generating', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."email_draft_status" AS ENUM('pending_review', 'sent', 'discarded');--> statement-breakpoint
CREATE TYPE "public"."outbound_webhook_event" AS ENUM('card.created', 'meeting.ingested', 'email.received', 'thought.captured');--> statement-breakpoint
CREATE TYPE "public"."page_entry_type" AS ENUM('knowledge', 'decision', 'email_summary', 'manual');--> statement-breakpoint
CREATE TYPE "public"."page_type" AS ENUM('page', 'knowledge', 'decisions');--> statement-breakpoint
CREATE TYPE "public"."reminder_mode" AS ENUM('one_time', 'spaced_repetition');--> statement-breakpoint
CREATE TYPE "public"."reminder_status" AS ENUM('pending', 'sent', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."zapier_ingest_status" AS ENUM('success', 'failed');--> statement-breakpoint
CREATE TABLE "blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_id" uuid NOT NULL,
	"parent_block_id" uuid,
	"type" varchar(50) NOT NULL,
	"content" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "blocks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "brain_chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"role" "brain_chat_role" NOT NULL,
	"content" text NOT NULL,
	"sources_used" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brain_chat_messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "brain_chat_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(255) DEFAULT 'New Chat' NOT NULL,
	"pending_action" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brain_chat_sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "brain_thoughts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"content" text NOT NULL,
	"source" varchar(100) DEFAULT 'manual' NOT NULL,
	"author" varchar(255),
	"topic" varchar(255),
	"sentiment" varchar(50),
	"urgency" varchar(50),
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"embedding" vector(1536),
	"source_url" text,
	"source_domain" varchar(255),
	"source_timestamp" timestamp with time zone,
	"truncated" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brain_thoughts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "custom_prompt_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"prompt_key" varchar(100) NOT NULL,
	"prompt_text" text NOT NULL,
	"version" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "custom_prompt_history" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "custom_prompts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"prompt_key" varchar(100) NOT NULL,
	"prompt_text" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "custom_prompts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "daily_briefings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"briefing_date" date NOT NULL,
	"status" "daily_briefing_status" DEFAULT 'generating' NOT NULL,
	"briefing_html" text,
	"overdue_card_count" integer DEFAULT 0 NOT NULL,
	"email_count" integer DEFAULT 0 NOT NULL,
	"meeting_count" integer DEFAULT 0 NOT NULL,
	"action_item_count" integer DEFAULT 0 NOT NULL,
	"email_sent_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "daily_briefings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "database_rows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"database_page_id" uuid NOT NULL,
	"row_page_id" uuid,
	"properties" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "database_rows" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "email_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"email" text NOT NULL,
	"display_name" text,
	"email_count" integer DEFAULT 0 NOT NULL,
	"last_email_at" timestamp with time zone,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "email_contacts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "email_drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"email_id" varchar(255) NOT NULL,
	"email_type" varchar(30) NOT NULL,
	"label_id" uuid,
	"draft_body" text NOT NULL,
	"status" "email_draft_status" DEFAULT 'pending_review' NOT NULL,
	"discarded_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "email_drafts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "extension_downloads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"version" varchar(20) NOT NULL,
	"downloaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "extension_downloads" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "google_oauth_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"google_email" varchar(320) NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text NOT NULL,
	"token_expiry" timestamp with time zone NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"last_sync_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "google_oauth_tokens" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "newsletter_whitelist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"sender_email" varchar(512) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "newsletter_whitelist" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "outbound_webhook_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"webhook_id" uuid NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"payload" jsonb NOT NULL,
	"status_code" integer,
	"success" boolean NOT NULL,
	"error_message" text,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "outbound_webhook_deliveries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "outbound_webhooks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"url" text NOT NULL,
	"secret" varchar(255),
	"events" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "outbound_webhooks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "outlook_oauth_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"outlook_email" varchar(320) NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text NOT NULL,
	"token_expiry" timestamp with time zone NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"last_sync_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "outlook_oauth_tokens" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "page_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_id" uuid NOT NULL,
	"entry_type" "page_entry_type" NOT NULL,
	"title" varchar(500) DEFAULT '' NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"source_id" varchar(255),
	"source_type" varchar(50),
	"confidence" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "page_entries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"parent_id" uuid,
	"title" varchar(500) DEFAULT '' NOT NULL,
	"icon" varchar(50),
	"cover_url" text,
	"is_database" boolean DEFAULT false NOT NULL,
	"database_config" jsonb,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_by" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"page_type" "page_type" DEFAULT 'page' NOT NULL,
	"color" varchar(7),
	"smart_rule" text,
	"smart_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "smart_label_context_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label_id" uuid NOT NULL,
	"email_id" varchar(255) NOT NULL,
	"email_type" varchar(30) NOT NULL,
	"sender" text NOT NULL,
	"subject" text,
	"received_at" timestamp with time zone NOT NULL,
	"body_excerpt" text,
	"user_replied" boolean DEFAULT false NOT NULL,
	"reply_excerpt" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "smart_label_context_entries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "smart_label_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label_id" uuid NOT NULL,
	"item_type" varchar(30) NOT NULL,
	"item_id" varchar(255) NOT NULL,
	"confidence" integer,
	"assigned_by" varchar(20) DEFAULT 'ai' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "smart_label_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "smart_labels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"prompt" text NOT NULL,
	"color" varchar(7) DEFAULT '#6366F1' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"auto_draft_enabled" boolean DEFAULT false NOT NULL,
	"context_window_max" integer DEFAULT 7 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "smart_labels" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "telegram_bot_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"bot_token" text NOT NULL,
	"bot_username" varchar(255),
	"chat_id" varchar(100),
	"webhook_secret" varchar(255) NOT NULL,
	"active_session_id" uuid,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "telegram_bot_tokens" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "thought_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thought_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"linked_entity_type" varchar(30) NOT NULL,
	"linked_entity_id" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "thought_links" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "thought_reminders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thought_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"mode" "reminder_mode" DEFAULT 'one_time' NOT NULL,
	"status" "reminder_status" DEFAULT 'pending' NOT NULL,
	"repetition_number" integer DEFAULT 0 NOT NULL,
	"sent_at" timestamp with time zone,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "thought_reminders" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vip_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"email" varchar(512) NOT NULL,
	"domain" varchar(255),
	"display_name" varchar(255),
	"notify_on_new" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vip_contacts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"owner_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workspaces" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "zapier_ingest_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"source" varchar(255) NOT NULL,
	"routing_target" varchar(20) NOT NULL,
	"status" "zapier_ingest_status" NOT NULL,
	"idempotency_key" varchar(255),
	"error_message" text,
	"thought_id" uuid,
	"card_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "zapier_ingest_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "zoom_user_oauth_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"zoom_email" varchar(255) NOT NULL,
	"zoom_user_id" varchar(255),
	"access_token" text NOT NULL,
	"refresh_token" text NOT NULL,
	"token_expiry" timestamp with time zone NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"last_sync_at" timestamp with time zone,
	"sync_cursor" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "zoom_user_oauth_tokens" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "action_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "boards" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "calendar_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "calendar_sync_state" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "card_tags" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "cards" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "columns" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "decisions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "email_label_assignments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "email_labels" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "emails" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "gmail_emails" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "gmail_watch_subscriptions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "graph_credentials" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "graph_subscriptions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "webhook_key_points" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "webhook_secrets" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "weekly_reviews" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "zoom_chat_messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "zoom_oauth_tokens" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "cards" ADD COLUMN "checklist" jsonb;--> statement-breakpoint
ALTER TABLE "emails" ADD COLUMN "outlook_account_id" uuid;--> statement-breakpoint
ALTER TABLE "emails" ADD COLUMN "is_newsletter" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "emails" ADD COLUMN "is_spam" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "emails" ADD COLUMN "unsubscribe_link" text;--> statement-breakpoint
ALTER TABLE "gmail_emails" ADD COLUMN "is_newsletter" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "gmail_emails" ADD COLUMN "is_spam" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "gmail_emails" ADD COLUMN "unsubscribe_link" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_action_board_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "openrouter_api_key" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "openrouter_key_hash" varchar(255);--> statement-breakpoint
ALTER TABLE "zoom_chat_messages" ADD COLUMN "zoom_account_id" uuid;--> statement-breakpoint
ALTER TABLE "zoom_chat_messages" ADD COLUMN "embedding" vector(1536);--> statement-breakpoint
ALTER TABLE "zoom_chat_messages" ADD COLUMN "embedding_generated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brain_chat_messages" ADD CONSTRAINT "brain_chat_messages_session_id_brain_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."brain_chat_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brain_chat_sessions" ADD CONSTRAINT "brain_chat_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brain_thoughts" ADD CONSTRAINT "brain_thoughts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_prompt_history" ADD CONSTRAINT "custom_prompt_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_prompts" ADD CONSTRAINT "custom_prompts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_briefings" ADD CONSTRAINT "daily_briefings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "database_rows" ADD CONSTRAINT "database_rows_database_page_id_pages_id_fk" FOREIGN KEY ("database_page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "database_rows" ADD CONSTRAINT "database_rows_row_page_id_pages_id_fk" FOREIGN KEY ("row_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_contacts" ADD CONSTRAINT "email_contacts_tenant_id_users_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_drafts" ADD CONSTRAINT "email_drafts_tenant_id_users_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_drafts" ADD CONSTRAINT "email_drafts_label_id_smart_labels_id_fk" FOREIGN KEY ("label_id") REFERENCES "public"."smart_labels"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extension_downloads" ADD CONSTRAINT "extension_downloads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "google_oauth_tokens" ADD CONSTRAINT "google_oauth_tokens_tenant_id_users_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_whitelist" ADD CONSTRAINT "newsletter_whitelist_tenant_id_users_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outbound_webhook_deliveries" ADD CONSTRAINT "outbound_webhook_deliveries_webhook_id_outbound_webhooks_id_fk" FOREIGN KEY ("webhook_id") REFERENCES "public"."outbound_webhooks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outbound_webhooks" ADD CONSTRAINT "outbound_webhooks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outlook_oauth_tokens" ADD CONSTRAINT "outlook_oauth_tokens_tenant_id_users_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_entries" ADD CONSTRAINT "page_entries_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "smart_label_context_entries" ADD CONSTRAINT "smart_label_context_entries_label_id_smart_labels_id_fk" FOREIGN KEY ("label_id") REFERENCES "public"."smart_labels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "smart_label_items" ADD CONSTRAINT "smart_label_items_label_id_smart_labels_id_fk" FOREIGN KEY ("label_id") REFERENCES "public"."smart_labels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "smart_labels" ADD CONSTRAINT "smart_labels_tenant_id_users_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telegram_bot_tokens" ADD CONSTRAINT "telegram_bot_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thought_links" ADD CONSTRAINT "thought_links_thought_id_brain_thoughts_id_fk" FOREIGN KEY ("thought_id") REFERENCES "public"."brain_thoughts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thought_links" ADD CONSTRAINT "thought_links_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thought_reminders" ADD CONSTRAINT "thought_reminders_thought_id_brain_thoughts_id_fk" FOREIGN KEY ("thought_id") REFERENCES "public"."brain_thoughts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thought_reminders" ADD CONSTRAINT "thought_reminders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vip_contacts" ADD CONSTRAINT "vip_contacts_tenant_id_users_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zapier_ingest_logs" ADD CONSTRAINT "zapier_ingest_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zoom_user_oauth_tokens" ADD CONSTRAINT "zoom_user_oauth_tokens_tenant_id_users_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_blocks_page_parent_sort" ON "blocks" USING btree ("page_id","parent_block_id","sort_order");--> statement-breakpoint
CREATE INDEX "idx_brain_chat_messages_session" ON "brain_chat_messages" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_brain_chat_messages_created" ON "brain_chat_messages" USING btree ("session_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_brain_chat_sessions_user" ON "brain_chat_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_brain_chat_sessions_updated" ON "brain_chat_sessions" USING btree ("user_id","updated_at");--> statement-breakpoint
CREATE INDEX "idx_brain_thoughts_user" ON "brain_thoughts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_brain_thoughts_user_created" ON "brain_thoughts" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_brain_thoughts_source" ON "brain_thoughts" USING btree ("user_id","source");--> statement-breakpoint
CREATE INDEX "idx_brain_thoughts_source_url" ON "brain_thoughts" USING btree ("user_id","source_url");--> statement-breakpoint
CREATE INDEX "idx_custom_prompt_history_user_key" ON "custom_prompt_history" USING btree ("user_id","prompt_key");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_custom_prompts_user_key" ON "custom_prompts" USING btree ("user_id","prompt_key");--> statement-breakpoint
CREATE INDEX "idx_custom_prompts_user" ON "custom_prompts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_daily_briefings_user_id" ON "daily_briefings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_daily_briefings_user_date" ON "daily_briefings" USING btree ("user_id","briefing_date");--> statement-breakpoint
CREATE INDEX "idx_database_rows_page_sort" ON "database_rows" USING btree ("database_page_id","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_email_contacts_tenant_email" ON "email_contacts" USING btree ("tenant_id","email");--> statement-breakpoint
CREATE INDEX "idx_email_contacts_tenant" ON "email_contacts" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_email_contacts_email_count" ON "email_contacts" USING btree ("tenant_id","email_count");--> statement-breakpoint
CREATE INDEX "idx_email_drafts_tenant" ON "email_drafts" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_email_drafts_email" ON "email_drafts" USING btree ("email_id","email_type");--> statement-breakpoint
CREATE INDEX "idx_email_drafts_status" ON "email_drafts" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "idx_extension_downloads_user" ON "extension_downloads" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_google_oauth_tenant_email" ON "google_oauth_tokens" USING btree ("tenant_id","google_email");--> statement-breakpoint
CREATE INDEX "idx_google_oauth_tenant" ON "google_oauth_tokens" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_newsletter_whitelist_tenant_sender" ON "newsletter_whitelist" USING btree ("tenant_id","sender_email");--> statement-breakpoint
CREATE INDEX "idx_newsletter_whitelist_tenant" ON "newsletter_whitelist" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_outbound_webhook_deliveries_webhook" ON "outbound_webhook_deliveries" USING btree ("webhook_id");--> statement-breakpoint
CREATE INDEX "idx_outbound_webhook_deliveries_sent" ON "outbound_webhook_deliveries" USING btree ("webhook_id","sent_at");--> statement-breakpoint
CREATE INDEX "idx_outbound_webhooks_user" ON "outbound_webhooks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_outbound_webhooks_active" ON "outbound_webhooks" USING btree ("user_id","active");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_outlook_oauth_tenant_email" ON "outlook_oauth_tokens" USING btree ("tenant_id","outlook_email");--> statement-breakpoint
CREATE INDEX "idx_outlook_oauth_tenant" ON "outlook_oauth_tokens" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_page_entries_page_sort" ON "page_entries" USING btree ("page_id","sort_order");--> statement-breakpoint
CREATE INDEX "idx_page_entries_source" ON "page_entries" USING btree ("source_type","source_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_page_entry_source" ON "page_entries" USING btree ("page_id","source_type","source_id");--> statement-breakpoint
CREATE INDEX "idx_pages_workspace_parent_sort" ON "pages" USING btree ("workspace_id","parent_id","sort_order");--> statement-breakpoint
CREATE INDEX "idx_pages_workspace_archived" ON "pages" USING btree ("workspace_id","is_archived");--> statement-breakpoint
CREATE INDEX "idx_slce_label" ON "smart_label_context_entries" USING btree ("label_id");--> statement-breakpoint
CREATE INDEX "idx_slce_label_created" ON "smart_label_context_entries" USING btree ("label_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_smart_label_item" ON "smart_label_items" USING btree ("label_id","item_type","item_id");--> statement-breakpoint
CREATE INDEX "idx_smart_label_items_label" ON "smart_label_items" USING btree ("label_id");--> statement-breakpoint
CREATE INDEX "idx_smart_label_items_item" ON "smart_label_items" USING btree ("item_type","item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_smart_labels_tenant_name" ON "smart_labels" USING btree ("tenant_id","name");--> statement-breakpoint
CREATE INDEX "idx_smart_labels_tenant" ON "smart_labels" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_telegram_bot_user" ON "telegram_bot_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_thought_link" ON "thought_links" USING btree ("thought_id","linked_entity_type","linked_entity_id");--> statement-breakpoint
CREATE INDEX "idx_thought_links_thought" ON "thought_links" USING btree ("thought_id");--> statement-breakpoint
CREATE INDEX "idx_thought_links_user" ON "thought_links" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_thought_links_entity" ON "thought_links" USING btree ("linked_entity_type","linked_entity_id");--> statement-breakpoint
CREATE INDEX "idx_thought_reminders_user" ON "thought_reminders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_thought_reminders_pending" ON "thought_reminders" USING btree ("status","scheduled_at");--> statement-breakpoint
CREATE INDEX "idx_thought_reminders_thought" ON "thought_reminders" USING btree ("thought_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_vip_contacts_tenant_email" ON "vip_contacts" USING btree ("tenant_id","email");--> statement-breakpoint
CREATE INDEX "idx_vip_contacts_tenant" ON "vip_contacts" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_vip_contacts_domain" ON "vip_contacts" USING btree ("tenant_id","domain");--> statement-breakpoint
CREATE INDEX "idx_zapier_ingest_logs_user" ON "zapier_ingest_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_zapier_ingest_logs_user_created" ON "zapier_ingest_logs" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_zapier_ingest_idempotency" ON "zapier_ingest_logs" USING btree ("user_id","idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_zoom_user_oauth_tenant_email" ON "zoom_user_oauth_tokens" USING btree ("tenant_id","zoom_email");--> statement-breakpoint
CREATE INDEX "idx_zoom_user_oauth_tenant" ON "zoom_user_oauth_tokens" USING btree ("tenant_id");--> statement-breakpoint
ALTER TABLE "emails" ADD CONSTRAINT "emails_outlook_account_id_outlook_oauth_tokens_id_fk" FOREIGN KEY ("outlook_account_id") REFERENCES "public"."outlook_oauth_tokens"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zoom_chat_messages" ADD CONSTRAINT "zoom_chat_messages_zoom_account_id_zoom_user_oauth_tokens_id_fk" FOREIGN KEY ("zoom_account_id") REFERENCES "public"."zoom_user_oauth_tokens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_emails_outlook_account" ON "emails" USING btree ("outlook_account_id");--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "action_items" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "action_items"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "action_items" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "action_items"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "action_items" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "action_items"."user_id")) WITH CHECK ((select auth.user_id()::uuid = "action_items"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "action_items" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "action_items"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "boards" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "boards"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "boards" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "boards"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "boards" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "boards"."user_id")) WITH CHECK ((select auth.user_id()::uuid = "boards"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "boards" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "boards"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "calendar_events" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "calendar_events"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "calendar_events" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "calendar_events"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "calendar_events" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "calendar_events"."tenant_id")) WITH CHECK ((select auth.user_id()::uuid = "calendar_events"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "calendar_events" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "calendar_events"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "calendar_sync_state" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "calendar_sync_state"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "calendar_sync_state" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "calendar_sync_state"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "calendar_sync_state" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "calendar_sync_state"."tenant_id")) WITH CHECK ((select auth.user_id()::uuid = "calendar_sync_state"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "calendar_sync_state" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "calendar_sync_state"."tenant_id"));--> statement-breakpoint
CREATE POLICY "card_tags_auth_select" ON "card_tags" AS PERMISSIVE FOR SELECT TO "authenticated" USING (card_id IN (SELECT ca.id FROM cards ca JOIN columns co ON ca.column_id = co.id JOIN boards b ON co.board_id = b.id WHERE b.user_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "card_tags_auth_insert" ON "card_tags" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (card_id IN (SELECT ca.id FROM cards ca JOIN columns co ON ca.column_id = co.id JOIN boards b ON co.board_id = b.id WHERE b.user_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "card_tags_auth_update" ON "card_tags" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (card_id IN (SELECT ca.id FROM cards ca JOIN columns co ON ca.column_id = co.id JOIN boards b ON co.board_id = b.id WHERE b.user_id = (select auth.user_id()::uuid))) WITH CHECK (card_id IN (SELECT ca.id FROM cards ca JOIN columns co ON ca.column_id = co.id JOIN boards b ON co.board_id = b.id WHERE b.user_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "card_tags_auth_delete" ON "card_tags" AS PERMISSIVE FOR DELETE TO "authenticated" USING (card_id IN (SELECT ca.id FROM cards ca JOIN columns co ON ca.column_id = co.id JOIN boards b ON co.board_id = b.id WHERE b.user_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "cards_auth_select" ON "cards" AS PERMISSIVE FOR SELECT TO "authenticated" USING (column_id IN (SELECT c.id FROM columns c JOIN boards b ON c.board_id = b.id WHERE b.user_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "cards_auth_insert" ON "cards" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (column_id IN (SELECT c.id FROM columns c JOIN boards b ON c.board_id = b.id WHERE b.user_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "cards_auth_update" ON "cards" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (column_id IN (SELECT c.id FROM columns c JOIN boards b ON c.board_id = b.id WHERE b.user_id = (select auth.user_id()::uuid))) WITH CHECK (column_id IN (SELECT c.id FROM columns c JOIN boards b ON c.board_id = b.id WHERE b.user_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "cards_auth_delete" ON "cards" AS PERMISSIVE FOR DELETE TO "authenticated" USING (column_id IN (SELECT c.id FROM columns c JOIN boards b ON c.board_id = b.id WHERE b.user_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "columns_auth_select" ON "columns" AS PERMISSIVE FOR SELECT TO "authenticated" USING (board_id IN (SELECT id FROM boards WHERE user_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "columns_auth_insert" ON "columns" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (board_id IN (SELECT id FROM boards WHERE user_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "columns_auth_update" ON "columns" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (board_id IN (SELECT id FROM boards WHERE user_id = (select auth.user_id()::uuid))) WITH CHECK (board_id IN (SELECT id FROM boards WHERE user_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "columns_auth_delete" ON "columns" AS PERMISSIVE FOR DELETE TO "authenticated" USING (board_id IN (SELECT id FROM boards WHERE user_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "decisions" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "decisions"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "decisions" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "decisions"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "decisions" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "decisions"."user_id")) WITH CHECK ((select auth.user_id()::uuid = "decisions"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "decisions" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "decisions"."user_id"));--> statement-breakpoint
CREATE POLICY "email_label_assignments_auth_select" ON "email_label_assignments" AS PERMISSIVE FOR SELECT TO "authenticated" USING (email_id IN (SELECT id FROM emails WHERE tenant_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "email_label_assignments_auth_insert" ON "email_label_assignments" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (email_id IN (SELECT id FROM emails WHERE tenant_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "email_label_assignments_auth_update" ON "email_label_assignments" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (email_id IN (SELECT id FROM emails WHERE tenant_id = (select auth.user_id()::uuid))) WITH CHECK (email_id IN (SELECT id FROM emails WHERE tenant_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "email_label_assignments_auth_delete" ON "email_label_assignments" AS PERMISSIVE FOR DELETE TO "authenticated" USING (email_id IN (SELECT id FROM emails WHERE tenant_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "email_labels" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "email_labels"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "email_labels" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "email_labels"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "email_labels" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "email_labels"."tenant_id")) WITH CHECK ((select auth.user_id()::uuid = "email_labels"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "email_labels" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "email_labels"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "emails" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "emails"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "emails" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "emails"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "emails" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "emails"."tenant_id")) WITH CHECK ((select auth.user_id()::uuid = "emails"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "emails" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "emails"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "gmail_emails" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "gmail_emails"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "gmail_emails" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "gmail_emails"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "gmail_emails" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "gmail_emails"."tenant_id")) WITH CHECK ((select auth.user_id()::uuid = "gmail_emails"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "gmail_emails" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "gmail_emails"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "gmail_watch_subscriptions" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "gmail_watch_subscriptions"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "gmail_watch_subscriptions" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "gmail_watch_subscriptions"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "gmail_watch_subscriptions" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "gmail_watch_subscriptions"."tenant_id")) WITH CHECK ((select auth.user_id()::uuid = "gmail_watch_subscriptions"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "gmail_watch_subscriptions" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "gmail_watch_subscriptions"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "graph_credentials" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "graph_credentials"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "graph_credentials" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "graph_credentials"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "graph_credentials" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "graph_credentials"."tenant_id")) WITH CHECK ((select auth.user_id()::uuid = "graph_credentials"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "graph_credentials" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "graph_credentials"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "graph_subscriptions" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "graph_subscriptions"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "graph_subscriptions" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "graph_subscriptions"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "graph_subscriptions" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "graph_subscriptions"."tenant_id")) WITH CHECK ((select auth.user_id()::uuid = "graph_subscriptions"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "graph_subscriptions" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "graph_subscriptions"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "password_reset_tokens" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "password_reset_tokens"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "password_reset_tokens" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "password_reset_tokens"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "password_reset_tokens" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "password_reset_tokens"."user_id")) WITH CHECK ((select auth.user_id()::uuid = "password_reset_tokens"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "password_reset_tokens" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "password_reset_tokens"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "users" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "users"."id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "users" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "users"."id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "users" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "users"."id")) WITH CHECK ((select auth.user_id()::uuid = "users"."id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "users" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "users"."id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "webhook_key_points" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "webhook_key_points"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "webhook_key_points" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "webhook_key_points"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "webhook_key_points" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "webhook_key_points"."user_id")) WITH CHECK ((select auth.user_id()::uuid = "webhook_key_points"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "webhook_key_points" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "webhook_key_points"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "webhook_secrets" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "webhook_secrets"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "webhook_secrets" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "webhook_secrets"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "webhook_secrets" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "webhook_secrets"."user_id")) WITH CHECK ((select auth.user_id()::uuid = "webhook_secrets"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "webhook_secrets" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "webhook_secrets"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "weekly_reviews" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "weekly_reviews"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "weekly_reviews" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "weekly_reviews"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "weekly_reviews" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "weekly_reviews"."user_id")) WITH CHECK ((select auth.user_id()::uuid = "weekly_reviews"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "weekly_reviews" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "weekly_reviews"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "zoom_chat_messages" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "zoom_chat_messages"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "zoom_chat_messages" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "zoom_chat_messages"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "zoom_chat_messages" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "zoom_chat_messages"."tenant_id")) WITH CHECK ((select auth.user_id()::uuid = "zoom_chat_messages"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "zoom_chat_messages" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "zoom_chat_messages"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "zoom_oauth_tokens" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "zoom_oauth_tokens"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "zoom_oauth_tokens" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "zoom_oauth_tokens"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "zoom_oauth_tokens" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "zoom_oauth_tokens"."tenant_id")) WITH CHECK ((select auth.user_id()::uuid = "zoom_oauth_tokens"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "zoom_oauth_tokens" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "zoom_oauth_tokens"."tenant_id"));--> statement-breakpoint
CREATE POLICY "blocks_auth_select" ON "blocks" AS PERMISSIVE FOR SELECT TO "authenticated" USING (page_id IN (SELECT p.id FROM pages p JOIN workspaces w ON p.workspace_id = w.id WHERE w.owner_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "blocks_auth_insert" ON "blocks" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (page_id IN (SELECT p.id FROM pages p JOIN workspaces w ON p.workspace_id = w.id WHERE w.owner_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "blocks_auth_update" ON "blocks" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (page_id IN (SELECT p.id FROM pages p JOIN workspaces w ON p.workspace_id = w.id WHERE w.owner_id = (select auth.user_id()::uuid))) WITH CHECK (page_id IN (SELECT p.id FROM pages p JOIN workspaces w ON p.workspace_id = w.id WHERE w.owner_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "blocks_auth_delete" ON "blocks" AS PERMISSIVE FOR DELETE TO "authenticated" USING (page_id IN (SELECT p.id FROM pages p JOIN workspaces w ON p.workspace_id = w.id WHERE w.owner_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "brain_chat_messages_auth_select" ON "brain_chat_messages" AS PERMISSIVE FOR SELECT TO "authenticated" USING (session_id IN (SELECT id FROM brain_chat_sessions WHERE user_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "brain_chat_messages_auth_insert" ON "brain_chat_messages" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (session_id IN (SELECT id FROM brain_chat_sessions WHERE user_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "brain_chat_messages_auth_update" ON "brain_chat_messages" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (session_id IN (SELECT id FROM brain_chat_sessions WHERE user_id = (select auth.user_id()::uuid))) WITH CHECK (session_id IN (SELECT id FROM brain_chat_sessions WHERE user_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "brain_chat_messages_auth_delete" ON "brain_chat_messages" AS PERMISSIVE FOR DELETE TO "authenticated" USING (session_id IN (SELECT id FROM brain_chat_sessions WHERE user_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "brain_chat_sessions" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "brain_chat_sessions"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "brain_chat_sessions" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "brain_chat_sessions"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "brain_chat_sessions" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "brain_chat_sessions"."user_id")) WITH CHECK ((select auth.user_id()::uuid = "brain_chat_sessions"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "brain_chat_sessions" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "brain_chat_sessions"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "brain_thoughts" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "brain_thoughts"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "brain_thoughts" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "brain_thoughts"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "brain_thoughts" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "brain_thoughts"."user_id")) WITH CHECK ((select auth.user_id()::uuid = "brain_thoughts"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "brain_thoughts" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "brain_thoughts"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "custom_prompt_history" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "custom_prompt_history"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "custom_prompt_history" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "custom_prompt_history"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "custom_prompt_history" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "custom_prompt_history"."user_id")) WITH CHECK ((select auth.user_id()::uuid = "custom_prompt_history"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "custom_prompt_history" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "custom_prompt_history"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "custom_prompts" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "custom_prompts"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "custom_prompts" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "custom_prompts"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "custom_prompts" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "custom_prompts"."user_id")) WITH CHECK ((select auth.user_id()::uuid = "custom_prompts"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "custom_prompts" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "custom_prompts"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "daily_briefings" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "daily_briefings"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "daily_briefings" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "daily_briefings"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "daily_briefings" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "daily_briefings"."user_id")) WITH CHECK ((select auth.user_id()::uuid = "daily_briefings"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "daily_briefings" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "daily_briefings"."user_id"));--> statement-breakpoint
CREATE POLICY "database_rows_auth_select" ON "database_rows" AS PERMISSIVE FOR SELECT TO "authenticated" USING (database_page_id IN (SELECT p.id FROM pages p JOIN workspaces w ON p.workspace_id = w.id WHERE w.owner_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "database_rows_auth_insert" ON "database_rows" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (database_page_id IN (SELECT p.id FROM pages p JOIN workspaces w ON p.workspace_id = w.id WHERE w.owner_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "database_rows_auth_update" ON "database_rows" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (database_page_id IN (SELECT p.id FROM pages p JOIN workspaces w ON p.workspace_id = w.id WHERE w.owner_id = (select auth.user_id()::uuid))) WITH CHECK (database_page_id IN (SELECT p.id FROM pages p JOIN workspaces w ON p.workspace_id = w.id WHERE w.owner_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "database_rows_auth_delete" ON "database_rows" AS PERMISSIVE FOR DELETE TO "authenticated" USING (database_page_id IN (SELECT p.id FROM pages p JOIN workspaces w ON p.workspace_id = w.id WHERE w.owner_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "email_contacts" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "email_contacts"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "email_contacts" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "email_contacts"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "email_contacts" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "email_contacts"."tenant_id")) WITH CHECK ((select auth.user_id()::uuid = "email_contacts"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "email_contacts" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "email_contacts"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "email_drafts" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "email_drafts"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "email_drafts" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "email_drafts"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "email_drafts" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "email_drafts"."tenant_id")) WITH CHECK ((select auth.user_id()::uuid = "email_drafts"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "email_drafts" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "email_drafts"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "extension_downloads" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "extension_downloads"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "extension_downloads" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "extension_downloads"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "extension_downloads" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "extension_downloads"."user_id")) WITH CHECK ((select auth.user_id()::uuid = "extension_downloads"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "extension_downloads" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "extension_downloads"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "google_oauth_tokens" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "google_oauth_tokens"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "google_oauth_tokens" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "google_oauth_tokens"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "google_oauth_tokens" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "google_oauth_tokens"."tenant_id")) WITH CHECK ((select auth.user_id()::uuid = "google_oauth_tokens"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "google_oauth_tokens" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "google_oauth_tokens"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "newsletter_whitelist" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "newsletter_whitelist"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "newsletter_whitelist" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "newsletter_whitelist"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "newsletter_whitelist" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "newsletter_whitelist"."tenant_id")) WITH CHECK ((select auth.user_id()::uuid = "newsletter_whitelist"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "newsletter_whitelist" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "newsletter_whitelist"."tenant_id"));--> statement-breakpoint
CREATE POLICY "outbound_webhook_deliveries_auth_select" ON "outbound_webhook_deliveries" AS PERMISSIVE FOR SELECT TO "authenticated" USING (webhook_id IN (SELECT id FROM outbound_webhooks WHERE user_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "outbound_webhook_deliveries_auth_insert" ON "outbound_webhook_deliveries" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (webhook_id IN (SELECT id FROM outbound_webhooks WHERE user_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "outbound_webhook_deliveries_auth_update" ON "outbound_webhook_deliveries" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (webhook_id IN (SELECT id FROM outbound_webhooks WHERE user_id = (select auth.user_id()::uuid))) WITH CHECK (webhook_id IN (SELECT id FROM outbound_webhooks WHERE user_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "outbound_webhook_deliveries_auth_delete" ON "outbound_webhook_deliveries" AS PERMISSIVE FOR DELETE TO "authenticated" USING (webhook_id IN (SELECT id FROM outbound_webhooks WHERE user_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "outbound_webhooks" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "outbound_webhooks"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "outbound_webhooks" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "outbound_webhooks"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "outbound_webhooks" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "outbound_webhooks"."user_id")) WITH CHECK ((select auth.user_id()::uuid = "outbound_webhooks"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "outbound_webhooks" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "outbound_webhooks"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "outlook_oauth_tokens" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "outlook_oauth_tokens"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "outlook_oauth_tokens" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "outlook_oauth_tokens"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "outlook_oauth_tokens" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "outlook_oauth_tokens"."tenant_id")) WITH CHECK ((select auth.user_id()::uuid = "outlook_oauth_tokens"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "outlook_oauth_tokens" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "outlook_oauth_tokens"."tenant_id"));--> statement-breakpoint
CREATE POLICY "page_entries_auth_select" ON "page_entries" AS PERMISSIVE FOR SELECT TO "authenticated" USING (page_id IN (SELECT p.id FROM pages p JOIN workspaces w ON p.workspace_id = w.id WHERE w.owner_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "page_entries_auth_insert" ON "page_entries" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (page_id IN (SELECT p.id FROM pages p JOIN workspaces w ON p.workspace_id = w.id WHERE w.owner_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "page_entries_auth_update" ON "page_entries" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (page_id IN (SELECT p.id FROM pages p JOIN workspaces w ON p.workspace_id = w.id WHERE w.owner_id = (select auth.user_id()::uuid))) WITH CHECK (page_id IN (SELECT p.id FROM pages p JOIN workspaces w ON p.workspace_id = w.id WHERE w.owner_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "page_entries_auth_delete" ON "page_entries" AS PERMISSIVE FOR DELETE TO "authenticated" USING (page_id IN (SELECT p.id FROM pages p JOIN workspaces w ON p.workspace_id = w.id WHERE w.owner_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "pages_auth_select" ON "pages" AS PERMISSIVE FOR SELECT TO "authenticated" USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "pages_auth_insert" ON "pages" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (workspace_id IN (SELECT id FROM workspaces WHERE owner_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "pages_auth_update" ON "pages" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_id = (select auth.user_id()::uuid))) WITH CHECK (workspace_id IN (SELECT id FROM workspaces WHERE owner_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "pages_auth_delete" ON "pages" AS PERMISSIVE FOR DELETE TO "authenticated" USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "slce_auth_select" ON "smart_label_context_entries" AS PERMISSIVE FOR SELECT TO "authenticated" USING (label_id IN (SELECT id FROM smart_labels WHERE tenant_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "slce_auth_insert" ON "smart_label_context_entries" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (label_id IN (SELECT id FROM smart_labels WHERE tenant_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "slce_auth_update" ON "smart_label_context_entries" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (label_id IN (SELECT id FROM smart_labels WHERE tenant_id = (select auth.user_id()::uuid))) WITH CHECK (label_id IN (SELECT id FROM smart_labels WHERE tenant_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "slce_auth_delete" ON "smart_label_context_entries" AS PERMISSIVE FOR DELETE TO "authenticated" USING (label_id IN (SELECT id FROM smart_labels WHERE tenant_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "smart_label_items_auth_select" ON "smart_label_items" AS PERMISSIVE FOR SELECT TO "authenticated" USING (label_id IN (SELECT id FROM smart_labels WHERE tenant_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "smart_label_items_auth_insert" ON "smart_label_items" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (label_id IN (SELECT id FROM smart_labels WHERE tenant_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "smart_label_items_auth_update" ON "smart_label_items" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (label_id IN (SELECT id FROM smart_labels WHERE tenant_id = (select auth.user_id()::uuid))) WITH CHECK (label_id IN (SELECT id FROM smart_labels WHERE tenant_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "smart_label_items_auth_delete" ON "smart_label_items" AS PERMISSIVE FOR DELETE TO "authenticated" USING (label_id IN (SELECT id FROM smart_labels WHERE tenant_id = (select auth.user_id()::uuid)));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "smart_labels" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "smart_labels"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "smart_labels" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "smart_labels"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "smart_labels" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "smart_labels"."tenant_id")) WITH CHECK ((select auth.user_id()::uuid = "smart_labels"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "smart_labels" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "smart_labels"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "telegram_bot_tokens" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "telegram_bot_tokens"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "telegram_bot_tokens" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "telegram_bot_tokens"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "telegram_bot_tokens" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "telegram_bot_tokens"."user_id")) WITH CHECK ((select auth.user_id()::uuid = "telegram_bot_tokens"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "telegram_bot_tokens" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "telegram_bot_tokens"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "thought_links" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "thought_links"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "thought_links" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "thought_links"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "thought_links" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "thought_links"."user_id")) WITH CHECK ((select auth.user_id()::uuid = "thought_links"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "thought_links" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "thought_links"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "thought_reminders" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "thought_reminders"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "thought_reminders" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "thought_reminders"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "thought_reminders" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "thought_reminders"."user_id")) WITH CHECK ((select auth.user_id()::uuid = "thought_reminders"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "thought_reminders" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "thought_reminders"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "vip_contacts" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "vip_contacts"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "vip_contacts" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "vip_contacts"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "vip_contacts" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "vip_contacts"."tenant_id")) WITH CHECK ((select auth.user_id()::uuid = "vip_contacts"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "vip_contacts" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "vip_contacts"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "workspaces" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "workspaces"."owner_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "workspaces" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "workspaces"."owner_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "workspaces" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "workspaces"."owner_id")) WITH CHECK ((select auth.user_id()::uuid = "workspaces"."owner_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "workspaces" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "workspaces"."owner_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "zapier_ingest_logs" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "zapier_ingest_logs"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "zapier_ingest_logs" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "zapier_ingest_logs"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "zapier_ingest_logs" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "zapier_ingest_logs"."user_id")) WITH CHECK ((select auth.user_id()::uuid = "zapier_ingest_logs"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "zapier_ingest_logs" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "zapier_ingest_logs"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "zoom_user_oauth_tokens" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id()::uuid = "zoom_user_oauth_tokens"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "zoom_user_oauth_tokens" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id()::uuid = "zoom_user_oauth_tokens"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "zoom_user_oauth_tokens" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id()::uuid = "zoom_user_oauth_tokens"."tenant_id")) WITH CHECK ((select auth.user_id()::uuid = "zoom_user_oauth_tokens"."tenant_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "zoom_user_oauth_tokens" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id()::uuid = "zoom_user_oauth_tokens"."tenant_id"));