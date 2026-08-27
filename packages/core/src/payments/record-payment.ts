import type { AuthorizedSchoolContext } from "@aulara/auth/types";
import { type AppDatabase, getDatabase } from "@aulara/db/client";
import type { PaymentMethod } from "@aulara/db/schema";
import { charge, payment, paymentAllocation } from "@aulara/db/schema";
import { and, eq, isNull, sql } from "drizzle-orm";
import { DomainError } from "../errors.ts";
import { formatCents, parseAmountToCents } from "../tuition/decimal.ts";

export type PaymentAllocationInput = {
	chargeId: string;
	amount: string;
};

export type RecordPaymentInput = {
	amount: string;
	currencyCode: string;
	paymentMethod: PaymentMethod;
	reference?: string;
	notes?: string;
	paidAt?: Date;
	recordedByUserId: string;
	allocations: PaymentAllocationInput[];
};

export type Payment = typeof payment.$inferSelect;

/**
 * Sums the allocations a charge has received from non-voided payments.
 */
async function getAllocatedCents(
	tx: AppDatabase,
	schoolId: string,
	chargeId: string,
): Promise<bigint> {
	const [row] = await tx
		.select({
			allocated: sql<
				string | null
			>`coalesce(sum(${paymentAllocation.amount}), 0)`,
		})
		.from(paymentAllocation)
		.innerJoin(
			payment,
			and(
				eq(payment.schoolId, paymentAllocation.schoolId),
				eq(payment.id, paymentAllocation.paymentId),
			),
		)
		.where(
			and(
				eq(paymentAllocation.schoolId, schoolId),
				eq(paymentAllocation.chargeId, chargeId),
				isNull(payment.voidedAt),
			),
		);

	return parseAmountToCents(row?.allocated ?? "0");
}

/**
 * Records a payment and allocates it to charges, all inside ONE
 * Drizzle transaction: the payment is inserted first, then every target
 * charge is locked with SELECT ... FOR UPDATE (composite schoolId + id)
 * and validated (not voided, same currency, allocations within the
 * charge total and within the payment amount). Any failure rolls back
 * the payment and all allocations.
 *
 * Duplicate `chargeId` entries in `allocations` are merged into a
 * single allocation per charge.
 */
export async function recordPaymentWithAllocations(
	context: AuthorizedSchoolContext,
	input: RecordPaymentInput,
): Promise<Payment> {
	const paymentCents = parseAmountToCents(input.amount);

	if (paymentCents <= 0n) {
		throw new DomainError(
			"INVALID_MONEY_AMOUNT",
			"The payment amount must be greater than zero",
			422,
		);
	}

	const allocationsByCharge = new Map<string, bigint>();
	let totalAllocatedCents = 0n;

	for (const allocation of input.allocations) {
		const amountCents = parseAmountToCents(allocation.amount);

		if (amountCents <= 0n) {
			throw new DomainError(
				"INVALID_MONEY_AMOUNT",
				"Allocation amounts must be greater than zero",
				422,
			);
		}

		const merged =
			(allocationsByCharge.get(allocation.chargeId) ?? 0n) + amountCents;
		allocationsByCharge.set(allocation.chargeId, merged);
		totalAllocatedCents += amountCents;
	}

	if (totalAllocatedCents > paymentCents) {
		throw new DomainError(
			"OVER_ALLOCATION",
			"The allocations exceed the payment amount",
			422,
		);
	}

	return getDatabase().transaction(async (tx) => {
		const [paymentRow] = await tx
			.insert(payment)
			.values({
				schoolId: context.school.id,
				amount: formatCents(paymentCents),
				currencyCode: input.currencyCode,
				paymentMethod: input.paymentMethod,
				reference: input.reference ?? null,
				notes: input.notes ?? null,
				paidAt: input.paidAt,
				recordedByUserId: input.recordedByUserId,
			})
			.returning();

		if (!paymentRow) {
			throw new DomainError(
				"INVALID_MONEY_AMOUNT",
				"The payment could not be recorded",
				500,
			);
		}

		for (const [chargeId, amountCents] of allocationsByCharge) {
			const [lockedCharge] = await tx
				.select()
				.from(charge)
				.where(
					and(eq(charge.schoolId, context.school.id), eq(charge.id, chargeId)),
				)
				.for("update")
				.limit(1);

			if (!lockedCharge) {
				throw new DomainError(
					"CHARGE_NOT_FOUND",
					"The charge does not exist in this school",
					404,
				);
			}

			if (lockedCharge.voidedAt !== null) {
				throw new DomainError(
					"VOIDED_ENTITY",
					"The charge is voided and cannot receive allocations",
					409,
				);
			}

			if (lockedCharge.currencyCode !== input.currencyCode) {
				throw new DomainError(
					"CURRENCY_MISMATCH",
					`The charge is in ${lockedCharge.currencyCode} but the payment is in ${input.currencyCode}`,
					409,
				);
			}

			const allocatedCents = await getAllocatedCents(
				tx,
				context.school.id,
				chargeId,
			);

			if (
				allocatedCents + amountCents >
				parseAmountToCents(lockedCharge.totalAmount)
			) {
				throw new DomainError(
					"OVER_ALLOCATION",
					"The allocation exceeds the remaining balance of the charge",
					422,
				);
			}

			await tx.insert(paymentAllocation).values({
				schoolId: context.school.id,
				paymentId: paymentRow.id,
				chargeId,
				amount: formatCents(amountCents),
			});
		}

		return paymentRow;
	});
}
