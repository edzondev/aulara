CREATE TABLE "waitlist_lead" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_name" text NOT NULL,
	"email" text NOT NULL,
	"role" text NOT NULL,
	"privacy_accepted_at" timestamp with time zone NOT NULL,
	"privacy_policy_version" text NOT NULL,
	"ip" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "waitlist_lead_email_unique" UNIQUE("email"),
	CONSTRAINT "waitlist_lead_role_check" CHECK ("waitlist_lead"."role" in ('director', 'owner', 'admin', 'other')),
	CONSTRAINT "waitlist_lead_institution_name_check" CHECK (char_length("waitlist_lead"."institution_name") between 2 and 120)
);
