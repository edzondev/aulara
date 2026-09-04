import { requireGlobalAdmin } from "@aulara/auth/guards";
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
import type { SchoolStatus } from "@aulara/db/schema";
import { getAuthEnvironment } from "@aulara/env/auth";
import { DomainError } from "../errors.ts";
import { ownerInvitationUrl } from "./invitation-url.ts";
import { readPendingOwnerName } from "./organization-metadata.ts";

export type AdminSchoolPerson = {
	kind: "member" | "invitation";
	name: string;
	email: string;
	roleLabel: "Propietario" | "Administrador" | "Miembro";
	statusLabel: "Activo" | "Invitación enviada";
	canResend: boolean;
};

export type AdminSchoolDetail = {
	id: string;
	commercialName: string;
	slug: string;
	status: SchoolStatus;
	createdAt: string;
	activeAcademicYearLabel: string;
	studentCount: number;
	memberCount: number;
	people: AdminSchoolPerson[];
	invitationUrl: string | null;
};

function personRoleLabel(
	role: string | null | undefined,
): AdminSchoolPerson["roleLabel"] {
	if (role === "owner") {
		return "Propietario";
	}

	if (role === "admin") {
		return "Administrador";
	}

	return "Miembro";
}

function isOwnerRole(role: string | null | undefined): boolean {
	return role?.includes("owner") === true;
}

export async function getAdminSchool(input: {
	headers: Headers;
	schoolId: string;
}): Promise<AdminSchoolDetail> {
	await requireGlobalAdmin(input.headers);

	const database = getDatabase();
	const existingSchool = await findSchoolById(database, input.schoolId);

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
	const pendingInvitations = invitations.filter(
		(invitation) => invitation.status === "pending",
	);
	const pendingOwnerInvitation =
		pendingInvitations
			.filter((invitation) => isOwnerRole(invitation.role))
			.sort(
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
		...pendingInvitations.map((invitation) => ({
			kind: "invitation" as const,
			name: isOwnerRole(invitation.role) ? (pendingOwnerName ?? "") : "",
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
