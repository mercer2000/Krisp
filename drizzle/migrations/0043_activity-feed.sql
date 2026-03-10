-- Activity Feed: enum + table + RLS policies + indexes

DO $$ BEGIN
  CREATE TYPE "public"."activity_event_type" AS ENUM(
    'email.received',
    'email.sent',
    'email.classified',
    'email.draft_created',
    'email.draft_sent',
    'email.labeled',
    'smart_label.triggered',
    'smart_label.created',
    'smart_label.updated',
    'smart_label.folder_synced',
    'card.created',
    'card.moved',
    'card.completed',
    'card.deleted',
    'board.created',
    'decision.created',
    'decision.status_changed',
    'action_item.created',
    'action_item.completed',
    'thought.created',
    'thought.linked',
    'thought.reminder_sent',
    'page.created',
    'page.updated',
    'meeting.received',
    'meeting.transcript_ready',
    'calendar.event_synced',
    'calendar.connected',
    'integration.connected',
    'integration.webhook_received',
    'weekly_review.generated',
    'daily_briefing.sent'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "activity_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "event_type" "activity_event_type" NOT NULL,
  "title" varchar(500) NOT NULL,
  "description" text,
  "metadata" jsonb,
  "entity_type" varchar(50),
  "entity_id" varchar(255),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_activity_events_user_created"
  ON "activity_events" ("user_id", "created_at");

CREATE INDEX IF NOT EXISTS "idx_activity_events_type"
  ON "activity_events" ("event_type");

-- RLS policies
ALTER TABLE "activity_events" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crud_activity_events_policy_select"
  ON "activity_events"
  AS PERMISSIVE
  FOR SELECT
  TO "authenticated"
  USING ((select auth.user_id()::uuid = user_id));

CREATE POLICY "crud_activity_events_policy_insert"
  ON "activity_events"
  AS PERMISSIVE
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((select auth.user_id()::uuid = user_id));

CREATE POLICY "crud_activity_events_policy_update"
  ON "activity_events"
  AS PERMISSIVE
  FOR UPDATE
  TO "authenticated"
  USING ((select auth.user_id()::uuid = user_id));

CREATE POLICY "crud_activity_events_policy_delete"
  ON "activity_events"
  AS PERMISSIVE
  FOR DELETE
  TO "authenticated"
  USING ((select auth.user_id()::uuid = user_id));
