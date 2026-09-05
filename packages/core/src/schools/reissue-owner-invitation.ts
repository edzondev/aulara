import { ownerInvitationExpiresInSeconds } from "@aulara/auth/constants";
import type { OrgProvisioningAdapter } from "@aulara/auth/org-provisioning";
import { getDatabase } from "@aulara/db/client";
import { findPendingOwnerInvitation } from "@aulara/db/queries/invitations";
import { findSchoolById } from "@aulara/db/queries/schools";
import { getAuthEnvironment } from "@aulara/env/auth";
import { currentDate, dateAfterSeconds } from "../clock.ts";
import { DomainError } from "../errors.ts";
import { parseDomainInput } from "../parse.ts";
import { ownerInvitationUrl } from "./invitation-url.ts";
import type { GlobalAdmin } from "./provision-school.ts";
import { schoolIdSchema } from "./school-id-schema.ts";

export async function reissueOwnerInvitation(input: {
	admin: GlobalAdmin;
	schoolId: string;
	orgAdapter?: OrgProvisioningAdapter;
}): Promise<{ invitationId: string; invitationUrl: string; expiresAt: Date }> {
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

	const expiresAt = dateAfterSeconds(
		ownerInvitationExpiresInSeconds,
		currentDate(),
	);
	const adapter =
		input.orgAdapter ??
		(await (
			await import("@aulara/auth/org-provisioning")
		).createOrgProvisioningAdapter());

	await adapter.updateInvitationExpiresAt(invitation.id, expiresAt);

	return {
		invitationId: invitation.id,
		invitationUrl: ownerInvitationUrl(
			getAuthEnvironment().baseURL,
			invitation.id,
		),
		expiresAt,
	};
}
