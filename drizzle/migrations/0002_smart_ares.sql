CREATE TYPE "public"."action_item_status" AS ENUM('open', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "action_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"meeting_id" integer,
	"title" varchar(500) NOT NULL,
	"description" text,
	"assignee" varchar(255),
	"status" "action_item_status" DEFAULT 'open' NOT NULL,
	"priority" "priority" DEFAULT 'medium' NOT NULL,
	"due_date" date,
	"completed_at" timestamp with time zone,
	"reminder_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gmail_watch_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"email_address" varchar(320) NOT NULL,
	"history_id" varchar(100),
	"expiration" timestamp with time zone,
	"topic_name" varchar(512) NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"token_expiry" timestamp with time zone,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "graph_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"subscription_id" varchar(512) NOT NULL,
	"resource" varchar(512) NOT NULL,
	"change_type" varchar(100) NOT NULL,
	"client_state" varchar(255) NOT NULL,
	"expiration_date_time" timestamp with time zone NOT NULL,
	"notification_url" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "action_items" ADD CONSTRAINT "action_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_items" ADD CONSTRAINT "action_items_meeting_id_webhook_key_points_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."webhook_key_points"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gmail_watch_subscriptions" ADD CONSTRAINT "gmail_watch_subscriptions_tenant_id_users_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "graph_subscriptions" ADD CONSTRAINT "graph_subscriptions_tenant_id_users_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_gmail_watch_tenant_email" ON "gmail_watch_subscriptions" USING btree ("tenant_id","email_address");--> statement-breakpoint
CREATE INDEX "idx_gmail_watch_tenant" ON "gmail_watch_subscriptions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_gmail_watch_expiration" ON "gmail_watch_subscriptions" USING btree ("expiration");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_graph_subscription_id" ON "graph_subscriptions" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "idx_graph_subscriptions_tenant" ON "graph_subscriptions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_graph_subscriptions_expiration" ON "graph_subscriptions" USING btree ("expiration_date_time");