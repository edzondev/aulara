import { sql } from "drizzle-orm";
import {
	check,
	date,
	foreignKey,
	index,
	integer,
	numeric,
	pgTable,
	text,
	timestamp,
	unique,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { academicYear, enrollment, grade, student } from "./academics.ts";
import { user } from "./auth.generated.ts";
import {
	createdAtColumn,
	currencyCheck,
	statusCheck,
	updatedAtColumn,
} from "./columns.ts";
import { school } from "./schools.ts";

export const discountTypes = ["percentage", "fixed"] as const;
export type DiscountType = (typeof discountTypes)[number];

export const chargeTypes = ["tuition"] as const;
export type ChargeType = (typeof chargeTypes)[number];

export const paymentMethods = [
	"cash",
	"bank_transfer",
	"card",
	"wallet",
	"other",
] as const;
export type PaymentMethod = (typeof paymentMethods)[number];

export const tuitionRate = pgTable(
	"tuition_rate",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		schoolId: uuid("school_id").notNull(),
		academicYearId: uuid("academic_year_id").notNull(),
		gradeId: uuid("grade_id"),
		amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
		currencyCode: text("currency_code").notNull(),
		dueDay: integer("due_day").notNull(),
		createdAt: createdAtColumn(),
		updatedAt: updatedAtColumn(),
	},
	(table) => [
		foreignKey({
			name: "tuition_rate_school_year_fk",
			columns: [table.schoolId, table.academicYearId],
			foreignColumns: [academicYear.schoolId, academicYear.id],
		}).onDelete("restrict"),
		foreignKey({
			name: "tuition_rate_school_grade_fk",
			columns: [table.schoolId, table.gradeId],
			foreignColumns: [grade.schoolId, grade.id],
		}).onDelete("restrict"),
		unique("tuition_rate_school_id_unique").on(table.schoolId, table.id),
		unique("tuition_rate_school_year_id_unique").on(
			table.schoolId,
			table.academicYearId,
			table.id,
		),
		check("tuition_rate_amount_check", sql`${table.amount} >= 0`),
		check("tuition_rate_due_day_check", sql`${table.dueDay} between 1 and 31`),
		check("tuition_rate_currency_check", currencyCheck(table.currencyCode)),
		uniqueIndex("tuition_rate_one_general_per_year_idx")
			.on(table.schoolId, table.academicYearId)
			.where(sql`${table.gradeId} is null`),
		uniqueIndex("tuition_rate_one_per_grade_idx")
			.on(table.schoolId, table.academicYearId, table.gradeId)
			.where(sql`${table.gradeId} is not null`),
		index("tuition_rate_school_year_grade_idx").on(
			table.schoolId,
			table.academicYearId,
			table.gradeId,
		),
	],
);

export const studentDiscount = pgTable(
	"student_discount",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		schoolId: uuid("school_id").notNull(),
		studentId: uuid("student_id").notNull(),
		academicYearId: uuid("academic_year_id").notNull(),
		type: text("type").$type<DiscountType>().notNull(),
		value: numeric("value", { precision: 12, scale: 2 }).notNull(),
		currencyCode: text("currency_code"),
		reason: text("reason").notNull(),
		startsOn: date("starts_on", { mode: "string" }),
		endsOn: date("ends_on", { mode: "string" }),
		cancelledAt: timestamp("cancelled_at", {
			withTimezone: true,
			mode: "date",
		}),
		cancelledByUserId: uuid("cancelled_by_user_id"),
		createdByUserId: uuid("created_by_user_id").notNull(),
		createdAt: createdAtColumn(),
		updatedAt: updatedAtColumn(),
	},
	(table) => [
		foreignKey({
			name: "student_discount_student_fk",
			columns: [table.schoolId, table.studentId],
			foreignColumns: [student.schoolId, student.id],
		}).onDelete("restrict"),
		foreignKey({
			name: "student_discount_academic_year_fk",
			columns: [table.schoolId, table.academicYearId],
			foreignColumns: [academicYear.schoolId, academicYear.id],
		}).onDelete("restrict"),
		foreignKey({
			name: "student_discount_created_by_fk",
			columns: [table.createdByUserId],
			foreignColumns: [user.id],
		}).onDelete("restrict"),
		foreignKey({
			name: "student_discount_cancelled_by_fk",
			columns: [table.cancelledByUserId],
			foreignColumns: [user.id],
		}).onDelete("restrict"),
		check(
			"student_discount_percentage_check",
			sql`${table.type} <> 'percentage' or (${table.value} > 0 and ${table.value} <= 100 and ${table.currencyCode} is null)`,
		),
		check(
			"student_discount_fixed_check",
			sql`${table.type} <> 'fixed' or (${table.value} > 0 and ${table.currencyCode} is not null)`,
		),
		check(
			"student_discount_period_check",
			sql`${table.endsOn} is null or ${table.startsOn} is null or ${table.endsOn} > ${table.startsOn}`,
		),
		check(
			"student_discount_currency_check",
			sql`${table.currencyCode} is null or ${table.currencyCode} ~ '^[A-Z]{3}$'`,
		),
		index("student_discount_school_student_year_idx").on(
			table.schoolId,
			table.studentId,
			table.academicYearId,
		),
		index("student_discount_active_idx")
			.on(table.schoolId, table.studentId, table.academicYearId)
			.where(sql`${table.cancelledAt} is null`),
	],
);

export const charge = pgTable(
	"charge",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		schoolId: uuid("school_id").notNull(),
		academicYearId: uuid("academic_year_id").notNull(),
		enrollmentId: uuid("enrollment_id").notNull(),
		tuitionRateId: uuid("tuition_rate_id").notNull(),
		type: text("type").$type<ChargeType>().notNull().default("tuition"),
		billingPeriod: date("billing_period", { mode: "string" }).notNull(),
		baseAmount: numeric("base_amount", { precision: 12, scale: 2 }).notNull(),
		discountAmount: numeric("discount_amount", {
			precision: 12,
			scale: 2,
		}).notNull(),
		totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
		currencyCode: text("currency_code").notNull(),
		dueDate: date("due_date", { mode: "string" }).notNull(),
		voidedAt: timestamp("voided_at", { withTimezone: true, mode: "date" }),
		voidedByUserId: uuid("voided_by_user_id"),
		voidReason: text("void_reason"),
		createdAt: createdAtColumn(),
		updatedAt: updatedAtColumn(),
	},
	(table) => [
		foreignKey({
			name: "charge_school_year_fk",
			columns: [table.schoolId, table.academicYearId],
			foreignColumns: [academicYear.schoolId, academicYear.id],
		}).onDelete("restrict"),
		foreignKey({
			name: "charge_school_enrollment_fk",
			columns: [table.schoolId, table.enrollmentId],
			foreignColumns: [enrollment.schoolId, enrollment.id],
		}).onDelete("restrict"),
		foreignKey({
			name: "charge_school_tuition_rate_fk",
			columns: [table.schoolId, table.tuitionRateId],
			foreignColumns: [tuitionRate.schoolId, tuitionRate.id],
		}).onDelete("restrict"),
		foreignKey({
			name: "charge_voided_by_fk",
			columns: [table.voidedByUserId],
			foreignColumns: [user.id],
		}).onDelete("restrict"),
		unique("charge_school_id_unique").on(table.schoolId, table.id),
		uniqueIndex("charge_one_active_per_period_idx")
			.on(table.schoolId, table.enrollmentId, table.type, table.billingPeriod)
			.where(sql`${table.voidedAt} is null`),
		check("charge_base_amount_check", sql`${table.baseAmount} >= 0`),
		check(
			"charge_discount_amount_check",
			sql`${table.discountAmount} >= 0 and ${table.discountAmount} <= ${table.baseAmount}`,
		),
		check(
			"charge_total_amount_check",
			sql`${table.totalAmount} = ${table.baseAmount} - ${table.discountAmount}`,
		),
		check("charge_currency_check", currencyCheck(table.currencyCode)),
		check("charge_type_check", statusCheck(table.type, chargeTypes)),
		check(
			"charge_billing_period_check",
			sql`extract(day from ${table.billingPeriod}) = 1`,
		),
		check(
			"charge_void_consistency_check",
			sql`(${table.voidedAt} is null) = (${table.voidedByUserId} is null)`,
		),
		index("charge_school_enrollment_period_idx").on(
			table.schoolId,
			table.enrollmentId,
			table.billingPeriod,
		),
		index("charge_school_year_period_idx").on(
			table.schoolId,
			table.academicYearId,
			table.billingPeriod,
		),
		index("charge_school_due_date_idx")
			.on(table.schoolId, table.dueDate)
			.where(sql`${table.voidedAt} is null`),
	],
);

export const payment = pgTable(
	"payment",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		schoolId: uuid("school_id").notNull(),
		amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
		currencyCode: text("currency_code").notNull(),
		paymentMethod: text("payment_method").$type<PaymentMethod>().notNull(),
		reference: text("reference"),
		notes: text("notes"),
		paidAt: timestamp("paid_at", { withTimezone: true, mode: "date" })
			.notNull()
			.defaultNow(),
		recordedByUserId: uuid("recorded_by_user_id").notNull(),
		voidedAt: timestamp("voided_at", { withTimezone: true, mode: "date" }),
		voidedByUserId: uuid("voided_by_user_id"),
		voidReason: text("void_reason"),
		createdAt: createdAtColumn(),
		updatedAt: updatedAtColumn(),
	},
	(table) => [
		foreignKey({
			name: "payment_school_fk",
			columns: [table.schoolId],
			foreignColumns: [school.id],
		}).onDelete("restrict"),
		foreignKey({
			name: "payment_recorded_by_fk",
			columns: [table.recordedByUserId],
			foreignColumns: [user.id],
		}).onDelete("restrict"),
		foreignKey({
			name: "payment_voided_by_fk",
			columns: [table.voidedByUserId],
			foreignColumns: [user.id],
		}).onDelete("restrict"),
		unique("payment_school_id_unique").on(table.schoolId, table.id),
		check("payment_amount_check", sql`${table.amount} > 0`),
		check("payment_currency_check", currencyCheck(table.currencyCode)),
		check(
			"payment_method_check",
			statusCheck(table.paymentMethod, paymentMethods),
		),
		check(
			"payment_void_consistency_check",
			sql`(${table.voidedAt} is null) = (${table.voidedByUserId} is null)`,
		),
		index("payment_school_paid_at_idx").on(table.schoolId, table.paidAt),
		index("payment_school_reference_idx").on(table.schoolId, table.reference),
		index("payment_school_voided_at_idx").on(table.schoolId, table.voidedAt),
	],
);

export const paymentAllocation = pgTable(
	"payment_allocation",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		schoolId: uuid("school_id").notNull(),
		paymentId: uuid("payment_id").notNull(),
		chargeId: uuid("charge_id").notNull(),
		amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
		createdAt: createdAtColumn(),
	},
	(table) => [
		foreignKey({
			name: "payment_allocation_payment_fk",
			columns: [table.schoolId, table.paymentId],
			foreignColumns: [payment.schoolId, payment.id],
		}).onDelete("restrict"),
		foreignKey({
			name: "payment_allocation_charge_fk",
			columns: [table.schoolId, table.chargeId],
			foreignColumns: [charge.schoolId, charge.id],
		}).onDelete("restrict"),
		unique("payment_allocation_payment_charge_unique").on(
			table.schoolId,
			table.paymentId,
			table.chargeId,
		),
		check("payment_allocation_amount_check", sql`${table.amount} > 0`),
		index("payment_allocation_school_payment_idx").on(
			table.schoolId,
			table.paymentId,
		),
		index("payment_allocation_school_charge_idx").on(
			table.schoolId,
			table.chargeId,
		),
	],
);
