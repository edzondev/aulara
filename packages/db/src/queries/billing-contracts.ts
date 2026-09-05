import { and, desc, eq, gt, isNull, lte, or } from "drizzle-orm";
import type { AppDatabase } from "../client.ts";
import { billingContract } from "../schema/schools.ts";

/**
 * Returns the billing contract valid for `onDate` using semi-open
 * ranges: [startsOn, endsOn). Returns null when no confirmed contract
 * covers the date.
 */
export async function findBillingContractAtDate(
	db: AppDatabase,
	schoolId: string,
	onDate: string,
) {
	const rows = await db
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
		.limit(1);

	return rows[0] ?? null;
}

export async function insertBillingContractRow(
	db: AppDatabase,
	values: {
		schoolId: string;
		status: "draft" | "confirmed";
		pricePerActiveStudent: string;
		minimumMonthlyAmount: string | null;
		currencyCode: string;
		startsOn: string;
		endsOn: string | null;
		notes: string | null;
	},
) {
	const [row] = await db.insert(billingContract).values(values).returning();
	return row ?? null;
}
