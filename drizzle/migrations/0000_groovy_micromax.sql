CREATE TYPE "public"."priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TABLE "boards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"background_color" varchar(7) DEFAULT '#F0F4F8' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "card_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"card_id" uuid NOT NULL,
	"label" varchar(50) NOT NULL,
	"color" varchar(7) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"column_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"position" integer NOT NULL,
	"due_date" date,
	"priority" "priority" DEFAULT 'medium' NOT NULL,
	"color_label" varchar(7),
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "columns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"board_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"position" integer NOT NULL,
	"color" varchar(7),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "emails" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"message_id" varchar(512) NOT NULL,
	"sender" varchar(512) NOT NULL,
	"recipients" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"cc" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"bcc" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"subject" text,
	"body_plain_text" text,
	"body_html" text,
	"received_at" timestamp with time zone NOT NULL,
	"attachments_metadata" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"raw_payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gmail_emails" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"gmail_message_id" text NOT NULL,
	"thread_id" text,
	"sender" text NOT NULL,
	"recipients" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"subject" text,
	"body_plain" text,
	"body_html" text,
	"received_at" timestamp with time zone NOT NULL,
	"attachments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"labels" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"raw_payload" jsonb,
	"ingested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(50) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255),
	"display_name" varchar(100) NOT NULL,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "webhook_key_points" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"webhook_id" varchar(255) NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"meeting_id" varchar(255) NOT NULL,
	"meeting_title" text,
	"meeting_url" text,
	"meeting_start_date" timestamp with time zone,
	"meeting_end_date" timestamp with time zone,
	"meeting_duration" integer,
	"speakers" jsonb DEFAULT '[]'::jsonb,
	"participants" jsonb DEFAULT '[]'::jsonb,
	"calendar_event_id" varchar(255),
	"content" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"raw_meeting" text,
	"raw_content" text,
	"full_payload" jsonb NOT NULL,
	"received_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "webhook_key_points_webhook_id_unique" UNIQUE("webhook_id")
);
--> statement-breakpoint
ALTER TABLE "boards" ADD CONSTRAINT "boards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_tags" ADD CONSTRAINT "card_tags_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_column_id_columns_id_fk" FOREIGN KEY ("column_id") REFERENCES "public"."columns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "columns" ADD CONSTRAINT "columns_board_id_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."boards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emails" ADD CONSTRAINT "emails_tenant_id_users_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gmail_emails" ADD CONSTRAINT "gmail_emails_tenant_id_users_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_key_points" ADD CONSTRAINT "webhook_key_points_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_emails_tenant_message" ON "emails" USING btree ("tenant_id","message_id");--> statement-breakpoint
CREATE INDEX "idx_emails_tenant_id" ON "emails" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_emails_received_at" ON "emails" USING btree ("received_at");--> statement-breakpoint
CREATE INDEX "idx_emails_tenant_received" ON "emails" USING btree ("tenant_id","received_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_tenant_gmail_message" ON "gmail_emails" USING btree ("tenant_id","gmail_message_id");--> statement-breakpoint
CREATE INDEX "idx_gmail_emails_tenant_id" ON "gmail_emails" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_gmail_emails_received_at" ON "gmail_emails" USING btree ("tenant_id","received_at");--> statement-breakpoint
CREATE INDEX "idx_gmail_emails_sender" ON "gmail_emails" USING btree ("tenant_id","sender");