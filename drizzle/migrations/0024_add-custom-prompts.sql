CREATE TABLE IF NOT EXISTS "custom_prompts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "prompt_key" varchar(100) NOT NULL,
  "prompt_text" text NOT NULL,
  "version" integer DEFAULT 1 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_custom_prompts_user_key" ON "custom_prompts" USING btree ("user_id","prompt_key");
CREATE INDEX IF NOT EXISTS "idx_custom_prompts_user" ON "custom_prompts" USING btree ("user_id");

CREATE TABLE IF NOT EXISTS "custom_prompt_history" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "prompt_key" varchar(100) NOT NULL,
  "prompt_text" text NOT NULL,
  "version" integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_custom_prompt_history_user_key" ON "custom_prompt_history" USING btree ("user_id","prompt_key");
