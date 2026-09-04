import { getDatabase } from "@aulara/db/client";
import { findInvitationById } from "@aulara/db/queries/invitations";
import { findOrganizationById } from "@aulara/db/queries/members";
import { DomainError } from "../errors.ts";
import { readPendingOwnerName } from "./organization-metadata.ts";

export type OwnerInvitationView = {
	id: string;
	email: string;
	organizationName: string;
	organizationSlug: string;
	pendingOwnerName: string | null;
	expiresAt: string;
};

export async function getOwnerInvitationForAccept(
	invitationId: string,
): Promise<OwnerInvitationView> {
	const database = getDatabase();
	const invitation = await findInvitationById(database, invitationId);

	if (!invitation) {
		throw new DomainError(
			"INVITATION_NOT_FOUND",
			"The invitation was not found",
			404,
		);
	}

	if (invitation.status !== "pending") {
		throw new DomainError(
			"INVITATION_NOT_PENDING",
			"The invitation is not pending",
			409,
		);
	}

	if (invitation.expiresAt < new Date()) {
		throw new DomainError(
			"INVITATION_EXPIRED",
			"The invitation has expired",
			410,
		);
	}

	const organization = await findOrganizationById(
		database,
		invitation.organizationId,
	);

	if (!organization) {
		throw new DomainError(
			"INVITATION_NOT_FOUND",
			"The invitation was not found",
			404,
		);
	}

	return {
		id: invitation.id,
		email: invitation.email,
		organizationName: organization.name,
		organizationSlug: organization.slug,
		pendingOwnerName: readPendingOwnerName(organization.metadata),
		expiresAt: invitation.expiresAt.toISOString(),
	};
}
