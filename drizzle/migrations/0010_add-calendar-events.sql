-- Calendar Events table for Microsoft 365 calendar integration
CREATE TABLE IF NOT EXISTS "calendar_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "credential_id" uuid REFERENCES "graph_credentials"("id") ON DELETE SET NULL,
  "graph_event_id" varchar(512) NOT NULL,
  "subject" text,
  "body_preview" text,
  "body_html" text,
  "start_date_time" timestamp with time zone NOT NULL,
  "end_date_time" timestamp with time zone NOT NULL,
  "is_all_day" boolean NOT NULL DEFAULT false,
  "location" text,
  "organizer_email" varchar(512),
  "organizer_name" varchar(255),
  "attendees" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "web_link" text,
  "is_cancelled" boolean NOT NULL DEFAULT false,
  "show_as" varchar(50),
  "importance" varchar(50),
  "is_recurring" boolean NOT NULL DEFAULT false,
  "series_master_id" varchar(512),
  "raw_payload" jsonb,
  "last_synced_at" timestamp with time zone NOT NULL DEFAULT now(),
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_calendar_tenant_event" ON "calendar_events" ("tenant_id", "graph_event_id");
CREATE INDEX IF NOT EXISTS "idx_calendar_events_tenant" ON "calendar_events" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_calendar_events_start" ON "calendar_events" ("tenant_id", "start_date_time");
CREATE INDEX IF NOT EXISTS "idx_calendar_events_end" ON "calendar_events" ("tenant_id", "end_date_time");

-- Calendar Sync State table to track delta sync progress
CREATE TABLE IF NOT EXISTS "calendar_sync_state" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "credential_id" uuid NOT NULL REFERENCES "graph_credentials"("id") ON DELETE CASCADE,
  "mailbox" varchar(320) NOT NULL,
  "delta_link" text,
  "last_sync_at" timestamp with time zone,
  "active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_calendar_sync_tenant_cred_mailbox" ON "calendar_sync_state" ("tenant_id", "credential_id", "mailbox");
CREATE INDEX IF NOT EXISTS "idx_calendar_sync_tenant" ON "calendar_sync_state" ("tenant_id");
