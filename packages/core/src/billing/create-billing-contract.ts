import type { AuthorizedSchoolContext } from "@aulara/auth/types";
import type { AppDatabase } from "@aulara/db/client";
import { getDatabase } from "@aulara/db/client";
import type { BillingContractStatus } from "@aulara/db/schema";
import { billingContract } from "@aulara/db/schema";
import { DomainError, findPostgresErrorCode } from "../errors.ts";
import { parseAmountToCents } from "../tuition/decimal.ts";

export type CreateBillingContractInput = {
	status: Exclude<BillingContractStatus, "cancelled">;
	pricePerActiveStudent: string;
	minimumMonthlyAmount?: string;
	currencyCode: string;
	startsOn: string;
	endsOn?: string;
	notes?: string;
};

export type BillingContract = typeof billingContract.$inferSelect;

/**
 * Inserts a billing contract for a school. Shared by the authorized
 * service below and by tenant provisioning (which has no
 * AuthorizedSchoolContext yet).
 */
export async function insertBillingContract(
	db: AppDatabase,
	schoolId: string,
	input: CreateBillingContractInput,
): Promise<BillingContract> {
	parseAmountToCents(input.pricePerActiveStudent);

	if (input.minimumMonthlyAmount !== undefined) {
		parseAmountToCents(input.minimumMonthlyAmount);
	}

	try {
		const [row] = await db
			.insert(billingContract)
			.values({
				schoolId,
				status: input.status,
				pricePerActiveStudent: input.pricePerActiveStudent,
				minimumMonthlyAmount: input.minimumMonthlyAmount ?? null,
				currencyCode: input.currencyCode,
				startsOn: input.startsOn,
				endsOn: input.endsOn ?? null,
				notes: input.notes ?? null,
			})
			.returning();

		if (!row) {
			throw new DomainError(
				"BILLING_CONTRACT_OVERLAP",
				"The billing contract could not be created",
				500,
			);
		}

		return row;
	} catch (error) {
		// 23P01 = exclusion_violation: the no-overlap exclusion rule on
		// billing_contract rejected the period.
		if (findPostgresErrorCode(error) === "23P01") {
			throw new DomainError(
				"BILLING_CONTRACT_OVERLAP",
				"The billing contract period overlaps an existing contract for the school",
				409,
			);
		}

		throw error;
	}
}

/**
 * Creates a billing contract for the authorized school. Overlapping
 * periods are rejected by a database exclusion constraint and surfaced
 * as a `BILLING_CONTRACT_OVERLAP` domain error.
 */
export async function createBillingContract(
	context: AuthorizedSchoolContext,
	input: CreateBillingContractInput,
): Promise<BillingContract> {
	return insertBillingContract(getDatabase(), context.school.id, input);
}
