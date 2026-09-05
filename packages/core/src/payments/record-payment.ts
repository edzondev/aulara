import type { AuthorizedSchoolContext } from "@aulara/auth/types";
import { getDatabase } from "@aulara/db/client";
import { lockChargeForUpdate } from "@aulara/db/queries/charges";
import {
	getAllocatedAmount,
	insertPayment,
	insertPaymentAllocation,
} from "@aulara/db/queries/payments";
import { DomainError } from "../errors.ts";
import { parseDomainInput } from "../parse.ts";
import { formatCents, parseAmountToCents } from "../tuition/decimal.ts";
import { recordPaymentSchema } from "./record-payment-schema.ts";

export type PaymentAllocationInput = {
	chargeId: string;
	amount: string;
};

export type RecordPaymentInput = {
	amount: string;
	currencyCode: string;
	paymentMethod: "cash" | "bank_transfer" | "card" | "wallet" | "other";
	reference?: string;
	notes?: string;
	paidAt?: Date;
	recordedByUserId: string;
	allocations: PaymentAllocationInput[];
};

export type Payment = NonNullable<Awaited<ReturnType<typeof insertPayment>>>;

export function chargeIdsInLockOrder(chargeIds: Iterable<string>): string[] {
	return [...chargeIds].sort();
}

export async function recordPaymentWithAllocations(
	context: AuthorizedSchoolContext,
	input: RecordPaymentInput,
): Promise<Payment> {
	const parsed = parseDomainInput(
		recordPaymentSchema,
		input,
		"The payment input is invalid",
	);
	const paymentCents = parseAmountToCents(parsed.amount);

	if (paymentCents <= 0n) {
		throw new DomainError(
			"INVALID_MONEY_AMOUNT",
			"The payment amount must be greater than zero",
			422,
		);
	}

	const allocationsByCharge = new Map<string, bigint>();
	let totalAllocatedCents = 0n;

	for (const allocation of parsed.allocations) {
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
		const paymentRow = await insertPayment(tx, {
			schoolId: context.school.id,
			amount: formatCents(paymentCents),
			currencyCode: parsed.currencyCode,
			paymentMethod: parsed.paymentMethod,
			reference: parsed.reference ?? null,
			notes: parsed.notes ?? null,
			paidAt: parsed.paidAt,
			recordedByUserId: parsed.recordedByUserId,
		});

		if (!paymentRow) {
			throw new DomainError(
				"INTERNAL",
				"The payment could not be recorded",
				500,
			);
		}

		for (const chargeId of chargeIdsInLockOrder(allocationsByCharge.keys())) {
			const amountCents = allocationsByCharge.get(chargeId);

			if (amountCents === undefined) {
				continue;
			}

			const lockedCharge = await lockChargeForUpdate(
				tx,
				context.school.id,
				chargeId,
			);

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

			if (lockedCharge.currencyCode !== parsed.currencyCode) {
				throw new DomainError(
					"CURRENCY_MISMATCH",
					`The charge is in ${lockedCharge.currencyCode} but the payment is in ${parsed.currencyCode}`,
					409,
				);
			}

			const allocatedCents = parseAmountToCents(
				await getAllocatedAmount(tx, context.school.id, chargeId),
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

			await insertPaymentAllocation(tx, {
				schoolId: context.school.id,
				paymentId: paymentRow.id,
				chargeId,
				amount: formatCents(amountCents),
			});
		}

		return paymentRow;
	});
}
