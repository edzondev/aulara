import type { AuthorizedSchoolContext } from "@aulara/auth/types";
import { getDatabase } from "@aulara/db/client";
import { updateSchoolAndOrganizationName } from "@aulara/db/queries/schools";
import { DomainError } from "../errors.ts";

export type UpdateSchoolIdentityInput = {
	commercialName: string;
};

/**
 * Renames a school keeping school.commercialName and organization.name
 * in sync. Both writes run in one database transaction so a failure
 * cannot leave only one of the two names updated.
 *
 * `auth.api.updateOrganization` is not used: it requires request
 * headers and a member permission check, and it cannot join this
 * transaction.
 */
export async function updateSchoolIdentity(
	context: AuthorizedSchoolContext,
	input: UpdateSchoolIdentityInput,
): Promise<void> {
	try {
		const updated = await updateSchoolAndOrganizationName(getDatabase(), {
			schoolId: context.school.id,
			organizationId: context.organizationId,
			name: input.commercialName,
		});

		if (!updated) {
			throw new Error("organization not found");
		}
	} catch (error) {
		if (error instanceof DomainError) {
			throw error;
		}

		throw new DomainError(
			"SCHOOL_IDENTITY_SYNC_FAILED",
			"school.commercialName and organization.name could not be updated together; retry the operation",
			500,
			{ cause: error },
		);
	}
}
