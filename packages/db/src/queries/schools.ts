import { and, count, desc, eq, or, sql } from "drizzle-orm";
import type { AppDatabase } from "../client.ts";
import { toIlikeContainsPattern } from "../like-pattern.ts";
import { academicYear, student } from "../schema/academics.ts";
import { invitation, member, organization } from "../schema/auth.generated.ts";
import { school } from "../schema/schools.ts";

function schoolSearchFilter(query: string) {
	const pattern = toIlikeContainsPattern(query);

	if (!pattern) {
		return undefined;
	}

	return or(
		sql`${organization.name} ilike ${pattern} escape '\\'`,
		sql`${organization.slug} ilike ${pattern} escape '\\'`,
	);
}

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
	return db
		.select({
			school,
			organization,
		})
		.from(school)
		.innerJoin(organization, eq(school.organizationId, organization.id))
		.where(
			and(
				schoolSearchFilter(query),
				status !== "all" ? eq(school.status, status) : undefined,
			),
		)
		.orderBy(desc(school.createdAt));
}

export async function listAdminSchoolSummaries(
	db: AppDatabase,
	{
		query,
		status,
	}: {
		query: string;
		status: "all" | "onboarding" | "active" | "suspended";
	},
) {
	const rows = await db
		.select({
			school,
			organization,
			teamCount: sql<number>`(
				(select count(*)::int from ${member} where ${member.organizationId} = ${school.organizationId})
				+
				(select count(*)::int from ${invitation}
					where ${invitation.organizationId} = ${school.organizationId}
					and ${invitation.status} = 'pending')
			)`,
			studentCount: sql<number>`(
				select count(*)::int from ${student} where ${student.schoolId} = ${school.id}
			)`,
		})
		.from(school)
		.innerJoin(organization, eq(school.organizationId, organization.id))
		.where(
			and(
				schoolSearchFilter(query),
				status !== "all" ? eq(school.status, status) : undefined,
			),
		)
		.orderBy(desc(school.createdAt));

	return rows.map((row) => ({
		school: row.school,
		organization: row.organization,
		teamCount: Number(row.teamCount),
		studentCount: Number(row.studentCount),
	}));
}

export async function insertSchool(
	db: AppDatabase,
	values: {
		organizationId: string;
		legalName: string;
		commercialName: string;
		status: "onboarding";
	},
) {
	const [row] = await db.insert(school).values(values).returning();
	return row ?? null;
}

export function updateSchoolStatus(
	db: AppDatabase,
	schoolId: string,
	values: {
		status: "onboarding" | "active" | "suspended" | "cancelled";
		statusBeforeSuspend: "onboarding" | "active" | null;
	},
) {
	return db.update(school).set(values).where(eq(school.id, schoolId));
}

export async function updateSchoolAndOrganizationName(
	db: AppDatabase,
	input: {
		schoolId: string;
		organizationId: string;
		name: string;
	},
) {
	return db.transaction(async (tx) => {
		await tx
			.update(school)
			.set({ commercialName: input.name })
			.where(eq(school.id, input.schoolId));

		const [updated] = await tx
			.update(organization)
			.set({ name: input.name })
			.where(eq(organization.id, input.organizationId))
			.returning();

		return updated ?? null;
	});
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
