import { beforeEach, describe, expect, it, vi } from "vitest";
import { DomainError } from "../errors.ts";
import { reactivateSchool, suspendSchool } from "./set-school-suspension.ts";

const getDatabaseMock = vi.hoisted(() => vi.fn());
const findSchoolByIdMock = vi.hoisted(() => vi.fn());
const updateSchoolStatusMock = vi.hoisted(() => vi.fn());

vi.mock("@aulara/db/client", () => ({
	getDatabase: getDatabaseMock,
}));

vi.mock("@aulara/db/queries/schools", () => ({
	findSchoolById: findSchoolByIdMock,
	updateSchoolStatus: updateSchoolStatusMock,
}));

const admin = {
	id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
	email: "jorge@aulara.pe",
	name: "Jorge",
	role: "admin" as const,
};

const schoolId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const organizationId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const now = new Date("2026-01-01T00:00:00.000Z");
const database = { kind: "db" };

function schoolRow(
	status: "onboarding" | "active" | "suspended" | "cancelled",
	statusBeforeSuspend: "onboarding" | "active" | null = null,
) {
	return {
		id: schoolId,
		organizationId,
		status,
		statusBeforeSuspend,
		createdAt: now,
		updatedAt: now,
	};
}

async function expectDomainError(
	action: () => Promise<unknown>,
	code: string,
	status: number,
) {
	const error = await action().then(
		() => null,
		(caught: unknown) => caught,
	);

	expect(error).toBeInstanceOf(DomainError);
	const domainError = error as DomainError;
	expect(domainError.code).toBe(code);
	expect(domainError.status).toBe(status);
	return domainError;
}

describe("suspendSchool", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		getDatabaseMock.mockReturnValue(database);
		updateSchoolStatusMock.mockResolvedValue(undefined);
		findSchoolByIdMock.mockResolvedValue(schoolRow("onboarding"));
	});

	it("suspends an onboarding school and stores statusBeforeSuspend", async () => {
		await suspendSchool({ admin, schoolId });

		expect(findSchoolByIdMock).toHaveBeenCalledWith(database, schoolId);
		expect(updateSchoolStatusMock).toHaveBeenCalledWith(database, schoolId, {
			status: "suspended",
			statusBeforeSuspend: "onboarding",
		});
	});

	it("suspends an active school and stores statusBeforeSuspend", async () => {
		findSchoolByIdMock.mockResolvedValue(schoolRow("active"));

		await suspendSchool({ admin, schoolId });

		expect(updateSchoolStatusMock).toHaveBeenCalledWith(database, schoolId, {
			status: "suspended",
			statusBeforeSuspend: "active",
		});
	});

	it("throws SCHOOL_NOT_SUSPENDABLE when the school is already suspended", async () => {
		findSchoolByIdMock.mockResolvedValue(schoolRow("suspended", "onboarding"));

		await expectDomainError(
			() => suspendSchool({ admin, schoolId }),
			"SCHOOL_NOT_SUSPENDABLE",
			409,
		);

		expect(updateSchoolStatusMock).not.toHaveBeenCalled();
	});

	it("throws SCHOOL_NOT_FOUND when the school is missing", async () => {
		findSchoolByIdMock.mockResolvedValue(undefined);

		await expectDomainError(
			() => suspendSchool({ admin, schoolId }),
			"SCHOOL_NOT_FOUND",
			404,
		);
	});

	it("throws INVALID_INPUT when the school id is not a UUID", async () => {
		await expectDomainError(
			() => suspendSchool({ admin, schoolId: "school-id" }),
			"INVALID_INPUT",
			400,
		);

		expect(findSchoolByIdMock).not.toHaveBeenCalled();
	});
});

describe("reactivateSchool", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		getDatabaseMock.mockReturnValue(database);
		updateSchoolStatusMock.mockResolvedValue(undefined);
		findSchoolByIdMock.mockResolvedValue(schoolRow("suspended", "active"));
	});

	it("restores statusBeforeSuspend and clears the snapshot", async () => {
		await reactivateSchool({ admin, schoolId });

		expect(updateSchoolStatusMock).toHaveBeenCalledWith(database, schoolId, {
			status: "active",
			statusBeforeSuspend: null,
		});
	});

	it("reactivates to onboarding when statusBeforeSuspend is null", async () => {
		findSchoolByIdMock.mockResolvedValue(schoolRow("suspended", null));

		await reactivateSchool({ admin, schoolId });

		expect(updateSchoolStatusMock).toHaveBeenCalledWith(database, schoolId, {
			status: "onboarding",
			statusBeforeSuspend: null,
		});
	});

	it("throws SCHOOL_NOT_SUSPENDABLE when the school is not suspended", async () => {
		findSchoolByIdMock.mockResolvedValue(schoolRow("active"));

		await expectDomainError(
			() => reactivateSchool({ admin, schoolId }),
			"SCHOOL_NOT_SUSPENDABLE",
			409,
		);
	});

	it("throws SCHOOL_NOT_FOUND when the school is missing", async () => {
		findSchoolByIdMock.mockResolvedValue(undefined);

		await expectDomainError(
			() => reactivateSchool({ admin, schoolId }),
			"SCHOOL_NOT_FOUND",
			404,
		);
	});
});
