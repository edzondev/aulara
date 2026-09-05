import { and, eq, gte, isNull, lte, or } from "drizzle-orm";
import type { AppDatabase } from "../client.ts";
import { enrollment, section } from "../schema/academics.ts";
import { studentDiscount } from "../schema/finance.ts";

export async function lockEnrollmentForUpdate(
	db: AppDatabase,
	schoolId: string,
	enrollmentId: string,
) {
	const [row] = await db
		.select()
		.from(enrollment)
		.where(
			and(eq(enrollment.schoolId, schoolId), eq(enrollment.id, enrollmentId)),
		)
		.for("update")
		.limit(1);

	return row ?? null;
}

export async function findSectionGradeId(
	db: AppDatabase,
	schoolId: string,
	academicYearId: string,
	sectionId: string,
) {
	const [row] = await db
		.select({ gradeId: section.gradeId })
		.from(section)
		.where(
			and(
				eq(section.schoolId, schoolId),
				eq(section.academicYearId, academicYearId),
				eq(section.id, sectionId),
			),
		)
		.limit(1);

	return row ?? null;
}

export function listActiveStudentDiscounts(
	db: AppDatabase,
	input: {
		schoolId: string;
		studentId: string;
		academicYearId: string;
		onDate: string;
	},
) {
	return db
		.select()
		.from(studentDiscount)
		.where(
			and(
				eq(studentDiscount.schoolId, input.schoolId),
				eq(studentDiscount.studentId, input.studentId),
				eq(studentDiscount.academicYearId, input.academicYearId),
				isNull(studentDiscount.cancelledAt),
				or(
					isNull(studentDiscount.startsOn),
					lte(studentDiscount.startsOn, input.onDate),
				),
				or(
					isNull(studentDiscount.endsOn),
					gte(studentDiscount.endsOn, input.onDate),
				),
			),
		);
}
