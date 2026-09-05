import { getDatabase } from "@aulara/db/client";
import { listAdminSchoolSummaries } from "@aulara/db/queries/schools";
import type { GlobalAdmin } from "./provision-school.ts";
import type { SchoolStatusFilter } from "./status.ts";
import type { AdminSchoolListItem } from "./types.ts";

export type { AdminSchoolListItem };

export async function listAdminSchools(input: {
	admin: GlobalAdmin;
	query: string;
	status: SchoolStatusFilter;
}): Promise<AdminSchoolListItem[]> {
	void input.admin;

	const rows = await listAdminSchoolSummaries(getDatabase(), {
		query: input.query,
		status: input.status,
	});

	return rows.map(({ school, organization, teamCount, studentCount }) => ({
		id: school.id,
		commercialName: school.commercialName,
		slug: organization.slug,
		status: school.status,
		createdAt: school.createdAt.toISOString(),
		teamCount,
		studentCount,
	}));
}
