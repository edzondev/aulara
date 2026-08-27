import type { AuthorizedSchoolContext } from "@aulara/auth/types";
import { type AppDatabase, getDatabase } from "@aulara/db/client";
import {
	type ChargeType,
	charge,
	enrollment,
	section,
	studentDiscount,
} from "@aulara/db/schema";
import { and, eq, gte, isNull, lte, or } from "drizzle-orm";
import { DomainError, findPostgresErrorCode } from "../errors.ts";
import {
	applyPercentageToCents,
	formatCents,
	parseAmountToCents,
} from "./decimal.ts";
import { requireTuitionRate } from "./resolve-tuition-rate.ts";

export type MonthlyTuitionChargeInput = {
	enrollmentId: string;
	/** First day of the billing month, formatted "YYYY-MM-01". */
	billingPeriod: string;
};

export type MonthlyTuitionChargeResult = {
	charge: typeof charge.$inferSelect;
	created: boolean;
};

/**
 * Clamps the rate's due day to the last day of the billing month
 * (e.g. day 31 in April becomes 30). Integer-only date math, no floats.
 */
function formatDueDate(billingPeriod: string, dueDay: number): string {
	const year = Number(billingPeriod.slice(0, 4));
	const month = Number(billingPeriod.slice(5, 7));
	const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
	const day = Math.min(dueDay, lastDay);

	return `${billingPeriod.slice(0, 7)}-${String(day).padStart(2, "0")}`;
}

function findActiveCharge(
	tx: AppDatabase,
	schoolId: string,
	enrollmentId: string,
	billingPeriod: string,
) {
	return tx
		.select()
		.from(charge)
		.where(
			and(
				eq(charge.schoolId, schoolId),
				eq(charge.enrollmentId, enrollmentId),
				eq(charge.type, "tuition"),
				eq(charge.billingPeriod, billingPeriod),
				isNull(charge.voidedAt),
			),
		)
		.limit(1)
		.then((rows) => rows[0] ?? null);
}

/**
 * Creates the monthly tuition charge for an enrollment, idempotently.
 *
 * All reads and writes run inside ONE Drizzle transaction: the
 * enrollment is locked with SELECT ... FOR UPDATE (composite
 * schoolId + id), the section resolves to a grade, the tuition rate is
 * resolved (grade-specific first, general otherwise), active discounts
 * are applied on top of the base rate (capped at the base), and the
 * charge is inserted with the rate's currency and a due date clamped
 * to the billing month.
 *
 * If an active charge already exists for (enrollment, "tuition",
 * billingPeriod) the existing charge is returned with `created: false`.
 * A unique violation (23505) on a concurrent insert is caught and the
 * existing charge re-selected.
 */
export async function createMonthlyTuitionCharge(
	context: AuthorizedSchoolContext,
	input: MonthlyTuitionChargeInput,
): Promise<MonthlyTuitionChargeResult> {
	return getDatabase().transaction(async (tx) => {
		const [enrollmentRow] = await tx
			.select()
			.from(enrollment)
			.where(
				and(
					eq(enrollment.schoolId, context.school.id),
					eq(enrollment.id, input.enrollmentId),
				),
			)
			.for("update")
			.limit(1);

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

		const existing = await findActiveCharge(
			tx,
			context.school.id,
			input.enrollmentId,
			input.billingPeriod,
		);

		if (existing) {
			return { charge: existing, created: false };
		}

		const [sectionRow] = await tx
			.select({ gradeId: section.gradeId })
			.from(section)
			.where(
				and(
					eq(section.schoolId, context.school.id),
					eq(section.academicYearId, enrollmentRow.academicYearId),
					eq(section.id, enrollmentRow.sectionId),
				),
			)
			.limit(1);

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

		const discounts = await tx
			.select()
			.from(studentDiscount)
			.where(
				and(
					eq(studentDiscount.schoolId, context.school.id),
					eq(studentDiscount.studentId, enrollmentRow.studentId),
					eq(studentDiscount.academicYearId, enrollmentRow.academicYearId),
					isNull(studentDiscount.cancelledAt),
					or(
						isNull(studentDiscount.startsOn),
						lte(studentDiscount.startsOn, input.billingPeriod),
					),
					or(
						isNull(studentDiscount.endsOn),
						gte(studentDiscount.endsOn, input.billingPeriod),
					),
				),
			);

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
			const [chargeRow] = await tx
				.insert(charge)
				.values({
					schoolId: context.school.id,
					academicYearId: enrollmentRow.academicYearId,
					enrollmentId: enrollmentRow.id,
					tuitionRateId: rate.id,
					type: "tuition" satisfies ChargeType,
					billingPeriod: input.billingPeriod,
					baseAmount: formatCents(baseCents),
					discountAmount: formatCents(discountCents),
					totalAmount: formatCents(totalCents),
					currencyCode: rate.currencyCode,
					dueDate: formatDueDate(input.billingPeriod, rate.dueDay),
				})
				.returning();

			if (!chargeRow) {
				throw new DomainError(
					"CHARGE_NOT_FOUND",
					"The tuition charge could not be created",
					500,
				);
			}

			return { charge: chargeRow, created: true };
		} catch (error) {
			// 23505 = unique_violation on the partial unique index
			// charge_one_active_per_period_idx: another transaction inserted
			// the charge first. Re-read and return it.
			if (findPostgresErrorCode(error) === "23505") {
				const raced = await findActiveCharge(
					tx,
					context.school.id,
					input.enrollmentId,
					input.billingPeriod,
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
