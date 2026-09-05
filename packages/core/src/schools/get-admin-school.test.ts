import { beforeEach, describe, expect, it, vi } from "vitest";
import { DomainError } from "../errors.ts";
import { getAdminSchool } from "./get-admin-school.ts";
import { writePendingOwnerName } from "./organization-metadata.ts";

const getDatabaseMock = vi.hoisted(() => vi.fn());
const findSchoolByIdMock = vi.hoisted(() => vi.fn());
const countStudentsBySchoolIdMock = vi.hoisted(() => vi.fn());
const findActiveAcademicYearNameMock = vi.hoisted(() => vi.fn());
const listMembersWithUserByOrganizationIdMock = vi.hoisted(() => vi.fn());
const findOrganizationByIdMock = vi.hoisted(() => vi.fn());
const listInvitationsByOrganizationIdMock = vi.hoisted(() => vi.fn());
const getAuthEnvironmentMock = vi.hoisted(() => vi.fn());

vi.mock("@aulara/db/client", () => ({
	getDatabase: getDatabaseMock,
}));

vi.mock("@aulara/db/queries/schools", () => ({
	findSchoolById: findSchoolByIdMock,
	countStudentsBySchoolId: countStudentsBySchoolIdMock,
	findActiveAcademicYearName: findActiveAcademicYearNameMock,
}));

vi.mock("@aulara/db/queries/members", () => ({
	listMembersWithUserByOrganizationId: listMembersWithUserByOrganizationIdMock,
	findOrganizationById: findOrganizationByIdMock,
}));

vi.mock("@aulara/db/queries/invitations", () => ({
	listInvitationsByOrganizationId: listInvitationsByOrganizationIdMock,
}));

vi.mock("@aulara/env/auth", () => ({
	getAuthEnvironment: getAuthEnvironmentMock,
}));

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
const database = { kind: "db" };

const schoolRow = {
	id: schoolId,
	organizationId,
	legalName: "Colegio Santa Elena",
	commercialName: "Colegio Santa Elena",
	status: "onboarding" as const,
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

describe("getAdminSchool", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		getDatabaseMock.mockReturnValue(database);
		getAuthEnvironmentMock.mockReturnValue({
			baseURL: "http://localhost:3000",
		});
		findSchoolByIdMock.mockResolvedValue(schoolRow);
		findOrganizationByIdMock.mockResolvedValue(organizationRow);
		listMembersWithUserByOrganizationIdMock.mockResolvedValue([
			{
				role: "admin",
				user: { name: "Lucía", email: "lucia@santaelena.pe" },
			},
			{
				role: "member",
				user: { name: "Pedro", email: "pedro@santaelena.pe" },
			},
		]);
		listInvitationsByOrganizationIdMock.mockResolvedValue([
			{
				id: invitationId,
				email: "hernan@santaelena.pe",
				role: "owner",
				status: "pending",
				createdAt: now,
			},
			{
				id: "inv-member",
				email: "ana@santaelena.pe",
				role: "member",
				status: "pending",
				createdAt: now,
			},
			{
				id: "inv-accepted",
				email: "old@santaelena.pe",
				role: "owner",
				status: "accepted",
				createdAt: now,
			},
		]);
		countStudentsBySchoolIdMock.mockResolvedValue(0);
		findActiveAcademicYearNameMock.mockResolvedValue(null);
	});

	it("maps people, invitation URL, and year label", async () => {
		const result = await getAdminSchool({ admin, schoolId });

		expect(findSchoolByIdMock).toHaveBeenCalledWith(database, schoolId);
		expect(listMembersWithUserByOrganizationIdMock).toHaveBeenCalledWith(
			database,
			organizationId,
		);
		expect(listInvitationsByOrganizationIdMock).toHaveBeenCalledWith(
			database,
			organizationId,
		);
		expect(countStudentsBySchoolIdMock).toHaveBeenCalledWith(
			database,
			schoolId,
		);
		expect(findActiveAcademicYearNameMock).toHaveBeenCalledWith(
			database,
			schoolId,
		);
		expect(result).toEqual({
			id: schoolId,
			commercialName: "Colegio Santa Elena",
			slug: "colegio-santa-elena",
			status: "onboarding",
			createdAt: "2026-01-01T00:00:00.000Z",
			activeAcademicYearLabel: "sin configurar",
			studentCount: 0,
			memberCount: 2,
			people: [
				{
					kind: "member",
					name: "Lucía",
					email: "lucia@santaelena.pe",
					roleLabel: "Administrador",
					statusLabel: "Activo",
					canResend: false,
				},
				{
					kind: "member",
					name: "Pedro",
					email: "pedro@santaelena.pe",
					roleLabel: "Miembro",
					statusLabel: "Activo",
					canResend: false,
				},
				{
					kind: "invitation",
					name: "Hernán",
					email: "hernan@santaelena.pe",
					roleLabel: "Propietario",
					statusLabel: "Invitación enviada",
					canResend: true,
				},
			],
			invitationUrl: `http://localhost:3000/invitacion/${invitationId}`,
		});
	});

	it("uses the academic year name and omits invitationUrl when there is no pending owner", async () => {
		findActiveAcademicYearNameMock.mockResolvedValue("2026");
		listInvitationsByOrganizationIdMock.mockResolvedValue([]);

		const result = await getAdminSchool({ admin, schoolId });

		expect(result.activeAcademicYearLabel).toBe("2026");
		expect(result.invitationUrl).toBeNull();
		expect(result.people).toHaveLength(2);
	});

	it("throws SCHOOL_NOT_FOUND when the school is missing", async () => {
		findSchoolByIdMock.mockResolvedValue(undefined);

		await expectDomainError(
			() => getAdminSchool({ admin, schoolId }),
			"SCHOOL_NOT_FOUND",
			404,
		);

		expect(listMembersWithUserByOrganizationIdMock).not.toHaveBeenCalled();
		expect(listInvitationsByOrganizationIdMock).not.toHaveBeenCalled();
	});
});
