import { ownerInvitationExpiresInSeconds } from "@aulara/auth/constants";
import { requireGlobalAdmin } from "@aulara/auth/guards";
import { auth } from "@aulara/auth/server";
import { getDatabase } from "@aulara/db/client";
import { findPendingOwnerInvitation } from "@aulara/db/queries/invitations";
import { findSchoolByOrganizationId } from "@aulara/db/queries/schools";
import { organization, school } from "@aulara/db/schema";
import { getAuthEnvironment } from "@aulara/env/auth";
import { getOrgAdapter } from "better-auth/plugins/organization";
import { eq } from "drizzle-orm";
import { DomainError, findPostgresErrorCode } from "../errors.ts";
import { isValidEmail } from "./email.ts";
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

async function findOrganizationBySlug(
	slug: string,
): Promise<OrganizationRow | undefined> {
	const [row] = await getDatabase()
		.select()
		.from(organization)
		.where(eq(organization.slug, slug))
		.limit(1);

	return row;
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

	if (!isValidEmail(email)) {
		throw new DomainError("INVALID_EMAIL", "The owner email is invalid", 400);
	}

	const organizationName = input.organizationName.trim();
	const database = getDatabase();
	const existingOrganization = await findOrganizationBySlug(slug);

	const adapter = getOrgAdapter(
		(await auth.$context) as unknown as OrgAdapterContext,
		{ invitationExpiresIn: ownerInvitationExpiresInSeconds },
	);

	let resolvedOrganization: OrganizationRow;

	if (!existingOrganization) {
		await adapter.createOrganization({
			organization: {
				name: organizationName,
				slug,
				createdAt: new Date(),
				metadata: JSON.parse(
					writePendingOwnerName(null, input.ownerName.trim()),
				),
			},
		});

		const createdOrganization = await findOrganizationBySlug(slug);

		if (!createdOrganization) {
			throw new DomainError(
				"PROVISIONING_CONFLICT",
				"The organization could not be created in Better Auth",
				409,
			);
		}

		resolvedOrganization = createdOrganization;
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

	const { members } = await adapter.listMembers({
		organizationId: resolvedOrganization.id,
		limit: 1,
	});

	if (members.length > 0) {
		throw new DomainError(
			"PROVISIONING_CONFLICT",
			"The organization already has a member",
			409,
		);
	}

	const pendingOwnerInvitation = await findPendingOwnerInvitation(
		database,
		resolvedOrganization.id,
	);

	if (
		pendingOwnerInvitation &&
		pendingOwnerInvitation.email.toLowerCase() !== email
	) {
		throw new DomainError(
			"PROVISIONING_CONFLICT",
			"The organization already has an owner invitation for a different email",
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
