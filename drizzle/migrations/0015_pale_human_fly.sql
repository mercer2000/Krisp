CREATE TYPE "public"."decision_category" AS ENUM('technical', 'process', 'budget', 'strategic', 'other');--> statement-breakpoint
CREATE TYPE "public"."decision_status" AS ENUM('active', 'reconsidered', 'archived');--> statement-breakpoint
CREATE TYPE "public"."weekly_review_status" AS ENUM('generating', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."zoom_channel_type" AS ENUM('dm', 'channel');--> statement-breakpoint
CREATE TABLE "calendar_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"credential_id" uuid,
	"graph_event_id" varchar(512) NOT NULL,
	"subject" text,
	"body_preview" text,
	"body_html" text,
	"start_date_time" timestamp with time zone NOT NULL,
	"end_date_time" timestamp with time zone NOT NULL,
	"is_all_day" boolean DEFAULT false NOT NULL,
	"location" text,
	"organizer_email" varchar(512),
	"organizer_name" varchar(255),
	"attendees" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"web_link" text,
	"is_cancelled" boolean DEFAULT false NOT NULL,
	"show_as" varchar(50),
	"importance" varchar(50),
	"is_recurring" boolean DEFAULT false NOT NULL,
	"series_master_id" varchar(512),
	"raw_payload" jsonb,
	"last_synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calendar_sync_state" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"credential_id" uuid NOT NULL,
	"mailbox" varchar(320) NOT NULL,
	"delta_link" text,
	"last_sync_at" timestamp with time zone,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"meeting_id" integer,
	"email_id" integer,
	"statement" text NOT NULL,
	"context" text,
	"rationale" text,
	"participants" jsonb DEFAULT '[]'::jsonb,
	"category" "decision_category" DEFAULT 'other' NOT NULL,
	"status" "decision_status" DEFAULT 'active' NOT NULL,
	"priority" "priority" DEFAULT 'medium' NOT NULL,
	"extraction_source" varchar(50) DEFAULT 'manual' NOT NULL,
	"confidence" integer DEFAULT 100,
	"annotation" text,
	"decision_date" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_label_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email_id" integer NOT NULL,
	"label_id" uuid NOT NULL,
	"confidence" integer,
	"assigned_by" varchar(20) DEFAULT 'ai' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_labels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"color" varchar(7) NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weekly_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"week_start" date NOT NULL,
	"week_end" date NOT NULL,
	"status" "weekly_review_status" DEFAULT 'generating' NOT NULL,
	"topic_clusters" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"unresolved_action_items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"cross_day_patterns" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"synthesis_report" text,
	"meeting_count" integer DEFAULT 0 NOT NULL,
	"email_count" integer DEFAULT 0 NOT NULL,
	"decision_count" integer DEFAULT 0 NOT NULL,
	"action_item_count" integer DEFAULT 0 NOT NULL,
	"email_sent_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "zoom_chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"zoom_user_id" varchar(255) NOT NULL,
	"message_id" varchar(512) NOT NULL,
	"channel_id" varchar(512),
	"channel_type" "zoom_channel_type" NOT NULL,
	"sender_id" varchar(255) NOT NULL,
	"sender_name" varchar(500),
	"message_content" text,
	"message_timestamp" timestamp with time zone NOT NULL,
	"is_edited" boolean DEFAULT false NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"raw_payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "zoom_oauth_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"zoom_account_id" varchar(255),
	"access_token" text NOT NULL,
	"refresh_token" text NOT NULL,
	"token_expiry" timestamp with time zone NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "action_items" ADD COLUMN "card_id" uuid;--> statement-breakpoint
ALTER TABLE "action_items" ADD COLUMN "extraction_source" varchar(50) DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "action_items" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "cards" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "emails" ADD COLUMN "embedding" vector(1536);--> statement-breakpoint
ALTER TABLE "emails" ADD COLUMN "embedding_generated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "emails" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "dashboard_config" jsonb;--> statement-breakpoint
ALTER TABLE "webhook_key_points" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_tenant_id_users_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_credential_id_graph_credentials_id_fk" FOREIGN KEY ("credential_id") REFERENCES "public"."graph_credentials"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_sync_state" ADD CONSTRAINT "calendar_sync_state_tenant_id_users_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_sync_state" ADD CONSTRAINT "calendar_sync_state_credential_id_graph_credentials_id_fk" FOREIGN KEY ("credential_id") REFERENCES "public"."graph_credentials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_meeting_id_webhook_key_points_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."webhook_key_points"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_label_assignments" ADD CONSTRAINT "email_label_assignments_email_id_emails_id_fk" FOREIGN KEY ("email_id") REFERENCES "public"."emails"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_label_assignments" ADD CONSTRAINT "email_label_assignments_label_id_email_labels_id_fk" FOREIGN KEY ("label_id") REFERENCES "public"."email_labels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_labels" ADD CONSTRAINT "email_labels_tenant_id_users_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_reviews" ADD CONSTRAINT "weekly_reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zoom_chat_messages" ADD CONSTRAINT "zoom_chat_messages_tenant_id_users_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zoom_oauth_tokens" ADD CONSTRAINT "zoom_oauth_tokens_tenant_id_users_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_calendar_tenant_event" ON "calendar_events" USING btree ("tenant_id","graph_event_id");--> statement-breakpoint
CREATE INDEX "idx_calendar_events_tenant" ON "calendar_events" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_calendar_events_start" ON "calendar_events" USING btree ("tenant_id","start_date_time");--> statement-breakpoint
CREATE INDEX "idx_calendar_events_end" ON "calendar_events" USING btree ("tenant_id","end_date_time");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_calendar_sync_tenant_cred_mailbox" ON "calendar_sync_state" USING btree ("tenant_id","credential_id","mailbox");--> statement-breakpoint
CREATE INDEX "idx_calendar_sync_tenant" ON "calendar_sync_state" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_decisions_user_id" ON "decisions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_decisions_meeting_id" ON "decisions" USING btree ("meeting_id");--> statement-breakpoint
CREATE INDEX "idx_decisions_status" ON "decisions" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "idx_decisions_category" ON "decisions" USING btree ("user_id","category");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_email_label_assignment" ON "email_label_assignments" USING btree ("email_id","label_id");--> statement-breakpoint
CREATE INDEX "idx_email_label_assignments_email" ON "email_label_assignments" USING btree ("email_id");--> statement-breakpoint
CREATE INDEX "idx_email_label_assignments_label" ON "email_label_assignments" USING btree ("label_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_email_labels_tenant_name" ON "email_labels" USING btree ("tenant_id","name");--> statement-breakpoint
CREATE INDEX "idx_email_labels_tenant" ON "email_labels" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_weekly_reviews_user_id" ON "weekly_reviews" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_weekly_reviews_user_week" ON "weekly_reviews" USING btree ("user_id","week_start");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_zoom_chat_tenant_message" ON "zoom_chat_messages" USING btree ("tenant_id","message_id");--> statement-breakpoint
CREATE INDEX "idx_zoom_chat_tenant" ON "zoom_chat_messages" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_zoom_chat_zoom_user" ON "zoom_chat_messages" USING btree ("tenant_id","zoom_user_id");--> statement-breakpoint
CREATE INDEX "idx_zoom_chat_timestamp" ON "zoom_chat_messages" USING btree ("tenant_id","message_timestamp");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_zoom_oauth_tenant" ON "zoom_oauth_tokens" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_zoom_oauth_tenant" ON "zoom_oauth_tokens" USING btree ("tenant_id");--> statement-breakpoint
ALTER TABLE "action_items" ADD CONSTRAINT "action_items_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE set null ON UPDATE no action;