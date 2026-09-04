import { and, eq } from "drizzle-orm";
import type { AppDatabase } from "../client.ts";
import { member, organization } from "../schema/auth.generated.ts";

export function findMemberOrganizationIds(db: AppDatabase, userId: string) {
	return db
		.selectDistinct({ organizationId: member.organizationId })
		.from(member)
		.where(eq(member.userId, userId))
		.limit(2);
}

export function findMemberByUserAndOrganization(
	db: AppDatabase,
	userId: string,
	organizationId: string,
) {
	return db.query.member.findFirst({
		where: and(
			eq(member.userId, userId),
			eq(member.organizationId, organizationId),
		),
	});
}

export function findOrganizationById(db: AppDatabase, organizationId: string) {
	return db.query.organization.findFirst({
		where: eq(organization.id, organizationId),
	});
}

export function listMembersWithUserByOrganizationId(
	db: AppDatabase,
	organizationId: string,
) {
	return db.query.member.findMany({
		where: eq(member.organizationId, organizationId),
		with: { user: true },
	});
}
