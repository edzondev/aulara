import { and, desc, eq, sql } from "drizzle-orm";
import type { AppDatabase } from "../client.ts";
import { invitation } from "../schema/auth.generated.ts";

export function listInvitationsByOrganizationId(
	db: AppDatabase,
	organizationId: string,
) {
	return db.query.invitation.findMany({
		where: eq(invitation.organizationId, organizationId),
	});
}

export function findInvitationById(db: AppDatabase, id: string) {
	return db.query.invitation.findFirst({
		where: eq(invitation.id, id),
	});
}

export async function findPendingOwnerInvitation(
	db: AppDatabase,
	organizationId: string,
) {
	const rows = await db
		.select()
		.from(invitation)
		.where(
			and(
				eq(invitation.organizationId, organizationId),
				eq(invitation.status, "pending"),
				sql`exists (
					select 1
					from unnest(string_to_array(${invitation.role}, ',')) as owner_role(value)
					where btrim(owner_role.value) = 'owner'
				)`,
			),
		)
		.orderBy(desc(invitation.createdAt))
		.limit(1);

	return rows[0] ?? null;
}
