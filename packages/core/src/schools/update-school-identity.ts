import { auth } from "@aulara/auth/server";
import type { AuthorizedSchoolContext } from "@aulara/auth/types";
import { getDatabase } from "@aulara/db/client";
import { school } from "@aulara/db/schema";
import { eq } from "drizzle-orm";
import { DomainError } from "../errors.ts";

export type UpdateSchoolIdentityInput = {
	commercialName: string;
};

/**
 * Renames a school keeping school.commercialName and
 * organization.name in sync.
 *
 * Better Auth API choice: `auth.api.updateOrganization` cannot be used
 * here — it requires HTTP headers with a session cookie
 * (`requireHeaders: true`) plus a member permission check, and
 * `AuthorizedSchoolContext` carries no request. The update is therefore
 * issued through Better Auth's internal adapter
 * (`(await auth.$context).adapter.update({ model: "organization", ... })`,
 * the same call the organization plugin's `updateOrganization` adapter
 * method makes) instead of hand-writing SQL against the organization
 * table.
 *
 * The school row is updated first. If the organization update then
 * fails, SCHOOL_IDENTITY_SYNC_FAILED is thrown stating that the school
 * was renamed but the organization was not; the operation is safe to
 * retry (both updates are idempotent).
 */
export async function updateSchoolIdentity(
	context: AuthorizedSchoolContext,
	input: UpdateSchoolIdentityInput,
): Promise<void> {
	const database = getDatabase();

	await database
		.update(school)
		.set({ commercialName: input.commercialName })
		.where(eq(school.id, context.school.id));

	const authContext = await auth.$context;

	try {
		const updated = await authContext.adapter.update({
			model: "organization",
			where: [{ field: "id", value: context.organizationId }],
			update: { name: input.commercialName },
		});

		if (!updated) {
			throw new Error("organization not found");
		}
	} catch (error) {
		throw new DomainError(
			"SCHOOL_IDENTITY_SYNC_FAILED",
			`school.commercialName was updated to "${input.commercialName}" but organization.name could not be updated; retry the operation to resynchronize`,
			500,
			{ cause: error },
		);
	}
}
