import { ownerInvitationExpiresInSeconds } from "@aulara/auth/constants";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DomainError } from "../errors.ts";
import { reissueOwnerInvitation } from "./reissue-owner-invitation.ts";

const requireGlobalAdminMock = vi.hoisted(() => vi.fn());
const getDatabaseMock = vi.hoisted(() => vi.fn());
const findSchoolByIdMock = vi.hoisted(() => vi.fn());
const findPendingOwnerInvitationMock = vi.hoisted(() => vi.fn());
const adapterUpdateMock = vi.hoisted(() => vi.fn());
const getAuthEnvironmentMock = vi.hoisted(() => vi.fn());

vi.mock("@aulara/auth/guards", () => ({
	requireGlobalAdmin: requireGlobalAdminMock,
}));

vi.mock("@aulara/auth/server", () => ({
	auth: {
		$context: Promise.resolve({ adapter: { update: adapterUpdateMock } }),
	},
}));

vi.mock("@aulara/db/client", () => ({
	getDatabase: getDatabaseMock,
}));

vi.mock("@aulara/db/queries/schools", () => ({
	findSchoolById: findSchoolByIdMock,
}));

vi.mock("@aulara/db/queries/invitations", () => ({
	findPendingOwnerInvitation: findPendingOwnerInvitationMock,
}));

vi.mock("@aulara/env/auth", () => ({
	getAuthEnvironment: getAuthEnvironmentMock,
}));

const admin = {
	id: "admin-id",
	email: "jorge@aulara.pe",
	name: "Jorge",
	role: "admin" as const,
};

const schoolId = "school-id";
const organizationId = "org-id";
const invitationId = "inv-id";
const now = new Date("2026-01-01T00:00:00.000Z");
const expectedExpiresAt = new Date(
	now.getTime() + ownerInvitationExpiresInSeconds * 1000,
);

const schoolRow = {
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
	status: "onboarding" as const,
	statusBeforeSuspend: null,
	createdAt: now,
	updatedAt: now,
};

const pendingInvitation = {
	id: invitationId,
	organizationId,
	email: "hernan@santaelena.pe",
	role: "owner",
	status: "pending",
	expiresAt: new Date("2026-01-08T00:00:00.000Z"),
	inviterId: admin.id,
	createdAt: now,
};

const database = { kind: "db" };
const headers = new Headers();

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

describe("reissueOwnerInvitation", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers();
		vi.setSystemTime(now);

		requireGlobalAdminMock.mockResolvedValue(admin);
		getDatabaseMock.mockReturnValue(database);
		getAuthEnvironmentMock.mockReturnValue({
			baseURL: "http://localhost:3000",
		});
		findSchoolByIdMock.mockResolvedValue(schoolRow);
		findPendingOwnerInvitationMock.mockResolvedValue(pendingInvitation);
		adapterUpdateMock.mockResolvedValue({
			...pendingInvitation,
			expiresAt: expectedExpiresAt,
		});
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("extends the pending invitation expiresAt without changing the id", async () => {
		const result = await reissueOwnerInvitation({ headers, schoolId });

		expect(requireGlobalAdminMock).toHaveBeenCalledWith(headers);
		expect(findSchoolByIdMock).toHaveBeenCalledWith(database, schoolId);
		expect(findPendingOwnerInvitationMock).toHaveBeenCalledWith(
			database,
			organizationId,
		);
		expect(adapterUpdateMock).toHaveBeenCalledWith({
			model: "invitation",
			where: [{ field: "id", value: invitationId }],
			update: { expiresAt: expectedExpiresAt },
		});
		expect(result).toEqual({
			invitationId,
			invitationUrl: `http://localhost:3000/invitacion/${invitationId}`,
			expiresAt: expectedExpiresAt,
		});
	});

	it("extends a pending invitation whose expiresAt is already in the past", async () => {
		findPendingOwnerInvitationMock.mockResolvedValue({
			...pendingInvitation,
			expiresAt: new Date("2025-12-01T00:00:00.000Z"),
		});

		const result = await reissueOwnerInvitation({ headers, schoolId });

		expect(adapterUpdateMock).toHaveBeenCalledWith({
			model: "invitation",
			where: [{ field: "id", value: invitationId }],
			update: { expiresAt: expectedExpiresAt },
		});
		expect(result.invitationId).toBe(invitationId);
		expect(result.expiresAt).toEqual(expectedExpiresAt);
	});

	it("throws INVITATION_NOT_PENDING when there is no pending owner invitation", async () => {
		findPendingOwnerInvitationMock.mockResolvedValue(null);

		await expectDomainError(
			() => reissueOwnerInvitation({ headers, schoolId }),
			"INVITATION_NOT_PENDING",
			409,
		);

		expect(adapterUpdateMock).not.toHaveBeenCalled();
	});

	it("throws SCHOOL_NOT_FOUND when the school is missing", async () => {
		findSchoolByIdMock.mockResolvedValue(undefined);

		await expectDomainError(
			() => reissueOwnerInvitation({ headers, schoolId }),
			"SCHOOL_NOT_FOUND",
			404,
		);

		expect(findPendingOwnerInvitationMock).not.toHaveBeenCalled();
		expect(adapterUpdateMock).not.toHaveBeenCalled();
	});
});
