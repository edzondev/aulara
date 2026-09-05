import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DomainError } from "../errors.ts";
import { getOwnerInvitationForAccept } from "./get-owner-invitation.ts";
import { writePendingOwnerName } from "./organization-metadata.ts";

const getDatabaseMock = vi.hoisted(() => vi.fn());
const findInvitationByIdMock = vi.hoisted(() => vi.fn());
const findOrganizationByIdMock = vi.hoisted(() => vi.fn());
const requireGlobalAdminMock = vi.hoisted(() => vi.fn());
const currentDateMock = vi.hoisted(() => vi.fn(() => new Date()));

vi.mock("@aulara/db/client", () => ({
	getDatabase: getDatabaseMock,
}));

vi.mock("@aulara/db/queries/invitations", () => ({
	findInvitationById: findInvitationByIdMock,
}));

vi.mock("@aulara/db/queries/members", () => ({
	findOrganizationById: findOrganizationByIdMock,
}));

vi.mock("@aulara/auth/guards", () => ({
	requireGlobalAdmin: requireGlobalAdminMock,
}));

vi.mock("../clock.ts", async (importOriginal) => {
	const actual = await importOriginal<typeof import("../clock.ts")>();
	return {
		...actual,
		currentDate: currentDateMock,
	};
});

const invitationId = "inv-id";
const organizationId = "org-id";
const now = new Date("2026-01-01T00:00:00.000Z");
const database = { kind: "db" };

const pendingInvitation = {
	id: invitationId,
	organizationId,
	email: "hernan@santaelena.pe",
	role: "owner",
	status: "pending",
	expiresAt: new Date("2026-01-08T00:00:00.000Z"),
	inviterId: "admin-id",
	createdAt: now,
};

const organizationRow = {
	id: organizationId,
	name: "Colegio Santa Elena",
	slug: "colegio-santa-elena",
	logo: null,
	createdAt: now,
	metadata: writePendingOwnerName(null, "Hernán"),
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

describe("getOwnerInvitationForAccept", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		currentDateMock.mockImplementation(() => new Date());
		vi.useFakeTimers();
		vi.setSystemTime(now);

		getDatabaseMock.mockReturnValue(database);
		findInvitationByIdMock.mockResolvedValue(pendingInvitation);
		findOrganizationByIdMock.mockResolvedValue(organizationRow);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("returns email, org name, and pending owner name for a pending invitation", async () => {
		const result = await getOwnerInvitationForAccept(invitationId);

		expect(requireGlobalAdminMock).not.toHaveBeenCalled();
		expect(findInvitationByIdMock).toHaveBeenCalledWith(database, invitationId);
		expect(findOrganizationByIdMock).toHaveBeenCalledWith(
			database,
			organizationId,
		);
		expect(result).toEqual({
			id: invitationId,
			email: "hernan@santaelena.pe",
			organizationId,
			organizationName: "Colegio Santa Elena",
			organizationSlug: "colegio-santa-elena",
			pendingOwnerName: "Hernán",
			expiresAt: "2026-01-08T00:00:00.000Z",
		});
	});

	it("throws INVITATION_NOT_FOUND when the invitation is missing", async () => {
		findInvitationByIdMock.mockResolvedValue(undefined);

		await expectDomainError(
			() => getOwnerInvitationForAccept(invitationId),
			"INVITATION_NOT_FOUND",
			404,
		);

		expect(requireGlobalAdminMock).not.toHaveBeenCalled();
		expect(findOrganizationByIdMock).not.toHaveBeenCalled();
	});

	it("throws INVITATION_NOT_PENDING when the invitation is not pending", async () => {
		findInvitationByIdMock.mockResolvedValue({
			...pendingInvitation,
			status: "accepted",
		});

		await expectDomainError(
			() => getOwnerInvitationForAccept(invitationId),
			"INVITATION_NOT_PENDING",
			409,
		);

		expect(findOrganizationByIdMock).not.toHaveBeenCalled();
	});

	it("throws INVITATION_EXPIRED when a pending invitation is past expiresAt", async () => {
		findInvitationByIdMock.mockResolvedValue({
			...pendingInvitation,
			expiresAt: new Date("2025-12-31T23:59:59.000Z"),
		});

		await expectDomainError(
			() => getOwnerInvitationForAccept(invitationId),
			"INVITATION_EXPIRED",
			410,
		);

		expect(findOrganizationByIdMock).not.toHaveBeenCalled();
	});

	it("compares expiry against currentDate, not the process clock", async () => {
		vi.useRealTimers();
		currentDateMock.mockReturnValue(new Date("2099-06-02T00:00:00.000Z"));
		findInvitationByIdMock.mockResolvedValue({
			...pendingInvitation,
			expiresAt: new Date("2099-06-01T00:00:00.000Z"),
		});

		await expectDomainError(
			() => getOwnerInvitationForAccept(invitationId),
			"INVITATION_EXPIRED",
			410,
		);
	});
});
