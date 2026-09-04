import { ownerInvitationExpiresInSeconds } from "@aulara/auth/constants";
import { requireGlobalAdmin } from "@aulara/auth/guards";
import { auth } from "@aulara/auth/server";
import { getDatabase } from "@aulara/db/client";
import { findPendingOwnerInvitation } from "@aulara/db/queries/invitations";
import { findSchoolById } from "@aulara/db/queries/schools";
import { getAuthEnvironment } from "@aulara/env/auth";
import { DomainError } from "../errors.ts";
import { ownerInvitationUrl } from "./invitation-url.ts";

export async function reissueOwnerInvitation(input: {
	headers: Headers;
	schoolId: string;
}): Promise<{ invitationId: string; invitationUrl: string; expiresAt: Date }> {
	await requireGlobalAdmin(input.headers);

	const database = getDatabase();
	const existingSchool = await findSchoolById(database, input.schoolId);

	if (!existingSchool) {
		throw new DomainError("SCHOOL_NOT_FOUND", "The school was not found", 404);
	}

	const invitation = await findPendingOwnerInvitation(
		database,
		existingSchool.organizationId,
	);

	if (!invitation) {
		throw new DomainError(
			"INVITATION_NOT_PENDING",
			"The owner invitation is not pending",
			409,
		);
	}

	// Better Auth keeps status=pending after expiry; extend the same row.
	const expiresAt = new Date(
		Date.now() + ownerInvitationExpiresInSeconds * 1000,
	);

	await (await auth.$context).adapter.update({
		model: "invitation",
		where: [{ field: "id", value: invitation.id }],
		update: { expiresAt },
	});

	return {
		invitationId: invitation.id,
		invitationUrl: ownerInvitationUrl(
			getAuthEnvironment().baseURL,
			invitation.id,
		),
		expiresAt,
	};
}
