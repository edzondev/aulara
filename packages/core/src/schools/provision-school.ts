import { ownerInvitationExpiresInSeconds } from "@aulara/auth/constants";
import { requireGlobalAdmin } from "@aulara/auth/guards";
import { auth } from "@aulara/auth/server";
import { getDatabase } from "@aulara/db/client";
import { findSchoolByOrganizationId } from "@aulara/db/queries/schools";
import { organization, school } from "@aulara/db/schema";
import { getAuthEnvironment } from "@aulara/env/auth";
import { getOrgAdapter } from "better-auth/plugins/organization";
import { eq } from "drizzle-orm";
import { DomainError, findPostgresErrorCode } from "../errors.ts";
import { ownerInvitationUrl } from "./invitation-url.ts";
import { writePendingOwnerName } from "./organization-metadata.ts";
import { slugifySchoolIdentifier } from "./slug.ts";

export type ProvisionSchoolTenantInput = {
	headers: Headers;
	organizationName: string;
	organizationSlug: string;
	ownerName: string;
	ownerEmail: string;
};

export type ProvisionSchoolTenantResult = {
	organization: typeof organization.$inferSelect;
	school: typeof school.$inferSelect;
	invitation: {
		id: string;
		email: string;
		role: string;
		status: string;
		expiresAt: Date;
	};
	invitationUrl: string;
};

type OrganizationRow = typeof organization.$inferSelect;
type SchoolRow = typeof school.$inferSelect;
type OrgAdapter = ReturnType<typeof getOrgAdapter>;
type OrgAdapterContext = Parameters<typeof getOrgAdapter>[0];
type InvitationInviter = Parameters<OrgAdapter["createInvitation"]>[0]["user"];

function toInvitationResult(invitation: {
	id: string;
	email: string;
	role?: string | null;
	status: string;
	expiresAt: Date;
}): ProvisionSchoolTenantResult["invitation"] {
	return {
		id: invitation.id,
		email: invitation.email,
		role: invitation.role ?? "owner",
		status: invitation.status,
		expiresAt: invitation.expiresAt,
	};
}

async function insertSchoolWithReconciliation(
	organizationId: string,
	organizationName: string,
): Promise<SchoolRow> {
	const database = getDatabase();

	try {
		const [row] = await database
			.insert(school)
			.values({
				organizationId,
				legalName: organizationName,
				commercialName: organizationName,
				status: "onboarding",
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
		// 23505 = unique_violation on school_organization_id_unique.
		if (findPostgresErrorCode(error) === "23505") {
			const existing = await findSchoolByOrganizationId(
				database,
				organizationId,
			);

			if (existing) {
				return existing;
			}
		}

		throw error;
	}
}

/**
 * Creates organization + school without an owner member, then a Better
 * Auth owner invitation via the organization adapter. Never call
 * `auth.api.createOrganization` or `createMember` — both would attach a
 * member, and the admin is not a member of the school.
 */
export async function provisionSchoolTenant(
	input: ProvisionSchoolTenantInput,
): Promise<ProvisionSchoolTenantResult> {
	const admin = await requireGlobalAdmin(input.headers);

	const slug = slugifySchoolIdentifier(
		input.organizationSlug || input.organizationName,
	);

	if (!slug) {
		throw new DomainError(
			"PROVISIONING_CONFLICT",
			"The organization slug is invalid",
			409,
		);
	}

	const email = input.ownerEmail.trim().toLowerCase();
	const organizationName = input.organizationName.trim();
	const database = getDatabase();

	const [existingOrganization] = await database
		.select()
		.from(organization)
		.where(eq(organization.slug, slug))
		.limit(1);

	const adapter = getOrgAdapter(
		(await auth.$context) as unknown as OrgAdapterContext,
		{ invitationExpiresIn: ownerInvitationExpiresInSeconds },
	);

	let resolvedOrganization: OrganizationRow;

	if (!existingOrganization) {
		resolvedOrganization = (await adapter.createOrganization({
			organization: {
				name: organizationName,
				slug,
				createdAt: new Date(),
				metadata: JSON.parse(
					writePendingOwnerName(null, input.ownerName.trim()),
				),
			},
		})) as OrganizationRow;
	} else if (existingOrganization.name !== organizationName) {
		throw new DomainError(
			"PROVISIONING_CONFLICT",
			`The slug "${slug}" belongs to an existing school of another organization`,
			409,
		);
	} else {
		resolvedOrganization = existingOrganization;
	}

	const reconciledSchool =
		(await findSchoolByOrganizationId(database, resolvedOrganization.id)) ??
		(await insertSchoolWithReconciliation(
			resolvedOrganization.id,
			organizationName,
		));

	const existingMember = await adapter.findMemberByEmail({
		email,
		organizationId: resolvedOrganization.id,
	});

	if (existingMember) {
		throw new DomainError(
			"PROVISIONING_CONFLICT",
			"The owner email already belongs to a member of this organization",
			409,
		);
	}

	const pendingInvitations = await adapter.findPendingInvitation({
		email,
		organizationId: resolvedOrganization.id,
	});
	const pendingInvitation = pendingInvitations[0];
	const createdInvitation =
		pendingInvitation ??
		(await adapter.createInvitation({
			invitation: {
				email,
				role: "owner",
				organizationId: resolvedOrganization.id,
				teamIds: [],
			},
			user: { id: admin.id } as InvitationInviter,
		}));

	const invitation = toInvitationResult(createdInvitation);

	return {
		organization: resolvedOrganization,
		school: reconciledSchool,
		invitation,
		invitationUrl: ownerInvitationUrl(
			getAuthEnvironment().baseURL,
			invitation.id,
		),
	};
}
