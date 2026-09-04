import { sql } from "drizzle-orm";
import {
	check,
	date,
	foreignKey,
	index,
	numeric,
	pgTable,
	text,
	unique,
	uuid,
} from "drizzle-orm/pg-core";
import { organization } from "./auth.generated.ts";
import {
	createdAtColumn,
	currencyCheck,
	statusCheck,
	updatedAtColumn,
} from "./columns.ts";

export const schoolStatuses = [
	"onboarding",
	"active",
	"suspended",
	"cancelled",
] as const;
export type SchoolStatus = (typeof schoolStatuses)[number];

export const billingContractStatuses = [
	"draft",
	"confirmed",
	"cancelled",
] as const;
export type BillingContractStatus = (typeof billingContractStatuses)[number];

export const school = pgTable(
	"school",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		organizationId: uuid("organization_id").notNull(),
		legalName: text("legal_name").notNull(),
		commercialName: text("commercial_name").notNull(),
		ruc: text("ruc"),
		modularCode: text("modular_code"),
		contactEmail: text("contact_email"),
		contactPhone: text("contact_phone"),
		addressLine: text("address_line"),
		district: text("district"),
		province: text("province"),
		department: text("department"),
		countryCode: text("country_code").notNull().default("PE"),
		timezone: text("timezone").notNull().default("America/Lima"),
		currencyCode: text("currency_code").notNull().default("PEN"),
		status: text("status")
			.$type<SchoolStatus>()
			.notNull()
			.default("onboarding"),
		statusBeforeSuspend: text("status_before_suspend").$type<
			"onboarding" | "active"
		>(),
		createdAt: createdAtColumn(),
		updatedAt: updatedAtColumn(),
	},
	(table) => [
		foreignKey({
			name: "school_organization_fk",
			columns: [table.organizationId],
			foreignColumns: [organization.id],
		}).onDelete("restrict"),
		unique("school_organization_id_unique").on(table.organizationId),
		check(
			"school_ruc_check",
			sql`${table.ruc} is null or ${table.ruc} ~ '^[0-9]{11}$'`,
		),
		check(
			"school_country_code_check",
			sql`${table.countryCode} ~ '^[A-Z]{2}$'`,
		),
		check("school_currency_code_check", currencyCheck(table.currencyCode)),
		check("school_status_check", statusCheck(table.status, schoolStatuses)),
		check(
			"school_status_before_suspend_check",
			sql`${table.statusBeforeSuspend} is null or ${table.statusBeforeSuspend} in ('onboarding', 'active')`,
		),
		index("school_status_idx").on(table.status),
		index("school_ruc_idx").on(table.ruc),
		index("school_modular_code_idx").on(table.modularCode),
		index("school_created_at_idx").on(table.createdAt),
	],
);

export const billingContract = pgTable(
	"billing_contract",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		schoolId: uuid("school_id").notNull(),
		status: text("status")
			.$type<BillingContractStatus>()
			.notNull()
			.default("draft"),
		pricePerActiveStudent: numeric("price_per_active_student", {
			precision: 12,
			scale: 2,
		}).notNull(),
		minimumMonthlyAmount: numeric("minimum_monthly_amount", {
			precision: 12,
			scale: 2,
		}),
		currencyCode: text("currency_code").notNull(),
		startsOn: date("starts_on", { mode: "string" }).notNull(),
		endsOn: date("ends_on", { mode: "string" }),
		notes: text("notes"),
		createdAt: createdAtColumn(),
		updatedAt: updatedAtColumn(),
	},
	(table) => [
		foreignKey({
			name: "billing_contract_school_fk",
			columns: [table.schoolId],
			foreignColumns: [school.id],
		}).onDelete("restrict"),
		unique("school_school_id_unique").on(table.schoolId, table.id),
		check(
			"billing_contract_price_check",
			sql`${table.pricePerActiveStudent} >= 0`,
		),
		check(
			"billing_contract_minimum_check",
			sql`${table.minimumMonthlyAmount} is null or ${table.minimumMonthlyAmount} >= 0`,
		),
		check(
			"billing_contract_period_check",
			sql`${table.endsOn} is null or ${table.endsOn} > ${table.startsOn}`,
		),
		check("billing_contract_currency_check", currencyCheck(table.currencyCode)),
		check(
			"billing_contract_status_check",
			statusCheck(table.status, billingContractStatuses),
		),
		index("billing_contract_school_period_idx").on(
			table.schoolId,
			table.startsOn,
			table.endsOn,
		),
	],
);
