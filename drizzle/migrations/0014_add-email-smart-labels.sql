-- Email Smart Labels
CREATE TABLE IF NOT EXISTS "email_labels" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" varchar(100) NOT NULL,
  "color" varchar(7) NOT NULL,
  "is_system" boolean NOT NULL DEFAULT false,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_email_labels_tenant_name" ON "email_labels" ("tenant_id", "name");
CREATE INDEX IF NOT EXISTS "idx_email_labels_tenant" ON "email_labels" ("tenant_id");

-- Email Label Assignments (many-to-many)
CREATE TABLE IF NOT EXISTS "email_label_assignments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email_id" integer NOT NULL REFERENCES "emails"("id") ON DELETE CASCADE,
  "label_id" uuid NOT NULL REFERENCES "email_labels"("id") ON DELETE CASCADE,
  "confidence" integer,
  "assigned_by" varchar(20) NOT NULL DEFAULT 'ai',
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_email_label_assignment" ON "email_label_assignments" ("email_id", "label_id");
CREATE INDEX IF NOT EXISTS "idx_email_label_assignments_email" ON "email_label_assignments" ("email_id");
CREATE INDEX IF NOT EXISTS "idx_email_label_assignments_label" ON "email_label_assignments" ("label_id");
