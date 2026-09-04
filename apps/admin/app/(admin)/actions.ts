"use server";

import { DomainError } from "@aulara/core/errors";
import { provisionSchoolTenant } from "@aulara/core/schools";
import { headers } from "next/headers";

function publicMessage(error: DomainError): string {
	if (error.code === "PROVISIONING_CONFLICT") {
		return "Ese identificador ya existe o el correo ya es miembro.";
	}

	return "No se pudo crear el colegio.";
}

export async function createSchoolAction(input: {
	organizationName: string;
	organizationSlug: string;
	ownerName: string;
	ownerEmail: string;
}): Promise<
	| { ok: true; schoolId: string; invitationUrl: string }
	| { ok: false; message: string }
> {
	try {
		const result = await provisionSchoolTenant({
			headers: await headers(),
			...input,
		});
		return {
			ok: true,
			schoolId: result.school.id,
			invitationUrl: result.invitationUrl,
		};
	} catch (error) {
		if (error instanceof DomainError) {
			return { ok: false, message: publicMessage(error) };
		}
		throw error;
	}
}
