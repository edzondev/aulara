import { requireGlobalAdmin } from "@aulara/auth/guards";
import { getDatabase } from "@aulara/db/client";
import { listInvitationsByOrganizationId } from "@aulara/db/queries/invitations";
import { listMembersWithUserByOrganizationId } from "@aulara/db/queries/members";
import {
	countStudentsBySchoolId,
	listSchools,
} from "@aulara/db/queries/schools";
import type { SchoolStatus } from "@aulara/db/schema";
import type { SchoolStatusFilter } from "./status.ts";

export type AdminSchoolListItem = {
	id: string;
	commercialName: string;
	slug: string;
	status: SchoolStatus;
	createdAt: string;
	teamCount: number;
	studentCount: number;
};

export async function listAdminSchools(input: {
	headers: Headers;
	query: string;
	status: SchoolStatusFilter;
}): Promise<AdminSchoolListItem[]> {
	await requireGlobalAdmin(input.headers);

	const database = getDatabase();
	const rows = await listSchools(database, {
		query: input.query,
		status: input.status,
	});

	return Promise.all(
		rows.map(async ({ school, organization }) => {
			const [members, invitations, studentCount] = await Promise.all([
				listMembersWithUserByOrganizationId(database, school.organizationId),
				listInvitationsByOrganizationId(database, school.organizationId),
				countStudentsBySchoolId(database, school.id),
			]);

			const pendingInvitationCount = invitations.filter(
				(invitation) => invitation.status === "pending",
			).length;

			return {
				id: school.id,
				commercialName: school.commercialName,
				slug: organization.slug,
				status: school.status,
				createdAt: school.createdAt.toISOString(),
				teamCount: members.length + pendingInvitationCount,
				studentCount,
			};
		}),
	);
}
