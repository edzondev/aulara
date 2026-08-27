import { getDatabase } from "@aulara/db/client";
import {
	findMemberByUserAndOrganization,
	findOrganizationById,
} from "@aulara/db/queries/members";
import { findSchoolByOrganizationId } from "@aulara/db/queries/schools";
import { AuthContextError, authContextErrorCodes } from "./errors.ts";
import {
	type ActiveOrganizationSession,
	requireActiveOrganization,
} from "./guards.ts";
import {
	getGlobalRole,
	type OrganizationRole,
	organizationRoles,
	parseOrganizationRoles,
} from "./permissions.ts";
import type { AuthorizedSchoolContext } from "./types.ts";

function getHighestOrganizationRole(
	roles: OrganizationRole[],
): OrganizationRole | null {
	for (const role of organizationRoles) {
		if (roles.includes(role)) {
			return role;
		}
	}

	return null;
}

function toAuthorizedContext(
	session: ActiveOrganizationSession,
	member: NonNullable<
		Awaited<ReturnType<typeof findMemberByUserAndOrganization>>
	>,
	organization: NonNullable<Awaited<ReturnType<typeof findOrganizationById>>>,
	school: NonNullable<Awaited<ReturnType<typeof findSchoolByOrganizationId>>>,
	memberRole: OrganizationRole,
): AuthorizedSchoolContext {
	return {
		member: {
			id: member.id,
			organizationId: member.organizationId,
			role: memberRole,
			userId: member.userId,
		},
		memberRole,
		organization: {
			id: organization.id,
			name: organization.name,
			slug: organization.slug,
		},
		organizationId: organization.id,
		school: {
			id: school.id,
			organizationId: school.organizationId,
			commercialName: school.commercialName,
			status: school.status,
		},
		schoolId: school.id,
		session: {
			expiresAt: session.session.expiresAt,
			id: session.session.id,
			userId: session.session.userId,
		},
		user: {
			email: session.user.email,
			id: session.user.id,
			name: session.user.name,
			role: getGlobalRole(session.user.role),
		},
	};
}

export async function resolveActiveSchoolContext(
	headers: Headers,
): Promise<AuthorizedSchoolContext> {
	const session = await requireActiveOrganization(headers);
	const organizationId = session.session.activeOrganizationId;
	const database = getDatabase();

	const member = await findMemberByUserAndOrganization(
		database,
		session.user.id,
		organizationId,
	);

	if (!member || member.organizationId !== organizationId) {
		throw new AuthContextError(
			authContextErrorCodes.organizationMembershipRequired,
			"The user is not a member of the active organization",
			403,
		);
	}

	const parsedRoles = parseOrganizationRoles(member.role);

	if (!parsedRoles) {
		throw new AuthContextError(
			authContextErrorCodes.organizationMembershipRequired,
			"The organization membership has an unsupported role",
			403,
		);
	}

	const memberRole = getHighestOrganizationRole(parsedRoles);

	if (!memberRole) {
		throw new AuthContextError(
			authContextErrorCodes.organizationMembershipRequired,
			"The organization membership has no valid role",
			403,
		);
	}

	const [organization, school] = await Promise.all([
		findOrganizationById(database, organizationId),
		findSchoolByOrganizationId(database, organizationId),
	]);

	if (!organization) {
		throw new AuthContextError(
			authContextErrorCodes.organizationMembershipRequired,
			"The active organization does not exist",
			403,
		);
	}

	if (!school || school.organizationId !== organizationId) {
		throw new AuthContextError(
			authContextErrorCodes.schoolNotFound,
			"The active organization has no school",
			404,
		);
	}

	return toAuthorizedContext(session, member, organization, school, memberRole);
}

export async function requireActiveSchool(
	headers: Headers,
): Promise<AuthorizedSchoolContext> {
	const context = await resolveActiveSchoolContext(headers);

	if (context.school.status !== "active") {
		throw new AuthContextError(
			authContextErrorCodes.schoolNotOperational,
			"The active school is not operational",
			403,
		);
	}

	return context;
}
