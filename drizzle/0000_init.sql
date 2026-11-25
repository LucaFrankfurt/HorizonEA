CREATE TYPE "public"."architecture_state" AS ENUM('As-Is', 'To-Be', 'Both');--> statement-breakpoint
CREATE TYPE "public"."asset_type" AS ENUM('Server', 'Cluster', 'Cloud Account', 'Network Device', 'Storage');--> statement-breakpoint
CREATE TYPE "public"."criticality" AS ENUM('Tier 1', 'Tier 2', 'Tier 3');--> statement-breakpoint
CREATE TYPE "public"."environment" AS ENUM('Prod', 'Staging', 'Dev');--> statement-breakpoint
CREATE TYPE "public"."hosting_model" AS ENUM('On-Premises', 'Cloud', 'SaaS', 'Hybrid');--> statement-breakpoint
CREATE TYPE "public"."initiative_status" AS ENUM('Backlog', 'In Progress', 'Blocked', 'Completed');--> statement-breakpoint
CREATE TYPE "public"."integration_pattern" AS ENUM('Synchronous API', 'Asynchronous Messaging', 'Event Streaming', 'File Transfer', 'Database Integration', 'ETL / Batch');--> statement-breakpoint
CREATE TYPE "public"."interface_direction" AS ENUM('Unidirectional', 'Bidirectional');--> statement-breakpoint
CREATE TYPE "public"."item_kind" AS ENUM('Application', 'Technology');--> statement-breakpoint
CREATE TYPE "public"."lifecycle_status" AS ENUM('Planned', 'Active', 'Phase-Out', 'Retired');--> statement-breakpoint
CREATE TYPE "public"."migration_strategy" AS ENUM('Rehost', 'Replatform', 'Refactor', 'Replace', 'Retire', 'Retain');--> statement-breakpoint
CREATE TYPE "public"."phase_status" AS ENUM('Planned', 'In Progress', 'Completed');--> statement-breakpoint
CREATE TYPE "public"."risk_level" AS ENUM('Low', 'Medium', 'High');--> statement-breakpoint
CREATE TYPE "public"."standardization_status" AS ENUM('Approved', 'Containment', 'Sunset', 'Prohibited');--> statement-breakpoint
CREATE TYPE "public"."tech_category" AS ENUM('Language', 'Framework', 'Database', 'Operating System', 'Middleware', 'Infrastructure');--> statement-breakpoint
CREATE TABLE "application_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"role" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_technologies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"technology_id" uuid NOT NULL,
	"usage" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"business_domain" text NOT NULL,
	"criticality" "criticality" DEFAULT 'Tier 2' NOT NULL,
	"owner" text,
	"lifecycle_status" "lifecycle_status" DEFAULT 'Active' NOT NULL,
	"architecture_state" "architecture_state" DEFAULT 'Both' NOT NULL,
	"go_live_date" date,
	"planned_eol_date" date,
	"hosting_model" "hosting_model" DEFAULT 'On-Premises' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"asset_type" "asset_type" NOT NULL,
	"environment" "environment" DEFAULT 'Prod' NOT NULL,
	"location" text,
	"operating_system_id" uuid,
	"owner" text,
	"eol_date" date,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "initiative_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"initiative_id" uuid NOT NULL,
	"kind" "item_kind" NOT NULL,
	"source_application_id" uuid,
	"target_application_id" uuid,
	"source_technology_id" uuid,
	"target_technology_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "initiative_phases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"initiative_id" uuid NOT NULL,
	"name" text NOT NULL,
	"start_date" date,
	"end_date" date,
	"status" "phase_status" DEFAULT 'Planned' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "initiatives" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"strategy" "migration_strategy" NOT NULL,
	"status" "initiative_status" DEFAULT 'Backlog' NOT NULL,
	"owner" text,
	"start_date" date,
	"target_date" date,
	"budget" integer,
	"effort_person_days" integer,
	"risk_level" "risk_level" DEFAULT 'Medium' NOT NULL,
	"risk_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interfaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"source_application_id" uuid NOT NULL,
	"target_application_id" uuid NOT NULL,
	"data_flow" text,
	"protocol" text,
	"integration_pattern" "integration_pattern" DEFAULT 'Synchronous API' NOT NULL,
	"direction" "interface_direction" DEFAULT 'Unidirectional' NOT NULL,
	"architecture_state" "architecture_state" DEFAULT 'Both' NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "interfaces_no_self_loop" CHECK ("interfaces"."source_application_id" <> "interfaces"."target_application_id")
);
--> statement-breakpoint
CREATE TABLE "technologies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"category" "tech_category" NOT NULL,
	"version" text DEFAULT '' NOT NULL,
	"vendor" text,
	"release_date" date,
	"eol_date" date,
	"extended_support_end_date" date,
	"standardization_status" "standardization_status" DEFAULT 'Approved' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "application_assets" ADD CONSTRAINT "application_assets_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_assets" ADD CONSTRAINT "application_assets_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_technologies" ADD CONSTRAINT "application_technologies_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_technologies" ADD CONSTRAINT "application_technologies_technology_id_technologies_id_fk" FOREIGN KEY ("technology_id") REFERENCES "public"."technologies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_operating_system_id_technologies_id_fk" FOREIGN KEY ("operating_system_id") REFERENCES "public"."technologies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "initiative_items" ADD CONSTRAINT "initiative_items_initiative_id_initiatives_id_fk" FOREIGN KEY ("initiative_id") REFERENCES "public"."initiatives"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "initiative_items" ADD CONSTRAINT "initiative_items_source_application_id_applications_id_fk" FOREIGN KEY ("source_application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "initiative_items" ADD CONSTRAINT "initiative_items_target_application_id_applications_id_fk" FOREIGN KEY ("target_application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "initiative_items" ADD CONSTRAINT "initiative_items_source_technology_id_technologies_id_fk" FOREIGN KEY ("source_technology_id") REFERENCES "public"."technologies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "initiative_items" ADD CONSTRAINT "initiative_items_target_technology_id_technologies_id_fk" FOREIGN KEY ("target_technology_id") REFERENCES "public"."technologies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "initiative_phases" ADD CONSTRAINT "initiative_phases_initiative_id_initiatives_id_fk" FOREIGN KEY ("initiative_id") REFERENCES "public"."initiatives"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interfaces" ADD CONSTRAINT "interfaces_source_application_id_applications_id_fk" FOREIGN KEY ("source_application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interfaces" ADD CONSTRAINT "interfaces_target_application_id_applications_id_fk" FOREIGN KEY ("target_application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "application_assets_uq" ON "application_assets" USING btree ("application_id","asset_id");--> statement-breakpoint
CREATE INDEX "application_assets_asset_idx" ON "application_assets" USING btree ("asset_id");--> statement-breakpoint
CREATE UNIQUE INDEX "application_technologies_uq" ON "application_technologies" USING btree ("application_id","technology_id");--> statement-breakpoint
CREATE INDEX "application_technologies_tech_idx" ON "application_technologies" USING btree ("technology_id");--> statement-breakpoint
CREATE UNIQUE INDEX "applications_name_uq" ON "applications" USING btree ("name");--> statement-breakpoint
CREATE INDEX "applications_domain_idx" ON "applications" USING btree ("business_domain");--> statement-breakpoint
CREATE UNIQUE INDEX "assets_name_uq" ON "assets" USING btree ("name");--> statement-breakpoint
CREATE INDEX "initiative_items_initiative_idx" ON "initiative_items" USING btree ("initiative_id");--> statement-breakpoint
CREATE INDEX "initiative_phases_initiative_idx" ON "initiative_phases" USING btree ("initiative_id");--> statement-breakpoint
CREATE UNIQUE INDEX "initiatives_name_uq" ON "initiatives" USING btree ("name");--> statement-breakpoint
CREATE INDEX "interfaces_source_idx" ON "interfaces" USING btree ("source_application_id");--> statement-breakpoint
CREATE INDEX "interfaces_target_idx" ON "interfaces" USING btree ("target_application_id");--> statement-breakpoint
CREATE UNIQUE INDEX "technologies_name_version_uq" ON "technologies" USING btree ("name","version");