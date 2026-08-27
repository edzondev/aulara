import { requireGlobalAdmin } from "@aulara/auth/guards";
import { auth } from "@aulara/auth/server";
import { getDatabase } from "@aulara/db/client";
import { findSchoolByOrganizationId } from "@aulara/db/queries/schools";
import { organization, school, user } from "@aulara/db/schema";
import { eq } from "drizzle-orm";
import type {
	BillingContract,
	CreateBillingContractInput,
} from "../billing/create-billing-contract.ts";
import { insertBillingContract } from "../billing/create-billing-contract.ts";
import { DomainError, findPostgresErrorCode } from "../errors.ts";

export type SchoolSeedData = {
	legalName: string;
	commercialName: string;
	ruc?: string | null;
	modularCode?: string | null;
	contactEmail?: string | null;
	contactPhone?: string | null;
	addressLine?: string | null;
	district?: string | null;
	province?: string | null;
	department?: string | null;
	countryCode?: string;
	timezone?: string;
	currencyCode?: string;
};

export type ProvisionSchoolTenantInput = {
	headers: Headers;
	ownerUserId: string;
	organizationName: string;
	organizationSlug: string;
	school: SchoolSeedData;
	initialBillingContract?: CreateBillingContractInput;
};

export type ProvisionSchoolTenantResult = {
	organization: typeof organization.$inferSelect;
	school: typeof school.$inferSelect;
	billingContract: BillingContract | null;
};

/**
 * Better Auth API choice: `auth.api.createOrganization` with `userId`
 * in the body and NO request headers. In better-auth 1.7.2 this is a
 * "system action" (`isSystemAction = !session && ctx.body.userId` in
 * the /organization/create endpoint): the endpoint only requires a
 * session when request headers are present, and the
 * `allowUserToCreateOrganization: false` restriction is enforced only
 * for non-system actions. The organization and its owner member are
 * therefore created through Better Auth itself — never by hand-inserting
 * into the organization/member tables — and the endpoint rejects the
 * call with UNAUTHORIZED if the owner user does not exist.
 */
async function createOrganizationWithBetterAuth(
	input: ProvisionSchoolTenantInput,
): Promise<typeof organization.$inferSelect> {
	try {
		await auth.api.createOrganization({
			body: {
				name: input.organizationName,
				slug: input.organizationSlug,
				userId: input.ownerUserId,
			},
		});
	} catch {
		// Race: another caller created the same slug concurrently. The
		// organization lookup below reconciles it; anything else rethrows
		// via the missing-row check.
	}

	const [row] = await getDatabase()
		.select()
		.from(organization)
		.where(eq(organization.slug, input.organizationSlug))
		.limit(1);

	if (!row) {
		throw new DomainError(
			"PROVISIONING_CONFLICT",
			"The organization could not be created in Better Auth",
			409,
		);
	}

	return row;
}

/**
 * Transactional boundary: Better Auth commits the organization and the
 * owner member in its own transaction (via its Drizzle adapter); the
 * school and the initial billing contract are inserted afterwards in
 * separate Drizzle statements. The two DO NOT share a transaction, so a
 * crash between steps can leave an organization without a school.
 * Retries are safe: provisioning is idempotent (slug lookup +
 * school-by-organization reconciliation), never creating duplicates.
 */
export async function provisionSchoolTenant(
	input: ProvisionSchoolTenantInput,
): Promise<ProvisionSchoolTenantResult> {
	await requireGlobalAdmin(input.headers);

	const database = getDatabase();

	const [owner] = await database
		.select({ id: user.id })
		.from(user)
		.where(eq(user.id, input.ownerUserId))
		.limit(1);

	if (!owner) {
		throw new DomainError(
			"OWNER_USER_NOT_FOUND",
			"The owner user does not exist",
			404,
		);
	}

	async function insertSchoolWithReconciliation(
		databaseHandle: typeof database,
		organizationId: string,
	): Promise<typeof school.$inferSelect> {
		try {
			const [row] = await databaseHandle
				.insert(school)
				.values({
					organizationId,
					legalName: input.school.legalName,
					commercialName: input.school.commercialName,
					ruc: input.school.ruc ?? null,
					modularCode: input.school.modularCode ?? null,
					contactEmail: input.school.contactEmail ?? null,
					contactPhone: input.school.contactPhone ?? null,
					addressLine: input.school.addressLine ?? null,
					district: input.school.district ?? null,
					province: input.school.province ?? null,
					department: input.school.department ?? null,
					countryCode: input.school.countryCode,
					timezone: input.school.timezone,
					currencyCode: input.school.currencyCode,
				})
				.returning();

			if (!row) {
				throw new DomainError(
					"PROVISIONING_CONFLICT",
					"The school could not be created",
					409,
				);
			}

			return row;
		} catch (error) {
			// 23505 = unique_violation on school_organization_id_unique:
			// a concurrent provisioning already attached the school.
			if (findPostgresErrorCode(error) === "23505") {
				const existing = await findSchoolByOrganizationId(
					databaseHandle,
					organizationId,
				);

				if (existing) {
					return existing;
				}
			}

			throw error;
		}
	}

	const existingOrganization = await database
		.select()
		.from(organization)
		.where(eq(organization.slug, input.organizationSlug))
		.limit(1)
		.then((rows) => rows[0] ?? null);

	if (existingOrganization) {
		const existingSchool = await findSchoolByOrganizationId(
			database,
			existingOrganization.id,
		);

		if (existingSchool) {
			if (existingOrganization.name !== input.organizationName) {
				throw new DomainError(
					"PROVISIONING_CONFLICT",
					`The slug "${input.organizationSlug}" belongs to an existing school of another organization`,
					409,
				);
			}

			return {
				organization: existingOrganization,
				school: existingSchool,
				billingContract: null,
			};
		}

		// Reconciliation: the organization exists but has no school yet.
		const createdSchool = await insertSchoolWithReconciliation(
			database,
			existingOrganization.id,
		);

		const billingContractRow = input.initialBillingContract
			? await insertBillingContract(
					database,
					createdSchool.id,
					input.initialBillingContract,
				)
			: null;

		return {
			organization: existingOrganization,
			school: createdSchool,
			billingContract: billingContractRow,
		};
	}

	const createdOrganization = await createOrganizationWithBetterAuth(input);

	const reconciledSchool =
		(await findSchoolByOrganizationId(database, createdOrganization.id)) ??
		(await insertSchoolWithReconciliation(database, createdOrganization.id));

	const billingContractRow = input.initialBillingContract
		? await insertBillingContract(
				database,
				reconciledSchool.id,
				input.initialBillingContract,
			)
		: null;

	return {
		organization: createdOrganization,
		school: reconciledSchool,
		billingContract: billingContractRow,
	};
}
