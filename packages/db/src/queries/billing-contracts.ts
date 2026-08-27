import { and, desc, eq, gt, isNull, lte, or } from "drizzle-orm";
import type { AppDatabase } from "../client.ts";
import { billingContract } from "../schema/schools.ts";

/**
 * Returns the billing contract valid for `onDate` using semi-open
 * ranges: [startsOn, endsOn). Returns null when no confirmed contract
 * covers the date.
 */
export function findBillingContractAtDate(
	db: AppDatabase,
	schoolId: string,
	onDate: string,
) {
	return db
		.select()
		.from(billingContract)
		.where(
			and(
				eq(billingContract.schoolId, schoolId),
				eq(billingContract.status, "confirmed"),
				lte(billingContract.startsOn, onDate),
				or(isNull(billingContract.endsOn), gt(billingContract.endsOn, onDate)),
			),
		)
		.orderBy(desc(billingContract.startsOn))
		.limit(1)
		.then((rows) => rows[0] ?? null);
}
