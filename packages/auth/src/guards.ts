import { AuthContextError, authContextErrorCodes } from "./errors.ts";
import { type GlobalRole, getGlobalRole } from "./permissions.ts";
import { auth } from "./server.ts";

export type AuthenticatedSession = NonNullable<
	Awaited<ReturnType<typeof auth.api.getSession>>
>;

export type AuthenticatedUser = {
	email: string;
	id: string;
	name: string;
	role: GlobalRole;
};

export type ActiveOrganizationSession = AuthenticatedSession & {
	session: AuthenticatedSession["session"] & {
		activeOrganizationId: string;
	};
};

async function requireSession(headers: Headers): Promise<AuthenticatedSession> {
	const session = await auth.api.getSession({ headers });

	if (!session) {
		throw new AuthContextError(
			authContextErrorCodes.authenticationRequired,
			"An authenticated session is required",
			401,
		);
	}

	return session;
}

export async function requireAuthenticatedUser(
	headers: Headers,
): Promise<AuthenticatedUser> {
	const { user } = await requireSession(headers);

	return {
		email: user.email,
		id: user.id,
		name: user.name,
		role: getGlobalRole(user.role),
	};
}

export async function requireGlobalAdmin(
	headers: Headers,
): Promise<AuthenticatedUser & { role: "admin" }> {
	const user = await requireAuthenticatedUser(headers);

	if (user.role !== "admin") {
		throw new AuthContextError(
			authContextErrorCodes.globalAdminRequired,
			"A global administrator session is required",
			403,
		);
	}

	return { ...user, role: "admin" };
}

export async function requireActiveOrganization(
	headers: Headers,
): Promise<ActiveOrganizationSession> {
	const session = await requireSession(headers);
	const activeOrganizationId = session.session.activeOrganizationId;

	if (!activeOrganizationId) {
		throw new AuthContextError(
			authContextErrorCodes.activeOrganizationRequired,
			"An active organization is required",
			403,
		);
	}

	return {
		...session,
		session: {
			...session.session,
			activeOrganizationId,
		},
	};
}
