import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DomainError } from "../errors.ts";
import { insertBillingContract } from "./create-billing-contract.ts";

const insertBillingContractRowMock = vi.hoisted(() => vi.fn());

vi.mock("@aulara/db/queries/billing-contracts", () => ({
	insertBillingContractRow: insertBillingContractRowMock,
}));

const schoolId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const database = { kind: "db" } as never;
const contractRow = {
	id: "ffffffff-ffff-4fff-8fff-ffffffffffff",
	schoolId,
	status: "confirmed" as const,
	pricePerActiveStudent: "25.00",
	minimumMonthlyAmount: null,
	currencyCode: "PEN",
	startsOn: "2026-03-01",
	endsOn: null,
	notes: null,
};

const input = {
	status: "confirmed" as const,
	pricePerActiveStudent: "25.00",
	currencyCode: "PEN",
	startsOn: "2026-03-01",
};

function postgresError(code: string) {
	return Object.assign(new Error("postgres"), { code });
}

describe("insertBillingContract", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		insertBillingContractRowMock.mockResolvedValue(contractRow);
	});

	it("inserts a contract when the database returns a row", async () => {
		const row = await insertBillingContract(database, schoolId, input);

		expect(insertBillingContractRowMock).toHaveBeenCalledWith(
			database,
			expect.objectContaining({
				schoolId,
				status: "confirmed",
				pricePerActiveStudent: "25.00",
				currencyCode: "PEN",
				startsOn: "2026-03-01",
			}),
		);
		expect(row).toEqual(contractRow);
	});

	it("throws INTERNAL when the insert returns no row", async () => {
		insertBillingContractRowMock.mockResolvedValue(null);

		try {
			await insertBillingContract(database, schoolId, input);
			expect.unreachable();
		} catch (error) {
			expect((error as DomainError).code).toBe("INTERNAL");
			expect((error as DomainError).status).toBe(500);
		}
	});

	it("throws BILLING_CONTRACT_OVERLAP when Postgres reports 23P01", async () => {
		insertBillingContractRowMock.mockRejectedValue(postgresError("23P01"));

		try {
			await insertBillingContract(database, schoolId, input);
			expect.unreachable();
		} catch (error) {
			expect((error as DomainError).code).toBe("BILLING_CONTRACT_OVERLAP");
			expect((error as DomainError).status).toBe(409);
		}
	});

	it("throws INVALID_INPUT for a malformed price", async () => {
		try {
			await insertBillingContract(database, schoolId, {
				...input,
				pricePerActiveStudent: "1e3",
			});
			expect.unreachable();
		} catch (error) {
			expect((error as DomainError).code).toBe("INVALID_INPUT");
			expect((error as DomainError).status).toBe(400);
		}

		expect(insertBillingContractRowMock).not.toHaveBeenCalled();
	});
});
