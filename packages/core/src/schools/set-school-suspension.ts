import { getDatabase } from "@aulara/db/client";
import { findSchoolById, updateSchoolStatus } from "@aulara/db/queries/schools";
import { DomainError } from "../errors.ts";
import { parseDomainInput } from "../parse.ts";
import type { GlobalAdmin } from "./provision-school.ts";
import { schoolIdSchema } from "./school-id-schema.ts";

export async function suspendSchool(input: {
	admin: GlobalAdmin;
	schoolId: string;
}): Promise<void> {
	const schoolId = parseDomainInput(
		schoolIdSchema,
		input.schoolId,
		"The school id is invalid",
	);
	const database = getDatabase();
	const existingSchool = await findSchoolById(database, schoolId);

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

	await updateSchoolStatus(database, schoolId, {
		status: "suspended",
		statusBeforeSuspend: existingSchool.status,
	});
}

export async function reactivateSchool(input: {
	admin: GlobalAdmin;
	schoolId: string;
}): Promise<void> {
	const schoolId = parseDomainInput(
		schoolIdSchema,
		input.schoolId,
		"The school id is invalid",
	);
	const database = getDatabase();
	const existingSchool = await findSchoolById(database, schoolId);

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

	await updateSchoolStatus(database, schoolId, {
		status: existingSchool.statusBeforeSuspend ?? "onboarding",
		statusBeforeSuspend: null,
	});
}
