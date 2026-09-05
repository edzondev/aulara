import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DomainError } from "../errors.ts";
import {
	chargeIdsInLockOrder,
	recordPaymentWithAllocations,
} from "./record-payment.ts";

const getDatabaseMock = vi.hoisted(() => vi.fn());
const insertPaymentMock = vi.hoisted(() => vi.fn());
const lockChargeForUpdateMock = vi.hoisted(() => vi.fn());
const getAllocatedAmountMock = vi.hoisted(() => vi.fn());
const insertPaymentAllocationMock = vi.hoisted(() => vi.fn());

vi.mock("@aulara/db/client", () => ({
	getDatabase: getDatabaseMock,
}));

vi.mock("@aulara/db/queries/payments", () => ({
	insertPayment: insertPaymentMock,
	getAllocatedAmount: getAllocatedAmountMock,
	insertPaymentAllocation: insertPaymentAllocationMock,
}));

vi.mock("@aulara/db/queries/charges", () => ({
	lockChargeForUpdate: lockChargeForUpdateMock,
}));

const schoolId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const chargeA = "00000000-0000-4000-8000-00000000000a";
const chargeF = "00000000-0000-4000-8000-00000000000f";
const userId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const context = {
	school: { id: schoolId },
} as never;

const paymentRow = {
	id: "55555555-5555-4555-8555-555555555555",
	schoolId,
	amount: "15.00",
	currencyCode: "PEN",
	paymentMethod: "cash" as const,
};

function chargeRow(id: string, overrides: Record<string, unknown> = {}) {
	return {
		id,
		schoolId,
		totalAmount: "20.00",
		currencyCode: "PEN",
		voidedAt: null,
		...overrides,
	};
}

describe("chargeIdsInLockOrder", () => {
	it("sorts charge ids so concurrent payments lock in a stable order", () => {
		expect(chargeIdsInLockOrder([chargeF, chargeA])).toEqual([
			chargeA,
			chargeF,
		]);
	});
});

describe("recordPaymentWithAllocations", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		getDatabaseMock.mockReturnValue({
			transaction: async (fn: (tx: unknown) => Promise<unknown>) =>
				fn({ kind: "tx" }),
		});
		insertPaymentMock.mockResolvedValue(paymentRow);
		getAllocatedAmountMock.mockResolvedValue("0");
		insertPaymentAllocationMock.mockResolvedValue(undefined);
		lockChargeForUpdateMock.mockImplementation(async (_tx, _school, id) =>
			chargeRow(id),
		);
	});

	it("throws OVER_ALLOCATION when allocations exceed the payment", async () => {
		try {
			await recordPaymentWithAllocations(context, {
				amount: "10.00",
				currencyCode: "PEN",
				paymentMethod: "cash",
				recordedByUserId: userId,
				allocations: [
					{ chargeId: chargeA, amount: "6.00" },
					{ chargeId: chargeF, amount: "5.00" },
				],
			});
			expect.unreachable();
		} catch (error) {
			expect((error as DomainError).code).toBe("OVER_ALLOCATION");
		}
	});

	it("throws VOIDED_ENTITY when the locked charge is voided", async () => {
		lockChargeForUpdateMock.mockResolvedValue(
			chargeRow(chargeA, { voidedAt: new Date() }),
		);

		try {
			await recordPaymentWithAllocations(context, {
				amount: "5.00",
				currencyCode: "PEN",
				paymentMethod: "cash",
				recordedByUserId: userId,
				allocations: [{ chargeId: chargeA, amount: "5.00" }],
			});
			expect.unreachable();
		} catch (error) {
			expect((error as DomainError).code).toBe("VOIDED_ENTITY");
		}
	});

	it("throws CURRENCY_MISMATCH when the charge currency differs", async () => {
		lockChargeForUpdateMock.mockResolvedValue(
			chargeRow(chargeA, { currencyCode: "USD" }),
		);

		try {
			await recordPaymentWithAllocations(context, {
				amount: "5.00",
				currencyCode: "PEN",
				paymentMethod: "cash",
				recordedByUserId: userId,
				allocations: [{ chargeId: chargeA, amount: "5.00" }],
			});
			expect.unreachable();
		} catch (error) {
			expect((error as DomainError).code).toBe("CURRENCY_MISMATCH");
		}
	});

	it("throws INTERNAL when the payment insert returns no row", async () => {
		insertPaymentMock.mockResolvedValue(null);

		try {
			await recordPaymentWithAllocations(context, {
				amount: "5.00",
				currencyCode: "PEN",
				paymentMethod: "cash",
				recordedByUserId: userId,
				allocations: [{ chargeId: chargeA, amount: "5.00" }],
			});
			expect.unreachable();
		} catch (error) {
			expect((error as DomainError).code).toBe("INTERNAL");
		}
	});

	it("locks duplicate allocations after merging, in sorted charge id order", async () => {
		const locked: string[] = [];
		lockChargeForUpdateMock.mockImplementation(async (_tx, _school, id) => {
			locked.push(id);
			return chargeRow(id);
		});

		const result = await recordPaymentWithAllocations(context, {
			amount: "15.00",
			currencyCode: "PEN",
			paymentMethod: "cash",
			recordedByUserId: userId,
			allocations: [
				{ chargeId: chargeF, amount: "5.00" },
				{ chargeId: chargeA, amount: "4.00" },
				{ chargeId: chargeF, amount: "6.00" },
			],
		});

		expect(result.id).toBe(paymentRow.id);
		expect(locked).toEqual([chargeA, chargeF]);
	});

	it("throws INVALID_INPUT when a charge id is not a UUID", async () => {
		try {
			await recordPaymentWithAllocations(context, {
				amount: "5.00",
				currencyCode: "PEN",
				paymentMethod: "cash",
				recordedByUserId: userId,
				allocations: [{ chargeId: "charge-a", amount: "5.00" }],
			});
			expect.unreachable();
		} catch (error) {
			expect((error as DomainError).code).toBe("INVALID_INPUT");
		}
	});
});
