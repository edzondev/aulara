import { ownerInvitationExpiresInSeconds } from "@aulara/auth/constants";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DomainError } from "../errors.ts";
import { reissueOwnerInvitation } from "./reissue-owner-invitation.ts";

const getDatabaseMock = vi.hoisted(() => vi.fn());
const findSchoolByIdMock = vi.hoisted(() => vi.fn());
const findPendingOwnerInvitationMock = vi.hoisted(() => vi.fn());
const getAuthEnvironmentMock = vi.hoisted(() => vi.fn());
const currentDateMock = vi.hoisted(() => vi.fn(() => new Date()));
const updateInvitationExpiresAtMock = vi.hoisted(() => vi.fn());

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

vi.mock("../clock.ts", async (importOriginal) => {
	const actual = await importOriginal<typeof import("../clock.ts")>();
	return {
		...actual,
		currentDate: currentDateMock,
	};
});

const admin = {
	id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
	email: "jorge@aulara.pe",
	name: "Jorge",
	role: "admin" as const,
};

const schoolId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const organizationId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const invitationId = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const now = new Date("2026-01-01T00:00:00.000Z");
const expectedExpiresAt = new Date(
	now.getTime() + ownerInvitationExpiresInSeconds * 1000,
);

const schoolRow = {
	id: schoolId,
	organizationId,
};

const pendingInvitation = {
	id: invitationId,
	organizationId,
	email: "hernan@santaelena.pe",
	role: "owner",
	status: "pending",
	expiresAt: new Date("2026-01-08T00:00:00.000Z"),
};

const database = { kind: "db" };
const orgAdapter = {
	createOrganization: vi.fn(),
	listMemberIds: vi.fn(),
	findPendingInvitations: vi.fn(),
	createOwnerInvitation: vi.fn(),
	updateInvitationExpiresAt: updateInvitationExpiresAtMock,
};

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
		currentDateMock.mockImplementation(() => new Date());
		vi.useFakeTimers();
		vi.setSystemTime(now);

		getDatabaseMock.mockReturnValue(database);
		getAuthEnvironmentMock.mockReturnValue({
			baseURL: "http://localhost:3000",
		});
		findSchoolByIdMock.mockResolvedValue(schoolRow);
		findPendingOwnerInvitationMock.mockResolvedValue(pendingInvitation);
		updateInvitationExpiresAtMock.mockResolvedValue(undefined);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("extends the pending invitation expiresAt without changing the id", async () => {
		const result = await reissueOwnerInvitation({
			admin,
			schoolId,
			orgAdapter,
		});

		expect(findSchoolByIdMock).toHaveBeenCalledWith(database, schoolId);
		expect(updateInvitationExpiresAtMock).toHaveBeenCalledWith(
			invitationId,
			expectedExpiresAt,
		);
		expect(result).toEqual({
			invitationId,
			invitationUrl: `http://localhost:3000/invitacion/${invitationId}`,
			expiresAt: expectedExpiresAt,
		});
	});

	it("computes expiresAt from currentDate, not the process clock", async () => {
		vi.useRealTimers();
		const frozen = new Date("2099-01-01T00:00:00.000Z");
		currentDateMock.mockReturnValue(frozen);
		const expected = new Date(
			frozen.getTime() + ownerInvitationExpiresInSeconds * 1000,
		);

		const result = await reissueOwnerInvitation({
			admin,
			schoolId,
			orgAdapter,
		});

		expect(updateInvitationExpiresAtMock).toHaveBeenCalledWith(
			invitationId,
			expected,
		);
		expect(result.expiresAt).toEqual(expected);
	});

	it("throws INVITATION_NOT_PENDING when there is no pending owner invitation", async () => {
		findPendingOwnerInvitationMock.mockResolvedValue(null);

		await expectDomainError(
			() => reissueOwnerInvitation({ admin, schoolId, orgAdapter }),
			"INVITATION_NOT_PENDING",
			409,
		);

		expect(updateInvitationExpiresAtMock).not.toHaveBeenCalled();
	});

	it("throws SCHOOL_NOT_FOUND when the school is missing", async () => {
		findSchoolByIdMock.mockResolvedValue(undefined);

		await expectDomainError(
			() => reissueOwnerInvitation({ admin, schoolId, orgAdapter }),
			"SCHOOL_NOT_FOUND",
			404,
		);
	});

	it("throws INVALID_INPUT when the school id is not a UUID", async () => {
		await expectDomainError(
			() =>
				reissueOwnerInvitation({
					admin,
					schoolId: "school-id",
					orgAdapter,
				}),
			"INVALID_INPUT",
			400,
		);

		expect(findSchoolByIdMock).not.toHaveBeenCalled();
	});
});
