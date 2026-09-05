"use server";

import { requireGlobalAdmin } from "@aulara/auth/guards";
import { DomainError } from "@aulara/core/errors";
import {
	provisionSchoolTenant,
	reactivateSchool,
	reissueOwnerInvitation,
	suspendSchool,
} from "@aulara/core/schools";
import { createSchoolSchema } from "@aulara/core/schools/create-school-schema";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

function publicMessage(error: DomainError, fallback: string): string {
	if (error.code === "PROVISIONING_CONFLICT") {
		return "Ese identificador ya existe o el correo ya es miembro.";
	}

	if (error.code === "INVALID_EMAIL") {
		return "El correo no es válido.";
	}

	if (error.code === "SCHOOL_NOT_FOUND") {
		return "No se encontró el colegio.";
	}

	if (error.code === "INVITATION_NOT_PENDING") {
		return "La invitación del propietario ya no está pendiente.";
	}

	if (error.code === "SCHOOL_NOT_SUSPENDABLE") {
		return "No se puede cambiar el acceso en el estado actual.";
	}

	return fallback;
}

function revalidateSchoolPaths(schoolId: string): void {
	revalidatePath("/colegios");
	revalidatePath(`/colegios/${schoolId}`);
}

export async function createSchoolAction(
	input: unknown,
): Promise<
	| { ok: true; schoolId: string; invitationUrl: string }
	| { ok: false; message: string }
> {
	const parsed = createSchoolSchema.safeParse(input);

	if (!parsed.success) {
		return {
			ok: false,
			message:
				parsed.error.issues[0]?.message ?? "No se pudo crear el colegio.",
		};
	}

	try {
		const result = await provisionSchoolTenant({
			admin: await requireGlobalAdmin(await headers()),
			...parsed.data,
		});
		return {
			ok: true,
			schoolId: result.school.id,
			invitationUrl: result.invitationUrl,
		};
	} catch (error) {
		if (error instanceof DomainError) {
			return {
				ok: false,
				message: publicMessage(error, "No se pudo crear el colegio."),
			};
		}
		throw error;
	}
}

export async function reissueInvitationAction(
	schoolId: string,
): Promise<
	{ ok: true; invitationUrl: string } | { ok: false; message: string }
> {
	try {
		const result = await reissueOwnerInvitation({
			admin: await requireGlobalAdmin(await headers()),
			schoolId,
		});
		revalidateSchoolPaths(schoolId);
		return { ok: true, invitationUrl: result.invitationUrl };
	} catch (error) {
		if (error instanceof DomainError) {
			return {
				ok: false,
				message: publicMessage(error, "No se pudo reenviar la invitación."),
			};
		}
		throw error;
	}
}

export async function suspendSchoolAction(
	schoolId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
	try {
		await suspendSchool({
			admin: await requireGlobalAdmin(await headers()),
			schoolId,
		});
		revalidateSchoolPaths(schoolId);
		return { ok: true };
	} catch (error) {
		if (error instanceof DomainError) {
			return {
				ok: false,
				message: publicMessage(error, "No se pudo suspender el colegio."),
			};
		}
		throw error;
	}
}

export async function reactivateSchoolAction(
	schoolId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
	try {
		await reactivateSchool({
			admin: await requireGlobalAdmin(await headers()),
			schoolId,
		});
		revalidateSchoolPaths(schoolId);
		return { ok: true };
	} catch (error) {
		if (error instanceof DomainError) {
			return {
				ok: false,
				message: publicMessage(error, "No se pudo reactivar el colegio."),
			};
		}
		throw error;
	}
}
