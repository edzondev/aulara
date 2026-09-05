import { beforeEach, describe, expect, it, vi } from "vitest";
import { DomainError } from "../errors.ts";
import {
	readPendingOwnerName,
	writePendingOwnerName,
} from "./organization-metadata.ts";
import { provisionSchoolTenant } from "./provision-school.ts";

const getDatabaseMock = vi.hoisted(() => vi.fn());
const findSchoolByOrganizationIdMock = vi.hoisted(() => vi.fn());
const insertSchoolMock = vi.hoisted(() => vi.fn());
const findOrganizationBySlugMock = vi.hoisted(() => vi.fn());
const findPendingOwnerInvitationMock = vi.hoisted(() => vi.fn());
const getAuthEnvironmentMock = vi.hoisted(() => vi.fn());
const currentDateMock = vi.hoisted(() => vi.fn(() => new Date()));
const createOrganizationMock = vi.hoisted(() => vi.fn());
const listMemberIdsMock = vi.hoisted(() => vi.fn());
const findPendingInvitationsMock = vi.hoisted(() => vi.fn());
const createOwnerInvitationMock = vi.hoisted(() => vi.fn());
const updateInvitationExpiresAtMock = vi.hoisted(() => vi.fn());

vi.mock("@aulara/db/client", () => ({
	getDatabase: getDatabaseMock,
}));

vi.mock("@aulara/db/queries/schools", () => ({
	findSchoolByOrganizationId: findSchoolByOrganizationIdMock,
	insertSchool: insertSchoolMock,
}));

vi.mock("@aulara/db/queries/members", () => ({
	findOrganizationBySlug: findOrganizationBySlugMock,
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

const organizationId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const schoolId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const invitationId = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const ownerName = "Hernán";
const ownerEmail = "hernan@santaelena.pe";
const organizationName = "Colegio Santa Elena";
const organizationSlug = "colegio-santa-elena";
const database = { kind: "db" };

const organizationRow = {
	id: organizationId,
	name: organizationName,
	slug: organizationSlug,
	logo: null,
	createdAt: new Date("2026-01-01T00:00:00.000Z"),
	metadata: writePendingOwnerName(null, ownerName),
};

const schoolRow = {
	id: schoolId,
	organizationId,
	legalName: organizationName,
	commercialName: organizationName,
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
	createdAt: new Date("2026-01-01T00:00:00.000Z"),
	updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

const invitationRow = {
	id: invitationId,
	email: ownerEmail,
	role: "owner",
	status: "pending",
	expiresAt: new Date("2026-01-08T00:00:00.000Z"),
};

const orgAdapter = {
	createOrganization: createOrganizationMock,
	listMemberIds: listMemberIdsMock,
	findPendingInvitations: findPendingInvitationsMock,
	createOwnerInvitation: createOwnerInvitationMock,
	updateInvitationExpiresAt: updateInvitationExpiresAtMock,
};

const provisionInput = {
	admin,
	organizationName,
	organizationSlug: "Colegio Santa Elena",
	ownerName,
	ownerEmail: "Hernan@santaelena.pe",
	orgAdapter,
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

describe("provisionSchoolTenant", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		currentDateMock.mockImplementation(() => new Date());
		getDatabaseMock.mockReturnValue(database);
		getAuthEnvironmentMock.mockReturnValue({
			baseURL: "http://localhost:3000",
		});
		findOrganizationBySlugMock
			.mockResolvedValueOnce(null)
			.mockResolvedValue(organizationRow);
		findSchoolByOrganizationIdMock.mockResolvedValue(null);
		insertSchoolMock.mockResolvedValue(schoolRow);
		findPendingOwnerInvitationMock.mockResolvedValue(null);
		listMemberIdsMock.mockResolvedValue([]);
		findPendingInvitationsMock.mockResolvedValue([]);
		createOwnerInvitationMock.mockResolvedValue(invitationRow);
		createOrganizationMock.mockResolvedValue(undefined);
	});

	it("creates an organization and owner invitation without a member", async () => {
		const result = await provisionSchoolTenant(provisionInput);

		expect(createOrganizationMock).toHaveBeenCalledWith({
			name: organizationName,
			slug: organizationSlug,
			createdAt: expect.any(Date),
			metadata: JSON.parse(writePendingOwnerName(null, ownerName)),
		});
		expect(createOwnerInvitationMock).toHaveBeenCalledWith({
			email: ownerEmail,
			organizationId,
			inviterUserId: admin.id,
		});
		expect(insertSchoolMock).toHaveBeenCalledWith(
			database,
			expect.objectContaining({
				organizationId,
				legalName: organizationName,
				commercialName: organizationName,
				status: "onboarding",
			}),
		);
		expect(result.organization.id).toBe(organizationId);
		expect(result.invitation).toMatchObject({
			id: invitationId,
			email: ownerEmail,
			role: "owner",
			status: "pending",
		});
	});

	it("stamps organization.createdAt from currentDate", async () => {
		const frozen = new Date("2026-02-03T04:05:06.000Z");
		currentDateMock.mockReturnValue(frozen);

		await provisionSchoolTenant(provisionInput);

		expect(createOrganizationMock).toHaveBeenCalledWith({
			name: organizationName,
			slug: organizationSlug,
			createdAt: frozen,
			metadata: JSON.parse(writePendingOwnerName(null, ownerName)),
		});
	});

	it("returns an onboarding school and an invitation URL", async () => {
		const result = await provisionSchoolTenant(provisionInput);

		expect(result.school.status).toBe("onboarding");
		expect(result.invitationUrl).toBe(
			`http://localhost:3000/invitacion/${invitationId}`,
		);
	});

	it("returns organization metadata as a string", async () => {
		const result = await provisionSchoolTenant(provisionInput);

		expect(typeof result.organization.metadata).toBe("string");
		expect(readPendingOwnerName(result.organization.metadata)).toBe(ownerName);
	});

	it("throws INVALID_EMAIL when the owner email contains a second @", async () => {
		const error = await expectDomainError(
			() =>
				provisionSchoolTenant({
					...provisionInput,
					ownerEmail: "maria@santatest@gmail.com",
				}),
			"INVALID_EMAIL",
			400,
		);

		expect(error.message).toBe("The owner email is invalid");
		expect(createOrganizationMock).not.toHaveBeenCalled();
		expect(createOwnerInvitationMock).not.toHaveBeenCalled();
	});

	it("throws PROVISIONING_CONFLICT when the slug is empty after slugify", async () => {
		await expectDomainError(
			() =>
				provisionSchoolTenant({
					...provisionInput,
					organizationName: "***",
					organizationSlug: "***",
				}),
			"PROVISIONING_CONFLICT",
			409,
		);

		expect(createOrganizationMock).not.toHaveBeenCalled();
	});

	it("throws PROVISIONING_CONFLICT when the slug belongs to a different organization name", async () => {
		findOrganizationBySlugMock.mockReset();
		findOrganizationBySlugMock.mockResolvedValue({
			...organizationRow,
			name: "Otro Colegio",
		});

		await expectDomainError(
			() => provisionSchoolTenant(provisionInput),
			"PROVISIONING_CONFLICT",
			409,
		);

		expect(createOrganizationMock).not.toHaveBeenCalled();
	});

	it("throws PROVISIONING_CONFLICT when the organization already has an owner invitation for a different email", async () => {
		findOrganizationBySlugMock.mockReset();
		findOrganizationBySlugMock.mockResolvedValue(organizationRow);
		findSchoolByOrganizationIdMock.mockResolvedValue(schoolRow);
		findPendingOwnerInvitationMock.mockResolvedValue({
			...invitationRow,
			email: ownerEmail,
		});

		await expectDomainError(
			() =>
				provisionSchoolTenant({
					...provisionInput,
					ownerEmail: "otro@santaelena.pe",
				}),
			"PROVISIONING_CONFLICT",
			409,
		);

		expect(createOwnerInvitationMock).not.toHaveBeenCalled();
	});

	it("throws PROVISIONING_CONFLICT when the organization already has a member", async () => {
		findOrganizationBySlugMock.mockReset();
		findOrganizationBySlugMock.mockResolvedValue(organizationRow);
		findSchoolByOrganizationIdMock.mockResolvedValue(schoolRow);
		listMemberIdsMock.mockResolvedValue(["member-id"]);

		await expectDomainError(
			() => provisionSchoolTenant(provisionInput),
			"PROVISIONING_CONFLICT",
			409,
		);

		expect(createOwnerInvitationMock).not.toHaveBeenCalled();
	});

	it("reuses an existing pending invitation for the same email", async () => {
		findOrganizationBySlugMock.mockReset();
		findOrganizationBySlugMock.mockResolvedValue(organizationRow);
		findSchoolByOrganizationIdMock.mockResolvedValue(schoolRow);
		findPendingInvitationsMock.mockResolvedValue([invitationRow]);

		const result = await provisionSchoolTenant(provisionInput);

		expect(createOrganizationMock).not.toHaveBeenCalled();
		expect(createOwnerInvitationMock).not.toHaveBeenCalled();
		expect(result.organization).toEqual(organizationRow);
		expect(result.school).toEqual(schoolRow);
		expect(result.invitation.id).toBe(invitationId);
	});
});
