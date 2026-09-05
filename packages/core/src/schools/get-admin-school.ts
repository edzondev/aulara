import { hasOrganizationRole } from "@aulara/auth/permissions";
import { getDatabase } from "@aulara/db/client";
import { listInvitationsByOrganizationId } from "@aulara/db/queries/invitations";
import {
	findOrganizationById,
	listMembersWithUserByOrganizationId,
} from "@aulara/db/queries/members";
import {
	countStudentsBySchoolId,
	findActiveAcademicYearName,
	findSchoolById,
} from "@aulara/db/queries/schools";
import { getAuthEnvironment } from "@aulara/env/auth";
import { DomainError } from "../errors.ts";
import { parseDomainInput } from "../parse.ts";
import { ownerInvitationUrl } from "./invitation-url.ts";
import { readPendingOwnerName } from "./organization-metadata.ts";
import type { GlobalAdmin } from "./provision-school.ts";
import { schoolIdSchema } from "./school-id-schema.ts";
import type { AdminSchoolDetail, AdminSchoolPerson } from "./types.ts";

export type { AdminSchoolDetail, AdminSchoolPerson };

function isOwnerRole(role: string | null | undefined): boolean {
	return hasOrganizationRole(role, "owner");
}

function personRoleLabel(
	role: string | null | undefined,
): AdminSchoolPerson["roleLabel"] {
	if (isOwnerRole(role)) {
		return "Propietario";
	}

	if (role === "admin") {
		return "Administrador";
	}

	return "Miembro";
}

export async function getAdminSchool(input: {
	admin: GlobalAdmin;
	schoolId: string;
}): Promise<AdminSchoolDetail> {
	const schoolId = parseDomainInput(
		schoolIdSchema,
		input.schoolId,
		"The school id is invalid",
	);
	const database = getDatabase();
	const existingSchool = await findSchoolById(database, schoolId);

	if (!existingSchool) {
		throw new DomainError("SCHOOL_NOT_FOUND", "The school was not found", 404);
	}

	const [members, invitations, studentCount, academicYearName, organization] =
		await Promise.all([
			listMembersWithUserByOrganizationId(
				database,
				existingSchool.organizationId,
			),
			listInvitationsByOrganizationId(database, existingSchool.organizationId),
			countStudentsBySchoolId(database, existingSchool.id),
			findActiveAcademicYearName(database, existingSchool.id),
			findOrganizationById(database, existingSchool.organizationId),
		]);

	if (!organization) {
		throw new DomainError("SCHOOL_NOT_FOUND", "The school was not found", 404);
	}

	const pendingOwnerName = readPendingOwnerName(organization.metadata);
	const pendingOwnerInvitations = invitations.filter(
		(invitation) =>
			invitation.status === "pending" && isOwnerRole(invitation.role),
	);
	const pendingOwnerInvitation =
		[...pendingOwnerInvitations].sort(
			(left, right) => right.createdAt.getTime() - left.createdAt.getTime(),
		)[0] ?? null;

	const people: AdminSchoolPerson[] = [
		...members.map((member) => ({
			kind: "member" as const,
			name: member.user.name,
			email: member.user.email,
			roleLabel: personRoleLabel(member.role),
			statusLabel: "Activo" as const,
			canResend: false,
		})),
		...pendingOwnerInvitations.map((invitation) => ({
			kind: "invitation" as const,
			name: pendingOwnerName ?? "",
			email: invitation.email,
			roleLabel: personRoleLabel(invitation.role),
			statusLabel: "Invitación enviada" as const,
			canResend: isOwnerRole(invitation.role),
		})),
	];

	return {
		id: existingSchool.id,
		commercialName: existingSchool.commercialName,
		slug: organization.slug,
		status: existingSchool.status,
		createdAt: existingSchool.createdAt.toISOString(),
		activeAcademicYearLabel: academicYearName ?? "sin configurar",
		studentCount,
		memberCount: members.length,
		people,
		invitationUrl: pendingOwnerInvitation
			? ownerInvitationUrl(
					getAuthEnvironment().baseURL,
					pendingOwnerInvitation.id,
				)
			: null,
	};
}
