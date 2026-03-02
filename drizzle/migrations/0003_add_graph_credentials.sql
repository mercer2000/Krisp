CREATE TABLE "graph_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"azure_tenant_id" varchar(255) NOT NULL,
	"client_id" varchar(255) NOT NULL,
	"client_secret" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "graph_credentials" ADD CONSTRAINT "graph_credentials_tenant_id_users_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_graph_credentials_tenant" ON "graph_credentials" USING btree ("tenant_id");
