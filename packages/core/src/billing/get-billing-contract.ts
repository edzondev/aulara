import type { AuthorizedSchoolContext } from "@aulara/auth/types";
import { getDatabase } from "@aulara/db/client";
import { findBillingContractAtDate } from "@aulara/db/queries/billing-contracts";
import { DomainError } from "../errors.ts";
import type { BillingContract } from "./create-billing-contract.ts";

/**
 * Returns the confirmed billing contract in force for the authorized
 * school on `onDate` (semi-open ranges: [startsOn, endsOn)).
 */
export async function getBillingContractAtDate(
	context: AuthorizedSchoolContext,
	onDate: string,
): Promise<BillingContract> {
	const contract = await findBillingContractAtDate(
		getDatabase(),
		context.school.id,
		onDate,
	);

	if (!contract) {
		throw new DomainError(
			"BILLING_CONTRACT_NOT_FOUND",
			`No confirmed billing contract covers ${onDate}`,
			404,
		);
	}

	return contract;
}
