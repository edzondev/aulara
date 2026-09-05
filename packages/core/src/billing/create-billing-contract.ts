import type { AuthorizedSchoolContext } from "@aulara/auth/types";
import type { AppDatabase } from "@aulara/db/client";
import { getDatabase } from "@aulara/db/client";
import { insertBillingContractRow } from "@aulara/db/queries/billing-contracts";
import { DomainError, findPostgresErrorCode } from "../errors.ts";
import { parseDomainInput } from "../parse.ts";
import { parseAmountToCents } from "../tuition/decimal.ts";
import { createBillingContractSchema } from "./create-billing-contract-schema.ts";

export type CreateBillingContractInput = {
	status: "draft" | "confirmed";
	pricePerActiveStudent: string;
	minimumMonthlyAmount?: string;
	currencyCode: string;
	startsOn: string;
	endsOn?: string;
	notes?: string;
};

export type BillingContract = NonNullable<
	Awaited<ReturnType<typeof insertBillingContractRow>>
>;

export async function insertBillingContract(
	db: AppDatabase,
	schoolId: string,
	input: CreateBillingContractInput,
): Promise<BillingContract> {
	const parsed = parseDomainInput(
		createBillingContractSchema,
		input,
		"The billing contract input is invalid",
	);

	parseAmountToCents(parsed.pricePerActiveStudent);

	if (parsed.minimumMonthlyAmount !== undefined) {
		parseAmountToCents(parsed.minimumMonthlyAmount);
	}

	try {
		const row = await insertBillingContractRow(db, {
			schoolId,
			status: parsed.status,
			pricePerActiveStudent: parsed.pricePerActiveStudent,
			minimumMonthlyAmount: parsed.minimumMonthlyAmount ?? null,
			currencyCode: parsed.currencyCode,
			startsOn: parsed.startsOn,
			endsOn: parsed.endsOn ?? null,
			notes: parsed.notes ?? null,
		});

		if (!row) {
			throw new DomainError(
				"INTERNAL",
				"The billing contract could not be created",
				500,
			);
		}

		return row;
	} catch (error) {
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

export async function createBillingContract(
	context: AuthorizedSchoolContext,
	input: CreateBillingContractInput,
): Promise<BillingContract> {
	return insertBillingContract(getDatabase(), context.school.id, input);
}
