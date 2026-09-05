import type { AuthenticatedUser } from "@aulara/auth/guards";
import type { OrgProvisioningAdapter } from "@aulara/auth/org-provisioning";
import { getDatabase } from "@aulara/db/client";
import { findPendingOwnerInvitation } from "@aulara/db/queries/invitations";
import { findOrganizationBySlug } from "@aulara/db/queries/members";
import {
	findSchoolByOrganizationId,
	insertSchool,
} from "@aulara/db/queries/schools";
import { getAuthEnvironment } from "@aulara/env/auth";
import { currentDate } from "../clock.ts";
import { DomainError, findPostgresErrorCode } from "../errors.ts";
import { emailSchema } from "./email-schema.ts";
import { ownerInvitationUrl } from "./invitation-url.ts";
import { writePendingOwnerName } from "./organization-metadata.ts";
import { slugifySchoolIdentifier } from "./slug.ts";

export type GlobalAdmin = AuthenticatedUser & { role: "admin" };

export type ProvisionSchoolTenantInput = {
	admin: GlobalAdmin;
	organizationName: string;
	organizationSlug: string;
	ownerName: string;
	ownerEmail: string;
	orgAdapter?: OrgProvisioningAdapter;
};

type OrganizationRow = NonNullable<
	Awaited<ReturnType<typeof findOrganizationBySlug>>
>;
type SchoolRow = NonNullable<
	Awaited<ReturnType<typeof findSchoolByOrganizationId>>
>;

export type ProvisionSchoolTenantResult = {
	organization: OrganizationRow;
	school: SchoolRow;
	invitation: {
		id: string;
		email: string;
		role: string;
		status: string;
		expiresAt: Date;
	};
	invitationUrl: string;
};

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
		const row = await insertSchool(database, {
			organizationId,
			legalName: organizationName,
			commercialName: organizationName,
			status: "onboarding",
		});

		if (!row) {
			throw new DomainError(
				"PROVISIONING_CONFLICT",
				"The school could not be created",
				409,
			);
		}

		return row;
	} catch (error) {
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
	const parsedEmail = emailSchema.safeParse(input.ownerEmail);

	if (!parsedEmail.success) {
		throw new DomainError("INVALID_EMAIL", "The owner email is invalid", 400);
	}

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

	const email = parsedEmail.data.toLowerCase();
	const organizationName = input.organizationName.trim();
	const database = getDatabase();
	const existingOrganization = await findOrganizationBySlug(database, slug);
	const adapter =
		input.orgAdapter ??
		(await (
			await import("@aulara/auth/org-provisioning")
		).createOrgProvisioningAdapter());

	let resolvedOrganization: OrganizationRow;

	if (!existingOrganization) {
		await adapter.createOrganization({
			name: organizationName,
			slug,
			createdAt: currentDate(),
			metadata: JSON.parse(
				writePendingOwnerName(null, input.ownerName.trim()),
			) as Record<string, unknown>,
		});

		const createdOrganization = await findOrganizationBySlug(database, slug);

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

	const memberIds = await adapter.listMemberIds(resolvedOrganization.id);

	if (memberIds.length > 0) {
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

	const pendingInvitations = await adapter.findPendingInvitations(
		email,
		resolvedOrganization.id,
	);
	const pendingInvitation = pendingInvitations[0];
	const createdInvitation =
		pendingInvitation ??
		(await adapter.createOwnerInvitation({
			email,
			organizationId: resolvedOrganization.id,
			inviterUserId: input.admin.id,
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
