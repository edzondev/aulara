import { relations } from "drizzle-orm";
import {
	academicLevel,
	academicYear,
	enrollment,
	grade,
	guardian,
	section,
	student,
	studentGuardian,
} from "./academics.ts";
import {
	charge,
	payment,
	paymentAllocation,
	studentDiscount,
	tuitionRate,
} from "./finance.ts";
import { billingContract, school } from "./schools.ts";

export const schoolRelations = relations(school, ({ many }) => ({
	billingContracts: many(billingContract),
	academicYears: many(academicYear),
	academicLevels: many(academicLevel),
	students: many(student),
	guardians: many(guardian),
}));

export const billingContractRelations = relations(
	billingContract,
	({ one }) => ({
		school: one(school, {
			fields: [billingContract.schoolId],
			references: [school.id],
		}),
	}),
);

export const academicYearRelations = relations(
	academicYear,
	({ one, many }) => ({
		school: one(school, {
			fields: [academicYear.schoolId],
			references: [school.id],
		}),
		sections: many(section),
		enrollments: many(enrollment),
		tuitionRates: many(tuitionRate),
		studentDiscounts: many(studentDiscount),
		charges: many(charge),
	}),
);

export const academicLevelRelations = relations(
	academicLevel,
	({ one, many }) => ({
		school: one(school, {
			fields: [academicLevel.schoolId],
			references: [school.id],
		}),
		grades: many(grade),
	}),
);

export const gradeRelations = relations(grade, ({ one, many }) => ({
	school: one(school, {
		fields: [grade.schoolId],
		references: [school.id],
	}),
	academicLevel: one(academicLevel, {
		fields: [grade.schoolId, grade.academicLevelId],
		references: [academicLevel.schoolId, academicLevel.id],
	}),
	sections: many(section),
	tuitionRates: many(tuitionRate),
}));

export const sectionRelations = relations(section, ({ one, many }) => ({
	school: one(school, {
		fields: [section.schoolId],
		references: [school.id],
	}),
	academicYear: one(academicYear, {
		fields: [section.schoolId, section.academicYearId],
		references: [academicYear.schoolId, academicYear.id],
	}),
	grade: one(grade, {
		fields: [section.schoolId, section.gradeId],
		references: [grade.schoolId, grade.id],
	}),
	enrollments: many(enrollment),
}));

export const studentRelations = relations(student, ({ one, many }) => ({
	school: one(school, {
		fields: [student.schoolId],
		references: [school.id],
	}),
	guardians: many(studentGuardian),
	enrollments: many(enrollment),
	discounts: many(studentDiscount),
}));

export const guardianRelations = relations(guardian, ({ one, many }) => ({
	school: one(school, {
		fields: [guardian.schoolId],
		references: [school.id],
	}),
	students: many(studentGuardian),
}));

export const studentGuardianRelations = relations(
	studentGuardian,
	({ one }) => ({
		student: one(student, {
			fields: [studentGuardian.schoolId, studentGuardian.studentId],
			references: [student.schoolId, student.id],
		}),
		guardian: one(guardian, {
			fields: [studentGuardian.schoolId, studentGuardian.guardianId],
			references: [guardian.schoolId, guardian.id],
		}),
	}),
);

export const enrollmentRelations = relations(enrollment, ({ one, many }) => ({
	school: one(school, {
		fields: [enrollment.schoolId],
		references: [school.id],
	}),
	student: one(student, {
		fields: [enrollment.schoolId, enrollment.studentId],
		references: [student.schoolId, student.id],
	}),
	academicYear: one(academicYear, {
		fields: [enrollment.schoolId, enrollment.academicYearId],
		references: [academicYear.schoolId, academicYear.id],
	}),
	section: one(section, {
		fields: [
			enrollment.schoolId,
			enrollment.academicYearId,
			enrollment.sectionId,
		],
		references: [section.schoolId, section.academicYearId, section.id],
	}),
	charges: many(charge),
}));

export const tuitionRateRelations = relations(tuitionRate, ({ one, many }) => ({
	school: one(school, {
		fields: [tuitionRate.schoolId],
		references: [school.id],
	}),
	academicYear: one(academicYear, {
		fields: [tuitionRate.schoolId, tuitionRate.academicYearId],
		references: [academicYear.schoolId, academicYear.id],
	}),
	grade: one(grade, {
		fields: [tuitionRate.schoolId, tuitionRate.gradeId],
		references: [grade.schoolId, grade.id],
	}),
	charges: many(charge),
}));

export const studentDiscountRelations = relations(
	studentDiscount,
	({ one }) => ({
		school: one(school, {
			fields: [studentDiscount.schoolId],
			references: [school.id],
		}),
		student: one(student, {
			fields: [studentDiscount.schoolId, studentDiscount.studentId],
			references: [student.schoolId, student.id],
		}),
		academicYear: one(academicYear, {
			fields: [studentDiscount.schoolId, studentDiscount.academicYearId],
			references: [academicYear.schoolId, academicYear.id],
		}),
	}),
);

export const chargeRelations = relations(charge, ({ one, many }) => ({
	school: one(school, {
		fields: [charge.schoolId],
		references: [school.id],
	}),
	academicYear: one(academicYear, {
		fields: [charge.schoolId, charge.academicYearId],
		references: [academicYear.schoolId, academicYear.id],
	}),
	enrollment: one(enrollment, {
		fields: [charge.schoolId, charge.enrollmentId],
		references: [enrollment.schoolId, enrollment.id],
	}),
	tuitionRate: one(tuitionRate, {
		fields: [charge.schoolId, charge.tuitionRateId],
		references: [tuitionRate.schoolId, tuitionRate.id],
	}),
	allocations: many(paymentAllocation),
}));

export const paymentRelations = relations(payment, ({ one, many }) => ({
	school: one(school, {
		fields: [payment.schoolId],
		references: [school.id],
	}),
	allocations: many(paymentAllocation),
}));

export const paymentAllocationRelations = relations(
	paymentAllocation,
	({ one }) => ({
		school: one(school, {
			fields: [paymentAllocation.schoolId],
			references: [school.id],
		}),
		payment: one(payment, {
			fields: [paymentAllocation.schoolId, paymentAllocation.paymentId],
			references: [payment.schoolId, payment.id],
		}),
		charge: one(charge, {
			fields: [paymentAllocation.schoolId, paymentAllocation.chargeId],
			references: [charge.schoolId, charge.id],
		}),
	}),
);
