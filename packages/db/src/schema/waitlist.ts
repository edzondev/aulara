import { sql } from "drizzle-orm";
import {
	check,
	pgTable,
	text,
	timestamp,
	unique,
	uuid,
} from "drizzle-orm/pg-core";
import { createdAtColumn, statusCheck } from "./columns.ts";

export const waitlistRoles = ["director", "owner", "admin", "other"] as const;
export type WaitlistRole = (typeof waitlistRoles)[number];

export const waitlistLead = pgTable(
	"waitlist_lead",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		institutionName: text("institution_name").notNull(),
		email: text("email").notNull(),
		role: text("role").$type<WaitlistRole>().notNull(),
		privacyAcceptedAt: timestamp("privacy_accepted_at", {
			withTimezone: true,
			mode: "date",
		}).notNull(),
		privacyPolicyVersion: text("privacy_policy_version").notNull(),
		ip: text("ip"),
		createdAt: createdAtColumn(),
	},
	(table) => [
		unique("waitlist_lead_email_unique").on(table.email),
		check("waitlist_lead_role_check", statusCheck(table.role, waitlistRoles)),
		check(
			"waitlist_lead_institution_name_check",
			sql`char_length(${table.institutionName}) between 2 and 120`,
		),
	],
);
