export const waitlistRoles = ["director", "owner", "admin", "other"] as const;

export type WaitlistRole = (typeof waitlistRoles)[number];

export type WaitlistFields = {
	institutionName: string;
	email: string;
	role: WaitlistRole;
};

export type WaitlistFieldErrors = Partial<
	Record<"institutionName" | "email" | "role" | "privacyAccepted", string[]>
>;

export type WaitlistParseResult =
	| { ok: true; data: WaitlistFields }
	| { ok: true; discarded: true }
	| { ok: false; fields: WaitlistFieldErrors };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INSTITUTION_MAX = 120;

function isWaitlistRole(value: string): value is WaitlistRole {
	return (waitlistRoles as readonly string[]).includes(value);
}

function isPrivacyAccepted(value: string | boolean | undefined): boolean {
	return value === true || value === "on" || value === "true";
}

export function parseWaitlistFields(raw: {
	institutionName?: string;
	email?: string;
	role?: string;
	privacyAccepted?: string | boolean;
	honeypot?: string;
}): WaitlistParseResult {
	if (raw.honeypot?.trim()) {
		return { ok: true, discarded: true };
	}

	const institutionName = raw.institutionName?.trim() ?? "";
	const email = raw.email?.trim().toLowerCase() ?? "";
	const role = raw.role?.trim() ?? "";
	const fields: WaitlistFieldErrors = {};

	if (institutionName.length < 2 || institutionName.length > INSTITUTION_MAX) {
		fields.institutionName = ["Escribe el nombre del colegio."];
	}

	if (!EMAIL_PATTERN.test(email)) {
		fields.email = ["Escribe un correo válido."];
	}

	if (!isWaitlistRole(role)) {
		fields.role = ["Elige un cargo."];
	}

	if (!isPrivacyAccepted(raw.privacyAccepted)) {
		fields.privacyAccepted = ["Debes aceptar la política de privacidad."];
	}

	if (Object.keys(fields).length > 0) {
		return { ok: false, fields };
	}

	return {
		ok: true,
		data: {
			institutionName,
			email,
			role: role as WaitlistRole,
		},
	};
}

export function isUniqueViolation(error: unknown): boolean {
	let current: unknown = error;

	while (current) {
		if (
			typeof current === "object" &&
			current !== null &&
			"code" in current &&
			current.code === "23505"
		) {
			return true;
		}

		current = current instanceof Error ? current.cause : undefined;
	}

	return false;
}

export const waitlistRoleLabels: Record<WaitlistRole, string> = {
	director: "Director/a",
	owner: "Dueño/a o socio",
	admin: "Administración",
	other: "Otro",
};

export function formDataToWaitlistRaw(formData: FormData) {
	const read = (name: string) => {
		const value = formData.get(name);
		return typeof value === "string" ? value : undefined;
	};

	return {
		institutionName: read("institutionName"),
		email: read("email"),
		role: read("role"),
		privacyAccepted: read("privacyAccepted"),
		honeypot: read("companyWebsite"),
	};
}
