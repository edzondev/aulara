export const globalRoles = ["user", "admin"] as const;
export type GlobalRole = (typeof globalRoles)[number];

export const organizationRoles = ["owner", "admin", "member"] as const;
export type OrganizationRole = (typeof organizationRoles)[number];

/**
 * Returns the effective global role from a potentially comma-separated value.
 * If "admin" appears as one of the roles, "admin" is returned; otherwise "user".
 */
export function getGlobalRole(role: string | null | undefined): GlobalRole {
	const roles = role?.split(",").map((r) => r.trim()) ?? [];
	return roles.includes("admin") ? "admin" : "user";
}

/**
 * Parses a comma-separated organization role value into an array of valid roles.
 * Returns `null` if any role is unknown or if the input is empty.
 */
export function parseOrganizationRoles(
	role: string | null | undefined,
): OrganizationRole[] | null {
	const rawRoles =
		role
			?.split(",")
			.map((r) => r.trim())
			.filter(Boolean) ?? [];

	if (rawRoles.length === 0) {
		return null;
	}

	const parsed = rawRoles.map((r) =>
		organizationRoles.includes(r as OrganizationRole)
			? (r as OrganizationRole)
			: null,
	);

	if (parsed.some((r) => r === null)) {
		return null;
	}

	return parsed as OrganizationRole[];
}

export function hasOrganizationRole(
	role: string | null | undefined,
	wanted: OrganizationRole,
): boolean {
	return parseOrganizationRoles(role)?.includes(wanted) === true;
}
