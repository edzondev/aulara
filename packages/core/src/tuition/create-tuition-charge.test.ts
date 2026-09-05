import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DomainError } from "../errors.ts";
import { createMonthlyTuitionCharge } from "./create-tuition-charge.ts";

const getDatabaseMock = vi.hoisted(() => vi.fn());
const findTuitionRateMock = vi.hoisted(() => vi.fn());
const lockEnrollmentForUpdateMock = vi.hoisted(() => vi.fn());
const findSectionGradeIdMock = vi.hoisted(() => vi.fn());
const listActiveStudentDiscountsMock = vi.hoisted(() => vi.fn());
const findActiveTuitionChargeMock = vi.hoisted(() => vi.fn());
const insertTuitionChargeMock = vi.hoisted(() => vi.fn());

vi.mock("@aulara/db/client", () => ({
	getDatabase: getDatabaseMock,
}));

vi.mock("@aulara/db/queries/tuition-rates", () => ({
	findTuitionRate: findTuitionRateMock,
}));

vi.mock("@aulara/db/queries/academics", () => ({
	lockEnrollmentForUpdate: lockEnrollmentForUpdateMock,
	findSectionGradeId: findSectionGradeIdMock,
	listActiveStudentDiscounts: listActiveStudentDiscountsMock,
}));

vi.mock("@aulara/db/queries/charges", () => ({
	findActiveTuitionCharge: findActiveTuitionChargeMock,
	insertTuitionCharge: insertTuitionChargeMock,
}));

const schoolId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const enrollmentId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const context = {
	school: { id: schoolId },
} as never;

const enrollmentRow = {
	id: enrollmentId,
	schoolId,
	studentId: "99999999-9999-4999-8999-999999999999",
	academicYearId: "88888888-8888-4888-8888-888888888888",
	sectionId: "77777777-7777-4777-8777-777777777777",
	status: "enrolled",
};

const rateRow = {
	id: "66666666-6666-4666-8666-666666666666",
	amount: "100.00",
	currencyCode: "PEN",
	dueDay: 31,
};

const chargeRow = {
	id: "55555555-5555-4555-8555-555555555555",
	schoolId,
	enrollmentId,
	billingPeriod: "2026-04-01",
	dueDate: "2026-04-30",
	totalAmount: "100.00",
};

describe("createMonthlyTuitionCharge", () => {
	let lastInsertValues: Record<string, unknown> | undefined;

	beforeEach(() => {
		vi.clearAllMocks();
		lastInsertValues = undefined;
		getDatabaseMock.mockReturnValue({
			transaction: async (fn: (tx: unknown) => Promise<unknown>) =>
				fn({ kind: "tx" }),
		});
		lockEnrollmentForUpdateMock.mockResolvedValue(enrollmentRow);
		findActiveTuitionChargeMock.mockResolvedValue(null);
		findSectionGradeIdMock.mockResolvedValue({ gradeId: "grade-id" });
		findTuitionRateMock.mockResolvedValue(rateRow);
		listActiveStudentDiscountsMock.mockResolvedValue([]);
		insertTuitionChargeMock.mockImplementation(async (_tx, values) => {
			lastInsertValues = values;
			return chargeRow;
		});
	});

	it("returns the existing charge when one is already active", async () => {
		findActiveTuitionChargeMock.mockResolvedValue(chargeRow);

		const result = await createMonthlyTuitionCharge(context, {
			enrollmentId,
			billingPeriod: "2026-04-01",
		});

		expect(result).toEqual({ charge: chargeRow, created: false });
		expect(insertTuitionChargeMock).not.toHaveBeenCalled();
	});

	it("creates a charge and clamps due day 31 to April 30", async () => {
		const result = await createMonthlyTuitionCharge(context, {
			enrollmentId,
			billingPeriod: "2026-04-01",
		});

		expect(result.created).toBe(true);
		expect(lastInsertValues?.dueDate).toBe("2026-04-30");
		expect(lastInsertValues?.totalAmount).toBe("100.00");
	});

	it("caps stacked discounts at the base amount", async () => {
		listActiveStudentDiscountsMock.mockResolvedValue([
			{ type: "percentage", value: "80" },
			{ type: "fixed", value: "50.00" },
		]);

		await createMonthlyTuitionCharge(context, {
			enrollmentId,
			billingPeriod: "2026-04-01",
		});

		expect(lastInsertValues?.discountAmount).toBe("100.00");
		expect(lastInsertValues?.totalAmount).toBe("0.00");
	});

	it("throws ENROLLMENT_NOT_FOUND when the enrollment is missing", async () => {
		lockEnrollmentForUpdateMock.mockResolvedValue(null);

		try {
			await createMonthlyTuitionCharge(context, {
				enrollmentId,
				billingPeriod: "2026-04-01",
			});
			expect.unreachable();
		} catch (error) {
			expect((error as DomainError).code).toBe("ENROLLMENT_NOT_FOUND");
		}
	});

	it("throws INTERNAL when the charge insert returns no row", async () => {
		insertTuitionChargeMock.mockResolvedValue(null);

		try {
			await createMonthlyTuitionCharge(context, {
				enrollmentId,
				billingPeriod: "2026-04-01",
			});
			expect.unreachable();
		} catch (error) {
			expect((error as DomainError).code).toBe("INTERNAL");
		}
	});

	it("returns the raced charge when insert hits unique_violation 23505", async () => {
		insertTuitionChargeMock.mockRejectedValue(
			Object.assign(new Error("postgres"), { code: "23505" }),
		);
		findActiveTuitionChargeMock
			.mockResolvedValueOnce(null)
			.mockResolvedValueOnce(chargeRow);

		const result = await createMonthlyTuitionCharge(context, {
			enrollmentId,
			billingPeriod: "2026-04-01",
		});

		expect(result).toEqual({ charge: chargeRow, created: false });
	});

	it("throws INVALID_INPUT when billingPeriod is not the first of the month", async () => {
		try {
			await createMonthlyTuitionCharge(context, {
				enrollmentId,
				billingPeriod: "2026-04-15",
			});
			expect.unreachable();
		} catch (error) {
			expect((error as DomainError).code).toBe("INVALID_INPUT");
		}

		expect(lockEnrollmentForUpdateMock).not.toHaveBeenCalled();
	});
});
