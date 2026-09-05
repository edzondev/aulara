import type { AuthorizedSchoolContext } from "@aulara/auth/types";
import { getDatabase } from "@aulara/db/client";
import {
	findSectionGradeId,
	listActiveStudentDiscounts,
	lockEnrollmentForUpdate,
} from "@aulara/db/queries/academics";
import {
	findActiveTuitionCharge,
	insertTuitionCharge,
} from "@aulara/db/queries/charges";
import { formatDueDate } from "../calendar.ts";
import { DomainError, findPostgresErrorCode } from "../errors.ts";
import { parseDomainInput } from "../parse.ts";
import { monthlyTuitionChargeSchema } from "./create-tuition-charge-schema.ts";
import {
	applyPercentageToCents,
	formatCents,
	parseAmountToCents,
} from "./decimal.ts";
import { requireTuitionRate } from "./resolve-tuition-rate.ts";

export type MonthlyTuitionChargeInput = {
	enrollmentId: string;
	billingPeriod: string;
};

export type MonthlyTuitionChargeResult = {
	charge: NonNullable<Awaited<ReturnType<typeof insertTuitionCharge>>>;
	created: boolean;
};

export async function createMonthlyTuitionCharge(
	context: AuthorizedSchoolContext,
	input: MonthlyTuitionChargeInput,
): Promise<MonthlyTuitionChargeResult> {
	const parsed = parseDomainInput(
		monthlyTuitionChargeSchema,
		input,
		"The tuition charge input is invalid",
	);

	return getDatabase().transaction(async (tx) => {
		const enrollmentRow = await lockEnrollmentForUpdate(
			tx,
			context.school.id,
			parsed.enrollmentId,
		);

		if (!enrollmentRow) {
			throw new DomainError(
				"ENROLLMENT_NOT_FOUND",
				"The enrollment does not exist in this school",
				404,
			);
		}

		if (enrollmentRow.status !== "enrolled") {
			throw new DomainError(
				"ENROLLMENT_NOT_ENROLLED",
				`The enrollment status is "${enrollmentRow.status}"; charges can only be created for enrolled students`,
				409,
			);
		}

		const existing = await findActiveTuitionCharge(
			tx,
			context.school.id,
			parsed.enrollmentId,
			parsed.billingPeriod,
		);

		if (existing) {
			return { charge: existing, created: false };
		}

		const sectionRow = await findSectionGradeId(
			tx,
			context.school.id,
			enrollmentRow.academicYearId,
			enrollmentRow.sectionId,
		);

		if (!sectionRow) {
			throw new DomainError(
				"SECTION_NOT_FOUND",
				"The enrollment section does not exist for the academic year",
				404,
			);
		}

		const rate = await requireTuitionRate(
			tx,
			context.school.id,
			enrollmentRow.academicYearId,
			sectionRow.gradeId,
		);

		const baseCents = parseAmountToCents(rate.amount);
		const discounts = await listActiveStudentDiscounts(tx, {
			schoolId: context.school.id,
			studentId: enrollmentRow.studentId,
			academicYearId: enrollmentRow.academicYearId,
			onDate: parsed.billingPeriod,
		});

		let discountCents = 0n;

		for (const discount of discounts) {
			discountCents +=
				discount.type === "percentage"
					? applyPercentageToCents(baseCents, discount.value)
					: parseAmountToCents(discount.value);
		}

		if (discountCents > baseCents) {
			discountCents = baseCents;
		}

		const totalCents = baseCents - discountCents;

		try {
			const chargeRow = await insertTuitionCharge(tx, {
				schoolId: context.school.id,
				academicYearId: enrollmentRow.academicYearId,
				enrollmentId: enrollmentRow.id,
				tuitionRateId: rate.id,
				type: "tuition",
				billingPeriod: parsed.billingPeriod,
				baseAmount: formatCents(baseCents),
				discountAmount: formatCents(discountCents),
				totalAmount: formatCents(totalCents),
				currencyCode: rate.currencyCode,
				dueDate: formatDueDate(parsed.billingPeriod, rate.dueDay),
			});

			if (!chargeRow) {
				throw new DomainError(
					"INTERNAL",
					"The tuition charge could not be created",
					500,
				);
			}

			return { charge: chargeRow, created: true };
		} catch (error) {
			if (findPostgresErrorCode(error) === "23505") {
				const raced = await findActiveTuitionCharge(
					tx,
					context.school.id,
					parsed.enrollmentId,
					parsed.billingPeriod,
				);

				if (raced) {
					return { charge: raced, created: false };
				}

				throw new DomainError(
					"CHARGE_ALREADY_EXISTS",
					"An active tuition charge already exists for the enrollment and billing period",
					409,
				);
			}

			throw error;
		}
	});
}
