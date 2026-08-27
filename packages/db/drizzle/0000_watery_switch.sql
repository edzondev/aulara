CREATE TABLE "account" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"issuer" text NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitation" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"inviter_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo" text,
	"created_at" timestamp NOT NULL,
	"metadata" text,
	CONSTRAINT "organization_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" uuid NOT NULL,
	"impersonated_by" text,
	"active_organization_id" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"role" text,
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "billing_contract" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"price_per_active_student" numeric(12, 2) NOT NULL,
	"minimum_monthly_amount" numeric(12, 2),
	"currency_code" text NOT NULL,
	"starts_on" date NOT NULL,
	"ends_on" date,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "school_school_id_unique" UNIQUE("school_id","id"),
	CONSTRAINT "billing_contract_price_check" CHECK ("billing_contract"."price_per_active_student" >= 0),
	CONSTRAINT "billing_contract_minimum_check" CHECK ("billing_contract"."minimum_monthly_amount" is null or "billing_contract"."minimum_monthly_amount" >= 0),
	CONSTRAINT "billing_contract_period_check" CHECK ("billing_contract"."ends_on" is null or "billing_contract"."ends_on" > "billing_contract"."starts_on"),
	CONSTRAINT "billing_contract_currency_check" CHECK ("billing_contract"."currency_code" ~ '^[A-Z]{3}$'),
	CONSTRAINT "billing_contract_status_check" CHECK ("billing_contract"."status" in ('draft', 'confirmed', 'cancelled'))
);
--> statement-breakpoint
CREATE TABLE "school" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"legal_name" text NOT NULL,
	"commercial_name" text NOT NULL,
	"ruc" text,
	"modular_code" text,
	"contact_email" text,
	"contact_phone" text,
	"address_line" text,
	"district" text,
	"province" text,
	"department" text,
	"country_code" text DEFAULT 'PE' NOT NULL,
	"timezone" text DEFAULT 'America/Lima' NOT NULL,
	"currency_code" text DEFAULT 'PEN' NOT NULL,
	"status" text DEFAULT 'onboarding' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "school_organization_id_unique" UNIQUE("organization_id"),
	CONSTRAINT "school_ruc_check" CHECK ("school"."ruc" is null or "school"."ruc" ~ '^[0-9]{11}$'),
	CONSTRAINT "school_country_code_check" CHECK ("school"."country_code" ~ '^[A-Z]{2}$'),
	CONSTRAINT "school_currency_code_check" CHECK ("school"."currency_code" ~ '^[A-Z]{3}$'),
	CONSTRAINT "school_status_check" CHECK ("school"."status" in ('onboarding', 'active', 'suspended', 'cancelled'))
);
--> statement-breakpoint
CREATE TABLE "academic_level" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "academic_level_school_id_unique" UNIQUE("school_id","id"),
	CONSTRAINT "academic_level_school_name_unique" UNIQUE("school_id","name"),
	CONSTRAINT "academic_level_sort_order_check" CHECK ("academic_level"."sort_order" >= 0)
);
--> statement-breakpoint
CREATE TABLE "academic_year" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"name" text NOT NULL,
	"starts_on" date NOT NULL,
	"ends_on" date NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "academic_year_school_id_unique" UNIQUE("school_id","id"),
	CONSTRAINT "academic_year_school_name_unique" UNIQUE("school_id","name"),
	CONSTRAINT "academic_year_period_check" CHECK ("academic_year"."ends_on" > "academic_year"."starts_on"),
	CONSTRAINT "academic_year_status_check" CHECK ("academic_year"."status" in ('draft', 'active', 'closed'))
);
--> statement-breakpoint
CREATE TABLE "enrollment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"academic_year_id" uuid NOT NULL,
	"section_id" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"enrolled_on" date NOT NULL,
	"ended_on" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "enrollment_school_id_unique" UNIQUE("school_id","id"),
	CONSTRAINT "enrollment_school_year_id_unique" UNIQUE("school_id","academic_year_id","id"),
	CONSTRAINT "enrollment_school_student_year_unique" UNIQUE("school_id","student_id","academic_year_id"),
	CONSTRAINT "enrollment_period_check" CHECK ("enrollment"."ended_on" is null or "enrollment"."ended_on" >= "enrollment"."enrolled_on"),
	CONSTRAINT "enrollment_status_check" CHECK ("enrollment"."status" in ('pending', 'enrolled', 'withdrawn', 'completed', 'cancelled'))
);
--> statement-breakpoint
CREATE TABLE "grade" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"academic_level_id" uuid NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "grade_school_id_unique" UNIQUE("school_id","id"),
	CONSTRAINT "grade_school_level_name_unique" UNIQUE("school_id","academic_level_id","name"),
	CONSTRAINT "grade_sort_order_check" CHECK ("grade"."sort_order" >= 0)
);
--> statement-breakpoint
CREATE TABLE "guardian" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"first_names" text NOT NULL,
	"paternal_last_name" text NOT NULL,
	"maternal_last_name" text,
	"document_type" text,
	"document_number" text,
	"email" text,
	"phone" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "guardian_school_id_unique" UNIQUE("school_id","id"),
	CONSTRAINT "guardian_document_pair_check" CHECK (("guardian"."document_type" is null) = ("guardian"."document_number" is null))
);
--> statement-breakpoint
CREATE TABLE "section" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"academic_year_id" uuid NOT NULL,
	"grade_id" uuid NOT NULL,
	"name" text NOT NULL,
	"capacity" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "section_school_id_unique" UNIQUE("school_id","id"),
	CONSTRAINT "section_school_year_id_unique" UNIQUE("school_id","academic_year_id","id"),
	CONSTRAINT "section_school_year_grade_name_unique" UNIQUE("school_id","academic_year_id","grade_id","name"),
	CONSTRAINT "section_capacity_check" CHECK ("section"."capacity" is null or "section"."capacity" > 0)
);
--> statement-breakpoint
CREATE TABLE "student" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"student_code" text,
	"first_names" text NOT NULL,
	"paternal_last_name" text NOT NULL,
	"maternal_last_name" text,
	"document_type" text,
	"document_number" text,
	"birth_date" date,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "student_school_id_unique" UNIQUE("school_id","id"),
	CONSTRAINT "student_document_pair_check" CHECK (("student"."document_type" is null) = ("student"."document_number" is null)),
	CONSTRAINT "student_status_check" CHECK ("student"."status" in ('active', 'inactive', 'graduated', 'withdrawn'))
);
--> statement-breakpoint
CREATE TABLE "student_guardian" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"guardian_id" uuid NOT NULL,
	"relationship" text NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"is_financial_responsible" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "student_guardian_pair_unique" UNIQUE("school_id","student_id","guardian_id")
);
--> statement-breakpoint
CREATE TABLE "charge" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"academic_year_id" uuid NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"tuition_rate_id" uuid NOT NULL,
	"type" text DEFAULT 'tuition' NOT NULL,
	"billing_period" date NOT NULL,
	"base_amount" numeric(12, 2) NOT NULL,
	"discount_amount" numeric(12, 2) NOT NULL,
	"total_amount" numeric(12, 2) NOT NULL,
	"currency_code" text NOT NULL,
	"due_date" date NOT NULL,
	"voided_at" timestamp with time zone,
	"voided_by_user_id" uuid,
	"void_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "charge_school_id_unique" UNIQUE("school_id","id"),
	CONSTRAINT "charge_base_amount_check" CHECK ("charge"."base_amount" >= 0),
	CONSTRAINT "charge_discount_amount_check" CHECK ("charge"."discount_amount" >= 0 and "charge"."discount_amount" <= "charge"."base_amount"),
	CONSTRAINT "charge_total_amount_check" CHECK ("charge"."total_amount" = "charge"."base_amount" - "charge"."discount_amount"),
	CONSTRAINT "charge_currency_check" CHECK ("charge"."currency_code" ~ '^[A-Z]{3}$'),
	CONSTRAINT "charge_type_check" CHECK ("charge"."type" in ('tuition')),
	CONSTRAINT "charge_billing_period_check" CHECK (extract(day from "charge"."billing_period") = 1),
	CONSTRAINT "charge_void_consistency_check" CHECK (("charge"."voided_at" is null) = ("charge"."voided_by_user_id" is null))
);
--> statement-breakpoint
CREATE TABLE "payment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"currency_code" text NOT NULL,
	"payment_method" text NOT NULL,
	"reference" text,
	"notes" text,
	"paid_at" timestamp with time zone DEFAULT now() NOT NULL,
	"recorded_by_user_id" uuid NOT NULL,
	"voided_at" timestamp with time zone,
	"voided_by_user_id" uuid,
	"void_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_school_id_unique" UNIQUE("school_id","id"),
	CONSTRAINT "payment_amount_check" CHECK ("payment"."amount" > 0),
	CONSTRAINT "payment_currency_check" CHECK ("payment"."currency_code" ~ '^[A-Z]{3}$'),
	CONSTRAINT "payment_method_check" CHECK ("payment"."payment_method" in ('cash', 'bank_transfer', 'card', 'wallet', 'other')),
	CONSTRAINT "payment_void_consistency_check" CHECK (("payment"."voided_at" is null) = ("payment"."voided_by_user_id" is null))
);
--> statement-breakpoint
CREATE TABLE "payment_allocation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"payment_id" uuid NOT NULL,
	"charge_id" uuid NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_allocation_payment_charge_unique" UNIQUE("school_id","payment_id","charge_id"),
	CONSTRAINT "payment_allocation_amount_check" CHECK ("payment_allocation"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "student_discount" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"academic_year_id" uuid NOT NULL,
	"type" text NOT NULL,
	"value" numeric(12, 2) NOT NULL,
	"currency_code" text,
	"reason" text NOT NULL,
	"starts_on" date,
	"ends_on" date,
	"cancelled_at" timestamp with time zone,
	"cancelled_by_user_id" uuid,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "student_discount_percentage_check" CHECK ("student_discount"."type" <> 'percentage' or ("student_discount"."value" > 0 and "student_discount"."value" <= 100 and "student_discount"."currency_code" is null)),
	CONSTRAINT "student_discount_fixed_check" CHECK ("student_discount"."type" <> 'fixed' or ("student_discount"."value" > 0 and "student_discount"."currency_code" is not null)),
	CONSTRAINT "student_discount_period_check" CHECK ("student_discount"."ends_on" is null or "student_discount"."starts_on" is null or "student_discount"."ends_on" > "student_discount"."starts_on"),
	CONSTRAINT "student_discount_currency_check" CHECK ("student_discount"."currency_code" is null or "student_discount"."currency_code" ~ '^[A-Z]{3}$')
);
--> statement-breakpoint
CREATE TABLE "tuition_rate" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"academic_year_id" uuid NOT NULL,
	"grade_id" uuid,
	"amount" numeric(12, 2) NOT NULL,
	"currency_code" text NOT NULL,
	"due_day" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tuition_rate_school_id_unique" UNIQUE("school_id","id"),
	CONSTRAINT "tuition_rate_school_year_id_unique" UNIQUE("school_id","academic_year_id","id"),
	CONSTRAINT "tuition_rate_amount_check" CHECK ("tuition_rate"."amount" >= 0),
	CONSTRAINT "tuition_rate_due_day_check" CHECK ("tuition_rate"."due_day" between 1 and 31),
	CONSTRAINT "tuition_rate_currency_check" CHECK ("tuition_rate"."currency_code" ~ '^[A-Z]{3}$')
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviter_id_user_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_contract" ADD CONSTRAINT "billing_contract_school_fk" FOREIGN KEY ("school_id") REFERENCES "public"."school"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school" ADD CONSTRAINT "school_organization_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_level" ADD CONSTRAINT "academic_level_school_fk" FOREIGN KEY ("school_id") REFERENCES "public"."school"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_year" ADD CONSTRAINT "academic_year_school_fk" FOREIGN KEY ("school_id") REFERENCES "public"."school"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollment" ADD CONSTRAINT "enrollment_student_fk" FOREIGN KEY ("school_id","student_id") REFERENCES "public"."student"("school_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollment" ADD CONSTRAINT "enrollment_academic_year_fk" FOREIGN KEY ("school_id","academic_year_id") REFERENCES "public"."academic_year"("school_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollment" ADD CONSTRAINT "enrollment_section_fk" FOREIGN KEY ("school_id","academic_year_id","section_id") REFERENCES "public"."section"("school_id","academic_year_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grade" ADD CONSTRAINT "grade_school_level_fk" FOREIGN KEY ("school_id","academic_level_id") REFERENCES "public"."academic_level"("school_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guardian" ADD CONSTRAINT "guardian_school_fk" FOREIGN KEY ("school_id") REFERENCES "public"."school"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "section" ADD CONSTRAINT "section_school_year_fk" FOREIGN KEY ("school_id","academic_year_id") REFERENCES "public"."academic_year"("school_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "section" ADD CONSTRAINT "section_school_grade_fk" FOREIGN KEY ("school_id","grade_id") REFERENCES "public"."grade"("school_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student" ADD CONSTRAINT "student_school_fk" FOREIGN KEY ("school_id") REFERENCES "public"."school"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_guardian" ADD CONSTRAINT "student_guardian_student_fk" FOREIGN KEY ("school_id","student_id") REFERENCES "public"."student"("school_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_guardian" ADD CONSTRAINT "student_guardian_guardian_fk" FOREIGN KEY ("school_id","guardian_id") REFERENCES "public"."guardian"("school_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charge" ADD CONSTRAINT "charge_school_year_fk" FOREIGN KEY ("school_id","academic_year_id") REFERENCES "public"."academic_year"("school_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charge" ADD CONSTRAINT "charge_school_enrollment_fk" FOREIGN KEY ("school_id","enrollment_id") REFERENCES "public"."enrollment"("school_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charge" ADD CONSTRAINT "charge_school_tuition_rate_fk" FOREIGN KEY ("school_id","tuition_rate_id") REFERENCES "public"."tuition_rate"("school_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charge" ADD CONSTRAINT "charge_voided_by_fk" FOREIGN KEY ("voided_by_user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_school_fk" FOREIGN KEY ("school_id") REFERENCES "public"."school"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_recorded_by_fk" FOREIGN KEY ("recorded_by_user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_voided_by_fk" FOREIGN KEY ("voided_by_user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_allocation" ADD CONSTRAINT "payment_allocation_payment_fk" FOREIGN KEY ("school_id","payment_id") REFERENCES "public"."payment"("school_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_allocation" ADD CONSTRAINT "payment_allocation_charge_fk" FOREIGN KEY ("school_id","charge_id") REFERENCES "public"."charge"("school_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_discount" ADD CONSTRAINT "student_discount_student_fk" FOREIGN KEY ("school_id","student_id") REFERENCES "public"."student"("school_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_discount" ADD CONSTRAINT "student_discount_academic_year_fk" FOREIGN KEY ("school_id","academic_year_id") REFERENCES "public"."academic_year"("school_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_discount" ADD CONSTRAINT "student_discount_created_by_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_discount" ADD CONSTRAINT "student_discount_cancelled_by_fk" FOREIGN KEY ("cancelled_by_user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tuition_rate" ADD CONSTRAINT "tuition_rate_school_year_fk" FOREIGN KEY ("school_id","academic_year_id") REFERENCES "public"."academic_year"("school_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tuition_rate" ADD CONSTRAINT "tuition_rate_school_grade_fk" FOREIGN KEY ("school_id","grade_id") REFERENCES "public"."grade"("school_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "account_issuer_accountId_uidx" ON "account" USING btree ("issuer","account_id");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "invitation_organizationId_idx" ON "invitation" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "invitation_email_idx" ON "invitation" USING btree ("email");--> statement-breakpoint
CREATE INDEX "member_organizationId_idx" ON "member" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "member_userId_idx" ON "member" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "billing_contract_school_period_idx" ON "billing_contract" USING btree ("school_id","starts_on","ends_on");--> statement-breakpoint
CREATE INDEX "school_status_idx" ON "school" USING btree ("status");--> statement-breakpoint
CREATE INDEX "school_ruc_idx" ON "school" USING btree ("ruc");--> statement-breakpoint
CREATE INDEX "school_modular_code_idx" ON "school" USING btree ("modular_code");--> statement-breakpoint
CREATE INDEX "school_created_at_idx" ON "school" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "academic_level_school_sort_idx" ON "academic_level" USING btree ("school_id","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "academic_year_one_active_idx" ON "academic_year" USING btree ("school_id") WHERE "academic_year"."status" = 'active';--> statement-breakpoint
CREATE INDEX "academic_year_school_status_idx" ON "academic_year" USING btree ("school_id","status");--> statement-breakpoint
CREATE INDEX "academic_year_school_dates_idx" ON "academic_year" USING btree ("school_id","starts_on","ends_on");--> statement-breakpoint
CREATE INDEX "enrollment_school_year_status_idx" ON "enrollment" USING btree ("school_id","academic_year_id","status");--> statement-breakpoint
CREATE INDEX "enrollment_school_section_idx" ON "enrollment" USING btree ("school_id","section_id");--> statement-breakpoint
CREATE INDEX "enrollment_school_student_idx" ON "enrollment" USING btree ("school_id","student_id");--> statement-breakpoint
CREATE INDEX "grade_school_level_sort_idx" ON "grade" USING btree ("school_id","academic_level_id","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "guardian_school_document_idx" ON "guardian" USING btree ("school_id","document_type","document_number") WHERE "guardian"."document_type" is not null and "guardian"."document_number" is not null;--> statement-breakpoint
CREATE INDEX "guardian_school_email_idx" ON "guardian" USING btree ("school_id","email");--> statement-breakpoint
CREATE INDEX "guardian_school_phone_idx" ON "guardian" USING btree ("school_id","phone");--> statement-breakpoint
CREATE INDEX "section_school_year_grade_idx" ON "section" USING btree ("school_id","academic_year_id","grade_id");--> statement-breakpoint
CREATE UNIQUE INDEX "student_school_code_idx" ON "student" USING btree ("school_id","student_code") WHERE "student"."student_code" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "student_school_document_idx" ON "student" USING btree ("school_id","document_type","document_number") WHERE "student"."document_type" is not null and "student"."document_number" is not null;--> statement-breakpoint
CREATE INDEX "student_school_status_idx" ON "student" USING btree ("school_id","status");--> statement-breakpoint
CREATE INDEX "student_school_last_names_idx" ON "student" USING btree ("school_id","paternal_last_name","maternal_last_name");--> statement-breakpoint
CREATE UNIQUE INDEX "student_guardian_one_primary_idx" ON "student_guardian" USING btree ("school_id","student_id") WHERE "student_guardian"."is_primary" = true;--> statement-breakpoint
CREATE INDEX "student_guardian_school_guardian_idx" ON "student_guardian" USING btree ("school_id","guardian_id");--> statement-breakpoint
CREATE UNIQUE INDEX "charge_one_active_per_period_idx" ON "charge" USING btree ("school_id","enrollment_id","type","billing_period") WHERE "charge"."voided_at" is null;--> statement-breakpoint
CREATE INDEX "charge_school_enrollment_period_idx" ON "charge" USING btree ("school_id","enrollment_id","billing_period");--> statement-breakpoint
CREATE INDEX "charge_school_year_period_idx" ON "charge" USING btree ("school_id","academic_year_id","billing_period");--> statement-breakpoint
CREATE INDEX "charge_school_due_date_idx" ON "charge" USING btree ("school_id","due_date") WHERE "charge"."voided_at" is null;--> statement-breakpoint
CREATE INDEX "payment_school_paid_at_idx" ON "payment" USING btree ("school_id","paid_at");--> statement-breakpoint
CREATE INDEX "payment_school_reference_idx" ON "payment" USING btree ("school_id","reference");--> statement-breakpoint
CREATE INDEX "payment_school_voided_at_idx" ON "payment" USING btree ("school_id","voided_at");--> statement-breakpoint
CREATE INDEX "payment_allocation_school_payment_idx" ON "payment_allocation" USING btree ("school_id","payment_id");--> statement-breakpoint
CREATE INDEX "payment_allocation_school_charge_idx" ON "payment_allocation" USING btree ("school_id","charge_id");--> statement-breakpoint
CREATE INDEX "student_discount_school_student_year_idx" ON "student_discount" USING btree ("school_id","student_id","academic_year_id");--> statement-breakpoint
CREATE INDEX "student_discount_active_idx" ON "student_discount" USING btree ("school_id","student_id","academic_year_id") WHERE "student_discount"."cancelled_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "tuition_rate_one_general_per_year_idx" ON "tuition_rate" USING btree ("school_id","academic_year_id") WHERE "tuition_rate"."grade_id" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "tuition_rate_one_per_grade_idx" ON "tuition_rate" USING btree ("school_id","academic_year_id","grade_id") WHERE "tuition_rate"."grade_id" is not null;--> statement-breakpoint
CREATE INDEX "tuition_rate_school_year_grade_idx" ON "tuition_rate" USING btree ("school_id","academic_year_id","grade_id");