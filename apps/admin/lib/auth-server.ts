import type { AuthorizedSchoolContext } from "@aulara/auth/types";

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

export type { AuthorizedSchoolContext };
