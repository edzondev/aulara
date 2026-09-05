import { getOrgAdapter } from "better-auth/plugins/organization";
import { ownerInvitationExpiresInSeconds } from "./constants.ts";
import { auth } from "./server.ts";

export type OrgInvitationRecord = {
	id: string;
	email: string;
	role?: string | null;
	status: string;
	expiresAt: Date;
};

export type OrgProvisioningAdapter = {
	createOrganization(input: {
		name: string;
		slug: string;
		createdAt: Date;
		metadata: Record<string, unknown>;
	}): Promise<void>;
	listMemberIds(organizationId: string): Promise<string[]>;
	findPendingInvitations(
		email: string,
		organizationId: string,
	): Promise<OrgInvitationRecord[]>;
	createOwnerInvitation(input: {
		email: string;
		organizationId: string;
		inviterUserId: string;
	}): Promise<OrgInvitationRecord>;
	updateInvitationExpiresAt(
		invitationId: string,
		expiresAt: Date,
	): Promise<void>;
};

type OrgAdapter = ReturnType<typeof getOrgAdapter>;
type OrgAdapterContext = Parameters<typeof getOrgAdapter>[0];

function toInvitationRecord(invitation: {
	id: string;
	email: string;
	role?: string | null;
	status: string;
	expiresAt: Date;
}): OrgInvitationRecord {
	return {
		id: invitation.id,
		email: invitation.email,
		role: invitation.role,
		status: invitation.status,
		expiresAt: invitation.expiresAt,
	};
}

export async function createOrgProvisioningAdapter(): Promise<OrgProvisioningAdapter> {
	const authContext = await auth.$context;
	const adapter = getOrgAdapter(authContext as unknown as OrgAdapterContext, {
		invitationExpiresIn: ownerInvitationExpiresInSeconds,
	});

	return {
		async createOrganization(input) {
			await adapter.createOrganization({
				organization: {
					name: input.name,
					slug: input.slug,
					createdAt: input.createdAt,
					metadata: input.metadata,
				},
			});
		},
		async listMemberIds(organizationId) {
			const { members } = await adapter.listMembers({
				organizationId,
				limit: 1,
			});

			return members.map((member: { id: string }) => member.id);
		},
		async findPendingInvitations(email, organizationId) {
			const invitations = await adapter.findPendingInvitation({
				email,
				organizationId,
			});

			return invitations.map(toInvitationRecord);
		},
		async createOwnerInvitation(input) {
			const invitation = await adapter.createInvitation({
				invitation: {
					email: input.email,
					role: "owner",
					organizationId: input.organizationId,
					teamIds: [],
				},
				user: { id: input.inviterUserId } as Parameters<
					OrgAdapter["createInvitation"]
				>[0]["user"],
			});

			return toInvitationRecord(invitation);
		},
		async updateInvitationExpiresAt(invitationId, expiresAt) {
			await authContext.adapter.update({
				model: "invitation",
				where: [{ field: "id", value: invitationId }],
				update: { expiresAt },
			});
		},
	};
}
