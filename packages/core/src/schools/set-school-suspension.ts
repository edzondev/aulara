import { requireGlobalAdmin } from "@aulara/auth/guards";
import { getDatabase } from "@aulara/db/client";
import { findSchoolById } from "@aulara/db/queries/schools";
import { school } from "@aulara/db/schema";
import { eq } from "drizzle-orm";
import { DomainError } from "../errors.ts";

export async function suspendSchool(input: {
	headers: Headers;
	schoolId: string;
}): Promise<void> {
	await requireGlobalAdmin(input.headers);

	const database = getDatabase();
	const existingSchool = await findSchoolById(database, input.schoolId);

	if (!existingSchool) {
		throw new DomainError("SCHOOL_NOT_FOUND", "The school was not found", 404);
	}

	if (
		existingSchool.status !== "onboarding" &&
		existingSchool.status !== "active"
	) {
		throw new DomainError(
			"SCHOOL_NOT_SUSPENDABLE",
			"The school cannot be suspended from its current status",
			409,
		);
	}

	await database
		.update(school)
		.set({
			status: "suspended",
			statusBeforeSuspend: existingSchool.status,
		})
		.where(eq(school.id, input.schoolId));
}

export async function reactivateSchool(input: {
	headers: Headers;
	schoolId: string;
}): Promise<void> {
	await requireGlobalAdmin(input.headers);

	const database = getDatabase();
	const existingSchool = await findSchoolById(database, input.schoolId);

	if (!existingSchool) {
		throw new DomainError("SCHOOL_NOT_FOUND", "The school was not found", 404);
	}

	if (existingSchool.status !== "suspended") {
		throw new DomainError(
			"SCHOOL_NOT_SUSPENDABLE",
			"The school cannot be reactivated from its current status",
			409,
		);
	}

	await database
		.update(school)
		.set({
			status: existingSchool.statusBeforeSuspend ?? "onboarding",
			statusBeforeSuspend: null,
		})
		.where(eq(school.id, input.schoolId));
}
