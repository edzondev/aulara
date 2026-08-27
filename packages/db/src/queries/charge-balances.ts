import { and, eq, sql } from "drizzle-orm";
import type { AppDatabase } from "../client.ts";
import { enrollment } from "../schema/academics.ts";
import { type ChargeType, charge } from "../schema/finance.ts";

export const chargeComputedStatuses = [
	"voided",
	"paid",
	"overdue",
	"partial",
	"pending",
] as const;
export type ChargeComputedStatus = (typeof chargeComputedStatuses)[number];

export type ChargeBalance = {
	id: string;
	type: ChargeType;
	billingPeriod: string;
	dueDate: string;
	baseAmount: string;
	discountAmount: string;
	totalAmount: string;
	currencyCode: string;
	allocatedAmount: string;
	balanceAmount: string;
	computedStatus: ChargeComputedStatus;
};

const allocatedAmount = sql<string>`coalesce((
	select sum(pa."amount")
	from "payment_allocation" pa
	join "payment" p
		on p."school_id" = pa."school_id" and p."id" = pa."payment_id"
	where pa."school_id" = ${charge.schoolId}
		and pa."charge_id" = ${charge.id}
		and p."voided_at" is null
), 0)`;

/**
 * Per-charge balance for one student's enrollments. Payment status is
 * always derived: allocations ignore voided payments, and the status
 * precedence is voided -> paid -> overdue -> partial -> pending.
 */
export async function getStudentChargeBalances(
	db: AppDatabase,
	schoolId: string,
	studentId: string,
): Promise<ChargeBalance[]> {
	const rows = await db
		.select({
			id: charge.id,
			type: charge.type,
			billingPeriod: charge.billingPeriod,
			dueDate: charge.dueDate,
			baseAmount: charge.baseAmount,
			discountAmount: charge.discountAmount,
			totalAmount: charge.totalAmount,
			currencyCode: charge.currencyCode,
			allocatedAmount,
			balanceAmount: sql<string>`${charge.totalAmount} - ${allocatedAmount}`,
			computedStatus: sql<string>`case
				when ${charge.voidedAt} is not null then 'voided'
				when ${charge.totalAmount} - ${allocatedAmount} <= 0 then 'paid'
				when ${charge.dueDate} < current_date then 'overdue'
				when ${allocatedAmount} > 0 then 'partial'
				else 'pending'
			end`,
		})
		.from(charge)
		.innerJoin(
			enrollment,
			and(
				eq(enrollment.schoolId, charge.schoolId),
				eq(enrollment.id, charge.enrollmentId),
			),
		)
		.where(
			and(eq(charge.schoolId, schoolId), eq(enrollment.studentId, studentId)),
		)
		.orderBy(charge.billingPeriod, charge.id);

	return rows.map((row) => ({
		...row,
		computedStatus: row.computedStatus as ChargeComputedStatus,
	}));
}
