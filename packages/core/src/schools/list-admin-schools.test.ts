import { beforeEach, describe, expect, it, vi } from "vitest";
import { listAdminSchools } from "./list-admin-schools.ts";

const requireGlobalAdminMock = vi.hoisted(() => vi.fn());
const getDatabaseMock = vi.hoisted(() => vi.fn());
const listSchoolsMock = vi.hoisted(() => vi.fn());
const countStudentsBySchoolIdMock = vi.hoisted(() => vi.fn());
const listMembersWithUserByOrganizationIdMock = vi.hoisted(() => vi.fn());
const listInvitationsByOrganizationIdMock = vi.hoisted(() => vi.fn());

vi.mock("@aulara/auth/guards", () => ({
	requireGlobalAdmin: requireGlobalAdminMock,
}));

vi.mock("@aulara/db/client", () => ({
	getDatabase: getDatabaseMock,
}));

vi.mock("@aulara/db/queries/schools", () => ({
	listSchools: listSchoolsMock,
	countStudentsBySchoolId: countStudentsBySchoolIdMock,
}));

vi.mock("@aulara/db/queries/members", () => ({
	listMembersWithUserByOrganizationId: listMembersWithUserByOrganizationIdMock,
}));

vi.mock("@aulara/db/queries/invitations", () => ({
	listInvitationsByOrganizationId: listInvitationsByOrganizationIdMock,
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
const database = { kind: "db" };

describe("listAdminSchools", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		requireGlobalAdminMock.mockResolvedValue(admin);
		getDatabaseMock.mockReturnValue(database);
		listSchoolsMock.mockResolvedValue([
			{
				school: {
					id: schoolId,
					organizationId,
					commercialName: "Colegio Santa Elena",
					status: "onboarding",
					createdAt: now,
				},
				organization: {
					id: organizationId,
					slug: "colegio-santa-elena",
				},
			},
		]);
		listMembersWithUserByOrganizationIdMock.mockResolvedValue([
			{ id: "member-1" },
			{ id: "member-2" },
		]);
		listInvitationsByOrganizationIdMock.mockResolvedValue([
			{ id: "inv-pending", status: "pending" },
			{ id: "inv-accepted", status: "accepted" },
		]);
		countStudentsBySchoolIdMock.mockResolvedValue(0);
	});

	it("requires a global admin and maps teamCount as members plus pending invitations", async () => {
		const result = await listAdminSchools({
			headers,
			query: "santa",
			status: "onboarding",
		});

		expect(requireGlobalAdminMock).toHaveBeenCalledWith(headers);
		expect(listSchoolsMock).toHaveBeenCalledWith(database, {
			query: "santa",
			status: "onboarding",
		});
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
		expect(result).toEqual([
			{
				id: schoolId,
				commercialName: "Colegio Santa Elena",
				slug: "colegio-santa-elena",
				status: "onboarding",
				createdAt: "2026-01-01T00:00:00.000Z",
				teamCount: 3,
				studentCount: 0,
			},
		]);
	});
});
