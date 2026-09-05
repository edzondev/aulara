import { ownerInvitationExpiresInSeconds } from "@aulara/auth/constants";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DomainError } from "../errors.ts";
import {
	readPendingOwnerName,
	writePendingOwnerName,
} from "./organization-metadata.ts";
import { provisionSchoolTenant } from "./provision-school.ts";

const requireGlobalAdminMock = vi.hoisted(() => vi.fn());
const getDatabaseMock = vi.hoisted(() => vi.fn());
const findSchoolByOrganizationIdMock = vi.hoisted(() => vi.fn());
const getOrgAdapterMock = vi.hoisted(() => vi.fn());
const createOrganizationMock = vi.hoisted(() => vi.fn());
const createInvitationMock = vi.hoisted(() => vi.fn());
const createMemberMock = vi.hoisted(() => vi.fn());
const findOrganizationBySlugMock = vi.hoisted(() => vi.fn());
const findMemberByEmailMock = vi.hoisted(() => vi.fn());
const listMembersMock = vi.hoisted(() => vi.fn());
const findPendingInvitationMock = vi.hoisted(() => vi.fn());
const findPendingOwnerInvitationMock = vi.hoisted(() => vi.fn());
const getAuthEnvironmentMock = vi.hoisted(() => vi.fn());

vi.mock("@aulara/auth/guards", () => ({
	requireGlobalAdmin: requireGlobalAdminMock,
}));

vi.mock("@aulara/auth/server", () => ({
	auth: { $context: Promise.resolve({ adapter: {} }) },
}));

vi.mock("better-auth/plugins/organization", () => ({
	getOrgAdapter: getOrgAdapterMock,
}));

vi.mock("@aulara/db/client", () => ({
	getDatabase: getDatabaseMock,
}));

vi.mock("@aulara/db/queries/schools", () => ({
	findSchoolByOrganizationId: findSchoolByOrganizationIdMock,
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

const organizationId = "org-id";
const schoolId = "school-id";
const invitationId = "inv-id";
const ownerName = "Hernán";
const ownerEmail = "hernan@santaelena.pe";
const organizationName = "Colegio Santa Elena";
const organizationSlug = "colegio-santa-elena";

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
	organizationId,
	email: ownerEmail,
	role: "owner",
	status: "pending",
	expiresAt: new Date("2026-01-08T00:00:00.000Z"),
	inviterId: admin.id,
	createdAt: new Date("2026-01-01T00:00:00.000Z"),
};

const provisionInput = {
	headers: new Headers(),
	organizationName,
	organizationSlug: "Colegio Santa Elena",
	ownerName,
	ownerEmail: "Hernan@santaelena.pe",
};

const insertValuesMock = vi.fn();

function createSelectChain(rows: unknown[]) {
	const chain = {
		from: vi.fn(),
		where: vi.fn(),
		limit: vi.fn().mockResolvedValue(rows),
	};
	chain.from.mockReturnValue(chain);
	chain.where.mockReturnValue(chain);
	return chain;
}

function mockDatabase(existingOrganization: typeof organizationRow | null) {
	insertValuesMock.mockReturnValue({
		returning: vi.fn().mockResolvedValue([schoolRow]),
	});

	const select = vi.fn();
	if (existingOrganization) {
		select.mockReturnValue(createSelectChain([existingOrganization]));
	} else {
		select
			.mockReturnValueOnce(createSelectChain([]))
			.mockReturnValue(createSelectChain([organizationRow]));
	}

	getDatabaseMock.mockReturnValue({
		select,
		insert: vi.fn(() => ({
			values: insertValuesMock,
		})),
	});
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

describe("provisionSchoolTenant", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		requireGlobalAdminMock.mockResolvedValue(admin);
		getAuthEnvironmentMock.mockReturnValue({
			baseURL: "http://localhost:3000",
		});
		getOrgAdapterMock.mockReturnValue({
			createOrganization: createOrganizationMock,
			createInvitation: createInvitationMock,
			createMember: createMemberMock,
			findOrganizationBySlug: findOrganizationBySlugMock,
			findMemberByEmail: findMemberByEmailMock,
			listMembers: listMembersMock,
			findPendingInvitation: findPendingInvitationMock,
		});
		createOrganizationMock.mockResolvedValue({
			...organizationRow,
			metadata: { pendingOwnerName: ownerName },
		});
		createInvitationMock.mockResolvedValue(invitationRow);
		findMemberByEmailMock.mockResolvedValue(null);
		listMembersMock.mockResolvedValue({ members: [], total: 0 });
		findPendingInvitationMock.mockResolvedValue([]);
		findPendingOwnerInvitationMock.mockResolvedValue(null);
		findSchoolByOrganizationIdMock.mockResolvedValue(null);
		mockDatabase(null);
	});

	it("creates an organization and owner invitation without a member", async () => {
		const result = await provisionSchoolTenant(provisionInput);

		expect(requireGlobalAdminMock).toHaveBeenCalledWith(provisionInput.headers);
		expect(getOrgAdapterMock).toHaveBeenCalledWith(
			{ adapter: {} },
			{ invitationExpiresIn: ownerInvitationExpiresInSeconds },
		);
		expect(createOrganizationMock).toHaveBeenCalledWith({
			organization: {
				name: organizationName,
				slug: organizationSlug,
				createdAt: expect.any(Date),
				metadata: JSON.parse(writePendingOwnerName(null, ownerName)),
			},
		});
		expect(createInvitationMock).toHaveBeenCalledWith({
			invitation: {
				email: ownerEmail,
				role: "owner",
				organizationId,
				teamIds: [],
			},
			user: { id: admin.id },
		});
		expect(createMemberMock).not.toHaveBeenCalled();
		expect(insertValuesMock).toHaveBeenCalledWith(
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

	it("returns an onboarding school and an invitation URL", async () => {
		const result = await provisionSchoolTenant(provisionInput);

		expect(result.school.status).toBe("onboarding");
		expect(result.invitationUrl).toBe(
			`http://localhost:3000/invitacion/${invitationId}`,
		);
		expect(result.invitationUrl.endsWith(`/invitacion/${invitationId}`)).toBe(
			true,
		);
	});

	it("returns Drizzle organization metadata as a string", async () => {
		const result = await provisionSchoolTenant(provisionInput);

		expect(typeof result.organization.metadata).toBe("string");
		expect(readPendingOwnerName(result.organization.metadata)).toBe(ownerName);
	});

	it("throws PROVISIONING_CONFLICT when the slug is empty after slugify", async () => {
		const error = await expectDomainError(
			() =>
				provisionSchoolTenant({
					...provisionInput,
					organizationName: "***",
					organizationSlug: "***",
				}),
			"PROVISIONING_CONFLICT",
			409,
		);

		expect(error.message).toBe("The organization slug is invalid");
		expect(createOrganizationMock).not.toHaveBeenCalled();
		expect(createInvitationMock).not.toHaveBeenCalled();
	});

	it("throws PROVISIONING_CONFLICT when the slug belongs to a different organization name", async () => {
		mockDatabase({
			...organizationRow,
			name: "Otro Colegio",
		});

		await expectDomainError(
			() => provisionSchoolTenant(provisionInput),
			"PROVISIONING_CONFLICT",
			409,
		);

		expect(createOrganizationMock).not.toHaveBeenCalled();
		expect(createInvitationMock).not.toHaveBeenCalled();
	});

	it("throws PROVISIONING_CONFLICT when the organization already exists with a different owner email", async () => {
		mockDatabase(organizationRow);
		findSchoolByOrganizationIdMock.mockResolvedValue(schoolRow);
		findPendingOwnerInvitationMock.mockResolvedValue(invitationRow);

		await expectDomainError(
			() =>
				provisionSchoolTenant({
					...provisionInput,
					ownerEmail: "otro@santaelena.pe",
				}),
			"PROVISIONING_CONFLICT",
			409,
		);

		expect(createInvitationMock).not.toHaveBeenCalled();
		expect(createMemberMock).not.toHaveBeenCalled();
	});

	it("throws PROVISIONING_CONFLICT when the organization already has a member for a different email", async () => {
		mockDatabase(organizationRow);
		findSchoolByOrganizationIdMock.mockResolvedValue(schoolRow);
		findPendingOwnerInvitationMock.mockResolvedValue(null);
		listMembersMock.mockResolvedValue({
			members: [
				{
					id: "member-id",
					organizationId,
					userId: "user-a",
					role: "owner",
					createdAt: new Date("2026-01-02T00:00:00.000Z"),
					user: {
						id: "user-a",
						email: ownerEmail,
						name: ownerName,
						image: null,
					},
				},
			],
			total: 1,
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

		expect(createInvitationMock).not.toHaveBeenCalled();
		expect(createMemberMock).not.toHaveBeenCalled();
	});

	it("reuses an existing pending invitation for the same email", async () => {
		mockDatabase(organizationRow);
		findSchoolByOrganizationIdMock.mockResolvedValue(schoolRow);
		findPendingInvitationMock.mockResolvedValue([invitationRow]);

		const result = await provisionSchoolTenant(provisionInput);

		expect(createOrganizationMock).not.toHaveBeenCalled();
		expect(createInvitationMock).not.toHaveBeenCalled();
		expect(createMemberMock).not.toHaveBeenCalled();
		expect(result.organization).toEqual(organizationRow);
		expect(result.school).toEqual(schoolRow);
		expect(result.invitation.id).toBe(invitationId);
		expect(result.invitationUrl).toBe(
			`http://localhost:3000/invitacion/${invitationId}`,
		);
	});
});
