import type { AuthorizedSchoolContext } from "@aulara/auth/types";
import { type AppDatabase, getDatabase } from "@aulara/db/client";
import { findTuitionRate } from "@aulara/db/queries/tuition-rates";
import type { tuitionRate } from "@aulara/db/schema";
import { DomainError } from "../errors.ts";

export type TuitionRate = typeof tuitionRate.$inferSelect;

export type ResolveTuitionRateInput = {
	academicYearId: string;
	gradeId?: string | null;
};

/**
 * Resolves the tuition rate for the authorized school (grade-specific
 * first, general year rate otherwise) or throws
 * `TUITION_RATE_NOT_FOUND` with a message that states which level was
 * requested.
 */
export async function requireTuitionRate(
	db: AppDatabase,
	schoolId: string,
	academicYearId: string,
	gradeId: string | null,
): Promise<TuitionRate> {
	const rate = await findTuitionRate(db, schoolId, academicYearId, gradeId);

	if (!rate) {
		throw new DomainError(
			"TUITION_RATE_NOT_FOUND",
			gradeId === null
				? "No general tuition rate is configured for the academic year"
				: "No tuition rate is configured for the grade and no general rate exists for the academic year",
			404,
		);
	}

	return rate;
}

export async function resolveTuitionRate(
	context: AuthorizedSchoolContext,
	input: ResolveTuitionRateInput,
): Promise<TuitionRate> {
	return requireTuitionRate(
		getDatabase(),
		context.school.id,
		input.academicYearId,
		input.gradeId ?? null,
	);
}
