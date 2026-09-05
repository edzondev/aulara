import { beforeEach, describe, expect, it, vi } from "vitest";
import { listAdminSchools } from "./list-admin-schools.ts";

const getDatabaseMock = vi.hoisted(() => vi.fn());
const listAdminSchoolSummariesMock = vi.hoisted(() => vi.fn());

vi.mock("@aulara/db/client", () => ({
	getDatabase: getDatabaseMock,
}));

vi.mock("@aulara/db/queries/schools", () => ({
	listAdminSchoolSummaries: listAdminSchoolSummariesMock,
}));

const admin = {
	id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
	email: "jorge@aulara.pe",
	name: "Jorge",
	role: "admin" as const,
};

const schoolId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const now = new Date("2026-01-01T00:00:00.000Z");
const database = { kind: "db" };

describe("listAdminSchools", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		getDatabaseMock.mockReturnValue(database);
		listAdminSchoolSummariesMock.mockResolvedValue([
			{
				school: {
					id: schoolId,
					commercialName: "Colegio Santa Elena",
					status: "onboarding",
					createdAt: now,
				},
				organization: {
					slug: "colegio-santa-elena",
				},
				teamCount: 3,
				studentCount: 0,
			},
		]);
	});

	it("maps a single summary query into list items", async () => {
		const result = await listAdminSchools({
			admin,
			query: "santa",
			status: "onboarding",
		});

		expect(listAdminSchoolSummariesMock).toHaveBeenCalledWith(database, {
			query: "santa",
			status: "onboarding",
		});
		expect(listAdminSchoolSummariesMock).toHaveBeenCalledOnce();
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
