import { beforeEach, describe, expect, it, vi } from "vitest";
import { DomainError } from "../errors.ts";
import { reactivateSchool, suspendSchool } from "./set-school-suspension.ts";

const requireGlobalAdminMock = vi.hoisted(() => vi.fn());
const getDatabaseMock = vi.hoisted(() => vi.fn());
const findSchoolByIdMock = vi.hoisted(() => vi.fn());
const updateMock = vi.hoisted(() => vi.fn());
const updateSetMock = vi.hoisted(() => vi.fn());
const updateWhereMock = vi.hoisted(() => vi.fn());

vi.mock("@aulara/auth/guards", () => ({
	requireGlobalAdmin: requireGlobalAdminMock,
}));

vi.mock("@aulara/db/client", () => ({
	getDatabase: getDatabaseMock,
}));

vi.mock("@aulara/db/queries/schools", () => ({
	findSchoolById: findSchoolByIdMock,
}));

const admin = {
	id: "admin-id",
	email: "jorge@aulara.pe",
	name: "Jorge",
	role: "admin" as const,
};

const schoolId = "school-id";
const organizationId = "org-id";
const now = new Date("2026-01-01T00:00:00.000Z");
const headers = new Headers();
const database = { update: updateMock };

function schoolRow(
	status: "onboarding" | "active" | "suspended" | "cancelled",
	statusBeforeSuspend: "onboarding" | "active" | null = null,
) {
	return {
		id: schoolId,
		organizationId,
		legalName: "Colegio Santa Elena",
		commercialName: "Colegio Santa Elena",
		ruc: null,
		modularCode: null,
		contactEmail: null,
		contactPhone: null,
		addressLine: null,
		district: null,
		province: null,
		department: null,
		countryCode: "PE",
		timezone: "America/Lima",
		currencyCode: "PEN",
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

		requireGlobalAdminMock.mockResolvedValue(admin);
		getDatabaseMock.mockReturnValue(database);
		updateWhereMock.mockResolvedValue(undefined);
		updateSetMock.mockReturnValue({ where: updateWhereMock });
		updateMock.mockReturnValue({ set: updateSetMock });
		findSchoolByIdMock.mockResolvedValue(schoolRow("onboarding"));
	});

	it("suspends an onboarding school and stores statusBeforeSuspend", async () => {
		await suspendSchool({ headers, schoolId });

		expect(requireGlobalAdminMock).toHaveBeenCalledWith(headers);
		expect(findSchoolByIdMock).toHaveBeenCalledWith(database, schoolId);
		expect(updateMock).toHaveBeenCalled();
		expect(updateSetMock).toHaveBeenCalledWith({
			status: "suspended",
			statusBeforeSuspend: "onboarding",
		});
		expect(updateWhereMock).toHaveBeenCalled();
	});

	it("suspends an active school and stores statusBeforeSuspend", async () => {
		findSchoolByIdMock.mockResolvedValue(schoolRow("active"));

		await suspendSchool({ headers, schoolId });

		expect(updateSetMock).toHaveBeenCalledWith({
			status: "suspended",
			statusBeforeSuspend: "active",
		});
	});

	it("throws SCHOOL_NOT_SUSPENDABLE when the school is already suspended", async () => {
		findSchoolByIdMock.mockResolvedValue(schoolRow("suspended", "onboarding"));

		await expectDomainError(
			() => suspendSchool({ headers, schoolId }),
			"SCHOOL_NOT_SUSPENDABLE",
			409,
		);

		expect(updateMock).not.toHaveBeenCalled();
	});

	it("throws SCHOOL_NOT_FOUND when the school is missing", async () => {
		findSchoolByIdMock.mockResolvedValue(undefined);

		await expectDomainError(
			() => suspendSchool({ headers, schoolId }),
			"SCHOOL_NOT_FOUND",
			404,
		);

		expect(updateMock).not.toHaveBeenCalled();
	});
});

describe("reactivateSchool", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		requireGlobalAdminMock.mockResolvedValue(admin);
		getDatabaseMock.mockReturnValue(database);
		updateWhereMock.mockResolvedValue(undefined);
		updateSetMock.mockReturnValue({ where: updateWhereMock });
		updateMock.mockReturnValue({ set: updateSetMock });
		findSchoolByIdMock.mockResolvedValue(schoolRow("suspended", "active"));
	});

	it("restores statusBeforeSuspend and clears the snapshot", async () => {
		await reactivateSchool({ headers, schoolId });

		expect(requireGlobalAdminMock).toHaveBeenCalledWith(headers);
		expect(findSchoolByIdMock).toHaveBeenCalledWith(database, schoolId);
		expect(updateSetMock).toHaveBeenCalledWith({
			status: "active",
			statusBeforeSuspend: null,
		});
		expect(updateWhereMock).toHaveBeenCalled();
	});

	it("reactivates to onboarding when statusBeforeSuspend is null", async () => {
		findSchoolByIdMock.mockResolvedValue(schoolRow("suspended", null));

		await reactivateSchool({ headers, schoolId });

		expect(updateSetMock).toHaveBeenCalledWith({
			status: "onboarding",
			statusBeforeSuspend: null,
		});
	});

	it("throws SCHOOL_NOT_SUSPENDABLE when the school is not suspended", async () => {
		findSchoolByIdMock.mockResolvedValue(schoolRow("onboarding"));

		await expectDomainError(
			() => reactivateSchool({ headers, schoolId }),
			"SCHOOL_NOT_SUSPENDABLE",
			409,
		);

		expect(updateMock).not.toHaveBeenCalled();
	});

	it("throws SCHOOL_NOT_FOUND when the school is missing", async () => {
		findSchoolByIdMock.mockResolvedValue(undefined);

		await expectDomainError(
			() => reactivateSchool({ headers, schoolId }),
			"SCHOOL_NOT_FOUND",
			404,
		);

		expect(updateMock).not.toHaveBeenCalled();
	});
});
