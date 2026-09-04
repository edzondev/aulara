import { and, desc, eq, like } from "drizzle-orm";
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

export function findPendingOwnerInvitation(
	db: AppDatabase,
	organizationId: string,
) {
	return db
		.select()
		.from(invitation)
		.where(
			and(
				eq(invitation.organizationId, organizationId),
				eq(invitation.status, "pending"),
				like(invitation.role, "%owner%"),
			),
		)
		.orderBy(desc(invitation.createdAt))
		.limit(1)
		.then((rows) => rows[0] ?? null);
}
