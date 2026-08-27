import { sql } from "drizzle-orm";
import {
	boolean,
	check,
	date,
	foreignKey,
	index,
	integer,
	pgTable,
	text,
	unique,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { createdAtColumn, statusCheck, updatedAtColumn } from "./columns.ts";
import { school } from "./schools.ts";

export const academicYearStatuses = ["draft", "active", "closed"] as const;
export type AcademicYearStatus = (typeof academicYearStatuses)[number];

export const studentStatuses = [
	"active",
	"inactive",
	"graduated",
	"withdrawn",
] as const;
export type StudentStatus = (typeof studentStatuses)[number];

export const enrollmentStatuses = [
	"pending",
	"enrolled",
	"withdrawn",
	"completed",
	"cancelled",
] as const;
export type EnrollmentStatus = (typeof enrollmentStatuses)[number];

export const academicYear = pgTable(
	"academic_year",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		schoolId: uuid("school_id").notNull(),
		name: text("name").notNull(),
		startsOn: date("starts_on", { mode: "string" }).notNull(),
		endsOn: date("ends_on", { mode: "string" }).notNull(),
		status: text("status")
			.$type<AcademicYearStatus>()
			.notNull()
			.default("draft"),
		createdAt: createdAtColumn(),
		updatedAt: updatedAtColumn(),
	},
	(table) => [
		foreignKey({
			name: "academic_year_school_fk",
			columns: [table.schoolId],
			foreignColumns: [school.id],
		}).onDelete("restrict"),
		unique("academic_year_school_id_unique").on(table.schoolId, table.id),
		unique("academic_year_school_name_unique").on(table.schoolId, table.name),
		check(
			"academic_year_period_check",
			sql`${table.endsOn} > ${table.startsOn}`,
		),
		check(
			"academic_year_status_check",
			statusCheck(table.status, academicYearStatuses),
		),
		uniqueIndex("academic_year_one_active_idx")
			.on(table.schoolId)
			.where(sql`${table.status} = 'active'`),
		index("academic_year_school_status_idx").on(table.schoolId, table.status),
		index("academic_year_school_dates_idx").on(
			table.schoolId,
			table.startsOn,
			table.endsOn,
		),
	],
);

export const academicLevel = pgTable(
	"academic_level",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		schoolId: uuid("school_id").notNull(),
		name: text("name").notNull(),
		sortOrder: integer("sort_order").notNull().default(0),
		isActive: boolean("is_active").notNull().default(true),
		createdAt: createdAtColumn(),
		updatedAt: updatedAtColumn(),
	},
	(table) => [
		foreignKey({
			name: "academic_level_school_fk",
			columns: [table.schoolId],
			foreignColumns: [school.id],
		}).onDelete("restrict"),
		unique("academic_level_school_id_unique").on(table.schoolId, table.id),
		unique("academic_level_school_name_unique").on(table.schoolId, table.name),
		check("academic_level_sort_order_check", sql`${table.sortOrder} >= 0`),
		index("academic_level_school_sort_idx").on(table.schoolId, table.sortOrder),
	],
);

export const grade = pgTable(
	"grade",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		schoolId: uuid("school_id").notNull(),
		academicLevelId: uuid("academic_level_id").notNull(),
		name: text("name").notNull(),
		sortOrder: integer("sort_order").notNull().default(0),
		isActive: boolean("is_active").notNull().default(true),
		createdAt: createdAtColumn(),
		updatedAt: updatedAtColumn(),
	},
	(table) => [
		foreignKey({
			name: "grade_school_level_fk",
			columns: [table.schoolId, table.academicLevelId],
			foreignColumns: [academicLevel.schoolId, academicLevel.id],
		}).onDelete("restrict"),
		unique("grade_school_id_unique").on(table.schoolId, table.id),
		unique("grade_school_level_name_unique").on(
			table.schoolId,
			table.academicLevelId,
			table.name,
		),
		check("grade_sort_order_check", sql`${table.sortOrder} >= 0`),
		index("grade_school_level_sort_idx").on(
			table.schoolId,
			table.academicLevelId,
			table.sortOrder,
		),
	],
);

export const section = pgTable(
	"section",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		schoolId: uuid("school_id").notNull(),
		academicYearId: uuid("academic_year_id").notNull(),
		gradeId: uuid("grade_id").notNull(),
		name: text("name").notNull(),
		capacity: integer("capacity"),
		isActive: boolean("is_active").notNull().default(true),
		createdAt: createdAtColumn(),
		updatedAt: updatedAtColumn(),
	},
	(table) => [
		foreignKey({
			name: "section_school_year_fk",
			columns: [table.schoolId, table.academicYearId],
			foreignColumns: [academicYear.schoolId, academicYear.id],
		}).onDelete("restrict"),
		foreignKey({
			name: "section_school_grade_fk",
			columns: [table.schoolId, table.gradeId],
			foreignColumns: [grade.schoolId, grade.id],
		}).onDelete("restrict"),
		unique("section_school_id_unique").on(table.schoolId, table.id),
		unique("section_school_year_id_unique").on(
			table.schoolId,
			table.academicYearId,
			table.id,
		),
		unique("section_school_year_grade_name_unique").on(
			table.schoolId,
			table.academicYearId,
			table.gradeId,
			table.name,
		),
		check(
			"section_capacity_check",
			sql`${table.capacity} is null or ${table.capacity} > 0`,
		),
		index("section_school_year_grade_idx").on(
			table.schoolId,
			table.academicYearId,
			table.gradeId,
		),
	],
);

export const student = pgTable(
	"student",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		schoolId: uuid("school_id").notNull(),
		studentCode: text("student_code"),
		firstNames: text("first_names").notNull(),
		paternalLastName: text("paternal_last_name").notNull(),
		maternalLastName: text("maternal_last_name"),
		documentType: text("document_type"),
		documentNumber: text("document_number"),
		birthDate: date("birth_date", { mode: "string" }),
		status: text("status").$type<StudentStatus>().notNull().default("active"),
		createdAt: createdAtColumn(),
		updatedAt: updatedAtColumn(),
	},
	(table) => [
		foreignKey({
			name: "student_school_fk",
			columns: [table.schoolId],
			foreignColumns: [school.id],
		}).onDelete("restrict"),
		unique("student_school_id_unique").on(table.schoolId, table.id),
		uniqueIndex("student_school_code_idx")
			.on(table.schoolId, table.studentCode)
			.where(sql`${table.studentCode} is not null`),
		uniqueIndex("student_school_document_idx")
			.on(table.schoolId, table.documentType, table.documentNumber)
			.where(
				sql`${table.documentType} is not null and ${table.documentNumber} is not null`,
			),
		check(
			"student_document_pair_check",
			sql`(${table.documentType} is null) = (${table.documentNumber} is null)`,
		),
		check("student_status_check", statusCheck(table.status, studentStatuses)),
		index("student_school_status_idx").on(table.schoolId, table.status),
		index("student_school_last_names_idx").on(
			table.schoolId,
			table.paternalLastName,
			table.maternalLastName,
		),
	],
);

export const guardian = pgTable(
	"guardian",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		schoolId: uuid("school_id").notNull(),
		firstNames: text("first_names").notNull(),
		paternalLastName: text("paternal_last_name").notNull(),
		maternalLastName: text("maternal_last_name"),
		documentType: text("document_type"),
		documentNumber: text("document_number"),
		email: text("email"),
		phone: text("phone"),
		isActive: boolean("is_active").notNull().default(true),
		createdAt: createdAtColumn(),
		updatedAt: updatedAtColumn(),
	},
	(table) => [
		foreignKey({
			name: "guardian_school_fk",
			columns: [table.schoolId],
			foreignColumns: [school.id],
		}).onDelete("restrict"),
		unique("guardian_school_id_unique").on(table.schoolId, table.id),
		uniqueIndex("guardian_school_document_idx")
			.on(table.schoolId, table.documentType, table.documentNumber)
			.where(
				sql`${table.documentType} is not null and ${table.documentNumber} is not null`,
			),
		check(
			"guardian_document_pair_check",
			sql`(${table.documentType} is null) = (${table.documentNumber} is null)`,
		),
		index("guardian_school_email_idx").on(table.schoolId, table.email),
		index("guardian_school_phone_idx").on(table.schoolId, table.phone),
	],
);

export const studentGuardian = pgTable(
	"student_guardian",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		schoolId: uuid("school_id").notNull(),
		studentId: uuid("student_id").notNull(),
		guardianId: uuid("guardian_id").notNull(),
		relationship: text("relationship").notNull(),
		isPrimary: boolean("is_primary").notNull().default(false),
		isFinancialResponsible: boolean("is_financial_responsible")
			.notNull()
			.default(false),
		createdAt: createdAtColumn(),
		updatedAt: updatedAtColumn(),
	},
	(table) => [
		foreignKey({
			name: "student_guardian_student_fk",
			columns: [table.schoolId, table.studentId],
			foreignColumns: [student.schoolId, student.id],
		}).onDelete("cascade"),
		foreignKey({
			name: "student_guardian_guardian_fk",
			columns: [table.schoolId, table.guardianId],
			foreignColumns: [guardian.schoolId, guardian.id],
		}).onDelete("cascade"),
		unique("student_guardian_pair_unique").on(
			table.schoolId,
			table.studentId,
			table.guardianId,
		),
		uniqueIndex("student_guardian_one_primary_idx")
			.on(table.schoolId, table.studentId)
			.where(sql`${table.isPrimary} = true`),
		index("student_guardian_school_guardian_idx").on(
			table.schoolId,
			table.guardianId,
		),
	],
);

export const enrollment = pgTable(
	"enrollment",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		schoolId: uuid("school_id").notNull(),
		studentId: uuid("student_id").notNull(),
		academicYearId: uuid("academic_year_id").notNull(),
		sectionId: uuid("section_id").notNull(),
		status: text("status")
			.$type<EnrollmentStatus>()
			.notNull()
			.default("pending"),
		enrolledOn: date("enrolled_on", { mode: "string" }).notNull(),
		endedOn: date("ended_on", { mode: "string" }),
		createdAt: createdAtColumn(),
		updatedAt: updatedAtColumn(),
	},
	(table) => [
		foreignKey({
			name: "enrollment_student_fk",
			columns: [table.schoolId, table.studentId],
			foreignColumns: [student.schoolId, student.id],
		}).onDelete("restrict"),
		foreignKey({
			name: "enrollment_academic_year_fk",
			columns: [table.schoolId, table.academicYearId],
			foreignColumns: [academicYear.schoolId, academicYear.id],
		}).onDelete("restrict"),
		foreignKey({
			name: "enrollment_section_fk",
			columns: [table.schoolId, table.academicYearId, table.sectionId],
			foreignColumns: [section.schoolId, section.academicYearId, section.id],
		}).onDelete("restrict"),
		unique("enrollment_school_id_unique").on(table.schoolId, table.id),
		unique("enrollment_school_year_id_unique").on(
			table.schoolId,
			table.academicYearId,
			table.id,
		),
		unique("enrollment_school_student_year_unique").on(
			table.schoolId,
			table.studentId,
			table.academicYearId,
		),
		check(
			"enrollment_period_check",
			sql`${table.endedOn} is null or ${table.endedOn} >= ${table.enrolledOn}`,
		),
		check(
			"enrollment_status_check",
			statusCheck(table.status, enrollmentStatuses),
		),
		index("enrollment_school_year_status_idx").on(
			table.schoolId,
			table.academicYearId,
			table.status,
		),
		index("enrollment_school_section_idx").on(table.schoolId, table.sectionId),
		index("enrollment_school_student_idx").on(table.schoolId, table.studentId),
	],
);
