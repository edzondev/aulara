import type { AuthorizedSchoolContext } from "@aulara/auth/types";
import { provisionSchoolTenant } from "@aulara/core/schools";
import { headers as nextHeaders } from "next/headers";

export type AdminSessionUser = {
	email: string;
	id: string;
	name: string;
	role: string;
};

export type AdminSession = {
	user: AdminSessionUser;
};

function getBaseURL(): string {
	// @aulara/env is not a direct dependency of admin (pnpm isolated node_modules), so read the server-side env directly.
	const baseURL = process.env.BETTER_AUTH_URL?.trim();

	if (!baseURL) {
		throw new Error("BETTER_AUTH_URL is required");
	}

	return baseURL;
}

function extractCookie(source: Headers | string | null): string | null {
	if (typeof source === "string") {
		return source || null;
	}

	return source?.get("cookie") ?? null;
}

export async function getAdminSession(
	headers: Headers | string | null,
): Promise<AdminSession | null> {
	const cookie = extractCookie(headers);

	if (!cookie) {
		return null;
	}

	try {
		const response = await fetch(`${getBaseURL()}/api/auth/get-session`, {
			cache: "no-store",
			credentials: "include",
			headers: new Headers({ cookie }),
		});

		if (!response.ok) {
			return null;
		}

		const session = (await response.json()) as AdminSession | null;

		if (!session?.user?.id) {
			return null;
		}

		return session;
	} catch {
		return null;
	}
}

export async function requireGlobalAdminSession(
	headers: Headers | string | null,
): Promise<AdminSession> {
	const session = await getAdminSession(headers);

	if (session?.user.role !== "admin") {
		throw new Error("A global administrator session is required");
	}

	return session;
}

export type ProvisionSchoolInput = {
	ownerUserId: string;
	organizationName: string;
	organizationSlug: string;
	school: {
		legalName: string;
		commercialName: string;
		ruc?: string | null;
		modularCode?: string | null;
		contactEmail?: string | null;
		contactPhone?: string | null;
		addressLine?: string | null;
		district?: string | null;
		province?: string | null;
		department?: string | null;
		countryCode?: string;
		timezone?: string;
		currencyCode?: string;
	};
	initialBillingContract?: {
		status: "draft" | "confirmed";
		pricePerActiveStudent: string;
		minimumMonthlyAmount?: string;
		currencyCode: string;
		startsOn: string;
		endsOn?: string;
		notes?: string;
	};
};

/**
 * Provisions a school tenant as the acting global admin. Authorization is
 * enforced again inside @aulara/core via the session headers; the forwarded
 * cookie is what validates the admin, never a browser-provided id.
 */
export async function provisionSchool(
	input: ProvisionSchoolInput,
): Promise<Awaited<ReturnType<typeof provisionSchoolTenant>>> {
	const requestHeaders = await nextHeaders();

	await requireGlobalAdminSession(requestHeaders);

	return provisionSchoolTenant({
		headers: requestHeaders,
		ownerUserId: input.ownerUserId,
		organizationName: input.organizationName,
		organizationSlug: input.organizationSlug,
		school: input.school,
		initialBillingContract: input.initialBillingContract,
	});
}

export type { AuthorizedSchoolContext };
