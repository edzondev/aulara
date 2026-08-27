import { and, eq, isNull } from "drizzle-orm";
import type { AppDatabase } from "../client.ts";
import { tuitionRate } from "../schema/finance.ts";

/**
 * Resolves the tuition rate for an academic year with the documented
 * precedence:
 * 1. the grade-specific rate when one exists,
 * 2. the general year rate otherwise,
 * 3. null when neither exists.
 */
export async function findTuitionRate(
	db: AppDatabase,
	schoolId: string,
	academicYearId: string,
	gradeId: string | null,
) {
	if (gradeId !== null) {
		const [specific] = await db
			.select()
			.from(tuitionRate)
			.where(
				and(
					eq(tuitionRate.schoolId, schoolId),
					eq(tuitionRate.academicYearId, academicYearId),
					eq(tuitionRate.gradeId, gradeId),
				),
			)
			.limit(1);

		if (specific) {
			return specific;
		}
	}

	const [general] = await db
		.select()
		.from(tuitionRate)
		.where(
			and(
				eq(tuitionRate.schoolId, schoolId),
				eq(tuitionRate.academicYearId, academicYearId),
				isNull(tuitionRate.gradeId),
			),
		)
		.limit(1);

	return general ?? null;
}
