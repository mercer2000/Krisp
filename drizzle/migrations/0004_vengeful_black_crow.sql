-- Add label column to graph_credentials for multi-connection support
ALTER TABLE "graph_credentials" ADD COLUMN "label" varchar(255) DEFAULT 'Default' NOT NULL;
--> statement-breakpoint
-- Drop the unique constraint on tenant_id to allow multiple credentials per tenant
DROP INDEX IF EXISTS "uq_graph_credentials_tenant";
--> statement-breakpoint
-- Add a regular index on tenant_id for query performance
CREATE INDEX "idx_graph_credentials_tenant" ON "graph_credentials" USING btree ("tenant_id");
--> statement-breakpoint
-- Add credential_id column to graph_subscriptions to link subscriptions to credentials
ALTER TABLE "graph_subscriptions" ADD COLUMN "credential_id" uuid;
--> statement-breakpoint
-- Add FK constraint from graph_subscriptions.credential_id to graph_credentials.id
ALTER TABLE "graph_subscriptions" ADD CONSTRAINT "graph_subscriptions_credential_id_graph_credentials_id_fk" FOREIGN KEY ("credential_id") REFERENCES "public"."graph_credentials"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
-- Add index on credential_id for performance
CREATE INDEX "idx_graph_subscriptions_credential" ON "graph_subscriptions" USING btree ("credential_id");
