import { and, eq, isNull } from "drizzle-orm";
import type { AppDatabase } from "../client.ts";
import { type ChargeType, charge } from "../schema/finance.ts";

export async function findActiveTuitionCharge(
	db: AppDatabase,
	schoolId: string,
	enrollmentId: string,
	billingPeriod: string,
) {
	const [row] = await db
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
		.limit(1);

	return row ?? null;
}

export async function insertTuitionCharge(
	db: AppDatabase,
	values: {
		schoolId: string;
		academicYearId: string;
		enrollmentId: string;
		tuitionRateId: string;
		type: ChargeType;
		billingPeriod: string;
		baseAmount: string;
		discountAmount: string;
		totalAmount: string;
		currencyCode: string;
		dueDate: string;
	},
) {
	const [row] = await db.insert(charge).values(values).returning();
	return row ?? null;
}

export async function lockChargeForUpdate(
	db: AppDatabase,
	schoolId: string,
	chargeId: string,
) {
	const [row] = await db
		.select()
		.from(charge)
		.where(and(eq(charge.schoolId, schoolId), eq(charge.id, chargeId)))
		.for("update")
		.limit(1);

	return row ?? null;
}
