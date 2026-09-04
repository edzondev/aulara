import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import type { AppDatabase } from "../client.ts";
import { academicYear, student } from "../schema/academics.ts";
import { organization } from "../schema/auth.generated.ts";
import { school } from "../schema/schools.ts";

export function findSchoolById(db: AppDatabase, schoolId: string) {
	return db.query.school.findFirst({
		where: eq(school.id, schoolId),
	});
}

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

export function listSchools(
	db: AppDatabase,
	{
		query,
		status,
	}: {
		query: string;
		status: "all" | "onboarding" | "active" | "suspended";
	},
) {
	const trimmedQuery = query.trim();
	const pattern = `%${trimmedQuery}%`;

	return db
		.select({
			school,
			organization,
		})
		.from(school)
		.innerJoin(organization, eq(school.organizationId, organization.id))
		.where(
			and(
				trimmedQuery
					? or(
							ilike(organization.name, pattern),
							ilike(organization.slug, pattern),
						)
					: undefined,
				status !== "all" ? eq(school.status, status) : undefined,
			),
		)
		.orderBy(desc(school.createdAt));
}

export async function countStudentsBySchoolId(
	db: AppDatabase,
	schoolId: string,
): Promise<number> {
	const [row] = await db
		.select({ value: count() })
		.from(student)
		.where(eq(student.schoolId, schoolId));

	return Number(row?.value ?? 0);
}

export async function findActiveAcademicYearName(
	db: AppDatabase,
	schoolId: string,
): Promise<string | null> {
	const year = await db.query.academicYear.findFirst({
		columns: { name: true },
		where: and(
			eq(academicYear.schoolId, schoolId),
			eq(academicYear.status, "active"),
		),
	});

	return year?.name ?? null;
}
