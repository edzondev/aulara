import { and, eq, isNull, sql } from "drizzle-orm";
import type { AppDatabase } from "../client.ts";
import {
	type PaymentMethod,
	payment,
	paymentAllocation,
} from "../schema/finance.ts";

export async function insertPayment(
	db: AppDatabase,
	values: {
		schoolId: string;
		amount: string;
		currencyCode: string;
		paymentMethod: PaymentMethod;
		reference: string | null;
		notes: string | null;
		paidAt?: Date;
		recordedByUserId: string;
	},
) {
	const [row] = await db.insert(payment).values(values).returning();
	return row ?? null;
}

export async function getAllocatedAmount(
	db: AppDatabase,
	schoolId: string,
	chargeId: string,
) {
	const [row] = await db
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

	return row?.allocated ?? "0";
}

export function insertPaymentAllocation(
	db: AppDatabase,
	values: {
		schoolId: string;
		paymentId: string;
		chargeId: string;
		amount: string;
	},
) {
	return db.insert(paymentAllocation).values(values);
}
