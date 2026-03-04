CREATE TABLE IF NOT EXISTS "telegram_bot_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "bot_token" text NOT NULL,
  "bot_username" varchar(255),
  "chat_id" varchar(100),
  "webhook_secret" varchar(255) NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_telegram_bot_user" ON "telegram_bot_tokens" USING btree ("user_id");
