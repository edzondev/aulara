import { and, eq } from "drizzle-orm";
import type { AppDatabase } from "../client.ts";
import { school } from "../schema/schools.ts";

export function findSchoolByOrganizationId(
	db: AppDatabase,
	organizationId: string,
) {
	return db.query.school.findFirst({
		where: eq(school.organizationId, organizationId),
	});
}

export function findSchoolByOrganizationAndId(
	db: AppDatabase,
	organizationId: string,
	schoolId: string,
) {
	return db.query.school.findFirst({
		where: and(
			eq(school.organizationId, organizationId),
			eq(school.id, schoolId),
		),
	});
}
